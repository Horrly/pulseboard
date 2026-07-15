import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pb_access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: refresh token on 401 ───────────────────────────────
let _isRefreshing = false;
let _queue = [];

function processQueue(error, token = null) {
  _queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  _queue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      localStorage.getItem('pb_refresh')
    ) {
      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _queue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      _isRefreshing = true;

      try {
        const { data } = await axios.post('/api/auth/token/refresh/', {
          refresh: localStorage.getItem('pb_refresh'),
        });
        localStorage.setItem('pb_access', data.access);
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        // Refresh failed — force logout
        localStorage.removeItem('pb_access');
        localStorage.removeItem('pb_refresh');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        _isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
