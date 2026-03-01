// Match Vite base so API calls work when app is at e.g. /communitree/
const API_BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

function getToken() {
  return localStorage.getItem('ct_token');
}

export function setToken(token) {
  localStorage.setItem('ct_token', token);
}

export function clearToken() {
  localStorage.removeItem('ct_token');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.detail || data?.error || data?.errors?.[0]?.msg || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const auth = {
  login: (username, password) => request('POST', '/auth/login', { username, password }),
  register: (data) => request('POST', '/auth/register', data),
  me: () => request('GET', '/auth/me'),
};

export const users = {
  getProfile: () => request('GET', '/users/me'),
  updateProfile: (data) => request('PATCH', '/users/me', data),
  getFriends: () => request('GET', '/users/me/friends'),
  getFriendRequests: () => request('GET', '/users/me/friends/requests'),
  sendFriendRequest: (userId) => request('POST', '/users/me/friends', { user_id: userId }),
  acceptFriendRequest: (id) => request('POST', `/users/me/friends/requests/${id}/accept`),
  declineFriendRequest: (id) => request('POST', `/users/me/friends/requests/${id}/decline`),
  removeFriend: (userId) => request('DELETE', `/users/me/friends/${userId}`),
  getPublicProfile: (id) => request('GET', `/users/${id}`),
  getCommunities: () => request('GET', '/users/me/communities'),
  getLocations: () => request('GET', '/users/me/locations'),
  getEvents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/users/me/events${qs ? '?' + qs : ''}`);
  },
  getRatings: () => request('GET', '/users/me/ratings'),
  getConfig: () => request('GET', '/users/me/config'),
  updateConfig: (data) => request('PATCH', '/users/me/config', data),
  setAvatar: (data) => request('POST', '/users/me/avatar', data),
};

export const communities = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/communities${qs ? '?' + qs : ''}`);
  },
  get: (id) => request('GET', `/communities/${id}`),
  getEvents: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/communities/${id}/events${qs ? '?' + qs : ''}`);
  },
  getMembers: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/communities/${id}/members${qs ? '?' + qs : ''}`);
  },
  create: (data) => request('POST', '/communities', data),
  update: (id, data) => request('PATCH', `/communities/${id}`, data),
  join: (id) => request('POST', `/communities/${id}/join`),
  leave: (id) => request('POST', `/communities/${id}/leave`),
  invite: (id, data) => request('POST', `/communities/${id}/invite`, data),
  getInvites: () => request('GET', '/communities/invites'),
  acceptInvite: (inviteId) => request('POST', `/communities/invites/${inviteId}/accept`),
  declineInvite: (inviteId) => request('POST', `/communities/invites/${inviteId}/decline`),
};

export const events = {
  create: (data) => request('POST', '/events', data),
  get: (id) => request('GET', `/events/${id}`),
  update: (id, data) => request('PATCH', `/events/${id}`, data),
  delete: (id) => request('DELETE', `/events/${id}`),
  rsvp: (id) => request('POST', `/events/${id}/rsvp`),
  removeRsvp: (id) => request('DELETE', `/events/${id}/rsvp`),
  getRsvps: (id) => request('GET', `/events/${id}/rsvps`),
  getMyRsvp: (id) => request('GET', `/events/${id}/my-rsvp`),
  rate: (id, rating) => request('POST', `/events/${id}/rate`, { rating }),
  getRatings: (id) => request('GET', `/events/${id}/ratings`),
  getMyRating: (id) => request('GET', `/events/${id}/my-rating`),
  water: (id) => request('POST', `/events/${id}/water`),
  unwater: (id) => request('DELETE', `/events/${id}/water`),
  getWaters: (id) => request('GET', `/events/${id}/waters`),
  getMyWater: (id) => request('GET', `/events/${id}/my-water`),
};
