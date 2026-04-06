import os
from pathlib import Path
from langchain_upstage import UpstageDocumentParseLoader
from dotenv import load_dotenv

load_dotenv()

UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY")
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}


def extract_text_from_image(file_path: str) -> str:
    """
    Upstage Document Parse API로 영수증 이미지/PDF에서 텍스트 추출.

    - JPG/PNG: ocr='force' (이미지에서 강제 OCR)
    - PDF: ocr='auto' (PDF 텍스트 레이어 우선 사용)
    """
    if not UPSTAGE_API_KEY:
        raise ValueError("UPSTAGE_API_KEY가 설정되지 않았습니다.")

    ext = Path(file_path).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"지원하지 않는 파일 형식입니다: {ext}")

    ocr_mode = "auto" if ext == ".pdf" else "force"

    loader = UpstageDocumentParseLoader(
        file_path=file_path,
        api_key=UPSTAGE_API_KEY,
        ocr=ocr_mode,
        output_format="text",
        split="none",
        coordinates=False,
    )

    docs = loader.load()

    # 모든 페이지 텍스트 합치기
    full_text = "\n\n".join(doc.page_content for doc in docs if doc.page_content.strip())
    return full_text
