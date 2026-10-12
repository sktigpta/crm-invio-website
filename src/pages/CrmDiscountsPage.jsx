import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { useCrmToast } from '../context/CrmToastContext';
import { RefreshCwIcon, AlertCircleIcon } from '../components/CrmIcons';

export function CrmDiscountsPage() {
  const { isManagerOrAdmin } = useCrmAuth();
  const { toast } = useCrmToast();
  const [discounts, setDiscounts] = useState([]);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getDiscounts({ status, page, limit: 15 });
      setDiscounts(res.discounts || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      const msg = err.message || 'Failed to fetch discounts.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [status, page, toast]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  async function handleRevoke(d) {
    if (!isManagerOrAdmin) {
      toast.warning('Only managers or admins can revoke discounts.');
      return;
    }
    setActionId(d.id);
    try {
      try {
        await crmApi.revokeDiscount(d.id);
      } catch (e) {
        await crmApi.updateDiscount(d.id, { status: 'revoked' });
      }
      toast.success(`Discount ${d.discountValue}% for ${d.customerEmail} revoked.`);
      fetchDiscounts();
    } catch (err) {
      toast.error(err.message || 'Failed to revoke discount.');
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(d) {
    if (!isManagerOrAdmin) {
      toast.warning('Only managers or admins can delete discounts.');
      return;
    }
    if (!window.confirm(`Delete ${d.discountValue}% discount for ${d.customerEmail}?`)) return;
    setActionId(d.id);
    try {
      await crmApi.deleteDiscount(d.id);
      toast.success('Discount record deleted.');
      fetchDiscounts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete discount.');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Customer Discounts</h2>
          <p className="text-xs text-slate-500">
            Customer-specific pricing adjustments and policy records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/approvals"
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold shadow-xs transition"
          >
            Pending Approvals Queue →
          </Link>
          <button
            onClick={fetchDiscounts}
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

      {/* Filter Tabs */}
      <div className="bg-white p-3 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'active', 'pending_approval', 'expired', 'revoked'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatus(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold capitalize transition cursor-pointer ${
                status === st
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Discounts Table — one line per row, auto width = longest row */}
      <div className="bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="crm-table-wrap overflow-x-auto">
          <table className="crm-table text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-1.5 px-3 whitespace-nowrap">Customer Email</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Discount</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Reason / Notes</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Plan Scope</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Status</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Staff Details</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Expires</th>
                {isManagerOrAdmin && <th className="py-1.5 px-3 text-right whitespace-nowrap">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="size-6 border-2 border-slate-200 border-t-purple-600 animate-spin mx-auto mb-2" />
                    Loading discounts...
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No customer discounts found for status: {status}.
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-1.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      <Link
                        to={`/customers/${encodeURIComponent(d.customerUserId)}`}
                        className="text-purple-700 hover:underline"
                      >
                        {d.customerEmail}
                      </Link>
                    </td>
                    <td className="py-1.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                      <span className="text-purple-700 font-black text-sm">
                        {d.discountValue}%
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-700 whitespace-nowrap" title={d.reason}>
                      {d.reason}
                    </td>
                    <td className="py-1.5 px-3 capitalize font-medium text-slate-600 whitespace-nowrap">
                      {d.applicablePlan}
                    </td>
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                        d.approvalStatus === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : d.approvalStatus === 'pending_approval'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {d.approvalStatus}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                      <div>By: {d.createdByName || 'Staff'}</div>
                      {d.approvedByName && <div className="text-slate-400 text-[10px]">Appr: {d.approvedByName}</div>}
                    </td>
                    <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(d.expiryDate).toLocaleDateString()}
                    </td>
                    {isManagerOrAdmin && (
                      <td className="py-1.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {d.approvalStatus === 'active' && (
                            <button
                              onClick={() => handleRevoke(d)}
                              disabled={actionId === d.id}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs rounded-sm transition disabled:opacity-50 cursor-pointer"
                            >
                              {actionId === d.id ? '...' : 'Revoke'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(d)}
                            disabled={actionId === d.id}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-sm transition disabled:opacity-50 cursor-pointer"
                          >
                            {actionId === d.id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    )}
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
    </div>
  );
}
