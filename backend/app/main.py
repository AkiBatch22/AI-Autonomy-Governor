import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.agents import router as agents_router
from backend.app.api.routes import router as system_router


app = FastAPI(
    title="AI Employee Autonomy Governor",
    description=(
        "Measure, simulate and optimize "
        "safe autonomy for AI employees."
    ),
    version="0.2.0",
)


# =========================================================
# CORS
# =========================================================

local_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


production_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "",
    ).split(",")
    if origin.strip()
]


allowed_origins = [
    *local_origins,
    *production_origins,
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(
    system_router,
    prefix="/api/v1",
)


app.include_router(
    agents_router,
    prefix="/api/v1",
)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message":
            "AI Employee Autonomy Governor API",
        "docs":
            "/docs",
    }