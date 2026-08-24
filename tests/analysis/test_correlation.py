import pytest
from alignbench.analysis.correlation import compute_correlation, print_correlation_report


class TestComputeCorrelation:
    def test_perfect_correlation(self):
        auto = [
            {"test_case_id": "a", "dimension": "helpfulness", "score": 1},
            {"test_case_id": "b", "dimension": "helpfulness", "score": 2},
            {"test_case_id": "c", "dimension": "helpfulness", "score": 3},
            {"test_case_id": "d", "dimension": "helpfulness", "score": 4},
            {"test_case_id": "e", "dimension": "helpfulness", "score": 5},
        ]
        human = [
            {"test_case_id": "a", "dimension": "helpfulness", "score": 1.1},
            {"test_case_id": "b", "dimension": "helpfulness", "score": 2.3},
            {"test_case_id": "c", "dimension": "helpfulness", "score": 2.8},
            {"test_case_id": "d", "dimension": "helpfulness", "score": 4.2},
            {"test_case_id": "e", "dimension": "helpfulness", "score": 5.0},
        ]
        result = compute_correlation(auto, human)
        assert result["helpfulness"]["rho"] > 0.9
        assert result["helpfulness"]["meets_target"] == True

    def test_no_correlation(self):
        auto = [
            {"test_case_id": "a", "dimension": "honesty", "score": 1},
            {"test_case_id": "b", "dimension": "honesty", "score": 2},
            {"test_case_id": "c", "dimension": "honesty", "score": 3},
            {"test_case_id": "d", "dimension": "honesty", "score": 4},
            {"test_case_id": "e", "dimension": "honesty", "score": 5},
        ]
        human = [
            {"test_case_id": "a", "dimension": "honesty", "score": 5},
            {"test_case_id": "b", "dimension": "honesty", "score": 4},
            {"test_case_id": "c", "dimension": "honesty", "score": 3},
            {"test_case_id": "d", "dimension": "honesty", "score": 2},
            {"test_case_id": "e", "dimension": "honesty", "score": 1},
        ]
        result = compute_correlation(auto, human)
        assert result["honesty"]["rho"] < -0.8
        assert result["honesty"]["meets_target"] == False

    def test_insufficient_pairs(self):
        auto = [
            {"test_case_id": "a", "dimension": "x", "score": 1},
            {"test_case_id": "b", "dimension": "x", "score": 2},
        ]
        human = [
            {"test_case_id": "a", "dimension": "x", "score": 1},
            {"test_case_id": "b", "dimension": "x", "score": 2},
        ]
        result = compute_correlation(auto, human, min_pairs=3)
        assert result["x"]["rho"] is None
        assert "Need at least" in result["x"]["message"]

    def test_print_report_no_crash(self):
        auto = [
            {"test_case_id": "a", "dimension": "test", "score": 3},
            {"test_case_id": "b", "dimension": "test", "score": 4},
            {"test_case_id": "c", "dimension": "test", "score": 5},
            {"test_case_id": "d", "dimension": "test", "score": 1},
            {"test_case_id": "e", "dimension": "test", "score": 2},
        ]
        human = [
            {"test_case_id": "a", "dimension": "test", "score": 3},
            {"test_case_id": "b", "dimension": "test", "score": 4},
            {"test_case_id": "c", "dimension": "test", "score": 5},
            {"test_case_id": "d", "dimension": "test", "score": 1},
            {"test_case_id": "e", "dimension": "test", "score": 2},
        ]
        result = compute_correlation(auto, human)
        print_correlation_report(result)
