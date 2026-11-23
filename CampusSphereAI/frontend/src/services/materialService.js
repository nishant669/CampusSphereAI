import api from './api'
export const getAll = (params) => api.get('/materials', { params })
export const upload = (formData) => api.post('/materials', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const update = (id, data) => api.put(`/materials/${id}`, data)
export const remove = (id) => api.delete(`/materials/${id}`)
export const getDownloadUrl = (id) => `/api/materials/${id}/download`
