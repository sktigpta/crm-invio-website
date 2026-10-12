import { Routes, Route, Navigate } from 'react-router-dom';
import { CrmAuthProvider } from './context/CrmAuthContext';
import { CrmLayout } from './components/CrmLayout';
import { CrmProtectedRoute } from './components/CrmProtectedRoute';
import { CrmLoginPage } from './pages/CrmLoginPage';
import { CrmDashboardPage } from './pages/CrmDashboardPage';
import { CrmCustomersPage } from './pages/CrmCustomersPage';
import { CrmCustomerDetailPage } from './pages/CrmCustomerDetailPage';
import { CrmDiscountsPage } from './pages/CrmDiscountsPage';
import { CrmApprovalsPage } from './pages/CrmApprovalsPage';
import { CrmCouponsPage } from './pages/CrmCouponsPage';
import { CrmTicketsPage } from './pages/CrmTicketsPage';
import { CrmTicketDetailPage } from './pages/CrmTicketDetailPage';
import { CrmPlansPage } from './pages/CrmPlansPage';
import { CrmStaffPage } from './pages/CrmStaffPage';
import { CrmAuditLogsPage } from './pages/CrmAuditLogsPage';

export function App() {
  return (
    <CrmAuthProvider>
      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<CrmLoginPage />} />

        {/* Protected Staff Operations Shell */}
        <Route
          path="/"
          element={
            <CrmProtectedRoute>
              <CrmLayout />
            </CrmProtectedRoute>
          }
        >
          <Route index element={<CrmDashboardPage />} />
          <Route path="customers" element={<CrmCustomersPage />} />
          <Route path="customers/:id" element={<CrmCustomerDetailPage />} />
          <Route path="discounts" element={<CrmDiscountsPage />} />
          <Route path="approvals" element={<CrmApprovalsPage />} />
          <Route path="coupons" element={<CrmCouponsPage />} />
          <Route path="tickets" element={<CrmTicketsPage />} />
          <Route path="tickets/:id" element={<CrmTicketDetailPage />} />
          <Route path="plans" element={<CrmPlansPage />} />
          <Route
            path="staff"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager']}>
                <CrmStaffPage />
              </CrmProtectedRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <CrmProtectedRoute requiredRoles={['admin']}>
                <CrmAuditLogsPage />
              </CrmProtectedRoute>
            }
          />
        </Route>

        {/* Legacy /crm path backward compatibility redirects */}
        <Route path="/crm/*" element={<Navigate to="/" replace />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CrmAuthProvider>
  );
}

export default App;
