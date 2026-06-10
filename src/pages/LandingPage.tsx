import { useState, useEffect, useRef } from 'react';
import type { SubscriptionTier } from '../types';
import {
  Radio, ArrowRight, Check, X, Zap, Crown, Code as Code2,
  ChevronDown, Cpu, Volume2, ShieldCheck, ChartBar as BarChart3,
  CreditCard, Globe, Play, Star, Users, Headphones,
  ArrowUpRight, Sparkles,
} from 'lucide-react';

const PRICING_PLANS = [
  {
    id: 'developer' as SubscriptionTier, name: 'Developer', price: 0,
    voiceMinutes: 100, overageRate: 0.15,
    features: ['100 voice minutes / month', 'Gemini 2.5 Flash only', 'Community support', 'Basic telemetry'],
    constraints: ['Pro access locked', 'No API key generation'],
    ctaLabel: 'Start Free', highlighted: false,
  },
  {
    id: 'scale' as SubscriptionTier, name: 'Scale Business', price: 149,
    voiceMinutes: 2500, overageRate: 0.08,
    features: ['2,500 voice minutes / month', 'Full Gemini 3.1 Pro access', 'Sub-1.5s P50 latency routing', 'Custom API keys', 'Priority support', 'Advanced analytics'],
    ctaLabel: 'Get Started', highlighted: true,
  },
  {
    id: 'enterprise' as SubscriptionTier, name: 'Enterprise', price: 899,
    voiceMinutes: Infinity, overageRate: 0,
    features: ['Uncapped voice minutes', 'Custom SLA contracts', 'Dedicated cluster concurrency', 'Premium RBAC', 'Dedicated support engineer', 'SSO & SAML'],
    ctaLabel: 'Contact Sales', highlighted: false,
  },
];

/* ── Interactive Fluidic Grid Canvas ── */

function FluidicGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    const SPACING = 32;
    const INFLUENCE = 200;
    const PUSH = 16;
    let t = 0;

    // Pre-compute grid positions for performance
    const computeGrid = (time: number, w: number, h: number) => {
      const cols = Math.ceil(w / SPACING) + 1;
      const rows = Math.ceil(h / SPACING) + 1;
      const grid: { px: number; py: number; col: number; row: number }[] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const bx = col * SPACING;
          const by = row * SPACING;
          const waveX = Math.sin(by * 0.008 + time * 0.0015) * 3 + Math.cos(bx * 0.005 + time * 0.001) * 2;
          const waveY = Math.cos(bx * 0.008 + time * 0.0012) * 3 + Math.sin(by * 0.005 + time * 0.001) * 2;
          grid.push({ px: bx + waveX, py: by + waveY, col, row });
        }
      }
      return { grid, cols, rows };
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const { grid, cols } = computeGrid(t, w, h);

      // Pass 1: Draw ALL grid lines (always visible, subtle)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < grid.length; i++) {
        const { px, py, col } = grid[i];

        // Horizontal line to right neighbor
        if (col < cols - 1) {
          const rightIdx = i + 1;
          if (rightIdx < grid.length) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(grid[rightIdx].px, grid[rightIdx].py);
            ctx.strokeStyle = 'rgba(249,115,22,0.03)';
            ctx.stroke();
          }
        }

        // Vertical line to bottom neighbor
        const bottomIdx = i + cols;
        if (bottomIdx < grid.length && grid[bottomIdx].col === col) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(grid[bottomIdx].px, grid[bottomIdx].py);
          ctx.strokeStyle = 'rgba(249,115,22,0.03)';
          ctx.stroke();
        }
      }

      // Pass 2: Draw ALL dots + compute mouse-reactive overlay
      for (let i = 0; i < grid.length; i++) {
        const { px: basePx, py: basePy, col } = grid[i];

        const dx = basePx - mx;
        const dy = basePy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let px = basePx;
        let py = basePy;
        let dotAlpha = 0.06;
        let dotSize = 0.8;

        if (dist < INFLUENCE) {
          const force = 1 - dist / INFLUENCE;
          const angle = Math.atan2(dy, dx);
          px += Math.cos(angle) * force * PUSH;
          py += Math.sin(angle) * force * PUSH;
          dotAlpha = 0.06 + force * 0.6;
          dotSize = 0.8 + force * 2.8;
        }

        // Base dot (always visible)
        ctx.beginPath();
        ctx.arc(px, py, dotSize, 0, Math.PI * 2);

        // Orange near mouse, slate far away
        if (dist < INFLUENCE) {
          ctx.fillStyle = `rgba(249,115,22,${dotAlpha})`;
        } else {
          ctx.fillStyle = `rgba(100,116,139,${dotAlpha})`;
        }
        ctx.fill();

        // Reactive bright glow lines near mouse
        if (dist < INFLUENCE * 0.8) {
          const force = 1 - dist / (INFLUENCE * 0.8);

          // Right neighbor
          if (col < cols - 1) {
            const rightIdx = i + 1;
            if (rightIdx < grid.length) {
              const nDx = grid[rightIdx].px - mx;
              const nDy = grid[rightIdx].py - my;
              const nDist = Math.sqrt(nDx * nDx + nDy * nDy);
              if (nDist < INFLUENCE * 0.8) {
                const nForce = 1 - nDist / (INFLUENCE * 0.8);
                const lineAlpha = Math.min(force, nForce) * 0.25;
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(grid[rightIdx].px, grid[rightIdx].py);
                ctx.strokeStyle = `rgba(249,115,22,${lineAlpha})`;
                ctx.lineWidth = Math.min(force, nForce) * 2;
                ctx.stroke();
              }
            }
          }

          // Bottom neighbor
          const bottomIdx = i + cols;
          if (bottomIdx < grid.length && grid[bottomIdx].col === col) {
            const nDx = grid[bottomIdx].px - mx;
            const nDy = grid[bottomIdx].py - my;
            const nDist = Math.sqrt(nDx * nDx + nDy * nDy);
            if (nDist < INFLUENCE * 0.8) {
              const nForce = 1 - nDist / (INFLUENCE * 0.8);
              const lineAlpha = Math.min(force, nForce) * 0.25;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(grid[bottomIdx].px, grid[bottomIdx].py);
              ctx.strokeStyle = `rgba(249,115,22,${lineAlpha})`;
              ctx.lineWidth = Math.min(force, nForce) * 2;
              ctx.stroke();
            }
          }
        }
      }

      // Scan line
      const scanY = (t * 0.4) % (h + 120) - 60;
      const scanGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
      scanGrad.addColorStop(0, 'rgba(249,115,22,0)');
      scanGrad.addColorStop(0.5, 'rgba(249,115,22,0.04)');
      scanGrad.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 60, w, 120);

      // Large floating geometric shapes
      const shapes = [
        { x: 0.12, y: 0.25, size: 80, speed: 0.0003, rot: 0.0004, sides: 6 },
        { x: 0.82, y: 0.18, size: 55, speed: 0.0005, rot: -0.0003, sides: 4 },
        { x: 0.9, y: 0.65, size: 65, speed: 0.00025, rot: 0.00035, sides: 3 },
        { x: 0.22, y: 0.78, size: 45, speed: 0.00045, rot: -0.0005, sides: 6 },
        { x: 0.5, y: 0.5, size: 100, speed: 0.00015, rot: 0.0002, sides: 6 },
      ];

      shapes.forEach((s, i) => {
        const cx = s.x * w + Math.sin(t * s.speed + i * 1.5) * 40;
        const cy = s.y * h + Math.cos(t * s.speed * 0.8 + i * 1.2) * 30;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * s.rot);
        const shapeAlpha = 0.04 + Math.sin(t * s.speed * 4 + i) * 0.02;
        ctx.strokeStyle = `rgba(249,115,22,${shapeAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let j = 0; j < s.sides; j++) {
          const angle = (j / s.sides) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(angle) * s.size;
          const py = Math.sin(angle) * s.size;
          if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner ring
        ctx.beginPath();
        for (let j = 0; j < s.sides; j++) {
          const angle = (j / s.sides) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(angle) * s.size * 0.55;
          const py = Math.sin(angle) * s.size * 0.55;
          if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(249,115,22,${shapeAlpha * 0.5})`;
        ctx.stroke();
        ctx.restore();
      });

      t += 16;
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" style={{ cursor: 'default' }} />;
}

/* ── Scroll-Reveal Wrapper ── */

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`transition-all duration-700 ${className}`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Navbar ── */

function Navbar({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-slate-950/80 backdrop-blur-xl border-b border-orange-500/10 shadow-lg shadow-black/20'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center group-hover:bg-orange-500/25 transition-colors">
            <Radio className="w-4.5 h-4.5 text-orange-400" />
          </div>
          <span className="text-xl font-bold text-slate-100 tracking-tight">SwarmVoice<span className="text-orange-400">.ai</span></span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Pricing', 'Architecture'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="text-sm text-slate-400 hover:text-orange-400 transition-colors relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-px after:bg-orange-400 after:transition-all hover:after:w-full">
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onSignIn} className="text-sm text-slate-400 hover:text-slate-200 transition-colors hidden sm:block">Sign In</button>
          <button onClick={onGetStarted}
            className="group flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-orange-600/25 hover:shadow-orange-500/30">
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ── Hero ── */

function Hero({ onGetStarted }: { onGetStarted: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-12">
      {/* Radial glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, rgba(249,115,22,0) 70%)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Beta badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Sparkles className="w-3.5 h-3.5" />
          PUBLIC BETA NOW LIVE
        </div>

        {/* Main headline */}
        <h1 className={`text-5xl sm:text-6xl md:text-8xl font-extrabold text-slate-50 mb-6 leading-[1.05] tracking-tight transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          Voice AI at
          <br />
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 bg-clip-text text-transparent animate-gradient-x">
            Global Scale
          </span>
        </h1>

        <p className={`text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          Deploy production-grade voice agents with sub-1.5s latency, automatic model failover,
          and enterprise security. One platform, infinite conversations.
        </p>

        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <button onClick={onGetStarted}
            className="group flex items-center gap-2.5 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-2xl shadow-orange-600/30 hover:shadow-orange-500/35 text-base">
            Start Building Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <a href="#features"
            className="group flex items-center gap-2.5 px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-xl transition-all border border-white/10 hover:border-white/20 text-base backdrop-blur">
            <Play className="w-4 h-4 text-orange-400" />
            See It in Action
          </a>
        </div>

        {/* Social proof stats */}
        <div className={`grid grid-cols-3 gap-8 max-w-xl mx-auto mt-20 transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {[
            { value: '<1.5s', label: 'P50 Latency' },
            { value: '99.97%', label: 'Uptime SLA' },
            { value: '10K+', label: 'Concurrent Calls' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-orange-400 font-mono tracking-tight">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-2 uppercase tracking-wider font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-5 h-5 text-orange-400/40" />
      </div>
    </section>
  );
}

/* ── Logos / Trust bar ── */

function TrustBar() {
  return (
    <section className="relative z-10 py-16 px-6 border-y border-white/5">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs text-slate-600 uppercase tracking-widest font-medium mb-6">Trusted by forward-thinking teams</p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-slate-600">
          {['Quantum Labs', 'Meridian Health', 'Flux Systems', 'Arc Financial', 'Nova Retail'].map(name => (
            <span key={name} className="text-lg font-bold tracking-tight opacity-40 hover:opacity-70 transition-opacity">{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ── */

function Features() {
  const features = [
    { icon: Volume2, title: 'Real-Time Voice Streaming', desc: 'Bi-directional 24kHz audio with live transcription and inference in a single streaming pipeline.' },
    { icon: ShieldCheck, title: 'Automatic Model Failover', desc: 'Seamless routing from Gemini 3.1 Pro to 2.5 Flash on 429s or latency spikes. Zero interruption.' },
    { icon: Cpu, title: 'Agent Configuration Matrix', desc: 'Define behavioral profiles with system prompts, temperature, voice engines, and webhook callbacks.' },
    { icon: BarChart3, title: 'Live Telemetry Grid', desc: 'Monitor P50 latency, jitter, packet loss, token efficiency, and pipelines in real-time.' },
    { icon: Globe, title: 'Phone Routing Manager', desc: 'Buy virtual numbers in 30+ countries. Wire them to agent profiles with per-line analytics.' },
    { icon: CreditCard, title: 'Enterprise Billing Engine', desc: 'Tiered voice-minute quotas, itemized invoices, token overage, and projected cost tracking.' },
  ];

  return (
    <section id="features" className="relative z-10 py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-20">
          <span className="inline-block px-3 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-semibold uppercase tracking-[0.15em] mb-4">Platform</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-50 tracking-tight">Everything to orchestrate voice AI</h2>
          <p className="text-slate-400 max-w-lg mx-auto mt-4 text-lg">One platform. Six core systems. Infinite conversations.</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => (
            <Reveal key={feat.title} delay={i * 80}>
              <div className="group relative h-full p-7 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.06] rounded-2xl hover:border-orange-500/25 transition-all duration-500 overflow-hidden">
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5 group-hover:bg-orange-500/15 group-hover:border-orange-500/30 transition-colors">
                    <feat.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-2.5">{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Social proof ── */

function SocialProof() {
  const testimonials = [
    { quote: 'SwarmVoice cut our voice agent deploy time from 3 months to 3 days. The failover is seamless.', name: 'Sarah Chen', role: 'CTO, Quantum Labs' },
    { quote: 'Sub-1.5s latency with built-in telemetry? This is what enterprise voice AI should look like.', name: 'Marcus Webb', role: 'VP Eng, Meridian Health' },
    { quote: 'We replaced 4 separate tools with SwarmVoice. Phone routing, agents, billing -- all in one.', name: 'Aisha Patel', role: 'Head of AI, Flux Systems' },
  ];

  return (
    <section className="relative z-10 py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-semibold uppercase tracking-[0.15em] mb-4">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-50 tracking-tight">Loved by engineering teams</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <div className="p-6 bg-white/[0.03] border border-white/[0.06] rounded-2xl h-full flex flex-col">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />)}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed flex-1 mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ── */

function Pricing({ onGetStarted }: { onGetStarted: () => void }) {
  const planIcons: Record<SubscriptionTier, React.ElementType> = { developer: Code2, scale: Zap, enterprise: Crown };

  return (
    <section id="pricing" className="relative z-10 py-28 px-6">
      {/* Bg accent */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(249,115,22,0.04) 0%, transparent 100%)' }} />

      <div className="max-w-5xl mx-auto relative">
        <Reveal className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-semibold uppercase tracking-[0.15em] mb-4">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-50 tracking-tight mb-3">Scale as you grow</h2>
          <p className="text-slate-400 max-w-md mx-auto text-lg">Start free. Upgrade when you need more. No hidden fees.</p>
        </Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {PRICING_PLANS.map((plan, i) => {
            const PlanIcon = planIcons[plan.id];
            return (
              <Reveal key={plan.id} delay={i * 100}>
                <div className={`relative rounded-2xl border p-7 transition-all duration-300 h-full flex flex-col ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-orange-500/[0.08] to-orange-500/[0.02] border-orange-500/30 shadow-xl shadow-orange-500/5'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                }`}>
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-600 text-white text-xs font-bold rounded-full shadow-lg shadow-orange-600/25">MOST POPULAR</div>
                  )}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      plan.highlighted ? 'bg-orange-500/15 border border-orange-500/25' : 'bg-white/5 border border-white/10'
                    }`}>
                      <PlanIcon className={`w-5 h-5 ${plan.highlighted ? 'text-orange-400' : 'text-slate-400'}`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-100">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-extrabold text-slate-50 font-mono">${plan.price}</span>
                    <span className="text-sm text-slate-500">/month</span>
                  </div>
                  <div className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feat, j) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlighted ? 'text-orange-400' : 'text-emerald-400'}`} />
                        <span className="text-sm text-slate-300">{feat}</span>
                      </div>
                    ))}
                    {plan.constraints?.map((c, j) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <X className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-500">{c}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={onGetStarted}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                      plan.highlighted
                        ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/25'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20'
                    }`}>
                    {plan.ctaLabel}
                  </button>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Architecture ── */

function Architecture() {
  const endpoints = [
    { label: 'ws/audio/stream', sub: 'Bi-directional audio', icon: Headphones },
    { label: 'ws/webhook/transcription', sub: 'Real-time transcription', icon: Volume2 },
    { label: 'ws/webhook/model-response', sub: 'Outbound generation', icon: Cpu },
    { label: '/api/telemetry/analytics', sub: 'System health + metrics', icon: BarChart3 },
    { label: '/api/agents/profiles', sub: 'Agent CRUD', icon: Users },
    { label: '/api/billing/metrics', sub: 'Usage + cost streams', icon: CreditCard },
  ];

  return (
    <section id="architecture" className="relative z-10 py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <Reveal className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-semibold uppercase tracking-[0.15em] mb-4">Architecture</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-50 tracking-tight mb-4">Built for global scale</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Multi-region Google Cloud backbone with dedicated WebSocket pipelines, automatic failover,
            and per-tenant isolation. Plug your FastAPI backend via a single config map.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {endpoints.map((ep, i) => (
            <Reveal key={ep.label} delay={i * 60}>
              <div className="group p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:border-orange-500/20 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/15 transition-colors">
                    <ep.icon className="w-4 h-4 text-orange-400" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-400 transition-colors" />
                </div>
                <div className="text-sm font-semibold text-orange-400 font-mono mb-0.5">{ep.label}</div>
                <div className="text-xs text-slate-500">{ep.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA Banner ── */

function CtaBanner({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative z-10 py-28 px-6">
      <Reveal>
        <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl p-12 md:p-16 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0.04) 50%, rgba(234,88,12,0.08) 100%)' }}>
          <div className="absolute inset-0 border border-orange-500/15 rounded-3xl pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-50 tracking-tight mb-4">Ready to launch your voice agents?</h2>
          <p className="text-slate-400 text-lg max-w-md mx-auto mb-8">Start free. No credit card required. Deploy your first agent in under 5 minutes.</p>
          <button onClick={onGetStarted}
            className="group inline-flex items-center gap-2.5 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-2xl shadow-orange-600/30 text-base">
            Get Started Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </Reveal>
    </section>
  );
}

/* ── Footer ── */

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-slate-200">SwarmVoice.ai</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Real-time voice AI agent orchestration for the enterprise.</p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Architecture', 'Changelog'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'DPA'] },
          ].map(col => (
            <div key={col.title}>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{col.title}</div>
              <div className="space-y-2">
                {col.links.map(link => (
                  <span key={link} className="block text-xs text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">{link}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-600">&copy; 2026 SwarmVoice AI. All rights reserved.</span>
          <span className="text-xs text-slate-700">Built with purpose.</span>
        </div>
      </div>
    </footer>
  );
}

/* ── Page ── */

export default function LandingPage({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 overflow-x-hidden">
      <FluidicGrid />
      <Navbar onGetStarted={onGetStarted} onSignIn={onSignIn} />
      <Hero onGetStarted={onGetStarted} />
      <TrustBar />
      <Features />
      <SocialProof />
      <Pricing onGetStarted={onGetStarted} />
      <Architecture />
      <CtaBanner onGetStarted={onGetStarted} />
      <Footer />
    </div>
  );
}


export default LandingPage