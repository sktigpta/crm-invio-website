import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCrmAuth } from '../context/CrmAuthContext';
import { crmApi } from '../services/crmApi';

export function CrmLoginPage() {
  const { login, isAuthenticated, mustChangePassword, refreshStaff } = useCrmAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const forceChange = new URLSearchParams(location.search).get('change') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    location.search.includes('expired=1') ? 'Your CRM staff session expired. Please sign in again.' : ''
  );

  // Change-password mode (temporary credentials)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(email, password, remember);
      if (res?.staff?.mustChangePassword) {
        navigate('/login?change=1', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setChangeError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setChangeError('Fill all three password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setChangeError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('New passwords do not match.');
      return;
    }
    setChangeLoading(true);
    try {
      await crmApi.changePassword(currentPassword, newPassword);
      await refreshStaff();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setChangeError(err.message || 'Failed to change password.');
    } finally {
      setChangeLoading(false);
    }
  }

  // Forced password-change screen for temporary-password holders.
  if (isAuthenticated && (mustChangePassword || forceChange)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <img src="/appLogo.png" alt="Invio Logo" className="size-10 object-contain" />
          </div>
          <h2 className="mt-3 text-center text-xl font-bold tracking-tight text-slate-900">
            Set Your New Password
          </h2>
          <p className="mt-1 text-center text-[11px] text-slate-500">
            You signed in with a temporary password. Choose a new one to continue.
          </p>
        </div>

        <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-6 px-6 border border-slate-200 sm:px-8">
            {changeError && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {changeError}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (min 8 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition"
                />
              </div>
              <button
                type="submit"
                disabled={changeLoading}
                className="w-full mt-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition disabled:opacity-60 cursor-pointer"
              >
                {changeLoading ? 'Saving...' : 'Set Password & Continue'}
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" title="Back to Home" className="flex items-center gap-2">
            <img src="/appLogo.png" alt="Invio Logo" className="size-10 object-contain" />
          </Link>
        </div>
        <h2 className="mt-3 text-center text-xl font-bold tracking-tight text-slate-900">
          Invio Staff Portal
        </h2>
        <p className="mt-1 text-center text-[11px] text-slate-500">
          Authorized personnel only. All access and actions are strictly audited.
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-6 border border-slate-200 sm:px-8">
          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-start gap-2">
              <span className="font-bold text-red-600">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="staff-email">
                Staff Email Address
              </label>
              <input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@invio.com"
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="staff-password">
                  Password
                </label>
              </div>
              <input
                id="staff-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-[11px]">Remember session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <div className="size-3.5 border-2 border-white/30 border-t-white  animate-spin" />}
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link
              to="/"
              className="text-[11px] text-slate-500 hover:text-purple-600 transition font-medium"
            >
              &larr; Return to Home Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
