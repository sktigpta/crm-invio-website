import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { useCrmToast } from '../context/CrmToastContext';
import { RefreshCwIcon, AlertCircleIcon, PlusIcon } from '../components/CrmIcons';

export function CrmCouponsPage() {
  const { isManagerOrAdmin } = useCrmAuth();
  const { toast } = useCrmToast();
  const [coupons, setCoupons] = useState([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Coupon Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCode, setCreateCode] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createType, setCreateType] = useState('percentage');
  const [createValue, setCreateValue] = useState(15);
  const [createMinPurchase, setCreateMinPurchase] = useState(0);
  const [createPlan, setCreatePlan] = useState('all');
  const [createRegion, setCreateRegion] = useState('all');
  const [createMaxRedemptions, setCreateMaxRedemptions] = useState('');
  const [createPerCustomer, setCreatePerCustomer] = useState(1);
  const [createFirstTimeOnly, setCreateFirstTimeOnly] = useState(false);
  const [createExpiryDays, setCreateExpiryDays] = useState(30);
  const [createLoading, setCreateLoading] = useState(false);

  // Live Coupon Validator Sandbox
  const [testCode, setTestCode] = useState('');
  const [testAmount, setTestAmount] = useState(1000);
  const [testPlan, setTestPlan] = useState('plus');
  const [testRegion, setTestRegion] = useState('all');
  const [validationResult, setValidationResult] = useState(null);
  const [validationLoading, setValidationLoading] = useState(false);

  // Edit + Delete state
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [editCode, setEditCode] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState('percentage');
  const [editValue, setEditValue] = useState(10);
  const [editMinPurchase, setEditMinPurchase] = useState(0);
  const [editPlan, setEditPlan] = useState('all');
  const [editRegion, setEditRegion] = useState('all');
  const [editMaxRedemptions, setEditMaxRedemptions] = useState('');
  const [editPerCustomer, setEditPerCustomer] = useState(1);
  const [editFirstTimeOnly, setEditFirstTimeOnly] = useState(false);
  const [editStatus, setEditStatus] = useState('active');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getCoupons({ status, search });
      setCoupons(res.coupons || []);
    } catch (err) {
      const msg = err.message || 'Failed to fetch coupons.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [status, search, toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  async function handleToggleStatus(coupon) {
    if (!isManagerOrAdmin) {
      toast.warning('Only managers or admins can change coupon status.');
      return;
    }
    const nextStatus = coupon.status === 'active' ? 'revoked' : 'active';
    try {
      await crmApi.updateCouponStatus(coupon.id, nextStatus);
      toast.success(`Coupon ${coupon.code} ${nextStatus === 'active' ? 'activated' : 'deactivated'}.`);
      fetchCoupons();
    } catch (err) {
      toast.error(err.message || 'Failed to update coupon status.');
    }
  }

  function openEditModal(c) {
    setEditingCoupon(c);
    setEditCode(c.code || '');
    setEditDesc(c.description || '');
    setEditType(c.discountType || 'percentage');
    setEditValue(c.discountValue !== undefined && c.discountValue !== null ? Number(c.discountValue) : 10);
    setEditMinPurchase(c.minPurchaseAmount !== undefined && c.minPurchaseAmount !== null ? Number(c.minPurchaseAmount) : 0);
    setEditPlan(c.applicablePlan || 'all');
    setEditRegion(c.applicableRegion || 'all');
    setEditMaxRedemptions(c.maxTotalRedemptions ? String(c.maxTotalRedemptions) : '');
    setEditPerCustomer(c.perCustomerLimit ? Number(c.perCustomerLimit) : 1);
    setEditFirstTimeOnly(Boolean(c.firstTimeOnly));
    setEditStatus(c.status || 'active');
    if (c.expiryDate) {
      try {
        setEditExpiryDate(new Date(c.expiryDate).toISOString().split('T')[0]);
      } catch {
        setEditExpiryDate('');
      }
    } else {
      setEditExpiryDate('');
    }
  }

  async function handleUpdateCoupon(e) {
    e.preventDefault();
    if (!editingCoupon) return;
    setEditLoading(true);
    try {
      const payload = {
        code: editCode.trim().toUpperCase(),
        description: editDesc.trim(),
        discountType: editType,
        discountValue: Number(editValue),
        minPurchaseAmount: Number(editMinPurchase) || 0,
        applicablePlan: editPlan,
        applicableRegion: editRegion,
        maxTotalRedemptions: editMaxRedemptions ? Number(editMaxRedemptions) : null,
        perCustomerLimit: Number(editPerCustomer) || 1,
        firstTimeOnly: editFirstTimeOnly,
        status: editStatus,
        expiryDate: editExpiryDate ? new Date(`${editExpiryDate}T23:59:59Z`).toISOString() : null,
      };

      await crmApi.updateCoupon(editingCoupon.id, payload);
      setEditingCoupon(null);
      toast.success(`Coupon ${payload.code} updated successfully.`);
      await fetchCoupons();
    } catch (err) {
      toast.error(err.message || 'Failed to update coupon.');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteCoupon() {
    if (!deletingCoupon) return;
    setDeleteLoading(true);
    try {
      await crmApi.deleteCoupon(deletingCoupon.id);
      setDeletingCoupon(null);
      toast.success(`Coupon ${deletingCoupon.code} deleted permanently.`);
      fetchCoupons();
    } catch (err) {
      toast.error(err.message || 'Failed to delete coupon.');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleCreateCoupon(e) {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + Number(createExpiryDays));

      await crmApi.createCoupon({
        code: createCode,
        description: createDesc,
        discountType: createType,
        discountValue: Number(createValue),
        minPurchaseAmount: Number(createMinPurchase) || 0,
        applicablePlan: createPlan,
        applicableRegion: createRegion,
        maxTotalRedemptions: createMaxRedemptions ? Number(createMaxRedemptions) : null,
        perCustomerLimit: Number(createPerCustomer) || 1,
        firstTimeOnly: createFirstTimeOnly,
        expiryDate: expiry.toISOString(),
      });

      setShowCreateModal(false);
      setCreateCode('');
      setCreateDesc('');
      toast.success(`Coupon ${createCode.toUpperCase()} created & published.`);
      fetchCoupons();
    } catch (err) {
      toast.error(err.message || 'Failed to create coupon.');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleTestValidation(e) {
    e.preventDefault();
    if (!testCode.trim()) return;
    setValidationLoading(true);
    setValidationResult(null);
    try {
      const res = await crmApi.validateCoupon({
        code: testCode,
        orderAmount: Number(testAmount),
        plan: testPlan,
        region: testRegion,
      });
      setValidationResult(res);
    } catch (err) {
      setValidationResult({ valid: false, message: err.message });
    } finally {
      setValidationLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Coupon Administration</h2>
          <p className="text-xs text-slate-500">
            Global, regional, and plan-specific discount vouchers with server-side validation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isManagerOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2  bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <PlusIcon className="size-4" />
              <span>Create Coupon</span>
            </button>
          )}
          <button
            onClick={fetchCoupons}
            disabled={loading}
            className="p-2  bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
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

      {/* Live Coupon Testing Sandbox */}
      <div className="bg-white p-5  border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Authoritative Server-Side Validation Sandbox
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Backend Engine (/coupons/validate)</span>
        </div>

        <form onSubmit={handleTestValidation} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Coupon Code</label>
            <input
              type="text"
              placeholder="e.g. WELCOME10"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              required
              className="w-full p-2  border border-slate-200 uppercase font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Order Amount (₹)</label>
            <input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              className="w-full p-2  border border-slate-200 font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Plan</label>
            <select
              value={testPlan}
              onChange={(e) => setTestPlan(e.target.value)}
              className="w-full p-2  border border-slate-200 bg-white"
            >
              <option value="plus">Plus Plan</option>
              <option value="pro">Pro Plan</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={validationLoading}
              className="w-full py-2 px-3  bg-slate-900 hover:bg-slate-800 text-white font-semibold transition"
            >
              {validationLoading ? 'Validating...' : 'Test Eligibility →'}
            </button>
          </div>
        </form>

        {validationResult && (
          <div className={`p-3  text-xs font-medium border ${
            validationResult.valid
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <span>{validationResult.message}</span>
              {validationResult.valid && (
                <span className="font-bold">
                  Discount: ₹{validationResult.discountAmount} | Payable: ₹{validationResult.finalAmount}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Coupons Table */}
      <div className="bg-white  border border-slate-200 shadow-xs overflow-hidden">
        <div className="crm-table-wrap overflow-x-auto">
          <table className="crm-table text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-1.5 px-3">Coupon Code</th>
                <th className="py-1.5 px-3">Discount</th>
                <th className="py-1.5 px-3">Eligibility & Scope</th>
                <th className="py-1.5 px-3">Redemptions</th>
                <th className="py-1.5 px-3">Status</th>
                <th className="py-1.5 px-3">Expires</th>
                {isManagerOrAdmin && <th className="py-1.5 px-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="size-6 border-2 border-slate-200 border-t-purple-600  animate-spin mx-auto mb-2" />
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No coupon codes registered.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-1.5 px-3">
                      <div className="font-mono font-bold text-purple-700 text-sm">{c.code}</div>
                      <div className="text-[11px] text-slate-500 whitespace-nowrap">{c.description}</div>
                    </td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">
                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    </td>
                    <td className="py-1.5 px-3 text-slate-600 text-[11px]">
                      <div>Plan: <span className="font-semibold capitalize">{c.applicablePlan}</span></div>
                      <div>Region: <span className="font-semibold uppercase">{c.applicableRegion}</span></div>
                      {c.minPurchaseAmount > 0 && <div>Min: ₹{c.minPurchaseAmount}</div>}
                    </td>
                    <td className="py-1.5 px-3">
                      <span className="font-bold text-slate-900">{c.timesRedeemed}</span>
                      <span className="text-slate-400 text-[10px]">
                        {' '}/ {c.maxTotalRedemptions ? c.maxTotalRedemptions : '∞'}
                      </span>
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                        c.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-500">
                      {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'Never'}
                    </td>
                    {isManagerOrAdmin && (
                      <td className="py-1.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(c)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-sm transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className={`px-3 py-1 text-xs font-semibold rounded-sm transition cursor-pointer ${
                              c.status === 'active'
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {c.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setDeletingCoupon(c)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-sm transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white  max-w-lg w-full p-4 shadow-xl border border-slate-200 space-y-2.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Create New Coupon Code</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    placeholder="SUMMER25"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                    required
                    className="w-full p-2.5  border border-slate-200 uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={createType}
                    onChange={(e) => setCreateType(e.target.value)}
                    className="w-full p-2.5  border border-slate-200 bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discount Value *</label>
                <input
                  type="number"
                  min="1"
                  max={createType === 'percentage' ? 100 : 100000}
                  value={createValue}
                  onChange={(e) => setCreateValue(e.target.value)}
                  required
                  className="w-full p-2.5  border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Campaign Label</label>
                <input
                  type="text"
                  placeholder="e.g. 15% discount for festival campaign"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full p-2.5  border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applicable Plan</label>
                  <select
                    value={createPlan}
                    onChange={(e) => setCreatePlan(e.target.value)}
                    className="w-full p-2.5  border border-slate-200 bg-white"
                  >
                    <option value="all">All Plans</option>
                    <option value="plus">Plus Plan</option>
                    <option value="pro">Pro Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applicable Region</label>
                  <select
                    value={createRegion}
                    onChange={(e) => setCreateRegion(e.target.value)}
                    className="w-full p-2.5  border border-slate-200 bg-white"
                  >
                    <option value="all">Global (All Regions)</option>
                    <option value="IN">India (IN)</option>
                    <option value="US">United States (US)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={createMinPurchase}
                    onChange={(e) => setCreateMinPurchase(e.target.value)}
                    className="w-full p-2.5  border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={createExpiryDays}
                    onChange={(e) => setCreateExpiryDays(e.target.value)}
                    className="w-full p-2.5  border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="first-time-only"
                  checked={createFirstTimeOnly}
                  onChange={(e) => setCreateFirstTimeOnly(e.target.checked)}
                  className=" border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="first-time-only" className="text-slate-700 select-none">
                  Exclusively for first-time customers
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? 'Creating...' : 'Create & Publish Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Coupon Modal */}
      {editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white max-w-lg w-full p-4 shadow-xl border border-slate-200 space-y-2.5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Update Coupon</h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">{editingCoupon.code}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCoupon} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    required
                    className="w-full p-2.5 border border-slate-200 uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    min="1"
                    max={editType === 'percentage' ? 100 : 100000}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editMinPurchase}
                    onChange={(e) => setEditMinPurchase(e.target.value)}
                    className="w-full p-2.5 border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Campaign Label</label>
                <input
                  type="text"
                  placeholder="e.g. 15% discount for festival campaign"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applicable Plan</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white"
                  >
                    <option value="all">All Plans</option>
                    <option value="plus">Plus Plan</option>
                    <option value="pro">Pro Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applicable Region</label>
                  <select
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white"
                  >
                    <option value="all">Global (All Regions)</option>
                    <option value="IN">India (IN)</option>
                    <option value="US">United States (US)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Total Uses</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={editMaxRedemptions}
                    onChange={(e) => setEditMaxRedemptions(e.target.value)}
                    className="w-full p-2.5 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Per-User Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={editPerCustomer}
                    onChange={(e) => setEditPerCustomer(e.target.value)}
                    className="w-full p-2.5 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white font-semibold"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="editFirstTimeOnly"
                    checked={editFirstTimeOnly}
                    onChange={(e) => setEditFirstTimeOnly(e.target.checked)}
                    className="size-4 text-purple-600 rounded border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="editFirstTimeOnly" className="text-slate-700 font-medium cursor-pointer">
                    First-Time Customers Only
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Coupon Confirm */}
      {deletingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white max-w-sm w-full p-4 shadow-xl border border-red-100 space-y-2.5">
            <h3 className="font-bold text-slate-900 text-sm">Delete Coupon {deletingCoupon.code}?</h3>
            <p className="text-xs text-slate-600">This permanently removes the voucher. Redemptions history is preserved in audit logs.</p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button type="button" onClick={() => setDeletingCoupon(null)} className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer">Cancel</button>
              <button type="button" onClick={handleDeleteCoupon} disabled={deleteLoading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer">{deleteLoading ? 'Deleting...' : 'Delete Permanently'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
