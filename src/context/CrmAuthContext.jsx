import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { crmApi, getCrmToken, getStoredStaff, clearCrmAuth } from '../services/crmApi';

const CrmAuthContext = createContext(null);

export function CrmAuthProvider({ children }) {
  const [token, setToken] = useState(() => getCrmToken());
  const [staff, setStaff] = useState(() => getStoredStaff());
  const [loading, setLoading] = useState(true);

  // Validate session on boot if token exists
  useEffect(() => {
    let isMounted = true;
    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await crmApi.me();
        if (isMounted && res.staff) {
          setStaff(res.staff);
        }
      } catch (err) {
        console.warn('CRM session expired or invalid:', err);
        if (isMounted) {
          clearCrmAuth();
          setToken(null);
          setStaff(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifySession();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = useCallback(async (email, password, remember = true) => {
    const res = await crmApi.login(email, password, remember);
    setToken(res.token);
    setStaff(res.staff);
    return res;
  }, []);

  const refreshStaff = useCallback(async () => {
    const res = await crmApi.me();
    if (res.staff) {
      setStaff(res.staff);
      try {
        const remember = Boolean(localStorage.getItem('invio_crm_staff_token'));
        if (remember) localStorage.setItem('invio_crm_staff_user', JSON.stringify(res.staff));
        else sessionStorage.setItem('invio_crm_staff_user', JSON.stringify(res.staff));
      } catch { /* storage best-effort */ }
    }
    return res.staff;
  }, []);

  const logout = useCallback(() => {
    clearCrmAuth();
    setToken(null);
    setStaff(null);
    window.location.href = '/login';
  }, []);

  const hasRole = useCallback(
    (...roles) => {
      if (!staff || !staff.role) return false;
      return roles.includes(staff.role);
    },
    [staff]
  );

  const value = useMemo(
    () => ({
      token,
      staff,
      loading,
      isAuthenticated: Boolean(token && staff),
      mustChangePassword: Boolean(staff?.mustChangePassword),
      isAdmin: staff?.role === 'admin',
      isManager: staff?.role === 'manager',
      isSales: staff?.role === 'sales_executive',
      isSupport: staff?.role === 'support_executive',
      isManagerOrAdmin: staff?.role === 'admin' || staff?.role === 'manager',
      canViewUnmaskedPii: staff?.role === 'admin' || staff?.role === 'manager',
      login,
      logout,
      refreshStaff,
      hasRole,
    }),
    [token, staff, loading, login, logout, refreshStaff, hasRole]
  );

  return <CrmAuthContext.Provider value={value}>{children}</CrmAuthContext.Provider>;
}

export function useCrmAuth() {
  const ctx = useContext(CrmAuthContext);
  if (!ctx) {
    throw new Error('useCrmAuth must be used within a CrmAuthProvider');
  }
  return ctx;
}
