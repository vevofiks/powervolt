import api from './axios';

const EXPENSE_URL = '/expenses';

export const expenseApi = {
  getAll: (params) => api.get(EXPENSE_URL, { params }),
  getById: (id) => api.get(`${EXPENSE_URL}/${id}`),
  create: (data) => api.post(EXPENSE_URL, data),
  delete: (id) => api.delete(`${EXPENSE_URL}/${id}`),
};
