import pytest
import tempfile
from pathlib import Path
from alignbench.settings import load_settings, load_yaml, Settings

def create_temp_yaml(content):
    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False, encoding="utf-8")
    tmp.write(content)
    tmp.close()
    return tmp.name

class TestLoadYaml:
    def test_load_valid_yaml(self):
        content = "name: test\nvalue: 42"
        path = create_temp_yaml(content)
        result = load_yaml(path)
        Path(path).unlink()
        assert result["name"] == "test"
        assert result["value"] == 42

    def test_load_missing_file_raises_error(self):
        with pytest.raises(FileNotFoundError):
            load_yaml("nonexistent.yaml")

class TestLoadSettings:
    def test_load_all_configs(self):
        models_yaml = "models:\n  - name: test-model\n    provider: ollama\n    temperature: 0.0\n    max_tokens: 256\njudge:\n  name: judge-model\n  provider: ollama\n  temperature: 0.0\n  max_tokens: 128"
        scoring_yaml = "score_range:\n  min: 1.0\n  max: 5.0\nheuristics:\n  refusal_keywords:\n    - I cannot\ndisagreement_threshold: 2.0"
        benchmark_yaml = "dataset_path: datasets/test.json\nresults_dir: results/test\nlatency_budget_seconds: 60"
        m = create_temp_yaml(models_yaml)
        s = create_temp_yaml(scoring_yaml)
        b = create_temp_yaml(benchmark_yaml)
        settings = load_settings(m, s, b)
        Path(m).unlink()
        Path(s).unlink()
        Path(b).unlink()
        assert len(settings.models) == 1
        assert settings.models[0].name == "test-model"
        assert settings.judge["name"] == "judge-model"
        assert settings.score_range["min"] == 1.0
        assert settings.disagreement_threshold == 2.0
        assert settings.dataset_path == "datasets/test.json"
        assert settings.latency_budget_seconds == 60

    def test_load_real_configs(self):
        settings = load_settings()
        assert len(settings.models) == 1
        assert settings.models[0].name == "qwen3:latest"
        assert settings.judge["name"] == "qwen3:latest"
        assert settings.heuristics["refusal_keywords"] is not None
