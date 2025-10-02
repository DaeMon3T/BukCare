# schemas/address.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class ProvinceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class ProvinceCreate(ProvinceBase):
    pass

class Province(ProvinceBase):
    model_config = ConfigDict(from_attributes=True)
    province_id: int

class CityMunicipalityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    zip_code: Optional[str] = Field(None, max_length=10)
    province_id: int

class CityMunicipalityCreate(CityMunicipalityBase):
    pass

class CityMunicipality(CityMunicipalityBase):
    model_config = ConfigDict(from_attributes=True)
    city_municipality_id: int
    province: Optional[Province] = None

class AddressBase(BaseModel):
    street: str = Field(..., min_length=1, max_length=255)
    barangay: str = Field(..., min_length=1, max_length=100)
    city_municipality_id: int

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    street: Optional[str] = Field(None, min_length=1, max_length=255)
    barangay: Optional[str] = Field(None, min_length=1, max_length=100)
    city_municipality_id: Optional[int] = None

class Address(AddressBase):
    model_config = ConfigDict(from_attributes=True)
    address_id: int
    city_municipality: Optional[CityMunicipality] = None
