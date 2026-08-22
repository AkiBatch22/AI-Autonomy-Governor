from fastapi import APIRouter


router = APIRouter(tags=["System"])


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Employee Autonomy Governor",
    }
