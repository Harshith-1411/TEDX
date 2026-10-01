// Dev: talk to local Express server. Production: call the Netlify Function directly.
// Using '/.netlify/functions' as the base means request('/api/team') resolves to
// '/.netlify/functions/api/team', which is the deployed function's actual URL.
// This bypasses the /api/* → /.netlify/functions/api/:splat redirect entirely.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '/.netlify/functions');

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
  const { token, body, ...rest } = options;

  // If body is a FormData instance (image upload), do NOT set Content-Type.
  // The browser will set it automatically including the multipart boundary.
  const isFormData = body instanceof FormData;
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    body,
    headers,
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

/**
 * Build a FormData payload for member/faculty create or update.
 * If `member.image` is a File object it is sent as multipart.
 * If `member.image` is a string (existing Cloudinary URL or old base64),
 * it is sent as a plain field so the backend can preserve it.
 */
function buildMemberFormData(member) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(member)) {
    if (key === 'image') {
      if (value instanceof File) {
        fd.append('image', value);
      } else if (typeof value === 'string') {
        fd.append('image', value);
      }
      // Skip null/undefined image — backend will keep the existing value
    } else if (value !== null && value !== undefined) {
      fd.append(key, value);
    }
  }
  return fd;
}

export function getTeamMembers() {
  return request('/api/team');
}

export function getFacultyMembers() {
  return request('/api/faculty');
}

export function getSiteSettings() {
  return request('/api/site-settings');
}

export function getTeamMemberBySlug(slug) {
  return request(`/api/team/${slug}`);
}

export function getFacultyBySlug(slug) {
  return request(`/api/faculty/${slug}`);
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
    body: buildMemberFormData(member),
  });
}

export function updateAdminMember(token, id, member) {
  return adminRequest(`/api/admin/team/${id}`, {
    token,
    method: 'PUT',
    body: buildMemberFormData(member),
  });
}

export function deleteAdminMember(token, id) {
  return adminRequest(`/api/admin/team/${id}`, {
    token,
    method: 'DELETE',
  });
}

export function getAdminFaculty(token) {
  return adminRequest('/api/admin/faculty', { token });
}

export function createAdminFaculty(token, member) {
  return adminRequest('/api/admin/faculty', {
    token,
    method: 'POST',
    body: buildMemberFormData(member),
  });
}

export function updateAdminFaculty(token, id, member) {
  return adminRequest(`/api/admin/faculty/${id}`, {
    token,
    method: 'PUT',
    body: buildMemberFormData(member),
  });
}

export function deleteAdminFaculty(token, id) {
  return adminRequest(`/api/admin/faculty/${id}`, {
    token,
    method: 'DELETE',
  });
}

export function logoutAdmin(token) {
  return adminRequest('/api/admin/logout', { token, method: 'POST' });
}

export function getFooter() {
  return request('/api/footer');
}

export function updateAdminFooter(token, footer) {
  return adminRequest('/api/admin/footer', {
    token,
    method: 'PUT',
    body: JSON.stringify(footer),
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Upload a new header or footer logo.
 * @param {string} token  Admin auth token
 * @param {'header'|'footer'} type  Which logo to replace
 * @param {File} file  The image file to upload
 * @returns {Promise<object>}  Updated site settings object
 */
export function updateAdminLogo(token, type, file) {
  const fd = new FormData();
  fd.append('logo', file);
  return adminRequest(`/api/admin/logos/${type}`, {
    token,
    method: 'PUT',
    body: fd,
  });
}

