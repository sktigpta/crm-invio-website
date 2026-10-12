import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { SearchIcon, FilterIcon, RefreshCwIcon, AlertCircleIcon } from '../components/CrmIcons';

export function CrmCustomersPage() {
  const { staff, isAdmin, isManagerOrAdmin } = useCrmAuth();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Customer Modal
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editPlan, setEditPlan] = useState('free');
  const [editEmailVerified, setEditEmailVerified] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  // Delete Customer Confirmation Modal (Admin only)
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getCustomers({ page, limit: 12, search, plan });
      setCustomers(res.customers || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch customer directory.');
    } finally {
      setLoading(false);
    }
  }, [page, search, plan]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  }

  function openEditModal(c) {
    setEditingCustomer(c);
    const names = (c.fullName || '').split(' ');
    setEditFirstName(names[0] || '');
    setEditLastName(names.slice(1).join(' ') || '');
    setEditEmail(c.email || '');
    setEditBusinessName(c.businessName || '');
    setEditPlan(c.currentPlan || 'free');
    setEditEmailVerified(Boolean(c.emailVerified));
  }

  async function handleUpdateCustomer(e) {
    e.preventDefault();
    if (!editingCustomer) return;
    setEditLoading(true);
    try {
      await crmApi.updateCustomer(editingCustomer.id, {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        businessName: editBusinessName,
        plan: editPlan,
        emailVerified: editEmailVerified,
      });
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      alert(err.message || 'Failed to update customer.');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteCustomer() {
    if (!deletingCustomer) return;
    setDeleteLoading(true);
    try {
      await crmApi.deleteCustomer(deletingCustomer.id);
      setDeletingCustomer(null);
      fetchCustomers();
    } catch (err) {
      alert(err.message || 'Failed to delete customer.');
    } finally {
      setDeleteLoading(false);
    }
  }

  function exportCsv() {
    if (!customers.length) return;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Plan', 'Country', 'RegistrationDate'];
    const rows = customers.map((c) => [
      c.id,
      `"${c.fullName || ''}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      c.currentPlan,
      c.country || 'N/A',
      c.registrationDate,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `invio-customers-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {total} registered account{total === 1 ? '' : 's'}.{' '}
            {!isManagerOrAdmin && (
              <span className="text-amber-600 font-semibold">
                (PII masked per role policy)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManagerOrAdmin && (
            <button
              onClick={exportCsv}
              className="px-3.5 py-2  bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
            >
              Export CSV ↓
            </button>
          )}
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="p-2  bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition disabled:opacity-50 cursor-pointer"
            title="Refresh"
          >
            <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4  bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="size-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4  border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search name, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2  border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
          />
          <SearchIcon className="size-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-2">
            <FilterIcon className="size-3.5" />
            <span>Plan:</span>
          </div>
          <select
            value={plan}
            onChange={(e) => {
              setPlan(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5  border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-purple-600"
          >
            <option value="all">All Plans</option>
            <option value="free">Free Tier</option>
            <option value="plus">Plus Plan</option>
            <option value="pro">Pro Plan</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white  border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-1.5 px-3">Customer</th>
                <th className="py-1.5 px-3">Contact Info</th>
                <th className="py-1.5 px-3">Current Plan</th>
                <th className="py-1.5 px-3">Assigned Staff</th>
                <th className="py-1.5 px-3">Status</th>
                <th className="py-1.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="size-6 border-2 border-slate-200 border-t-purple-600  animate-spin mx-auto mb-2" />
                    Loading customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-1.5 px-3">
                      <div className="font-semibold text-slate-900">{c.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.id}</div>
                    </td>
                    <td className="py-1.5 px-3 font-mono text-[11px]">
                      <div className="text-slate-800">{c.email}</div>
                      <div className="text-slate-400 text-[10px]">{c.phone || 'No phone'}</div>
                    </td>
                    <td className="py-1.5 px-3">
                      <span className="capitalize font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5  text-[11px] border border-purple-200">
                        {c.currentPlan}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-600">
                      {c.assignedStaffName ? (
                        <span className="font-medium text-slate-800">{c.assignedStaffName}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5  ${
                        c.emailVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`size-1.5  ${c.emailVerified ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {c.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/customers/${encodeURIComponent(c.id)}`}
                          className="px-2.5 py-1  bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition"
                        >
                          Profile →
                        </Link>

                        {isManagerOrAdmin && (
                          <button
                            onClick={() => openEditModal(c)}
                            className="px-2.5 py-1  bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                            title="Edit customer account"
                          >
                            Edit
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => setDeletingCustomer(c)}
                            className="px-2.5 py-1  bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition cursor-pointer"
                            title="Delete customer account"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1  border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1  border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white  max-w-md w-full p-4 shadow-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Update Customer Details</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{editingCustomer.id}</p>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full p-2.5  border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full p-2.5  border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full p-2.5  border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business / Company Name</label>
                <input
                  type="text"
                  value={editBusinessName}
                  onChange={(e) => setEditBusinessName(e.target.value)}
                  placeholder="e.g. Acme Studio"
                  className="w-full p-2.5  border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subscription Plan</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    className="w-full p-2.5  border border-slate-200 bg-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="free">Free Tier</option>
                    <option value="plus">Plus Plan</option>
                    <option value="pro">Pro Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Verification</label>
                  <select
                    value={editEmailVerified ? 'verified' : 'unverified'}
                    onChange={(e) => setEditEmailVerified(e.target.value === 'verified')}
                    className="w-full p-2.5  border border-slate-200 bg-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-3.5 py-2  border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2  bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal (Admin only) */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white  max-w-sm w-full p-4 shadow-xl border border-red-100 space-y-2.5">
            <div className="flex items-center gap-3 text-red-600">
              <div className="size-10  bg-red-100 flex items-center justify-center">
                <AlertCircleIcon className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Customer Account?</h3>
                <p className="text-[11px] text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete the customer account for{' '}
              <strong className="text-slate-900">{deletingCustomer.fullName}</strong> ({deletingCustomer.email})?
              All associated invoices, tickets, and discount records will be permanently removed.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="px-3.5 py-2  border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={deleteLoading}
                className="px-4 py-2  bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
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
