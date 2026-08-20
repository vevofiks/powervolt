import api from './axios';

export const dbApi = {
  refresh: () => api.get('/db/refresh'),
  getStatus: () => api.get('/db/status'),
};
