import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wareach_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('wareach_token');
        localStorage.removeItem('wareach_user');
        const reason = error.response?.data?.error || 'Your security session has expired. Please log in again.';
        window.dispatchEvent(new CustomEvent('wareach_logout', { detail: { reason } }));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
