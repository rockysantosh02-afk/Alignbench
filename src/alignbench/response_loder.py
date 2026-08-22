import json 
from pathlib import Path
from alignbench.models import BenchmarkResponse

def load_responses(path: Path) -> list[BenchmarkResponse]:
    with path.open("r", encoding="utf-8")as file:
        data= json.load(file)
    responses=[]
    for item in data :
        response =BenchmarkResponse(
            task_id=item["task_id"],
            response=item["response"],
        )
        responses.append(response)
    return responses
 
