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

# CORS 설정
# CORS_ORIGINS 환경변수로 허용할 Origin 지정 (쉼표 구분)
# 미설정 시: 개발 환경(localhost) 허용
_raw_origins = os.getenv("CORS_ORIGINS", "")
_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
if not _origins:
    _origins = ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 업로드 파일 정적 서빙
# Vercel 환경에서는 읽기 전용 파일시스템이므로 /tmp 사용
_is_vercel = os.getenv("VERCEL") == "1"
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/uploads" if _is_vercel else "./uploads")
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
