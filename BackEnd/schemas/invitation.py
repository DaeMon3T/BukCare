# schemas/invitation.py
from pydantic import BaseModel, EmailStr

class InviteUserRequest(BaseModel):
    email: EmailStr
    role: str
