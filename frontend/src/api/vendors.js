import axios from './axios';

export const vendorApi = {
  getAll: (params) => axios.get('/vendors', { params }),
  getById: (id) => axios.get(`/vendors/${id}`),
  create: (data) => axios.post('/vendors', data),
  update: (id, data) => axios.put(`/vendors/${id}`, data),
  delete: (id) => axios.delete(`/vendors/${id}`),
};
