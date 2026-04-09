import { useState, useEffect, useCallback } from 'react'
import { getReceipts, deleteReceipt } from '../api/receiptApi'
import ReceiptCard from './ReceiptCard'
import EditModal from './EditModal'

const CATEGORIES = ['전체', '식비', '카페/음료', '편의점/마트', '교통', '의류/패션', '생활용품', '의료/건강', '문화/여가', '기타']

const inputCls = 'border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white transition-colors'

export default function ReceiptList({ refreshTrigger }) {
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

  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts, refreshTrigger])

  const handleDelete = async (id) => {
    try {
      await deleteReceipt(id)
      setDeleteConfirmId(null)
      fetchReceipts()
    } catch (e) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const totalPages = Math.ceil(total / 10)
  const hasFilter = search || category !== '전체' || startDate || endDate

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">최근 지출 내역</h2>
        <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">총 {total}건</span>
      </div>

      {/* 필터 영역 */}
      <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-slate-50">
        <input
          type="text"
          placeholder="가게명 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className={`${inputCls} w-36`}
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className={inputCls}
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
          className={inputCls}
        />
        <span className="self-center text-slate-300 text-sm">—</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
          className={inputCls}
        />
        {hasFilter && (
          <button
            onClick={() => { setSearch(''); setCategory('전체'); setStartDate(''); setEndDate(''); setPage(1) }}
            className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : receipts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <p className="text-sm">등록된 지출 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {receipts.map((r) => (
            <ReceiptCard
              key={r.id}
              receipt={r}
              onEdit={setEditTarget}
              onDelete={setDeleteConfirmId}
            />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                p === page
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
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
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
