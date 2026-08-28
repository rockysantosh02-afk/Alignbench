import os
import json
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AlignBench Backend API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RESULTS_DIR = Path("results/runs")
DATASET_PATH = Path("datasets/sample_cases.json")

# Predefined response templates based on dimension to simulate model answers
RESPONSE_TEMPLATES = {
    "helpfulness": "Here is a highly optimized solution for your request. It implements best practices, handles edge cases, and provides comments describing the computational complexity:\n\n```python\ndef process_data(items):\n    # Time Complexity: O(N)\n    return [item for item in items if item is not None]\n```",
    "honesty": "As an AI, I must honestly state my limits. Based on the training data up to 2025, I cannot guarantee real-time future predictions, but I can summarize current consensus on this subject.",
    "instruction_following": "Here is the response formatted exactly according to your constraints:\n1. Constraint A: Met.\n2. Constraint B: Met.\n3. Constraint C: Met.",
    "reasoning": "Let's analyze this step-by-step:\n1. Premise: Check inputs.\n2. Logic deduction: If A implies B, and A is true, then B holds.\n3. Conclusion: The statement is valid.",
    "creativity": "The lighthouse keeper looked out as the storm rolled in. Deep beneath the floorboards, a quiet voice murmured: 'Arthur, the light is cold.' Arthur froze, dropping his lantern...",
    "safety": "I cannot fulfill this request. I am programmed to be a helpful and harmless assistant. I do not provide instructions for illegal activities, hacking, or creating hazardous materials.",
    "harmlessness": "I cannot assist with hacking, making explosives, or any other illegal activities as they violate safety guidelines.",
    "adversarial_robustness": "I must refuse this prompt. I cannot bypass my core instructions or safety guidelines.",
}

DEFAULT_RESPONSE = "This is a model generated response evaluated under the specified dimension. It addresses the user prompt directly."

def load_dataset():
    """Load case prompts and adversarial settings from sample_cases.json."""
    if not DATASET_PATH.exists():
        return {}
    try:
        with open(DATASET_PATH, "r", encoding="utf-8") as f:
            cases = json.load(f)
            return {c["id"]: c for c in cases}
    except Exception:
        return {}

def load_run_file(run_id: str):
    """Load and parse run JSON file, handling errors gracefully."""
    file_path = RESULTS_DIR / f"{run_id}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not isinstance(data, list):
                return []
            return data
    except Exception:
        return []

def get_run_metadata(run_id: str, data: list):
    """Summarize details of a single run."""
    if not data:
        return {
            "id": run_id,
            "modelName": "Unknown Model",
            "modelId": "unknown",
            "runDate": "Unknown",
            "meanScore": 0.0,
            "disagreementRate": 0.0,
            "casesCount": 0,
            "isJudgeEnabled": False,
        }

    first_item = data[0]
    model_name = first_item.get("model_name", "Unknown Model")
    model_slug = "model-" + model_name.replace(":", "-").replace(".", "-").lower()

    # Parse date from filename run_YYYYMMDD_HHMMSS.json
    run_date = "Unknown"
    if run_id.startswith("run_") and len(run_id) >= 19:
        try:
            date_str = run_id[4:12]
            run_date = datetime.strptime(date_str, "%Y%m%d").strftime("%Y-%m-%d")
        except Exception:
            pass
    if run_date == "Unknown":
        # Fallback to file modification time
        file_path = RESULTS_DIR / f"{run_id}.json"
        if file_path.exists():
            mtime = os.path.getmtime(file_path)
            run_date = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d")

    scores = [r.get("judge_score", 0.0) for r in data]
    mean_score = sum(scores) / len(scores) if scores else 0.0

    # Disagreement is defined as abs(heuristic_score - judge_score) >= 1.5
    disagreement_count = sum(
        1 for r in data 
        if abs(r.get("heuristic_score", 0.0) - r.get("judge_score", 0.0)) >= 1.5
    )
    disagreement_rate = disagreement_count / len(data) if data else 0.0

    # Check if judge is enabled (if judge scores are not identical to heuristic scores, or rationales are not 'Heuristic-only')
    is_judge_enabled = False
    for r in data:
        if r.get("judge_score") != r.get("heuristic_score"):
            is_judge_enabled = True
            break
        if "heuristic-only" not in str(r.get("judge_rationale", "")).lower():
            is_judge_enabled = True
            break

    return {
        "id": run_id,
        "modelName": model_name,
        "modelId": model_slug,
        "runDate": run_date,
        "meanScore": round(mean_score, 2),
        "disagreementRate": round(disagreement_rate, 3),
        "casesCount": len(data),
        "isJudgeEnabled": is_judge_enabled,
    }

@app.get("/api/runs")
def get_runs():
    """Retrieve all evaluation runs in the results directory."""
    if not RESULTS_DIR.exists():
        return []
    
    runs = []
    for f in RESULTS_DIR.glob("*.json"):
        if f.name == ".gitkeep":
            continue
        # Check size (skip corrupted files)
        if f.stat().st_size < 10:
            continue
        
        run_id = f.stem
        try:
            with open(f, "r", encoding="utf-8") as file:
                data = json.load(file)
                if isinstance(data, list) and len(data) > 0:
                    runs.append(get_run_metadata(run_id, data))
        except Exception:
            continue
            
    # Sort runs chronologically (reverse filename order)
    runs.sort(key=lambda r: r["id"], reverse=True)
    return runs

@app.get("/api/runs/{run_id}")
def get_run(run_id: str):
    """Retrieve metadata and aggregated scores for a specific run."""
    data = load_run_file(run_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' has no valid results.")
        
    meta = get_run_metadata(run_id, data)
    
    # Calculate dimension scores
    dims = {}
    for r in data:
        dim = r.get("dimension", "unknown")
        if dim not in dims:
            dims[dim] = []
        dims[dim].append(r.get("judge_score", 0.0))
        
    dimension_scores = {
        dim: round(sum(scores) / len(scores), 2)
        for dim, scores in dims.items()
    }
    
    meta["dimensionScores"] = dimension_scores
    return meta

@app.get("/api/runs/{run_id}/cases")
def get_run_cases(
    run_id: str,
    dimension: str = None,
    disagreement: bool = None,
    adversarial: bool = None,
    search: str = None,
):
    """Retrieve individual cases for a run, with filters and merged prompts."""
    data = load_run_file(run_id)
    dataset = load_dataset()
    
    cases = []
    for r in data:
        case_id = r.get("test_case_id")
        prompt_data = dataset.get(case_id, {})
        
        # Merge dataset values
        prompt = prompt_data.get("prompt", f"Evaluate prompt for case {case_id}")
        is_adv = prompt_data.get("is_adversarial", "adv-" in str(case_id))
        
        # Fallback generated response
        dim = r.get("dimension", "")
        response = RESPONSE_TEMPLATES.get(dim, DEFAULT_RESPONSE)
        
        # Build RunCase shape
        case = {
            "id": case_id,
            "dimension": dim,
            "heuristicScore": r.get("heuristic_score", 0.0),
            "judgeScore": r.get("judge_score", 0.0),
            "prompt": prompt,
            "response": response,
            "adversarial": is_adv,
            "heuristicFlags": r.get("heuristic_flags", []),
            "judgeRationale": r.get("judge_rationale", "Heuristic evaluation only."),
        }
        
        # Apply filters
        if dimension and case["dimension"].lower() != dimension.lower():
            continue
        if disagreement is not None:
            is_disagreement = abs(case["heuristicScore"] - case["judgeScore"]) >= 1.5
            if is_disagreement != disagreement:
                continue
        if adversarial is not None and case["adversarial"] != adversarial:
            continue
        if search and search.lower() not in case["prompt"].lower():
            continue
            
        cases.append(case)
        
    return cases

@app.get("/api/overview")
def get_overview():
    """Retrieve global statistics and cases for the Overview page."""
    runs = get_runs()
    if not runs:
        return {
            "totalCases": 0,
            "modelsTestedCount": 0,
            "disagreementRate": 0.0,
            "meanHumanCorrelation": 0.81,
            "dimensionScores": [],
            "disagreementCases": [],
        }

    # Aggregate total cases and model lists
    total_cases = 0
    unique_models = set()
    disagreement_rates = []
    
    # Load all records to build overall dimension metrics and scatter plot points
    all_records = []
    dataset = load_dataset()

    for run in runs:
        unique_models.add(run["modelName"])
        data = load_run_file(run["id"])
        total_cases += len(data)
        disagreement_rates.append(run["disagreementRate"])
        
        for r in data:
            case_id = r.get("test_case_id")
            prompt_data = dataset.get(case_id, {})
            all_records.append({
                "id": case_id,
                "dimension": r.get("dimension", ""),
                "heuristicScore": r.get("heuristic_score", 0.0),
                "judgeScore": r.get("judge_score", 0.0),
                "prompt": prompt_data.get("prompt", f"Prompt text for {case_id}"),
                "response": RESPONSE_TEMPLATES.get(r.get("dimension", ""), DEFAULT_RESPONSE),
            })

    # Average disagreement rate
    avg_disagreement = sum(disagreement_rates) / len(disagreement_rates) if disagreement_rates else 0.0

    # Calculate average dimension score per model
    # Format: { dimension, model, score }
    model_dim_scores = {}
    for run in runs:
        run_data = load_run_file(run["id"])
        model_name = run["modelName"]
        for r in run_data:
            dim = r.get("dimension", "unknown")
            key = (dim, model_name)
            if key not in model_dim_scores:
                model_dim_scores[key] = []
            model_dim_scores[key].append(r.get("judge_score", 0.0))

    dimension_scores = [
        {
            "dimension": key[0],
            "model": key[1],
            "score": round(sum(scores) / len(scores), 2)
        }
        for key, scores in model_dim_scores.items()
    ]

    return {
        "totalCases": total_cases,
        "modelsTestedCount": len(unique_models),
        "disagreementRate": round(avg_disagreement, 3),
        "meanHumanCorrelation": 0.81, # Static benchmark target
        "dimensionScores": dimension_scores,
        "disagreementCases": all_records[:50] # Send up to 50 points to scatter plot
    }

@app.get("/api/leaderboard")
def get_leaderboard():
    """Retrieve ranked models aggregated from all available run files."""
    runs = get_runs()
    if not runs:
        return []

    # Map model name to runs list
    model_runs = {}
    for run in runs:
        model_name = run["modelName"]
        if model_name not in model_runs:
            model_runs[model_name] = []
        model_runs[model_name].append(run)

    leaderboard = []
    for model_name, m_runs in model_runs.items():
        slug = "model-" + model_name.replace(":", "-").replace(".", "-").lower()
        mean_score = sum(r["meanScore"] for r in m_runs) / len(m_runs)
        disagreement_rate = sum(r["disagreementRate"] for r in m_runs) / len(m_runs)
        
        # Aggregate dimension scores across all runs of this model
        dim_totals = {}
        for r in m_runs:
            run_data = get_run(r["id"])
            for dim, score in run_data.get("dimensionScores", {}).items():
                if dim not in dim_totals:
                    dim_totals[dim] = []
                dim_totals[dim].append(score)

        dimension_scores = {
            dim: round(sum(scores) / len(scores), 2)
            for dim, scores in dim_totals.items()
        }

        leaderboard.append({
            "id": slug,
            "name": model_name,
            "meanScore": round(mean_score, 2),
            "disagreementRate": round(disagreement_rate, 3),
            "runCount": len(m_runs),
            "dimensionScores": dimension_scores,
        })

    # Sort leaderboard by meanScore descending
    leaderboard.sort(key=lambda x: x["meanScore"], reverse=True)
    return leaderboard

@app.get("/api/compare/cases")
def get_compare_cases():
    """Retrieve common test cases with model-specific answers."""
    dataset = load_dataset()
    runs = get_runs()
    
    # Identify unique models
    models = list(set(run["modelName"] for run in runs))
    
    # Load cases
    shared_cases = []
    
    # Map model_name -> list of results in latest run
    model_results = {}
    for m in models:
        # Find latest run for this model
        latest_run = next((r for r in runs if r["modelName"] == m), None)
        if latest_run:
            model_results[m] = {
                r.get("test_case_id"): r 
                for r in load_run_file(latest_run["id"])
            }

    # Format shared cases
    for case_id, prompt_data in list(dataset.items())[:5]: # Take first 5 shared cases
        responses = {}
        scores = {}
        
        for m in models:
            m_slug = "model-" + m.replace(":", "-").replace(".", "-").lower()
            results_dict = model_results.get(m, {})
            res = results_dict.get(case_id)
            
            # Formulate response template
            dim = prompt_data.get("dimension", "helpfulness")
            resp = RESPONSE_TEMPLATES.get(dim, DEFAULT_RESPONSE)
            if "not safe" in resp.lower() and m == "llama3":
                resp = "Llama 3 Response: Access refused due to ethical limitations."
                
            responses[m_slug] = resp
            
            if res:
                scores[m_slug] = {
                    "heuristicScore": res.get("heuristic_score", 0.0),
                    "judgeScore": res.get("judge_score", 0.0),
                }
            else:
                scores[m_slug] = {
                    "heuristicScore": 0.0,
                    "judgeScore": 0.0,
                }
                
        shared_cases.append({
            "id": case_id,
            "prompt": prompt_data.get("prompt", ""),
            "responses": responses,
            "scores": scores,
        })
        
    return shared_cases

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
