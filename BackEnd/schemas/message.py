from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum

# 1. Enums
class MessageType(str, Enum):
    TEXT = "text"
    APPOINTMENT_REMINDER = "appointment_reminder"

# 2. Shared Base
class MessageBase(BaseModel):
    receiver_id: int
    content: Optional[str] = None 

# 3. Input Schema (Creating a Message)
class MessageCreate(MessageBase):
    message_type: MessageType = MessageType.TEXT
    appointment_id: Optional[int] = None

# 4. Special Input for the "Remind Button"
class ReminderRequest(BaseModel):
    receiver_id: int
    appointment_id: int

# 5. Nested Appointment Data (for the Frontend Card)
class AppointmentSnippet(BaseModel):
    id: int
    appointment_date: datetime
    status: str
    reason: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# 6. Response Schema (Reading Messages)
class MessageResponse(MessageBase):
    id: int
    sender_id: int
    timestamp: datetime
    is_read: bool
    
    # Rich Data Fields
    message_type: MessageType
    appointment: Optional[AppointmentSnippet] = None 

    model_config = ConfigDict(from_attributes=True)

# 7. For the Conversation List
class ConversationItem(BaseModel):
    user_id: int
    name: str
    role: str
    picture: Optional[str] = None
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int

# 8. For Search
class UserSearchItem(BaseModel):
    id: int
    name: str
    role: str
    picture: Optional[str] = None