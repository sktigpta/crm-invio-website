import { Link } from 'react-router-dom';
import { useCrmAuth } from '../context/CrmAuthContext';
import { ShieldCheckIcon } from '../components/CrmIcons';

export function CrmHomePage() {
  const { isAuthenticated, staff } = useCrmAuth();

  return (
    <div className="w-full min-h-screen h-screen flex flex-col justify-between bg-white font-sans text-slate-800 antialiased overflow-hidden">
      {/* 100% Width Navigation Bar */}
      <header className="w-full bg-white border-b border-slate-200 px-6 sm:px-12 py-3 flex items-center justify-between z-20">
        {/* Real Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/appLogo.png" alt="Invio Logo" className="size-8 object-contain" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-slate-900 tracking-tight">Invio</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200">
              CRM
            </span>
          </div>
        </Link>

        {/* Right Navigation CTA */}
        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-slate-600 font-medium">
                Signed in as <strong className="text-slate-900">{staff?.fullName || staff?.email}</strong>
              </span>
              <Link
                to="/dashboard"
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition flex items-center gap-1.5"
            >
              <span>Staff Login</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </nav>
      </header>

      {/* Hero / Main Area (100% width and centered height, tight, sharp) */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-6 sm:px-12 text-center max-w-4xl mx-auto py-6">
        {/* Internal Security Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold mb-5">
          <ShieldCheckIcon className="size-3.5 text-purple-600" />
          <span>Internal Operations & Customer Management</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
          Unified Management for Customer Lifecycle & Operations
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto mb-6 leading-relaxed">
          The central control center for authorized Invio staff. Manage registered customers, subscriptions,
          discount approvals, coupon campaigns, and compliance audit logs.
        </p>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <span>Open Operations Dashboard</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <span>Sign In to Staff Portal</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </div>

        {/* 3 Pillars / Feature Highlights (sharp corners, tight padding) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-10 text-left">
          <div className="p-3.5 bg-slate-50 border border-slate-200">
            <div className="font-bold text-xs text-slate-900 mb-1">Customer & Subscription Management</div>
            <div className="text-[11px] text-slate-500 leading-normal">
              Real-time directory, lifecycle plans, account statuses, and executive assignments.
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200">
            <div className="font-bold text-xs text-slate-900 mb-1">Discounts & Coupon Controls</div>
            <div className="text-[11px] text-slate-500 leading-normal">
              Multi-tiered discount thresholds, manager approval workflows, and regional codes.
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200">
            <div className="font-bold text-xs text-slate-900 mb-1">Audited Security & RBAC</div>
            <div className="text-[11px] text-slate-500 leading-normal">
              Cryptographically audited actions, PII masking, and strict role-based access.
            </div>
          </div>
        </div>
      </main>

      {/* 100% Width Footer */}
      <footer className="w-full bg-white border-t border-slate-200 px-6 sm:px-12 py-2.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 z-10 gap-2">
        <div>
          &copy; {new Date().getFullYear()} Invio (Timrio Inc.). All rights reserved.
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>Internal Enterprise System</span>
          <span>&bull;</span>
          <span>Strictly Confidential</span>
          <span>&bull;</span>
          <span>Restricted to Authorized Personnel</span>
        </div>
      </footer>
    </div>
  );
}
