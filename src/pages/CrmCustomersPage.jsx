import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { SearchIcon, FilterIcon, RefreshCwIcon, AlertCircleIcon } from '../components/CrmIcons';

export function CrmCustomersPage() {
  const { staff, isManagerOrAdmin } = useCrmAuth();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getCustomers({ page, limit: 12, search, plan });
      setCustomers(res.customers || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch customer directory.');
    } finally {
      setLoading(false);
    }
  }, [page, search, plan]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  }

  function exportCsv() {
    if (!customers.length) return;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Plan', 'Country', 'RegistrationDate'];
    const rows = customers.map((c) => [
      c.id,
      `"${c.fullName || ''}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      c.currentPlan,
      c.country || 'N/A',
      c.registrationDate,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `invio-customers-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Customer Directory</h2>
          <p className="text-xs text-slate-500">
            Total {total} registered account{total === 1 ? '' : 's'}.{' '}
            {!isManagerOrAdmin && (
              <span className="text-amber-600 font-semibold">
                (PII masked per role policy)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManagerOrAdmin && (
            <button
              onClick={exportCsv}
              className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
            >
              Export CSV ↓
            </button>
          )}
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="size-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search name, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
          />
          <SearchIcon className="size-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-2">
            <FilterIcon className="size-3.5" />
            <span>Plan:</span>
          </div>
          <select
            value={plan}
            onChange={(e) => {
              setPlan(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-purple-600"
          >
            <option value="all">All Plans</option>
            <option value="free">Free Tier</option>
            <option value="plus">Plus Plan</option>
            <option value="pro">Pro Plan</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Current Plan</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="size-6 border-2 border-slate-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-2" />
                    Loading customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{c.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="text-slate-800">{c.email}</div>
                      <div className="text-slate-400 text-[10px]">{c.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px]">
                        {c.currentPlan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {c.assignedStaffName ? (
                        <span className="font-medium text-slate-800">{c.assignedStaffName}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        c.emailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <span className={`size-1.5 rounded-full ${c.emailVerified ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {c.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/customers/${encodeURIComponent(c.id)}`}
                        className="inline-flex px-3 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition"
                      >
                        Profile →
                      </Link>
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
              Page {page} of {totalPages}
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
