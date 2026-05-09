from sqlalchemy import Column, Integer, ForeignKey, Boolean, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


class DoctorStaffAccess(Base):
    """
    Tracks which staff members have access to which doctor's records,
    with granular permission flags.
    """
    __tablename__ = "doctor_staff_access"

    id = Column(Integer, primary_key=True, autoincrement=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    staff_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Granular permissions
    can_view_appointments = Column(Boolean, default=True, nullable=False)
    can_manage_appointments = Column(Boolean, default=False, nullable=False)
    can_book_walkins = Column(Boolean, default=False, nullable=False)
    can_register_patients = Column(Boolean, default=False, nullable=False)

    granted_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    doctor = relationship("User", foreign_keys=[doctor_id])
    staff = relationship("User", foreign_keys=[staff_user_id])

    # One access record per doctor–staff pair
    __table_args__ = (
        UniqueConstraint("doctor_id", "staff_user_id", name="uq_doctor_staff"),
    )

    def __repr__(self):
        return f"<DoctorStaffAccess(doctor_id={self.doctor_id}, staff_user_id={self.staff_user_id})>"
