"""Re:Memory FastAPI entrypoint."""

import os
import sys

_sdk_root = os.path.join(os.path.dirname(__file__), "..")
if _sdk_root not in sys.path:
    sys.path.insert(0, _sdk_root)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import config
from database import Base, engine, run_migrations, run_seed
from routes import interviews, orders, projects

Base.metadata.create_all(bind=engine)
run_migrations()
run_seed()

app = FastAPI(
    title="Re:Memory",
    description="BookPrint API 기반 가족 회고록 제작 서비스",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(config.UPLOAD_DIR, exist_ok=True)
os.makedirs(config.DATA_DIR / "sample_photos", exist_ok=True)

app.mount("/uploads", StaticFiles(directory=config.UPLOAD_DIR), name="uploads")
app.mount("/data", StaticFiles(directory=str(config.DATA_DIR)), name="data")

app.include_router(projects.router)
app.include_router(interviews.router)
app.include_router(orders.router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
