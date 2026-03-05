"""
Neuro-Sentry Classifier — Phase 5
Local DeBERTa-first with Groq API fallback.
Always returns a ClassifierResult — never raises.
"""

import os
import json
import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────

GROQ_API_KEY  = os.environ.get("GROQ_API_KEY", "")
GROQ_URL      = "https://api.groq.com/openai/v1/chat/completions"

# llama-3.1-8b-instant: ~200ms, very cheap, good accuracy for classification
CLASSIFIER_MODEL = "llama-3.1-8b-instant"

# Local model path — auto-discovered or set via LOCAL_ML_MODEL_PATH env
LOCAL_MODEL_PATH = os.environ.get(
    "LOCAL_ML_MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "..", "models", "deberta-threat-classifier"),
)