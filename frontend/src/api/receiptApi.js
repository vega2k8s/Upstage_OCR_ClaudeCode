import axios from 'axios'

// 로컬 개발: VITE_API_BASE_URL 미설정 → '/api' (vite.config.js 프록시 사용)
// Vercel 배포: VITE_API_BASE_URL='/_/backend/api' 로 설정
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

export const uploadReceipt = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/receipts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getReceipts = (params) =>
  api.get('/receipts', { params })

export const updateReceipt = (id, data) =>
  api.put(`/receipts/${id}`, data)

export const deleteReceipt = (id) =>
  api.delete(`/receipts/${id}`)

// month가 null/undefined이면 연간 통계 요청
export const getStats = (year, month) => {
  const params = { year }
  if (month) params.month = month
  return api.get('/stats', { params })
}
