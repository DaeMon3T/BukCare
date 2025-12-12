from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc
from typing import List, Optional  # <--- Added Optional here
from core.database import get_db
from models.message import Message
from models.users import User
from routers.v1.dependencies import get_current_user
from pydantic import BaseModel
from datetime import datetime
from core.socket_manager import manager  # Import the socket manager

router = APIRouter()

# --- Pydantic Schemas ---

class MessageCreate(BaseModel):
    receiver_id: int
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    timestamp: datetime
    is_read: bool

    class Config:
        from_attributes = True # Updated for Pydantic V2

class ConversationItem(BaseModel):
    user_id: int
    name: str
    role: str
    picture: Optional[str] = None # Uses Optional
    last_message: Optional[str] = None # Uses Optional
    last_message_time: Optional[datetime] = None # Uses Optional
    unread_count: int

# --- New Schema for Search ---
class UserSearchItem(BaseModel):
    id: int
    name: str
    role: str
    picture: Optional[str] = None # Uses Optional

# --- Endpoints ---

@router.get("/conversations", response_model=List[ConversationItem])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a list of users the current user has chatted with, 
    along with the last message and unread count.
    """
    # 1. Find all unique user IDs involved in messages with current_user
    sent_ids = db.query(Message.receiver_id).filter(Message.sender_id == current_user.id).distinct()
    received_ids = db.query(Message.sender_id).filter(Message.receiver_id == current_user.id).distinct()
    
    # Combine sets of IDs
    contact_ids = set([r[0] for r in sent_ids] + [r[0] for r in received_ids])
    
    conversations = []

    for contact_id in contact_ids:
        # Get user details
        contact = db.query(User).filter(User.id == contact_id).first()
        if not contact:
            continue

        # Get the very last message exchanged (sent or received)
        last_msg = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == contact_id),
                and_(Message.sender_id == contact_id, Message.receiver_id == current_user.id)
            )
        ).order_by(desc(Message.timestamp)).first()

        # Count unread messages from this contact
        unread = db.query(Message).filter(
            Message.sender_id == contact_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).count()

        if last_msg:
            conversations.append({
                "user_id": contact.id,
                "name": f"{contact.fname} {contact.lname}",
                "role": contact.role.value if hasattr(contact.role, 'value') else str(contact.role),
                "picture": contact.picture,
                "last_message": last_msg.content,
                "last_message_time": last_msg.timestamp,
                "unread_count": unread
            })

    # Sort by latest message time
    conversations.sort(key=lambda x: x['last_message_time'] or datetime.min, reverse=True)
    
    return conversations

@router.get("/search", response_model=List[UserSearchItem])
def search_users_to_chat(
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search for users to start a new chat with.
    Excludes the current user.
    """
    if not query:
        return []
        
    search_term = f"%{query}%"
    
    users = db.query(User).filter(
        User.id != current_user.id, # Don't find yourself
        or_(
            User.fname.ilike(search_term),
            User.lname.ilike(search_term),
            User.email.ilike(search_term)
        )
    ).limit(10).all()
    
    return [
        {
            "id": u.id,
            "name": f"{u.fname} {u.lname}",
            "role": u.role.value if hasattr(u.role, 'value') else str(u.role),
            "picture": u.picture
        }
        for u in users
    ]

@router.get("/{other_user_id}", response_model=List[MessageResponse])
def get_chat_history(
    other_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat history between current user and another user"""
    
    # Fetch messages
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id)
        )
    ).order_by(Message.timestamp.asc()).all()
    
    # Mark received messages as read
    unread_messages = db.query(Message).filter(
        Message.sender_id == other_user_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).all()

    for msg in unread_messages:
        msg.is_read = True
    
    if unread_messages:
        db.commit()
    
    return messages

@router.post("/", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message:
    1. Save to DB
    2. Push to WebSocket
    """
    # 1. Verify receiver exists
    receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Create & Save Message
    new_message = Message(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        content=message_data.content,
        timestamp=datetime.utcnow(),
        is_read=False
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # 3. Construct Payload for WebSocket
    socket_payload = {
        "type": "CHAT_MESSAGE",
        "message": {
            "id": new_message.id,
            "sender_id": new_message.sender_id,
            "receiver_id": new_message.receiver_id,
            "content": new_message.content,
            "timestamp": new_message.timestamp.isoformat(),
            "is_read": False,
            "sender_name": f"{current_user.fname} {current_user.lname}",
            "sender_picture": current_user.picture
        }
    }

    # 4. Send Real-Time Signal to Receiver
    await manager.send_personal_message(
        socket_payload,
        user_id=str(message_data.receiver_id)
    )
    
    return new_message