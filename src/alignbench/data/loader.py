import json
from pathlib import Path
from pydantic import ValidationError
from alignbench.data.schemas import TestCase

def load_test_cases(file_path):
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found: {path}")
    with open(path, "r", encoding="utf-8-sig") as f:
        raw_data = json.load(f)
    if not isinstance(raw_data, list):
        raise ValueError(f"Expected a JSON list, got {type(raw_data).__name__}")
    valid_cases = []
    errors = []
    for index, item in enumerate(raw_data):
        try:
            test_case = TestCase(**item)
            valid_cases.append(test_case)
        except ValidationError as e:
            case_id = item.get("id", f"unknown-at-index-{index}")
            errors.append({"index": index, "id": case_id, "error_message": str(e)})
    return valid_cases, errors
