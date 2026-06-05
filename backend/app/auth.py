"""Auth API router (placeholder).

Provides minimal endpoints for login status to demonstrate routing.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.api.dependencies import get_auth_token


router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=LoginResponse)
async def login(_: LoginRequest) -> LoginResponse:
    # In production, verify credentials and issue JWT
    return LoginResponse(access_token="dev-admin-token")


@router.get("/me")
async def me(_: str = Depends(get_auth_token)) -> dict[str, str]:
    return {"role": "admin", "email": "admin@example.com"}


