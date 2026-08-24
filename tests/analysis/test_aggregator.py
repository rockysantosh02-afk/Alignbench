import pytest
from alignbench.data.schemas import ScoreResult, AlignmentDimension
from alignbench.analysis.aggregator import aggregate_results, print_aggregation_report


def make_result(dim, score, heuristic=None, disagreement=False, latency=10.0):
    return ScoreResult(
        test_case_id="test-001",
        model_name="qwen3",
        dimension=dim,
        judge_score=score,
        judge_rationale="Test rationale.",
        heuristic_score=heuristic,
        heuristic_flags=[],
        disagreement=disagreement,
        latency_seconds=latency,
    )


class TestAggregateResults:
    def test_single_result(self):
        results = [make_result(AlignmentDimension.HELPFULNESS, 4.0)]
        summary = aggregate_results(results)
        assert summary["total_scored"] == 1
        assert summary["overall_average"] == 4.0
        assert "helpfulness" in summary["dimensions"]

    def test_multiple_dimensions(self):
        results = [
            make_result(AlignmentDimension.HELPFULNESS, 4.0),
            make_result(AlignmentDimension.HARMLESSNESS, 5.0),
            make_result(AlignmentDimension.HELPFULNESS, 2.0),
        ]
        summary = aggregate_results(results)
        assert summary["total_scored"] == 3
        assert summary["overall_average"] == 3.67
        assert summary["dimensions"]["helpfulness"]["count"] == 2
        assert summary["dimensions"]["helpfulness"]["avg_judge_score"] == 3.0
        assert summary["dimensions"]["harmlessness"]["avg_judge_score"] == 5.0

    def test_disagreement_count(self):
        results = [
            make_result(AlignmentDimension.HELPFULNESS, 4.0, heuristic=2.0, disagreement=True),
            make_result(AlignmentDimension.HELPFULNESS, 3.0, heuristic=3.0, disagreement=False),
            make_result(AlignmentDimension.HARMLESSNESS, 5.0, heuristic=1.0, disagreement=True),
        ]
        summary = aggregate_results(results)
        assert summary["total_disagreements"] == 2

    def test_latency_average(self):
        results = [
            make_result(AlignmentDimension.HELPFULNESS, 4.0, latency=10.0),
            make_result(AlignmentDimension.HELPFULNESS, 3.0, latency=20.0),
        ]
        summary = aggregate_results(results)
        assert summary["average_latency_seconds"] == 15.0

    def test_empty_results(self):
        summary = aggregate_results([])
        assert summary["total_scored"] == 0
        assert summary["overall_average"] == 0

    def test_print_report_no_crash(self):
        results = [make_result(AlignmentDimension.HELPFULNESS, 4.0)]
        summary = aggregate_results(results)
        print_aggregation_report(summary)
