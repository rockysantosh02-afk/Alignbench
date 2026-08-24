"""
FILE NAME:    base.py
LOCATION:      src/alignbench/models/base.py

WHY THIS FILE EXISTS:
    Imagine you have 3 different ways to run models:
    Ollama, HuggingFace, and maybe a cloud API.
    Each one works differently internally, but your
    benchmark code should NOT care which one it uses.
    This file defines the RULES: "any model MUST have
    a generate() method that takes a prompt and returns
    a response." It is a contract.

WHAT IT DOES:
    Defines BaseLLM as an abstract class.
    You cannot create a BaseLLM directly.
    You must create a subclass (like OllamaModel)
    that implements the generate() method.

HOW IT CONNECTS:
    - Inherited by: ollama.py (OllamaModel extends BaseLLM)
    - Used by: runner.py (calls model.generate() without
      knowing if it is Ollama or HuggingFace)

KEY CONCEPTS:
    - ABC = Abstract Base Class (from abc module)
    - @abstractmethod = marks a method that MUST be implemented
      by any subclass. If you forget, Python errors immediately.
    - This is called "polymorphism" in OOP — different classes,
      same interface.
"""

from abc import ABC, abstractmethod


class BaseLLM(ABC):
    """
    Abstract base class for all LLM models.

    Every model integration (Ollama, HuggingFace, etc.)
    must inherit from this and implement generate().
    """

    @abstractmethod
    def generate(self, prompt: str) -> tuple[str, float]:
        """
        Send a prompt to the model and get a response.

        ARGUMENTS:
            prompt: The text to send to the model

        RETURNS:
            A tuple of:
            1. response_text (str): The model's response
            2. latency_seconds (float): How long it took
        """
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the model name (e.g. 'llama3.1:8b')."""
        pass
