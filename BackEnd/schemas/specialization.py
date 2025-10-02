# schemas/specialization.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class SpecializationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    descriptions: Optional[str] = Field(None, max_length=500)

class SpecializationCreate(SpecializationBase):
    pass

class SpecializationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    descriptions: Optional[str] = Field(None, max_length=500)

class Specialization(SpecializationBase):
    model_config = ConfigDict(from_attributes=True)
    specialization_id: int