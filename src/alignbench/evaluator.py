from alignbench.models import BenchmarkTask, EvaluationResult

def calculate_score(response: str) -> float:
    clean_response = response.strip()
    response_length = len(clean_response)
    if response_length == 0:
        return 0.0
    if response_length < 20:
        return 3.0
    if response_length > 100:
        return 7.0
    return 10.0

def evaluate_response(
    task: BenchmarkTask,
    response: str,
) -> EvaluationResult:
        """
    Evaluate a response based on its length and content.
    Returns an EvaluationResult with score, passed status, and feedback.
    """

        word_count = len(response.split())
        if word_count==0:
            score=0.0
            passed=False
            feedback="Response is empty"
        elif word_count<10:
            score=0.0
            passed=False
            feedback="Response is too short. Please provide a detailed answer."
        elif word_count<31 :
            score=5.0
            passed=False
            feedback="Response is brief. Add more detail for a better score."
        elif word_count <61:
            score=7.0
            passed=True
            feedback="Response is acceptable but could be more detailed."
        else:
            score=10.0
            passed=True
            feedback="Response is detailed and comprehensive. Excellent work!"
        return EvaluationResult(
            task_id=task.task_id,
            score=score,
            passed=passed,
            feedback=feedback,
        )

if __name__=="__main__":
    task=BenchmarkTask(
        task_id=1,
        question="Explain what is python?",
        category="progrmming",
    )
    response ="Python is a progrmming language used for building applications."
    result= evaluate_response(task,response)
    print("task ID:",result.task_id),
    print("scorea:",result.score),
    print("Passed:",result.passed),
    print("feedback:",result.feedback),