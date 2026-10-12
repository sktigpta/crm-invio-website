import { Navigate } from 'react-router-dom';
import { useCrmAuth } from '../context/CrmAuthContext';

export function CrmProtectedRoute({ children, requiredRoles }) {
  const { staff, loading, isAuthenticated } = useCrmAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-slate-200 border-t-purple-600 animate-spin" />
          <p className="text-xs font-medium text-slate-500">Authenticating CRM Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(staff?.role)) {
    return (
      <div className="bg-white rounded-xl p-8 border border-red-200 max-w-lg mx-auto my-12 text-center shadow-sm">
        <div className="size-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          !
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-600 mb-6">
          Your current role (<strong className="capitalize">{staff?.role?.replace('_', ' ')}</strong>) does not have permission to view this administrative resource.
        </p>
        <a
          href="/dashboard"
          className="inline-flex px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  return children;
}
