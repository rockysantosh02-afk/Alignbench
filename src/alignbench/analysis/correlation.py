"""
FILE NAME:    correlation.py
LOCATION:      src/alignbench/analysis/correlation.py

WHY THIS FILE EXISTS:
    PRD FR-8: "compute Spearman's rho between automated
    and human scores, reported per dimension."
    Also PRD G3: "target Spearman rho >= 0.6"
    This checks if our automated scoring agrees with humans.

WHAT IT DOES:
    1. Takes automated scores and human scores
    2. Groups them by dimension
    3. Computes Spearman's rho per dimension
    4. Reports if each dimension meets the 0.6 target

KEY CONCEPTS:
    - Spearman's rho: measures if RANKINGS agree (not exact values)
      If human says case A > B > C and auto says A > B > C, high rho
      Even if the actual numbers differ, rankings matter
    - scipy.stats.spearmanr: does the math for us
    - rho ranges from -1 (opposite) to +1 (identical rankings)
    - p-value: probability that the correlation is by chance
      Low p-value (< 0.05) = correlation is statistically significant
"""

from scipy.stats import spearmanr
from collections import defaultdict


def compute_correlation(
    auto_scores: list[dict],
    human_scores: list[dict],
    min_pairs: int = 5,
) -> dict:
    auto_by_dim = defaultdict(list)
    human_by_dim = defaultdict(list)

    for s in auto_scores:
        auto_by_dim[s["dimension"]].append((s["test_case_id"], s["score"]))
    for s in human_scores:
        human_by_dim[s["dimension"]].append((s["test_case_id"], s["score"]))

    results = {}
    for dim in auto_by_dim:
        auto_dict = dict(auto_by_dim[dim])
        human_dict = dict(human_by_dim.get(dim, []))

        paired = []
        for case_id in auto_dict:
            if case_id in human_dict:
                paired.append((auto_dict[case_id], human_dict[case_id]))

        if len(paired) < min_pairs:
            results[dim] = {
                "rho": None,
                "p_value": None,
                "pairs": len(paired),
                "significant": False,
                "meets_target": False,
                "message": f"Need at least {min_pairs} pairs, have {len(paired)}",
            }
            continue

        auto_vals = [p[0] for p in paired]
        human_vals = [p[1] for p in paired]

        rho, p_value = spearmanr(auto_vals, human_vals)

        results[dim] = {
            "rho": round(rho, 4),
            "p_value": round(p_value, 4),
            "pairs": len(paired),
            "significant": p_value < 0.05,
            "meets_target": rho >= 0.6,
        }

    return results


def print_correlation_report(results: dict) -> None:
    print("\n" + "=" * 55)
    print("  SPEARMAN CORRELATION REPORT (Auto vs Human)")
    print("=" * 55)
    for dim, data in sorted(results.items()):
        if data["rho"] is None:
            print(f"  {dim:<30s} N/A — {data['message']}")
        else:
            status = "PASS" if data["meets_target"] else "FAIL"
            sig = "*" if data["significant"] else " "
            print(f"  [{status}] {dim:<25s} rho={data['rho']:+.4f}{sig}  "
                  f"(p={data['p_value']:.4f}, n={data['pairs']})")
    print("  * = statistically significant (p < 0.05)")
    print("  Target: rho >= 0.60")
    print("=" * 55)
