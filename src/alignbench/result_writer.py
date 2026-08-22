import json 
from pathlib import Path
from alignbench.models import EvaluationResult
def save_results(
        results: list[EvaluationResult],
        path: Path,
    ) ->None:
        data =[]
        for result in results:
            data.append(
                {
                "task_id":result.task_id,
                "score": result.score,
                "passed": result.passed,
                "feedback": result.feedback,
             }
            )
        with path.open("w",encoding="utf-8") as file:
              json.dump(data,file,indent=4)