"""
ChatAI Backend - main.py
========================
A beginner-friendly REST API built with FastAPI + PostgreSQL.

Run with: uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import database
from routes import users, conversations, messages

# ---------------------------------------------------------------------------
# App startup / shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs on startup: create tables if they don't exist."""
    await database.create_tables()
    yield
    # (cleanup code would go here if needed)

app = FastAPI(
    title="ChatAI API",
    description="Backend for the ChatAI messaging app",
    version="1.0.0",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ---------------------------------------------------------------------------
# CORS — allows your frontend (React/HTML) to talk to this API
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://chat-ai-three-iota.vercel.app/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Register route groups
# ---------------------------------------------------------------------------
app.include_router(users.router,         prefix="/api", tags=["Users"])
app.include_router(conversations.router, prefix="/api", tags=["Conversations"])
app.include_router(messages.router,      prefix="/api", tags=["Messages"])


@app.get("/")
async def root():
    return {"message": "ChatAI API is running ✅"}
