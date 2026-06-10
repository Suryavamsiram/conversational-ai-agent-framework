import { useState, useEffect, useRef } from 'react';
import type { SubscriptionTier } from '../types';
import { Radio, ArrowRight, Check, X, Zap, Crown, Code as Code2, ChevronDown, Cpu, Volume2, ShieldCheck, ChartBar as BarChart3, CreditCard, Globe } from 'lucide-react';

const PRICING_PLANS = [
  {
    id: 'developer' as SubscriptionTier,
    name: 'Developer',
    price: 0,
    voiceMinutes: 100,
    overageRate: 0.15,
    features: ['100 voice minutes / month', 'Gemini 2.5 Flash only', 'Community support', 'Basic telemetry'],
    constraints: ['Pro access locked', 'No API key generation', 'No dedicated latency channels'],
    ctaLabel: 'Start Free',
    highlighted: false,
  },
  {
    id: 'scale' as SubscriptionTier,
    name: 'Scale Business',
    price: 149,
    voiceMinutes: 2500,
    overageRate: 0.08,
    features: ['2,500 voice minutes / month', 'Full Gemini 3.1 Pro access', 'Sub-1.5s P50 latency routing', 'Custom API keys', 'Priority support', 'Advanced analytics'],
    ctaLabel: 'Get Started',
    highlighted: true,
  },
  {
    id: 'enterprise' as SubscriptionTier,
    name: 'Enterprise',
    price: 899,
    voiceMinutes: Infinity,
    overageRate: 0,
    features: ['Uncapped voice minutes', 'Custom SLA contracts', 'Dedicated cluster concurrency', 'Premium RBAC', 'Dedicated support engineer', 'SSO & SAML integration'],
    ctaLabel: 'Contact Sales',
    highlighted: false,
  },
];

function GeometricBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const gridSize = 48;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Scrolling grid
      const offsetY = (time * 0.3) % gridSize;
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.04)';
      ctx.lineWidth = 1;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = -gridSize + offsetY; y < canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Floating geometric shapes
      const shapes = [
        { x: 0.15, y: 0.3, size: 60, speed: 0.0004, type: 'diamond' },
        { x: 0.75, y: 0.2, size: 45, speed: 0.0006, type: 'triangle' },
        { x: 0.85, y: 0.6, size: 50, speed: 0.0003, type: 'hexagon' },
        { x: 0.25, y: 0.75, size: 35, speed: 0.0005, type: 'diamond' },
        { x: 0.55, y: 0.45, size: 70, speed: 0.0002, type: 'hexagon' },
      ];

      shapes.forEach((shape, i) => {
        const cx = shape.x * canvas.width + Math.sin(time * shape.speed + i) * 30;
        const cy = shape.y * canvas.height + Math.cos(time * shape.speed * 0.7 + i) * 20;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * shape.speed * 2);

        const alpha = 0.06 + Math.sin(time * shape.speed * 3) * 0.03;
        ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
        ctx.lineWidth = 1;

        if (shape.type === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -shape.size);
          ctx.lineTo(shape.size, 0);
          ctx.lineTo(0, shape.size);
          ctx.lineTo(-shape.size, 0);
          ctx.closePath();
          ctx.stroke();
        } else if (shape.type === 'triangle') {
          ctx.beginPath();
          for (let j = 0; j < 3; j++) {
            const angle = (j / 3) * Math.PI * 2 - Math.PI / 2;
            const px = Math.cos(angle) * shape.size;
            const py = Math.sin(angle) * shape.size;
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        } else if (shape.type === 'hexagon') {
          ctx.beginPath();
          for (let j = 0; j < 6; j++) {
            const angle = (j / 6) * Math.PI * 2;
            const px = Math.cos(angle) * shape.size;
            const py = Math.sin(angle) * shape.size;
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }

        ctx.restore();
      });

      // Horizontal scan line
      const scanY = (time * 0.5) % canvas.height;
      const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scanGrad.addColorStop(0, 'rgba(249, 115, 22, 0)');
      scanGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.05)');
      scanGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 30, canvas.width, 60);

      time += 16;
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}

function Navbar({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-slate-950/90 backdrop-blur-lg border-b border-orange-500/10' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
            <Radio className="w-4.5 h-4.5 text-orange-400" />
          </div>
          <span className="text-xl font-bold text-slate-100 tracking-tight">SwarmVoice<span className="text-orange-400">.ai</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-orange-400 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-orange-400 transition-colors">Pricing</a>
          <a href="#architecture" className="hover:text-orange-400 transition-colors">Architecture</a>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onSignIn} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Sign In</button>
          <button onClick={onGetStarted} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-orange-600/20">
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}

function Hero({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20">
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-8 animate-float-up">
          <Zap className="w-3.5 h-3.5" />
          Now in Public Beta
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-bold text-slate-100 mb-6 leading-[1.1] tracking-tight animate-float-up stagger-1">
          Real-Time AI Voice
          <br />
          <span className="animate-text-glow text-orange-400">Agent Orchestration</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-float-up stagger-2">
          Deploy production-grade voice AI agents at global scale. Sub-1.5s latency,
          automatic model failover, and enterprise-grade security -- all from one platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-float-up stagger-3">
          <button onClick={onGetStarted}
            className="flex items-center gap-2 px-8 py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-orange-600/25 text-base">
            Start Building <ArrowRight className="w-5 h-5" />
          </button>
          <a href="#features"
            className="flex items-center gap-2 px-8 py-3.5 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 font-medium rounded-xl transition-all border border-slate-700/50 text-base">
            See How It Works <ChevronDown className="w-4 h-4" />
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16 animate-float-up stagger-4">
          {[
            { value: '<1.5s', label: 'P50 Latency' },
            { value: '99.97%', label: 'Uptime SLA' },
            { value: '10K+', label: 'Concurrent Calls' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-2xl md:text-3xl font-bold text-orange-400 font-mono">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-5 h-5 text-orange-400/50" />
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: Volume2, title: 'Real-Time Voice Streaming', desc: 'Bi-directional 24kHz audio with live transcription and model inference in a single streaming pipeline.' },
    { icon: ShieldCheck, title: 'Automatic Model Failover', desc: 'Seamless routing from Gemini 3.1 Pro to 2.5 Flash on 429s or latency spikes. Zero interruption for end users.' },
    { icon: Cpu, title: 'Agent Configuration Matrix', desc: 'Define behavioral profiles with custom system prompts, temperature, voice engines, and webhook callbacks.' },
    { icon: BarChart3, title: 'Live Telemetry Grid', desc: 'Monitor P50 latency, jitter, packet loss, token efficiency, and concurrent pipelines in real-time.' },
    { icon: Globe, title: 'Phone Routing Manager', desc: 'Buy virtual numbers in 30+ countries and wire them directly to agent profiles with per-line analytics.' },
    { icon: CreditCard, title: 'Enterprise Billing', desc: 'Tiered voice-minute quotas, itemized invoices, token overage tracking, and projected cost calculations.' },
  ];

  return (
    <section id="features" className="relative z-10 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-medium uppercase tracking-widest text-orange-400 mb-3 block">Platform Capabilities</span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-100">Everything You Need to Orchestrate Voice AI</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <div key={feat.title}
              className="group p-6 bg-slate-900/40 border border-slate-700/30 rounded-xl hover:border-orange-500/30 hover:bg-slate-900/60 transition-all duration-300 animate-float-up"
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4 group-hover:bg-orange-500/15 transition-colors">
                <feat.icon className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-200 mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing({ onGetStarted }: { onGetStarted: () => void }) {
  const planIcons: Record<SubscriptionTier, React.ElementType> = {
    developer: Code2,
    scale: Zap,
    enterprise: Crown,
  };

  return (
    <section id="pricing" className="relative z-10 py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-medium uppercase tracking-widest text-orange-400 mb-3 block">Simple Pricing</span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-3">Choose Your Scale</h2>
          <p className="text-slate-400 max-w-lg mx-auto">Start free, upgrade when you need more. No hidden fees, transparent per-minute overages.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PRICING_PLANS.map(plan => {
            const PlanIcon = planIcons[plan.id];
            return (
              <div key={plan.id}
                className={`relative rounded-xl border p-6 transition-all duration-200 ${
                  plan.highlighted
                    ? 'bg-slate-900/80 border-orange-500/40 shadow-lg shadow-orange-500/5'
                    : 'bg-slate-900/40 border-slate-700/40'
                }`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-orange-600/20">Most Popular</div>
                )}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    plan.highlighted ? 'bg-orange-500/15 border border-orange-500/25' : 'bg-slate-800 border border-slate-700/50'
                  }`}>
                    <PlanIcon className={`w-4 h-4 ${plan.highlighted ? 'text-orange-400' : 'text-slate-400'}`} />
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
                      <Check className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
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
                <button onClick={onGetStarted}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                    plan.highlighted
                      ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
                  }`}>
                  {plan.ctaLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section id="architecture" className="relative z-10 py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <span className="text-xs font-medium uppercase tracking-widest text-orange-400 mb-3 block">Architecture</span>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-6">Built for Global Scale</h2>
        <p className="text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          SwarmVoice runs on a multi-region Google Cloud backbone with dedicated WebSocket pipelines,
          automatic failover routing, and per-tenant isolation. Your FastAPI backend plugs in via a single config map.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'WebSocket Audio', sub: 'Bi-directional streaming' },
            { label: 'Transcription Hook', sub: 'Real-time webhook socket' },
            { label: 'Model Response Hook', sub: 'Outbound event socket' },
            { label: 'Telemetry REST', sub: 'Analytics + health' },
          ].map(item => (
            <div key={item.label} className="p-4 bg-slate-900/40 border border-slate-700/30 rounded-xl">
              <div className="text-sm font-semibold text-orange-400 font-mono mb-1">{item.label}</div>
              <div className="text-xs text-slate-500">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-slate-800/50 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-orange-400" />
          <span className="text-sm text-slate-400">SwarmVoice AI -- &copy; 2026</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-500">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Status</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 overflow-x-hidden">
      <GeometricBackground />
      <Navbar onGetStarted={onGetStarted} onSignIn={onSignIn} />
      <Hero onGetStarted={onGetStarted} />
      <Features />
      <Pricing onGetStarted={onGetStarted} />
      <Architecture />
      <Footer />
    </div>
  );
}
