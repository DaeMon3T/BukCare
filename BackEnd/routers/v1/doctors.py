from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_doctors():
    return {"message": "Doctors route working!"}
