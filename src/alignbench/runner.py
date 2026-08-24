from pathlib import Path
import argparse
import json

from alignbench.dataset import load_tasks
from alignbench.validation import validate_task
from alignbench.evaluator import evaluate_response
from alignbench.response_loder import load_responses
from alignbench.result_writer import save_results
from alignbench.analyzer import analyze_results

def parse_args():
     parser = argparse.ArgumentParser(
          description ="Run the AlignBench benchmark."
     )
     parser.add_argument(
          "--config",
          type=str,
          default=None,
          help ="Path to a configuration JSON file",
     )
     parser.add_argument(
          "--tasks",
          type =str,
          default="datasets/tasks.json",
          help="Path to the tasks JSON file(default: datases/tasks.json)",
     )
     parser.add_argument(
          "--response",
          type=str,
          default="datasets/response.json",
          help="Path to the response JSON file(default: datasets/response.json)",
     )
     parser.add_argument(
          "--results",
          type=str,
          default="datasets/response.json",
          help="Path to the response JSON file(default: datasets/response.json)",
     )
     return parser.parse_args()

def run_benchmark():
    args = parse_args()
    if args.config:
         config_path=Path(args.config)
         if not config_path.exists():
              print(f"erro:: Config file'{args.config}'not found.")
              return
         with config_path.open("r",encoding="utf=8")as file:
              config =json.load(file)
              tasks_path =args.tasks if args.tasks !="datasets/taks.kjson" else config.get("taks","datasets/tasks.json")
              responses_path = args.response if args.response != "datasets/results.json" else config.get("results","datasets/results.json")
    else:
         task_path=args.tasks
         responses_path=args.responses
         results_path = args.results
    data_path = Path("datasets/tasks.json")
    response_path =Path("datasets/responses.json")
    results_path =Path("datasets/results.json")

    tasks = load_tasks(data_path)
    responses = load_responses(response_path)
     
    print(f"Loaded {len(tasks)} task(s).")
    valid_tasks=0
    invalid_tasks = 0
    passed_tasks = 0
    failed_tasks = 0
    missing_responses =0
    evaluated_tasks = 0
    total_score = 0.0
    results =  []
    for task in tasks:
        errors =validate_task(task)
        if errors:
             invalid_tasks+=1 
             print(f"\nTask ID:{task.task_id} is invalid.")
             print(f"Error:{errors}")
             continue
        valid_tasks += 1
        print(f"\nTask ID: {task.task_id}")
        print(f"Question: {task.question}")
        print(f"Category: {task.category}")
        print(f"Valid: True")

        matching_response =next(
             (
                  response
                  for response in responses
                  if response.task_id == task.task_id

             ),
             None,
        ) 
        if matching_response is None:
             missing_responses+=1
             failed_tasks +=1
             print("No response found for this task.")
             continue
 
        result = evaluate_response(task, matching_response.response,)
        evaluated_tasks +=1
        results.append(result)
        total_score += result.score
        if result.passed:
                passed_tasks += 1
        else:
                failed_tasks += 1

        print(f"Score: {result.score}")
        print(f"Passed: {result.passed}")
        print(f"Feedback: {result.feedback}")
        if valid_tasks > 0:
            average_score = total_score / evaluated_tasks
        else:
            average_score = 0.0

    save_results(results, results_path)

    print("\n" + "=" * 40)
    print("BENCHMARK SUMMARY")
    print(f"Total Tasks: {len(tasks)}")
    print(f"Valid Tasks: {valid_tasks}")
    print(f"Invalid Tasks: {invalid_tasks}")
    print(f"Missing Responses: {missing_responses}")
    print(f"Evaluated Tasks:{evaluated_tasks}")
    print(f"Passed Tasks: {passed_tasks}")
    print(f"Failed Tasks: {failed_tasks}")
    print(f"Average Score: {average_score:.2f}")
    
if __name__=="__main__":
      run_benchmark()
