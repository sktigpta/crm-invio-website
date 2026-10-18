import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../services/crmApi';

const POLL_INTERVAL_MS = 60000;

const CHECK_LABELS = {
  api: 'API',
  database: 'Database',
  redis: 'Cache',
  payments: 'Payments',
  email: 'Email',
};

function checkDotClass(status) {
  if (status === 'healthy' || status === 'running') return 'bg-emerald-500';
  if (status === 'not_configured' || status === 'degraded') return 'bg-amber-500';
  return 'bg-red-500';
}

function checkText(status) {
  if (!status) return 'Unknown';
  if (status === 'healthy') return 'Running';
  if (status === 'not_configured') return 'Not configured';
  if (status === 'degraded') return 'Degraded';
  if (status === 'unavailable') return 'Down';
  return status;
}

/**
 * Live server-health indicator for the CRM header / login page.
 *
 * Public endpoint — works logged-out. Green = server healthy, yellow = one or
 * more services degraded or not configured, red = server unreachable.
 * Hover reveals the per-service breakdown from /api/health.
 */
export function CrmServerHealthDot() {
  const [health, setHealth] = useState(null);
  const [unreachable, setUnreachable] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const base = API_BASE_URL || '';
      const res = await fetch(`${base}/api/health?format=json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data);
      setUnreachable(false);
    } catch {
      setUnreachable(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchHealth();
    const timer = setInterval(() => {
      if (mounted) fetchHealth();
    }, POLL_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [fetchHealth]);

  const overall = unreachable ? 'unreachable' : health?.status || 'unknown';
  const dotClass = unreachable || overall === 'unhealthy'
    ? 'bg-red-500 ring-red-100'
    : overall === 'healthy'
      ? 'bg-emerald-500 ring-emerald-100'
      : 'bg-amber-500 ring-amber-100';

  const tooltipTitle = unreachable
    ? 'Server unreachable'
    : overall === 'healthy'
      ? `Server healthy${health?.version ? ` (v${health.version})` : ''}`
      : `Server degraded${health?.version ? ` (v${health.version})` : ''}`;

  const checks = health?.checks || {};

  return (
    <div className="relative group flex items-center">
      <div
        className={`size-2 rounded-full ml-1 ring-2 cursor-pointer ${dotClass}`}
        title={tooltipTitle}
        aria-label={tooltipTitle}
        role="status"
      />
      {/* Hover panel: full API health breakdown */}
      <div className="hidden group-hover:block absolute right-0 top-4 z-50 w-56 bg-white border border-slate-200 shadow-lg rounded-md p-2.5 text-left">
        <div className="text-[11px] font-bold text-slate-900 mb-1.5">
          {tooltipTitle}
        </div>
        {unreachable ? (
          <div className="text-[11px] text-slate-500">
            Could not reach the API. Check your connection or server status.
          </div>
        ) : (
          <ul className="space-y-1">
            {Object.keys(CHECK_LABELS).map((key) => (
              <li key={key} className="flex items-center gap-2 text-[11px]">
                <span className={`size-1.5 rounded-full flex-shrink-0 ${checkDotClass(checks[key])}`} />
                <span className="font-medium text-slate-600">{CHECK_LABELS[key]}</span>
                <span className="ml-auto text-slate-500">{checkText(checks[key])}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
