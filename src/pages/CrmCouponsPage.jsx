import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { TagIcon, RefreshCwIcon, AlertCircleIcon, PlusIcon, SearchIcon } from '../components/CrmIcons';

export function CrmCouponsPage() {
  const { isManagerOrAdmin } = useCrmAuth();
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

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getCoupons({ status, search });
      setCoupons(res.coupons || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch coupons.');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  async function handleToggleStatus(coupon) {
    if (!isManagerOrAdmin) return;
    const nextStatus = coupon.status === 'active' ? 'revoked' : 'active';
    try {
      await crmApi.updateCouponStatus(coupon.id, nextStatus);
      fetchCoupons();
    } catch (err) {
      alert(err.message || 'Failed to update coupon status.');
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
      fetchCoupons();
    } catch (err) {
      alert(err.message || 'Failed to create coupon.');
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
    <div className="space-y-6">
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
              className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <PlusIcon className="size-4" />
              <span>Create Coupon</span>
            </button>
          )}
          <button
            onClick={fetchCoupons}
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

      {/* Live Coupon Testing Sandbox */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
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
              className="w-full p-2 rounded-lg border border-slate-200 uppercase font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Order Amount (₹)</label>
            <input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Plan</label>
            <select
              value={testPlan}
              onChange={(e) => setTestPlan(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white"
            >
              <option value="plus">Plus Plan</option>
              <option value="pro">Pro Plan</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={validationLoading}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition"
            >
              {validationLoading ? 'Validating...' : 'Test Eligibility →'}
            </button>
          </div>
        </form>

        {validationResult && (
          <div className={`p-3 rounded-lg text-xs font-medium border ${
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Eligibility & Scope</th>
                <th className="py-3 px-4">Redemptions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expires</th>
                {isManagerOrAdmin && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="size-6 border-2 border-slate-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-2" />
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
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-purple-700 text-sm">{c.code}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{c.description}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      <div>Plan: <span className="font-semibold capitalize">{c.applicablePlan}</span></div>
                      <div>Region: <span className="font-semibold uppercase">{c.applicableRegion}</span></div>
                      {c.minPurchaseAmount > 0 && <div>Min: ₹{c.minPurchaseAmount}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{c.timesRedeemed}</span>
                      <span className="text-slate-400 text-[10px]">
                        {' '}/ {c.maxTotalRedemptions ? c.maxTotalRedemptions : '∞'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        c.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'Never'}
                    </td>
                    {isManagerOrAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                            c.status === 'active'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                          }`}
                        >
                          {c.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
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
                    className="w-full p-2.5 rounded-lg border border-slate-200 uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={createType}
                    onChange={(e) => setCreateType(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
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
                  className="w-full p-2.5 rounded-lg border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Campaign Label</label>
                <input
                  type="text"
                  placeholder="e.g. 15% discount for festival campaign"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applicable Plan</label>
                  <select
                    value={createPlan}
                    onChange={(e) => setCreatePlan(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
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
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
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
                    className="w-full p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={createExpiryDays}
                    onChange={(e) => setCreateExpiryDays(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="first-time-only"
                  checked={createFirstTimeOnly}
                  onChange={(e) => setCreateFirstTimeOnly(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="first-time-only" className="text-slate-700 select-none">
                  Exclusively for first-time customers
                </label>
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
                  {createLoading ? 'Creating...' : 'Create & Publish Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
