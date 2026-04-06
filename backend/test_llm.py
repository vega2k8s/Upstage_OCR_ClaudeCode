"""
Solar LLM JSON 구조화 테스트 스크립트
사용법 1 (직접 텍스트): python test_llm.py
사용법 2 (이미지 파일): python test_llm.py <이미지_경로>
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(__file__))

SAMPLE_TEXT = """
STARBUCKS(스타벅스)
서울특별시 강남구 강남대로 558
대표 : 이석구 사업자번호: 201-81-21515
[테이블#3892, POS01] 2022-09-26 11:26:31
한라봉 (A-50) G)핫도그   5,400 1   5,400
소계                     -> 5,400
결제금액 5,400
(이국주결제) (491)스타벅스카드
스타벅스카드
승인번호: 30479 91,400
61997317****554*
카드잔여액: 42,300 통신사할인(KT) 4,000
카드 할인 KT 할인분
카드 번호 29171008****964*
승인번호(통합) 3123488336 (AD60133581)
합계 5,400
"""


def main():
    if len(sys.argv) >= 2:
        # 이미지 파일에서 OCR 후 LLM 테스트
        from services.ocr_service import extract_text_from_image
        from services.llm_service import parse_receipt_text

        file_path = sys.argv[1]
        print(f"[OCR] 파일에서 텍스트 추출 중: {file_path}")
        raw_text = extract_text_from_image(file_path)
        print("[OCR 결과]")
        print(raw_text[:300], "..." if len(raw_text) > 300 else "")
        print("-" * 50)
    else:
        # 샘플 텍스트로 LLM만 테스트
        from services.llm_service import parse_receipt_text
        raw_text = SAMPLE_TEXT
        print("[샘플 텍스트로 테스트]")
        print(raw_text.strip())
        print("-" * 50)

    print("[Solar LLM 분석 중...]")
    try:
        result = parse_receipt_text(raw_text)
        print("[구조화 결과 JSON]")
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[오류] {e}")


if __name__ == "__main__":
    main()
