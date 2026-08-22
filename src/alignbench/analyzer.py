from alignbench.models import EvaluationResult
def analyze_results(
        results: list [EvaluationResult],
) ->dict:
    total_tasks =len(results)
    
    passed_tasks =sum(
        1 for result in results if result.passed
    )
    failed_tasks =total_tasks - passed_tasks
    return {
        "total_tasks": total_tasks,
        "passed_tasks": passed_tasks,
        "failed_tasks": failed_tasks,
    }