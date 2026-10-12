const TOKEN_KEY = 'invio_crm_staff_token';
const STAFF_KEY = 'invio_crm_staff_user';

export function getCrmToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setCrmToken(token, remember = true) {
  try {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  } catch (e) {
    console.warn('Storage quota or error setting token:', e);
  }
}

export function clearCrmAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STAFF_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(STAFF_KEY);
  } catch (e) {
    console.warn('Error clearing auth:', e);
  }
}

export function getStoredStaff() {
  try {
    const raw = localStorage.getItem(STAFF_KEY) || sessionStorage.getItem(STAFF_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredStaff(staff, remember = true) {
  try {
    const json = JSON.stringify(staff);
    if (remember) {
      localStorage.setItem(STAFF_KEY, json);
    } else {
      sessionStorage.setItem(STAFF_KEY, json);
    }
  } catch (e) {
    console.warn('Error setting staff:', e);
  }
}

const ENV_API_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : '';

export const API_BASE_URL = ENV_API_URL
  || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? ''
    : 'https://api.invio.timrio.com');

function resolveApiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return `/api/crm${cleanPath}`;
  }
  return `${API_BASE_URL}/api/crm${cleanPath}`;
}

async function request(endpoint, options = {}) {
  const url = resolveApiUrl(endpoint);
  const token = getCrmToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      clearCrmAuth();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    const errMessage = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errMessage);
  }

  return data;
}

export const crmApi = {
  // Auth
  async login(email, password, remember = true) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token && res.staff) {
      setCrmToken(res.token, remember);
      setStoredStaff(res.staff, remember);
    }
    return res;
  },

  async me() {
    return request('/auth/me');
  },

  // Dashboard
  async getDashboardMetrics() {
    return request('/dashboard');
  },

  // Customers
  async getCustomers({ page = 1, limit = 15, search = '', plan = '', assignedStaffId = '' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(search ? { search } : {}),
      ...(plan ? { plan } : {}),
      ...(assignedStaffId ? { assignedStaffId } : {}),
    });
    return request(`/customers?${params.toString()}`);
  },

  async getCustomerDetail(customerId) {
    return request(`/customers/${encodeURIComponent(customerId)}`);
  },

  async assignCustomerStaff(customerId, staffId) {
    return request(`/customers/${encodeURIComponent(customerId)}/assign`, {
      method: 'POST',
      body: JSON.stringify({ staffId }),
    });
  },

  async addCustomerNote(customerId, note) {
    return request(`/customers/${encodeURIComponent(customerId)}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  async updateCustomer(customerId, payload) {
    return request(`/customers/${encodeURIComponent(customerId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteCustomer(customerId) {
    return request(`/customers/${encodeURIComponent(customerId)}`, {
      method: 'DELETE',
    });
  },

  // Discounts
  async getDiscounts({ customerId = '', status = '', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(customerId ? { customerId } : {}),
      ...(status ? { status } : {}),
    });
    return request(`/discounts?${params.toString()}`);
  },

  async createDiscount(payload) {
    return request('/discounts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getApprovalRequests({ status = 'pending', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status ? { status } : {}),
    });
    return request(`/discounts/approvals?${params.toString()}`);
  },

  async reviewApproval(requestId, decision, comment = '') {
    return request(`/discounts/approvals/${encodeURIComponent(requestId)}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, comment }),
    });
  },

  // Coupons
  async getCoupons({ status = '', search = '', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
    });
    return request(`/coupons?${params.toString()}`);
  },

  async createCoupon(payload) {
    return request('/coupons', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCouponStatus(couponId, status) {
    return request(`/coupons/${encodeURIComponent(couponId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async validateCoupon(payload) {
    return request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Support Tickets
  async getTickets({ status = '', category = '', priority = '', assignedStaffId = '', search = '', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(priority ? { priority } : {}),
      ...(assignedStaffId ? { assignedStaffId } : {}),
      ...(search ? { search } : {}),
    });
    return request(`/tickets?${params.toString()}`);
  },

  async getTicketDetail(ticketId) {
    return request(`/tickets/${encodeURIComponent(ticketId)}`);
  },

  async createTicket(payload) {
    return request('/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateTicketStatus(ticketId, status, resolution = '') {
    return request(`/tickets/${encodeURIComponent(ticketId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolution }),
    });
  },

  async addTicketComment(ticketId, message, isInternal = false) {
    return request(`/tickets/${encodeURIComponent(ticketId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message, isInternal }),
    });
  },

  async assignTicket(ticketId, assignedStaffId) {
    return request(`/tickets/${encodeURIComponent(ticketId)}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedStaffId }),
    });
  },

  // Staff Management
  async getStaffList() {
    return request('/staff');
  },

  async createStaff(payload) {
    return request('/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateStaffStatus(staffId, status) {
    return request(`/staff/${encodeURIComponent(staffId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async updateStaff(staffId, payload) {
    return request(`/staff/${encodeURIComponent(staffId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteStaff(staffId) {
    return request(`/staff/${encodeURIComponent(staffId)}`, {
      method: 'DELETE',
    });
  },

  // Audit Logs
  async getAuditLogs({ page = 1, limit = 25, targetType = '', action = '' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(targetType ? { targetType } : {}),
      ...(action ? { action } : {}),
    });
    return request(`/audit-logs?${params.toString()}`);
  },
};
