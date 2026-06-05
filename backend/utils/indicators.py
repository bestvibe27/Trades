"""Technical indicators utilities."""

from __future__ import annotations

from collections import deque
from typing import Deque, Iterable, List, Optional


def simple_moving_average(values: Iterable[float], window: int) -> List[Optional[float]]:
    if window <= 0:
        raise ValueError("window must be > 0")
    q: Deque[float] = deque(maxlen=window)
    sma: List[Optional[float]] = []
    for v in values:
        q.append(v)
        sma.append(sum(q) / len(q) if len(q) == window else None)
    return sma


def exponential_moving_average(values: Iterable[float], window: int) -> List[Optional[float]]:
    if window <= 0:
        raise ValueError("window must be > 0")
    alpha = 2 / (window + 1)
    ema: List[Optional[float]] = []
    prev: Optional[float] = None
    for v in values:
        prev = v if prev is None else (alpha * v + (1 - alpha) * prev)
        ema.append(prev if prev is not None else None)
    return ema


