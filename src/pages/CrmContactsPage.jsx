import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { useCrmToast } from '../context/CrmToastContext';
import { useDebouncedValue, isRateLimitError } from '../hooks/useDebouncedValue';
import { RefreshCwIcon, AlertCircleIcon, SearchIcon } from '../components/CrmIcons';
import { TableSkeleton } from '../components/common/Skeleton';

const STATUS_STYLES = {
  new: 'bg-blue-100 text-blue-800',
  read: 'bg-slate-100 text-slate-700',
  replied: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-purple-100 text-purple-800',
};

export function CrmContactsPage() {
  const { isManagerOrAdmin } = useCrmAuth();
  const { toast } = useCrmToast();
  const [contacts, setContacts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [breachedOnly, setBreachedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [unconfigured, setUnconfigured] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 600);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getContacts({ status, breached: breachedOnly, search: debouncedSearch, page, limit: 20 });
      setContacts(res.contacts || []);
      setTotalPages(res.totalPages || 1);
      setUnconfigured(Boolean(res.unconfigured));
    } catch (err) {
      if (isRateLimitError(err)) {
        toast.warning('Too many requests — pausing briefly, then try again.');
        return;
      }
      const msg = err.message || 'Failed to fetch contact messages.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [status, breachedOnly, debouncedSearch, page, toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  async function handleStatusChange(id, nextStatus) {
    setStatusLoading(true);
    try {
      await crmApi.updateContactStatus(id, nextStatus);
      toast.success(`Message marked ${nextStatus}.`);
      setSelected((s) => (s ? { ...s, status: nextStatus } : s));
      fetchContacts();
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Contact Messages</h2>
          <p className="text-xs text-slate-500">
            Website contact-form submissions, stored in Google Sheets. Visitors get an automatic thank-you reply.
          </p>
        </div>
        <button onClick={fetchContacts} disabled={loading} className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition disabled:opacity-50 cursor-pointer" title="Refresh">
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
          <input type="text" placeholder="Search name, email, subject..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-3.5 py-2 border border-slate-200 focus:outline-none focus:border-purple-600" />
          <SearchIcon className="size-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700">
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="archived">Archived</option>
        </select>
        <button onClick={() => { setBreachedOnly((v) => !v); setPage(1); }} title="Unreplied over 20h" className={`px-3 py-1.5 text-xs font-bold transition cursor-pointer ${breachedOnly ? 'bg-red-600 text-white' : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'}`}>
          ⚠ Action required
        </button>
      </div>

      <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="crm-table-wrap overflow-x-auto">
          <table className="crm-table text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-1.5 px-3 whitespace-nowrap">Received</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Name</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Email</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Subject</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Status</th>
                <th className="py-1.5 px-3 text-right whitespace-nowrap">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={5} cols={6} />
              ) : contacts.length === 0 ? (
                <tr><td colSpan="6" className="py-12 text-center text-slate-400">{unconfigured ? 'Contact store is not configured yet (Google Sheets key missing) — nothing to show.' : 'No contact messages found.'}</td></tr>
              ) : (
                contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap">{c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}</td>
                    <td className="py-1.5 px-3 font-semibold text-slate-900 whitespace-nowrap">{c.name}</td>
                    <td className="py-1.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">{c.email}</td>
                    <td className="py-1.5 px-3 text-slate-700 whitespace-nowrap" title={c.message}>{c.subject}</td>
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${STATUS_STYLES[c.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{c.status}</span>
                      {c.actionRequired && (
                        <span className="ml-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-red-600 text-white" title={`Waiting ${c.hoursOpen}h — SLA is 20h`}>
                          ⚠ Action required · {c.hoursOpen}h
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-right whitespace-nowrap">
                      <button onClick={() => setSelected(c)} className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-sm transition cursor-pointer">Read →</button>
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
                <h3 className="font-bold text-slate-900 text-sm">{selected.subject}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{selected.name} · <span className="font-mono">{selected.email}</span> · {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ''}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer">✕</button>
            </div>
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-700">Status:</span>
              {['new', 'read', 'replied', 'archived'].map((st) => (
                <button key={st} disabled={statusLoading} onClick={() => handleStatusChange(selected.id, st)} className={`px-3 py-1.5 font-semibold capitalize transition disabled:opacity-50 cursor-pointer ${selected.status === st ? 'bg-purple-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>{st}</button>
              ))}
            </div>
            <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`} className="block text-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition">Reply via Email →</a>
          </div>
        </div>
      )}
    </div>
  );
}
