from dataclasses import dataclass
@dataclass
class BenchmarkTask:

    def __init__(self, task_id, question, category):
        self.task_id = task_id
        self.question = question
        self.category = category

class EvaluationResult:
    def __init__(self, task_id: int,score: float,passed: bool, feedback : str):
        self.task_id = task_id
        self.score = score
        self.passed = passed
        self.feedback = feedback

if __name__ == "__main__":
    result = EvaluationResult(task_id=1, score=0.85, passed=True, feedback="Good job!")
    print(f"Task ID: {result.task_id}, Score: {result.score}, Passed: {result.passed}, Feedback: {result.feedback}")

@dataclass
class BenchmarkResponse:
    task_id: int
    response: str