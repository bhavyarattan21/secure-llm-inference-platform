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