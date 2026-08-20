import api from './axios';

/** Database Keep-Alive API helpers */
export const dbApi = {
  refresh: () => api.get('/db/refresh'),
  getStatus: () => api.get('/db/status'),
};
