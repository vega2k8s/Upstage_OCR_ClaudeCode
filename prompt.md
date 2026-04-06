```
@PRD_영수증_지출관리_앱.md 9.개발 우선순위에서 1단계 백엔드 환경 구성 (FastAPI + SQLite)  시작해 줘

현재 Langchain 버전은 1.2.15입니다. @requirements.txt 의 Langchain 버전이 너무 오래된 버전입니다. 
Langchin 버전을 최신 버전으로 변경하고 langchain 관련된 의존성의 버전도 변경해 주세요.
@PRD_영수증_지출관리_앱.md 문서에도 변경된 내용을 반영해 주세요.

backend 테스트를 하기 위해 아래와 같이 실행해야 하나요?
python backend\main.py 


cd backend
uvicorn main:app --reload --port 8000

http://localhost:8000
http://localhost:8000/health

@PRD_영수증_지출관리_앱.md 9.개발 우선순위에서 1단계 Upstage Document Parse OCR 연동 구현을 시작해 줘
구현 후에 테스트 하는 방법도 알려 줘


브라우저에서  
http://localhost:8000/docs

POST
/api/receipts/upload 로 요청해서 images/02.png 파일을 업로드함 
500 Internal Server Err

터미널의 Log을 확인하고 에러 원인을 수정해 줘


@PRD_영수증_지출관리_앱.md 9.개발 우선순위에서 1단계 Solar LLM JSON 구조화 연동 구현을 시작해 주세요
구현 후에 테스트 하는 방법도 알려 주세요.

cd backend

python test_ocr.py ..\images\03.jpg
python test_llm.py ..\images\03.jpg

test_ocr.py 와 test_llm.py 테스트 코드는 어떤 차이가 있는 거죠?

@PRD_영수증_지출관리_앱.md 9.개발 우선순위에서 2단계 | React 기본 UI 구성 (업로드 + 목록) 구현을 시작해 주세요.

@PRD_영수증_지출관리_앱.md 9.개발 우선순위에서 2단계 | 지출 내역 조회/수정/삭제 구현을 시작해 주세요.

@PRD_영수증_지출관리_앱.md 9.개발 우선순위에서 3단계 통계 대시보드 (차트) 구현을 시작해 주세요.

@images/02.png 원본 이미지와 @images/02_ui.png 를 비교해 보면 
뚜뚜호(A-50)은 물품명이 아니라 요청한 사람의 닉네임 같습니다. 
백엔드 코드의 어느 부분을 수정해야 할까요?

@images/03.png 원본 이미지에서 
두번째 "동원) 소화잘되는초코" 는 증정 품목이므로 금액을 0으로 보여줘야 할 것 같아요. 
백엔드 코드의 어느 부분을 수정해야 할까요?

업로드한 원본 영수증 이미지를 UI화면에서도 볼 수 있도록 하면 어떨까요?

추가된 업로드 한 원본 영수증 이미지를 볼 수 있는 기능이 제대로 동작하지 않는 것 같음
현재 상태를 캡쳐한 아래의 image를 보고 확인해 주세요.
@images/ui_image_깨짐_01.png
@images/ui_image_깨짐_02.png

추가된 업로드 한 원본 영수증 이미지를 볼 수 있는 기능을 PRD문서에도 반영해서 갱신해 줘

```