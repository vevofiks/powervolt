import api from './axios';

export const reportApi = {
  getProfitLoss: (params) => api.get('/reports/profit-loss', { params }),
  getInventory: () => api.get('/reports/inventory'),
  getGst: (params) => api.get('/reports/gst', { params }),
};
