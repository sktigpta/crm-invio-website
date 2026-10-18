import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { useCrmToast } from '../context/CrmToastContext';
import { useDebouncedValue, isRateLimitError } from '../hooks/useDebouncedValue';
import { RefreshCwIcon, AlertCircleIcon, SearchIcon } from '../components/CrmIcons';
import { TableSkeleton } from '../components/common/Skeleton';

const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-800',
  investigating: 'bg-amber-100 text-amber-800',
  resolved: 'bg-emerald-100 text-emerald-800',
};

export function CrmBugsPage() {
  const { isManagerOrAdmin } = useCrmAuth();
  const { toast } = useCrmToast();
  const [bugs, setBugs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [unconfigured, setUnconfigured] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 600);

  const fetchBugs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getBugs({ status, search: debouncedSearch, page, limit: 20 });
      setBugs(res.bugs || []);
      setTotalPages(res.totalPages || 1);
      setUnconfigured(Boolean(res.unconfigured));
    } catch (err) {
      if (isRateLimitError(err)) {
        toast.warning('Too many requests — pausing briefly, then try again.');
        return;
      }
      const msg = err.message || 'Failed to fetch bug reports.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch, page, toast]);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  async function handleStatusChange(ticketId, nextStatus) {
    setStatusLoading(true);
    try {
      await crmApi.updateBugStatus(ticketId, nextStatus);
      toast.success(`Bug ${ticketId} marked ${nextStatus}.`);
      setSelected((s) => (s ? { ...s, status: nextStatus } : s));
      fetchBugs();
    } catch (err) {
      toast.error(err.message || 'Failed to update bug status.');
    } finally {
      setStatusLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Bug Reports</h2>
          <p className="text-xs text-slate-500">
            Public + desktop-app submissions, stored in Google Sheets.
          </p>
        </div>
        <button onClick={fetchBugs} disabled={loading} className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition disabled:opacity-50 cursor-pointer" title="Refresh">
          <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="size-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full md:w-72">
          <input type="text" placeholder="Search ticket, title, email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-3.5 py-2 border border-slate-200 focus:outline-none focus:border-purple-600" />
          <SearchIcon className="size-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="crm-table-wrap overflow-x-auto">
          <table className="crm-table text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-1.5 px-3 whitespace-nowrap">Ticket</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Title</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Severity</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Reporter</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Status</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Reported</th>
                <th className="py-1.5 px-3 text-right whitespace-nowrap">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={5} cols={7} />
              ) : bugs.length === 0 ? (
                <tr><td colSpan="7" className="py-12 text-center text-slate-400">{unconfigured ? 'Bug store is not configured yet (Google Sheets key missing) — nothing to show.' : 'No bug reports found.'}</td></tr>
              ) : (
                bugs.map((b) => (
                  <tr key={b.ticketId} className="hover:bg-slate-50/70 transition">
                    <td className="py-1.5 px-3 font-mono font-bold text-purple-700 whitespace-nowrap">{b.ticketId}</td>
                    <td className="py-1.5 px-3 font-semibold text-slate-900 whitespace-nowrap" title={b.description}>{b.title}</td>
                    <td className="py-1.5 px-3 capitalize whitespace-nowrap">{b.severity}</td>
                    <td className="py-1.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">{b.email || '—'}</td>
                    <td className="py-1.5 px-3 whitespace-nowrap"><span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${STATUS_STYLES[b.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{b.status}</span></td>
                    <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="py-1.5 px-3 text-right whitespace-nowrap">
                      <button onClick={() => setSelected(b)} className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-sm transition cursor-pointer">View →</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>Page {page} of {totalPages}</div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer">Previous</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer">Next</button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white max-w-lg w-full p-4 shadow-xl border border-slate-200 space-y-3 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selected.title}</h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">{selected.ticketId} · {selected.category} · {selected.os} · v{selected.appVersion}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer">✕</button>
            </div>
            <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{selected.description}</div>
            {selected.steps && (
              <div className="text-xs"><p className="font-bold text-slate-900 mb-1">Steps to reproduce</p><p className="text-slate-700 whitespace-pre-wrap">{selected.steps}</p></div>
            )}
            {isManagerOrAdmin && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="font-semibold text-slate-700">Status:</span>
                {['open', 'investigating', 'resolved'].map((st) => (
                  <button key={st} disabled={statusLoading} onClick={() => handleStatusChange(selected.ticketId, st)} className={`px-3 py-1.5 font-semibold capitalize transition disabled:opacity-50 cursor-pointer ${selected.status === st ? 'bg-purple-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>{st}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
