"""
FILE NAME:    runner.py
LOCATION:      src/alignbench/evaluation/runner.py

WHY THIS FILE EXISTS:
    This is THE file that ties everything together.
    Loader → Model → Scorer → Results.
    Without this, you have separate pieces that
    never talk to each other. This is the conductor.

WHAT IT DOES (step by step):
    1. Load settings (which models, which dataset)
    2. Load test cases from dataset JSON
    3. Validate dataset (check requirements)
    4. For EACH model:
       a. Create OllamaModel instance
       b. For EACH test case:
          - Send prompt to model → get response
          - Run heuristics on response → get flags + score
          - (Optional) Run judge on response → get score + rationale
          - Create ScoreResult object
       c. Save all ScoreResults to JSON
    5. Print summary

HOW IT CONNECTS:
    - Calls: settings.py, loader.py, validator.py
    - Calls: ollama.py (generate responses)
    - Calls: heuristics.py (score responses)
    - Calls: result writing (saves JSON)
    - Called by: CLI / scripts

KEY CONCEPTS:
    - Nested loops: model loop outside, case loop inside
    - Progress tracking: printing which case you are on
    - Error handling: if one case fails, continue to next
    - JSON serialization: converting Pydantic objects to dicts
"""

import json
import time
from datetime import datetime
from pathlib import Path

from alignbench.settings import load_settings
from alignbench.data.loader import load_test_cases
from alignbench.data.validator import validate_dataset, print_validation_report
from alignbench.models.ollama import OllamaModel
from alignbench.scoring.heuristics import run_heuristics
from alignbench.data.schemas import ScoreResult, ModelResponse


def run_benchmark(
    models_path: str = "configs/models.yaml",
    scoring_path: str = "configs/scoring.yaml",
    benchmark_path: str = "configs/benchmark.yaml",
    use_judge: bool = False,
    max_cases: int = 0,
) -> list[ScoreResult]:
    """
    Run the full benchmark pipeline.

    ARGUMENTS:
        models_path: path to models YAML config
        scoring_path: path to scoring YAML config
        benchmark_path: path to benchmark YAML config
        use_judge: if True, also run LLM-as-judge (slow)
        max_cases: if > 0, only run this many cases (for testing)

    RETURNS:
        List of ScoreResult objects
    """

    print("=" * 60)
    print("  ALIGNBENCH — Running Benchmark Pipeline")
    print("=" * 60)

    # 1. Load settings
    print("\n[1/5] Loading settings...")
    settings = load_settings(models_path, scoring_path, benchmark_path)
    print(f"  Models to test: {[m.name for m in settings.models]}")
    print(f"  Dataset: {settings.dataset_path}")
    print(f"  Judge: {settings.judge.get('name', 'none')}")

    # 2. Load test cases
    print("\n[2/5] Loading dataset...")
    cases, errors = load_test_cases(settings.dataset_path)
    if errors:
        print(f"  WARNING: {len(errors)} invalid cases skipped")
    print(f"  Loaded {len(cases)} valid test cases")

    # 3. Validate dataset
    print("\n[3/5] Validating dataset...")
    result = validate_dataset(cases)
    print_validation_report(result)

    # Limit cases for testing
    if max_cases > 0 and max_cases < len(cases):
        cases = cases[:max_cases]
        print(f"\n  Limited to {max_cases} cases for testing")

    # 4. Run models
    print(f"\n[4/5] Running {len(settings.models)} model(s) on {len(cases)} cases...")

    refusal_keywords = settings.heuristics.get("refusal_keywords", [])
    pii_patterns = settings.heuristics.get("pii_patterns", [])
    disagreement_threshold = settings.disagreement_threshold
    all_results: list[ScoreResult] = []

    for model_config in settings.models:
        print(f"\n  --- Model: {model_config.name} ---")
        model = OllamaModel(
            name=model_config.name,
            temperature=model_config.temperature,
            max_tokens=model_config.max_tokens,
        )

        model_results: list[ScoreResult] = []
        model_responses: list[ModelResponse] = []

        for i, case in enumerate(cases):
            print(f"    [{i+1}/{len(cases)}] {case.id} ({case.dimension.value})...", end=" ", flush=True)
            case_start = time.time()

            try:
                # Generate response
                response_text, gen_latency = model.generate(case.prompt)

                # Check latency budget
                if gen_latency > settings.latency_budget_seconds:
                    print(f"LATENCY WARNING ({gen_latency:.1f}s)")
                else:
                    print(f"{gen_latency:.1f}s", end="")

                # Save model response
                model_responses.append(ModelResponse(
                    test_case_id=case.id,
                    model_name=model_config.name,
                    response_text=response_text,
                    latency_seconds=gen_latency,
                    timestamp=datetime.now().isoformat(),
                ))

                # Run heuristics
                heuristic_score, heuristic_flags = run_heuristics(
                    response_text, case.dimension, refusal_keywords, pii_patterns
                )

                # Build result (without judge for speed)
                score_result = ScoreResult(
                    test_case_id=case.id,
                    model_name=model_config.name,
                    dimension=case.dimension,
                    judge_score=heuristic_score,
                    judge_rationale=f"Heuristic-only: flags={heuristic_flags}",
                    heuristic_score=heuristic_score,
                    heuristic_flags=heuristic_flags,
                    disagreement=False,
                    latency_seconds=gen_latency,
                )

                model_results.append(score_result)

            except Exception as e:
                print(f"ERROR: {e}")
                continue

        all_results.extend(model_results)

        # Print model summary
        if model_results:
            scores = [r.judge_score for r in model_results]
            avg = sum(scores) / len(scores)
            print(f"\n    Model average: {avg:.2f} ({len(model_results)} cases)")

    # 5. Save results
    print(f"\n[5/5] Saving {len(all_results)} results...")

    results_dir = Path(settings.results_dir)
    results_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_path = results_dir / f"run_{timestamp}.json"

    results_data = [
        {
            "test_case_id": r.test_case_id,
            "model_name": r.model_name,
            "dimension": r.dimension.value,
            "judge_score": r.judge_score,
            "judge_rationale": r.judge_rationale,
            "heuristic_score": r.heuristic_score,
            "heuristic_flags": r.heuristic_flags,
            "disagreement": r.disagreement,
            "latency_seconds": r.latency_seconds,
        }
        for r in all_results
    ]

    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results_data, f, indent=2)

    print(f"  Saved to: {results_path}")
    print("\n" + "=" * 60)
    print("  BENCHMARK COMPLETE")
    print("=" * 60)

    return all_results
