import axios from './axios';

export const serviceInvoiceApi = {
  getAll: (params) => axios.get('/service-invoices', { params }),
  getById: (id) => axios.get(`/service-invoices/${id}`),
  create: (data) => axios.post('/service-invoices', data),
  updatePaymentStatus: (id, status) => axios.patch(`/service-invoices/${id}/payment-status`, { paymentStatus: status }),
};
