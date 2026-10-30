const API_BASE = '/api/v1';

/**
 * Generic API request handler with JWT token injection
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('athra_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      let errorMsg = `Request failed with status ${response.status}`;
      if (typeof data.detail === 'string') {
        errorMsg = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMsg = data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      } else if (data.detail && typeof data.detail === 'object') {
        errorMsg = JSON.stringify(data.detail);
      } else if (data.message) {
        errorMsg = data.message;
      }
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Auth Endpoints
  login: async (username, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  getMe: async () => {
    return apiRequest('/auth/me');
  },
  changeCredentials: async (credentialsData) => {
    return apiRequest('/auth/credentials', {
      method: 'PUT',
      body: JSON.stringify(credentialsData),
    });
  },

  // Events Endpoints
  getEvents: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.event_type) query.append('event_type', params.event_type);
    if (params.include_inactive) query.append('include_inactive', 'true');
    if (params.is_active !== undefined) query.append('is_active', params.is_active);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/events${qs}`);
  },
  getEvent: async (id) => {
    return apiRequest(`/events/${id}`);
  },
  createEvent: async (eventData) => {
    return apiRequest('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },
  updateEvent: async (id, eventData) => {
    return apiRequest(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },
  deleteEvent: async (id) => {
    return apiRequest(`/events/${id}`, {
      method: 'DELETE',
    });
  },
  assignVolunteers: async (eventId, userIds) => {
    return apiRequest(`/events/${eventId}/volunteers`, {
      method: 'POST',
      body: JSON.stringify({ user_ids: userIds }),
    });
  },
  removeVolunteerFromEvent: async (eventId, userId) => {
    return apiRequest(`/events/${eventId}/volunteers/${userId}`, {
      method: 'DELETE',
    });
  },

  // Volunteers Endpoints
  getVolunteers: async () => {
    return apiRequest('/volunteers');
  },
  createVolunteer: async (volunteerData) => {
    return apiRequest('/volunteers', {
      method: 'POST',
      body: JSON.stringify(volunteerData),
    });
  },
  getMyEvents: async () => {
    return apiRequest('/volunteers/my-events');
  },

  // Registrations Endpoints
  createRegistration: async (regData) => {
    return apiRequest('/registrations', {
      method: 'POST',
      body: JSON.stringify(regData),
    });
  },
  getRegistrationByCode: async (code) => {
    return apiRequest(`/registrations/code/${code}`);
  },
  getRegistrationsByEmail: async (email) => {
    return apiRequest(`/registrations/by-email/${encodeURIComponent(email)}`);
  },
  recheckRegistrationPayment: async (registrationId) => {
    return apiRequest(`/registrations/${registrationId}/recheck-payment`, {
      method: 'POST',
    });
  },
  getRegistrations: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.event_id) query.append('event_id', params.event_id);
    if (params.payment_status) query.append('payment_status', params.payment_status);
    if (params.payment_mode) query.append('payment_mode', params.payment_mode);
    if (params.attendance_status) query.append('attendance_status', params.attendance_status);
    if (params.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/registrations${qs}`);
  },
  getRegistration: async (id) => {
    return apiRequest(`/registrations/${id}`);
  },
  updateAttendance: async (id, attendanceStatus) => {
    return apiRequest(`/registrations/${id}/attendance`, {
      method: 'PATCH',
      body: JSON.stringify({ attendance_status: attendanceStatus }),
    });
  },
  deleteRegistration: async (id) => {
    return apiRequest(`/registrations/${id}`, {
      method: 'DELETE',
    });
  },

  // Payments Endpoints
  verifyPayment: async (orderId) => {
    return apiRequest('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    });
  },

  // Admin Stats Endpoints
  getOverviewStats: async () => {
    return apiRequest('/admin/stats/overview');
  },
  getExportUrl: (eventId) => {
    return `/api/v1/admin/stats/export/${eventId}`;
  },
  downloadRegistrationsExcel: async (params = {}) => {
    const token = localStorage.getItem('athra_token') || localStorage.getItem('token');
    const query = new URLSearchParams();
    if (params.event_id && params.event_id !== 'ALL') query.append('event_id', params.event_id);
    if (params.payment_status && params.payment_status !== 'ALL') query.append('payment_status', params.payment_status);
    if (params.attendance_status && params.attendance_status !== 'ALL') query.append('attendance_status', params.attendance_status);
    if (params.payment_mode && params.payment_mode !== 'ALL') query.append('payment_mode', params.payment_mode);
    if (params.search) query.append('search', params.search);
    if (token) query.append('token', token);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`/api/v1/admin/stats/export-xlsx${qs}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to download Excel file');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = params.filename || `Asthra26_Participants_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

export default api;
