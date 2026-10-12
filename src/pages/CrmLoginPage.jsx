import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCrmAuth } from '../context/CrmAuthContext';
import { crmApi } from '../services/crmApi';

function formatLoginError(rawError) {
  if (!rawError) return '';
  const raw = typeof rawError === 'string' ? rawError : rawError.message || '';
  if (!raw) return 'Login failed. Please check your credentials and try again.';

  if (/failed to fetch|networkerror|load failed|econnrefused/i.test(raw)) {
    return 'Unable to reach the Invio server. Please verify your connection or try again in a few moments.';
  }
  if (/too many/i.test(raw)) {
    return 'Too many login attempts. Please wait 1 minute before trying again.';
  }
  if (/invalid.*credentials|credentials/i.test(raw)) {
    return 'Incorrect email or password. Please verify your staff credentials.';
  }
  if (/suspended|inactive/i.test(raw)) {
    return raw;
  }
  return raw.replace(/^error:\s*/i, '').trim();
}

export function CrmLoginPage() {
  const { login, isAuthenticated, mustChangePassword, refreshStaff } = useCrmAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const forceChange = new URLSearchParams(location.search).get('change') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    location.search.includes('expired=1') ? 'Your CRM staff session expired. Please sign in again.' : ''
  );

  // Change-password mode (temporary credentials)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both your staff email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(cleanEmail, password, remember);
      if (res?.staff?.mustChangePassword) {
        navigate('/login?change=1', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(formatLoginError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setChangeError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setChangeError('Please fill in all three password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setChangeError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('New passwords do not match. Please re-enter.');
      return;
    }
    setChangeLoading(true);
    try {
      await crmApi.changePassword(currentPassword, newPassword);
      await refreshStaff();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setChangeError(formatLoginError(err));
    } finally {
      setChangeLoading(false);
    }
  }

  // Forced password-change screen for temporary-password holders
  if (isAuthenticated && (mustChangePassword || forceChange)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Link to="/" title="Invio Home" className="inline-flex items-center gap-2.5 mb-3 group">
            <img src="/appLogo.png" alt="Invio Logo" className="size-9 object-contain" />
            <span className="text-base font-bold text-slate-900 tracking-tight">Invio CRM</span>
          </Link>
          <div className="inline-block mx-auto mb-2">
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
              Temporary Credentials Detected
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Set Your Permanent Password
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Your administrator created this account with temporary access. Choose a secure permanent password to proceed.
          </p>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-6 px-6 sm:px-8 border border-slate-200/90 shadow-xs">
            {changeError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200/80 text-xs font-medium text-red-700 flex items-start gap-2.5">
                <svg className="size-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1 leading-relaxed">{changeError}</div>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter the password provided to you"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Permanent Password (min. 8 characters)</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    autoComplete="new-password"
                    className="w-full px-3 py-2 pr-9 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                />
              </div>

              <button
                type="submit"
                disabled={changeLoading}
                className="w-full mt-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {changeLoading && <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>{changeLoading ? 'Updating credentials...' : 'Set Password & Enter Portal'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Header & Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" title="Invio Home" className="inline-flex items-center gap-2.5 mb-3 group">
          <img src="/appLogo.png" alt="Invio Logo" className="size-9 object-contain group-hover:scale-105 transition-transform" />
          <span className="text-base font-bold text-slate-900 tracking-tight">Invio CRM</span>
        </Link>
        <div className="inline-block mx-auto mb-2">
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
            Staff Portal
          </span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Sign In to Invio CRM
        </h2>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Authorized personnel only. All access, discount overrides, and audit trails are logged.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-6 sm:px-8 border border-slate-200/90 shadow-xs">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200/80 text-xs font-medium text-red-700 flex items-start gap-2.5">
              <svg className="size-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="staff-email">
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@invio.com"
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="staff-password">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="staff-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-9 py-2 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded-xs border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-[11px]">Keep me signed in</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {loading && <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{loading ? 'Authenticating credentials...' : 'Sign In to Portal'}</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <Link
              to="/"
              className="hover:text-purple-600 transition font-medium"
            >
              &larr; Return to Home
            </Link>
            <a
              href="mailto:support@timrio.com"
              className="text-slate-400 hover:text-slate-600 transition"
              title="Contact system administrator"
            >
              Need access?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
