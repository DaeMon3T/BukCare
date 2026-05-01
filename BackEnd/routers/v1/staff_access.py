from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from core.database import get_db
from models.users import User, UserRole
from models.doctor_staff_access import DoctorStaffAccess
from routers.v1.dependencies import get_current_user

router = APIRouter()


# ============================================
# Pydantic Schemas
# ============================================

class GrantAccessRequest(BaseModel):
    staff_user_id: int
    can_view_appointments: bool = True
    can_manage_appointments: bool = False
    can_book_walkins: bool = False
    can_register_patients: bool = False

class UpdateAccessRequest(BaseModel):
    can_view_appointments: Optional[bool] = None
    can_manage_appointments: Optional[bool] = None
    can_book_walkins: Optional[bool] = None
    can_register_patients: Optional[bool] = None

class StaffAccessResponse(BaseModel):
    id: int
    doctor_id: int
    staff_user_id: int
    staff_name: str
    staff_email: str
    staff_picture: Optional[str] = None
    can_view_appointments: bool
    can_manage_appointments: bool
    can_book_walkins: bool
    can_register_patients: bool
    granted_at: Optional[str] = None

class DoctorAccessResponse(BaseModel):
    id: int
    doctor_id: int
    doctor_name: str
    doctor_email: str
    doctor_picture: Optional[str] = None
    can_view_appointments: bool
    can_manage_appointments: bool
    can_book_walkins: bool
    can_register_patients: bool
    granted_at: Optional[str] = None


# ============================================
# DOCTOR ENDPOINTS
# ============================================

@router.get("/my-staff", response_model=List[StaffAccessResponse])
def get_my_staff(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all staff members this doctor has granted access to."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can manage staff access")

    access_list = db.query(DoctorStaffAccess).filter_by(doctor_id=current_user.id).all()

    results = []
    for access in access_list:
        staff_user = db.query(User).filter_by(id=access.staff_user_id).first()
        if staff_user:
            results.append(StaffAccessResponse(
                id=access.id,
                doctor_id=access.doctor_id,
                staff_user_id=access.staff_user_id,
                staff_name=f"{staff_user.fname} {staff_user.lname}",
                staff_email=staff_user.email,
                staff_picture=staff_user.picture,
                can_view_appointments=access.can_view_appointments,
                can_manage_appointments=access.can_manage_appointments,
                can_book_walkins=access.can_book_walkins,
                can_register_patients=access.can_register_patients,
                granted_at=access.granted_at.isoformat() if access.granted_at else None,
            ))
    return results


@router.get("/available-staff", response_model=List[dict])
def get_available_staff(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all approved staff users that the doctor can grant access to."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can search staff")

    # Get IDs of staff already granted access by this doctor
    already_granted = [
        a.staff_user_id for a in
        db.query(DoctorStaffAccess).filter_by(doctor_id=current_user.id).all()
    ]

    # Find all approved staff not yet granted
    staff_users = db.query(User).filter(
        User.role == UserRole.STAFF,
        User.is_staff_approved == True,
        User.is_active == True,
    ).all()

    return [
        {
            "id": s.id,
            "name": f"{s.fname} {s.lname}",
            "email": s.email,
            "picture": s.picture,
            "already_granted": s.id in already_granted,
        }
        for s in staff_users
    ]


@router.post("/grant", response_model=StaffAccessResponse)
def grant_access(
    data: GrantAccessRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Grant a staff member access to this doctor's records."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can grant staff access")

    # Validate staff user exists and is approved
    staff_user = db.query(User).filter_by(id=data.staff_user_id).first()
    if not staff_user or staff_user.role != UserRole.STAFF:
        raise HTTPException(status_code=404, detail="Staff user not found")
    if not staff_user.is_staff_approved:
        raise HTTPException(status_code=400, detail="Staff user is not approved yet")

    # Check for existing access
    existing = db.query(DoctorStaffAccess).filter_by(
        doctor_id=current_user.id,
        staff_user_id=data.staff_user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Access already granted to this staff member")

    access = DoctorStaffAccess(
        doctor_id=current_user.id,
        staff_user_id=data.staff_user_id,
        can_view_appointments=data.can_view_appointments,
        can_manage_appointments=data.can_manage_appointments,
        can_book_walkins=data.can_book_walkins,
        can_register_patients=data.can_register_patients,
    )
    db.add(access)
    db.commit()
    db.refresh(access)

    return StaffAccessResponse(
        id=access.id,
        doctor_id=access.doctor_id,
        staff_user_id=access.staff_user_id,
        staff_name=f"{staff_user.fname} {staff_user.lname}",
        staff_email=staff_user.email,
        staff_picture=staff_user.picture,
        can_view_appointments=access.can_view_appointments,
        can_manage_appointments=access.can_manage_appointments,
        can_book_walkins=access.can_book_walkins,
        can_register_patients=access.can_register_patients,
        granted_at=access.granted_at.isoformat() if access.granted_at else None,
    )


@router.put("/{access_id}", response_model=StaffAccessResponse)
def update_access(
    access_id: int,
    data: UpdateAccessRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update permission flags for an existing staff access grant."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can update staff access")

    access = db.query(DoctorStaffAccess).filter_by(
        id=access_id,
        doctor_id=current_user.id
    ).first()
    if not access:
        raise HTTPException(status_code=404, detail="Access record not found")

    if data.can_view_appointments is not None:
        access.can_view_appointments = data.can_view_appointments
    if data.can_manage_appointments is not None:
        access.can_manage_appointments = data.can_manage_appointments
    if data.can_book_walkins is not None:
        access.can_book_walkins = data.can_book_walkins
    if data.can_register_patients is not None:
        access.can_register_patients = data.can_register_patients

    db.commit()
    db.refresh(access)

    staff_user = db.query(User).filter_by(id=access.staff_user_id).first()
    return StaffAccessResponse(
        id=access.id,
        doctor_id=access.doctor_id,
        staff_user_id=access.staff_user_id,
        staff_name=f"{staff_user.fname} {staff_user.lname}" if staff_user else "Unknown",
        staff_email=staff_user.email if staff_user else "",
        staff_picture=staff_user.picture if staff_user else None,
        can_view_appointments=access.can_view_appointments,
        can_manage_appointments=access.can_manage_appointments,
        can_book_walkins=access.can_book_walkins,
        can_register_patients=access.can_register_patients,
        granted_at=access.granted_at.isoformat() if access.granted_at else None,
    )


@router.delete("/{access_id}")
def revoke_access(
    access_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a staff member's access to this doctor's records."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can revoke staff access")

    access = db.query(DoctorStaffAccess).filter_by(
        id=access_id,
        doctor_id=current_user.id
    ).first()
    if not access:
        raise HTTPException(status_code=404, detail="Access record not found")

    db.delete(access)
    db.commit()
    return {"message": "Staff access revoked successfully"}


# ============================================
# STAFF ENDPOINTS
# ============================================

@router.get("/my-doctors", response_model=List[DoctorAccessResponse])
def get_my_doctors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all doctors who have granted this staff member access."""
    if current_user.role != UserRole.STAFF:
        raise HTTPException(status_code=403, detail="Only staff can view their assigned doctors")

    access_list = db.query(DoctorStaffAccess).filter_by(staff_user_id=current_user.id).all()

    results = []
    for access in access_list:
        doctor_user = db.query(User).filter_by(id=access.doctor_id).first()
        if doctor_user:
            results.append(DoctorAccessResponse(
                id=access.id,
                doctor_id=access.doctor_id,
                doctor_name=f"{doctor_user.fname} {doctor_user.lname}",
                doctor_email=doctor_user.email,
                doctor_picture=doctor_user.picture,
                can_view_appointments=access.can_view_appointments,
                can_manage_appointments=access.can_manage_appointments,
                can_book_walkins=access.can_book_walkins,
                can_register_patients=access.can_register_patients,
                granted_at=access.granted_at.isoformat() if access.granted_at else None,
            ))
    return results
