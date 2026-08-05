import type { GameReview, ParsedGame } from '@/types/chess';

export interface SavedReview {
  id: string;
  timestamp: number;
  white: string;
  black: string;
  result: string;
  opening: string;
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteElo: number;
  blackElo: number;
  brilliantCount: number;
  greatCount: number;
  missCount: number;
  blunderCount: number;
}

const CACHE_KEY_PREFIX = 'chess_game_review_cache_';

function getGameMovesKey(game: ParsedGame): string {
  if (game.moves && game.moves.length > 0) {
    return game.moves.slice(0, 40).join('_');
  }
  return `${game.white.trim().toLowerCase()}_${game.black.trim().toLowerCase()}_${game.result}`;
}

export function getCachedGameReview(game: ParsedGame): GameReview | null {
  try {
    const key = CACHE_KEY_PREFIX + getGameMovesKey(game);
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch { /* ignore */ }
  return null;
}

export function saveCachedGameReview(game: ParsedGame, review: GameReview): void {
  try {
    const key = CACHE_KEY_PREFIX + getGameMovesKey(game);
    localStorage.setItem(key, JSON.stringify(review));
  } catch { /* ignore */ }
}

export function saveReviewToStats(review: GameReview, game: ParsedGame) {
  try {
    // Cache the full review object first
    saveCachedGameReview(game, review);

    const existingStr = localStorage.getItem('chess_review_history');
    let history: SavedReview[] = existingStr ? JSON.parse(existingStr) : [];

    let brilliant = 0, great = 0, miss = 0, blunder = 0;
    review.moves.forEach(m => {
      if (m.white?.classification === 'brilliant') brilliant++;
      if (m.black?.classification === 'brilliant') brilliant++;
      if (m.white?.classification === 'great') great++;
      if (m.black?.classification === 'great') great++;
      if (m.white?.classification === 'miss') miss++;
      if (m.black?.classification === 'miss') miss++;
      if (m.white?.classification === 'blunder') blunder++;
      if (m.black?.classification === 'blunder') blunder++;
    });

    const newEntry: SavedReview = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      white: game.white || 'White',
      black: game.black || 'Black',
      result: game.result || '*',
      opening: review.opening || 'Unknown Opening',
      whiteAccuracy: Math.round(review.accuracy.white),
      blackAccuracy: Math.round(review.accuracy.black),
      whiteElo: review.white.estimatedRating || 1500,
      blackElo: review.black.estimatedRating || 1500,
      brilliantCount: brilliant,
      greatCount: great,
      missCount: miss,
      blunderCount: blunder,
    };

    // Save as last active review as well
    localStorage.setItem('chess_last_active_review', JSON.stringify(newEntry));

    // Deduplicate: replace existing entry for same game if present, else prepend
    const existingIndex = history.findIndex(h =>
      h.white.trim().toLowerCase() === newEntry.white.trim().toLowerCase() &&
      h.black.trim().toLowerCase() === newEntry.black.trim().toLowerCase() &&
      h.result === newEntry.result
    );

    if (existingIndex !== -1) {
      history[existingIndex] = newEntry;
    } else {
      history.unshift(newEntry);
    }

    localStorage.setItem('chess_review_history', JSON.stringify(history.slice(0, 50)));
  } catch (e) {
    console.error('Error saving review to stats:', e);
  }
}

export function getStatsData() {
  try {
    const existingStr = localStorage.getItem('chess_review_history');
    let history: SavedReview[] = existingStr ? JSON.parse(existingStr) : [];

    // Fallback: check if last active review exists in storage
    if (!history || history.length === 0) {
      const lastStr = localStorage.getItem('chess_last_active_review');
      if (lastStr) {
        const lastEntry: SavedReview = JSON.parse(lastStr);
        history = [lastEntry];
        localStorage.setItem('chess_review_history', JSON.stringify(history));
      }
    }

    if (!history || history.length === 0) {
      return null;
    }

    // Deduplicate history entries by game identity (white + black + result)
    const seen = new Set<string>();
    const deduplicatedHistory: SavedReview[] = [];

    for (const item of history) {
      const key = `${item.white.trim().toLowerCase()}_vs_${item.black.trim().toLowerCase()}_${item.result}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicatedHistory.push(item);
      }
    }

    history = deduplicatedHistory;

    const totalGames = history.length;
    const avgAccuracy = Math.round(history.reduce((s, h) => s + (h.whiteAccuracy + h.blackAccuracy) / 2, 0) / totalGames * 10) / 10;
    const peakRating = Math.max(...history.flatMap(h => [h.whiteElo, h.blackElo]));
    const totalBrilliant = history.reduce((s, h) => s + (h.brilliantCount || 0), 0);
    const totalGreat = history.reduce((s, h) => s + (h.greatCount || 0), 0);
    const totalMisses = history.reduce((s, h) => s + (h.missCount || 0), 0);
    const totalBlunders = history.reduce((s, h) => s + (h.blunderCount || 0), 0);

    return {
      totalGames,
      avgAccuracy,
      peakRating,
      totalBrilliant,
      totalGreat,
      totalMisses,
      totalBlunders,
      history,
    };
  } catch {
    return null;
  }
}
