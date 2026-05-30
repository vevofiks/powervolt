import api from './axios';

const SALES_URL = '/sales-invoices';

export const salesInvoiceApi = {
  getAll: (params) => api.get(SALES_URL, { params }),
  getById: (id) => api.get(`${SALES_URL}/${id}`),
  create: (data) => api.post(SALES_URL, data),
  delete: (id) => api.delete(`${SALES_URL}/${id}`),
  updatePaymentStatus: (id, status) => api.patch(`${SALES_URL}/${id}/payment-status`, { paymentStatus: status }),
};
