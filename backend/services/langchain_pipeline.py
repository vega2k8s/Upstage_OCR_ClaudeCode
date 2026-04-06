from datetime import date
from .ocr_service import extract_text_from_image
from .llm_service import parse_receipt_text


def process_receipt(file_path: str) -> dict:
    """
    영수증 이미지 전체 처리 파이프라인:
    1. OCR로 텍스트 추출
    2. Solar LLM으로 JSON 구조화
    3. 날짜 기본값 보정
    """
    # Step 1: OCR 텍스트 추출
    raw_text = extract_text_from_image(file_path)

    # Step 2: LLM 구조화
    parsed = parse_receipt_text(raw_text)

    # Step 3: 날짜 기본값 처리
    if not parsed.get("date"):
        parsed["date"] = date.today().isoformat()

    # raw_text 포함하여 반환
    parsed["raw_text"] = raw_text

    return parsed
