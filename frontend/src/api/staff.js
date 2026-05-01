import api from './axios';

export const staffApi = {
  getAll: (params) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  recordAttendance: (data) => api.post('/staff/attendance', data),
  recordAdjustment: (data) => api.post('/staff/adjustment', data),
};

export const salaryApi = {
  calculate: (params) => api.get('/salary/calculate', { params }),
  getHistory: (staffId) => api.get(`/salary/history/${staffId}`),
  pay: (data) => api.post('/salary/pay', data),
};
