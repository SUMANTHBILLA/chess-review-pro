import { loadOpenings, posKey, detectOpeningFromMoves } from '@/utils/openingBook';
import { saveReviewToStats, getCachedGameReview } from '@/utils/statsStorage';
import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import type {
  ParsedGame,
  AnalyzedMove,
  MoveDetail,
  GameReview,
  KeyMoment,
  MoveClassification,
} from '@/types/chess';
import type { EngineAnalysis } from '@/hooks/useChessEngine';

// ── Detection helpers ──────────────────────────────────────────────────────

/** Detect brilliant: piece sacrifice + best move + solid evaluation. */
function detectBrilliant(
  fenBefore: string,
  moveSan: string,
  evalBefore: number,
  evalAfter: number,
  isBestMove: boolean,
  side: 'w' | 'b'
): boolean {
  if (!isBestMove) return false;
  const sideFactor = side === 'w' ? 1 : -1;
  const netEvalAfter = evalAfter * sideFactor;
  const netEvalBefore = evalBefore * sideFactor;

  if (netEvalAfter < netEvalBefore - 0.6) return false;

  try {
    const chess = new Chess(fenBefore);
    const move = chess.move(moveSan);
    if (!move) return false;

    const vals: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
    const pieceVal = vals[move.piece] || 1;
    const capturedVal = move.captured ? (vals[move.captured] || 0) : 0;

    if (move.captured && pieceVal > capturedVal && pieceVal >= 3) {
      return true;
    }
    if (!move.captured && pieceVal >= 3 && netEvalAfter >= 0.5) {
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

/** Detect great: critical sole winning move or large evaluation gain. */
function detectGreat(
  evalBefore: number,
  evalAfter: number,
  isBestMove: boolean,
  side: 'w' | 'b'
): boolean {
  if (!isBestMove) return false;
  const sideFactor = side === 'w' ? 1 : -1;
  const evalGain = (evalAfter - evalBefore) * sideFactor;
  return evalGain >= 1.0;
}

function classifyMove(
  fenBefore: string,
  evalBefore: number,
  evalAfter: number,
  side: 'w' | 'b',
  isBestMove: boolean,
  moveSan: string,
  isBook: boolean
): MoveClassification {
  if (isBook) return 'book';
  if (detectBrilliant(fenBefore, moveSan, evalBefore, evalAfter, isBestMove, side)) return 'brilliant';
  if (detectGreat(evalBefore, evalAfter, isBestMove, side)) return 'great';
  if (isBestMove) return 'best';

  const evalDiff = side === 'w' ? evalBefore - evalAfter : evalAfter - evalBefore;
  if (evalDiff < 0.25) return 'excellent';
  if (evalDiff < 0.5) return 'good';
  if (evalDiff < 1.0) return 'inaccuracy';
  if (evalDiff < 2.5) return 'mistake';
  return 'blunder';
}

// ── Scoring helpers ────────────────────────────────────────────────────────

function getClassifications(moves: AnalyzedMove[], side: 'white' | 'black') {
  const counts: Record<MoveClassification, number> = { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, book: 0 };
  moves.forEach(m => {
    const mv = side === 'white' ? m.white : m.black;
    if (mv) counts[mv.classification]++;
  });
  return counts;
}

function calculateAccuracy(classifications: Record<string, number>) {
  const weights: Record<string, number> = { brilliant: 100, great: 95, best: 90, excellent: 85, good: 70, inaccuracy: 40, mistake: 20, blunder: 0, book: 90 };
  let total = 0, count = 0;
  Object.entries(classifications).forEach(([k, v]) => { total += v * (weights[k] || 50); count += v; });
  return count > 0 ? Math.round((total / count) * 10) / 10 : 50;
}

function estimateElo(accuracy: number): number {
  if (accuracy >= 98) return 2600;
  if (accuracy >= 94) return 2350;
  if (accuracy >= 89) return 2100;
  if (accuracy >= 84) return 1850;
  if (accuracy >= 78) return 1600;
  if (accuracy >= 70) return 1350;
  if (accuracy >= 60) return 1100;
  if (accuracy >= 50) return 850;
  return 650;
}

// ── Depth selection ────────────────────────────────────────────────────────

function pickDepth(moveIndex: number, pieceCount: number): { depth: number; movetime: number } {
  if (pieceCount <= 8) return { depth: 12, movetime: 800 };
  if (moveIndex < 20)  return { depth: 12, movetime: 800 };
  if (moveIndex < 40)  return { depth: 12, movetime: 800 };
  return { depth: 12, movetime: 800 };
}

// ── UCI → SAN converter ────────────────────────────────────────────────────

function uciToSan(fen: string, uci: string | undefined): string | undefined {
  if (!uci) return undefined;
  if (!uci.match(/^[a-h][1-8][a-h][1-8]/i)) {
    return uci.replace(/\+/g, '').replace(/#/g, '');
  }
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2), to = uci.slice(2, 4);
    const promo = uci.length > 4 ? uci[4] as 'q' | 'r' | 'b' | 'n' : undefined;
    const move = chess.move({ from, to, promotion: promo });
    return move?.san;
  } catch { return undefined; }
}

export function useGameAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [review, setReview] = useState<GameReview | null>(null);

  const analyzeGame = useCallback(
    async (game: ParsedGame, engine: { analyzePosition: (fen: string, opts?: { depth?: number; movetime?: number }) => Promise<EngineAnalysis> }) => {
      // 1. Check if a cached analysis already exists for this exact game move sequence
      const cached = getCachedGameReview(game);
      if (cached) {
        setProgress(100);
        setReview(cached);
        saveReviewToStats(cached, game);
        return cached;
      }

      setIsAnalyzing(true);
      setProgress(0);
      try {
        const bookSet = await loadOpenings();
        const chess = new Chess();
        const analyzedMoves: AnalyzedMove[] = [];
        const keyMoments: KeyMoment[] = [];

        const sq = chess.fen();
        const pc = countPieces(sq);
        const startCfg = pickDepth(0, pc);
        let positionAnalysis = await engine.analyzePosition(sq, startCfg);
        let prevEval = positionAnalysis.evaluation;

        for (let i = 0; i < game.moves.length; i += 2) {
          const moveNumber = Math.floor(i / 2) + 1;
          const whiteMoveSan = game.moves[i];
          const blackMoveSan = game.moves[i + 1];

          // ── White's move ──
          const fenBeforeWhite = chess.fen();
          const isWhiteBook = moveNumber <= 10 && bookSet.has(posKey(fenBeforeWhite));
          const whiteBestRaw = positionAnalysis.bestMove;
          const whiteBestSan = uciToSan(fenBeforeWhite, whiteBestRaw);
          const whiteBestUci = whiteBestRaw?.match(/^[a-h][1-8][a-h][1-8]/i) ? whiteBestRaw.slice(0, 4) : undefined;

          let whiteUci = '';
          try {
            const move = chess.move(whiteMoveSan);
            whiteUci = move.from + move.to;
          } catch { break; }
          const whiteFen = chess.fen();
          const pcW = countPieces(whiteFen);
          const cfgW = pickDepth(i + 1, pcW);
          positionAnalysis = await engine.analyzePosition(whiteFen, cfgW);
          const whiteEval = positionAnalysis.evaluation;

          const isWhiteBest = whiteBestUci ? whiteBestUci === whiteUci : false;
          const whiteClassification = classifyMove(fenBeforeWhite, prevEval, whiteEval, 'w', isWhiteBest, whiteMoveSan, isWhiteBook);
          const whiteDetail: MoveDetail = { san: whiteMoveSan, uci: whiteUci, fen: whiteFen, eval: whiteEval, classification: whiteClassification, bestMoveUci: whiteBestUci, bestMoveSan: whiteBestSan };

          if (whiteClassification === 'blunder' || whiteClassification === 'mistake' || whiteClassification === 'brilliant' || whiteClassification === 'great') {
            keyMoments.push({ moveNumber, side: 'white', classification: whiteClassification, san: whiteMoveSan, evalBefore: prevEval, evalAfter: whiteEval, fen: whiteFen });
          }

          let blackDetail: MoveDetail | undefined;

          if (blackMoveSan) {
            const fenBeforeBlack = chess.fen();
            const isBlackBook = moveNumber <= 10 && bookSet.has(posKey(fenBeforeBlack));
            const blackBestRaw = positionAnalysis.bestMove;
            const blackBestSan = uciToSan(fenBeforeBlack, blackBestRaw);
            const blackBestUci = blackBestRaw?.match(/^[a-h][1-8][a-h][1-8]/i) ? blackBestRaw.slice(0, 4) : undefined;

            let blackUci = '';
            try {
              const move = chess.move(blackMoveSan);
              blackUci = move.from + move.to;
            } catch { break; }
            const blackFen = chess.fen();
            const pcB = countPieces(blackFen);
            const cfgB = pickDepth(i + 2, pcB);
            positionAnalysis = await engine.analyzePosition(blackFen, cfgB);
            const blackEval = positionAnalysis.evaluation;

            const isBlackBest = blackBestUci ? blackBestUci === blackUci : false;
            const blackClassification = classifyMove(fenBeforeBlack, whiteEval, blackEval, 'b', isBlackBest, blackMoveSan, isBlackBook);
            blackDetail = { san: blackMoveSan, uci: blackUci, fen: blackFen, eval: blackEval, classification: blackClassification, bestMoveUci: blackBestUci, bestMoveSan: blackBestSan };

            if (blackClassification === 'blunder' || blackClassification === 'mistake' || blackClassification === 'brilliant' || blackClassification === 'great') {
              keyMoments.push({ moveNumber, side: 'black', classification: blackClassification, san: blackMoveSan, evalBefore: whiteEval, evalAfter: blackEval, fen: blackFen });
            }
            prevEval = blackEval;
          }

          analyzedMoves.push({ moveNumber, white: whiteDetail, black: blackDetail });
          setProgress(Math.round(((i + 2) / game.moves.length) * 100));
        }

        const wc = getClassifications(analyzedMoves, 'white');
        const bc = getClassifications(analyzedMoves, 'black');
        const wa = calculateAccuracy(wc);
        const ba = calculateAccuracy(bc);
        const we = estimateElo(wa);
        const be = estimateElo(ba);

        // Derive opening reliably from move sequence if missing or generic
        const detectedOpening = detectOpeningFromMoves(game.moves);
        const resolvedOpening = (game.opening && !game.opening.startsWith('ECO') && game.opening !== 'Unknown Opening')
          ? game.opening
          : (detectedOpening || game.opening || 'Unknown Opening');

        const review: GameReview = {
          white: { name: game.white, rating: game.whiteRating || we, accuracy: wa, estimatedRating: we, accuracies: wc },
          black: { name: game.black, rating: game.blackRating || be, accuracy: ba, estimatedRating: be, accuracies: bc },
          moves: analyzedMoves,
          opening: resolvedOpening,
          result: game.result,
          accuracy: { white: wa, black: ba },
          keyMoments: keyMoments.slice(0, 10),
        };

        setReview(review);
        saveReviewToStats(review, game);
        setProgress(100);
        return review;
      } finally { setIsAnalyzing(false); }
    },
    [],
  );

  return { isAnalyzing, progress, review, analyzeGame };
}

function countPieces(fen: string): number {
  const pieces = fen.split(' ')[0];
  let n = 0;
  for (const ch of pieces) if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) n++;
  return n;
}
