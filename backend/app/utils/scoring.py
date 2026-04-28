"""Scoring utilities shared across agents and services."""

from __future__ import annotations

from app.schemas.common import ScoreBandThresholds


def clamp(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
    """Clamp a numeric value to the provided range."""

    return max(lower, min(upper, value))


def determine_score_band(score: float, thresholds: ScoreBandThresholds) -> str:
    """Return the score band label for a numeric probability score."""

    if score >= thresholds.s:
        return "S"
    if score >= thresholds.a:
        return "A"
    if score >= thresholds.b:
        return "B"
    if score >= thresholds.c:
        return "C"
    return "D"

