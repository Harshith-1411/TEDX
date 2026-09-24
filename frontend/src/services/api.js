const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    const error = new Error('Request failed');
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch {
      error.data = null;
    }
    throw error;
  }

  return response.json();
}

async function adminRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = new Error('Admin request failed');
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch {
      error.data = null;
    }
    throw error;
  }

  return response.status === 204 ? null : response.json();
}

export function getTeamMembers() {
  return request('/api/team');
}

export function getSiteSettings() {
  return request('/api/site-settings');
}

export function getTeamMemberBySlug(slug) {
  return request(`/api/team/${slug}`);
}

export function adminLogin(username, password) {
  return request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export function getAdminMembers(token) {
  return adminRequest('/api/admin/team', { token });
}

export function createAdminMember(token, member) {
  return adminRequest('/api/admin/team', {
    token,
    method: 'POST',
    body: JSON.stringify(member),
  });
}

export function updateAdminMember(token, id, member) {
  return adminRequest(`/api/admin/team/${id}`, {
    token,
    method: 'PUT',
    body: JSON.stringify(member),
  });
}

export function deleteAdminMember(token, id) {
  return adminRequest(`/api/admin/team/${id}`, {
    token,
    method: 'DELETE',
  });
}

export function logoutAdmin(token) {
  return adminRequest('/api/admin/logout', { token, method: 'POST' });
}
