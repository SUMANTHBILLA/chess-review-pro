import { useEffect, useState } from 'react';
import { ChevronDown, Trophy, AlertTriangle, Sparkles } from 'lucide-react';
import type { GameReview, ParsedGame, MoveClassification } from '@/types/chess';
import { CLASSIFICATION_BAR_COLORS, CLASSIFICATION_COLORS, CLASSIFICATION_ORDER } from '@/utils/classification';

interface Props {
  game: ParsedGame;
  review: GameReview;
}

/** Eased count-up animation for numeric values */
function useCountUp(target: number, duration = 950, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const t = setTimeout(() => {
      const step = (ts: number) => {
        if (start === null) start = ts;
        const p = Math.min(1, (ts - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(target * eased));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return val;
}

function AccDial({
  label,
  value,
  accent,
  track,
  estRating,
  delay = 0,
}: {
  label: string;
  value: number;
  accent: string;
  track: string;
  estRating?: number;
  delay?: number;
}) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const animated = useCountUp(value, 950, delay);
  const [ringOn, setRingOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRingOn(true), delay + 80);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0 animate-pop-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="relative w-[92px] h-[92px] shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke={track} strokeWidth="7" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={ringOn ? c * (1 - pct / 100) : c}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.2, 0.5, 1)' }}
            className="drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black font-mono text-white leading-none">{animated}</span>
          <span className="text-[9px] text-zinc-400 font-mono mt-0.5">ACC</span>
        </div>
      </div>
      <span className="text-[11px] font-extrabold text-zinc-200 truncate max-w-full">{label}</span>
      {estRating !== undefined && (
        <span className="text-[10px] font-mono font-bold text-zinc-400 flex items-center gap-1 animate-fade-up" style={{ animationDelay: `${delay + 500}ms` }}>
          <Trophy className="w-3 h-3 text-amber-400" />
          ~{estRating} ELO
        </span>
      )}
    </div>
  );
}

export function ReviewSummary({ game, review }: Props) {
  const [open, setOpen] = useState(true);

  const counts = new Map<MoveClassification, number>();
  review.moves.forEach(m => {
    counts.set(m.white.classification, (counts.get(m.white.classification) || 0) + 1);
    if (m.black) counts.set(m.black.classification, (counts.get(m.black.classification) || 0) + 1);
  });

  const totalMoves = review.moves.reduce((s, m) => s + (m.black ? 2 : 1), 0);
  const notable = [...counts.entries()].filter(([k]) =>
    ['brilliant', 'great', 'miss', 'inaccuracy', 'mistake', 'blunder'].includes(k)
  );
  const keyMomentCount = review.keyMoments.length;
  const bestCount = (counts.get('best') || 0) + (counts.get('excellent') || 0) + (counts.get('great') || 0) + (counts.get('brilliant') || 0);

  return (
    <div className="w-full bg-zinc-900/90 rounded-3xl border border-white/10 backdrop-blur-md shadow-lg overflow-hidden mb-1.5 animate-slide-in-up">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-black text-white uppercase tracking-wider shrink-0">Game Summary</span>
          <span className="text-[10px] bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30 font-mono font-bold px-2 py-0.5 rounded-full shrink-0 animate-pop-in">
            {game.result}
          </span>
          {notable.length > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full shrink-0 animate-slide-in-right">
              <AlertTriangle className="w-2.5 h-2.5" />
              {notable.reduce((s, [, n]) => s + n, 0)} notable moves
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Accuracy Dials */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 pt-1">
            <AccDial label={game.white || 'White'} value={review.accuracy.white} accent="#34d399" track="#1f2937" estRating={review.white.estimatedRating} delay={120} />
            <div className="flex flex-col items-center gap-1 animate-pop-in" style={{ animationDelay: '260ms' }}>
              <span className="text-[10px] text-zinc-500 font-mono uppercase">vs</span>
              <span className="text-2xl font-black font-mono text-zinc-500 leading-none">|</span>
            </div>
            <AccDial label={game.black || 'Black'} value={review.accuracy.black} accent="#38bdf8" track="#1f2937" estRating={review.black.estimatedRating} delay={300} />
          </div>

          {/* Classification Stacked Bar */}
          <div className="animate-fade-up" style={{ animationDelay: '450ms' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Move Quality</span>
              <span className="text-[10px] font-mono text-zinc-500">{bestCount} strong · {totalMoves} moves</span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-zinc-800">
              {CLASSIFICATION_ORDER.filter(k => (counts.get(k) || 0) > 0).map((k, i) => (
                <div
                  key={k}
                  title={`${CLASSIFICATION_COLORS[k].label}: ${counts.get(k)}`}
                  className="h-full first:rounded-l-full last:rounded-r-full animate-bar-grow"
                  style={{
                    width: `${((counts.get(k) || 0) / totalMoves) * 100}%`,
                    backgroundColor: CLASSIFICATION_BAR_COLORS[k],
                    minWidth: 2,
                    animationDelay: `${500 + i * 70}ms`,
                  }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {CLASSIFICATION_ORDER.filter(k => (counts.get(k) || 0) > 0).map((k, i) => {
                const cfg = CLASSIFICATION_COLORS[k];
                const Icon = cfg.icon;
                return (
                  <span
                    key={k}
                    className={`flex items-center gap-1 text-[10px] font-mono font-bold ${cfg.text} animate-fade-up`}
                    style={{ animationDelay: `${600 + i * 60}ms` }}
                  >
                    <Icon className="w-3 h-3" />
                    {cfg.label} {counts.get(k)}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Key moments strip */}
          {keyMomentCount > 0 && (
            <div className="flex items-center gap-2 bg-[#1e1c1a] border border-white/5 rounded-2xl px-3 py-2 text-[11px] animate-slide-in-up" style={{ animationDelay: '700ms' }}>
              <Sparkles className="w-3.5 h-3.5 text-[#81b64c] shrink-0 animate-glow-pulse rounded-full" />
              <span className="text-zinc-300 font-medium">
                <span className="font-extrabold text-white">{keyMomentCount} key moment{keyMomentCount > 1 ? 's' : ''}</span> to review — the coach will walk you through them.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
