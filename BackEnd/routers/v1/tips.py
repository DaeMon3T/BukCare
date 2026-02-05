import os
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from groq import Groq
from dotenv import load_dotenv

from core.database import get_db
from models.users import User
from models.appointment import Appointment
from models.doctor import Doctor
from .dependencies import get_current_user

load_dotenv()

# LOAD CONFIG
API_KEY = os.getenv("GROQ_API_KEY")

# INITIALIZE GROQ CLIENT
MODEL_NAME = "llama-3.3-70b-versatile"

if API_KEY:
    client = Groq(api_key=API_KEY)
else:
    client = None
    print("[WARNING] GROQ_API_KEY is missing.")

router = APIRouter(
    prefix="/tips",
    tags=["Health Tips"]
)

@router.get("/daily", status_code=status.HTTP_200_OK)
def get_daily_tip(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fail fast if no API key
    if not client:
        return {"category": "System", "text": "Stay hydrated and get enough sleep.", "source": "BukCare System"}

    try:
        # --- GATHER CONTEXT ---
        current_hour = datetime.now().hour
        time_of_day = "Morning" if 5 <= current_hour < 12 else "Afternoon" if 12 <= current_hour < 18 else "Evening"
        start_of_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

        upcoming_appointment = db.query(Appointment)\
            .options(joinedload(Appointment.doctor))\
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
            if upcoming_appointment.doctor:
                doctor_name = upcoming_appointment.doctor.lname
            
            doctor_profile = db.query(Doctor).filter(Doctor.user_id == upcoming_appointment.doctor_id).first()
            if doctor_profile:
                 if hasattr(doctor_profile, "specializations_json") and doctor_profile.specializations_json:
                    specs = doctor_profile.specializations_json
                    specialization = specs[0] if isinstance(specs, list) and len(specs) > 0 else str(specs)
                 elif hasattr(doctor_profile, "specialization") and doctor_profile.specialization:
                    specialization = doctor_profile.specialization

        # --- PROMPT ---
        system_prompt = "You are BukCare AI. Output ONE short, actionable health tip (max 20 words)."
        
        user_prompt = f"""
        User: {current_user.fname}
        Time: {time_of_day}
        Context: Appointment with {specialization} (Dr. {doctor_name}). Status: {appt_status}.
        """

        # --- CALL GROQ ---
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model=MODEL_NAME,
            temperature=0.5,
            max_tokens=50,
        )
        
        ai_tip = response.choices[0].message.content.strip().replace('"', '').replace("'", "")
        
        return {
            "category": specialization if upcoming_appointment else "Daily Wellness",
            "text": ai_tip,
            "source": "BukCare AI (Llama 3)"
        }

    except Exception as e:
        print(f"[ERROR] AI Generation Failed: {e}")
        # Return fallback so app doesn't crash
        return {
            "category": "Wellness",
            "text": "Maintain a balanced diet and stay hydrated for optimal health.",
            "source": "BukCare System"
        }