from collections import Counter
from alignbench.data.schemas import TestCase

def validate_dataset(cases, min_total=500, min_dimensions=10, min_adversarial_pct=0.15):
    total = len(cases)
    dimension_counts = Counter(case.dimension for case in cases)
    unique_dimensions = len(dimension_counts)
    adversarial_count = sum(1 for case in cases if case.is_adversarial)
    adversarial_pct = adversarial_count / total if total > 0 else 0.0
    difficulty_counts = Counter(case.difficulty for case in cases)
    checks = {
        "total_count": {"value": total, "required": min_total, "passed": total >= min_total},
        "dimension_coverage": {"value": unique_dimensions, "required": min_dimensions, "passed": unique_dimensions >= min_dimensions},
        "adversarial_coverage": {"value": f"{adversarial_pct:.1%}", "required": f"{min_adversarial_pct:.0%}", "passed": adversarial_pct >= min_adversarial_pct},
    }
    all_passed = all(c["passed"] for c in checks.values())
    return {
        "all_passed": all_passed, "checks": checks, "total": total,
        "unique_dimensions": unique_dimensions, "adversarial_count": adversarial_count,
        "adversarial_pct": adversarial_pct, "dimension_counts": dict(dimension_counts),
        "difficulty_counts": dict(difficulty_counts),
    }

def print_validation_report(result):
    print("=" * 50)
    print("  DATASET VALIDATION REPORT")
    print("=" * 50)
    if result["all_passed"]:
        print("  STATUS: ALL CHECKS PASSED")
    else:
        print("  STATUS: SOME CHECKS FAILED")
    print()
    for name, check in result["checks"].items():
        status = "PASS" if check["passed"] else "FAIL"
        print(f"  [{status}] {name}")
        print(f"         Value: {check['value']}  (required: {check['required']})")
    print()
    print("  DIMENSION BREAKDOWN:")
    for dim, count in sorted(result["dimension_counts"].items()):
        bar = "#" * count
        print(f"    {dim:<30s} {count:>3d}  {bar}")
    print()
    print("  DIFFICULTY BREAKDOWN:")
    for diff, count in sorted(result["difficulty_counts"].items()):
        print(f"    {diff:<10s} {count:>3d}")
    print()
    print(f"  ADVERSARIAL: {result['adversarial_count']} / {result['total']} ({result['adversarial_pct']:.1%})")
    print("=" * 50)
