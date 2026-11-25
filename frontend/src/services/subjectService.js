import api from './api'
export const getAll = (params) => api.get('/subjects', { params })
export const getById = (id) => api.get(`/subjects/${id}`)
export const create = (data) => api.post('/subjects', data)
export const update = (id, data) => api.put(`/subjects/${id}`, data)
export const remove = (id) => api.delete(`/subjects/${id}`)
