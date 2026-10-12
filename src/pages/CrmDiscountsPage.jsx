import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { PercentIcon, RefreshCwIcon, AlertCircleIcon, PlusIcon } from '../components/CrmIcons';

export function CrmDiscountsPage() {
  const { staff, isSales, isSupport } = useCrmAuth();
  const [discounts, setDiscounts] = useState([]);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getDiscounts({ status, page, limit: 15 });
      setDiscounts(res.discounts || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch discounts.');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  return (
    <div className="space-y-6">
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
            className="px-3.5 py-2  bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold shadow-xs transition"
          >
            Pending Approvals Queue →
          </Link>
          <button
            onClick={fetchDiscounts}
            disabled={loading}
            className="p-2  bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Role Policy Notice Banner */}
      <div className="p-4  bg-purple-50/70 border border-purple-200/80 text-xs text-purple-900 space-y-1">
        <div className="font-bold flex items-center gap-2">
          <span>🛡️ Server-Enforced Discount Policy Guardrails</span>
        </div>
        <p className="text-[11px] text-purple-800">
          • <strong>Sales Executives:</strong> Can activate up to <strong>10%</strong> directly. 11% to 30% automatically triggers a Manager approval request. Over 30% is rejected.
          <br />
          • <strong>Support Executives:</strong> Can request discounts up to <strong>30%</strong> for customer retention (requires Manager approval).
          <br />
          • <strong>Managers:</strong> Can directly activate up to <strong>30%</strong>. Anti-self-approval rule strictly prohibits approving your own requests.
        </p>
      </div>

      {error && (
        <div className="p-4  bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="size-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-3  border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['all', 'active', 'pending_approval', 'expired', 'revoked'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatus(st);
                setPage(1);
              }}
              className={`px-3 py-1.5  text-xs font-semibold capitalize transition ${
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

      {/* Discounts Table */}
      <div className="bg-white  border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Customer Email</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4">Plan Scope</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Staff Details</th>
                <th className="py-3 px-4">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="size-6 border-2 border-slate-200 border-t-purple-600  animate-spin mx-auto mb-2" />
                    Loading discounts...
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No customer discounts found for status: {status}.
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      <Link
                        to={`/customers/${encodeURIComponent(d.customerUserId)}`}
                        className="text-purple-700 hover:underline"
                      >
                        {d.customerEmail}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span className="text-purple-700 font-black text-sm">
                        {d.discountValue}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate" title={d.reason}>
                      {d.reason}
                    </td>
                    <td className="py-3.5 px-4 capitalize font-medium text-slate-600">
                      {d.applicablePlan}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5  uppercase ${
                        d.approvalStatus === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.approvalStatus === 'pending_approval'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {d.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      <div>By: {d.createdByName || 'Staff'}</div>
                      {d.approvedByName && <div className="text-slate-400 text-[10px]">Appr: {d.approvedByName}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(d.expiryDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
