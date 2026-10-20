import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CrmAuthProvider } from './context/CrmAuthContext';
import { CrmToastProvider } from './context/CrmToastContext';
import { CrmToaster } from './components/CrmToaster';
import { CrmLayout } from './components/CrmLayout';
import { CrmProtectedRoute } from './components/CrmProtectedRoute';

const CrmHomePage = lazy(() => import('./pages/CrmHomePage').then(m => ({ default: m.CrmHomePage })));
const CrmLoginPage = lazy(() => import('./pages/CrmLoginPage').then(m => ({ default: m.CrmLoginPage })));
const CrmDashboardPage = lazy(() => import('./pages/CrmDashboardPage').then(m => ({ default: m.CrmDashboardPage })));
const CrmCustomersPage = lazy(() => import('./pages/CrmCustomersPage').then(m => ({ default: m.CrmCustomersPage })));
const CrmCustomerDetailPage = lazy(() => import('./pages/CrmCustomerDetailPage').then(m => ({ default: m.CrmCustomerDetailPage })));
const CrmDiscountsPage = lazy(() => import('./pages/CrmDiscountsPage').then(m => ({ default: m.CrmDiscountsPage })));
const CrmApprovalsPage = lazy(() => import('./pages/CrmApprovalsPage').then(m => ({ default: m.CrmApprovalsPage })));
const CrmCouponsPage = lazy(() => import('./pages/CrmCouponsPage').then(m => ({ default: m.CrmCouponsPage })));
const CrmTicketsPage = lazy(() => import('./pages/CrmTicketsPage').then(m => ({ default: m.CrmTicketsPage })));
const CrmTicketDetailPage = lazy(() => import('./pages/CrmTicketDetailPage').then(m => ({ default: m.CrmTicketDetailPage })));
const CrmPlansPage = lazy(() => import('./pages/CrmPlansPage').then(m => ({ default: m.CrmPlansPage })));
const CrmStaffPage = lazy(() => import('./pages/CrmStaffPage').then(m => ({ default: m.CrmStaffPage })));
const CrmAuditLogsPage = lazy(() => import('./pages/CrmAuditLogsPage').then(m => ({ default: m.CrmAuditLogsPage })));
const CrmBugsPage = lazy(() => import('./pages/CrmBugsPage').then(m => ({ default: m.CrmBugsPage })));
const CrmContactsPage = lazy(() => import('./pages/CrmContactsPage').then(m => ({ default: m.CrmContactsPage })));
const CrmBroadcastsPage = lazy(() => import('./pages/CrmBroadcastsPage').then(m => ({ default: m.CrmBroadcastsPage })));

function PageFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="size-8 rounded-full border-2 border-slate-200 border-t-purple-600 animate-spin" />
    </div>
  );
}

export function App() {
  return (
    <CrmAuthProvider>
      <CrmToastProvider>
        <CrmToaster />
        <Suspense fallback={<PageFallback />}>
          <Routes>
          {/* Public 100% W x H Home Landing Page */}
          <Route path="/" element={<CrmHomePage />} />

        {/* Staff Authentication */}
        <Route path="/login" element={<CrmLoginPage />} />

        {/* Protected Staff Operations Shell */}
        <Route
          element={
            <CrmProtectedRoute>
              <CrmLayout />
            </CrmProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<CrmDashboardPage />} />
          <Route
            path="/customers"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager', 'sales_executive', 'support_executive', 'billing_accountant']}>
                <CrmCustomersPage />
              </CrmProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager', 'sales_executive', 'support_executive', 'billing_accountant']}>
                <CrmCustomerDetailPage />
              </CrmProtectedRoute>
            }
          />
          <Route
            path="/discounts"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager', 'sales_executive', 'billing_accountant']}>
                <CrmDiscountsPage />
              </CrmProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager', 'sales_executive']}>
                <CrmApprovalsPage />
              </CrmProtectedRoute>
            }
          />
          <Route
            path="/coupons"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager', 'sales_executive', 'digital_marketer', 'billing_accountant']}>
                <CrmCouponsPage />
              </CrmProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager', 'support_executive']}>
                <CrmTicketsPage />
              </CrmProtectedRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager', 'support_executive']}>
                <CrmTicketDetailPage />
              </CrmProtectedRoute>
            }
          />
          <Route
            path="/bugs"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager', 'support_executive']}>
                <CrmBugsPage />
              </CrmProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager', 'support_executive', 'sales_executive', 'digital_marketer']}>
                <CrmContactsPage />
              </CrmProtectedRoute>
            }
          />
          <Route
            path="/plans"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager']}>
                <CrmPlansPage />
              </CrmProtectedRoute>
            }
          />
          <Route
            path="/broadcasts"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager', 'digital_marketer']}>
                <CrmBroadcastsPage />
              </CrmProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager']}>
                <CrmStaffPage />
              </CrmProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager']}>
                <CrmAuditLogsPage />
              </CrmProtectedRoute>
            }
          />
        </Route>

        {/* Legacy /crm path backward compatibility redirects */}
        <Route path="/crm" element={<Navigate to="/" replace />} />
        <Route path="/crm/*" element={<Navigate to="/" replace />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      </CrmToastProvider>
    </CrmAuthProvider>
  );
}

export default App;
