import { LayersIcon, CheckCircleIcon } from '../components/CrmIcons';

const planDefinitions = [
  {
    id: 'free',
    name: 'Free Starter',
    price: '₹0',
    interval: 'Lifetime',
    badge: 'Default Tier',
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
    price: '₹999',
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
    price: '₹2,499',
    interval: '/ year',
    badge: 'Enterprise',
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

export function CrmPlansPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Subscription Plans & Entitlements</h2>
        <p className="text-xs text-slate-500">
          Authoritative plan catalog definitions, monetisation intervals, and feature limits.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planDefinitions.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl p-6 border transition flex flex-col justify-between shadow-xs ${
              plan.popular ? 'border-purple-300 ring-2 ring-purple-600/10' : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-base text-slate-900">{plan.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  plan.popular ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {plan.badge}
                </span>
              </div>

              <div className="flex items-baseline gap-1 my-3">
                <span className="text-2xl font-black text-slate-900">{plan.price}</span>
                <span className="text-xs text-slate-500">{plan.interval}</span>
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

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
              Entitlement: {plan.limits}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
