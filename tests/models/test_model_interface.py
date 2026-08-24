import pytest
from alignbench.models.base import BaseLLM
from alignbench.models.ollama import OllamaModel


class TestBaseLLM:
    def test_cannot_instantiate_base_class(self):
        with pytest.raises(TypeError):
            BaseLLM()

    def test_ollama_is_subclass(self):
        assert issubclass(OllamaModel, BaseLLM)


class TestOllamaModel:
    def test_create_model(self):
        model = OllamaModel(name="llama3.1:8b", temperature=0.0, max_tokens=256)
        assert model.name == "llama3.1:8b"
        assert model.temperature == 0.0
        assert model.max_tokens == 256
        assert model.base_url == "http://localhost:11434"

    def test_create_model_defaults(self):
        model = OllamaModel(name="mistral:7b")
        assert model.name == "mistral:7b"
        assert model.temperature == 0.0
        assert model.max_tokens == 1024

    def test_is_available(self):
        model = OllamaModel(name="llama3.1:8b")
        result = model.is_available()
        assert isinstance(result, bool)
