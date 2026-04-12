# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

영수증 기반 지출 관리 웹앱. 영수증 이미지/PDF를 업로드하면 Upstage OCR + Solar LLM이 자동으로 지출 내역을 추출하여 SQLite에 저장한다.

## Development Commands

### Backend (FastAPI)
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm run dev        # dev server at http://localhost:5173
npm run build      # production build
npm run lint       # ESLint
```

Frontend proxies `/api/*` and `/uploads/*` to `http://localhost:8000` via `vite.config.js`.

## Architecture

### Backend (`backend/`)
- **`main.py`** — FastAPI app entry point; registers routers, sets up CORS, mounts `/uploads` static directory
- **`database.py`** — SQLAlchemy engine + session factory for SQLite
- **`models/receipt.py`** — `Receipt` and `ReceiptItem` ORM models
- **`routers/receipts.py`** — Upload, list, update, delete endpoints
- **`routers/stats.py`** — Monthly/yearly spending statistics; `month=null` triggers yearly mode
- **`services/ocr_service.py`** — Upstage Document Parse API; PDF → N pages → N OCR results
- **`services/llm_service.py`** — Upstage Solar LLM; structured JSON extraction with Pydantic fallback
- **`services/langchain_pipeline.py`** — Orchestrates OCR → LLM → DB storage pipeline

**PDF handling:** 1 PDF page = 1 receipt record. All pages share the same `image_path`.

### Frontend (`frontend/src/`)
- **`pages/`** — `HomePage` (upload + recent list), `HistoryPage` (filter/table), `StatsPage` (charts)
- **`components/`** — `UploadArea`, `ReceiptCard`, `ReceiptList`, `EditModal`, `ImageModal`, `Navbar`
- **`api/receiptApi.js`** — All Axios calls; base URL `/api`
- **`App.jsx`** — React Router with lazy-loaded pages

### Design System (TailwindCSS)
- Primary accent: `indigo-600` / `indigo-50`
- Danger: `rose-500`
- Cards: `bg-white shadow-sm border border-slate-100 rounded-xl`
- Category badges: `bg-xxx-50 text-xxx-600 ring-1 ring-xxx-200 whitespace-nowrap`
- Input focus: `focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400`

## Environment Variables

```env
# backend/.env
UPSTAGE_API_KEY=...          # Required — Upstage OCR + Solar LLM
DATABASE_URL=sqlite:///./receipts.db
UPLOAD_DIR=./uploads
```

## Key Conventions

- **Categories (9):** 식비, 카페/음료, 편의점/마트, 교통, 의류/패션, 생활용품, 의료/건강, 문화/여가, 기타
- **Stats API:** `GET /api/stats?year=2026` = yearly, `GET /api/stats?year=2026&month=4` = monthly
- **Uploads:** stored as UUID-named files under `backend/uploads/`; served at `/uploads/<filename>`
- **Pagination:** 10 items per page; `page` query param on `GET /api/receipts`
