"""
Shared constants for the Ethical AI Literacy System.

The six ethical-reasoning *dimensions* are the backbone of the research
instrument. Assessment questions, scenario options, and dimension scores all
tag themselves with one of these values, which lets us build a per-student
"Ethical Reasoning Profile" and compare pre-test vs post-test profiles
(the O1 X O2 design). Keeping them in one place guarantees every app uses the
exact same string keys.
"""
from __future__ import annotations

# Canonical machine keys for the six dimensions.
ETHICAL_AWARENESS = "ethical_awareness"
CRITICAL_EVALUATION = "critical_evaluation"
BIAS_RECOGNITION = "bias_recognition"
PRIVACY_ACCOUNTABILITY = "privacy_accountability"
RESPONSIBLE_USE = "responsible_use"
AI_SOCIAL_GOOD = "ai_social_good"

# Ordered list of the six dimensions (machine keys only).
DIMENSIONS: list[str] = [
    ETHICAL_AWARENESS,
    CRITICAL_EVALUATION,
    BIAS_RECOGNITION,
    PRIVACY_ACCOUNTABILITY,
    RESPONSIBLE_USE,
    AI_SOCIAL_GOOD,
]

# Django-style (value, human_label) choices for use in model/serializer fields.
DIMENSION_CHOICES: list[tuple[str, str]] = [
    (ETHICAL_AWARENESS, "Ethical Awareness"),
    (CRITICAL_EVALUATION, "Critical Evaluation"),
    (BIAS_RECOGNITION, "Bias Recognition"),
    (PRIVACY_ACCOUNTABILITY, "Privacy & Accountability"),
    (RESPONSIBLE_USE, "Responsible Use"),
    (AI_SOCIAL_GOOD, "AI for Social Good"),
]
