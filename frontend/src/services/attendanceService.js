import api from './api'
export const getMySummary = () => api.get('/attendance/my')
export const getMyDaily = (params) => api.get('/attendance/my/daily', { params })
export const getAll = (params) => api.get('/attendance', { params })
export const getStudentAttendance = (studentId) => api.get(`/attendance/student/${studentId}`)
export const getSession = (params) => api.get('/attendance/session', { params })
export const saveBulk = (data) => api.post('/attendance/bulk', data)
export const update = (id, data) => api.put(`/attendance/${id}`, data)
export const getBelow75 = () => api.get('/attendance/below75')
export const getSubjectStudents = (params) => api.get('/attendance/subject-students', { params })

