import json 
from pathlib import Path
 
from alignbench.models import BenchmarkTask
from alignbench.validation import validate_tasks
 
def load_tasks(file_path: Path) -> list[BenchmarkTask]:
    with file_path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    tasks =[
        BenchmarkTask(
            task_id =item["task_id"],
            question=item["question"],
            category=item["category"],
        )
        for item in data

    ]
    return tasks
if __name__=="__main__":
    data_path = Path("datasets/tasks.json")
    tasks =load_tasks(data_path)
    errors = validate_tasks(tasks)
    print("Loaded tasks:", len(tasks))
    if errors:
        print("Dataset validation errors:")
        for task_id, task_errors in errors.items():
            print(f"\nTask {task_id}:")
            for error in task_errors:
                print(f"- {error}")
    else:
        print("Dataset is valid.")
     