# schemas/notification.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    target_user_id: int
    message: str = Field(..., min_length=1)
    source_user_id: Optional[int] = None
    appointment_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    message: Optional[str] = Field(None, min_length=1)
    status: Optional[bool] = None  # False=Unread, True=Read

class Notification(NotificationBase):
    model_config = ConfigDict(from_attributes=True)
    notification_id: int
    created_at: datetime
    updated_at: datetime
    status: bool
    source_user: Optional[User] = None
    target_user: Optional[User] = None
    appointment: Optional[Appointment] = None