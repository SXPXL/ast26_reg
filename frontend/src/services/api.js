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
      const errorMsg = data.detail || data.message || `Request failed with status ${response.status}`;
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

  // Events Endpoints
  getEvents: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.event_type) query.append('event_type', params.event_type);
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
  getRegistrations: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.event_id) query.append('event_id', params.event_id);
    if (params.payment_status) query.append('payment_status', params.payment_status);
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
};
