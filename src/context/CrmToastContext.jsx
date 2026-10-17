import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';

const CrmToastContext = createContext(null);

let toastSeq = 0;

export function CrmToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) {
      clearTimeout(tm);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (type, message, title = '') => {
      const id = ++toastSeq;
      const toast = { id, type, message: String(message || ''), title };
      setToasts((prev) => [...prev.slice(-4), toast]); // keep max 5 stacked
      const tm = setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000);
      timers.current.set(id, tm);
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (msg, title = 'Success') => push('success', msg, title),
      error: (msg, title = 'Error') => push('error', msg, title),
      warning: (msg, title = 'Warning') => push('warning', msg, title),
      info: (msg, title = 'Info') => push('info', msg, title),
    }),
    [push]
  );

  const value = useMemo(
    () => ({
      toasts,
      dismiss,
      toast,
      notify: push,
      addToast: (msg, type = 'info') => push(type, msg),
    }),
    [toasts, dismiss, toast, push]
  );

  return <CrmToastContext.Provider value={value}>{children}</CrmToastContext.Provider>;
}

export function useCrmToast() {
  const ctx = useContext(CrmToastContext);
  if (!ctx) {
    // graceful fallback so pages never crash if provider missing
    return {
      toasts: [],
      dismiss: () => {},
      toast: {
        success: (m) => console.log('[toast success]', m),
        error: (m) => console.warn('[toast error]', m),
        warning: (m) => console.warn('[toast warning]', m),
        info: (m) => console.log('[toast info]', m),
      },
      notify: (t, m) => console.log('[toast]', t, m),
    };
  }
  return ctx;
}
