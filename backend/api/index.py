import sys
import os

# backend 디렉토리(부모)를 Python 경로에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from main import app  # noqa: F401 - Vercel이 app을 자동으로 감지함
