import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { Radio, ArrowRight, ArrowLeft, Check, CreditCard, Loader as Loader2, Shield, UserPlus, Mail, Lock, Zap } from 'lucide-react';

type Step = 'signup' | 'plan' | 'payment' | 'complete';

const PLANS = [
  { id: 'developer' as const, name: 'Developer', price: 0, minutes: '100 min/mo', desc: 'Perfect for trying out the platform' },
  { id: 'scale' as const, name: 'Scale Business', price: 149, minutes: '2,500 min/mo', desc: 'For growing teams that need Pro access' },
  { id: 'enterprise' as const, name: 'Enterprise', price: 899, minutes: 'Unlimited', desc: 'Custom SLAs and dedicated support' },
];

export default function OnboardingPage({ onBack }: { onBack: () => void }) {
  const { signUp } = useApp();
  const [step, setStep] = useState<Step>('signup');
  const [selectedPlan, setSelectedPlan] = useState<'developer' | 'scale' | 'enterprise'>('scale');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    setStep('complete');
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(#fb923c 1px, transparent 1px), linear-gradient(90deg, #fb923c 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <Radio className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-2xl font-bold text-slate-100 tracking-tight">SwarmVoice<span className="text-orange-400">.ai</span></span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {(['signup', 'plan', 'payment', 'complete'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step === s ? 'bg-orange-500 text-white' :
                  ['signup', 'plan', 'payment', 'complete'].indexOf(step) > i ? 'bg-emerald-500 text-white' :
                  'bg-slate-800 text-slate-500 border border-slate-700/50'
                }`}>
                  {['signup', 'plan', 'payment', 'complete'].indexOf(step) > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < 3 && <div className={`w-8 h-px ${['signup', 'plan', 'payment', 'complete'].indexOf(step) > i ? 'bg-emerald-500' : 'bg-slate-700'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step: Signup */}
        {step === 'signup' && (
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-xl p-8">
            <h2 className="text-lg font-semibold text-slate-100 mb-1">Create your account</h2>
            <p className="text-sm text-slate-500 mb-6">Start your free trial. No credit card required.</p>

            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Kai Chen"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium rounded-lg transition-all text-sm shadow-lg shadow-orange-600/20">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-700/50 flex items-center justify-between">
              <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to home
              </button>
              <span className="text-xs text-slate-600">Already have an account?</span>
            </div>
          </div>
        )}

        {/* Step: Plan Selection */}
        {step === 'plan' && (
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-xl p-8">
            <h2 className="text-lg font-semibold text-slate-100 mb-1">Choose your plan</h2>
            <p className="text-sm text-slate-500 mb-6">Start with any tier. Upgrade or downgrade anytime.</p>

            <div className="space-y-3 mb-6">
              {PLANS.map(plan => (
                <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    selectedPlan === plan.id
                      ? 'bg-orange-500/10 border-orange-500/30 ring-1 ring-orange-500/20'
                      : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600'
                  }`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
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
                    <span className="text-lg font-bold text-slate-200">${plan.price}</span>
                    <span className="text-xs text-slate-500">/mo</span>
                  </div>
                </button>
              ))}
            </div>

            <button onClick={handlePlanSelect}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg transition-all text-sm shadow-lg shadow-orange-600/20">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step: Payment */}
        {step === 'payment' && (
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-xl p-8">
            <h2 className="text-lg font-semibold text-slate-100 mb-1">Payment details</h2>
            <p className="text-sm text-slate-500 mb-6">
              Subscribing to <span className="text-orange-400 font-medium">{PLANS.find(p => p.id === selectedPlan)?.name}</span> at <span className="text-orange-400 font-mono">${PLANS.find(p => p.id === selectedPlan)?.price}/mo</span>
            </p>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Expiry</label>
                  <input type="text" placeholder="12/27" defaultValue="12/27"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">CVC</label>
                  <input type="text" placeholder="123" defaultValue="123"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Your payment info is encrypted and secure
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium rounded-lg transition-all text-sm shadow-lg shadow-orange-600/20">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <>Subscribe & Launch <Zap className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="bg-slate-900/80 backdrop-blur border border-emerald-500/20 rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">You're all set!</h2>
            <p className="text-sm text-slate-400 mb-6">
              Your {PLANS.find(p => p.id === selectedPlan)?.name} plan is active. Welcome to SwarmVoice.
            </p>
            <button onClick={() => window.location.reload()}
              className="flex items-center gap-2 mx-auto px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-orange-600/20">
              Launch Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
