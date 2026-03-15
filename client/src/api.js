const BASE = '';

function getAdminToken() {
  return localStorage.getItem('admin_token');
}

async function request(url, options = {}) {
  const res = await fetch(BASE + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

function adminRequest(url, options = {}) {
  return request(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${getAdminToken()}`,
    },
  });
}

// User APIs
export const redeemCdk = (cdk) => request('/api/redeem', { method: 'POST', body: JSON.stringify({ cdk }) });
export const getStatus = (key) => request(`/api/status?key=${encodeURIComponent(key)}`);
export const getUsage = (key, page = 1) => request(`/api/usage?key=${encodeURIComponent(key)}&page=${page}`);

// Admin auth
export const adminLogin = (password) => request('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });

// Admin CDKs
export const getCdks = (page = 1, status = '') => adminRequest(`/api/admin/cdks?page=${page}${status ? `&status=${status}` : ''}`);
export const createCdks = (data) => adminRequest('/api/admin/cdks', { method: 'POST', body: JSON.stringify(data) });
export const updateCdk = (id, data) => adminRequest(`/api/admin/cdks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const batchUpdateCdks = (data) => adminRequest('/api/admin/cdks/batch', { method: 'PUT', body: JSON.stringify(data) });
export const batchDeleteCdks = (ids) => adminRequest('/api/admin/cdks/batch/delete', { method: 'POST', body: JSON.stringify({ ids }) });

// Admin pricing
export const getPricing = () => adminRequest('/api/admin/pricing');
export const savePricing = (data) => adminRequest('/api/admin/pricing', { method: 'POST', body: JSON.stringify(data) });
export const deletePricing = (id) => adminRequest(`/api/admin/pricing/${id}`, { method: 'DELETE' });

// Admin API keys
export const getApiKeys = (page = 1) => adminRequest(`/api/admin/apikeys?page=${page}`);
export const updateApiKey = (id, data) => adminRequest(`/api/admin/apikeys/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Admin stats
export const getStats = () => adminRequest('/api/admin/stats');
export const getAdminUsage = (page = 1, apiKeyId = '') => adminRequest(`/api/admin/stats/usage?page=${page}${apiKeyId ? `&apiKeyId=${apiKeyId}` : ''}`);
