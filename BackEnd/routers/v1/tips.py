import os
import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime
from google import genai
from google.api_core.exceptions import ResourceExhausted, NotFound 
from dotenv import load_dotenv

from core.database import get_db
from models.users import User
from models.appointment import Appointment
from models.doctor import Doctor
from .dependencies import get_current_user

load_dotenv()

# LOAD CONFIG FROM ENV
API_KEY = os.getenv("GEMINI_API_KEY")

# FIX: Use the EXACT version number to avoid 404s
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-001") 

if API_KEY:
    client = genai.Client(api_key=API_KEY)
else:
    client = None
    print("[WARNING] GEMINI_API_KEY is missing.")

router = APIRouter(
    prefix="/tips",
    tags=["Health Tips"]
)

@router.get("/daily", status_code=status.HTTP_200_OK)
def get_daily_tip(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # FAIL FAST: If no client, return fallback immediately
    if not client:
        return {"category": "System", "text": "Stay hydrated and get enough sleep.", "source": "BukCare System"}

    try:
        # --- GATHER CONTEXT ---
        current_hour = datetime.now().hour
        time_of_day = "Morning" if 5 <= current_hour < 12 else "Afternoon" if 12 <= current_hour < 18 else "Evening"
        start_of_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

        upcoming_appointment = db.query(Appointment)\
            .filter(Appointment.patient_id == current_user.id)\
            .filter(Appointment.status.in_(["pending", "confirmed"]))\
            .filter(Appointment.appointment_date >= start_of_day)\
            .order_by(Appointment.appointment_date.asc())\
            .first()

        specialization = "General Health"
        doctor_name = "your doctor"
        appt_status = "none"

        if upcoming_appointment:
            appt_status = upcoming_appointment.status
            doctor = db.query(Doctor).filter(Doctor.doctor_id == upcoming_appointment.doctor_id).first()
            if doctor:
                specialization = doctor.specialization or "Medical Specialist"
                doctor_name = doctor.name

        # --- PROMPT ---
        prompt = f"""
        You are "BukCare AI", a professional medical assistant.
        User: {current_user.fname}
        Time: {time_of_day}
        Context: Appointment with {specialization} (Dr. {doctor_name}). Status: {appt_status}.
        
        Task: Write ONE short, professional health tip (max 20 words).
        
        CRITICAL INSTRUCTIONS:
        1. BE CLINICAL & ACTIONABLE: Focus on preparation and symptom tracking.
        2. IF PENDING: "While waiting for confirmation, document your symptoms daily."
        3. TONE: Professional, concise, objective.
        """

        # --- CALL GEMINI ---
        response = client.models.generate_content(
            model=MODEL_NAME, 
            contents=prompt
        )
        
        ai_tip = response.text.strip().replace('"', '').replace("'", "")
        
        return {
            "category": specialization if upcoming_appointment else time_of_day,
            "text": ai_tip,
            "source": "BukCare AI"
        }

    # HANDLE RATE LIMITS (429)
    except ResourceExhausted:
        print(f"[WARNING] Gemini Rate Limit Hit ({MODEL_NAME}). Serving fallback.")
        return {
            "category": "Wellness",
            "text": "Prioritize sleep and hydration while our AI recharges.",
            "source": "BukCare System"
        }

    # HANDLE MODEL NOT FOUND (404)
    except NotFound:
        print(f"[WARNING] Gemini Model '{MODEL_NAME}' Not Found. Check .env or API version.")
        return {
            "category": "Wellness",
            "text": "Daily Tip: A short walk improves circulation and mood.",
            "source": "BukCare System"
        }

    # CATCH EVERYTHING ELSE
    except Exception as e:
        print(f"[ERROR] AI Generation Failed: {e}")
        return {
            "category": "Wellness",
            "text": "Maintain a balanced diet and stay hydrated for optimal health.",
            "source": "BukCare System"
        }