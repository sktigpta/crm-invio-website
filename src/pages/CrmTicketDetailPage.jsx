import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { RefreshCwIcon, AlertCircleIcon } from '../components/CrmIcons';

export function CrmTicketDetailPage() {
  const { id } = useParams();
  const { staff } = useCrmAuth();

  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment submission state
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  // Status update state
  const [newStatus, setNewStatus] = useState('');
  const [resolution, setResolution] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getTicketDetail(id);
      setTicketData(res);
      setNewStatus(res.ticket?.status || 'open');
      setResolution(res.ticket?.resolution || '');
    } catch (err) {
      setError(err.message || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  async function handleAddComment(e) {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setCommentLoading(true);
    try {
      await crmApi.addTicketComment(id, replyMessage, isInternal);
      setReplyMessage('');
      fetchTicket();
    } catch (err) {
      alert(err.message || 'Failed to add comment.');
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleUpdateStatus(e) {
    e.preventDefault();
    setStatusLoading(true);
    try {
      await crmApi.updateTicketStatus(id, newStatus, resolution);
      fetchTicket();
      alert('Ticket status updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <div className="size-8 border-2 border-slate-200 border-t-purple-600  animate-spin mb-3" />
        <p className="text-xs">Loading support thread...</p>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="p-6  bg-red-50 border border-red-200 text-xs text-red-700">
        <h3 className="font-bold mb-1">Ticket Not Found</h3>
        <p>{error || 'The requested ticket could not be found.'}</p>
        <Link to="/tickets" className="mt-3 inline-block font-semibold text-purple-700">
          ← Return to Tickets
        </Link>
      </div>
    );
  }

  const { ticket, comments } = ticketData;

  return (
    <div className="space-y-6">
      {/* Top back link */}
      <div className="flex items-center justify-between">
        <Link
          to="/tickets"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          ← Back to Support Tickets
        </Link>
        <span className="text-[11px] font-mono text-slate-400">ID: {ticket.id}</span>
      </div>

      {/* Ticket Header Banner */}
      <div className="bg-white p-6  border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-mono font-bold text-purple-700 text-sm">
              {ticket.ticketNumber}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5  uppercase ${
              ticket.status === 'open'
                ? 'bg-blue-100 text-blue-800'
                : ticket.status === 'resolved'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {ticket.status.replace('_', ' ')}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5  uppercase ${
              ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {ticket.priority} Priority
            </span>
            <span className="text-xs capitalize text-slate-500 font-medium">
              • Category: {ticket.category}
            </span>
          </div>

          <h2 className="text-base font-bold text-slate-900">{ticket.subject}</h2>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            Customer: {ticket.customerEmail}
            {ticket.customerUserId && (
              <Link
                to={`/customers/${encodeURIComponent(ticket.customerUserId)}`}
                className="ml-2 text-purple-600 hover:underline font-sans"
              >
                (View Customer Profile →)
              </Link>
            )}
          </div>
        </div>

        {/* Status update widget */}
        <form onSubmit={handleUpdateStatus} className="flex items-center gap-2 text-xs">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="p-2  border border-slate-200 bg-white font-medium text-slate-800"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_customer">Waiting on Customer</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <button
            type="submit"
            disabled={statusLoading}
            className="px-3.5 py-2  bg-slate-900 hover:bg-slate-800 text-white font-semibold transition"
          >
            {statusLoading ? '...' : 'Update'}
          </button>
        </form>
      </div>

      {ticket.resolution && (
        <div className="p-4  bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          <strong className="block font-bold mb-1">Final Resolution:</strong>
          <p>{ticket.resolution}</p>
        </div>
      )}

      {/* Discussion Thread */}
      <div className="bg-white  border border-slate-200 shadow-xs p-6 space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
          Discussion Thread ({comments.length} message{comments.length === 1 ? '' : 's'})
        </h3>

        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4  border text-xs space-y-1.5 ${
                comment.isInternal
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-slate-50/80 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{comment.authorName}</span>
                  {comment.isInternal ? (
                    <span className="text-[10px] font-bold px-2 py-0.5  bg-amber-200 text-amber-800 uppercase tracking-wider">
                      🔒 Internal Note
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-500">Public Reply</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{comment.message}</p>
            </div>
          ))}
        </div>

        {/* Reply Editor Form */}
        <form onSubmit={handleAddComment} className="pt-4 border-t border-slate-100 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-900">Add to Conversation</label>
            <div className="flex items-center gap-2 select-none">
              <input
                type="checkbox"
                id="internal-toggle"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className=" border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="internal-toggle" className="text-amber-800 font-semibold cursor-pointer">
                🔒 Post as Internal Staff Note
              </label>
            </div>
          </div>

          <textarea
            rows="3"
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder={
              isInternal
                ? 'Write a private note for staff only (not sent to customer)...'
                : 'Write a response to the customer...'
            }
            required
            className={`w-full p-3  border text-xs focus:outline-none transition ${
              isInternal
                ? 'bg-amber-50/30 border-amber-300 focus:border-amber-500'
                : 'border-slate-200 focus:border-purple-600'
            }`}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={commentLoading}
              className={`px-4 py-2  font-semibold text-white shadow-xs transition disabled:opacity-50 ${
                isInternal
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {commentLoading ? 'Posting...' : isInternal ? 'Save Internal Note' : 'Send Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
