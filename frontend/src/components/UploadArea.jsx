import { useState, useRef } from 'react'
import { uploadReceipt } from '../api/receiptApi'

export default function UploadArea({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
      setError('JPG, PNG, PDF 파일만 업로드 가능합니다.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const res = await uploadReceipt(file)
      onUploadSuccess?.(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || '업로드 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">영수증 업로드</h2>

      <div
        className={`border-2 border-dashed rounded-xl py-12 px-6 text-center cursor-pointer transition-all duration-200
          ${dragging
            ? 'border-indigo-400 bg-indigo-50/60'
            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80'
          }`}
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-indigo-600 font-medium text-sm">AI가 영수증을 분석 중입니다...</p>
              <p className="text-slate-400 text-xs mt-1">잠시만 기다려 주세요</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${dragging ? 'bg-indigo-100' : 'bg-slate-100'}`}>
              <svg className={`w-6 h-6 transition-colors ${dragging ? 'text-indigo-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-slate-700 font-medium text-sm">클릭하거나 파일을 드래그하세요</p>
              <p className="text-slate-400 text-xs mt-1">JPG, PNG, PDF · 최대 10MB</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {error && (
        <div className="mt-3 flex items-start gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-xl">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  )
}
