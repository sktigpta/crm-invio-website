import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import {
  UsersIcon,
  PercentIcon,
  TicketIcon,
  CheckCircleIcon,
  TagIcon,
  RefreshCwIcon,
  AlertCircleIcon,
} from '../components/CrmIcons';

export function CrmDashboardPage() {
  const { staff, isManagerOrAdmin } = useCrmAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadMetrics() {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getDashboardMetrics();
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  const overview = metrics?.overview || {};

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Welcome back, {staff?.fullName || 'Executive'}
          </h2>
          <p className="text-xs text-slate-500">
            Real-time backend metrics from PostgreSQL cloud database.
          </p>
        </div>
        <button
          onClick={loadMetrics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
        >
          <RefreshCwIcon className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="size-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pending Approvals Alert Banner */}
      {overview.pendingApprovals > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              !
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-900">
                {overview.pendingApprovals} Pending Discount Approval Request{overview.pendingApprovals > 1 ? 's' : ''}
              </h3>
              <p className="text-[11px] text-amber-700">
                Staff executives have submitted discounts requiring approval before customer activation.
              </p>
            </div>
          </div>
          <Link
            to="/approvals"
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold whitespace-nowrap shadow-xs transition"
          >
            Review Approvals Queue →
          </Link>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Total Registered</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <UsersIcon className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : (overview.totalCustomers ?? 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {overview.newCustomersLast30Days ?? 0} new in past 30 days
          </p>
        </div>

        {/* Verified Accounts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Verified Customers</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircleIcon className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : (overview.verifiedCustomers ?? 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            Email verification completed
          </p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Pending Approvals</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <PercentIcon className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : overview.pendingApprovals ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Awaiting manager/admin review
          </p>
        </div>

        {/* Total Billing Volume */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Gross Billing Volume</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <TagIcon className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '...' : `₹${(overview.totalRevenue ?? 0).toLocaleString()}`}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {overview.totalTransactions ?? 0} total transactions
          </p>
        </div>
      </div>

      {/* Grid: Subscriptions, Coupons, Tickets, and Recent Audit Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Tier Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Customers by Subscription Plan</h3>
            <Link to="/customers" className="text-xs text-purple-600 hover:text-purple-700 font-semibold">
              View Directory →
            </Link>
          </div>
          <div className="space-y-3">
            {metrics?.subscriptions?.length ? (
              metrics.subscriptions.map((sub, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="capitalize font-semibold text-xs text-slate-800">
                      {sub.plan || 'Free'} Plan
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      {sub.status}
                    </span>
                  </div>
                  <span className="font-bold text-sm text-slate-900">{sub.count} accounts</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No subscriptions recorded.</p>
            )}
          </div>
        </div>

        {/* Support Tickets Overview */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Support Ticket Statuses</h3>
            <Link to="/tickets" className="text-xs text-purple-600 hover:text-purple-700 font-semibold">
              Manage Tickets →
            </Link>
          </div>
          <div className="space-y-3">
            {metrics?.tickets?.length ? (
              metrics.tickets.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="capitalize font-semibold text-xs text-slate-800">
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className="font-bold text-sm text-slate-900">{t.count} tickets</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No open support tickets.</p>
            )}
          </div>
        </div>

        {/* Coupon Performance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Coupon Codes & Redemptions</h3>
            <Link to="/coupons" className="text-xs text-purple-600 hover:text-purple-700 font-semibold">
              Manage Coupons →
            </Link>
          </div>
          <div className="space-y-3">
            {metrics?.coupons?.length ? (
              metrics.coupons.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="capitalize font-semibold text-xs text-slate-800">
                    {c.status} Codes
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-sm text-slate-900">{c.count} codes</span>
                    <span className="block text-[10px] text-slate-500">{c.total_redemptions} redeemed</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No coupons recorded.</p>
            )}
          </div>
        </div>

        {/* Recent Audit Feed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Audit Events</h3>
            {isManagerOrAdmin && (
              <Link to="/audit-logs" className="text-xs text-purple-600 hover:text-purple-700 font-semibold">
                Full Log →
              </Link>
            )}
          </div>
          <div className="space-y-2.5">
            {metrics?.recentActivity?.length ? (
              metrics.recentActivity.map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{log.actor_name || 'Staff'}</span>
                    <span className="text-slate-500 ml-1.5 font-mono text-[11px]">
                      {log.action}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No recent audit events.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
