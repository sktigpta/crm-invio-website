import { Routes, Route, Navigate } from 'react-router-dom';
import { CrmAuthProvider } from './context/CrmAuthContext';
import { CrmToastProvider } from './context/CrmToastContext';
import { CrmToaster } from './components/CrmToaster';
import { CrmLayout } from './components/CrmLayout';
import { CrmProtectedRoute } from './components/CrmProtectedRoute';
import { CrmHomePage } from './pages/CrmHomePage';
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
import { CrmBugsPage } from './pages/CrmBugsPage';
import { CrmContactsPage } from './pages/CrmContactsPage';
import { CrmBroadcastsPage } from './pages/CrmBroadcastsPage';

export function App() {
  return (
    <CrmAuthProvider>
      <CrmToastProvider>
        <CrmToaster />
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
          <Route path="/customers" element={<CrmCustomersPage />} />
          <Route path="/customers/:id" element={<CrmCustomerDetailPage />} />
          <Route path="/discounts" element={<CrmProtectedRoute requiredRoles={['admin', 'manager']}><CrmDiscountsPage /></CrmProtectedRoute>} />
          <Route path="/approvals" element={<CrmProtectedRoute requiredRoles={['admin', 'manager']}><CrmApprovalsPage /></CrmProtectedRoute>} />
          <Route path="/coupons" element={<CrmProtectedRoute requiredRoles={['admin', 'manager']}><CrmCouponsPage /></CrmProtectedRoute>} />
          <Route path="/tickets" element={<CrmProtectedRoute requiredRoles={['admin', 'manager']}><CrmTicketsPage /></CrmProtectedRoute>} />
          <Route path="/tickets/:id" element={<CrmProtectedRoute requiredRoles={['admin', 'manager']}><CrmTicketDetailPage /></CrmProtectedRoute>} />
          <Route path="/bugs" element={<CrmProtectedRoute requiredRoles={['admin', 'manager']}><CrmBugsPage /></CrmProtectedRoute>} />
          <Route path="/contacts" element={<CrmProtectedRoute requiredRoles={['admin', 'manager', 'support_executive']}><CrmContactsPage /></CrmProtectedRoute>} />
          <Route path="/plans" element={<CrmPlansPage />} />
          <Route
            path="/broadcasts"
            element={
              <CrmProtectedRoute requiredRoles={['admin', 'manager']}>
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
              <CrmProtectedRoute>
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
      </CrmToastProvider>
    </CrmAuthProvider>
  );
}

export default App;
