import api from './api';

export const getMyMarks = () => api.get('/marks/my');
export const getAll = (params) => api.get('/marks', { params });
export const getStudentMarks = (studentId) => api.get(`/marks/student/${studentId}`);
export const addOrUpdate = (data) => api.post('/marks', data);
export const saveBulk = (data) => api.post('/marks/bulk', data);
export const update = (id, data) => api.put(`/marks/${id}`, data);
export const remove = (id) => api.delete(`/marks/${id}`);

// Assignment & Practical Submissions
export const getSubmissions = (params) => api.get('/marks/submissions', { params });
export const saveBulkSubmissions = (data) => api.post('/marks/submissions/bulk', data);
export const getMySubmissions = () => api.get('/marks/submissions/my');
