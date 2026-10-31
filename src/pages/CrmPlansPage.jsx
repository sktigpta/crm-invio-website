import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { useCrmToast } from '../context/CrmToastContext';
import { CheckCircleIcon, RefreshCwIcon, AlertCircleIcon } from '../components/CrmIcons';
import { PricingCardSkeleton } from '../components/common/Skeleton';

const FALLBACK_PLANS = [
  {
    id: 'free',
    name: 'Free Starter',
    price: 0,
    priceYearly: 0,
    priceMonthly: 0,
    interval: 'Lifetime',
    badge: 'Default Tier',
    popular: false,
    description: 'Essential billing for retail shops and local merchants.',
    features: [
      'Core Offline Invoicing & Local SQLite Storage',
      'Standard A4 and 80mm Thermal Receipt Formats',
      'Up to 100 Products and 50 Invoices/month',
      'Standard UPI Dynamic QR Payment Codes',
      'Community Support via Docs & FAQ',
    ],
    limits: '50 invoices/mo, 100 items',
  },
  {
    id: 'plus',
    name: 'Plus Professional',
    price: 999,
    priceYearly: 999,
    priceMonthly: 149,
    interval: '/ year',
    badge: 'Most Popular',
    popular: true,
    description: 'Advanced retail operations with multi-device barcode scanning and inventory tracking.',
    features: [
      'Everything in Free Plan',
      'Unlimited Invoices, Products & Customers',
      'Barcode Scanner & Bluetooth Thermal Printer Support',
      'Detailed GST HSN/SAC Tax Reporting',
      'Automated Email & WhatsApp Delivery Integration',
      'Priority Email & Ticket Support (24h SLA)',
    ],
    limits: 'Unlimited invoices & catalog',
  },
  {
    id: 'pro',
    name: 'Pro Enterprise',
    price: 4999,
    priceYearly: 4999,
    priceMonthly: 499,
    interval: '/ year',
    badge: 'Enterprise',
    popular: false,
    description: 'Multi-store analytics, custom branding, and dedicated staff management.',
    features: [
      'Everything in Plus Plan',
      'Custom White-Label Invoice Templates & Brand Signatures',
      'Comprehensive Profit & Loss, Tax Audit Exports',
      'Advanced Multi-Store Role Delegation',
      'Dedicated Account Manager & 2-Hour SLA Support',
    ],
    limits: 'Unlimited everything, Multi-device',
  },
];

function toNumberPrice(v) {
  if (typeof v === 'number') return v;
  if (v == null) return 0;
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function formatPrice(v) {
  const n = toNumberPrice(v);
  return `₹${n.toLocaleString('en-IN')}`;
}

// Accept backend shapes: array | { plans } | { data } | { items }
function normalizePlans(raw) {
  const list = Array.isArray(raw)
    ? raw
    : raw?.plans || raw?.data || raw?.items || [];
  if (!Array.isArray(list) || !list.length) return null;
  return list.map((r, idx) => {
    const fb = FALLBACK_PLANS[idx] || FALLBACK_PLANS[0];
    const featuresRaw = r.features ?? r.includedFeatures ?? r.included_features ?? fb.features;
    const features = Array.isArray(featuresRaw)
      ? featuresRaw.map(String)
      : typeof featuresRaw === 'string'
        ? featuresRaw.split('\n').map((s) => s.trim()).filter(Boolean)
        : [...fb.features];
    const key = String(r.id ?? r.planId ?? r.plan_id ?? r.code ?? fb.id).toLowerCase();
    const defaultMonthly = key === 'plus' ? 149 : key === 'pro' ? 499 : 0;
    const defaultYearly = key === 'plus' ? 999 : key === 'pro' ? 4999 : 0;
    const priceYearly = toNumberPrice(r.prices?.yearly ?? r.price_yearly ?? r.yearlyPrice ?? r.price ?? r.amount ?? r.priceInr ?? fb.priceYearly ?? defaultYearly);
    const priceMonthly = toNumberPrice(r.prices?.monthly ?? r.price_monthly ?? r.monthlyPrice ?? r.priceMonthly ?? fb.priceMonthly ?? defaultMonthly);
    return {
      _raw: r,
      id: key,
      name: r.name ?? r.title ?? r.planName ?? fb.name,
      price: priceYearly,
      priceYearly,
      priceMonthly,
      interval: r.interval ?? r.validity ?? r.billingInterval ?? r.duration ?? fb.interval,
      badge: r.badge ?? r.tag ?? r.label ?? fb.badge,
      popular: Boolean(r.popular ?? r.isPopular ?? r.is_popular ?? r.highlighted ?? fb.popular),
      description: r.description ?? r.desc ?? fb.description,
      features,
      limits: r.limits ?? r.entitlement ?? r.featureLimits ?? r.limitsText ?? fb.limits,
      active: r.active ?? r.isActive ?? r.is_active ?? r.status !== 'inactive',
      subscribers: r.subscribers ?? r.subscriberCount ?? r.totalCustomers ?? null,
      updatedAt: r.updatedAt ?? r.updated_at ?? null,
    };
  });
}

export function CrmPlansPage() {
  const { isAdmin } = useCrmAuth();
  const { toast } = useCrmToast();
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingLive, setUsingLive] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  // Edit modal (admin only)
  const [editing, setEditing] = useState(null);
  const [fName, setFName] = useState('');
  const [fPriceYearly, setFPriceYearly] = useState(0);
  const [fPriceMonthly, setFPriceMonthly] = useState(0);
  const [fInterval, setFInterval] = useState('/ year');
  const [fBadge, setFBadge] = useState('');
  const [fDescription, setFDescription] = useState('');
  const [fFeatures, setFFeatures] = useState('');
  const [fLimits, setFLimits] = useState('');
  const [fPopular, setFPopular] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmApi.getPlans();
      const normalized = normalizePlans(res);
      if (normalized) {
        setPlans(normalized);
        setUsingLive(true);
        setLastSynced(new Date());
      } else {
        throw new Error('Plans API returned an empty catalog.');
      }
    } catch (err) {
      const msg = err.message || 'Failed to load live plan catalog.';
      setError(msg);
      // Keep fallback visible so page never goes blank, but flag it
      setUsingLive(false);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  function openEdit(plan) {
    if (!isAdmin) {
      toast.warning('Only admins can change pricing.');
      return;
    }
    setEditing(plan);
    setFName(plan.name || '');
    setFPriceYearly(toNumberPrice(plan.priceYearly ?? plan.price));
    setFPriceMonthly(toNumberPrice(plan.priceMonthly ?? (plan.id === 'plus' ? 149 : plan.id === 'pro' ? 499 : 0)));
    setFInterval(plan.interval || '/ year');
    setFBadge(plan.badge || '');
    setFDescription(plan.description || '');
    setFFeatures((plan.features || []).join('\n'));
    setFLimits(plan.limits || '');
    setFPopular(Boolean(plan.popular));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!editing || !isAdmin) return;
    setSaving(true);
    try {
      const features = fFeatures.split('\n').map((s) => s.trim()).filter(Boolean);
      const priceYearly = Number(fPriceYearly) || 0;
      const priceMonthly = Number(fPriceMonthly) || 0;
      // Send aliases to match any backend field naming
      const payload = {
        name: fName,
        price: priceYearly,
        amount: priceYearly,
        priceInr: priceYearly,
        price_yearly: priceYearly,
        yearlyPrice: priceYearly,
        price_monthly: priceMonthly,
        monthlyPrice: priceMonthly,
        priceMonthly: priceMonthly,
        interval: fInterval,
        validity: fInterval,
        badge: fBadge,
        description: fDescription,
        features,
        includedFeatures: features,
        limits: fLimits,
        entitlement: fLimits,
        popular: fPopular,
        isPopular: fPopular,
      };
      await crmApi.updatePlan(editing.id, payload);
      setEditing(null);
      toast.success(`Plan "${fName}" pricing updated.`);
      fetchPlans();
    } catch (err) {
      toast.error(err.message || 'Failed to update plan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Subscription Plans & Entitlements</h2>
          <p className="text-xs text-slate-500">
            {usingLive ? (
              <>Live catalog from API <span className="font-mono">GET /api/crm/plans</span>{lastSynced && <> · synced {lastSynced.toLocaleTimeString()}</>}</>
            ) : (
              <>Authoritative plan catalog definitions, monetisation intervals, and feature limits.</>
            )}
            {!isAdmin && <span className="text-amber-600 font-semibold"> (Read-only — only admins can change pricing)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-1 uppercase ${usingLive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
            {loading ? 'Syncing…' : usingLive ? '● Live data' : '○ Fallback data'}
          </span>
          <button
            onClick={fetchPlans}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition disabled:opacity-50 cursor-pointer"
            title="Reload live pricing"
          >
            <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircleIcon className="size-4 text-red-500 flex-shrink-0" />
          <span>{error} Showing fallback catalog.</span>
        </div>
      )}

      {/* Plans Grid — real data */}
      {loading && !plans.length ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading plans">
          <PricingCardSkeleton />
          <PricingCardSkeleton isFeatured={true} />
          <PricingCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white p-6 border transition flex flex-col justify-between shadow-xs ${
                plan.popular ? 'border-purple-300 ring-2 ring-purple-600/10' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="font-bold text-base text-slate-900">{plan.name}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border whitespace-nowrap ${
                    plan.popular ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {plan.badge}
                  </span>
                </div>

                <div className="my-3 space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">{formatPrice(plan.priceYearly ?? plan.price)}</span>
                    <span className="text-xs text-slate-500">/ year</span>
                  </div>
                  {plan.id !== 'free' && (
                    <div className="text-xs font-semibold text-purple-700">
                      {formatPrice(plan.priceMonthly ?? (plan.id === 'plus' ? 149 : 499))}
                      <span className="text-[11px] font-normal text-slate-500"> / month</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 mb-4">{plan.description}</p>

                <div className="border-t border-slate-100 pt-4 space-y-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Included Features</p>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircleIcon className="size-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <div className="text-[11px] text-slate-500 font-mono">
                  Entitlement: {plan.limits}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>ID: {plan.id}</span>
                  {plan.subscribers != null && <span>{plan.subscribers} subs</span>}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => openEdit(plan)}
                    className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-sm transition cursor-pointer"
                  >
                    Edit Pricing & Features
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal — admins only */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white max-w-lg w-full p-4 shadow-xl border border-slate-200 space-y-2.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Edit Plan — {editing.id}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Changes apply to live pricing immediately.</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1">Plan Name *</label>
                  <input type="text" value={fName} onChange={(e) => setFName(e.target.value)} required className="w-full p-2.5 border border-slate-200 focus:outline-none focus:border-purple-600" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1">Badge / Tag</label>
                  <input type="text" value={fBadge} onChange={(e) => setFBadge(e.target.value)} placeholder="Most Popular" className="w-full p-2.5 border border-slate-200 focus:outline-none focus:border-purple-600" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Yearly Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={fPriceYearly}
                    onChange={(e) => setFPriceYearly(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 font-bold focus:outline-none focus:border-purple-600"
                    placeholder="e.g. 999"
                  />
                  <span className="text-[10px] text-slate-400">Billed annually</span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={fPriceMonthly}
                    onChange={(e) => setFPriceMonthly(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 font-bold focus:outline-none focus:border-purple-600"
                    placeholder="e.g. 149"
                  />
                  <span className="text-[10px] text-slate-400">Billed monthly</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Interval Display</label>
                <select value={fInterval} onChange={(e) => setFInterval(e.target.value)} className="w-full p-2.5 border border-slate-200 bg-white focus:outline-none focus:border-purple-600">
                  <option value="/ year">/ year</option>
                  <option value="/ month">/ month</option>
                  <option value="Lifetime">Lifetime</option>
                  <option value="/ quarter">/ quarter</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea rows="2" value={fDescription} onChange={(e) => setFDescription(e.target.value)} className="w-full p-2.5 border border-slate-200 focus:outline-none focus:border-purple-600" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Features (one per line)</label>
                <textarea rows="6" value={fFeatures} onChange={(e) => setFFeatures(e.target.value)} className="w-full p-2.5 border border-slate-200 font-mono text-[11px] focus:outline-none focus:border-purple-600" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Entitlement / Limits</label>
                <input type="text" value={fLimits} onChange={(e) => setFLimits(e.target.value)} placeholder="e.g. Unlimited invoices & catalog" className="w-full p-2.5 border border-slate-200 focus:outline-none focus:border-purple-600" />
              </div>

              <label className="flex items-center gap-2 select-none cursor-pointer">
                <input type="checkbox" checked={fPopular} onChange={(e) => setFPopular(e.target.checked)} className="text-purple-600" />
                <span className="font-semibold text-slate-700">Mark as popular / highlighted</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditing(null)} className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer">
                  {saving ? 'Saving…' : 'Save Live Pricing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
