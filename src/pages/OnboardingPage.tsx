import { useState } from 'react';
import { useApp } from '../state/AppContext';
import {
  Radio, ArrowRight, ArrowLeft, Check, CreditCard,
  Loader as Loader2, Shield, UserPlus, Mail, Lock, Zap,
  Sparkles,
} from 'lucide-react';

type Step = 'signup' | 'plan' | 'payment' | 'complete';

const PLANS = [
  { id: 'developer' as const, name: 'Developer', price: 0, minutes: '100 min/mo', desc: 'Perfect for exploring the platform', badge: null },
  { id: 'scale' as const, name: 'Scale Business', price: 149, minutes: '2,500 min/mo', desc: 'Full Pro access + priority support', badge: 'POPULAR' },
  { id: 'enterprise' as const, name: 'Enterprise', price: 899, minutes: 'Unlimited', desc: 'Custom SLAs + dedicated engineer', badge: null },
];

const STEPS: Step[] = ['signup', 'plan', 'payment', 'complete'];

export default function OnboardingPage({ onBack }: { onBack: () => void }) {
  const { signUp } = useApp();
  const [step, setStep] = useState<Step>('signup');
  const [selectedPlan, setSelectedPlan] = useState<'developer' | 'scale' | 'enterprise'>('scale');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stepIdx = STEPS.indexOf(step);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await signUp(name, email, password);
      setStep('plan');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = () => {
    if (selectedPlan === 'developer') {
      setStep('complete');
    } else {
      setStep('payment');
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    setStep('complete');
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
      {/* Grid background */}
      <div className="absolute inset-0 dashboard-grid-bg" />
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Logo + Step indicator */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 flex items-center justify-center animate-glow-pulse">
              <Radio className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-2xl font-bold text-slate-100 tracking-tight">SwarmVoice<span className="text-orange-400">.ai</span></span>
          </div>

          {/* Step progress */}
          <div className="flex items-center justify-center gap-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 transition-all duration-300 ${
                  i <= stepIdx ? 'opacity-100' : 'opacity-30'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    i < stepIdx ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                    i === stepIdx ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' :
                    'bg-white/5 text-slate-500 border border-white/10'
                  }`}>
                    {i < stepIdx ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline transition-colors ${
                    i === stepIdx ? 'text-orange-400' : i < stepIdx ? 'text-emerald-400' : 'text-slate-600'
                  }`}>
                    {s === 'signup' ? 'Account' : s === 'plan' ? 'Plan' : s === 'payment' ? 'Payment' : 'Done'}
                  </span>
                </div>
                {i < 3 && (
                  <div className={`w-6 h-px transition-colors duration-300 ${
                    i < stepIdx ? 'bg-emerald-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card container */}
        <div className="glass-card overflow-hidden">
          {/* Step: Signup */}
          {step === 'signup' && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-100 mb-1">Create your account</h2>
                <p className="text-sm text-slate-500">Start your free trial. No credit card needed.</p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Kai Chen"
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-orange-600/25">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/[0.06] flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <span className="text-xs text-slate-600">Encrypted & secure</span>
              </div>
            </div>
          )}

          {/* Step: Plan Selection */}
          {step === 'plan' && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-100 mb-1">Choose your plan</h2>
                <p className="text-sm text-slate-500">Upgrade or downgrade anytime.</p>
              </div>

              <div className="space-y-3 mb-6">
                {PLANS.map(plan => (
                  <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full relative flex items-center gap-4 p-5 rounded-xl border text-left transition-all duration-200 ${
                      selectedPlan === plan.id
                        ? 'glass-card border-orange-500/25 inner-glow-orange'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                    }`}>
                    {plan.badge && selectedPlan === plan.id && (
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-orange-600 text-white text-[10px] font-bold rounded-full">{plan.badge}</span>
                    )}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedPlan === plan.id ? 'border-orange-400' : 'border-slate-600'
                    }`}>
                      {selectedPlan === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-slate-200">{plan.name}</span>
                        <span className="text-xs text-orange-400 font-mono">{plan.minutes}</span>
                      </div>
                      <span className="text-xs text-slate-500">{plan.desc}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xl font-bold text-slate-200 font-mono">${plan.price}</span>
                      <span className="text-xs text-slate-500">/mo</span>
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={handlePlanSelect}
                className="w-full flex items-center justify-center gap-2 py-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-orange-600/25">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step: Payment */}
          {step === 'payment' && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-100 mb-1">Payment details</h2>
                <p className="text-sm text-slate-500">
                  Subscribing to <span className="text-orange-400 font-semibold">{PLANS.find(p => p.id === selectedPlan)?.name}</span> at <span className="text-orange-400 font-mono">${PLANS.find(p => p.id === selectedPlan)?.price}/mo</span>
                </p>
              </div>

              {/* Order summary */}
              <div className="mb-6 p-4 glass-card-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{PLANS.find(p => p.id === selectedPlan)?.name} Plan</span>
                  <span className="text-sm font-semibold text-slate-200 font-mono">${PLANS.find(p => p.id === selectedPlan)?.price}.00/mo</span>
                </div>
              </div>

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242"
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Expiry</label>
                    <input type="text" placeholder="12/27" defaultValue="12/27"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">CVC</label>
                    <input type="text" placeholder="123" defaultValue="123"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>256-bit SSL encryption. Your data is safe.</span>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-orange-600/25">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing payment...</> : <>Subscribe & Launch <Zap className="w-4 h-4" /></>}
                </button>
              </form>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="p-10 text-center">
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8 inner-glow-emerald">
                <Check className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-3 h-3" /> Account Ready
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Welcome to SwarmVoice</h2>
              <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto">
                Your {PLANS.find(p => p.id === selectedPlan)?.name} plan is active. Deploy your first voice agent now.
              </p>
              <button onClick={() => window.location.reload()}
                className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-orange-600/25 text-base">
                Launch Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
