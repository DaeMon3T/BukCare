from sqlalchemy.orm import Session
from models.doctor import Doctor 
from models.users import User

def enrich_appointments_with_doctor_data(appointments, db: Session):
    results = []
    for appointment in appointments:
        # 1. Fetch Specialization
        doc_profile = db.query(Doctor).filter(Doctor.user_id == appointment.doctor_id).first()
        specialization = doc_profile.specialization if doc_profile else "General Practice"
        
        # 2. Fetch Avatar (Safe check)
        avatar = None
        if appointment.doctor and hasattr(appointment.doctor, "avatar"):
            avatar = appointment.doctor.avatar

        results.append({
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "patient_name": f"{appointment.patient.fname} {appointment.patient.lname}",
            "doctor_id": appointment.doctor_id,
            "doctor_name": f"{appointment.doctor.fname} {appointment.doctor.lname}",
            "doctor_avatar": avatar,         
            "doctor_specialization": specialization,
            "appointment_date": appointment.appointment_date,
            "reason": appointment.reason,
            "status": appointment.status.value,
            "notes": appointment.notes,
            "created_at": appointment.created_at,
            "updated_at": appointment.updated_at
        })
    return results