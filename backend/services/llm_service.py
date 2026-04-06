import os
import json
from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_upstage import ChatUpstage
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

CATEGORIES = [
    "식비", "카페/음료", "편의점/마트", "교통",
    "의류/패션", "생활용품", "의료/건강", "문화/여가", "기타"
]

# ── Pydantic 출력 스키마 ──────────────────────────────────────────────
class ReceiptItem(BaseModel):
    name: str = Field(description="구매 품목명 (음료, 음식 등 실제 상품명만)")
    price: int = Field(description="품목 가격 (숫자만, 원화 기호 제외). 증정·무료·서비스 품목은 0")


class ReceiptSchema(BaseModel):
    store_name: str = Field(description="가게명 또는 상호명")
    date: str = Field(description="영수증 날짜 (YYYY-MM-DD 형식). 알 수 없으면 빈 문자열")
    items: List[ReceiptItem] = Field(description="구매 품목 목록")
    total_amount: int = Field(description="최종 결제 금액 (숫자만)")
    category: str = Field(description=f"지출 카테고리. 반드시 다음 중 하나: {', '.join(CATEGORIES)}")
    payment_method: Optional[str] = Field(default=None, description="결제 수단 (카드, 현금 등). 알 수 없으면 null")


# ── 프롬프트 ─────────────────────────────────────────────────────────
SYSTEM_PROMPT = f"""당신은 영수증 텍스트를 분석하여 구조화된 데이터로 변환하는 전문가입니다.

규칙:
- store_name: 가게명/상호명을 추출하세요.
- date: YYYY-MM-DD 형식으로 반환하세요. 날짜를 알 수 없으면 빈 문자열("")을 반환하세요.
- items: 실제 구매한 상품/음식/음료 품목과 가격만 추출하세요. 없으면 빈 배열을 반환하세요.
  주의: 다음은 품목이 아니므로 반드시 제외하세요.
    · 주문자 닉네임/이름 (예: "뚜뚜호", "홍길동")
    · 테이블 번호 또는 A-50, B-3 같은 좌석 코드
    · 주문 번호, 영수증 번호
    · 소계, 합계, 결제금액 같은 금액 합산 항목
  증정/무료 품목 처리:
    · "증정", "서비스", "무료", "공짜", "행사", "1+1 증정" 등으로 표기된 품목은 목록에 포함하되 price를 0으로 설정하세요.
    · 같은 품목이 두 줄로 나오고 두 번째 줄에 증정/무료 표기가 있으면 두 번째 항목의 price를 0으로 설정하세요.
- total_amount: 최종 결제 금액(합계)만 추출하세요. 숫자만 입력하세요.
- category: 반드시 다음 중 하나를 선택하세요 → {', '.join(CATEGORIES)}
- payment_method: 카드/현금/간편결제 등. 알 수 없으면 null을 반환하세요.
"""


def _build_llm():
    return ChatUpstage(
        upstage_api_key=os.getenv("UPSTAGE_API_KEY"),
        model="solar-pro",
    )


def parse_receipt_text(raw_text: str) -> dict:
    """
    Upstage Solar LLM으로 OCR 텍스트를 구조화된 JSON으로 변환.
    with_structured_output을 사용해 Pydantic 스키마로 직접 파싱.
    실패 시 fallback으로 직접 JSON 파싱 재시도.
    """
    llm = _build_llm()

    # 1차 시도: with_structured_output (Pydantic 스키마)
    try:
        structured_llm = llm.with_structured_output(ReceiptSchema)
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"다음 영수증 텍스트를 분석해주세요:\n\n{raw_text}"),
        ]
        result: ReceiptSchema = structured_llm.invoke(messages)
        return result.model_dump()

    except Exception:
        pass

    # 2차 시도: 일반 호출 후 JSON 직접 파싱 (fallback)
    fallback_prompt = SYSTEM_PROMPT + "\n반드시 JSON 형식으로만 응답하세요. JSON 외 텍스트는 출력하지 마세요."
    messages = [
        SystemMessage(content=fallback_prompt),
        HumanMessage(content=f"다음 영수증 텍스트를 분석해주세요:\n\n{raw_text}"),
    ]

    response = llm.invoke(messages)
    content = response.content.strip()

    # ```json ... ``` 블록 제거
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:-1]).strip()

    parsed = json.loads(content)

    # items 구조 정규화
    items = []
    for item in parsed.get("items", []):
        if isinstance(item, dict) and "name" in item and "price" in item:
            items.append({"name": str(item["name"]), "price": int(item["price"])})
    parsed["items"] = items

    # category 검증
    if parsed.get("category") not in CATEGORIES:
        parsed["category"] = "기타"

    # total_amount 숫자 보장
    try:
        parsed["total_amount"] = int(parsed.get("total_amount", 0))
    except (ValueError, TypeError):
        parsed["total_amount"] = 0

    return parsed
