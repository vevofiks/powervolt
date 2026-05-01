import api from './axios';

const SALARY_URL = '/salaries';

export const salaryApi = {
  getAll: (params) => api.get(SALARY_URL, { params }),
  create: (data) => api.post(SALARY_URL, data),
  delete: (id) => api.delete(`${SALARY_URL}/${id}`),
};
