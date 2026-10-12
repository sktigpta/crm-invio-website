import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { ShieldCheckIcon, RefreshCwIcon, AlertCircleIcon, PlusIcon } from '../components/CrmIcons';

export function CrmStaffPage() {
  const { staff: currentStaff, isAdmin, isManager, isManagerOrAdmin } = useCrmAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create staff modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('sales_executive');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getStaffList();
      setStaffList(res.staff || []);
    } catch (err) {
      setError(err.message || 'Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  async function handleToggleStatus(staffMember) {
    if (!isManagerOrAdmin || staffMember.id === currentStaff.id) return;
    if (isManager && staffMember.role !== 'sales_executive' && staffMember.role !== 'support_executive') {
      alert('Managers can only toggle status for Sales and Support Executives.');
      return;
    }
    const nextStatus = staffMember.status === 'active' ? 'suspended' : 'active';
    try {
      await crmApi.updateStaffStatus(staffMember.id, nextStatus);
      fetchStaff();
    } catch (err) {
      alert(err.message || 'Failed to update staff status.');
    }
  }

  async function handleCreateStaff(e) {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await crmApi.createStaff({
        email: newEmail,
        password: newPassword,
        fullName: newFullName,
        role: newRole,
      });
      setShowCreateModal(false);
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('sales_executive');
      fetchStaff();
    } catch (err) {
      alert(err.message || 'Failed to create staff member.');
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Staff Account Directory</h2>
          <p className="text-xs text-slate-500">
            Internal team credentials, RBAC role assignments, and security status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isManagerOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <PlusIcon className="size-4" />
              <span>Add Staff Member</span>
            </button>
          )}
          <button
            onClick={fetchStaff}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="size-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Login</th>
                {isManagerOrAdmin && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="size-6 border-2 border-slate-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-2" />
                    Loading staff members...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No staff records found.
                  </td>
                </tr>
              ) : (
                staffList.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {st.fullName}
                      {st.id === currentStaff.id && (
                        <span className="ml-2 text-[10px] text-purple-600 font-bold">(You)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{st.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize font-semibold text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {st.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        st.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {st.lastLogin ? new Date(st.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    {isManagerOrAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        {st.id !== currentStaff.id && (isAdmin || (isManager && (st.role === 'sales_executive' || st.role === 'support_executive'))) ? (
                          <button
                            onClick={() => handleToggleStatus(st)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                              st.status === 'active'
                                ? 'bg-red-50 hover:bg-red-100 text-red-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {st.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add New Staff Member</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Email *</label>
                <input
                  type="email"
                  placeholder="priya@invio.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Temporary Password *</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role & Permissions *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="sales_executive">Sales Executive (Direct ≤10%, Requests ≤30%)</option>
                  <option value="support_executive">Support Executive (Tickets, Requests ≤30%)</option>
                  {isAdmin && (
                    <>
                      <option value="manager">Operations Manager (Reviews ≤30%, Coupons)</option>
                      <option value="admin">System Administrator (Full Authority)</option>
                    </>
                  )}
                </select>
                {isManager && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    As an Operations Manager, you can provision Sales and Support Executives.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
