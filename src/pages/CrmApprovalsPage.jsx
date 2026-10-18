import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { useCrmToast } from '../context/CrmToastContext';
import { RefreshCwIcon, AlertCircleIcon } from '../components/CrmIcons';
import { TableSkeleton } from '../components/common/Skeleton';

export function CrmApprovalsPage() {
  const { staff, isManagerOrAdmin } = useCrmAuth();
  const { toast } = useCrmToast();
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decision, setDecision] = useState('approved');
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getApprovalRequests({ status });
      setRequests(res.requests || []);
    } catch (err) {
      const msg = err.message || 'Failed to fetch approval requests.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [status, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!selectedRequest) return;

    setReviewLoading(true);
    try {
      await crmApi.reviewApproval(selectedRequest.id, decision, comment);
      setSelectedRequest(null);
      setComment('');
      toast.success(`Discount request ${decision} successfully.`);
      fetchRequests();
    } catch (err) {
      toast.error(err.message || 'Failed to review request.');
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Discount Approvals Workflow</h2>
          <p className="text-xs text-slate-500">
            Manager and Administrator authorization queue for customer retention and high-value discounts.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="p-2  bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4  bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="size-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-2.5  border border-slate-200 shadow-xs">
        {['pending', 'approved', 'rejected', 'all'].map((st) => (
          <button
            key={st}
            onClick={() => setStatus(st)}
            className={`px-3 py-1.5  text-xs font-semibold capitalize transition ${
              status === st
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st} Requests
          </button>
        ))}
      </div>

      {/* Approvals Table */}
      <div className="bg-white  border border-slate-200 shadow-xs overflow-hidden">
        <div className="crm-table-wrap overflow-x-auto">
          <table className="crm-table text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-1.5 px-3">Customer</th>
                <th className="py-1.5 px-3">Requested Discount</th>
                <th className="py-1.5 px-3">Requested By</th>
                <th className="py-1.5 px-3">Reason</th>
                <th className="py-1.5 px-3">Status</th>
                <th className="py-1.5 px-3">Review Details</th>
                <th className="py-1.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={5} cols={7} />
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No approval requests found for status: {status}.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const isSelf = staff?.id === r.requestedByStaffId;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-1.5 px-3 font-mono font-medium text-slate-900">
                        {r.customerEmail}
                      </td>
                      <td className="py-1.5 px-3">
                        <span className="font-bold text-sm text-purple-700">{r.discountValue}%</span>
                        <span className="text-[10px] text-slate-500 block capitalize">{r.applicablePlan} Plan</span>
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">
                        <div className="font-semibold text-slate-900">{r.requestedByName}</div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {r.requestedByRole.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-slate-700 whitespace-nowrap" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="py-1.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5  uppercase ${
                          r.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-[11px] text-slate-600">
                        {r.reviewerName ? (
                          <div>
                            <span className="font-semibold">{r.reviewerName}</span>
                            {r.reviewComment && (
                              <p className="text-[10px] text-slate-500 whitespace-nowrap">"{r.reviewComment}"</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending review</span>
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        {r.status === 'pending' && isManagerOrAdmin ? (
                          <button
                            onClick={() => {
                              setSelectedRequest(r);
                              setDecision('approved');
                              setComment('');
                            }}
                            className="px-3 py-1  bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition"
                          >
                            Review Request
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white  max-w-md w-full p-4 shadow-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Review Discount Request</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Anti-self-approval rule warning */}
            {staff?.id === selectedRequest.requestedByStaffId ? (
              <div className="p-3  bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                ⚠️ Anti-Self-Approval Prohibited: You created this discount request. You cannot approve or reject your own request.
              </div>
            ) : null}

            <div className="bg-slate-50 p-3  border border-slate-100 text-xs space-y-1">
              <div><strong>Customer:</strong> {selectedRequest.customerEmail}</div>
              <div><strong>Discount:</strong> {selectedRequest.discountValue}% ({selectedRequest.applicablePlan} Plan)</div>
              <div><strong>Requested By:</strong> {selectedRequest.requestedByName}</div>
              <div><strong>Reason:</strong> {selectedRequest.reason}</div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('approved')}
                    className={`py-2 px-3  font-bold border transition ${
                      decision === 'approved'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Approve Discount
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('rejected')}
                    className={`py-2 px-3  font-bold border transition ${
                      decision === 'rejected'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ✕ Reject Request
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Review Comment (Audited)
                </label>
                <textarea
                  rows="2"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Approved per annual contract terms..."
                  className="w-full p-2.5  border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-3.5 py-2  border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading || staff?.id === selectedRequest.requestedByStaffId}
                  className="px-4 py-2  bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50"
                >
                  {reviewLoading ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
