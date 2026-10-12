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
  ? import.meta.env.VITE_API_URL.trim()
  : '';

const APP_ENV = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APP_ENV
  ? String(import.meta.env.VITE_APP_ENV).toLowerCase()
  : '';

const IS_DEV_BUILD = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV === true;

// dev environment => LOCAL API ONLY (same-origin /api proxy, never production)
const IS_LOCAL_ENV = IS_DEV_BUILD
  || APP_ENV === 'development'
  || APP_ENV === 'dev'
  || APP_ENV === 'local'
  || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

export const API_BASE_URL = IS_LOCAL_ENV
  ? ''
  : (ENV_API_URL || 'https://api.invio.timrio.com');

export const APP_RUNTIME_ENV = IS_LOCAL_ENV ? 'development' : 'production';

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

  async changePassword(currentPassword, newPassword) {
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
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

  async createCustomer(payload) {
    return request('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async registerCustomer(payload) {
    return request('/customers/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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

  async updateDiscount(discountId, payload) {
    return request(`/discounts/${encodeURIComponent(discountId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async revokeDiscount(discountId) {
    return request(`/discounts/${encodeURIComponent(discountId)}/revoke`, {
      method: 'PATCH',
    });
  },

  async deleteDiscount(discountId) {
    return request(`/discounts/${encodeURIComponent(discountId)}`, {
      method: 'DELETE',
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

  async updateCoupon(couponId, payload) {
    return request(`/coupons/${encodeURIComponent(couponId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteCoupon(couponId) {
    return request(`/coupons/${encodeURIComponent(couponId)}`, {
      method: 'DELETE',
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

  // Bug Reports (STORE: Google Sheet)
  async getBugs({ status = '', severity = '', search = '', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
      ...(search ? { search } : {}),
    });
    return request(`/bugs?${params.toString()}`);
  },

  async updateBugStatus(ticketId, status) {
    return request(`/bugs/${encodeURIComponent(ticketId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Contact Submissions (STORE: Google Sheet)
  async getContacts({ status = '', search = '', breached = false, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
      ...(breached ? { breached: '1' } : {}),
    });
    return request(`/contacts?${params.toString()}`);
  },

  async updateContactStatus(id, status) {
    return request(`/contacts/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
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

  async deleteTicket(ticketId) {
    return request(`/tickets/${encodeURIComponent(ticketId)}`, {
      method: 'DELETE',
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

  // Subscription Plans (real catalog data, admin-managed pricing)
  async getPlans() {
    return request('/plans');
  },

  async updatePlan(planId, payload) {
    return request(`/plans/${encodeURIComponent(planId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async createPlan(payload) {
    return request('/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Audit Logs (STORE: Google Sheet — backend reads/writes the Sheet directly)
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
