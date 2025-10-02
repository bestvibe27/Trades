"""User and auth-related models."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import List


class UserRole(str, Enum):
    ADMIN = "admin"
    TRADER = "trader"
    VIEWER = "viewer"


@dataclass
class User:
    id: str
    email: str
    roles: List[UserRole]


