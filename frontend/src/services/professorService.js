import api from './api';

export const getMe = () => api.get('/professors/me');
export const getAll = (params) => api.get('/professors', { params });
export const getById = (id) => api.get(`/professors/${id}`);
export const create = (data) => api.post('/professors', data);
export const update = (id, data) => api.put(`/professors/${id}`, data);
export const remove = (id) => api.delete(`/professors/${id}`);
