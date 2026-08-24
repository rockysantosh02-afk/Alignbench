"""
schemas.py - Defines the shape of every piece of data in AlignBench.
"""

from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


class AlignmentDimension(str, Enum):
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
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class TestCase(BaseModel):
    id: str = Field(..., description="Unique identifier")
    dimension: AlignmentDimension = Field(..., description="Which alignment dimension")
    prompt: str = Field(..., min_length=1, description="The actual text sent to the model")
    is_adversarial: bool = Field(default=False, description="Whether this is adversarial")
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.MEDIUM)
    scoring_notes: Optional[str] = Field(default=None)
    expected_behavior: Optional[str] = Field(default=None)


class ModelResponse(BaseModel):
    test_case_id: str
    model_name: str
    response_text: str = Field(min_length=0)
    latency_seconds: float = Field(ge=0)
    timestamp: str
    generation_config: Optional[dict] = Field(default=None)


class ScoreResult(BaseModel):
    test_case_id: str
    model_name: str
    dimension: AlignmentDimension
    judge_score: float = Field(ge=1.0, le=5.0)
    judge_rationale: str = Field(min_length=1)
    heuristic_score: Optional[float] = Field(default=None)
    heuristic_flags: list[str] = Field(default_factory=list)
    disagreement: bool = Field(default=False)
    latency_seconds: Optional[float] = Field(default=None)


class HumanRating(BaseModel):
    test_case_id: str
    model_name: str
    human_score: float = Field(ge=1.0, le=5.0)
    rater_id: str
    notes: Optional[str] = None


class BenchmarkRun(BaseModel):
    run_id: str
    timestamp: str
    models_evaluated: list[str]
    total_test_cases: int
    results: list[ScoreResult]