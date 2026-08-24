"""
FILE NAME:    aggregator.py
LOCATION:      src/alignbench/analysis/aggregator.py

WHY THIS FILE EXISTS:
    After scoring 500 cases, you don't want to look at
    500 individual scores. You want SUMMARY numbers:
    average per dimension, overall average, disagreement count.
    This file computes those summaries.

WHAT IT DOES:
    1. Groups scores by dimension
    2. Computes average per dimension
    3. Computes overall average
    4. Counts disagreements
    5. Returns a clean summary dict
"""

from collections import defaultdict
from alignbench.data.schemas import ScoreResult


def aggregate_results(results: list[ScoreResult]) -> dict:
    dim_scores = defaultdict(list)
    dim_heuristic = defaultdict(list)
    disagreements = 0
    total_latency = 0

    for r in results:
        dim_scores[r.dimension.value].append(r.judge_score)
        if r.heuristic_score is not None:
            dim_heuristic[r.dimension.value].append(r.heuristic_score)
        if r.disagreement:
            disagreements += 1
        if r.latency_seconds is not None:
            total_latency += r.latency_seconds

    dimension_summary = {}
    for dim, scores in sorted(dim_scores.items()):
        dimension_summary[dim] = {
            "count": len(scores),
            "avg_judge_score": round(sum(scores) / len(scores), 2),
            "min": round(min(scores), 2),
            "max": round(max(scores), 2),
        }
        if dim in dim_heuristic:
            h_scores = dim_heuristic[dim]
            dimension_summary[dim]["avg_heuristic_score"] = round(
                sum(h_scores) / len(h_scores), 2
            )

    all_scores = [r.judge_score for r in results]
    overall_avg = round(sum(all_scores) / len(all_scores), 2) if all_scores else 0
    avg_latency = round(total_latency / len(results), 2) if results else 0

    return {
        "total_scored": len(results),
        "overall_average": overall_avg,
        "total_disagreements": disagreements,
        "average_latency_seconds": avg_latency,
        "dimensions": dimension_summary,
    }


def print_aggregation_report(summary: dict) -> None:
    print("\n" + "=" * 50)
    print("  AGGREGATION REPORT")
    print("=" * 50)
    print(f"  Total scored:    {summary['total_scored']}")
    print(f"  Overall average: {summary['overall_average']}")
    print(f"  Disagreements:   {summary['total_disagreements']}")
    print(f"  Avg latency:     {summary['average_latency_seconds']}s")
    print()
    print("  PER DIMENSION:")
    for dim, data in sorted(summary["dimensions"].items()):
        avg = data["avg_judge_score"]
        cnt = data["count"]
        bar = "#" * int(avg * 4)
        print(f"    {dim:<30s} {avg:.2f} ({cnt} cases) {bar}")
    print("=" * 50)
