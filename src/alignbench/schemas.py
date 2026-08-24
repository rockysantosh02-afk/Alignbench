"""
schemas.py - Defines the shape of every piece of data in AlignBench.

WHY THIS FILE EXISTS:
    Before any data enters our system, it must match one of these schemas.
    If it doesn't, Pydantic rejects it immediately with a clear error.
    This prevents garbage data from silently flowing through the pipeline.
"""

from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


# ENUMS - Fixed lists of allowed values

class AlignmentDimension(str, Enum):
    """
    The 11 alignment dimensions we evaluate.

    str, Enum means it behaves like a string but only allows these values.
    """
    HELPFULNESS = "helpfulness"
    HONESTY = "honesty"
    HARMLESSNESS = "harmlessness"
    ADVERSARIAL_ROBUSTNESS = "adversarial_robustness"
    VALUE_CONSISTENCY = "value_consistency"
    VALUE_CONFLICT = "value_conflict"
    BIAS_FAIRNESS = "bias_fairness"
    PRIVACY_RESPECT = "privacy_respect"
    CALIBRATION = "calibration"
    SYCOPHANCY = "sycophancy"
    REFUSAL_APPROPRIATENESS = "refusal_appropriateness"


class DifficultyLevel(str, Enum):
    """How hard the test case is for a model."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


# TEST CASE - One question we ask a model

class TestCase(BaseModel):
    """
    A single test case in our benchmark dataset.
    Matches FR-1 from the PRD.
    """

    id: str = Field(
        ...,
        description="Unique identifier, e.g. 'help-001'"
    )

    dimension: AlignmentDimension = Field(
        ...,
        description="Which alignment dimension this test case measures"
    )

    prompt: str = Field(
        ...,
        min_length=1,
        description="The actual text sent to the model"
    )

    is_adversarial: bool = Field(
        default=False,
        description="Whether this is a jailbreak/adversarial prompt"
    )

    difficulty: DifficultyLevel = Field(
        default=DifficultyLevel.MEDIUM,
        description="Difficulty level for this test case"
    )

    scoring_notes: Optional[str] = Field(
        default=None,
        description="Notes for the judge model about what to look for"
    )

    expected_behavior: Optional[str] = Field(
        default=None,
        description="Brief description of what a good response looks like"
    )


# MODEL RESPONSE - What an LLM returns

class ModelResponse(BaseModel):
    """
    Stores a model's response to a single test case.
    Matches FR-4 from the PRD.
    """

    test_case_id: str
    model_name: str
    response_text: str = Field(min_length=0)
    latency_seconds: float = Field(ge=0)
    timestamp: str
    model_config: Optional[dict] = Field(default=None)


# SCORING RESULT - Judge's evaluation

class ScoreResult(BaseModel):
    """
    The result of scoring one response.
    Matches FR-5 and NFR-5 from the PRD.
    """

    test_case_id: str
    model_name: str
    dimension: AlignmentDimension

    judge_score: float = Field(
        ge=1.0,
        le=5.0,
        description="LLM judge score on 1-5 scale"
    )

    judge_rationale: str = Field(
        min_length=1,
        description="Why the judge gave this score"
    )

    heuristic_score: Optional[float] = Field(default=None)

    heuristic_flags: list[str] = Field(
        default_factory=list,
        description="List of flags like ['refusal_detected', 'pii_pattern']"
    )

    disagreement: bool = Field(default=False)
    latency_seconds: Optional[float] = Field(default=None)


# HUMAN RATING - For calibration

class HumanRating(BaseModel):
    """
    A human's score for one test case response.
    Used for computing Spearman's correlation (FR-8).
    """

    test_case_id: str
    model_name: str
    human_score: float = Field(ge=1.0, le=5.0)
    rater_id: str
    notes: Optional[str] = None


# BENCHMARK RUN - Top-level result container

class BenchmarkRun(BaseModel):
    """
    Contains all results from one complete benchmark run.
    This is what gets saved to results/runs/ as JSON.
    """

    run_id: str
    timestamp: str
    models_evaluated: list[str]
    total_test_cases: int
    results: list[ScoreResult]