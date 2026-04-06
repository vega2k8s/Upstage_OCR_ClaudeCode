import { useState } from 'react'
import UploadArea from '../components/UploadArea'
import ReceiptList from '../components/ReceiptList'

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [lastUploaded, setLastUploaded] = useState(null)

  const handleUploadSuccess = (receipt) => {
    setLastUploaded(receipt)
    setRefreshTrigger((n) => n + 1)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">🧾 영수증 지출 관리</h1>
        <p className="text-slate-500 text-sm mt-1">영수증을 업로드하면 AI가 자동으로 분석합니다</p>
      </header>

      <UploadArea onUploadSuccess={handleUploadSuccess} />

      {lastUploaded && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          ✅ <strong>{lastUploaded.store_name}</strong> ({lastUploaded.total_amount.toLocaleString()}원) 등록 완료!
        </div>
      )}

      <ReceiptList refreshTrigger={refreshTrigger} />
    </div>
  )
}
