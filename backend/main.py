from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

load_dotenv()

from database import engine, Base
import models.receipt  # 테이블 생성을 위해 모델 임포트
from routers import receipts, stats

# DB 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(title="영수증 지출 관리 API", version="1.0.0")

# CORS 설정 (React 개발 서버 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 업로드 파일 정적 서빙
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# 라우터 등록
app.include_router(receipts.router)
app.include_router(stats.router)


@app.get("/")
def root():
    return {"message": "영수증 지출 관리 API가 실행 중입니다."}


@app.get("/health")
def health():
    return {"status": "ok"}
