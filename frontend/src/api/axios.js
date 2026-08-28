import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'));
    const isNetworkError = !error.response && !isTimeout;

    let userFacingMessage = error.response?.data?.message;

    if (!userFacingMessage) {
      if (isTimeout) {
        userFacingMessage = 'Unable to connect to the server. The server may be starting up—please try again in a few seconds.';
      } else if (isNetworkError) {
        userFacingMessage = 'Unable to connect to the server. Please check your network connection and try again.';
      } else {
        userFacingMessage = error.message || 'Something went wrong';
      }
    }

    // Preserve technical diagnostic error in browser console
    console.error('[API Diagnostic Error]', {
      code: error.code,
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      userFacingMessage,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      // Only redirect if not already on the login page or landing page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }

    return Promise.reject({
      message: userFacingMessage,
      technicalDetails: error.message,
      status: error.response?.status,
      isTimeout,
      isNetworkError,
    });
  }
);

export default api;

