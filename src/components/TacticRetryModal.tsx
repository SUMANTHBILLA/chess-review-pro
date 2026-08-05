import { useState } from 'react';
import { Chessboard, ChessboardProvider } from 'react-chessboard';
import { useTheme } from '@/hooks/useTheme';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { CircleSlash, Lightbulb, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  fen: string;
  bestMoveUci: string;
  bestMoveSan: string;
  evalAfterTactic: number;
  side: 'white' | 'black';
  playerName: string;
}

type Status = 'solving' | 'correct' | 'revealed';

function formatEval(val: number): string {
  if (Math.abs(val) < 0.1) return '0.0';
  return val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
}

export function TacticRetryModal({ open, onClose, fen, bestMoveUci, bestMoveSan, evalAfterTactic, side, playerName }: Props) {
  const { pieces, boardTheme } = useTheme();
  const [status, setStatus] = useState<Status>('solving');
  const [attempts, setAttempts] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [clickSource, setClickSource] = useState<string | null>(null);

  if (!open) return null;

  const boardFen = status === 'revealed' ? revealFen(fen, bestMoveUci) : fen;

  const handleDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean => {
    if (status !== 'solving' || !targetSquare) return false;
    return tryMove(sourceSquare, targetSquare);
  };

  const handleSquareClick = ({ square }: { square: string }) => {
    if (status !== 'solving') return;
    const chess = new Chess(fen);
    const piece = chess.get(square as Square);
    if (clickSource === square) {
      setClickSource(null);
      return;
    }
    if (piece && piece.color === (side === 'white' ? 'w' : 'b')) {
      setClickSource(square);
      return;
    }
    if (clickSource) {
      tryMove(clickSource, square);
      setClickSource(null);
    }
  };

  const tryMove = (from: string, to: string): boolean => {
    const g = new Chess(fen);
    let m;
    try { m = g.move({ from, to, promotion: 'q' }); } catch { /* illegal */ }
    if (!m) return false;
    const uci = m.from + m.to;
    if (uci === bestMoveUci) {
      setStatus('correct');
      return true;
    }
    const next = attempts + 1;
    setAttempts(next);
    if (next >= 3) {
      setStatus('revealed');
    }
    return false;
  };

  const reveal = () => {
    setStatus('revealed');
    setHintShown(false);
  };

  const reset = () => {
    setStatus('solving');
    setAttempts(0);
    setHintShown(false);
    setClickSource(null);
  };

  const sourceSquare = bestMoveUci.slice(0, 2);
  const squareStyles =
    status === 'solving' && hintShown
      ? { [sourceSquare]: { backgroundColor: 'rgba(234, 179, 8, 0.65)', border: '2px solid #fbbf24' } }
      : clickSource
        ? { [clickSource]: { backgroundColor: 'rgba(59, 130, 246, 0.5)' } }
        : {};

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Missed tactic retry"
        className="w-full max-w-md bg-zinc-950 rounded-3xl border border-white/10 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center shrink-0">
            <CircleSlash className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-white text-base">Missed Tactic — Find It!</h3>
            <p className="text-xs text-zinc-400 truncate">
              {playerName} had a winning chance here and played something else. Can you spot {bestMoveSan}?
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="w-full max-w-[300px] aspect-square relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <ChessboardProvider options={{
              pieces,
              position: boardFen,
              boardOrientation: side === 'white' ? 'white' : 'black',
              darkSquareStyle: { backgroundColor: boardTheme.dark, backgroundImage: boardTheme.darkTexture },
              lightSquareStyle: { backgroundColor: boardTheme.light, backgroundImage: boardTheme.lightTexture },
              showNotation: false,
              animationDurationInMs: 150,
              squareStyles,
              onPieceDrop: handleDrop,
              onSquareClick: handleSquareClick,
            }}>
              <Chessboard />
            </ChessboardProvider>
          </div>

          {status === 'solving' && (
            <p className="text-[11px] text-zinc-500 text-center">
              {side === 'white' ? 'White' : 'Black'} to move — {attempts > 0 ? `${attempts}/3 tries used` : 'drag or tap a piece to try a move'}
            </p>
          )}

          {status === 'solving' && attempts >= 1 && (
            <button
              onClick={reveal}
              className="w-full py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-white/10 transition-all active:scale-95"
            >
              Show me the tactic
            </button>
          )}

          {status === 'correct' && (
            <div className="w-full space-y-3 animate-in slide-in-from-bottom-3">
              <div className="flex items-center gap-2 bg-[#81b64c]/10 border border-[#81b64c]/30 rounded-2xl px-3 py-2.5 text-emerald-300 text-sm font-extrabold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Correct! {bestMoveSan} is the tactic.
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-2xl border border-white/5">
                Playing <span className="font-bold text-fuchsia-300">{bestMoveSan}</span> would have taken the position to{' '}
                <span className="font-mono font-bold text-[#81b64c]">{formatEval(evalAfterTactic)}</span> for {side === 'white' ? 'White' : 'Black'} —
                the advantage that was left on the board. Add this pattern to your training: spotting it in your own games is how it sticks.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-full bg-[#81b64c] hover:bg-[#74a544] text-white font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
              >
                Continue Review <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}

          {status === 'revealed' && (
            <div className="w-full space-y-3 animate-in slide-in-from-bottom-3">
              <div className="flex items-center gap-2 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-2xl px-3 py-2.5 text-fuchsia-300 text-sm font-extrabold">
                <XCircle className="w-4 h-4 shrink-0" />
                The tactic was {bestMoveSan}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-2xl border border-white/5">
                The board now shows the winning move. Playing it reaches{' '}
                <span className="font-mono font-bold text-[#81b64c]">{formatEval(evalAfterTactic)}</span> for {side === 'white' ? 'White' : 'Black'}.
                Try setting this up later as a puzzle to review again.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="flex-1 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-white/10 transition-all active:scale-95"
                >
                  Try again
                </button>
                <button
                  onClick={onClose}
                  className="flex-[1.5] py-2.5 rounded-full bg-[#81b64c] hover:bg-[#74a544] text-white font-black text-xs transition-all shadow-md active:scale-95"
                >
                  Continue Review
                </button>
              </div>
            </div>
          )}
        </div>

        {status === 'solving' && !hintShown && attempts < 3 && (
          <button
            onClick={() => setHintShown(true)}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-full text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all active:scale-95"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Hint: highlight the source square
          </button>
        )}
      </div>
    </div>
  );
}

function revealFen(fen: string, bestMoveUci: string): string {
  try {
    const chess = new Chess(fen);
    const from = bestMoveUci.slice(0, 2);
    const to = bestMoveUci.slice(2, 4);
    const promo = bestMoveUci.length > 4 ? (bestMoveUci[4] as 'q' | 'r' | 'b' | 'n') : undefined;
    chess.move({ from, to, promotion: promo });
    return chess.fen();
  } catch {
    return fen;
  }
}
