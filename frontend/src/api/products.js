import api from './axios';

const PRODUCTS_URL = '/products';

export const productApi = {
  getAll: (params) => api.get(PRODUCTS_URL, { params }),
  getById: (id) => api.get(`${PRODUCTS_URL}/${id}`),
  create: (data) => api.post(PRODUCTS_URL, data),
  update: (id, data) => api.put(`${PRODUCTS_URL}/${id}`, data),
  delete: (id) => api.delete(`${PRODUCTS_URL}/${id}`),
  search: (q) => api.get(`${PRODUCTS_URL}/search`, { params: { q } }),
  getLowStock: () => api.get(`${PRODUCTS_URL}/low-stock`),
  findOrCreate: (data) => api.post(`${PRODUCTS_URL}/find-or-create`, data),
  getStockHistory: (id, params) => api.get(`${PRODUCTS_URL}/${id}/stock-history`, { params }),
  addStockAdjustment: (id, data) => api.post(`${PRODUCTS_URL}/${id}/stock-adjustment`, data),
};
