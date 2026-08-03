import React from 'react';

interface EvalGraphProps {
  evals: number[];
  ply: number;
  onSeek?: (ply: number) => void;
}

/** Interactive Centipawn / Pawn Evaluation Timeline Graph */
export default function EvalGraph({ evals, ply, onSeek }: EvalGraphProps) {
  const N = evals.length;
  if (N < 2) return null;

  const W = 340;
  const H = 56;
  const isCentipawns = evals.some(e => Math.abs(e) > 20);
  const CAP = isCentipawns ? 600 : 5;

  const x = (i: number) => (i / (N - 1)) * W;
  const y = (evalVal: number) => {
    const clamped = Math.max(-CAP, Math.min(CAP, evalVal));
    return H / 2 - (clamped / CAP) * (H / 2 - 4);
  };

  const points = evals.map((e, i) => `${x(i).toFixed(1)},${y(e).toFixed(1)}`).join(' ');
  const areaPoints = `0,${H / 2} ${points} ${W},${H / 2}`;

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const targetPly = Math.max(0, Math.min(N - 1, Math.round(frac * (N - 1))));
    onSeek?.(targetPly);
  }

  return (
    <div className="w-full bg-zinc-950/80 rounded-2xl border border-white/10 p-2 shadow-inner">
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1 px-1">
        <span className="text-emerald-400 font-bold">White Advantage (+)</span>
        <span>Click Graph to Seek Move</span>
        <span className="text-rose-400 font-bold">Black Advantage (-)</span>
      </div>
      <svg
        className="w-full cursor-pointer overflow-visible select-none"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        onClick={handleClick}
        style={{ height: 48 }}
      >
        {/* White / Black Background Fills */}
        <rect x="0" y="0" width={W} height={H / 2} fill="rgba(16, 185, 129, 0.08)" />
        <rect x="0" y={H / 2} width={W} height={H / 2} fill="rgba(244, 63, 94, 0.08)" />

        {/* Center Zero-Eval Axis */}
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255, 255, 255, 0.15)" strokeWidth={1} strokeDasharray="3,3" />

        {/* Dynamic Eval Curve Fill & Line */}
        <polygon points={areaPoints} fill="rgba(16, 185, 129, 0.18)" />
        <polyline points={points} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Current Move Seek Indicator Line */}
        <line
          x1={x(ply)}
          y1="0"
          x2={x(ply)}
          y2={H}
          stroke="#38bdf8"
          strokeWidth={2}
          className="transition-all duration-150"
        />
        <circle cx={x(ply)} cy={y(evals[ply] || 0)} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
