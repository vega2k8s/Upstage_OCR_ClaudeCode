import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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

export const getStats = (year, month) =>
  api.get('/stats', { params: { year, month } })
