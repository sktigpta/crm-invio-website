import React, { useState } from 'react';
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
  admin: { label: 'Admin', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  manager: { label: 'Manager', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  sales_executive: { label: 'Sales Exec', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  support_executive: { label: 'Support Exec', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
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
      {/* Mobile Top Header */}
      <div className="md:hidden h-12 flex items-center justify-between px-3 bg-white border-b border-slate-200 sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/appLogo.png" alt="Invio" className="size-5 object-contain" />
          <span className="font-bold text-xs tracking-tight text-slate-900">Invio CRM</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-700">
            ({currentRole.label}) {staff?.fullName || 'Staff'}
          </span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle Menu"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-56 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col z-20`}
      >
        {/* Left header: exact matched h-12 height */}
        <div className="h-12 px-3 border-b border-slate-200 hidden md:flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-85 transition">
            <img src="/appLogo.png" alt="Invio" className="size-5 object-contain" />
            <span className="font-bold text-xs text-slate-900 tracking-tight">Invio CRM</span>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 bg-purple-50 text-purple-700 border border-purple-200">
              Staff
            </span>
          </Link>
        </div>

        {/* Navigation items (tight list) */}
        <nav className="flex-1 px-1.5 py-1.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 font-bold border-l-2 border-purple-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border-l-2 border-transparent'
                  }`
                }
              >
                <Icon className="size-3.5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t border-slate-200 space-y-0.5">
          <a
            href="https://invio.timrio.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <span>Public Website</span>
            <span>↗</span>
          </a>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
          >
            <LogOutIcon className="size-3 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Right header: exact matched h-12 height */}
        <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-bold text-slate-900 capitalize tracking-tight">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1).replace('-', ' ')}
            </h1>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              / crm.invio.timrio.com
            </span>
          </div>

          {/* Right navbar: (admin/role) name */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Signed in:
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${currentRole.bg}`}>
              ({currentRole.label})
            </span>
            <span className="font-semibold text-xs text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">
              {staff?.fullName || 'Staff'}
            </span>
            <div className="size-1.5 bg-emerald-500 ml-1" title="Connected & Active" />
          </div>
        </header>

        <div className="p-3 md:p-3.5 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
