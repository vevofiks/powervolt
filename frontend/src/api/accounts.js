import api from './axios';

const ACCOUNTS_URL = '/accounts';

export const accountApi = {
  getAll: (params) => api.get(ACCOUNTS_URL, { params }),
  getById: (id) => api.get(`${ACCOUNTS_URL}/${id}`),
  create: (data) => api.post(ACCOUNTS_URL, data),
  update: (id, data) => api.put(`${ACCOUNTS_URL}/${id}`, data),
  delete: (id) => api.delete(`${ACCOUNTS_URL}/${id}`),
  getSummary: () => api.get(`${ACCOUNTS_URL}/summary`),
  getLedger: (id, params) => api.get(`${ACCOUNTS_URL}/${id}/ledger`, { params }),
  getStatement: (id, params) => api.get(`${ACCOUNTS_URL}/${id}/statement`, { params }),
  addLedgerEntry: (id, data) => api.post(`${ACCOUNTS_URL}/${id}/ledger`, data),
};
