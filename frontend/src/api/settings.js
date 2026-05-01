import api from './axios';

export const settingApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  backup: () => api.get('/settings/backup'),
};
