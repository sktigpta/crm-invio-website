import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import {
  UsersIcon,
  PercentIcon,
  TicketIcon,
  TagIcon,
  FileTextIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from '../components/CrmIcons';

export function CrmCustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { staff, isAdmin, isManagerOrAdmin, isSales, isSupport } = useCrmAuth();

  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Edit Customer Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBusinessName, setEditBusinessName] = useState('');
  const [editPlan, setEditPlan] = useState('free');
  const [editPhone, setEditPhone] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete Customer State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Staff Assignment State
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // New Note State
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Discount Modal State
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [discountReason, setDiscountReason] = useState('');
  const [discountPlan, setDiscountPlan] = useState('all');
  const [discountModalLoading, setDiscountModalLoading] = useState(false);
  const [discountMessage, setDiscountMessage] = useState('');

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getCustomerDetail(id);
      setCustomerData(res);
      setSelectedStaffId(res.profile?.assignedStaffId || '');
    } catch (err) {
      setError(err.message || 'Failed to load customer profile.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  function openEditModal() {
    if (!customerData?.profile) return;
    const p = customerData.profile;
    setEditFirstName(p.firstName || '');
    setEditLastName(p.lastName || '');
    setEditEmail(p.email || '');
    setEditBusinessName(p.businessName || '');
    setEditPlan(p.currentPlan || 'free');
    setEditPhone(p.phone || '');
    setEditCountry(p.country || '');
    setShowEditModal(true);
  }

  async function handleUpdateCustomer(e) {
    e.preventDefault();
    setEditLoading(true);
    try {
      await crmApi.updateCustomer(id, {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        businessName: editBusinessName,
        plan: editPlan,
        phone: editPhone,
        country: editCountry,
      });
      setShowEditModal(false);
      fetchCustomer();
    } catch (err) {
      alert(err.message || 'Failed to update customer.');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteCustomer() {
    setDeleteLoading(true);
    try {
      await crmApi.deleteCustomer(id);
      navigate('/customers', { replace: true });
    } catch (err) {
      alert(err.message || 'Failed to delete customer.');
    } finally {
      setDeleteLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomer();
    if (isManagerOrAdmin) {
      crmApi.getStaffList().then((res) => {
        if (res.staff) setStaffList(res.staff);
      }).catch(() => {});
    }
  }, [fetchCustomer, isManagerOrAdmin]);

  async function handleAssignStaff(e) {
    e.preventDefault();
    setAssignLoading(true);
    setAssignSuccess(false);
    try {
      await crmApi.assignCustomerStaff(id, selectedStaffId || null);
      setAssignSuccess(true);
      fetchCustomer();
      setTimeout(() => setAssignSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to assign staff.');
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteLoading(true);
    try {
      await crmApi.addCustomerNote(id, noteText);
      setNoteText('');
      fetchCustomer();
    } catch (err) {
      alert(err.message || 'Failed to save internal note.');
    } finally {
      setNoteLoading(false);
    }
  }

  async function handleCreateDiscount(e) {
    e.preventDefault();
    setDiscountModalLoading(true);
    setDiscountMessage('');
    try {
      const res = await crmApi.createDiscount({
        customerId: id,
        discountType,
        discountValue: Number(discountValue),
        reason: discountReason,
        applicablePlan: discountPlan,
      });
      setDiscountMessage(res.message || 'Discount processed successfully!');
      fetchCustomer();
      setTimeout(() => {
        setShowDiscountModal(false);
        setDiscountMessage('');
        setDiscountReason('');
      }, 2000);
    } catch (err) {
      alert(err.message || 'Failed to create discount.');
    } finally {
      setDiscountModalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <div className="size-8 border-2 border-slate-200 border-t-purple-600  animate-spin mb-3" />
        <p className="text-xs">Loading customer profile...</p>
      </div>
    );
  }

  if (error || !customerData) {
    return (
      <div className="p-6  bg-red-50 border border-red-200 text-xs text-red-700">
        <h3 className="font-bold mb-1">Error Loading Customer</h3>
        <p>{error || 'Customer not found.'}</p>
        <Link to="/customers" className="mt-3 inline-block font-semibold text-purple-700">
          ← Return to Directory
        </Link>
      </div>
    );
  }

  const { profile, payments, discounts, couponRedemptions, tickets, notes } = customerData;

  return (
    <div className="space-y-6">
      {/* Back button & top breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/customers"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          ← Back to Customers Directory
        </Link>
        <span className="text-[11px] font-mono text-slate-400">ID: {profile.id}</span>
      </div>

      {/* Customer Header Card */}
      <div className="bg-white p-6  border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="size-14  bg-purple-100 text-purple-700 font-bold text-xl flex items-center justify-center flex-shrink-0">
            {profile.fullName.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">{profile.fullName}</h2>
              <span className="capitalize text-xs font-semibold px-2 py-0.5  bg-purple-50 text-purple-700 border border-purple-200">
                {profile.currentPlan} Plan
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5  ${
                profile.emailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {profile.emailVerified ? '✓ Verified' : 'Unverified'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 font-mono">
              <span>{profile.email}</span>
              {profile.phone && <span>• {profile.phone}</span>}
              {profile.country && <span>• {profile.country}</span>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowDiscountModal(true)}
            className="px-3.5 py-2  bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            + Grant Discount
          </button>
          {isManagerOrAdmin && (
            <button
              onClick={openEditModal}
              className="px-3.5 py-2  bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Edit Details
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-2  bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition cursor-pointer"
            >
              Delete
            </button>
          )}
          <Link
            to={`/tickets?search=${encodeURIComponent(profile.email)}`}
            className="px-3.5 py-2  bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
          >
            View Tickets ({tickets.length})
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-semibold">
        {[
          { key: 'profile', label: 'Profile & Contact' },
          { key: 'subscriptions', label: `Billing & History (${payments.length})` },
          { key: 'discounts', label: `Discounts (${discounts.length})` },
          { key: 'coupons', label: `Coupons Redeemed (${couponRedemptions.length})` },
          { key: 'tickets', label: `Support Tickets (${tickets.length})` },
          { key: 'notes', label: `Internal Notes (${notes.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 border-b-2 transition ${
              activeTab === tab.key
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Profile & Contact */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5  border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-2">Account Details</h3>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Business / Entity Name:</span>
              <span className="font-semibold text-slate-800">{profile.businessName || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Registered Email:</span>
              <span className="font-mono text-slate-800">{profile.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Phone:</span>
              <span className="font-mono text-slate-800">{profile.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Country & Region:</span>
              <span className="font-semibold text-slate-800">{profile.country || 'India'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">City / State:</span>
              <span className="font-semibold text-slate-800">
                {profile.city ? `${profile.city}, ${profile.state}` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Member Since:</span>
              <span className="text-slate-800">{new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Assigned Executive Form */}
          <div className="bg-white p-5  border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">Account Assignment</h3>
            <p className="text-slate-500">
              Assigned sales or support executive dedicated to this customer.
            </p>

            {isManagerOrAdmin ? (
              <form onSubmit={handleAssignStaff} className="space-y-3">
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full p-2  border border-slate-200 text-xs bg-white text-slate-800"
                >
                  <option value="">Unassigned</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={assignLoading}
                    className="px-4 py-2  bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition disabled:opacity-50"
                  >
                    {assignLoading ? 'Saving...' : 'Update Assignment'}
                  </button>
                  {assignSuccess && (
                    <span className="text-emerald-600 font-semibold text-xs">✓ Assignment saved!</span>
                  )}
                </div>
              </form>
            ) : (
              <div className="p-3 bg-slate-50  border border-slate-100 text-slate-700">
                Assigned Executive: <strong className="ml-1">{profile.assignedStaffName || 'Unassigned'}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Billing & Subscriptions History */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white  border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Plan Purchased</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No payment transactions recorded for this customer.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-medium">{p.order_id || p.id}</td>
                    <td className="py-3 px-4 capitalize font-semibold text-purple-700">{p.plan}</td>
                    <td className="py-3 px-4 capitalize text-slate-600">{p.validity}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{p.amount}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Discounts */}
      {activeTab === 'discounts' && (
        <div className="bg-white  border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Plan Scope</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Granted By</th>
                <th className="py-3 px-4">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No discounts assigned to this customer.
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-purple-700 text-sm">
                      {d.discount_value}% OFF
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{d.reason}</td>
                    <td className="py-3 px-4 capitalize text-slate-600">{d.applicable_plan}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5  uppercase ${
                        d.approval_status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {d.approval_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{d.createdByName || 'Staff'}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(d.expiry_date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Coupons Redeemed */}
      {activeTab === 'coupons' && (
        <div className="bg-white  border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Discount Applied</th>
                <th className="py-3 px-4">Redemption Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {couponRedemptions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">
                    No coupon codes redeemed by this customer yet.
                  </td>
                </tr>
              ) : (
                couponRedemptions.map((cr) => (
                  <tr key={cr.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{cr.code}</td>
                    <td className="py-3 px-4 text-slate-600">{cr.description}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{cr.discount_applied}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(cr.redeemed_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Support Tickets */}
      {activeTab === 'tickets' && (
        <div className="bg-white  border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Ticket Number</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No support tickets logged for this account.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{t.ticket_number}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{t.subject}</td>
                    <td className="py-3 px-4 capitalize text-slate-600">{t.category}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5  uppercase ${
                        t.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold">{t.status.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 6: Internal Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {/* Note Input Form */}
          <form onSubmit={handleAddNote} className="bg-white p-4  border border-slate-200 shadow-xs space-y-3">
            <label className="block text-xs font-bold text-slate-900">
              Add Staff Note (Internal Only)
            </label>
            <textarea
              rows="3"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Record call logs, customer preferences, retention context..."
              required
              className="w-full p-3  border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
            <button
              type="submit"
              disabled={noteLoading}
              className="px-4 py-2  bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition disabled:opacity-50"
            >
              {noteLoading ? 'Saving...' : 'Add Note'}
            </button>
          </form>

          {/* Notes Feed */}
          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No internal notes yet.</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="p-4  bg-white border border-slate-200 shadow-xs space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="font-semibold text-slate-800">{n.author_name}</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{n.note}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Grant / Request Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white  max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Assign Discount to Customer</h3>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {discountMessage && (
              <div className="p-3  bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                {discountMessage}
              </div>
            )}

            <form onSubmit={handleCreateDiscount} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  required
                  className="w-full p-2.5  border border-slate-200 text-sm font-semibold"
                />
                {isSales && Number(discountValue) <= 10 && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                    ✓ Within Sales Policy (≤10%): Activates instantly.
                  </p>
                )}
                {isSales && Number(discountValue) > 10 && Number(discountValue) <= 30 && (
                  <p className="text-[11px] text-amber-600 mt-1 font-medium">
                    ⓘ 11% - 30%: Will be submitted for Manager approval.
                  </p>
                )}
                {isSupport && (
                  <p className="text-[11px] text-sky-600 mt-1 font-medium">
                    ⓘ Support Requests: Will be routed to Manager for approval.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Plan Scope
                </label>
                <select
                  value={discountPlan}
                  onChange={(e) => setDiscountPlan(e.target.value)}
                  className="w-full p-2.5  border border-slate-200 bg-white"
                >
                  <option value="all">All Plans</option>
                  <option value="plus">Plus Plan Only</option>
                  <option value="pro">Pro Plan Only</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Justification / Reason (Audited)
                </label>
                <textarea
                  rows="2"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="e.g. Enterprise volume deal, renewal retention..."
                  required
                  className="w-full p-2.5  border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-3.5 py-2  border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={discountModalLoading}
                  className="px-4 py-2  bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  {discountModalLoading ? 'Processing...' : 'Submit Discount'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white  max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Customer Profile</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{id}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-3 text-xs">
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
                <label className="block font-semibold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={editBusinessName}
                  onChange={(e) => setEditBusinessName(e.target.value)}
                  className="w-full p-2.5  border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full p-2.5  border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    placeholder="India"
                    className="w-full p-2.5  border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
              </div>

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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-2  border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2  bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal (Admin only) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white  max-w-sm w-full p-6 shadow-xl border border-red-100 space-y-4">
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
              <strong className="text-slate-900">{profile.fullName}</strong> ({profile.email})?
              All associated invoices, support tickets, and discount records will be permanently removed.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
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
