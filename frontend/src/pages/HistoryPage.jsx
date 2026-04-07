import { useState, useEffect, useCallback } from 'react'
import { getReceipts, deleteReceipt } from '../api/receiptApi'
import EditModal from '../components/EditModal'
import ImageModal from '../components/ImageModal'

const CATEGORIES = [
  '전체', '식비', '카페/음료', '편의점/마트', '교통',
  '의류/패션', '생활용품', '의료/건강', '문화/여가', '기타',
]

const CATEGORY_COLORS = {
  '식비': 'bg-orange-100 text-orange-700',
  '카페/음료': 'bg-amber-100 text-amber-700',
  '편의점/마트': 'bg-green-100 text-green-700',
  '교통': 'bg-blue-100 text-blue-700',
  '의류/패션': 'bg-pink-100 text-pink-700',
  '생활용품': 'bg-teal-100 text-teal-700',
  '의료/건강': 'bg-red-100 text-red-700',
  '문화/여가': 'bg-purple-100 text-purple-700',
  '기타': 'bg-slate-100 text-slate-700',
}

export default function HistoryPage() {
  const [receipts, setReceipts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [editTarget, setEditTarget] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [imageTarget, setImageTarget] = useState(null) // { url, storeName }

  const fetchReceipts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page }
      if (search) params.search = search
      if (category !== '전체') params.category = category
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      const res = await getReceipts(params)
      setReceipts(res.data.items)
      setTotal(res.data.total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, search, category, startDate, endDate])

  useEffect(() => { fetchReceipts() }, [fetchReceipts])

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteReceipt(deleteConfirmId)
      setDeleteConfirmId(null)
      fetchReceipts()
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const resetFilters = () => {
    setSearch(''); setCategory('전체'); setStartDate(''); setEndDate(''); setPage(1)
  }

  const totalPages = Math.ceil(total / 10)
  const hasFilter = search || category !== '전체' || startDate || endDate

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">지출 내역</h1>
        <span className="text-sm text-slate-400">총 {total}건</span>
      </div>

      {/* ── 필터 바 ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">가게명</label>
          <input
            type="text"
            placeholder="검색..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">카테고리</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">종료일</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        {hasFilter && (
          <button
            onClick={resetFilters}
            className="py-1.5 px-3 text-sm text-slate-500 border border-slate-300 rounded-lg hover:bg-slate-50 self-end"
          >
            초기화
          </button>
        )}
      </div>

      {/* ── 테이블 ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400">불러오는 중...</div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-3xl mb-2">📭</p>
            <p>등록된 지출 내역이 없습니다.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-3 w-12"></th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium w-28">날짜</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">가게명</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium hidden md:table-cell">주요 품목</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">카테고리</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">금액</th>
                <th className="text-center px-4 py-3 text-slate-500 font-medium w-24">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3">
                    {r.image_url ? (
                      <button
                        onClick={() => setImageTarget({ url: r.image_url, storeName: r.store_name })}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors flex items-center justify-center bg-slate-50"
                        title="원본 영수증 보기"
                      >
                        {r.image_url.endsWith('.pdf') ? (
                          <span className="text-xl">📄</span>
                        ) : (
                          <img src={r.image_url} alt="영수증" className="w-full h-full object-cover" />
                        )}
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-lg">🧾</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{r.store_name}</div>
                    {r.payment_method && (
                      <div className="text-xs text-slate-400">{r.payment_method}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                    {r.items?.length > 0
                      ? r.items.slice(0, 2).map((i) => i.name).join(', ') + (r.items.length > 2 ? ` 외 ${r.items.length - 2}건` : '')
                      : '-'
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS['기타']}`}>
                      {r.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                    {r.total_amount.toLocaleString()}원
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => setEditTarget(r)}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(r.id)}
                        className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── 페이지네이션 ── */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 rounded-lg text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm ${
                p === page ? 'bg-blue-500 text-white font-medium' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 rounded-lg text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}

      {/* ── 이미지 모달 ── */}
      {imageTarget && (
        <ImageModal
          imageUrl={imageTarget.url}
          storeName={imageTarget.storeName}
          onClose={() => setImageTarget(null)}
        />
      )}

      {/* ── 수정 모달 ── */}
      {editTarget && (
        <EditModal
          receipt={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={() => { setEditTarget(null); fetchReceipts() }}
        />
      )}

      {/* ── 삭제 확인 다이얼로그 ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <p className="text-3xl mb-3">🗑️</p>
            <p className="font-semibold text-slate-800 mb-1">정말 삭제하시겠습니까?</p>
            <p className="text-sm text-slate-500 mb-5">삭제된 내역은 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteLoading}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {deleteLoading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
