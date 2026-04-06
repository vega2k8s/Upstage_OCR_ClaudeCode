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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-700 mb-4">영수증 업로드</h2>

      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="text-4xl mb-3">🧾</div>
        {loading ? (
          <div>
            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-blue-600 font-medium">AI가 영수증을 분석 중입니다...</p>
          </div>
        ) : (
          <>
            <p className="text-slate-600 font-medium">클릭하거나 파일을 드래그하세요</p>
            <p className="text-slate-400 text-sm mt-1">JPG, PNG, PDF · 최대 10MB</p>
          </>
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
        <p className="mt-3 text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      )}
    </div>
  )
}
