import { useRef, useEffect, useCallback } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  phase: 'idle' | 'handshake' | 'user_speaking' | 'model_processing' | 'agent_speaking' | 'disconnecting' | 'disconnected';
}

export default function AudioVisualizer({ isActive, phase }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height);

    const currentPhase = phaseRef.current;
    const isUserSpeaking = currentPhase === 'user_speaking';
    const isAgentSpeaking = currentPhase === 'agent_speaking';
    const isProcessing = currentPhase === 'model_processing';
    const isActivePhase = isUserSpeaking || isAgentSpeaking || isProcessing;

    if (!isActivePhase) {
      // Draw flat line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.15)';
      ctx.lineWidth = 2;
      const y = height / 2;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      return;
    }

    const centerY = height / 2;

    // Draw waveform based on phase
    const amplitude = isProcessing ? 8 : (isUserSpeaking ? 40 : 55);
    const frequency = isProcessing ? 0.02 : (isUserSpeaking ? 0.03 : 0.025);
    const speed = isProcessing ? 0.001 : 0.003;

    // Primary wave
    ctx.beginPath();
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    if (isUserSpeaking) {
      gradient.addColorStop(0, 'rgba(52, 211, 153, 0.2)');
      gradient.addColorStop(0.5, 'rgba(52, 211, 153, 0.6)');
      gradient.addColorStop(1, 'rgba(52, 211, 153, 0.2)');
    } else if (isAgentSpeaking) {
      gradient.addColorStop(0, 'rgba(129, 140, 248, 0.2)');
      gradient.addColorStop(0.5, 'rgba(129, 140, 248, 0.6)');
      gradient.addColorStop(1, 'rgba(129, 140, 248, 0.2)');
    } else {
      gradient.addColorStop(0, 'rgba(251, 191, 36, 0.2)');
      gradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.4)');
      gradient.addColorStop(1, 'rgba(251, 191, 36, 0.2)');
    }

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.5;

    for (let x = 0; x < width; x++) {
      const noise = Math.sin(x * 0.1 + time * speed * 3) * 0.3 +
                    Math.sin(x * 0.05 + time * speed * 1.7) * 0.2;
      const wave = Math.sin(x * frequency + time * speed) * amplitude * (1 + noise);
      const y = centerY + wave;

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill area under wave
    ctx.lineTo(width, centerY);
    ctx.lineTo(0, centerY);
    ctx.closePath();

    const fillGradient = ctx.createLinearGradient(0, centerY - amplitude, 0, centerY + amplitude);
    if (isUserSpeaking) {
      fillGradient.addColorStop(0, 'rgba(52, 211, 153, 0.08)');
      fillGradient.addColorStop(0.5, 'rgba(52, 211, 153, 0.02)');
      fillGradient.addColorStop(1, 'rgba(52, 211, 153, 0.08)');
    } else if (isAgentSpeaking) {
      fillGradient.addColorStop(0, 'rgba(129, 140, 248, 0.08)');
      fillGradient.addColorStop(0.5, 'rgba(129, 140, 248, 0.02)');
      fillGradient.addColorStop(1, 'rgba(129, 140, 248, 0.08)');
    } else {
      fillGradient.addColorStop(0, 'rgba(251, 191, 36, 0.05)');
      fillGradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.01)');
      fillGradient.addColorStop(1, 'rgba(251, 191, 36, 0.05)');
    }
    ctx.fillStyle = fillGradient;
    ctx.fill();

    // Secondary harmonic wave (lighter)
    ctx.beginPath();
    ctx.strokeStyle = isUserSpeaking ? 'rgba(52, 211, 153, 0.2)' : isAgentSpeaking ? 'rgba(129, 140, 248, 0.2)' : 'rgba(251, 191, 36, 0.15)';
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x++) {
      const wave2 = Math.sin(x * frequency * 2.3 + time * speed * 1.5) * amplitude * 0.4;
      const y = centerY + wave2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();

    let time = 0;
    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      draw(ctx, rect.width, rect.height, time);
      time += 16;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [draw]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-40"
      style={{ display: 'block' }}
    />
  );
}
