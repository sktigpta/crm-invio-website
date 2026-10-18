import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import {
  UsersIcon,
  PercentIcon,
  CheckCircleIcon,
  TagIcon,
  RefreshCwIcon,
  AlertCircleIcon,
} from '../components/CrmIcons';
import { Skeleton } from '../components/common/Skeleton';

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
    <div className="space-y-3">
      {/* Top action row */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">System Metrics Overview</h2>
          <p className="text-[11px] text-slate-500">Live analytics from production PostgreSQL database</p>
        </div>
        <button
          onClick={loadMetrics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCwIcon className={`size-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="size-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pending Approvals Alert Banner */}
      {overview.pendingApprovals > 0 && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-900">
            <span className="font-bold px-1.5 py-0.2 bg-amber-200 text-amber-800 text-[10px]">ALERT</span>
            <span>
              <strong>{overview.pendingApprovals}</strong> Pending Discount Approval Request{overview.pendingApprovals > 1 ? 's' : ''} awaiting review.
            </span>
          </div>
          <Link
            to="/approvals"
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold whitespace-nowrap transition cursor-pointer"
          >
            Review Queue →
          </Link>
        </div>
      )}

      {/* Primary KPI Cards (tight padding p-3, compact typography) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Total Customers */}
        <div className="bg-white p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Total Registered</span>
            <div className="p-1 bg-purple-50 text-purple-600">
              <UsersIcon className="size-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {loading ? <Skeleton className="h-6 w-16 my-0.5" /> : (overview.totalCustomers ?? 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {overview.newCustomersLast30Days ?? 0} new past 30 days
          </p>
        </div>

        {/* Verified Accounts */}
        <div className="bg-white p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Verified Customers</span>
            <div className="p-1 bg-emerald-50 text-emerald-600">
              <CheckCircleIcon className="size-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {loading ? <Skeleton className="h-6 w-16 my-0.5" /> : (overview.verifiedCustomers ?? 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
            Email verification completed
          </p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Pending Approvals</span>
            <div className="p-1 bg-amber-50 text-amber-600">
              <PercentIcon className="size-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {loading ? <Skeleton className="h-6 w-12 my-0.5" /> : overview.pendingApprovals ?? 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Requires manager action
          </p>
        </div>

        {/* Gross Revenue */}
        <div className="bg-white p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Gross Revenue</span>
            <div className="p-1 bg-indigo-50 text-indigo-600">
              <TagIcon className="size-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {loading ? <Skeleton className="h-6 w-20 my-0.5" /> : `₹${(overview.totalRevenue ?? 0).toLocaleString()}`}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {overview.totalTransactions ?? 0} total transactions
          </p>
        </div>
      </div>

      {/* Grid: Subscriptions, Coupons, Tickets, and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Subscription Tier Distribution */}
        <div className="bg-white p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-900">Customers by Subscription Plan</h3>
            <Link to="/customers" className="text-[11px] text-purple-600 hover:text-purple-700 font-semibold">
              View Directory →
            </Link>
          </div>
          <div className="space-y-1.5">
            {metrics?.subscriptions?.length ? (
              metrics.subscriptions.map((sub, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-semibold text-xs text-slate-800">
                      {sub.plan || 'Free'} Plan
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 bg-slate-200 text-slate-700">
                      {sub.status}
                    </span>
                  </div>
                  <span className="font-bold text-xs text-slate-900">{sub.count} accounts</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No subscriptions recorded.</p>
            )}
          </div>
        </div>

        {/* Support Tickets Overview */}
        <div className="bg-white p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-900">Support Ticket Statuses</h3>
            <Link to="/tickets" className="text-[11px] text-purple-600 hover:text-purple-700 font-semibold">
              Manage Tickets →
            </Link>
          </div>
          <div className="space-y-1.5">
            {metrics?.tickets?.length ? (
              metrics.tickets.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100">
                  <span className="capitalize font-semibold text-xs text-slate-800">
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className="font-bold text-xs text-slate-900">{t.count} tickets</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No open support tickets.</p>
            )}
          </div>
        </div>

        {/* Coupon Performance */}
        <div className="bg-white p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-900">Coupon Codes & Redemptions</h3>
            <Link to="/coupons" className="text-[11px] text-purple-600 hover:text-purple-700 font-semibold">
              Manage Coupons →
            </Link>
          </div>
          <div className="space-y-1.5">
            {metrics?.coupons?.length ? (
              metrics.coupons.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100">
                  <span className="capitalize font-semibold text-xs text-slate-800">
                    {c.status} Codes
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-xs text-slate-900">{c.count} codes</span>
                    <span className="block text-[10px] text-slate-400">{c.total_redemptions} redeemed</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No coupons recorded.</p>
            )}
          </div>
        </div>

        {/* Recent Audit Feed */}
        <div className="bg-white p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-900">Recent Audit Events</h3>
            {isManagerOrAdmin && (
              <Link to="/audit-logs" className="text-[11px] text-purple-600 hover:text-purple-700 font-semibold">
                Full Log →
              </Link>
            )}
          </div>
          <div className="space-y-1.5">
            {metrics?.recentActivity?.length ? (
              metrics.recentActivity.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-slate-900 truncate">{log.actor_name}</span>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1 py-0.2 border border-purple-200 font-mono">
                      {log.action}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No recent activity recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
