import { useState, useEffect } from 'react';

/** Returns `value` delayed by `delay`ms — resets on every change (for search inputs). */
export function useDebouncedValue(value, delay = 600) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** True for HTTP 429 / rate-limiter rejections — show a warning, not an error. */
export function isRateLimitError(err) {
  return /too many|429|rate limit|slow down/i.test(String(err?.message || err || ''));
}
