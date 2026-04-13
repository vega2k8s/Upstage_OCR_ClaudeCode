"""
Sub Agent 파이프라인
────────────────────────────────────────────────────────────────
각 Agent는 하나의 역할만 담당합니다.

[흐름]
파일 입력
  → OCR Agent     : 이미지/PDF에서 텍스트 추출
  → Extract Agent : 가게명, 날짜, 금액, 품목 추출
  → Category Agent: 지출 카테고리 분류
  → Validate Agent: 데이터 검증 및 보정
  → 최종 결과 반환
"""

import os
import json
from datetime import date
from langchain_upstage import ChatUpstage
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_upstage import UpstageDocumentParseLoader

from dotenv import load_dotenv
load_dotenv()

CATEGORIES = [
    "식비", "카페/음료", "편의점/마트", "교통",
    "의류/패션", "생활용품", "의료/건강", "문화/여가", "기타"
]


def _llm():
    """공통 LLM 인스턴스 생성"""
    return ChatUpstage(
        upstage_api_key=os.getenv("UPSTAGE_API_KEY"),
        model="solar-pro",
    )


# ══════════════════════════════════════════════════════════════
# Sub Agent 1: OCR Agent
# 역할: 파일(이미지/PDF)에서 텍스트만 추출
# ══════════════════════════════════════════════════════════════
def ocr_agent(file_path: str) -> list[str]:
    """
    [OCR Agent]
    파일을 받아 페이지별 텍스트 리스트를 반환합니다.
    이미지 → 1개, PDF → N페이지만큼 반환.
    """
    print(f"[OCR Agent] 파일 처리 시작: {file_path}")

    loader = UpstageDocumentParseLoader(
        file_path=file_path,
        api_key=os.getenv("UPSTAGE_API_KEY"),
        ocr="force",
        output_format="text",
        split="page",
        coordinates=False,
    )
    docs = loader.load()
    pages = [doc.page_content for doc in docs if doc.page_content.strip()]

    print(f"[OCR Agent] 추출 완료: {len(pages)}페이지")
    return pages


# ══════════════════════════════════════════════════════════════
# Sub Agent 2: Extract Agent
# 역할: OCR 텍스트에서 가게명/날짜/금액/품목만 추출
# ══════════════════════════════════════════════════════════════
def extract_agent(raw_text: str) -> dict:
    """
    [Extract Agent]
    OCR 텍스트를 받아 핵심 정보(가게명, 날짜, 금액, 품목)만 추출합니다.
    카테고리 분류는 하지 않습니다 → Category Agent가 담당.
    """
    print("[Extract Agent] 데이터 추출 시작")

    system = """당신은 영수증 텍스트에서 핵심 정보만 추출하는 전문가입니다.
카테고리 분류는 하지 마세요. 다음 JSON 형식으로만 응답하세요:

{
  "store_name": "가게명",
  "date": "YYYY-MM-DD (모르면 빈 문자열)",
  "total_amount": 숫자만 (모르면 0),
  "payment_method": "결제수단 (모르면 null)",
  "items": [
    {"name": "품목명", "price": 숫자}
  ]
}

JSON 외 다른 텍스트는 절대 출력하지 마세요."""

    messages = [
        SystemMessage(content=system),
        HumanMessage(content=f"영수증 텍스트:\n\n{raw_text}"),
    ]

    response = _llm().invoke(messages)
    content = response.content.strip()

    # ```json 블록 제거
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:-1]).strip()

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        result = {
            "store_name": "추출 실패",
            "date": "",
            "total_amount": 0,
            "payment_method": None,
            "items": [],
        }

    print(f"[Extract Agent] 추출 완료: {result.get('store_name')}, {result.get('total_amount')}원")
    return result


# ══════════════════════════════════════════════════════════════
# Sub Agent 3: Category Agent
# 역할: 가게명 + 품목 정보로 카테고리만 분류
# ══════════════════════════════════════════════════════════════
def category_agent(store_name: str, items: list[dict]) -> str:
    """
    [Category Agent]
    가게명과 품목 목록을 받아 카테고리 하나만 결정합니다.
    단 하나의 카테고리 문자열만 반환.
    """
    print(f"[Category Agent] 카테고리 분류 시작: {store_name}")

    item_names = ", ".join([i.get("name", "") for i in items[:5]])  # 최대 5개만

    system = f"""당신은 지출 카테고리 분류 전문가입니다.
가게명과 구매 품목을 보고 반드시 아래 카테고리 중 하나만 선택하세요.

카테고리 목록: {', '.join(CATEGORIES)}

응답 규칙: 카테고리 이름만 출력. 다른 텍스트 금지.
예시 응답: 식비"""

    user_input = f"가게명: {store_name}\n품목: {item_names if item_names else '정보 없음'}"

    messages = [
        SystemMessage(content=system),
        HumanMessage(content=user_input),
    ]

    response = _llm().invoke(messages)
    category = response.content.strip()

    # 유효하지 않은 카테고리면 기본값
    if category not in CATEGORIES:
        category = "기타"

    print(f"[Category Agent] 분류 결과: {category}")
    return category


# ══════════════════════════════════════════════════════════════
# Sub Agent 4: Validate Agent
# 역할: 최종 데이터 검증 및 보정
# ══════════════════════════════════════════════════════════════
def validate_agent(data: dict) -> dict:
    """
    [Validate Agent]
    추출·분류된 데이터를 검증하고 빠진 값을 보정합니다.
    LLM을 사용하지 않고 규칙 기반으로 처리합니다 (빠른 처리).
    """
    print("[Validate Agent] 데이터 검증 시작")

    # 가게명 보정
    if not data.get("store_name") or data["store_name"] in ("추출 실패", ""):
        data["store_name"] = "알 수 없음"

    # 날짜 보정
    if not data.get("date"):
        data["date"] = date.today().isoformat()

    # 금액 보정
    try:
        data["total_amount"] = int(data.get("total_amount", 0))
    except (ValueError, TypeError):
        data["total_amount"] = 0

    # 카테고리 보정
    if data.get("category") not in CATEGORIES:
        data["category"] = "기타"

    # 품목 보정
    valid_items = []
    for item in data.get("items", []):
        if isinstance(item, dict) and item.get("name"):
            valid_items.append({
                "name": str(item["name"]),
                "price": int(item.get("price", 0)),
            })
    data["items"] = valid_items

    print(f"[Validate Agent] 검증 완료: {data['store_name']} / {data['total_amount']}원 / {data['category']}")
    return data


# ══════════════════════════════════════════════════════════════
# Orchestrator: 총괄 지휘자
# 역할: Sub Agent들을 순서대로 호출하고 결과를 조합
# ══════════════════════════════════════════════════════════════
def process_receipt_with_agents(file_path: str) -> list[dict]:
    """
    Sub Agent 오케스트레이터.

    실행 순서:
      1. OCR Agent     → 텍스트 추출
      2. Extract Agent → 핵심 정보 추출  (페이지별)
      3. Category Agent→ 카테고리 분류   (페이지별)
      4. Validate Agent→ 데이터 검증     (페이지별)
    """
    print("=" * 50)
    print("[Orchestrator] Sub Agent 파이프라인 시작")
    print("=" * 50)

    # Step 1: OCR Agent - 텍스트 추출
    pages = ocr_agent(file_path)
    if not pages:
        return []

    results = []
    for idx, raw_text in enumerate(pages, 1):
        print(f"\n--- 페이지 {idx}/{len(pages)} 처리 중 ---")

        # Step 2: Extract Agent - 핵심 데이터 추출
        extracted = extract_agent(raw_text)

        # Step 3: Category Agent - 카테고리 분류
        category = category_agent(
            store_name=extracted.get("store_name", ""),
            items=extracted.get("items", []),
        )
        extracted["category"] = category

        # Step 4: Validate Agent - 검증 및 보정
        extracted["raw_text"] = raw_text
        validated = validate_agent(extracted)

        results.append(validated)

    print("\n" + "=" * 50)
    print(f"[Orchestrator] 완료: 총 {len(results)}건 처리")
    print("=" * 50)
    return results
