from fastapi import FastAPI

from backend.app.api.agents import (
    router as agents_router,
)
from backend.app.api.routes import router as system_router

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="AI Employee Autonomy Governor",
    description=(
        "Measure, simulate and optimize "
        "safe autonomy for AI employees."
    ),
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    system_router,
    prefix="/api/v1",
)


app.include_router(
    agents_router,
    prefix="/api/v1",
)


@app.get("/")
def root():

    return {
        "message":
            "AI Employee Autonomy Governor API",

        "docs":
            "/docs",
    }
