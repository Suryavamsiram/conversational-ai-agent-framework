import { useApp } from '../state/AppContext';
import {
  Clock,
  Activity,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Cpu,
  Wifi,
  DollarSign,
  Hash,
} from 'lucide-react';

function MiniBarChart({ data, maxVal, color, threshold, thresholdLabel }: {
  data: number[];
  maxVal: number;
  color: string;
  threshold?: number;
  thresholdLabel?: string;
}) {
  const barWidth = 100 / data.length;
  return (
    <div className="relative h-16 flex items-end gap-1">
      {threshold !== undefined && (
        <div
          className="absolute left-0 right-0 border-t border-dashed border-red-400/60 z-10"
          style={{ bottom: `${(threshold / maxVal) * 100}%` }}
        >
          <span className="absolute right-0 -top-4 text-[9px] text-red-400/80 font-medium">
            {thresholdLabel || `${threshold}`}
          </span>
        </div>
      )}
      {data.map((val, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all duration-500"
          style={{
            height: `${(val / maxVal) * 100}%`,
            backgroundColor: color,
            opacity: 0.3 + (i / data.length) * 0.7,
            minWidth: `${barWidth}%`,
          }}
        />
      ))}
    </div>
  );
}

function MiniLineChart({ data, maxVal, color }: { data: number[]; maxVal: number; color: string }) {
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (val / maxVal) * 100;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-16" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function DonutChart({ primary, secondary, primaryLabel, secondaryLabel, primaryColor, secondaryColor }: {
  primary: number;
  secondary: number;
  primaryLabel: string;
  secondaryLabel: string;
  primaryColor: string;
  secondaryColor: string;
}) {
  const total = primary + secondary;
  const primaryAngle = (primary / total) * 360;

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(50, 50, 40, endAngle);
    const end = polarToCartesian(50, 50, 40, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M 50 50 L ${start.x} ${start.y} A 40 40 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  };

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-20 h-20">
        <path d={describeArc(0, primaryAngle)} fill={primaryColor} />
        <path d={describeArc(primaryAngle, 360)} fill={secondaryColor} />
        <circle cx="50" cy="50" r="24" fill="#0f172a" />
        <text x="50" y="52" textAnchor="middle" dominantBaseline="middle" fill="#cbd5e1" fontSize="10" fontWeight="600">
          {primary}%
        </text>
      </svg>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: primaryColor }} />
          <span className="text-xs text-slate-300">{primaryLabel}</span>
          <span className="text-xs font-semibold text-slate-200">{primary}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: secondaryColor }} />
          <span className="text-xs text-slate-300">{secondaryLabel}</span>
          <span className="text-xs font-semibold text-slate-200">{secondary}%</span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, iconBg, iconColor, label, sublabel, value, unit, delta, deltaColor, deltaSuffix }: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  sublabel: string;
  value: string;
  unit?: string;
  delta: number;
  deltaColor: string;
  deltaSuffix: string;
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${iconBg} border flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-200">{label}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{sublabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {delta <= 0 ? <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingUp className="w-3.5 h-3.5" style={{ color: deltaColor }} />}
          <span style={{ color: deltaColor }}>{Math.abs(delta).toFixed(0)}{deltaSuffix}</span>
        </div>
      </div>
      <div className="text-3xl font-bold font-mono" style={{ color: iconColor }}>
        {value}{unit && <span className="text-lg">{unit}</span>}
      </div>
    </div>
  );
}

export default function AnalyticsTelemetry() {
  const {
    telemetry, jitterMs, packetLossPercent,
    activeConcurrentPipelines, tokenUsageTotal, estimatedCostUsd,
  } = useApp();

  const latencyDelta = telemetry.p50LatencyMs - telemetry.latencyHistory[telemetry.latencyHistory.length - 2];
  const throughputDelta = telemetry.audioThroughputKbps - telemetry.throughputHistory[telemetry.throughputHistory.length - 2];

  // Dynamic color based on latency threshold
  const latencyColor = telemetry.p50LatencyMs < 1500 ? '#10b981' : telemetry.p50LatencyMs < 2000 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-100 mb-1">Analytics & Performance Telemetry</h1>
          <p className="text-sm text-slate-500">Real-time infrastructure monitoring and metrics</p>
        </div>

        {/* Top Row: 6 Dense Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          {/* P50 Latency */}
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${telemetry.p50LatencyMs < 1500 ? 'bg-emerald-500/10 border-emerald-500/20' : telemetry.p50LatencyMs < 2000 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'} border flex items-center justify-center`}>
                  <Clock className={`w-4 h-4 ${telemetry.p50LatencyMs < 1500 ? 'text-emerald-400' : telemetry.p50LatencyMs < 2000 ? 'text-amber-400' : 'text-red-400'}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200">P50 System Latency</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Target: sub-1.5s</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {latencyDelta <= 0 ? <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingUp className="w-3.5 h-3.5 text-amber-400" />}
                <span className={latencyDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'}>{Math.abs(latencyDelta).toFixed(0)}ms</span>
              </div>
            </div>
            <div className="text-3xl font-bold font-mono" style={{ color: latencyColor }}>
              {(telemetry.p50LatencyMs / 1000).toFixed(2)}s
            </div>
            <MiniBarChart data={telemetry.latencyHistory} maxVal={2000} color={latencyColor} threshold={1500} thresholdLabel="1.5s SLA" />
          </div>

          {/* Concurrency */}
          <MetricCard
            icon={Cpu} iconBg="bg-indigo-500/10" iconColor="text-indigo-400"
            label="Concurrent Pipelines" sublabel="Active streaming sessions"
            value={activeConcurrentPipelines.toString()} delta={0} deltaColor="#818cf8" deltaSuffix=""
          />

          {/* Jitter */}
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg ${jitterMs < 20 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'} border flex items-center justify-center`}>
                <Wifi className={`w-4 h-4 ${jitterMs < 20 ? 'text-emerald-400' : 'text-amber-400'}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Connection Quality</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Jitter / Packet Loss</div>
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <div>
                <span className={`text-2xl font-bold font-mono ${jitterMs < 20 ? 'text-emerald-400' : 'text-amber-400'}`}>{jitterMs.toFixed(1)}</span>
                <span className="text-sm text-slate-500 ml-1">ms jitter</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div>
                <span className={`text-2xl font-bold font-mono ${packetLossPercent < 1 ? 'text-emerald-400' : 'text-amber-400'}`}>{packetLossPercent.toFixed(1)}</span>
                <span className="text-sm text-slate-500 ml-1">% loss</span>
              </div>
            </div>
          </div>

          {/* Audio Throughput */}
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border-indigo-500/20 border flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200">Audio Throughput</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">24kHz 16-bit Mono PCM</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {throughputDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> : <TrendingDown className="w-3.5 h-3.5 text-amber-400" />}
                <span className={throughputDelta >= 0 ? 'text-indigo-400' : 'text-amber-400'}>{Math.abs(throughputDelta).toFixed(0)} kbps</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-indigo-400 mb-4 font-mono">
              {telemetry.audioThroughputKbps.toFixed(0)} <span className="text-lg">kbps</span>
            </div>
            <MiniLineChart data={telemetry.throughputHistory} maxVal={500} color="#818cf8" />
          </div>

          {/* Token Usage & Cost */}
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border-amber-500/20 border flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Token Efficiency</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Usage / Cost tracking</div>
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-xl font-bold font-mono text-amber-400">{(tokenUsageTotal / 1000).toFixed(0)}K</span>
                <span className="text-xs text-slate-500 ml-1">tokens</span>
              </div>
              <div className="w-px h-5 bg-slate-700" />
              <div>
                <span className="text-xl font-bold font-mono text-emerald-400">${estimatedCostUsd.toFixed(2)}</span>
                <span className="text-xs text-slate-500 ml-1">est. cost</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-sm font-mono text-slate-300">{telemetry.tokenGenSpeedTps.toFixed(1)} t/s</span>
              <MiniLineChart data={telemetry.tokenHistory} maxVal={120} color="#fbbf24" />
            </div>
          </div>

          {/* Failover Ratio */}
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border-indigo-500/20 border flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Failover & Resilience</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Model routing stability</div>
              </div>
            </div>
            <DonutChart
              primary={Math.round(telemetry.failoverProPrimaryPercent)}
              secondary={Math.round(telemetry.failoverFlashPercent)}
              primaryLabel="Gemini 3.1 Pro"
              secondaryLabel="Failover Flash"
              primaryColor="#10b981"
              secondaryColor="#f59e0b"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
