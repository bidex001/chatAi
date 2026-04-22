"""
routes/messages.py — Chat messages
====================================
GET  /api/conversations/{id}/messages  → load message history
POST /api/conversations/{id}/messages  → send a new message
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import database
import auth
import openai_service

router = APIRouter()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class SendMessageRequest(BaseModel):
    content: str
    role: str = "user"   # "user" or "assistant"


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: str


class ChatRequest(BaseModel):
    content: str


class ChatResponse(BaseModel):
    user_message: MessageResponse
    assistant_message: MessageResponse
    model: str


# ---------------------------------------------------------------------------
# Helper — verify conversation belongs to user
# ---------------------------------------------------------------------------

async def check_conversation_owner(conversation_id: str, user_id: str, db) -> None:
    row = await db.fetchrow(
        "SELECT id FROM conversations WHERE id = $1 AND user_id = $2",
        conversation_id, user_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Conversation not found")


def serialize_message(row) -> dict:
    return {
        "id": str(row["id"]),
        "conversation_id": str(row["conversation_id"]),
        "role": row["role"],
        "content": row["content"],
        "created_at": row["created_at"].isoformat(),
    }


async def store_message(conversation_id: str, role: str, content: str, db):
    row = await db.fetchrow(
        """
        INSERT INTO messages (conversation_id, role, content)
        VALUES ($1, $2, $3)
        RETURNING id, conversation_id, role, content, created_at
        """,
        conversation_id, role, content,
    )

    await db.execute(
        "UPDATE conversations SET updated_at = NOW() WHERE id = $1",
        conversation_id,
    )

    return row


async def load_history(conversation_id: str, db) -> list[dict[str, str]]:
    rows = await db.fetch(
        """
        SELECT role, content
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        """,
        conversation_id,
        openai_service.get_history_limit(),
    )

    return [{"role": row["role"], "content": row["content"]} for row in reversed(rows)]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
async def get_messages(
    conversation_id: str,
    user_id: str = Depends(auth.get_current_user),
    db=Depends(database.get_db),
):
    """Fetch all messages in a conversation, oldest first."""
    await check_conversation_owner(conversation_id, user_id, db)

    rows = await db.fetch(
        """
        SELECT id, conversation_id, role, content, created_at
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at ASC
        """,
        conversation_id,
    )

    return [
        {
            "id": str(r["id"]),
            "conversation_id": str(r["conversation_id"]),
            "role": r["role"],
            "content": r["content"],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=201,
)
async def send_message(
    conversation_id: str,
    body: SendMessageRequest,
    user_id: str = Depends(auth.get_current_user),
    db=Depends(database.get_db),
):
    """
    Save a message to the conversation.

    How to use this in your app:
    1. User types something → call this with role="user"
    2. Get AI reply from your configured AI provider
    3. Call this again with role="assistant" to save the AI reply

    This keeps the full conversation history in your database.
    """
    await check_conversation_owner(conversation_id, user_id, db)

    # Validate role
    if body.role not in ("user", "assistant"):
        raise HTTPException(status_code=400, detail="role must be 'user' or 'assistant'")

    if not body.content.strip():
        raise HTTPException(status_code=400, detail="content cannot be empty")

    row = await store_message(conversation_id, body.role, body.content.strip(), db)

    return serialize_message(row)


@router.post(
    "/conversations/{conversation_id}/chat",
    response_model=ChatResponse,
    status_code=201,
)
async def chat_with_ai(
    conversation_id: str,
    body: ChatRequest,
    user_id: str = Depends(auth.get_current_user),
    db=Depends(database.get_db),
):
    """
    Save a user message, send the conversation to the configured AI provider,
    then save and return the assistant reply.
    """
    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="content cannot be empty")

    await check_conversation_owner(conversation_id, user_id, db)

    user_row = await store_message(conversation_id, "user", content, db)
    history = await load_history(conversation_id, db)

    try:
        assistant_reply = await openai_service.generate_reply(history)
    except openai_service.OpenAIConfigurationError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except openai_service.OpenAIGenerationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    assistant_row = await store_message(conversation_id, "assistant", assistant_reply, db)

    return {
        "user_message": serialize_message(user_row),
        "assistant_message": serialize_message(assistant_row),
        "model": openai_service.get_model_name(),
    }
