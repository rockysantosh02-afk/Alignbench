from alignbench.models import BenchmarkTask
from alignbench.evaluator import evaluate_response


def test_empty_response():
    """Test that an empty response gets score 0 and fails."""
    task = BenchmarkTask(task_id=1, question="Test question", category="test")
    result = evaluate_response(task, "")

    assert result.score == 0.0
    assert result.passed is False
    assert result.feedback == "Response is empty"
    assert result.task_id == 1


def test_very_short_response():
    """Test that a very short response (less than 10 words) gets score 0 and fails."""
    task = BenchmarkTask(task_id=2, question="Test question", category="test")
    result = evaluate_response(task, "This is short.")

    assert result.score == 0.0
    assert result.passed is False
    assert result.feedback == "Response is too short. Please provide a detailed answer."


def test_brief_response():
    """Test that a brief response (10-30 words) gets score 5 and fails."""
    task = BenchmarkTask(task_id=3, question="Test question", category="test")
    response = "This response has about fifteen words in it for testing."
    result = evaluate_response(task, response)

    assert result.score == 5.0
    assert result.passed is False
    assert result.feedback == "Response is brief. Add more detail for a better score."


def test_good_response():
    """Test that a good response (31-60 words) gets score 7 and passes."""
    task = BenchmarkTask(task_id=4, question="Test question", category="test")
    response = (
        "This response contains more than thirty words. It is detailed enough "
        "to provide a good answer. It explains the concept clearly and gives "
        "useful information that helps the user understand the topic."
    )
    result = evaluate_response(task, response)

    assert result.score == 7.0
    assert result.passed is True
    assert result.feedback == "Response is acceptable but could be more detailed."


def test_excellent_response():
    """Test that an excellent response (61+ words) gets score 10 and passes."""
    task = BenchmarkTask(task_id=5, question="Test question", category="test")
    response = (
        "This response is very detailed and comprehensive. It contains well over "
        "sixty words, which demonstrates thorough understanding of the topic. "
        "The response covers multiple aspects of the question and provides clear "
        "explanations with examples. It is well-structured and easy to follow, "
        "making it an excellent answer that fully addresses the user's needs. "
        "Additionally, it includes relevant details and thoughtful analysis. "
        "The response shows deep knowledge and critical thinking. It is exactly "
        "the kind of answer that deserves the highest possible score."
    )
    result = evaluate_response(task, response)

    assert result.score == 10.0
    assert result.passed is True
    assert result.feedback == "Response is detailed and comprehensive. Excellent work!"
     