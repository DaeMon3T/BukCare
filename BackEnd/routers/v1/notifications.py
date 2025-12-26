from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from core.database import get_db
from models.notification import Notification
from routers.v1.dependencies import get_current_user
from models.users import User
from core.socket_manager import manager

router = APIRouter()

# --- Pydantic Schema for Response ---
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    appointment_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """
    The single connection point for ALL real-time events 
    (Chat messages + Bell notifications).
    """
    await manager.connect(websocket, str(user_id))
    try:
        while True:
            # Keep the connection open to receive messages (if needed)
            # or just to keep the heartbeat alive.
            data = await websocket.receive_text()
            # Optional: You can handle incoming socket messages here if needed
    except WebSocketDisconnect:
        manager.disconnect(str(user_id))

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, le=100), # Pagination limit
    skip: int = 0
):
    """Get all notifications for the current user"""
    notifications = db.query(Notification).filter(
        Notification.target_user_id == current_user.id
    ).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    
    return notifications

@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.target_user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.target_user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted"}

@router.patch("/mark-all-read")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for the current user"""
    db.query(Notification).filter(
        Notification.target_user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    
    return {"message": "All notifications marked as read"}

@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    unread_count = db.query(Notification).filter(
        Notification.target_user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return {"unread_count": unread_count}

# =====================================
# NEW NOTIF ENDPOINTS AS PER REQUEST
# =====================================

# 1. MARK ALL AS READ ENDPOINT
@router.patch("/read/all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marks all unread notifications for the user as read."""
    # Bulk update for efficiency
    db.query(Notification).filter(
        Notification.target_user_id == current_user.id,
        Notification.is_read == False
    ).update({Notification.is_read: True}, synchronize_session=False)
    
    db.commit()
    return {"message": "All notifications marked as read"}

# 2. DELETE NOTIFICATION ENDPOINT
@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Permanently deletes a notification."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.target_user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted"}

# 3. MARK SINGLE AS READ (Ensure you have this too)
@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.target_user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    return {"message": "Marked as read"}