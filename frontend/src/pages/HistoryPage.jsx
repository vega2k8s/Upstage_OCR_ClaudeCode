import { useState, useEffect, useCallback } from 'react'
import { getReceipts, deleteReceipt } from '../api/receiptApi'
import EditModal from '../components/EditModal'
import ImageModal from '../components/ImageModal'

const CATEGORIES = [
  '전체', '식비', '카페/음료', '편의점/마트', '교통',
  '의류/패션', '생활용품', '의료/건강', '문화/여가', '기타',
]

const CATEGORY_COLORS = {
  '식비': 'bg-orange-50 text-orange-600 ring-1 ring-orange-200',
  '카페/음료': 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
  '편의점/마트': 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
  '교통': 'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  '의류/패션': 'bg-pink-50 text-pink-600 ring-1 ring-pink-200',
  '생활용품': 'bg-teal-50 text-teal-600 ring-1 ring-teal-200',
  '의료/건강': 'bg-red-50 text-red-600 ring-1 ring-red-200',
  '문화/여가': 'bg-purple-50 text-purple-600 ring-1 ring-purple-200',
  '기타': 'bg-slate-50 text-slate-500 ring-1 ring-slate-200',
}

const inputCls = 'border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white transition-colors'

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
  const [imageTarget, setImageTarget] = useState(null)

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
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">지출 내역</h1>
          <p className="text-xs text-slate-400 mt-0.5">전체 {total}건</p>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">가게명</label>
            <input
              type="text"
              placeholder="검색..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className={`${inputCls} w-36`}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">카테고리</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              className={inputCls}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
              className={inputCls}
            />
          </div>
          {hasFilter && (
            <button
              onClick={resetFilters}
              className="py-1.5 px-3 text-xs text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-600 self-end transition-colors"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <p className="text-sm">등록된 지출 내역이 없습니다.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-3 py-3 w-12"></th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wide w-28">날짜</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wide">가게명</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wide hidden md:table-cell">주요 품목</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wide">카테고리</th>
                <th className="text-right px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wide">금액</th>
                <th className="text-center px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wide w-24">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3 py-3">
                    {r.image_url ? (
                      <button
                        onClick={() => setImageTarget({ url: r.image_url, storeName: r.store_name })}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 hover:border-indigo-300 transition-colors flex items-center justify-center bg-slate-50"
                        title="원본 영수증 보기"
                      >
                        {r.image_url.endsWith('.pdf') ? (
                          <span className="text-xl">📄</span>
                        ) : (
                          <img src={r.image_url} alt="영수증" className="w-full h-full object-cover" />
                        )}
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 text-sm">{r.store_name}</div>
                    {r.payment_method && (
                      <div className="text-xs text-slate-400">{r.payment_method}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                    {r.items?.length > 0
                      ? r.items.slice(0, 2).map((i) => i.name).join(', ') + (r.items.length > 2 ? ` 외 ${r.items.length - 2}건` : '')
                      : '—'
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS['기타']}`}>
                      {r.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap text-sm">
                    {r.total_amount.toLocaleString()}원
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => setEditTarget(r)}
                        className="px-2.5 py-1 text-xs text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(r.id)}
                        className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 rounded-lg text-sm text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                p === page ? 'bg-indigo-600 text-white font-medium' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 rounded-lg text-sm text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            ›
          </button>
        </div>
      )}

      {/* 이미지 모달 */}
      {imageTarget && (
        <ImageModal
          imageUrl={imageTarget.url}
          storeName={imageTarget.storeName}
          onClose={() => setImageTarget(null)}
        />
      )}

      {/* 수정 모달 */}
      {editTarget && (
        <EditModal
          receipt={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={() => { setEditTarget(null); fetchReceipts() }}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800 mb-1">정말 삭제하시겠습니까?</p>
            <p className="text-sm text-slate-400 mb-5">삭제된 내역은 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 disabled:opacity-50 transition-colors"
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
