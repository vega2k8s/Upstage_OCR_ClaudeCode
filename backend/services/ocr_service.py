import os
from pathlib import Path
from langchain_upstage import UpstageDocumentParseLoader
from dotenv import load_dotenv

load_dotenv()

UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY")
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}


def extract_pages_from_file(file_path: str) -> list[str]:
    """
    Upstage Document Parse API로 파일에서 페이지별 텍스트 리스트 반환.

    - 이미지(JPG/PNG): 단일 페이지 → 리스트 1건
    - PDF: 페이지별 분리 → 리스트 N건 (페이지 수만큼)
    - 모든 포맷에 ocr='force' 적용 (이미지 기반 영수증 대응)
    """
    if not UPSTAGE_API_KEY:
        raise ValueError("UPSTAGE_API_KEY가 설정되지 않았습니다.")

    ext = Path(file_path).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"지원하지 않는 파일 형식입니다: {ext}")

    loader = UpstageDocumentParseLoader(
        file_path=file_path,
        api_key=UPSTAGE_API_KEY,
        ocr="force",          # 이미지·PDF 모두 강제 OCR
        output_format="text",
        split="page",         # 페이지 단위로 분리
        coordinates=False,
    )

    docs = loader.load()
    return [doc.page_content for doc in docs if doc.page_content.strip()]


# 하위 호환용 단일 텍스트 반환 함수
def extract_text_from_image(file_path: str) -> str:
    pages = extract_pages_from_file(file_path)
    return "\n\n".join(pages)
