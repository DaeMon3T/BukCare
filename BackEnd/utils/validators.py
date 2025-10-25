# utils/validators.py
import re
from typing import Optional
from fastapi import HTTPException, status

def validate_email(email: str) -> str:
    """Validate email format"""
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    return email.lower().strip()

def validate_password(password: str) -> str:
    """Validate password strength"""
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")
    
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    
    return password

def validate_phone_number(phone: str) -> str:
    """Validate phone number format"""
    if not phone:
        return ""
    
    # Remove all non-digit characters
    digits_only = re.sub(r'\D', '', phone)
    
    # Check if it's a valid length (7-15 digits)
    if len(digits_only) < 7 or len(digits_only) > 15:
        raise HTTPException(status_code=400, detail="Invalid phone number format")
    
    return digits_only

def validate_name(name: str, field_name: str = "Name") -> str:
    """Validate name fields"""
    if not name:
        raise HTTPException(status_code=400, detail=f"{field_name} is required")
    
    name = name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail=f"{field_name} must be at least 2 characters long")
    
    if len(name) > 50:
        raise HTTPException(status_code=400, detail=f"{field_name} must be less than 50 characters")
    
    # Check for valid characters (letters, spaces, hyphens, apostrophes)
    if not re.match(r"^[a-zA-Z\s\-']+$", name):
        raise HTTPException(status_code=400, detail=f"{field_name} contains invalid characters")
    
    return name

def validate_role(role: str) -> str:
    """Validate user role"""
    valid_roles = ["admin", "doctor", "patient", "pending"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    return role

def sanitize_string(value: str, max_length: int = 255) -> str:
    """Sanitize string input"""
    if not value:
        return ""
    
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>"\']', '', value.strip())
    
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized

def validate_date_of_birth(dob: str) -> str:
    """Validate date of birth format"""
    if not dob:
        raise HTTPException(status_code=400, detail="Date of birth is required")
    
    try:
        from datetime import datetime
        parsed_date = datetime.strptime(dob, "%Y-%m-%d")
        
        # Check if date is not in the future
        if parsed_date > datetime.now():
            raise HTTPException(status_code=400, detail="Date of birth cannot be in the future")
        
        # Check if age is reasonable (between 0 and 150 years)
        age = (datetime.now() - parsed_date).days // 365
        if age < 0 or age > 150:
            raise HTTPException(status_code=400, detail="Invalid age")
        
        return dob
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

def validate_appointment_date(appointment_date: str) -> str:
    """Validate appointment date"""
    if not appointment_date:
        raise HTTPException(status_code=400, detail="Appointment date is required")
    
    try:
        from datetime import datetime, timedelta
        parsed_date = datetime.fromisoformat(appointment_date.replace('Z', '+00:00'))
        
        # Check if appointment is not in the past
        if parsed_date < datetime.now():
            raise HTTPException(status_code=400, detail="Appointment cannot be in the past")
        
        # Check if appointment is not too far in the future (1 year max)
        max_future_date = datetime.now() + timedelta(days=365)
        if parsed_date > max_future_date:
            raise HTTPException(status_code=400, detail="Appointment cannot be more than 1 year in the future")
        
        return appointment_date
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

def validate_file_upload(filename: str, file_size: int, allowed_extensions: list = None) -> bool:
    """Validate file upload"""
    if not filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    # Check file extension
    if allowed_extensions:
        file_ext = filename.split('.')[-1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
    
    # Check file size (10MB max)
    max_size = 10 * 1024 * 1024  # 10MB
    if file_size > max_size:
        raise HTTPException(status_code=400, detail="File size too large. Maximum size is 10MB")
    
    return True

def validate_json_input(data: dict, required_fields: list = None) -> dict:
    """Validate JSON input data"""
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Input must be a JSON object")
    
    if required_fields:
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required fields: {', '.join(missing_fields)}"
            )
    
    return data
