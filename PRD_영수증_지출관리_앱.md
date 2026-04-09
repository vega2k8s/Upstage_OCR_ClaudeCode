# PRD: 영수증 기반 지출 관리 앱

## 1. 프로젝트 개요

### 1.1 배경 및 목적
영수증 이미지를 업로드하면 AI가 자동으로 지출 내역을 추출하고 저장하여, 사용자가 손쉽게 개인 지출을 관리할 수 있는 웹 애플리케이션을 개발한다.

### 1.2 목표
- 영수증 이미지 업로드만으로 지출 내역 자동 등록
- 월별/카테고리별 지출 현황 시각화
- 누적 지출 데이터 기반 소비 패턴 파악

### 1.3 프로젝트 범위
- 개인 사용 목적의 웹 애플리케이션 (포트폴리오)
- 별도 로그인/회원가입 기능 없음 (단일 사용자)

---

## 2. 기술 스택

### 2.1 프론트엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18+ | UI 프레임워크 |
| Vite | 최신 | 빌드 도구 및 개발 서버 |
| TailwindCSS | 3+ | 스타일링 |
| Recharts | 최신 | 지출 통계 차트 |
| Axios | 최신 | 백엔드 API 통신 |

### 2.2 백엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| Python | 3.11+ | 백엔드 언어 |
| FastAPI | 최신 | REST API 서버 |
| LangChain | 1.2.15 | AI 파이프라인 체인 구성 |
| Upstage Document Parse | API | 영수증 OCR 텍스트 추출 |
| Upstage Solar LLM | API | 추출 텍스트 구조화 및 분석 |

### 2.3 데이터베이스
| 기술 | 용도 |
|------|------|
| SQLite | 지출 내역 영구 저장 |

### 2.4 전체 아키텍처
```
[React 프론트엔드]
       ↕ REST API (Axios)
[FastAPI 백엔드]
       ↓
[LangChain 파이프라인]
   ├── Upstage Document Parse (OCR)
   └── Upstage Solar LLM (구조화)
       ↓
[SQLite DB]
```

---

## 3. 핵심 기능 요구사항

### 3.1 영수증 업로드 및 파싱

**기능 설명**
사용자가 영수증 이미지(JPG, PNG) 또는 PDF를 업로드하면 Upstage Document Parse로 텍스트를 추출하고, Solar LLM이 구조화된 JSON으로 변환한다.  
PDF의 경우 페이지별로 분리하여 각 페이지를 독립적인 영수증으로 처리한다.

**처리 흐름**
```
영수증 파일 업로드 (이미지 or PDF)
       ↓
Upstage Document Parse → 페이지별 텍스트 추출 (ocr=force)
       ↓                  · 이미지: 1건 / PDF: N페이지 → N건
Upstage Solar LLM → 페이지별 JSON 구조화
       ↓
카테고리 자동 분류 (LangChain)
       ↓
SQLite 저장 (페이지 수만큼 개별 영수증으로 저장)
```

**PDF 다중 영수증 처리**
- PDF 1페이지 = 영수증 1건으로 처리
- 3페이지 PDF 업로드 → 영수증 3건 자동 생성
- 모든 페이지가 동일한 원본 파일(image_url)을 참조

**추출 데이터 항목**
```json
{
  "store_name": "스타벅스 강남점",
  "date": "2026-04-02",
  "items": [
    { "name": "아이스 아메리카노", "price": 4500 },
    { "name": "치즈케이크", "price": 6500 }
  ],
  "total_amount": 11000,
  "category": "카페/음료",
  "payment_method": "카드"
}
```

**지원 파일 형식**: JPG, JPEG, PNG, PDF  
**최대 파일 크기**: 10MB  
**PDF 썸네일**: 브라우저 미지원으로 📄 아이콘 표시, "새 탭에서 열기" 제공

---

### 3.2 지출 내역 조회

**기능 설명**
저장된 지출 내역을 목록으로 표시하며, 날짜/카테고리 기준 필터링이 가능하다.

**UI 요소**
- 지출 목록 테이블 (영수증 썸네일, 날짜, 가게명, 품목, 금액, 카테고리)
- 날짜 범위 필터 (시작일 ~ 종료일)
- 카테고리 필터 드롭다운
- 검색창 (가게명 검색)
- 페이지네이션 (10건/페이지)

### 3.5 원본 영수증 이미지 보기

**기능 설명**
업로드한 원본 영수증 이미지를 UI에서 확인할 수 있다.

**기능 목록**
- 지출 목록(카드/테이블)에 영수증 썸네일 표시
- 썸네일 또는 "원본 보기" 버튼 클릭 시 모달로 원본 이미지 확대 표시
- 모달 닫기: ✕ 버튼 / 배경 클릭 / ESC 키

---

### 3.3 지출 통계 대시보드

**기능 설명**
누적 지출 데이터를 시각화하여 소비 패턴을 파악할 수 있다.  
연도만 선택하면 연간 통계, 연도+월을 선택하면 해당 월 통계를 표시한다.

**조회 모드**
| 선택 | 통계 범위 | 비교 기준 | 추이 차트 |
|------|---------|---------|---------|
| 연도만 (전체) | 해당 연도 전체 | 전년 동기 | 해당 연도 1~12월 (항상 표시) |
| 연도 + 월 (지출 있음) | 해당 월 | 전월 | 선택 월 기준 정확한 12개월 범위 표시 |
| 연도 + 월 (지출 없음) | 해당 월 | 전월 | 추이 차트 미표시 |

**차트 구성**
- 지출 추이 (막대 차트) — Recharts BarChart
  - 연간 모드: 해당 연도 1~12월 (데이터 없는 월은 0으로 표시, 항상 출력)
  - 월간 모드 (지출 있음): 선택 월 기준 정확한 12개월 범위 내 데이터만 표시, 선택 월 강조
  - 월간 모드 (지출 없음): 차트 미표시
- 카테고리별 지출 비율 (파이 차트) — Recharts PieChart
- 총 지출 / 전년(전월) 대비 증감 표시 (카드 UI)

**월간 추이 범위 계산 규칙**
- 선택: `YYYY년 MM월` → 표시 범위: `선택월 - 11개월` ~ `선택월` (상·하한 모두 적용)
- 예) 2022년 9월 선택 → 2021년 10월 ~ 2022년 9월 범위의 데이터만 표시
- 범위 밖 연도 데이터 (예: 2010년 3월, 2018년 8월 등)는 표시하지 않음
- 백엔드 쿼리: `BETWEEN (year*100+month - 11개월환산값) AND (year*100+month)` 으로 정확히 필터링

**X축 레이블 규칙**
- 추이 차트의 12개월 데이터가 여러 연도에 걸치는 경우 X축에 연도 포함 (`YY.MM` 형식, 예: `25.10`)
- 모든 데이터가 같은 연도인 경우 X축에 월만 표시 (`M월` 형식, 예: `3월`)

---

### 3.4 지출 내역 수동 수정/삭제

**기능 설명**
OCR 오류로 잘못 파싱된 항목을 사용자가 직접 수정하거나 삭제할 수 있다.

**기능 목록**
- 항목별 수정 모달 (가게명, 날짜, 금액, 카테고리 수정)
- 항목 삭제 (삭제 확인 다이얼로그 포함)

---

## 4. 카테고리 분류 기준

Solar LLM이 아래 카테고리 중 하나로 자동 분류한다.

| 카테고리 | 예시 |
|----------|------|
| 식비 | 식당, 분식집, 도시락 |
| 카페/음료 | 스타벅스, 카페, 편의점 음료 |
| 편의점/마트 | GS25, CU, 이마트 |
| 교통 | 주유소, 택시, 버스카드 충전 |
| 의류/패션 | 옷가게, 신발, 악세서리 |
| 생활용품 | 올리브영, 다이소 |
| 의료/건강 | 병원, 약국 |
| 문화/여가 | 영화관, 서점, 공연 |
| 기타 | 분류 불가 항목 |

---

## 5. API 명세

### 5.1 영수증 업로드
```
POST /api/receipts/upload
Content-Type: multipart/form-data

Request:
  - file: 이미지 파일 (JPG, PNG) 또는 PDF

Response (이미지 - 단건):
  {
    "id": 1,
    "store_name": "스타벅스",
    "date": "2026-04-02",
    "total_amount": 11000,
    "category": "카페/음료",
    "image_url": "/uploads/uuid.jpg",
    "items": [...],
    "created_at": "2026-04-02T10:00:00"
  }

Response (PDF 다중 영수증 - 배열):
  [
    { "id": 1, "store_name": "GS25", ... },
    { "id": 2, "store_name": "GS25", ... },
    { "id": 3, "store_name": "GS25", ... }
  ]
```

### 5.2 지출 내역 조회
```
GET /api/receipts?start_date=2026-04-01&end_date=2026-04-30&category=식비&page=1

Response:
  {
    "total": 25,
    "page": 1,
    "items": [
      {
        "id": 1,
        "store_name": "스타벅스",
        "date": "2026-04-02",
        "total_amount": 11000,
        "category": "카페/음료",
        "payment_method": "카드",
        "image_url": "/uploads/uuid.jpg",
        "items": [...],
        "created_at": "2026-04-02T10:00:00"
      }
    ]
  }
```

### 5.3 지출 통계 조회
```
# 월간 통계 (연도 + 월 지정)
GET /api/stats?year=2026&month=4

# 연간 통계 (연도만 지정, month 생략)
GET /api/stats?year=2026

Response:
  {
    "total_amount": 250000,        # 해당 기간 총 지출
    "prev_amount": 200000,         # 전월(월간) 또는 전년(연간) 총 지출
    "is_yearly": false,            # true=연간 모드, false=월간 모드
    "by_category": [
      { "category": "식비", "amount": 120000, "ratio": 48 },
      ...
    ],
    "monthly_trend": [
      { "month": "2026-01", "amount": 180000 },
      ...
      # 연간 모드: 해당 연도 1~12월 (데이터 없는 월은 0)
      # 월간 모드: 선택 월 기준 정확한 12개월 범위 (선택월-11개월 ~ 선택월) 내 데이터만 포함
    ]
  }
```

### 5.4 지출 내역 수정
```
PUT /api/receipts/{id}
Content-Type: application/json

Request:
  {
    "store_name": "수정된 가게명",
    "total_amount": 12000,
    "category": "식비"
  }
```

### 5.5 지출 내역 삭제
```
DELETE /api/receipts/{id}
```

---

## 6. 데이터베이스 스키마

### receipts 테이블
```sql
CREATE TABLE receipts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    store_name  TEXT NOT NULL,
    date        DATE NOT NULL,
    total_amount INTEGER NOT NULL,
    category    TEXT NOT NULL,
    payment_method TEXT,
    image_path  TEXT,
    raw_text    TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### receipt_items 테이블
```sql
CREATE TABLE receipt_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id  INTEGER NOT NULL,
    name        TEXT NOT NULL,
    price       INTEGER NOT NULL,
    FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
);
```

---

## 7. 프로젝트 디렉토리 구조

```
receipt-manager/
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadArea.jsx       # 영수증 업로드 컴포넌트
│   │   │   ├── ReceiptList.jsx      # 지출 목록 컴포넌트
│   │   │   ├── ReceiptCard.jsx      # 개별 지출 카드 (썸네일 포함)
│   │   │   ├── ImageModal.jsx       # 원본 영수증 이미지 확대 모달
│   │   │   ├── Navbar.jsx           # 네비게이션 바
│   │   │   └── EditModal.jsx        # 수정 모달
│   │   ├── pages/
│   │   │   ├── HomePage.jsx         # 메인 페이지
│   │   │   ├── HistoryPage.jsx      # 지출 내역 페이지
│   │   │   └── StatsPage.jsx        # 통계 페이지
│   │   ├── api/
│   │   │   └── receiptApi.js        # Axios API 호출
│   │   └── App.jsx
│   └── package.json
│
├── backend/                    # FastAPI + LangChain
│   ├── main.py                     # FastAPI 앱 진입점
│   ├── routers/
│   │   ├── receipts.py             # 영수증 관련 라우터
│   │   └── stats.py                # 통계 관련 라우터
│   ├── services/
│   │   ├── ocr_service.py          # Upstage Document Parse 연동
│   │   ├── llm_service.py          # Upstage Solar LLM 연동
│   │   └── langchain_pipeline.py   # LangChain 파이프라인
│   ├── models/
│   │   └── receipt.py              # SQLite 모델 (SQLAlchemy)
│   ├── database.py                 # DB 연결 설정
│   └── requirements.txt
│
└── README.md
```

---

## 8. 화면 구성

### 8.0 디자인 시스템

**스타일 원칙**: 미니멀하고 모던한 느낌 (TailwindCSS 유틸리티 기반)

| 항목 | 적용 방식 |
|------|----------|
| 주 액션 컬러 | Indigo (`indigo-600`) |
| 위험/삭제 컬러 | Rose (`rose-500`) |
| 성공/완료 컬러 | Emerald (`emerald-500`) |
| 배경 | `bg-slate-50` (페이지), `bg-white` (카드) |
| 카드 스타일 | `shadow-sm border border-slate-100 rounded-xl` (테두리 최소화, 그림자 강조) |
| 인풋 포커스 | `focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400` |
| 카테고리 배지 | `bg-xxx-50 text-xxx-600 ring-1 ring-xxx-200` (ring 스타일) |
| 섹션 타이틀 | `text-xs font-semibold uppercase tracking-wider text-slate-600` |
| 로딩 상태 | 인디고 스피너 애니메이션 (`border-indigo-500 border-t-transparent animate-spin`) |
| 빈 상태 | SVG 아이콘 + 안내 텍스트 (이모지 미사용) |
| 모달 오버레이 | `bg-black/50 backdrop-blur-sm` |
| 폰트 스무딩 | `-webkit-font-smoothing: antialiased` |

**Navbar**
- 로고: 이모지(🧾) + `지출관리` (인디고 강조)
- 네비게이션 링크: 이모지 없는 텍스트만 표시
- 활성 링크: `bg-indigo-50 text-indigo-600`
- 하단 구분선: `shadow-[0_1px_0_0_#f1f5f9]` (미세한 라인)

### 8.1 메인 페이지 (홈)
- 상단: 타이틀 + 부제목 (중앙 정렬)
- 중단: 영수증 업로드 영역 (드래그 앤 드롭 지원)
  - SVG 업로드 아이콘 (이모지 미사용)
  - 드래그 시: `border-indigo-400 bg-indigo-50/60` 강조
  - 분석 중: 인디고 스피너 + 안내 메시지
  - 에러: SVG 아이콘 + `rose-50` 배경 알림
- 업로드 성공 알림: `bg-emerald-50 border border-emerald-100` 토스트
- 하단: 최근 등록된 지출 내역 (ReceiptCard 형태)

### 8.2 지출 내역 페이지
- 필터 바: `bg-white shadow-sm` 카드 안에 라벨+인풋 쌍 배치
- 지출 목록 테이블: `bg-white shadow-sm` 카드, 행 hover `bg-slate-50/60`
  - 썸네일 없을 때: SVG 문서 아이콘 표시
  - 수정 버튼: `text-indigo-500 hover:bg-indigo-50`
  - 삭제 버튼: `text-rose-400 hover:bg-rose-50`
- 삭제 확인 모달: SVG 삭제 아이콘 박스 + `backdrop-blur-sm`
- 썸네일 클릭 시 원본 영수증 이미지 모달

### 8.3 통계 페이지
- 연도/월 선택 드롭다운 (인디고 포커스 링)
- 요약 카드 3개: 좌측 컬러 테두리(`border-l-4`)로 시각 구분
  - 총 지출: `border-l-indigo-500`
  - 전월/전년 대비: 증가 `border-l-rose-400` / 감소 `border-l-emerald-400`
  - 카테고리 수: `border-l-violet-400`
- 지출 추이 막대 차트 (Recharts BarChart)
  - 막대 색상: `#6366f1` (인디고), 선택 월 강조 `#4338ca` (진한 인디고)
  - 데이터 없는 막대: `fillOpacity: 0.25`
  - 연간 모드: 해당 연도 1~12월 항상 표시
  - 월간 모드 (지출 있음): 선택 월 기준 정확한 12개월 범위만 표시
  - 월간 모드 (지출 없음): 차트 미표시
- 카테고리별 파이 차트 (인디고 계열 색상 팔레트)
- 카테고리별 지출 금액 + 비율 바 목록

---

## 9. 개발 우선순위

| 단계 | 기능 | 우선순위 | 상태 |
|------|------|----------|------|
| 1단계 | 백엔드 환경 구성 (FastAPI + SQLite) | 필수 | ✅ 완료 |
| 1단계 | Upstage Document Parse OCR 연동 | 필수 | ✅ 완료 |
| 1단계 | Solar LLM JSON 구조화 연동 | 필수 | ✅ 완료 |
| 1단계 | LangChain 파이프라인 구성 | 필수 | ✅ 완료 |
| 2단계 | React 기본 UI 구성 (업로드 + 목록) | 필수 | ✅ 완료 |
| 2단계 | 지출 내역 조회/수정/삭제 | 필수 | ✅ 완료 |
| 2단계 | 원본 영수증 이미지 보기 (썸네일 + 모달) | 필수 | ✅ 완료 |
| 3단계 | 통계 대시보드 (차트) | 권장 | ✅ 완료 |
| 3단계 | 카테고리 필터 및 검색 | 권장 | ✅ 완료 |
| 4단계 | UI 디자인 개선 (TailwindCSS) | 선택 | ✅ 완료 |

---

## 10. 환경 변수

```env
# backend/.env
UPSTAGE_API_KEY=your_upstage_api_key_here
DATABASE_URL=sqlite:///./receipts.db
UPLOAD_DIR=./uploads
```

---

## 11. 참고 자료
- [Upstage Document Parse API 문서](https://console.upstage.ai/docs/capabilities/document-digitization)
- [Upstage Solar LLM API 문서](https://console.upstage.ai/docs/capabilities/chat)
- [LangChain 공식 문서](https://python.langchain.com/docs/)
- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [Recharts 공식 문서](https://recharts.org/)
