import time
import requests
from alignbench.models.base import BaseLLM


class OllamaModel(BaseLLM):

    def __init__(self, name: str, temperature: float = 0.0, max_tokens: int = 1024):
        self._name = name
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.base_url = "http://localhost:11434"

    @property
    def name(self) -> str:
        return self._name

    def generate(self, prompt: str) -> tuple[str, float]:
        start_time = time.time()
        response = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self._name,
                "prompt": prompt,
                "temperature": self.temperature,
                "stream": False,
                "options": {
                    "num_predict": self.max_tokens,
                },
            },
            timeout=180,
        )
        response.raise_for_status()
        data = response.json()
        latency = time.time() - start_time
        return data["response"], latency

    def is_available(self) -> bool:
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return resp.status_code == 200
        except requests.ConnectionError:
            return False
