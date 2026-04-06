"""
Upstage Document Parse OCR 연동 테스트 스크립트
사용법: python test_ocr.py <이미지_또는_PDF_경로>
예시:  python test_ocr.py sample_receipt.jpg
"""
import sys
import os

# 백엔드 루트를 경로에 추가
sys.path.insert(0, os.path.dirname(__file__))

from services.ocr_service import extract_text_from_image


def main():
    if len(sys.argv) < 2:
        print("사용법: python test_ocr.py <파일경로>")
        print("예시:  python test_ocr.py sample_receipt.jpg")
        sys.exit(1)

    file_path = sys.argv[1]

    if not os.path.exists(file_path):
        print(f"[오류] 파일을 찾을 수 없습니다: {file_path}")
        sys.exit(1)

    print(f"[OCR 시작] 파일: {file_path}")
    print("-" * 50)

    try:
        text = extract_text_from_image(file_path)
        print("[추출된 텍스트]")
        print(text)
        print("-" * 50)
        print(f"[완료] 총 {len(text)}자 추출")
    except Exception as e:
        print(f"[오류] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
