from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class AddressBase(BaseModel):
    street: str = Field(..., min_length=1, max_length=255)
    barangay: str = Field(..., min_length=1, max_length=100)
    city: str = Field(..., min_length=1, max_length=100)
    province: str = Field(..., min_length=1, max_length=100)
    zip_code: Optional[str] = Field(None, max_length=10)
    country: Optional[str] = Field("Philippines", max_length=50)


class AddressCreate(AddressBase):
    """Schema for creating a new address entry."""
    pass


class AddressUpdate(BaseModel):
    """Schema for updating address information."""
    street: Optional[str] = Field(None, min_length=1, max_length=255)
    barangay: Optional[str] = Field(None, min_length=1, max_length=100)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    province: Optional[str] = Field(None, min_length=1, max_length=100)
    zip_code: Optional[str] = Field(None, max_length=10)
    country: Optional[str] = Field(None, max_length=50)


class Address(AddressBase):
    """Schema for returning address data."""
    model_config = ConfigDict(from_attributes=True)
    address_id: int
