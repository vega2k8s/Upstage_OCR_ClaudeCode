import { useEffect } from 'react'

export default function ImageModal({ imageUrl, storeName, onClose }) {
  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <span className="text-sm font-medium text-slate-700 truncate">{storeName} 영수증</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none ml-2"
          >
            ✕
          </button>
        </div>
        <div className="p-3 bg-slate-50 flex justify-center">
          <img
            src={imageUrl}
            alt={`${storeName} 영수증`}
            className="max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  )
}
