import axios from './axios';

export const purchaseBillApi = {
  getAll: (params) => axios.get('/purchase-bills', { params }),
  getById: (id) => axios.get(`/purchase-bills/${id}`),
  create: (data) => axios.post('/purchase-bills', data),
  update: (id, data) => axios.put(`/purchase-bills/${id}`, data),
  updatePaymentStatus: (id, status) => axios.patch(`/purchase-bills/${id}/payment-status`, { paymentStatus: status }),
  delete: (id) => axios.delete(`/purchase-bills/${id}`),
};
