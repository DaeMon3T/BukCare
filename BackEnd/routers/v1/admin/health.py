# health.py
from fastapi import APIRouter
from datetime import datetime, timedelta

router = APIRouter()

# Record API start time
app_start_time = datetime.utcnow()

def format_uptime(seconds: float) -> str:
    td = timedelta(seconds=int(seconds))
    days = td.days
    hours, remainder = divmod(td.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    result = []
    if days:
        result.append(f"{days}d")
    if hours:
        result.append(f"{hours}h")
    if minutes:
        result.append(f"{minutes}m")
    result.append(f"{seconds}s")
    return " ".join(result)

@router.get("/health")
def health_check():
    uptime_seconds = (datetime.utcnow() - app_start_time).total_seconds()
    return {
        "backend_status": "Healthy",
        "database_status": "Healthy",  # you can add real check here
        "uptime": format_uptime(uptime_seconds)
    }
