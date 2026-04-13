import os
import shutil
import uuid
from datetime import date as DateType, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from database import get_db
from models.receipt import Receipt, ReceiptItem
from services.agent_pipeline import process_receipt_with_agents as process_receipt_file

router = APIRouter(prefix="/api/receipts", tags=["receipts"])

_is_vercel = os.getenv("VERCEL") == "1"
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/uploads" if _is_vercel else "./uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


class ReceiptUpdate(BaseModel):
    store_name: Optional[str] = None
    date: Optional[DateType] = None
    total_amount: Optional[int] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None


def _image_url(image_path: str | None) -> str | None:
    """로컬 파일 경로 → 클라이언트에서 접근 가능한 URL로 변환
    Vercel 배포 시 experimentalServices 라우트 프리픽스(/_/backend) 적용
    """
    if not image_path:
        return None
    filename = os.path.basename(image_path)
    prefix = "/_/backend" if os.getenv("VERCEL") == "1" else ""
    return f"{prefix}/uploads/{filename}"


def receipt_to_dict(receipt: Receipt) -> dict:
    return {
        "id": receipt.id,
        "store_name": receipt.store_name,
        "date": receipt.date.isoformat() if receipt.date else None,
        "total_amount": receipt.total_amount,
        "category": receipt.category,
        "payment_method": receipt.payment_method,
        "image_url": _image_url(receipt.image_path),
        "items": [{"id": i.id, "name": i.name, "price": i.price} for i in receipt.items],
        "created_at": receipt.created_at.isoformat() if receipt.created_at else None,
    }


@router.post("/upload")
async def upload_receipt(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 파일 확장자 검증
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식입니다: {ext}")

    # 파일 크기 검증
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기가 10MB를 초과합니다.")

    # 파일 저장
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(content)

    # LangChain 파이프라인 실행 (PDF는 페이지별 복수 결과)
    try:
        parsed_list = process_receipt_file(file_path)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"영수증 처리 실패: {str(e)}")

    if not parsed_list:
        os.remove(file_path)
        raise HTTPException(status_code=422, detail="영수증 내용을 인식하지 못했습니다.")

    # 파싱된 영수증 수만큼 DB 저장
    saved = []
    for parsed in parsed_list:
        raw_date = parsed.get("date")
        if isinstance(raw_date, str):
            try:
                receipt_date = datetime.strptime(raw_date, "%Y-%m-%d").date()
            except ValueError:
                receipt_date = DateType.today()
        elif isinstance(raw_date, DateType):
            receipt_date = raw_date
        else:
            receipt_date = DateType.today()

        receipt = Receipt(
            store_name=parsed.get("store_name", "알 수 없음"),
            date=receipt_date,
            total_amount=parsed.get("total_amount", 0),
            category=parsed.get("category", "기타"),
            payment_method=parsed.get("payment_method"),
            image_path=file_path,
            raw_text=parsed.get("raw_text"),
        )
        db.add(receipt)
        db.flush()

        for item in parsed.get("items", []):
            db.add(ReceiptItem(receipt_id=receipt.id, name=item["name"], price=item["price"]))

        db.refresh(receipt)
        saved.append(receipt_to_dict(receipt))

    db.commit()

    # 단건이면 dict, 복수이면 list 반환
    return saved[0] if len(saved) == 1 else saved


@router.get("")
def get_receipts(
    start_date: Optional[DateType] = Query(None),
    end_date: Optional[DateType] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    query = db.query(Receipt)

    if start_date:
        query = query.filter(Receipt.date >= start_date)
    if end_date:
        query = query.filter(Receipt.date <= end_date)
    if category:
        query = query.filter(Receipt.category == category)
    if search:
        query = query.filter(Receipt.store_name.ilike(f"%{search}%"))

    total = query.count()
    items = query.order_by(Receipt.date.desc()).offset((page - 1) * 10).limit(10).all()

    return {
        "total": total,
        "page": page,
        "items": [receipt_to_dict(r) for r in items],
    }


@router.put("/{receipt_id}")
def update_receipt(receipt_id: int, data: ReceiptUpdate, db: Session = Depends(get_db)):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="영수증을 찾을 수 없습니다.")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(receipt, field, value)

    db.commit()
    db.refresh(receipt)
    return receipt_to_dict(receipt)


@router.delete("/{receipt_id}")
def delete_receipt(receipt_id: int, db: Session = Depends(get_db)):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="영수증을 찾을 수 없습니다.")

    # 이미지 파일 삭제
    if receipt.image_path and os.path.exists(receipt.image_path):
        os.remove(receipt.image_path)

    db.delete(receipt)
    db.commit()
    return {"message": "삭제되었습니다."}
