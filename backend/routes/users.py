"""
routes/users.py — Register and Login
=====================================
POST /api/register  → create account + set cookie
POST /api/login     → login + set cookie
GET  /api/me        → get current user (requires cookie)
"""

from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic import BaseModel, EmailStr

import auth
import database

router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    avatar_url: str | None


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


# ---------------------------------------------------------------------------
# REGISTER
# ---------------------------------------------------------------------------

@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(
    body: RegisterRequest,
    response: Response,
    db=Depends(database.get_db),
):
    """Create a new user account + login user immediately."""

    # Check if email exists
    existing = await db.fetchrow(
        "SELECT id FROM users WHERE email = $1",
        body.email,
    )

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed = auth.hash_password(body.password)

    # Insert user
    user = await db.fetchrow(
        """
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, avatar_url
        """,
        body.username,
        body.email,
        hashed,
    )

    # Create token
    token = auth.create_token(str(user["id"]))

    auth.set_auth_cookie(response, token)

    return {
        "token": token,
        "user": {
            "id": str(user["id"]),
            "username": user["username"],
            "email": user["email"],
            "avatar_url": user["avatar_url"],
        },
    }


# ---------------------------------------------------------------------------
# LOGIN
# ---------------------------------------------------------------------------

@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    response: Response,
    db=Depends(database.get_db),
):
    """Login user + set cookie."""

    user = await db.fetchrow(
        """
        SELECT id, username, email, password_hash, avatar_url
        FROM users
        WHERE email = $1
        """,
        body.email,
    )

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not auth.verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth.create_token(str(user["id"]))

    auth.set_auth_cookie(response, token)

    return {
        "token": token,
        "user": {
            "id": str(user["id"]),
            "username": user["username"],
            "email": user["email"],
            "avatar_url": user["avatar_url"],
        },
    }


# ---------------------------------------------------------------------------
# ME (CURRENT USER)
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: str = Depends(auth.get_current_user),
    db=Depends(database.get_db),
):
    """Get logged-in user from cookie token."""

    user = await db.fetchrow(
        """
        SELECT id, username, email, avatar_url
        FROM users
        WHERE id = $1
        """,
        user_id,
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user["id"]),
        "username": user["username"],
        "email": user["email"],
        "avatar_url": user["avatar_url"],
    }
