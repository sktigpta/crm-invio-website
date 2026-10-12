import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';
import { FileTextIcon, RefreshCwIcon, AlertCircleIcon, SearchIcon } from '../components/CrmIcons';

export function CrmAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [targetType, setTargetType] = useState('');
  const [actionSearch, setActionSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getAuditLogs({
        page,
        limit: 20,
        targetType,
        action: actionSearch,
      });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page, targetType, actionSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Immutable Audit Logs</h2>
          <p className="text-xs text-slate-500">
            Cryptographically timestamped audit records of all staff actions, discount approvals, and data access.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="size-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search action keyword..."
            value={actionSearch}
            onChange={(e) => {
              setActionSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-purple-600"
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
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
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

      {/* Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Staff Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 font-sans">
                    <div className="size-6 border-2 border-slate-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-2" />
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
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-semibold text-slate-900">{log.actor_name || 'Staff'}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{log.actor_role.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-purple-700">
                        {log.action}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="capitalize font-semibold text-slate-800">{log.target_type}</span>: {log.target_id}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-right">
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] transition"
                        >
                          {isExpanded ? 'Hide Details' : 'View Payload'}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[10px] text-left overflow-x-auto max-w-sm">
                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                            {log.ip_address && (
                              <div className="mt-1 text-slate-400">IP: {log.ip_address}</div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
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
                className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
