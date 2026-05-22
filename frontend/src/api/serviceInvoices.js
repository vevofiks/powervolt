import axios from './axios';

export const serviceInvoiceApi = {
  getAll: (params) => axios.get('/service-invoices', { params }),
  getById: (id) => axios.get(`/service-invoices/${id}`),
  create: (data) => axios.post('/service-invoices', data),
};
