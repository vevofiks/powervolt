import api from './axios';

const WORKSITE_URL = '/work-sites';

export const workSiteApi = {
  getAll: (params) => api.get(WORKSITE_URL, { params }),
  getById: (id) => api.get(`${WORKSITE_URL}/${id}`),
  create: (data) => api.post(WORKSITE_URL, data),
  update: (id, data) => api.put(`${WORKSITE_URL}/${id}`, data),
  delete: (id) => api.delete(`${WORKSITE_URL}/${id}`),
  
  // Site Actions
  assignWorkers: (id, workerIds) => api.post(`${WORKSITE_URL}/${id}/assign-workers`, { workerIds }),
  removeWorker: (id, workerId) => api.delete(`${WORKSITE_URL}/${id}/workers/${workerId}`),
  addWorkEntry: (id, data) => api.post(`${WORKSITE_URL}/${id}/work-entries`, data),
  deleteWorkEntry: (entryId) => api.delete(`${WORKSITE_URL}/work-entries/${entryId}`),
};
