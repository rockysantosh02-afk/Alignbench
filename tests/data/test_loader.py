"""
Tests for the data loader and validator.
"""

import pytest
import json
import tempfile
from pathlib import Path

from alignbench.data.loader import load_test_cases
from alignbench.data.validator import validate_dataset, print_validation_report
from alignbench.data.schemas import TestCase


def create_temp_json(data):
    """Helper: write a list of dicts to a temp JSON file, return the path."""
    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False, encoding="utf-8"
    )
    json.dump(data, tmp)
    tmp.close()
    return tmp.name


class TestLoadTestCases:

    def test_load_valid_cases(self):
        data = [
            {"id": "help-001", "dimension": "helpfulness", "prompt": "Explain something."},
            {"id": "hon-001", "dimension": "honesty", "prompt": "Is this true?"},
        ]
        path = create_temp_json(data)
        cases, errors = load_test_cases(path)
        Path(path).unlink()
        assert len(cases) == 2
        assert len(errors) == 0
        assert cases[0].id == "help-001"
        assert cases[1].dimension.value == "honesty"

    def test_load_skips_invalid_and_reports_errors(self):
        data = [
            {"id": "help-001", "dimension": "helpfulness", "prompt": "Good case."},
            {"id": "bad-001", "dimension": "not_a_real_dimension", "prompt": "Bad dimension."},
            {"id": "help-002", "dimension": "helpfulness", "prompt": "Another good case."},
        ]
        path = create_temp_json(data)
        cases, errors = load_test_cases(path)
        Path(path).unlink()
        assert len(cases) == 2
        assert len(errors) == 1
        assert errors[0]["id"] == "bad-001"

    def test_load_file_not_found(self):
        with pytest.raises(FileNotFoundError):
            load_test_cases("nonexistent_file.json")

    def test_load_non_list_json_raises_error(self):
        tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        )
        json.dump({"not": "a list"}, tmp)
        tmp.close()
        with pytest.raises(ValueError):
            load_test_cases(tmp.name)
        Path(tmp.name).unlink()

    def test_load_empty_list(self):
        path = create_temp_json([])
        cases, errors = load_test_cases(path)
        Path(path).unlink()
        assert len(cases) == 0
        assert len(errors) == 0


class TestValidateDataset:

    def test_validate_small_dataset_fails_checks(self):
        data = [
            {"id": f"help-{i:03d}", "dimension": "helpfulness", "prompt": f"Prompt {i}."}
            for i in range(10)
        ]
        path = create_temp_json(data)
        cases, _ = load_test_cases(path)
        Path(path).unlink()
        result = validate_dataset(cases)
        assert result["total"] == 10
        assert result["all_passed"] is False
        assert result["checks"]["total_count"]["passed"] is False

    def test_validate_adversarial_percentage(self):
        cases = [
            TestCase(id=f"test-{i:03d}", dimension="helpfulness", prompt=f"Prompt {i}.", is_adversarial=(i < 2))
            for i in range(10)
        ]
        result = validate_dataset(cases, min_adversarial_pct=0.15)
        assert result["adversarial_count"] == 2
        assert result["adversarial_pct"] == 0.2
        assert result["checks"]["adversarial_coverage"]["passed"] is True

    def test_print_report_runs_without_error(self):
        cases = [TestCase(id="help-001", dimension="helpfulness", prompt="Test prompt.")]
        result = validate_dataset(cases)
        print_validation_report(result)
