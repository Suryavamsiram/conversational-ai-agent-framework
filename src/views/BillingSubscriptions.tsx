import { useState } from 'react';
import { useApp } from '../state/AppContext';
import type { BillingPlan, SubscriptionTier } from '../types';
import { Check, X, Crown, Zap, Code as Code2, CreditCard, Shield, Receipt, TrendingUp, Clock } from 'lucide-react';

const PLANS: BillingPlan[] = [
  {
    id: 'developer',
    name: 'Developer',
    price: 0,
    voiceMinutes: 100,
    overageRate: 0.15,
    features: [
      '100 voice minutes / month',
      'Gemini 2.5 Flash execution only',
      'Community support',
      'Basic telemetry dashboard',
    ],
    constraints: [
      'Gemini 3.1 Pro access locked',
      'Custom API key generation locked',
      'No dedicated latency channels',
    ],
    ctaLabel: 'Current Plan',
    highlighted: false,
  },
  {
    id: 'scale',
    name: 'Scale Business',
    price: 149,
    voiceMinutes: 2500,
    overageRate: 0.08,
    features: [
      '2,500 voice minutes / month',
      'Full Gemini 3.1 Pro Preview access',
      'Dedicated P50 sub-1.5s latency routing',
      'Custom organization API keys',
      'Priority support',
      'Advanced analytics & telemetry',
    ],
    ctaLabel: 'Upgrade to Scale',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 899,
    voiceMinutes: Infinity,
    overageRate: 0,
    features: [
      'Uncapped voice minutes',
      'Custom SLA contracts',
      'Dedicated cluster concurrency',
      'Premium multi-role RBAC',
      'Dedicated support engineer',
      'Custom inference routing',
      'SSO & SAML integration',
    ],
    ctaLabel: 'Contact Sales',
    highlighted: false,
  },
];

function CheckoutModal({ plan, onClose }: { plan: BillingPlan; onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setTimeout(() => setStep('success'), 1800);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        {step === 'form' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-100">Subscribe to {plan.name}</h3>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/40">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold text-emerald-400">${plan.price}</span>
                <span className="text-sm text-slate-500">/month</span>
              </div>
              <p className="text-xs text-slate-400">
                {plan.voiceMinutes === Infinity ? 'Unlimited voice minutes' : `${plan.voiceMinutes.toLocaleString()} voice minutes included`}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Card Number</label>
                <input type="text" placeholder="4242 4242 4242 4242"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Expiry</label>
                  <input type="text" placeholder="12/27"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">CVC</label>
                  <input type="text" placeholder="123"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm" />
                </div>
              </div>
              <button type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-all text-sm">
                <CreditCard className="w-4 h-4" /> Pay ${plan.price}/month
              </button>
            </form>
          </>
        )}
        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Processing payment...</p>
          </div>
        )}
        {step === 'success' && (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-100">Subscription Activated</p>
              <p className="text-sm text-slate-400 mt-1">Your {plan.name} plan is now active.</p>
            </div>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-sm border border-slate-700/50">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BillingSubscriptions() {
  const { auth, invoices, tokenUsageTotal, estimatedCostUsd } = useApp();
  const [checkoutPlan, setCheckoutPlan] = useState<BillingPlan | null>(null);
  const [showInvoices, setShowInvoices] = useState(false);
  const currentTier = auth.currentOrg?.tier || 'developer';

  const planIcons: Record<SubscriptionTier, React.ElementType> = {
    developer: Code2,
    scale: Zap,
    enterprise: Crown,
  };

  const totalSpend = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidSpend = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
  const pendingSpend = invoices.filter(i => i.status === 'pending').reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-100 mb-1">Billing & Hybrid Subscriptions</h1>
          <p className="text-sm text-slate-500">Manage your organization's subscription plan and monitor usage</p>
        </div>

        {/* Current plan indicator */}
        <div className="mb-6 p-4 bg-slate-900/60 border border-slate-700/40 rounded-xl flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-400" />
          <div className="flex-1">
            <span className="text-sm text-slate-400">Current plan: </span>
            <span className="text-sm font-semibold text-emerald-400 capitalize">{currentTier}</span>
          </div>
        </div>

        {/* Usage Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Spend</span>
            </div>
            <div className="text-2xl font-bold text-slate-100 font-mono">${totalSpend.toFixed(2)}</div>
            <div className="text-xs text-slate-500 mt-1">${paidSpend.toFixed(2)} paid / ${pendingSpend.toFixed(2)} pending</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Token Usage</span>
            </div>
            <div className="text-2xl font-bold text-slate-100 font-mono">{(tokenUsageTotal / 1000).toFixed(0)}K</div>
            <div className="text-xs text-slate-500 mt-1">est. ${estimatedCostUsd.toFixed(2)} cost</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Billing Period</span>
            </div>
            <div className="text-2xl font-bold text-slate-100">Jun 2026</div>
            <div className="text-xs text-slate-500 mt-1">Resets Jul 1, 2026</div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          {PLANS.map(plan => {
            const PlanIcon = planIcons[plan.id];
            const isCurrent = plan.id === currentTier;
            return (
              <div key={plan.id}
                className={`relative rounded-xl border p-6 transition-all duration-200 ${
                  plan.highlighted ? 'bg-slate-900/80 border-emerald-500/40 shadow-lg shadow-emerald-500/5' : 'bg-slate-900/40 border-slate-700/40'
                }`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-emerald-600/20">Most Popular</div>
                )}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    plan.highlighted ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-slate-800 border border-slate-700/50'
                  }`}>
                    <PlanIcon className={`w-4 h-4 ${plan.highlighted ? 'text-emerald-400' : 'text-slate-400'}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-bold text-slate-100">${plan.price}</span>
                  <span className="text-sm text-slate-500">/month</span>
                </div>
                <div className="space-y-2.5 mb-6">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-300">{feat}</span>
                    </div>
                  ))}
                  {plan.constraints?.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <X className="w-4 h-4 text-red-500/60 mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-500">{c}</span>
                    </div>
                  ))}
                </div>
                {plan.voiceMinutes !== Infinity && (
                  <p className="text-xs text-slate-600 mb-4">${plan.overageRate.toFixed(2)} / min overage after {plan.voiceMinutes.toLocaleString()} minutes</p>
                )}
                <button onClick={() => !isCurrent && setCheckoutPlan(plan)} disabled={isCurrent}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isCurrent ? 'bg-slate-800 text-slate-600 cursor-default border border-slate-700/30'
                    : plan.highlighted ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
                  }`}>
                  {isCurrent ? 'Current Plan' : plan.ctaLabel}
                </button>
              </div>
            );
          })}
        </div>

        {/* Historical Invoices */}
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-200">Invoices</span>
            </div>
            <button onClick={() => setShowInvoices(!showInvoices)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              {showInvoices ? 'Hide' : 'Show All'}
            </button>
          </div>

          {showInvoices && (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700/30">
                  <th className="text-left px-5 py-2.5 font-medium">Date</th>
                  <th className="text-left px-5 py-2.5 font-medium">Description</th>
                  <th className="text-left px-5 py-2.5 font-medium">Qty</th>
                  <th className="text-left px-5 py-2.5 font-medium">Unit Price</th>
                  <th className="text-left px-5 py-2.5 font-medium">Total</th>
                  <th className="text-left px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3 text-sm text-slate-400 font-mono">{inv.date}</td>
                    <td className="px-5 py-3 text-sm text-slate-300">{inv.description}</td>
                    <td className="px-5 py-3 text-sm text-slate-400 font-mono">{inv.quantity.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-slate-400 font-mono">${inv.unitPrice.toFixed(inv.unitPrice < 1 ? 5 : 2)}</td>
                    <td className="px-5 py-3 text-sm text-slate-200 font-mono">${inv.total.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                        inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : inv.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {checkoutPlan && <CheckoutModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />}
    </div>
  );
}
