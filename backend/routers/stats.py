from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from database import get_db
from models.receipt import Receipt

router = APIRouter(prefix="/api/stats", tags=["stats"])


def _total(db: Session, year: int, month: Optional[int] = None) -> int:
    q = db.query(func.sum(Receipt.total_amount)).filter(
        extract("year", Receipt.date) == year
    )
    if month:
        q = q.filter(extract("month", Receipt.date) == month)
    return q.scalar() or 0


def _category_rows(db: Session, year: int, month: Optional[int] = None):
    q = (
        db.query(Receipt.category, func.sum(Receipt.total_amount).label("amount"))
        .filter(extract("year", Receipt.date) == year)
    )
    if month:
        q = q.filter(extract("month", Receipt.date) == month)
    return q.group_by(Receipt.category).order_by(func.sum(Receipt.total_amount).desc()).all()


@router.get("")
def get_stats(
    year: int = Query(...),
    month: Optional[int] = Query(None),   # None → 연간 통계
    db: Session = Depends(get_db),
):
    is_yearly = month is None

    # ── 현재 기간 총 지출 ──────────────────────────────────────────
    total = _total(db, year, month)

    # ── 비교 기간 총 지출 (전월 or 전년) ──────────────────────────
    if is_yearly:
        prev_total = _total(db, year - 1)
    else:
        prev_year = year - 1 if month == 1 else year
        prev_month = 12 if month == 1 else month - 1
        prev_total = _total(db, prev_year, prev_month)

    # ── 카테고리별 지출 ────────────────────────────────────────────
    rows = _category_rows(db, year, month)
    by_category = [
        {
            "category": r.category,
            "amount": r.amount,
            "ratio": round(r.amount / total * 100) if total > 0 else 0,
        }
        for r in rows
    ]

    # ── 추이 차트 데이터 ───────────────────────────────────────────
    if is_yearly:
        # 연간: 해당 연도의 월별 지출 (1~12월)
        trend_rows = (
            db.query(
                extract("month", Receipt.date).label("m"),
                func.sum(Receipt.total_amount).label("amount"),
            )
            .filter(extract("year", Receipt.date) == year)
            .group_by("m")
            .order_by("m")
            .all()
        )
        # 데이터 없는 월은 0으로 채움
        trend_map = {int(r.m): r.amount for r in trend_rows}
        monthly_trend = [
            {"month": f"{year}-{m:02d}", "amount": trend_map.get(m, 0)}
            for m in range(1, 13)
        ]
    else:
        # 월간: 선택한 월 포함 정확히 12개월 범위 (상한 + 하한 모두 적용)
        total_months = year * 12 + month - 1   # 0-based 월 인덱스
        start_months = total_months - 11       # 11개월 전
        start_year  = start_months // 12
        start_month = start_months % 12 + 1
        start_ym = start_year * 100 + start_month
        end_ym   = year * 100 + month

        trend_rows = (
            db.query(
                extract("year", Receipt.date).label("y"),
                extract("month", Receipt.date).label("m"),
                func.sum(Receipt.total_amount).label("amount"),
            )
            .filter(
                (extract("year", Receipt.date) * 100 + extract("month", Receipt.date))
                .between(start_ym, end_ym)
            )
            .group_by("y", "m")
            .order_by("y", "m")
            .all()
        )
        monthly_trend = [
            {"month": f"{int(r.y):04d}-{int(r.m):02d}", "amount": r.amount}
            for r in trend_rows
        ]

    return {
        "total_amount": total,
        "prev_amount": prev_total,        # 전월(월간) 또는 전년(연간)
        "is_yearly": is_yearly,
        "by_category": by_category,
        "monthly_trend": monthly_trend,
    }
