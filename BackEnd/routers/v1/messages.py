from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc
from typing import List
from datetime import datetime

from core.database import get_db
from models.message import Message, MessageType
from models.users import User
from models.appointment import Appointment # Needs appointment model access
from routers.v1.dependencies import get_current_user
from core.socket_manager import manager 

# Import our new Schemas
from schemas.message import (
    MessageCreate, 
    MessageResponse, 
    ConversationItem, 
    UserSearchItem, 
    ReminderRequest
)

router = APIRouter()

# --- Endpoints ---

@router.get("/conversations", response_model=List[ConversationItem])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a list of users the current user has chatted with.
    """
    # 1. Find all unique user IDs
    sent_ids = db.query(Message.receiver_id).filter(Message.sender_id == current_user.id).distinct()
    received_ids = db.query(Message.sender_id).filter(Message.receiver_id == current_user.id).distinct()
    
    contact_ids = set([r[0] for r in sent_ids] + [r[0] for r in received_ids])
    conversations = []

    for contact_id in contact_ids:
        contact = db.query(User).filter(User.id == contact_id).first()
        if not contact:
            continue

        last_msg = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == contact_id),
                and_(Message.sender_id == contact_id, Message.receiver_id == current_user.id)
            )
        ).order_by(desc(Message.timestamp)).first()

        unread = db.query(Message).filter(
            Message.sender_id == contact_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).count()

        if last_msg:
            # Handle "Card" messages in preview
            preview_text = last_msg.content
            if last_msg.message_type == MessageType.APPOINTMENT_REMINDER:
                preview_text = "📅 Appointment Reminder"

            conversations.append({
                "user_id": contact.id,
                "name": f"{contact.fname} {contact.lname}",
                "role": contact.role.value if hasattr(contact.role, 'value') else str(contact.role),
                "picture": contact.picture,
                "last_message": preview_text,
                "last_message_time": last_msg.timestamp,
                "unread_count": unread
            })

    conversations.sort(key=lambda x: x['last_message_time'] or datetime.min, reverse=True)
    return conversations


@router.get("/search", response_model=List[UserSearchItem])
def search_users_to_chat(
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not query:
        return []
        
    search_term = f"%{query}%"
    users = db.query(User).filter(
        User.id != current_user.id,
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
    """
    Get chat history.
    Uses joinedload to fetch appointment details efficiently.
    """
    messages = db.query(Message).options(
        joinedload(Message.appointment) # 👈 Important: Load nested appointment data
    ).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
            and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id)
        )
    ).order_by(Message.timestamp.asc()).all()
    
    # Mark read
    unread_messages = [m for m in messages if m.sender_id == other_user_id and not m.is_read]
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
    """Send a normal TEXT message"""
    receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")

    new_message = Message(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        content=message_data.content,
        message_type=MessageType.TEXT.value,
        timestamp=datetime.utcnow(),
        is_read=False
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # WebSocket
    socket_payload = {
        "type": "CHAT_MESSAGE",
        "message": {
            "id": new_message.id,
            "sender_id": new_message.sender_id,
            "receiver_id": new_message.receiver_id,
            "content": new_message.content,
            "message_type": "text",
            "timestamp": new_message.timestamp.isoformat(),
            "is_read": False,
            "sender_name": f"{current_user.fname} {current_user.lname}",
            "sender_picture": current_user.picture
        }
    }
    await manager.send_personal_message(socket_payload, user_id=str(message_data.receiver_id))
    
    return new_message


@router.post("/send-reminder", response_model=dict)
async def send_appointment_reminder(
    request: ReminderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send an Appointment Reminder Card
    """
    # Fetch & Validate Appointment
    appt = db.query(Appointment).filter(Appointment.id == request.appointment_id).first()
    if not appt:
        raise HTTPException(404, "Appointment not found")

    # Create Message
    new_msg = Message(
        sender_id=current_user.id,
        receiver_id=request.receiver_id,
        content="Sent an appointment reminder",
        message_type=MessageType.APPOINTMENT_REMINDER.value,
        appointment_id=appt.id,
        timestamp=datetime.utcnow()
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    
    # WEBSOCKET BROADCAST (Rich Data)
    socket_payload = {
        "type": "CHAT_MESSAGE",
        "message": {
            "id": new_msg.id,
            "sender_id": new_msg.sender_id,
            "content": new_msg.content,
            "message_type": "appointment_reminder",
            "timestamp": new_msg.timestamp.isoformat(),
            "sender_name": f"{current_user.fname} {current_user.lname}",
            "sender_picture": current_user.picture,
            # Embed the card data directly
            "appointment": {
                "id": appt.id,
                "appointment_date": appt.appointment_date.isoformat(),
                "status": appt.status.value,
                "reason": appt.reason
            }
        }
    }
    
    # Send to Receiver AND Sender (so it appears in their own chat window immediately)
    await manager.send_personal_message(socket_payload, str(request.receiver_id))
    await manager.send_personal_message(socket_payload, str(current_user.id))

    return {"status": "sent", "message_id": new_msg.id}


@router.delete("/{message_id}", response_model=dict)
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")

    # Soft Delete (We actually just flag it)
    message.is_delete = True # Match your model field 'is_delete' (not is_deleted)
    message.content = "Message unsent"
    db.commit()

    # Notify Receiver
    await manager.send_personal_message(
        {
            "type": "MESSAGE_DELETED",
            "message_id": message_id,
            "conversation_id": current_user.id 
        },
        user_id=str(message.receiver_id)
    )
    
    # Notify Sender
    await manager.send_personal_message(
        {
            "type": "MESSAGE_DELETED",
            "message_id": message_id
        },
        user_id=str(current_user.id)
    )

    return {"message": "Message deleted"}