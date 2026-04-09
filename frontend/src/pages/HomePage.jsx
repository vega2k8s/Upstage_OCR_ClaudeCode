import { useState } from 'react'
import UploadArea from '../components/UploadArea'
import ReceiptList from '../components/ReceiptList'

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [lastUploaded, setLastUploaded] = useState(null)

  const handleUploadSuccess = (result) => {
    setLastUploaded(result)
    setRefreshTrigger((n) => n + 1)
  }

  const isMultiple = Array.isArray(lastUploaded)
  const totalSaved = isMultiple ? lastUploaded.length : (lastUploaded ? 1 : 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <header className="text-center space-y-1.5">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">영수증 지출 관리</h1>
        <p className="text-slate-400 text-sm">영수증을 업로드하면 AI가 자동으로 분석합니다</p>
      </header>

      <UploadArea onUploadSuccess={handleUploadSuccess} />

      {lastUploaded && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3.5">
          {isMultiple ? (
            <>
              <p className="text-sm font-medium text-emerald-700 mb-1.5">
                PDF에서 영수증 {totalSaved}건 등록 완료
              </p>
              <ul className="space-y-1">
                {lastUploaded.map((r) => (
                  <li key={r.id} className="text-xs text-emerald-600 flex justify-between">
                    <span>{r.store_name}</span>
                    <span>{r.total_amount.toLocaleString()}원</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-emerald-700">
              <strong>{lastUploaded.store_name}</strong>{' '}
              <span className="font-normal text-emerald-600">({lastUploaded.total_amount.toLocaleString()}원) 등록 완료</span>
            </p>
          )}
        </div>
      )}

      <ReceiptList refreshTrigger={refreshTrigger} />
    </div>
  )
}
