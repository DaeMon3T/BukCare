import os
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from groq import Groq
from dotenv import load_dotenv

from core.database import get_db
from models.users import User
from models.appointment import Appointment
from models.doctor import Doctor, Specialization
from .dependencies import get_current_user

load_dotenv()

# ─── GROQ CONFIG ───
API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = "llama-3.3-70b-versatile"

if API_KEY:
    client = Groq(api_key=API_KEY)
else:
    client = None
    print("[WARNING] GROQ_API_KEY is missing — health insights will use fallback tips.")

router = APIRouter(prefix="/tips", tags=["Health Tips"])


# ─── SPECIALIZATION-AWARE PROMPT TEMPLATES ───
SPECIALIZATION_PROMPTS = {
    "Cardiology": "Focus on heart health: blood pressure monitoring, cholesterol management, exercise for cardiovascular fitness, or dietary tips for heart health.",
    "Neurology": "Focus on brain and nervous system health: sleep quality, stress management, cognitive exercises, or migraine prevention tips.",
    "Pediatrics": "Focus on child health: vaccination reminders, child nutrition, developmental milestones, or managing childhood illnesses.",
    "Dermatology": "Focus on skin health: sun protection, hydration for skin, skincare routines, or when to see a dermatologist.",
    "Orthopedics": "Focus on bone and joint health: posture tips, calcium intake, stretching exercises, or injury prevention.",
    "Ophthalmology": "Focus on eye health: screen time management, eye exercises, regular eye check-ups, or UV protection for eyes.",
    "Psychiatry": "Focus on mental health: stress coping mechanisms, mindfulness practices, sleep hygiene, or recognizing anxiety symptoms.",
    "Surgery": "Focus on pre/post-surgical care: rest and recovery, wound care, nutrition for healing, or when to seek follow-up.",
    "Obstetrics and Gynecology": "Focus on women's health: reproductive health awareness, prenatal care, breast health, or menstrual health tips.",
    "Internal Medicine": "Focus on preventive internal medicine: regular health screenings, managing chronic conditions, hydration, or balanced diet.",
    "General Practice": "Focus on general wellness: staying active, balanced nutrition, hydration, sleep quality, or preventive check-ups.",
}


def _build_prompt(user: User, specialization: str, doctor_name: str, appt_status: str, time_of_day: str) -> tuple:
    """Build system + user prompts for the Groq LLM call."""

    spec_contexts = []
    # Split by comma in case of multiple specializations
    for spec in [s.strip() for s in specialization.split(",")]:
        ctx = SPECIALIZATION_PROMPTS.get(spec)
        if ctx:
            spec_contexts.append(ctx)
            
    if spec_contexts:
        # Join multiple contexts if they have more than one listed specialization
        spec_context = " Additionally, ".join(spec_contexts)
    else:
        # Robust fallback for unlisted custom specializations entered during registration
        spec_context = f"Focus on health tips relevant to {specialization} medicine."

    system_prompt = f"""You are BukCare AI, a friendly health assistant. Generate ONE personalized, actionable health tip.

Rules:
- Maximum 25 words
- Be warm and encouraging
- Never diagnose or prescribe medication
- Do NOT use quotation marks
- {spec_context}"""

    user_prompt = f"""Patient: {user.fname}
Time of day: {time_of_day}
Upcoming appointment: {specialization} specialist (Dr. {doctor_name})
Appointment status: {appt_status}

Generate a relevant health tip for this patient based on their upcoming {specialization} appointment."""

    return system_prompt, user_prompt


@router.get("/daily", status_code=status.HTTP_200_OK)
def get_daily_tip(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not client:
        return {
            "category": "Wellness",
            "text": "Stay hydrated and get enough sleep for optimal health.",
            "source": "BukCare System",
        }

    try:
        # ─── GATHER CONTEXT ───
        current_hour = datetime.now().hour
        time_of_day = (
            "Morning" if 5 <= current_hour < 12 else
            "Afternoon" if 12 <= current_hour < 18 else
            "Evening"
        )

        start_of_day = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

        # Find the patient's next upcoming appointment
        upcoming_appointment = (
            db.query(Appointment)
            .options(joinedload(Appointment.doctor))
            .filter(Appointment.patient_id == current_user.id)
            .filter(Appointment.status.in_(["pending", "confirmed"]))
            .filter(Appointment.appointment_date >= start_of_day)
            .order_by(Appointment.appointment_date.asc())
            .first()
        )

        specialization = "General Practice"
        doctor_name = "your doctor"
        appt_status = "none"

        if upcoming_appointment:
            appt_status = upcoming_appointment.status

            # Get doctor display name from User record
            if upcoming_appointment.doctor:
                fname = upcoming_appointment.doctor.fname or ""
                lname = upcoming_appointment.doctor.lname or ""
                doctor_name = f"{fname} {lname}".strip() or "your doctor"

            # Get specialization from the Doctor profile's many-to-many relationship
            doctor_profile = (
                db.query(Doctor)
                .options(joinedload(Doctor.specializations))
                .filter(Doctor.user_id == upcoming_appointment.doctor_id)
                .first()
            )

            if doctor_profile and doctor_profile.specializations:
                # Use ALL specializations from the M2M relationship
                spec_names = [s.name for s in doctor_profile.specializations if s.name]
                if spec_names:
                    specialization = ", ".join(spec_names)
            elif doctor_profile and doctor_profile.specializations_json:
                # Fallback: legacy JSON field
                specs = doctor_profile.specializations_json
                if isinstance(specs, list) and len(specs) > 0:
                    specialization = ", ".join(specs)
                elif isinstance(specs, str):
                    clean_specs = specs.replace("[", "").replace("]", "").replace('"', '').replace("'", "")
                    specialization = ", ".join([s.strip() for s in clean_specs.split(",") if s.strip()])

        # ─── BUILD PROMPT ───
        system_prompt, user_prompt = _build_prompt(
            current_user, specialization, doctor_name, appt_status, time_of_day
        )

        # ─── CALL GROQ ───
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model=MODEL_NAME,
            temperature=0.7,
            max_tokens=60,
        )

        ai_tip = response.choices[0].message.content.strip().strip('"').strip("'")

        return {
            "category": specialization if upcoming_appointment else "Daily Wellness",
            "text": ai_tip,
            "doctor_name": doctor_name if upcoming_appointment else None,
            "source": "BukCare AI (Llama 3.3)",
        }

    except Exception as e:
        print(f"[ERROR] AI tip generation failed: {e}")
        return {
            "category": "Wellness",
            "text": "Maintain a balanced diet and stay active for optimal health.",
            "source": "BukCare System",
        }