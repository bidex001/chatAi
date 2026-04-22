"""
routes/conversations.py — Chat thread management
=================================================
GET    /api/conversations           → list all your conversations
POST   /api/conversations           → start a new conversation
PATCH  /api/conversations/{id}/pin  → pin or unpin a conversation
DELETE /api/conversations/{id}      → delete a conversation
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import database
import auth

router = APIRouter()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class CreateConversationRequest(BaseModel):
    title: str = "New Chat"


class PinRequest(BaseModel):
    is_pinned: bool
    pin_label: str | None = None
    pin_icon: str | None = None  # "code" | "lightbulb" | "doc"


class ConversationResponse(BaseModel):
    id: str
    title: str
    is_pinned: bool
    pin_label: str | None
    pin_icon: str | None
    last_message: str | None     # preview snippet shown in the sidebar
    created_at: str
    updated_at: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    user_id: str = Depends(auth.get_current_user),
    db=Depends(database.get_db),
):
    """
    Returns all conversations for the logged-in user.
    Pinned ones come first, then sorted by most recently updated.
    Also fetches the last message content for the sidebar preview.
    """
    rows = await db.fetch(
        """
        SELECT
            c.id,
            c.title,
            c.is_pinned,
            c.pin_label,
            c.pin_icon,
            c.created_at,
            c.updated_at,
            -- Subquery: get the content of the most recent message
            (
                SELECT content
                FROM messages m
                WHERE m.conversation_id = c.id
                ORDER BY m.created_at DESC
                LIMIT 1
            ) AS last_message
        FROM conversations c
        WHERE c.user_id = $1
        ORDER BY c.is_pinned DESC, c.updated_at DESC
        """,
        user_id,
    )

    return [
        {
            "id": str(r["id"]),
            "title": r["title"],
            "is_pinned": r["is_pinned"],
            "pin_label": r["pin_label"],
            "pin_icon": r["pin_icon"],
            "last_message": r["last_message"],
            "created_at": r["created_at"].isoformat(),
            "updated_at": r["updated_at"].isoformat(),
        }
        for r in rows
    ]


@router.post("/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    body: CreateConversationRequest,
    user_id: str = Depends(auth.get_current_user),
    db=Depends(database.get_db),
):
    """Start a new conversation (chat thread)."""
    row = await db.fetchrow(
        """
        INSERT INTO conversations (user_id, title)
        VALUES ($1, $2)
        RETURNING id, title, is_pinned, pin_label, pin_icon, created_at, updated_at
        """,
        user_id, body.title,
    )

    return {
        "id": str(row["id"]),
        "title": row["title"],
        "is_pinned": row["is_pinned"],
        "pin_label": row["pin_label"],
        "pin_icon": row["pin_icon"],
        "last_message": None,
        "created_at": row["created_at"].isoformat(),
        "updated_at": row["updated_at"].isoformat(),
    }


@router.patch("/conversations/{conversation_id}/pin")
async def toggle_pin(
    conversation_id: str,
    body: PinRequest,
    user_id: str = Depends(auth.get_current_user),
    db=Depends(database.get_db),
):
    """Pin or unpin a conversation (shows it in the Pinned section of sidebar)."""

    # Make sure the conversation belongs to this user
    row = await db.fetchrow(
        "SELECT id FROM conversations WHERE id = $1 AND user_id = $2",
        conversation_id, user_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.execute(
        """
        UPDATE conversations
        SET is_pinned = $1, pin_label = $2, pin_icon = $3, updated_at = NOW()
        WHERE id = $4
        """,
        body.is_pinned, body.pin_label, body.pin_icon, conversation_id,
    )

    return {"success": True, "is_pinned": body.is_pinned}


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(auth.get_current_user),
    db=Depends(database.get_db),
):
    """Delete a conversation and all its messages (CASCADE handles the messages)."""
    result = await db.execute(
        "DELETE FROM conversations WHERE id = $1 AND user_id = $2",
        conversation_id, user_id,
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Conversation not found")
