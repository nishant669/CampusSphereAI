import api from './api';

export const getStudentDashboard = () => api.get('/dashboard/student');
export const getProfessorDashboard = () => api.get('/dashboard/professor');
export const getAdminDashboard = () => api.get('/dashboard/admin');
