import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';
import { useCrmToast } from '../context/CrmToastContext';
import { useDebouncedValue, isRateLimitError } from '../hooks/useDebouncedValue';
import {
  downloadAuditLogsCsv,
  getGoogleSheetUrl,
} from '../services/googleSheets';
import { RefreshCwIcon, AlertCircleIcon, SearchIcon } from '../components/CrmIcons';
import { TableSkeleton } from '../components/common/Skeleton';

function labelize(key) {
  return String(key || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Field';
}

function prettyValue(value) {
  if (value == null || value === '') return '—';
  const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return s.length > 90 ? `${s.slice(0, 90)}…` : s;
}

function summarizeLog(log) {
  const d = (log.details && typeof log.details === 'object' ? log.details : {}) || {};
  const pick = (...keys) => {
    for (const k of keys) {
      if (d[k] != null && d[k] !== '') return prettyValue(d[k]);
    }
    return null;
  };
  const facts = [];
  const add = (label, value) => {
    if (value != null && value !== '—') facts.push([label, value]);
  };
  let headline = String(log.action || 'Event').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  switch (log.action) {
    case 'STAFF_LOGIN':
      headline = 'Signed in to the CRM';
      break;
    case 'CREATE_STAFF_MEMBER':
      headline = `Created staff ${pick('email') || ''}`.trim();
      add('Role', pick('role'));
      add('Name', pick('fullName', 'full_name'));
      break;
    case 'UPDATE_PLAN':
      headline = `Updated plan ${pick('planId', 'plan') || log.target_id}`;
      add('Price', pick('price', 'amount', 'priceInr', 'price_yearly'));
      add('Fields', pick('fields', 'updates') && Array.isArray(d.fields || d.updates) ? (d.fields || d.updates).map(labelize).join(', ') : pick('fields', 'updates'));
      break;
    case 'REVOKE_DISCOUNT':
    case 'DELETE_DISCOUNT':
      headline = `${log.action === 'REVOKE_DISCOUNT' ? 'Revoked' : 'Deleted'} discount`;
      add('Customer', pick('customerUserId', 'customerId', 'customerEmail'));
      break;
    case 'APPROVE_DISCOUNT_REQUEST':
    case 'REJECT_DISCOUNT_REQUEST':
      headline = `${log.action.startsWith('APPROVE') ? 'Approved' : 'Rejected'} discount request`;
      add('Value', pick('discountValue', 'discount_value'));
      add('Customer', pick('customerUserId', 'customerId'));
      break;
    default:
      Object.entries(d).slice(0, 6).forEach(([k, v]) => add(labelize(k), prettyValue(v)));
  }
  add('Target', log.target_id ? `${labelize(log.target_type)} · ${prettyValue(log.target_id)}` : null);
  add('IP', log.ip_address);
  return { headline, facts: facts.slice(0, 6) };
}

export function CrmAuditLogsPage() {
  const { toast } = useCrmToast();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [targetType, setTargetType] = useState('');
  const [actionSearch, setActionSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [scope, setScope] = useState('');
  const debouncedAction = useDebouncedValue(actionSearch, 600);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getAuditLogs({
        page,
        limit: 20,
        targetType,
        action: debouncedAction,
      });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setScope(res.scope || '');
    } catch (err) {
      if (isRateLimitError(err)) {
        toast.warning('Too many requests — pausing briefly, then try again.');
        return;
      }
      const msg = err.message || 'Failed to fetch audit logs.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, targetType, debouncedAction, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Audits live in the Google Sheet — this page reads them via GET /audit-logs.
  function handleExportCsv() {
    if (!logs.length) {
      toast.warning('Nothing to export — no audit rows on this page.');
      return;
    }
    const ok = downloadAuditLogsCsv(logs);
    if (ok) toast.success('Audit logs exported as Sheets-ready CSV.');
    else toast.error('CSV export failed.');
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Immutable Audit Logs</h2>
          <p className="text-xs text-slate-500">
            You see your own actions plus your juniors{scope === 'super_admin' ? ' — Super Admin sees everything' : ''}. Stored in Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={getGoogleSheetUrl()}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            title="Open the Google Sheet"
          >
            Open Sheet ↗
          </a>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Export CSV ↓
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition disabled:opacity-50 cursor-pointer"
            title="Refresh"
          >
            <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="size-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3.5 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search action keyword..."
            value={actionSearch}
            onChange={(e) => {
              setActionSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 border border-slate-200 focus:outline-none focus:border-purple-600"
          />
          <SearchIcon className="size-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-slate-500 font-medium">Target Type:</span>
          <select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700"
          >
            <option value="">All Targets</option>
            <option value="customer">Customer</option>
            <option value="discount">Discount</option>
            <option value="coupon">Coupon</option>
            <option value="ticket">Ticket</option>
            <option value="staff">Staff</option>
            <option value="auth">Auth</option>
          </select>
        </div>
      </div>

      {/* Audit Table — one line per row, auto width = longest row */}
      <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="crm-table-wrap overflow-x-auto">
          <table className="crm-table text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-1.5 px-3 whitespace-nowrap">Timestamp</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Staff Actor</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Action</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Target</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <TableSkeleton rows={6} cols={5} />
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 font-sans">
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-1.5 px-3 font-sans whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{log.actor_name || 'Staff'}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{(log.actor_role || '').replace('_', ' ')}</div>
                      </td>
                      <td className="py-1.5 px-3 font-bold text-purple-700 whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="py-1.5 px-3 text-slate-600 whitespace-nowrap">
                        <span className="capitalize font-semibold text-slate-800">{log.target_type}</span>: {log.target_id}
                      </td>
                      <td className="py-1.5 px-3 font-sans text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] transition cursor-pointer"
                        >
                          View Payload
                        </button>
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Page {page} of {totalPages} ({total} events)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payload dialog — shows everything for the selected log */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white max-w-lg w-full shadow-xl border border-slate-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Audit Event Payload</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs">
              {(() => {
                const summary = summarizeLog(selectedLog);
                return (
                  <div className="border border-purple-100 bg-purple-50/50 p-3">
                    <p className="font-bold text-slate-900 text-sm">{summary.headline}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {selectedLog.actor_name || 'Staff'} · <span className="capitalize">{(selectedLog.actor_role || '').replace(/_/g, ' ')}</span> · {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : '—'}
                    </p>
                    {summary.facts.length > 0 && (
                      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {summary.facts.map(([label, value]) => (
                          <div key={label} className="min-w-0">
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
                            <dd className="font-semibold text-slate-800 break-words">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                );
              })()}

              <details>
                <summary className="text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-600">Raw JSON</summary>
                <div className="mt-1 p-3 bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-words">{JSON.stringify(selectedLog, null, 2)}</pre>
                </div>
              </details>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-slate-100 text-xs">
              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                    toast.success('Payload copied to clipboard.');
                  } catch {
                    toast.error('Copy failed.');
                  }
                }}
                className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Copy JSON
              </button>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
