from sqlalchemy.orm import Session
from models.audit_log import AuditLog, AuditActionType

def log_audit_action(
    db: Session,
    action: AuditActionType,
    entity_name: str,
    entity_id: int = None,
    user_id: int = None,
    details: str = None,
    ip_address: str = None
):
    try:
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_name=entity_name,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        # Non-blocking, print/log the error so it doesn't break main app flows
        print(f"Failed to write audit log: {e}")
