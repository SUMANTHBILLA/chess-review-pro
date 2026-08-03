interface EvalSparklineProps {
  scores: number[]; // engine evals in centipawns (or pawns)
  width?: number;
  height?: number;
}

export default function EvalSparkline({ scores, width = 160, height = 48 }: EvalSparklineProps) {
  if (!scores || scores.length === 0) return <div className="text-neutral-600 text-xs">No evals</div>;

  // normalize scores to range for plotting
  const max = Math.max(...scores.concat(0));
  const min = Math.min(...scores.concat(0));
  const pad = Math.max(1, (max - min) * 0.1);
  const top = max + pad;
  const bottom = min - pad;

  const points = scores.map((s, i) => {
    const x = (i / Math.max(1, scores.length - 1)) * width;
    const y = ((top - s) / (top - bottom)) * height;
    return `${x},${y}`;
  });

  const path = points.join(' ');

  return (
    <div className="px-3 py-2">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="#9CA3AF"
          strokeWidth={1.2}
          points={path}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
