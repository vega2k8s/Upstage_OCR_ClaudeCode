import { useState } from 'react'
import ImageModal from './ImageModal'

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

export default function ReceiptCard({ receipt, onEdit, onDelete }) {
  const [showImage, setShowImage] = useState(false)
  const colorClass = CATEGORY_COLORS[receipt.category] ?? CATEGORY_COLORS['기타']

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start gap-3">
          {receipt.image_url ? (
            <button
              onClick={() => setShowImage(true)}
              className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-slate-100 hover:border-indigo-300 transition-colors group flex items-center justify-center bg-slate-50"
              title="원본 영수증 보기"
            >
              {receipt.image_url.endsWith('.pdf') ? (
                <span className="text-2xl">📄</span>
              ) : (
                <img
                  src={receipt.image_url}
                  alt="영수증"
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
              )}
            </button>
          ) : (
            <div className="shrink-0 w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 text-sm truncate">{receipt.store_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                    {receipt.category}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">
                  {receipt.date}
                  {receipt.payment_method && (
                    <span className="ml-2 text-slate-300">· {receipt.payment_method}</span>
                  )}
                </p>
                {receipt.items?.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {receipt.items.map((item, i) => (
                      <li key={i} className="text-xs text-slate-500 flex justify-between">
                        <span>{item.name}</span>
                        <span className="text-slate-400">{item.price === 0 ? '증정' : `${item.price.toLocaleString()}원`}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-bold text-slate-800">{receipt.total_amount.toLocaleString()}원</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-3 pt-3 border-t border-slate-50">
          {receipt.image_url && (
            <button
              onClick={() => setShowImage(true)}
              className="flex-1 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 py-1.5 rounded-lg transition-colors"
            >
              원본 보기
            </button>
          )}
          <button
            onClick={() => onEdit?.(receipt)}
            className="flex-1 text-xs text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 py-1.5 rounded-lg transition-colors font-medium"
          >
            수정
          </button>
          <button
            onClick={() => onDelete?.(receipt.id)}
            className="flex-1 text-xs text-rose-400 hover:text-rose-600 hover:bg-rose-50 py-1.5 rounded-lg transition-colors"
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
