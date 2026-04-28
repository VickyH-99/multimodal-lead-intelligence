"""Base agent abstraction for consistent naming and documentation."""

from __future__ import annotations

from typing import Generic, TypeVar


InputT = TypeVar("InputT")
OutputT = TypeVar("OutputT")


class BaseAgent(Generic[InputT, OutputT]):
    """Base class for modular agents in the orchestration graph."""

    name: str = "BaseAgent"
    description: str = "Base agent"

    def run(self, payload: InputT) -> OutputT:
        """Execute the agent on the provided payload."""

        raise NotImplementedError

