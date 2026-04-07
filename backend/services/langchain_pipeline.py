from datetime import date
from .ocr_service import extract_pages_from_file
from .llm_service import parse_receipt_text


def process_receipt_file(file_path: str) -> list[dict]:
    """
    파일 전체 처리 파이프라인.
    PDF는 페이지 수만큼, 이미지는 1건의 영수증 dict 리스트를 반환한다.

    각 dict 구조:
      store_name, date, items, total_amount, category, payment_method, raw_text
    """
    pages = extract_pages_from_file(file_path)

    results = []
    for raw_text in pages:
        try:
            parsed = parse_receipt_text(raw_text)
        except Exception as e:
            # 파싱 실패한 페이지는 기본값으로 저장
            parsed = {
                "store_name": "파싱 실패",
                "date": "",
                "items": [],
                "total_amount": 0,
                "category": "기타",
                "payment_method": None,
            }

        if not parsed.get("date"):
            parsed["date"] = date.today().isoformat()

        parsed["raw_text"] = raw_text
        results.append(parsed)

    return results


# 하위 호환용 단일 결과 반환
def process_receipt(file_path: str) -> dict:
    results = process_receipt_file(file_path)
    return results[0] if results else {}
