import { useState } from 'react'
import ImageModal from './ImageModal'

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

export default function ReceiptCard({ receipt, onEdit, onDelete }) {
  const [showImage, setShowImage] = useState(false)
  const colorClass = CATEGORY_COLORS[receipt.category] ?? CATEGORY_COLORS['기타']

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          {/* 영수증 썸네일 */}
          {receipt.image_url && (
            <button
              onClick={() => setShowImage(true)}
              className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors group"
              title="원본 영수증 보기"
            >
              <img
                src={receipt.image_url}
                alt="영수증"
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 truncate">{receipt.store_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                    {receipt.category}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-0.5">{receipt.date}</p>
                {receipt.items?.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {receipt.items.map((item, i) => (
                      <li key={i} className="text-sm text-slate-500 flex justify-between">
                        <span>{item.name}</span>
                        <span>{item.price === 0 ? '증정' : `${item.price.toLocaleString()}원`}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-slate-800">{receipt.total_amount.toLocaleString()}원</p>
                {receipt.payment_method && (
                  <p className="text-xs text-slate-400">{receipt.payment_method}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          {receipt.image_url && (
            <button
              onClick={() => setShowImage(true)}
              className="flex-1 text-sm text-slate-500 hover:bg-slate-50 py-1 rounded-lg transition-colors"
            >
              🧾 원본 보기
            </button>
          )}
          <button
            onClick={() => onEdit?.(receipt)}
            className="flex-1 text-sm text-blue-600 hover:bg-blue-50 py-1 rounded-lg transition-colors"
          >
            수정
          </button>
          <button
            onClick={() => onDelete?.(receipt.id)}
            className="flex-1 text-sm text-red-500 hover:bg-red-50 py-1 rounded-lg transition-colors"
          >
            삭제
          </button>
        </div>
      </div>

      {showImage && (
        <ImageModal
          imageUrl={receipt.image_url}
          storeName={receipt.store_name}
          onClose={() => setShowImage(false)}
        />
      )}
    </>
  )
}
