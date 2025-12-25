import os
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime

# ✅ NEW LIBRARY IMPORT
from google import genai

# Database Imports
from core.database import get_db
from models.users import User
from models.appointment import Appointment
from models.doctor import Doctor
from .dependencies import get_current_user

# --- CONFIGURATION ---
# SECURITY NOTE: Ideally, move this key to a .env file!
API_KEY = "AIzaSyBXu9GikPQ1X46N3ZNgie88WAoyX4TBlm8" 

# NEW CLIENT SETUP
client = genai.Client(api_key=API_KEY)

router = APIRouter(
    prefix="/tips",
    tags=["Health Tips"]
)

@router.get("/daily", status_code=status.HTTP_200_OK)
def get_daily_tip(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a personalized daily health tip using Google Gemini AI (New SDK).
    """
    
    # 1. Gather Context
    current_hour = datetime.now().hour
    time_of_day = "Morning" if 5 <= current_hour < 12 else "Afternoon" if 12 <= current_hour < 18 else "Evening"

    # Check for upcoming appointment
    upcoming_appointment = db.query(Appointment)\
        .filter(Appointment.patient_id == current_user.id)\
        .filter(Appointment.status == "confirmed")\
        .filter(Appointment.appointment_date > datetime.now())\
        .order_by(Appointment.appointment_date.asc())\
        .first()

    specialization = "General Health"
    doctor_name = "a doctor"
    
    if upcoming_appointment:
        doctor = db.query(Doctor).filter(Doctor.doctor_id == upcoming_appointment.doctor_id).first()
        if doctor:
            specialization = doctor.specialization or "General Health"
            doctor_name = doctor.name

    # 2. Construct the Prompt
    prompt = f"""
    You are a friendly medical AI assistant named "BukCare AI".
    Task: Write a SINGLE, short, actionable health tip (max 1 sentence) for a patient.
    
    Context:
    - Patient Name: {current_user.fname}
    - Time of Day: {time_of_day}
    - Upcoming Appointment: {specialization} with Dr. {doctor_name}
    
    Requirements:
    - If appointment exists, give advice preparing for {specialization}.
    - Else, give general wellness advice for {time_of_day}.
    - Tone: Encouraging, professional, concise.
    """

    try:
        # 3. Call the AI (NEW SYNTAX)
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite", 
            contents=prompt
        )
        
        ai_tip = response.text.strip()
        ai_tip = ai_tip.replace('"', '').replace("'", "")

        return {
            "category": specialization if upcoming_appointment else "Wellness",
            "text": ai_tip,
            "source": "BukCare AI (Gemini)"
        }

    except Exception as e:
        print(f"AI Generation Failed: {e}")
        return {
            "category": "General",
            "text": "Stay hydrated and take small steps towards better health today.",
            "source": "BukCare System"
        }