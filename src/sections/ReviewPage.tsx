import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Chessboard, ChessboardProvider } from 'react-chessboard';
import { useTheme } from '@/hooks/useTheme';
import type { ParsedGame, GameReview, MoveDetail, KeyMoment, MoveClassification } from '@/types/chess';
import { saveReviewToStats } from '@/utils/statsStorage';
import {
  ChevronLeft, ChevronRight,
  Eye, EyeOff, RotateCcw, Search, BarChart3, Share2, Check, BookOpen,
  FlipVertical2,
} from 'lucide-react';
import { Chess } from 'chess.js';
import EvalGraph from '@/components/EvalGraph';
import ExplorePanel from '@/components/ExplorePanel';
import { ReviewSummary } from '@/components/ReviewSummary';
import { TacticRetryModal } from '@/components/TacticRetryModal';
import { CLASSIFICATION_COLORS } from '@/utils/classification';

interface Props {
  game: ParsedGame;
  review: GameReview;
  onBack: () => void;
}

const KEY_MOMENT_RING: Record<KeyMoment['classification'], string> = {
  brilliant: 'ring-[#81b64c]/70',
  great: 'ring-[#81b64c]/70',
  best: 'ring-[#81b64c]/70',
  excellent: 'ring-teal-400/70',
  good: 'ring-zinc-400/70',
  inaccuracy: 'ring-amber-400/70',
  mistake: 'ring-orange-400/70',
  miss: 'ring-fuchsia-400/80',
  blunder: 'ring-red-500/80',
  book: 'ring-stone-400/70',
};

const KEY_MOMENT_TAG: Record<KeyMoment['classification'], string> = {
  brilliant: 'BRILLIANT MOVE',
  great: 'KEY MOMENT',
  best: 'KEY MOMENT',
  excellent: 'KEY MOMENT',
  good: 'KEY MOMENT',
  inaccuracy: 'KEY MOMENT',
  mistake: 'KEY MOMENT',
  miss: 'MISSED TACTIC',
  blunder: 'KEY MOMENT',
  book: 'KEY MOMENT',
};

function formatEval(val: number): string {
  if (Math.abs(val) < 0.1) return '0.0';
  return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
}



function getMaterialAdvantage(fen: string) {
  const vals: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  const [board] = fen.split(' ');
  let wScore = 0, bScore = 0;

  for (const c of board) {
    const lower = c.toLowerCase();
    if (vals[lower]) {
      if (c === c.toUpperCase()) wScore += vals[lower];
      else bScore += vals[lower];
    }
  }

  const diff = wScore - bScore;
  return {
    whiteAdvantage: diff > 0 ? diff : 0,
    blackAdvantage: diff < 0 ? Math.abs(diff) : 0,
  };
}

/* ── Animated Speech Bubble & Coach Avatar ── */
function CoachBubble({
  currentDetail,
  keyMoment,
  onClick,
}: {
  currentDetail: MoveDetail | null;
  keyMoment: KeyMoment | null;
  onClick: () => void;
}) {
  const cfg = currentDetail ? CLASSIFICATION_COLORS[currentDetail.classification] : null;
  const Icon = cfg?.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={currentDetail ? `Coach analysis for ${currentDetail.san}` : 'Open coach analysis'}
      className="my-1 w-full text-left cursor-pointer transition-all active:scale-[0.99] group select-none"
    >
      <div className="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-900/90 rounded-full border border-white/10 shadow-lg backdrop-blur-md hover:border-[#81b64c]/40">
        {/* Animated Coach Avatar */}
        <div className="relative shrink-0">
          {keyMoment && (
            <span className={`absolute -inset-1 rounded-full ring-4 ${KEY_MOMENT_RING[keyMoment.classification]} animate-pulse pointer-events-none`} />
          )}
          <div className="w-7 h-7 rounded-full bg-[#81b64c] p-0.5 shadow-md animate-bounce-subtle">
            <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-[9px] font-black text-emerald-300">
              CD
            </div>
          </div>
        </div>

        {/* Speech Text */}
        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
          <div className="truncate text-xs">
            {cfg && Icon ? (
              <span className="flex items-center gap-1.5">
                <span className="font-extrabold text-white">{currentDetail?.san}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${cfg.bg} ${cfg.text} border ${cfg.border} flex items-center gap-0.5`}>
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </span>
                {keyMoment && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black animate-pulse shrink-0">
                    {KEY_MOMENT_TAG[keyMoment.classification]}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-zinc-300 font-medium">Game Review &mdash; Tap for Coach Danny's Analysis</span>
            )}
          </div>

          <span className="text-[10px] text-[#81b64c] font-mono font-bold shrink-0 bg-[#81b64c]/10 px-2 py-0.5 rounded-full border border-[#81b64c]/20">
            {currentDetail ? formatEval(currentDetail.eval) : '0.0'}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Player Bar Component ── */
function PlayerBar({
  name,
  rating,
  color,
  accuracy,
  estimatedRating,
  showAccuracy,
  materialAdvantage,
}: {
  name: string;
  rating?: number;
  color: 'white' | 'black';
  accuracy?: number;
  estimatedRating?: number;
  showAccuracy?: boolean;
  materialAdvantage?: number;
}) {
  return (
    <div className="w-full flex items-center justify-between px-4 py-2 bg-zinc-900/90 rounded-full border border-white/10 text-xs backdrop-blur-md shadow-md">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
          color === 'white' ? 'bg-white text-zinc-950 border border-zinc-300' : 'bg-zinc-950 text-white border border-zinc-700'
        }`}>
          {color === 'white' ? '♔' : '♚'}
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-extrabold text-white truncate text-xs">{name}</span>
          {rating && (
            <span className="text-[10px] text-zinc-400 font-mono">({rating})</span>
          )}
          {materialAdvantage && materialAdvantage > 0 ? (
            <span className="text-[10px] font-mono font-bold text-[#81b64c] bg-[#81b64c]/10 px-1.5 py-0.5 rounded-full border border-[#81b64c]/20">
              +{materialAdvantage}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {estimatedRating && (
          <span className="text-[10px] font-mono font-bold text-[#81b64c] bg-[#81b64c]/10 px-2 py-0.5 rounded-full border border-[#81b64c]/20 hidden sm:inline" title="Performance ELO Rating">
            ~{estimatedRating} ELO
          </span>
        )}
        {showAccuracy && accuracy !== undefined && (
          <div key={accuracy} className={`flex items-center gap-1 font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full border shadow-sm animate-pop-in ${
            color === 'white'
              ? 'bg-[#81b64c]/10 border-[#81b64c]/30 text-[#81b64c]'
              : 'bg-zinc-800 border-zinc-700 text-zinc-200'
          }`}>
            <span className="text-[10px] font-sans text-zinc-400 font-normal">Acc:</span>
            <span>{accuracy}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Interactive Coach Modal ── */
function CoachModal({
  open,
  onClose,
  currentDetail,
  onRetryMistakes,
  onTryTactic,
}: {
  open: boolean;
  onClose: () => void;
  currentDetail: MoveDetail | null;
  onRetryMistakes: () => void;
  onTryTactic: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Coach Danny's move analysis" className="w-full max-w-md bg-zinc-950 rounded-3xl border border-white/10 p-5 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <div className="w-12 h-12 rounded-full bg-[#81b64c] p-0.5 shadow-lg">
            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-sm font-black text-emerald-300">
              CD
            </div>
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Coach Danny's Move Analysis</h3>
            <span className="text-xs text-[#81b64c] font-mono">Engine-guided explanation of the position</span>
          </div>
        </div>

        {currentDetail ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-2xl border border-white/10 text-xs">
              <span className="font-extrabold text-white text-sm">Move: {currentDetail.san}</span>
              <span className="font-mono text-[#81b64c] font-extrabold">Eval: {formatEval(currentDetail.eval)}</span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-2xl border border-white/5">
              {currentDetail.classification === 'blunder' && 'Critical Blunder: this move surrendered a tactical opportunity or material advantage.'}
              {currentDetail.classification === 'mistake' && 'Mistake: a passive move that gave your opponent counterplay.'}
              {currentDetail.classification === 'inaccuracy' && 'Inaccuracy: slightly off the best line. Missed a faster attacking idea.'}
              {currentDetail.classification === 'miss' && `Miss: you had a winning tactic here (${currentDetail.bestMoveSan || 'see engine line'}) but played something else. Your position stayed sound — you just left a concrete opportunity on the table. Treat it like a puzzle: try to find it yourself.`}
              {currentDetail.classification === 'brilliant' && 'BRILLIANT!! You found a deep piece sacrifice that completely breaks open the position!'}
              {currentDetail.classification === 'great' && 'Great Move! The only move that secures the advantage!'}
              {currentDetail.classification === 'best' && 'Best Move! The Stockfish engine choice.'}
              {currentDetail.classification === 'excellent' && 'Excellent Move! Preserves the advantage smoothly.'}
              {currentDetail.classification === 'book' && 'Standard Theory: recognized opening book line.'}
              {currentDetail.classification === 'good' && 'Solid Move: keeps the position playable.'}
            </p>

            {currentDetail.bestMoveSan && (
              <div className="text-xs font-mono text-amber-400 bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20 flex items-center justify-between">
                <span>Engine Recommended Line:</span>
                <span className="font-extrabold text-amber-300">{currentDetail.bestMoveSan}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-400">
            Tap Next to step through moves. Coach Danny will explain blunders, sacrifices, and key moments.
          </p>
        )}

        <div className="flex items-center gap-2 pt-2">
          {currentDetail?.classification === 'miss' && (
            <button
              onClick={() => { onClose(); onTryTactic(); }}
              className="flex-1 py-2.5 rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-extrabold text-xs transition-all shadow-md active:scale-95"
            >
              Find the Tactic
            </button>
          )}
          <button
            onClick={() => { onClose(); onRetryMistakes(); }}
            className={`${currentDetail?.classification === 'miss' ? 'flex-1' : 'flex-1'} py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-md active:scale-95`}
          >
            Retry Mistakes
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReviewPage({ game, review }: Props) {
  const { pieces, boardTheme } = useTheme();
  const [cmi, setCmi] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showMoveTable, setShowMoveTable] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [showBestMove, setShowBestMove] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [showTacticModal, setShowTacticModal] = useState(false);
  const [copiedPgn, setCopiedPgn] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [cf, setCf] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [bestMoveSquareStyles, setBestMoveSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  const moveRibbonRef = useRef<HTMLDivElement>(null);
  const activePillRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activePillRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [cmi]);

  const totalPlies = review.moves.length * 2;

  const getMoveAtPly = useCallback((ply: number) => {
    if (ply <= 0 || ply > totalPlies) return null;
    const idx = Math.floor((ply - 1) / 2);
    const isW = (ply - 1) % 2 === 0;
    if (idx < 0 || idx >= review.moves.length) return null;
    const d = isW ? review.moves[idx].white : review.moves[idx].black;
    return d ? { ...d } : null;
  }, [review.moves, totalPlies]);

  const currentDetail = cmi === 0 ? null : getMoveAtPly(cmi);

  const keyMoment = useMemo(() => {
    if (cmi === 0) return null;
    const moveNumber = Math.floor((cmi - 1) / 2) + 1;
    const side = (cmi - 1) % 2 === 0 ? 'white' : 'black';
    return review.keyMoments.find(k => k.moveNumber === moveNumber && k.side === side) ?? null;
  }, [cmi, review.keyMoments]);

  useEffect(() => {
    saveReviewToStats(review, game);
  }, [review, game]);

  useEffect(() => {
    const ch = new Chess();
    let cnt = 0;
    const targetPly = (showBestMove && cmi > 0) ? cmi - 1 : cmi;

    for (const mp of review.moves) {
      if (cnt >= targetPly) break;
      try { ch.move(mp.white.san); cnt++; } catch { break; }
      if (mp.black && cnt < targetPly) { try { ch.move(mp.black.san); cnt++; } catch { break; } }
    }

    if (showBestMove && cmi > 0) {
      const detail = getMoveAtPly(cmi);
      if (detail) {
        let moveRes = null;
        if (detail.bestMoveSan) {
          try { moveRes = ch.move(detail.bestMoveSan); } catch { /* ignore */ }
        }
        if (!moveRes && detail.bestMoveUci && detail.bestMoveUci.length >= 4) {
          const from = detail.bestMoveUci.slice(0, 2);
          const to = detail.bestMoveUci.slice(2, 4);
          try { moveRes = ch.move({ from, to }); } catch { /* ignore */ }
        }
        if (moveRes) {
          setBestMoveSquareStyles({
            [moveRes.from]: { backgroundColor: 'rgba(251, 191, 36, 0.5)' },
            [moveRes.to]: { backgroundColor: 'rgba(251, 191, 36, 0.7)' },
          });
        } else {
          setBestMoveSquareStyles({});
        }
      } else {
        setBestMoveSquareStyles({});
      }
    } else {
      setBestMoveSquareStyles({});
    }

    setCf(ch.fen());
  }, [cmi, review.moves, showBestMove, getMoveAtPly]);

  const lastMoveSquareStyles = useMemo(() => {
    if (showBestMove || !currentDetail || !currentDetail.uci || currentDetail.uci.length < 4) return {};
    const from = currentDetail.uci.slice(0, 2);
    const to = currentDetail.uci.slice(2, 4);
    return {
      [from]: { backgroundColor: 'rgba(59, 130, 246, 0.45)', animation: 'square-pulse 0.65s ease-out' },
      [to]: { backgroundColor: 'rgba(59, 130, 246, 0.55)', animation: 'square-pulse 0.65s ease-out' },
    };
  }, [showBestMove, currentDetail]);

  const bestMoveArrows = useMemo(() => {
    if (!showBestMove || !currentDetail?.bestMoveUci || currentDetail.bestMoveUci.length < 4) return undefined;
    return [{
      startSquare: currentDetail.bestMoveUci.slice(0, 2),
      endSquare: currentDetail.bestMoveUci.slice(2, 4),
      color: 'rgba(129, 182, 76, 0.9)',
    }];
  }, [showBestMove, currentDetail]);

  const moveTo = useCallback((targetPly: number) => {
    const clamped = Math.max(0, Math.min(targetPly, totalPlies));
    setCmi(clamped);
    setShowBestMove(false);
  }, [totalPlies]);

  const handleRetryMistakes = () => {
    const priority: MoveClassification[] = ['blunder', 'mistake', 'miss'];
    const firstBad = priority
      .map(c => review.keyMoments.find(k => k.classification === c))
      .find(k => k !== undefined);
    if (firstBad) {
      const idx = review.moves.findIndex(m => m.moveNumber === firstBad.moveNumber);
      if (idx !== -1) {
        const ply = idx * 2 + (firstBad.side === 'white' ? 1 : 2);
        moveTo(ply);
        setShowBestMove(true);
      }
    } else {
      moveTo(1);
    }
  };

  const fenBeforeMiss = useMemo(() => {
    if (cmi === 0 || currentDetail?.classification !== 'miss') return null;
    const ch = new Chess();
    let count = 0;
    for (const m of game.moves) {
      if (count >= cmi - 1) break;
      try { ch.move(m); count++; } catch { break; }
    }
    return ch.fen();
  }, [cmi, currentDetail, game.moves]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') moveTo(cmi - 1);
      else if (e.key === 'ArrowRight') moveTo(cmi + 1);
      else if (e.key === 'Home') moveTo(0);
      else if (e.key === 'End') moveTo(totalPlies);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cmi, moveTo, totalPlies]);

  const evalValue = currentDetail ? currentDetail.eval : 0;
  const evalBarPercent = Math.max(5, Math.min(95, 50 + (evalValue * 8)));
  const { whiteAdvantage, blackAdvantage } = getMaterialAdvantage(cf);
  const allEvals = [0, ...review.moves.flatMap(m => [m.white.eval, m.black ? m.black.eval : m.white.eval])];

  const handleSharePgn = () => {
    let annotated = `[Event "Game Review"]\n[Site "Chess Review App"]\n[White "${game.white}"]\n[Black "${game.black}"]\n[Result "${game.result}"]\n[Opening "${review.opening}"]\n[WhiteAccuracy "${review.accuracy.white}%"]\n[BlackAccuracy "${review.accuracy.black}%"]\n\n`;
    review.moves.forEach((m) => {
      annotated += `${m.moveNumber}. ${m.white.san} {eval: ${m.white.eval}, class: ${m.white.classification}} `;
      if (m.black) {
        annotated += `${m.black.san} {eval: ${m.black.eval}, class: ${m.black.classification}} `;
      }
    });
    navigator.clipboard.writeText(annotated.trim());
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  return (
    <div className="w-full flex-1 bg-transparent text-zinc-100 flex flex-col justify-between py-1.5 max-w-xl mx-auto px-3 selection:bg-[#81b64c]/30">

      {/* ── TOP HEADER WITH SHARE & OPENING EXPLORER TOGGLE ── */}
      <div className="flex items-center justify-between text-xs bg-zinc-900/90 rounded-full border border-white/10 px-4 py-2 mb-1 shrink-0 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-1.5 min-w-0">
          <BookOpen className="w-3.5 h-3.5 text-[#81b64c] shrink-0" />
          <span className="text-white font-extrabold truncate text-xs">{review.opening}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowExplorer(!showExplorer)}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all active:scale-95 ${
              showExplorer ? 'bg-[#81b64c] text-white shadow-md' : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            Explorer
          </button>
          <button
            onClick={() => setFlipped(f => !f)}
            title="Flip board orientation"
            aria-label="Flip board orientation"
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all text-[11px] font-extrabold active:scale-95 ${
              flipped ? 'bg-[#81b64c] text-white shadow-md' : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            <FlipVertical2 className="w-3 h-3" />
            <span className="hidden sm:inline">Flip</span>
          </button>
          <button
            onClick={handleSharePgn}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all text-[11px] font-semibold active:scale-95"
            title="Share Annotated PGN"
          >
            {copiedPgn ? <Check className="w-3 h-3 text-[#81b64c]" /> : <Share2 className="w-3 h-3 text-zinc-400" />}
            <span>{copiedPgn ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* ── GAME SUMMARY (accuracy dials + move quality) ── */}
      <ReviewSummary game={game} review={review} />

      {/* ── OPENING EXPLORER PANEL ── */}
      {showExplorer && (
        <div className="mb-1.5">
          <ExplorePanel fen={cf} />
        </div>
      )}

      {/* ── COACH SPEECH BUBBLE ── */}
      <div key={cmi} className="animate-slide-in-left">
        <CoachBubble currentDetail={currentDetail} keyMoment={keyMoment} onClick={() => setShowCoachModal(true)} />
      </div>

      {/* ── MAIN CHESS.COM BOARD & PLAYER CARDS CONTAINER ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-transparent px-0 relative my-0" style={{ minHeight: 0 }}>
        <div className="w-full max-w-[min(100%,430px)] flex flex-col gap-1.5">

          {/* 🔴 TOP PLAYER BAR (Black Player) */}
          <PlayerBar
            name={game.black}
            rating={game.blackRating}
            color="black"
            accuracy={review.accuracy.black}
            estimatedRating={review.black.estimatedRating}
            showAccuracy={showAnalysis}
            materialAdvantage={blackAdvantage}
          />

          {/* BOARD + EVAL BAR ROW */}
          <div className="flex gap-2 items-center">
            {/* Evaluation Bar */}
            {showAnalysis && (
              <div className="w-3 h-[min(100%,410px)] aspect-[1/16] bg-zinc-950 rounded-full overflow-hidden flex flex-col justify-end border border-white/10 relative shadow-inner shrink-0">
                <div
                  className="bg-[#81b64c] transition-all w-full rounded-b-full shadow-md"
                  style={{ height: `${evalBarPercent}%`, transition: 'height 500ms cubic-bezier(0.34, 1.3, 0.5, 1)' }}
                />
                <div className="absolute top-1 left-0 right-0 text-[10px] font-mono text-center font-extrabold text-zinc-400 pointer-events-none">
                  {formatEval(evalValue)}
                </div>
              </div>
            )}

            {/* Chessboard Frame */}
            <div className="flex-1 aspect-square relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <ChessboardProvider options={{
                pieces,
                position: cf,
                boardOrientation: flipped ? 'black' : 'white',
                darkSquareStyle: { backgroundColor: boardTheme.dark, backgroundImage: boardTheme.darkTexture },
                lightSquareStyle: { backgroundColor: boardTheme.light, backgroundImage: boardTheme.lightTexture },
                showNotation: true,
                animationDurationInMs: 150,
                allowDrawingArrows: true,
                arrows: bestMoveArrows,
                squareStyles: { ...lastMoveSquareStyles, ...bestMoveSquareStyles },
              }}>
                <Chessboard />
              </ChessboardProvider>
            </div>
          </div>

          {/* ⚪ BOTTOM PLAYER BAR (White Player) */}
          <PlayerBar
            name={game.white}
            rating={game.whiteRating}
            color="white"
            accuracy={review.accuracy.white}
            estimatedRating={review.white.estimatedRating}
            showAccuracy={showAnalysis}
            materialAdvantage={whiteAdvantage}
          />

        </div>
      </div>

      {/* ── CENTIPAWN EVALUATION GRAPH ── */}
      {showAnalysis && (
        <div className="my-1">
          <EvalGraph evals={allEvals} ply={cmi} onSeek={moveTo} />
        </div>
      )}

      {/* ── CHESS.COM MOVE RIBBON ── */}
      <div className="my-1 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 rounded-full border border-white/10 backdrop-blur-md shadow-md">
        <button onClick={() => moveTo(cmi - 1)} disabled={cmi === 0} className="text-zinc-400 hover:text-white p-1 disabled:opacity-20 shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div ref={moveRibbonRef} className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar font-mono text-xs text-zinc-300 whitespace-nowrap py-0.5">
          {review.moves.map((mp, i) => {
            const wp = i * 2 + 1; const bp = i * 2 + 2;
            const wAct = cmi === wp; const bAct = cmi === bp;
            const wCfg = CLASSIFICATION_COLORS[mp.white.classification];
            const bCfg = mp.black ? CLASSIFICATION_COLORS[mp.black.classification] : null;
            return (
              <div key={mp.moveNumber} className="flex items-center gap-1 shrink-0">
                <span className="text-zinc-400 text-[11px] font-bold">{mp.moveNumber}.</span>
                {/* White */}
                <button
                  ref={wAct ? activePillRef : undefined}
                  key={wAct ? `wp-${cmi}` : `wp-${wp}`}
                  onClick={() => moveTo(wp)}
                  className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                    wAct
                      ? 'bg-white text-zinc-950 shadow-md font-extrabold underline animate-pop-in'
                      : `hover:bg-zinc-800 ${wCfg.text}`
                  }`}
                >
                  {mp.white.san}
                </button>

                {/* Black */}
                {mp.black && bCfg && (
                  <button
                    ref={bAct ? activePillRef : undefined}
                    key={bAct ? `bp-${cmi}` : `bp-${bp}`}
                    onClick={() => moveTo(bp)}
                    className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                      bAct
                        ? 'bg-white text-zinc-950 shadow-md font-extrabold underline animate-pop-in'
                        : `hover:bg-zinc-800 ${bCfg.text}`
                    }`}
                  >
                    {mp.black.san}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={() => moveTo(cmi + 1)} disabled={cmi >= totalPlies} className="text-zinc-400 hover:text-white p-1 disabled:opacity-20 shrink-0">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── BOTTOM ACTION BAR (5 Clean Control Pills) ── */}
      <div className="flex items-center justify-between gap-1.5 pt-1">
        {/* 1. Show Button */}
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className={`lift-hover flex-1 flex flex-col items-center justify-center p-2 rounded-2xl text-[11px] font-extrabold transition-all active:scale-95 ${
            showAnalysis ? 'text-[#81b64c] bg-[#81b64c]/10 border border-[#81b64c]/20' : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          {showAnalysis ? <EyeOff className="w-4 h-4 mb-0.5 text-[#81b64c]" /> : <Eye className="w-4 h-4 mb-0.5" />}
          <span>{showAnalysis ? 'Hide' : 'Show'}</span>
        </button>

        {/* 2. Best Button */}
        <button
          onClick={() => setShowBestMove(!showBestMove)}
          disabled={!currentDetail}
          className={`lift-hover flex-1 flex flex-col items-center justify-center p-2 rounded-2xl text-[11px] font-extrabold transition-all active:scale-95 disabled:opacity-30 ${
            showBestMove
              ? 'text-amber-400 bg-amber-500/20 border border-amber-500/40 shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <Search className={`w-4 h-4 mb-0.5 ${showBestMove ? 'text-amber-400' : ''}`} />
          <span>{showBestMove ? 'Reset' : 'Best'}</span>
        </button>

        {/* 3. Retry Mistakes Button */}
        <button
          onClick={handleRetryMistakes}
          className="lift-hover flex-1 flex flex-col items-center justify-center p-2 rounded-2xl text-[11px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:text-amber-300 transition-all active:scale-95"
          title="Jump to blunders and retry correct moves"
        >
          <RotateCcw className="w-4 h-4 mb-0.5 text-amber-400" />
          <span>Retry</span>
        </button>

        {/* 4. Table Button */}
        <button
          onClick={() => setShowMoveTable(true)}
          className="lift-hover flex-1 flex flex-col items-center justify-center p-2 rounded-2xl text-[11px] font-extrabold text-zinc-300 bg-zinc-900/60 hover:text-white transition-all active:scale-95"
        >
          <BarChart3 className="w-4 h-4 mb-0.5 text-[#81b64c]" />
          <span>Table</span>
        </button>

        {/* 5. Primary Next Button */}
        <button
          onClick={() => moveTo(cmi + 1)}
          disabled={cmi >= totalPlies}
          className="flex-[1.5] py-2.5 rounded-full bg-[#81b64c] hover:bg-[#74a544] text-white font-black text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1 disabled:opacity-30 animate-glow-pulse"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* Coach Modal */}
      <CoachModal
        open={showCoachModal}
        onClose={() => setShowCoachModal(false)}
        currentDetail={currentDetail}
        onRetryMistakes={handleRetryMistakes}
        onTryTactic={() => setShowTacticModal(true)}
      />

      {/* Missed Tactic Retry Modal */}
      {fenBeforeMiss && currentDetail && (() => {
        const missSide = (cmi - 1) % 2 === 0 ? 'white' : 'black';
        const evalAfterTactic = keyMoment
          ? (missSide === 'black' ? -keyMoment.evalBefore : keyMoment.evalBefore)
          : currentDetail.eval;
        return (
          <TacticRetryModal
            open={showTacticModal}
            onClose={() => setShowTacticModal(false)}
            fen={fenBeforeMiss}
            bestMoveUci={currentDetail.bestMoveUci || 'e2e4'}
            bestMoveSan={currentDetail.bestMoveSan || ''}
            evalAfterTactic={evalAfterTactic}
            side={missSide}
            playerName={missSide === 'black' ? game.black : game.white}
          />
        );
      })()}

      {/* Full Move Table Modal */}
      {showMoveTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowMoveTable(false)}>
          <div className="w-full max-w-md bg-zinc-950 rounded-3xl border border-white/10 p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-white text-base">Full Game Move Table</h3>
              <button onClick={() => setShowMoveTable(false)} className="px-3.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full text-xs font-bold text-zinc-300">
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {review.moves.map(m => (
                <div key={m.moveNumber} className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900 border border-white/5 text-xs font-mono">
                  <span className="text-zinc-400 font-bold w-8">{m.moveNumber}.</span>
                  {(() => {
                    const cfg = CLASSIFICATION_COLORS[m.white.classification];
                    return (
                      <button
                        onClick={() => { moveTo(m.moveNumber * 2 - 1); setShowMoveTable(false); }}
                        className="flex-1 text-left font-bold text-[#81b64c] hover:underline flex items-center gap-1.5 min-w-0"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.text}`} style={{ background: 'currentColor' }} title={cfg.label} />
                        <span className="truncate">{m.white.san} ({formatEval(m.white.eval)})</span>
                      </button>
                    );
                  })()}
                  {m.black && (
                    (() => {
                      const cfg = CLASSIFICATION_COLORS[m.black.classification];
                      return (
                        <button
                          onClick={() => { moveTo(m.moveNumber * 2); setShowMoveTable(false); }}
                          className="flex-1 text-left font-bold text-[#81b64c] hover:underline flex items-center gap-1.5 min-w-0"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.text}`} style={{ background: 'currentColor' }} title={cfg.label} />
                          <span className="truncate">{m.black.san} ({formatEval(m.black.eval)})</span>
                        </button>
                      );
                    })()
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
