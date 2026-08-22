from alignbench.models import BenchmarkTask
def validate_task(task: BenchmarkTask) ->list[str]:
    errors = []

    if not task.task_id:
        errors.append("Task ID is missing.")
    if not task.question:
        errors.append("Question is missing.")
    if not task.category:
        errors.append("Category is missing.")
    return errors
 
def validate_tasks(tasks:list[BenchmarkTask]) -> list[str]:
        errors=[]
        for task in tasks:
            task_errors = validate_task(task)
            if task_errors:
                 errors.extend(
                      [
                        f"Task ID {task.task_id}: {error}" 
                        for error in task_errors
                      ]
                 )
    
            return errors
 