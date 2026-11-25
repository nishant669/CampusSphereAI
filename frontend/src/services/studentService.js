import api from './api'
export const getMe = () => api.get('/students/me')
export const getAnalytics = (params) => api.get('/students/analytics', { params })
export const getSubjectFull = (params) => api.get('/students/subject-full', { params })
export const bulkUpdate = (data) => api.put('/students/bulk-update', data)
export const getAll = (params) => api.get('/students', { params })
export const getById = (id) => api.get(`/students/${id}`)
export const create = (data) => api.post('/students', data)
export const update = (id, data) => api.put(`/students/${id}`, data)
export const remove = (id) => api.delete(`/students/${id}`)
export const activate = (id) => api.patch(`/students/${id}/activate`)

