import api from './axios';

export const salaryApi = {
  getDraft: (params) => api.get('/salary/draft', { params }),
  getLedger: (workerId) => api.get(`/salary/ledger/${workerId}`),
  paySalary: (data) => api.post('/salary/payment', data),
  addAllowance: (data) => api.post('/salary/allowance', data),
  addDeduction: (data) => api.post('/salary/deduction', data),
};
