import { Link } from 'react-router-dom';
import { useCrmAuth } from '../context/CrmAuthContext';
import { ShieldCheckIcon } from '../components/CrmIcons';

export function CrmHomePage() {
  const { isAuthenticated, staff } = useCrmAuth();

  return (
    <div className="w-full min-h-screen h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 via-white to-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      {/* 100% Width Navigation Bar */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-12 py-4 flex items-center justify-between z-20 shadow-xs">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#4F46E5] flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:shadow transition">
            IN
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-slate-900 tracking-tight">Invio</span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              CRM
            </span>
          </div>
        </Link>

        {/* Right Navigation CTA */}
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-slate-600 font-medium">
                Signed in as <strong className="text-slate-900">{staff?.fullName || staff?.email}</strong>
              </span>
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs hover:shadow transition flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs hover:shadow transition flex items-center gap-1.5"
            >
              <span>Staff Login</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </nav>
      </header>

      {/* Hero / Main Area (100% width and centered height) */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-6 sm:px-12 text-center max-w-4xl mx-auto py-8">
        {/* Internal Security Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold mb-6 shadow-2xs">
          <ShieldCheckIcon className="size-4 text-purple-600" />
          <span>Internal Operations & Customer Management</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight mb-4">
          Unified Management for Customer Lifecycle & Operations
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          The central control center for authorized Invio staff. Manage registered customers, subscriptions,
          discount approvals, coupon campaigns, and compliance audit logs.
        </p>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm hover:shadow transition flex items-center justify-center gap-2"
            >
              <span>Open Operations Dashboard</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm hover:shadow transition flex items-center justify-center gap-2"
            >
              <span>Sign In to Staff Portal</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </div>

        {/* 3 Pillars / Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-12 text-left">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="font-bold text-xs text-slate-900 mb-1">Customer & Subscription Management</div>
            <div className="text-[11px] text-slate-500 leading-normal">
              Real-time directory, lifecycle plans, account statuses, and executive assignments.
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="font-bold text-xs text-slate-900 mb-1">Discounts & Coupon Controls</div>
            <div className="text-[11px] text-slate-500 leading-normal">
              Multi-tiered discount thresholds, manager approval workflows, and regional codes.
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="font-bold text-xs text-slate-900 mb-1">Audited Security & RBAC</div>
            <div className="text-[11px] text-slate-500 leading-normal">
              Cryptographically audited actions, PII masking, and strict role-based access.
            </div>
          </div>
        </div>
      </main>

      {/* 100% Width Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 px-6 sm:px-12 py-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 z-10 gap-2">
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
