import api from './axios';

export const salaryApi = {
  getDraft: (params) => api.get('/salaries/draft', { params }),
  getLedger: (workerId) => api.get(`/salaries/ledger/${workerId}`),
  paySalary: (data) => api.post('/salaries/payment', data),
  addAllowance: (data) => api.post('/salaries/allowance', data),
  addDeduction: (data) => api.post('/salaries/deduction', data),
};
