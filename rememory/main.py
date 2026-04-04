"""Re:Memory (기억을 엮다) — FastAPI 앱 진입점"""

import os
import sys

# bookprintapi SDK 경로 추가 (pip install 없이도 동작)
_sdk_root = os.path.join(os.path.dirname(__file__), "..")
if _sdk_root not in sys.path:
    sys.path.insert(0, _sdk_root)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import config
from database import engine, Base, run_migrations, run_seed
from routes import projects, interviews, orders

# DB 테이블 자동 생성
Base.metadata.create_all(bind=engine)

# 기존 DB 스키마 마이그레이션 (새 컬럼 추가)
run_migrations()

# 최초 실행 시 더미 데이터 삽입
run_seed()

app = FastAPI(
    title="Re:Memory — 기억을 엮다",
    description="Book Print API 연동 가족 회고록 제작 서비스",
    version="1.0.0",
)


# CORS — React dev server (localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 마운트
os.makedirs(config.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), "data", "sample_photos"), exist_ok=True)

app.mount("/uploads", StaticFiles(directory=config.UPLOAD_DIR), name="uploads")
app.mount("/data", StaticFiles(directory="data"), name="data")

# 라우터 등록
app.include_router(projects.router)
app.include_router(interviews.router)
app.include_router(orders.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
