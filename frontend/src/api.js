const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const api = {
  async get(path) {
    const r = await fetch(`${BASE}${path}`);
    if (!r.ok) throw new Error(`API ${r.status}: ${r.statusText}`);
    return r.json();
  },
  stats:    () => api.get('/api/stats'),
  sessions: () => api.get('/api/sessions'),
  session:  (id) => api.get(`/api/sessions/${encodeURIComponent(id)}`),
  pages:    () => api.get('/api/pages'),
  heatmap:  (url) => api.get(`/api/heatmap?page_url=${encodeURIComponent(url)}`),
};
