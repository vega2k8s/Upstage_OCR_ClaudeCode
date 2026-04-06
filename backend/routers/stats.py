from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
from models.receipt import Receipt
from datetime import date

router = APIRouter(prefix="/api/stats", tags=["stats"])


def _month_total(db: Session, year: int, month: int) -> int:
    return (
        db.query(func.sum(Receipt.total_amount))
        .filter(
            extract("year", Receipt.date) == year,
            extract("month", Receipt.date) == month,
        )
        .scalar() or 0
    )


@router.get("")
def get_stats(
    year: int = Query(...),
    month: int = Query(...),
    db: Session = Depends(get_db),
):
    # 이번 달 총 지출
    monthly_total = _month_total(db, year, month)

    # 전월 계산
    if month == 1:
        prev_year, prev_month = year - 1, 12
    else:
        prev_year, prev_month = year, month - 1
    prev_total = _month_total(db, prev_year, prev_month)

    # 카테고리별 지출
    category_rows = (
        db.query(Receipt.category, func.sum(Receipt.total_amount).label("amount"))
        .filter(
            extract("year", Receipt.date) == year,
            extract("month", Receipt.date) == month,
        )
        .group_by(Receipt.category)
        .order_by(func.sum(Receipt.total_amount).desc())
        .all()
    )

    by_category = [
        {
            "category": row.category,
            "amount": row.amount,
            "ratio": round(row.amount / monthly_total * 100) if monthly_total > 0 else 0,
        }
        for row in category_rows
    ]

    # 월별 추이 (최근 12개월 — 선택한 월 포함 이전 12개월)
    trend_rows = (
        db.query(
            extract("year", Receipt.date).label("y"),
            extract("month", Receipt.date).label("m"),
            func.sum(Receipt.total_amount).label("amount"),
        )
        .filter(
            (extract("year", Receipt.date) * 100 + extract("month", Receipt.date))
            <= (year * 100 + month)
        )
        .group_by("y", "m")
        .order_by(
            (extract("year", Receipt.date) * 100 + extract("month", Receipt.date)).desc()
        )
        .limit(12)
        .all()
    )

    monthly_trend = sorted(
        [{"month": f"{int(r.y):04d}-{int(r.m):02d}", "amount": r.amount} for r in trend_rows],
        key=lambda x: x["month"],
    )

    return {
        "total_amount": monthly_total,
        "prev_month_amount": prev_total,
        "by_category": by_category,
        "monthly_trend": monthly_trend,
    }
