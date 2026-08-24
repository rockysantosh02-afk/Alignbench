from alignbench.models import EvaluationResult

def analyze_results(
    results: list[EvaluationResult],
) -> dict:
    total_tasks = len(results)

    passed_tasks = sum(
        1 for result in results if result.passed
    )

    failed_tasks = total_tasks - passed_tasks

    total_score = sum(
        result.score for result in results
    )

    if total_tasks > 0:
        pass_rate = (passed_tasks / total_tasks) * 100
        average_score = total_score / total_tasks

        highest_score = max(
            result.score for result in results
        )

        lowest_score = min(
            result.score for result in results
        )
    else:
        pass_rate = 0.0
        average_score = 0.0
        highest_score = 0.0
        lowest_score = 0.0

    return {
        "total_tasks": total_tasks,
        "passed_tasks": passed_tasks,
        "failed_tasks": failed_tasks,
        "pass_rate": pass_rate,
        "average_score": average_score,
        "highest_score": highest_score,
        "lowest_score": lowest_score,
    }