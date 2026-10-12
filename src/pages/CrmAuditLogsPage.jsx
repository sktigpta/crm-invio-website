import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';
import { useCrmToast } from '../context/CrmToastContext';
import { useDebouncedValue, isRateLimitError } from '../hooks/useDebouncedValue';
import {
  downloadAuditLogsCsv,
  getGoogleSheetUrl,
} from '../services/googleSheets';
import { RefreshCwIcon, AlertCircleIcon, SearchIcon } from '../components/CrmIcons';

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
            Every staff action is stored as a row in Google Sheets — no local database.
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
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 font-sans">
                    <div className="size-6 border-2 border-slate-200 border-t-purple-600 animate-spin mx-auto mb-2" />
                    Querying audit store...
                  </td>
                </tr>
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
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-slate-50 border border-slate-100 p-3">
                <div><span className="text-slate-500">Timestamp:</span><div className="font-mono font-semibold text-slate-900">{selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : '—'}</div></div>
                <div><span className="text-slate-500">Action:</span><div className="font-bold text-purple-700">{selectedLog.action || '—'}</div></div>
                <div><span className="text-slate-500">Actor:</span><div className="font-semibold text-slate-900">{selectedLog.actor_name || 'Staff'}</div><div className="text-[10px] text-slate-500 capitalize">{(selectedLog.actor_role || '').replace('_', ' ')}</div></div>
                <div><span className="text-slate-500">Actor ID:</span><div className="font-mono text-slate-800 break-all">{selectedLog.actor_id || selectedLog.actorId || '—'}</div></div>
                <div><span className="text-slate-500">Target:</span><div className="font-semibold text-slate-900 capitalize">{selectedLog.target_type || '—'}: <span className="font-mono">{selectedLog.target_id || '—'}</span></div></div>
                <div><span className="text-slate-500">IP Address:</span><div className="font-mono text-slate-800">{selectedLog.ip_address || '—'}</div></div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Details JSON</p>
                <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-words">{JSON.stringify(selectedLog.details ?? {}, null, 2)}</pre>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Raw Record</p>
                <div className="p-3 bg-slate-50 border border-slate-200 font-mono text-[10px] text-slate-700 overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-words">{JSON.stringify(selectedLog, null, 2)}</pre>
                </div>
              </div>
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
