import { useState, useEffect, useCallback } from 'react'
import { getReceipts, deleteReceipt } from '../api/receiptApi'
import ReceiptCard from './ReceiptCard'
import EditModal from './EditModal'

const CATEGORIES = ['전체', '식비', '카페/음료', '편의점/마트', '교통', '의류/패션', '생활용품', '의료/건강', '문화/여가', '기타']

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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-700">지출 내역</h2>
        <span className="text-sm text-slate-400">총 {total}건</span>
      </div>

      {/* 필터 영역 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="가게명 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-40"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <span className="self-center text-slate-400 text-sm">~</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {(search || category !== '전체' || startDate || endDate) && (
          <button
            onClick={() => { setSearch(''); setCategory('전체'); setStartDate(''); setEndDate(''); setPage(1) }}
            className="text-sm text-slate-500 hover:text-slate-700 px-2"
          >
            초기화
          </button>
        )}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">불러오는 중...</div>
      ) : receipts.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-3xl mb-2">📭</p>
          <p>등록된 지출 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
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
              className={`w-8 h-8 rounded-lg text-sm ${
                p === page
                  ? 'bg-blue-500 text-white font-medium'
                  : 'text-slate-500 hover:bg-slate-100'
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <p className="text-2xl mb-3">🗑️</p>
            <p className="font-semibold text-slate-800 mb-1">정말 삭제하시겠습니까?</p>
            <p className="text-sm text-slate-500 mb-5">삭제된 내역은 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
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
