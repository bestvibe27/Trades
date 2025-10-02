"""FastAPI dependency utilities (placeholders for auth, DB, etc.)."""

from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status


def get_auth_token(authorization: str | None = Header(default=None)) -> str:
    """Extract and validate a bearer token from the Authorization header."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return authorization.split(" ", 1)[1]


def require_admin(token: str = Depends(get_auth_token)) -> str:
    """Very simple admin check placeholder.

    Replace with real token validation and role extraction.
    """
    if token != "dev-admin-token":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return token


