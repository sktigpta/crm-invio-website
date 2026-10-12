import { useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { useCrmAuth } from '../context/CrmAuthContext';
import {
  DashboardIcon,
  UsersIcon,
  PercentIcon,
  TagIcon,
  CheckCircleIcon,
  TicketIcon,
  LayersIcon,
  ShieldCheckIcon,
  FileTextIcon,
  LogOutIcon,
} from './CrmIcons';

const roleMeta = {
  admin: { label: 'Administrator', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  manager: { label: 'Operations Manager', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  sales_executive: { label: 'Sales Executive', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  support_executive: { label: 'Support Executive', bg: 'bg-sky-100 text-sky-800 border-sky-200' },
};

export function CrmLayout() {
  const { staff, logout, isAdmin, isManagerOrAdmin } = useCrmAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { to: '/customers', label: 'Customers', icon: UsersIcon },
    { to: '/discounts', label: 'Discounts', icon: PercentIcon },
    { to: '/approvals', label: 'Discount Approvals', icon: CheckCircleIcon },
    { to: '/coupons', label: 'Coupons', icon: TagIcon },
    { to: '/tickets', label: 'Support Tickets', icon: TicketIcon },
    { to: '/plans', label: 'Subscription Plans', icon: LayersIcon },
    ...(isManagerOrAdmin ? [{ to: '/staff', label: 'Staff Management', icon: ShieldCheckIcon }] : []),
    ...(isAdmin ? [{ to: '/audit-logs', label: 'Audit Logs', icon: FileTextIcon }] : []),
  ];

  const currentRole = roleMeta[staff?.role] || { label: staff?.role || 'Staff', bg: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
            IN
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900">Invio CRM</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col z-20`}
      >
        {/* Brand header */}
        <Link to="/dashboard" className="p-5 border-b border-slate-100 hidden md:flex items-center gap-3 hover:bg-slate-50/50 transition">
          <div className="size-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#4F46E5] flex items-center justify-center text-white font-black text-base shadow-sm">
            IN
          </div>
          <div>
            <div className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-1.5">
              Invio CRM
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Staff
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Customer & Discount Admin</p>
          </div>
        </Link>

        {/* Staff badge card */}
        <div className="p-4 mx-3 my-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Signed In As</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${currentRole.bg}`}>
              {currentRole.label}
            </span>
          </div>
          <p className="font-semibold text-sm text-slate-900 truncate">{staff?.fullName || 'Staff Member'}</p>
          <p className="text-xs text-slate-500 truncate">{staff?.email}</p>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          <a
            href="https://invio.timrio.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <span>Visit Public Website</span>
            <span>↗</span>
          </a>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOutIcon className="size-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-slate-900 capitalize">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1).replace('-', ' ')}
            </h1>
            <p className="text-xs text-slate-500">Authoritative real-time administrative operations</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
              crm.invio.timrio.com
            </span>
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" title="System Operational" />
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
