import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { useCrmToast } from '../context/CrmToastContext';
import { SearchIcon, FilterIcon, RefreshCwIcon, AlertCircleIcon, PlusIcon } from '../components/CrmIcons';
import { TableSkeleton } from '../components/common/Skeleton';

function ExecCustomerLookup() {
  const navigate = useNavigate();
  const { toast } = useCrmToast();
  const [email, setEmail] = useState('');
  const [looking, setLooking] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [reg, setReg] = useState({ firstName: '', lastName: '', email: '', phone: '', businessName: '' });
  const [regLoading, setRegLoading] = useState(false);
  async function handleLookup(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLooking(true);
    try {
      const res = await crmApi.lookupCustomer(email.trim().toLowerCase());
      if (res.profile?.id) navigate(`/customers/${encodeURIComponent(res.profile.id)}`);
      else toast.error('No customer found with this email address.');
    } catch (err) {
      toast.error(err.message || 'Lookup failed.');
    } finally {
      setLooking(false);
    }
  }
  async function handleRegister(e) {
    e.preventDefault();
    if (!reg.email.trim()) return;
    setRegLoading(true);
    try {
      const res = await crmApi.registerCustomer({
        firstName: reg.firstName.trim(),
        lastName: reg.lastName.trim(),
        email: reg.email.trim().toLowerCase(),
        phone: reg.phone.trim(),
        businessName: reg.businessName.trim(),
      });
      toast.success('Customer onboarded.');
      if (res.customerId) navigate(`/customers/${encodeURIComponent(res.customerId)}`);
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  }
  const set = (k) => (e) => setReg((r) => ({ ...r, [k]: e.target.value }));
  return (
    <div className="space-y-3 max-w-xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Customer Lookup</h2>
        <p className="text-xs text-slate-500">Enter a customer email to open their page — add notes, raise a service request, or request a discount there.</p>
      </div>
      <form onSubmit={handleLookup} className="bg-white p-4 border border-slate-200 shadow-xs flex gap-2">
        <input type="email" required placeholder="billing@retailstore.in" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} className="flex-1 px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:border-purple-600" />
        <button type="submit" disabled={looking} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer">{looking ? 'Looking…' : 'Open →'}</button>
      </form>
      <button onClick={() => setShowRegister((v) => !v)} className="text-xs font-semibold text-purple-700 hover:text-purple-800 cursor-pointer">+ Onboard new customer</button>
      {showRegister && (
        <form onSubmit={handleRegister} className="bg-white p-4 border border-slate-200 shadow-xs grid grid-cols-2 gap-2.5 text-xs">
          <input placeholder="First name" value={reg.firstName} onChange={set('firstName')} className="px-3 py-2 border border-slate-200 focus:outline-none focus:border-purple-600" />
          <input placeholder="Last name" value={reg.lastName} onChange={set('lastName')} className="px-3 py-2 border border-slate-200 focus:outline-none focus:border-purple-600" />
          <input type="email" required placeholder="Email *" value={reg.email} onChange={(e) => setReg((r) => ({ ...r, email: e.target.value.toLowerCase() }))} className="col-span-2 px-3 py-2 border border-slate-200 focus:outline-none focus:border-purple-600" />
          <input placeholder="Phone" value={reg.phone} onChange={set('phone')} className="px-3 py-2 border border-slate-200 focus:outline-none focus:border-purple-600" />
          <input placeholder="Business name" value={reg.businessName} onChange={set('businessName')} className="px-3 py-2 border border-slate-200 focus:outline-none focus:border-purple-600" />
          <button type="submit" disabled={regLoading} className="col-span-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold transition disabled:opacity-50 cursor-pointer">{regLoading ? 'Onboarding…' : 'Onboard Customer'}</button>
        </form>
      )}
    </div>
  );
}

export function CrmCustomersPage() {
  const { isAdmin, isManagerOrAdmin, canViewDirectory } = useCrmAuth();
  const { toast } = useCrmToast();
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

  // Register Customer Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regPlan, setRegPlan] = useState('free');
  const [regCountry, setRegCountry] = useState('India');
  const [regLoading, setRegLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getCustomers({ page, limit: 12, search, plan });
      setCustomers(res.customers || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      const msg = err.message || 'Failed to fetch customer directory.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, search, plan, toast]);

  useEffect(() => {
    if (canViewDirectory) fetchCustomers();
    else setLoading(false);
  }, [fetchCustomers, canViewDirectory]);

  if (!canViewDirectory) {
    return <ExecCustomerLookup />;
  }

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
      toast.success('Customer details updated successfully.');
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to update customer.');
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
      toast.success('Customer account deleted permanently.');
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete customer.');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleRegisterCustomer(e) {
    e.preventDefault();
    setRegLoading(true);
    try {
      const payload = {
        firstName: regFirstName,
        lastName: regLastName,
        email: regEmail,
        phone: regPhone,
        businessName: regBusinessName,
        plan: regPlan,
        country: regCountry,
      };
      try {
        await crmApi.createCustomer(payload);
      } catch (firstErr) {
        // Fallback to /register route if plain POST is not supported
        if (String(firstErr.message || '').toLowerCase().includes('not found')) {
          await crmApi.registerCustomer(payload);
        } else {
          throw firstErr;
        }
      }
      setShowRegisterModal(false);
      setRegFirstName('');
      setRegLastName('');
      setRegEmail('');
      setRegPhone('');
      setRegBusinessName('');
      setRegPlan('free');
      setRegCountry('India');
      toast.success('Customer registered successfully.');
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to register customer.');
    } finally {
      setRegLoading(false);
    }
  }

  function exportCsv() {
    if (!customers.length) {
      toast.warning('Nothing to export — customer list is empty.');
      return;
    }
    const escapeCsvCell = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Plan', 'Country', 'RegistrationDate'];
    const rows = customers.map((c) => [
      escapeCsvCell(c.id),
      escapeCsvCell(c.fullName || ''),
      escapeCsvCell(c.email || ''),
      escapeCsvCell(c.phone || ''),
      escapeCsvCell(c.currentPlan || ''),
      escapeCsvCell(c.country || 'N/A'),
      escapeCsvCell(c.registrationDate || ''),
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invio-customers-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Customer CSV exported.');
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
              onClick={() => setShowRegisterModal(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusIcon className="size-4" />
              <span>Register Customer</span>
            </button>
          )}
          {isManagerOrAdmin && (
            <button
              onClick={exportCsv}
              className="px-3.5 py-2 bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
            >
              Export CSV ↓
            </button>
          )}
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition disabled:opacity-50 cursor-pointer"
            title="Refresh"
          >
            <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="size-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search name, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
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
            className="px-3 py-1.5 border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-purple-600"
          >
            <option value="all">All Plans</option>
            <option value="free">Free Tier</option>
            <option value="plus">Plus Plan</option>
            <option value="pro">Pro Plan</option>
          </select>
        </div>
      </div>

      {/* Customers Table — one line per row, auto width = longest row */}
      <div className="bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="crm-table-wrap overflow-x-auto">
          <table className="crm-table text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-1.5 px-3 whitespace-nowrap">Customer</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Contact Info</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Current Plan</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Assigned Staff</th>
                <th className="py-1.5 px-3 whitespace-nowrap">Status</th>
                <th className="py-1.5 px-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton rows={6} cols={6} />
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{c.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.id}</div>
                    </td>
                    <td className="py-1.5 px-3 font-mono text-[11px] whitespace-nowrap">
                      <div className="text-slate-800">{c.email}</div>
                      <div className="text-slate-400 text-[10px]">{c.phone || 'No phone'}</div>
                    </td>
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <span className="capitalize font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 text-[11px] border border-purple-200 rounded-full">
                        {c.currentPlan}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-600 whitespace-nowrap">
                      {c.assignedStaffName ? (
                        <span className="font-medium text-slate-800">{c.assignedStaffName}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        c.emailVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`size-1.5 rounded-full ${c.emailVerified ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {c.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/customers/${encodeURIComponent(c.id)}`}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-sm transition"
                        >
                          Profile →
                        </Link>

                        {isManagerOrAdmin && (
                          <button
                            onClick={() => openEditModal(c)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-sm transition cursor-pointer"
                            title="Edit customer account"
                          >
                            Edit
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => setDeletingCustomer(c)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-sm transition cursor-pointer"
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
                className="px-3 py-1 border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Register Customer Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white max-w-md w-full p-4 shadow-xl border border-slate-200 space-y-2.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Register New Customer</h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRegisterCustomer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input type="text" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} required className="w-full p-2.5 border border-slate-200 focus:outline-none focus:border-purple-600" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                  <input type="text" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} className="w-full p-2.5 border border-slate-200 focus:outline-none focus:border-purple-600" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required className="w-full p-2.5 border border-slate-200 focus:outline-none focus:border-purple-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input type="text" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+91..." className="w-full p-2.5 border border-slate-200 focus:outline-none focus:border-purple-600" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Country</label>
                  <input type="text" value={regCountry} onChange={(e) => setRegCountry(e.target.value)} className="w-full p-2.5 border border-slate-200 focus:outline-none focus:border-purple-600" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Name</label>
                <input type="text" value={regBusinessName} onChange={(e) => setRegBusinessName(e.target.value)} placeholder="e.g. Metro Retail Mart" className="w-full p-2.5 border border-slate-200 focus:outline-none focus:border-purple-600" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan</label>
                <select value={regPlan} onChange={(e) => setRegPlan(e.target.value)} className="w-full p-2.5 border border-slate-200 bg-white focus:outline-none focus:border-purple-600">
                  <option value="free">Free Tier</option>
                  <option value="plus">Plus Plan</option>
                  <option value="pro">Pro Plan</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowRegisterModal(false)} className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={regLoading} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer">
                  {regLoading ? 'Registering...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white max-w-md w-full p-4 shadow-xl border border-slate-200 space-y-2.5">
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
                    className="w-full p-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
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
                  className="w-full p-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business / Company Name</label>
                <input
                  type="text"
                  value={editBusinessName}
                  onChange={(e) => setEditBusinessName(e.target.value)}
                  placeholder="e.g. Metro Retail Mart"
                  className="w-full p-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subscription Plan</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white focus:outline-none focus:border-purple-600"
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
                    className="w-full p-2.5 border border-slate-200 bg-white focus:outline-none focus:border-purple-600"
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
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
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
          <div className="bg-white max-w-sm w-full p-4 shadow-xl border border-red-100 space-y-2.5">
            <div className="flex items-center gap-3 text-red-600">
              <div className="size-10 bg-red-100 flex items-center justify-center">
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
                className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
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
