"""
database.py - PostgreSQL connection using asyncpg
=================================================
asyncpg lets us talk to Postgres in an async (non-blocking) way,
which is perfect for FastAPI.
"""

import os
from pathlib import Path
from urllib.parse import urlparse

import asyncpg
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().with_name(".env")
load_dotenv(ENV_PATH)  # always read backend/.env

# ---------------------------------------------------------------------------
# Connection pool - reuses DB connections instead of opening a new one
# for every request (much faster)
# ---------------------------------------------------------------------------
_pool = None


def _get_database_url() -> str:
    database_url = (
        os.getenv("LOCAL_DATABASE_URL", "").strip()
        or os.getenv("DATABASE_URL", "").strip()
    )
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is not set. Add DATABASE_URL or LOCAL_DATABASE_URL to backend/.env."
        )
    return database_url


def _get_ssl_option(database_url: str):
    ssl_mode = os.getenv("DATABASE_SSL", "").strip().lower()
    if ssl_mode in {"disable", "false", "0", "none"}:
        return False
    if ssl_mode:
        return ssl_mode

    host = (urlparse(database_url).hostname or "").lower()
    if host in {"localhost", "127.0.0.1"}:
        return False

    return "require"


async def get_pool():
    global _pool
    if _pool is None:
        database_url = _get_database_url()
        _pool = await asyncpg.create_pool(
            dsn=database_url,
            min_size=2,
            max_size=10,
            statement_cache_size=0,
            ssl=_get_ssl_option(database_url),
        )
    return _pool


async def get_db():
    """
    FastAPI dependency - yields a database connection for each request.
    Usage: db: asyncpg.Connection = Depends(get_db)
    """
    pool = await get_pool()
    async with pool.acquire() as connection:
        yield connection


# ---------------------------------------------------------------------------
# Create all tables on first run
# ---------------------------------------------------------------------------
async def create_tables():
    pool = await get_pool()
    async with pool.acquire() as db:
        await db.execute(
            """
            -- Enable UUID generation
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";

            -- ---------------------------------------------------------------
            -- users
            -- ---------------------------------------------------------------
            CREATE TABLE IF NOT EXISTS users (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username        TEXT NOT NULL,
                email           TEXT NOT NULL UNIQUE,
                password_hash   TEXT NOT NULL,
                avatar_url      TEXT,
                created_at      TIMESTAMPTZ DEFAULT NOW()
            );

            -- ---------------------------------------------------------------
            -- conversations  (a chat thread belonging to one user)
            -- ---------------------------------------------------------------
            CREATE TABLE IF NOT EXISTS conversations (
                id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title       TEXT NOT NULL DEFAULT 'New Chat',
                is_pinned   BOOLEAN DEFAULT FALSE,
                pin_label   TEXT,           -- e.g. "React Component Help"
                pin_icon    TEXT,           -- e.g. "code" | "lightbulb" | "doc"
                created_at  TIMESTAMPTZ DEFAULT NOW(),
                updated_at  TIMESTAMPTZ DEFAULT NOW()
            );

            -- ---------------------------------------------------------------
            -- messages  (individual chat bubbles inside a conversation)
            -- ---------------------------------------------------------------
            CREATE TABLE IF NOT EXISTS messages (
                id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                role                TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                content             TEXT NOT NULL,
                created_at          TIMESTAMPTZ DEFAULT NOW()
            );

            -- ---------------------------------------------------------------
            -- Indexes - makes lookups faster
            -- ---------------------------------------------------------------
            CREATE INDEX IF NOT EXISTS idx_conversations_user_id
                ON conversations(user_id);

            CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
                ON messages(conversation_id);
        """
        )
        print("Database tables ready")
