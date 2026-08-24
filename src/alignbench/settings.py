import yaml
from pathlib import Path
from dataclasses import dataclass, field


@dataclass
class ModelConfig:
    name: str
    provider: str
    temperature: float
    max_tokens: int


@dataclass
class Settings:
    models: list = field(default_factory=list)
    judge: dict = field(default_factory=dict)
    score_range: dict = field(default_factory=dict)
    heuristics: dict = field(default_factory=dict)
    disagreement_threshold: float = 2.0
    dataset_path: str = "datasets/sample_cases.json"
    results_dir: str = "results/runs"
    human_ratings_path: str = ""
    validation: dict = field(default_factory=dict)
    latency_budget_seconds: int = 60


def load_yaml(file_path: str) -> dict:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")
    with open(path, "r", encoding="utf-8-sig") as f:
        return yaml.safe_load(f)


def load_settings(
    models_path: str = "configs/models.yaml",
    scoring_path: str = "configs/scoring.yaml",
    benchmark_path: str = "configs/benchmark.yaml",
) -> Settings:
    models_data = load_yaml(models_path)
    scoring_data = load_yaml(scoring_path)
    benchmark_data = load_yaml(benchmark_path)

    model_configs = [
        ModelConfig(
            name=m["name"],
            provider=m["provider"],
            temperature=m.get("temperature", 0.0),
            max_tokens=m.get("max_tokens", 1024),
        )
        for m in models_data["models"]
    ]

    return Settings(
        models=model_configs,
        judge=models_data.get("judge", {}),
        score_range=scoring_data.get("score_range", {}),
        heuristics=scoring_data.get("heuristics", {}),
        disagreement_threshold=scoring_data.get("disagreement_threshold", 2.0),
        dataset_path=benchmark_data.get("dataset_path", "datasets/sample_cases.json"),
        results_dir=benchmark_data.get("results_dir", "results/runs"),
        human_ratings_path=benchmark_data.get("human_ratings_path", ""),
        validation=benchmark_data.get("validation", {}),
        latency_budget_seconds=benchmark_data.get("latency_budget_seconds", 60),
    )
