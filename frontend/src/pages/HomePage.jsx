import { useState } from 'react'
import UploadArea from '../components/UploadArea'
import ReceiptList from '../components/ReceiptList'

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [lastUploaded, setLastUploaded] = useState(null) // 단건 or 배열

  const handleUploadSuccess = (result) => {
    setLastUploaded(result)
    setRefreshTrigger((n) => n + 1)
  }

  const isMultiple = Array.isArray(lastUploaded)
  const totalSaved = isMultiple ? lastUploaded.length : (lastUploaded ? 1 : 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">🧾 영수증 지출 관리</h1>
        <p className="text-slate-500 text-sm mt-1">영수증을 업로드하면 AI가 자동으로 분석합니다</p>
      </header>

      <UploadArea onUploadSuccess={handleUploadSuccess} />

      {lastUploaded && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          {isMultiple ? (
            <>
              ✅ PDF에서 영수증 <strong>{totalSaved}건</strong> 등록 완료!
              <ul className="mt-1 space-y-0.5 list-disc list-inside text-green-600">
                {lastUploaded.map((r) => (
                  <li key={r.id}>{r.store_name} — {r.total_amount.toLocaleString()}원</li>
                ))}
              </ul>
            </>
          ) : (
            <>✅ <strong>{lastUploaded.store_name}</strong> ({lastUploaded.total_amount.toLocaleString()}원) 등록 완료!</>
          )}
        </div>
      )}

      <ReceiptList refreshTrigger={refreshTrigger} />
    </div>
  )
}
