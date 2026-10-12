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

  // Edit staff modal
  const [editingStaff, setEditingStaff] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState('sales_executive');
  const [editPassword, setEditPassword] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation modal (Admin only)
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  function openEditModal(staffMember) {
    setEditingStaff(staffMember);
    setEditFullName(staffMember.fullName || '');
    setEditRole(staffMember.role || 'sales_executive');
    setEditPassword('');
    setEditStatus(staffMember.status || 'active');
  }

  async function handleUpdateStaff(e) {
    e.preventDefault();
    if (!editingStaff) return;
    setEditLoading(true);
    try {
      const payload = {
        fullName: editFullName,
        role: editRole,
        status: editStatus,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }
      await crmApi.updateStaff(editingStaff.id, payload);
      setEditingStaff(null);
      fetchStaff();
    } catch (err) {
      alert(err.message || 'Failed to update staff account.');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteStaff() {
    if (!deletingStaff) return;
    setDeleteLoading(true);
    try {
      await crmApi.deleteStaff(deletingStaff.id);
      setDeletingStaff(null);
      fetchStaff();
    } catch (err) {
      alert(err.message || 'Failed to delete staff account.');
    } finally {
      setDeleteLoading(false);
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff Account Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal team members, RBAC credentials, role authority, and account status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isManagerOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusIcon className="size-4" />
              <span>Add Staff Member</span>
            </button>
          )}
          <button
            onClick={fetchStaff}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition disabled:opacity-50 cursor-pointer"
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
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                {isManagerOrAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
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
                staffList.map((st) => {
                  const isCurrent = st.id === currentStaff?.id;
                  const canEdit = isAdmin || (isManager && (st.role === 'sales_executive' || st.role === 'support_executive'));
                  const canDelete = isAdmin && !isCurrent && st.email.toLowerCase() !== 'sktigpta@gmail.com';

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{st.fullName}</span>
                          {isCurrent && (
                            <span className="text-[10px] text-purple-700 bg-purple-50 font-bold px-1.5 py-0.5 rounded border border-purple-200">
                              You
                            </span>
                          )}
                          {st.email.toLowerCase() === 'sktigpta@gmail.com' && (
                            <span className="text-[10px] text-indigo-700 bg-indigo-50 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                              System Owner
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{st.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-semibold text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                          {st.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          st.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          <span className={`size-1.5 rounded-full ${st.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {st.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {st.lastLogin ? new Date(st.lastLogin).toLocaleString() : 'Never'}
                      </td>
                      {isManagerOrAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canEdit && (
                              <button
                                onClick={() => openEditModal(st)}
                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                title="Update details or reset password"
                              >
                                Edit
                              </button>
                            )}

                            {!isCurrent && canEdit && (
                              <button
                                onClick={() => handleToggleStatus(st)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                                  st.status === 'active'
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {st.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            )}

                            {canDelete && (
                              <button
                                onClick={() => setDeletingStaff(st)}
                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                                title="Delete staff account permanently"
                              >
                                Delete
                              </button>
                            )}

                            {!canEdit && !canDelete && (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add New Staff Member</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
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
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
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
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role & Permissions *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-purple-600"
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
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Update Staff Account</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{editingStaff.email}</p>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={editingStaff.id === currentStaff?.id || (!isAdmin && editingStaff.role === 'admin')}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:border-purple-600"
                >
                  <option value="sales_executive">Sales Executive</option>
                  <option value="support_executive">Support Executive</option>
                  {isAdmin && (
                    <>
                      <option value="manager">Operations Manager</option>
                      <option value="admin">System Administrator</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  disabled={editingStaff.id === currentStaff?.id}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:border-purple-600"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reset Password <span className="text-slate-400 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal (Admin only) */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-red-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="size-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircleIcon className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Staff Account?</h3>
                <p className="text-[11px] text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete the account for{' '}
              <strong className="text-slate-900">{deletingStaff.fullName}</strong> ({deletingStaff.email})?
              Any tickets or customers assigned to them will be unassigned.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
