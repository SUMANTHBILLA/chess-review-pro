/**
 * Free Lichess API integrations:
 *  - Opening Explorer: win/draw/loss stats for any position (masters + Lichess games)
 *  - Syzygy Tablebase: perfect play for positions with ≤7 pieces
 *
 * Both are free, no API key needed, CORS-enabled.
 */

export interface OpeningStats {
  white: number;
  draws: number;
  black: number;
  moves: OpeningMove[];
  opening?: string;
}

export interface OpeningMove {
  san: string;
  uci: string;
  white: number;
  draws: number;
  black: number;
  total: number;
}

export interface TablebaseResult {
  category: 'win' | 'loss' | 'draw' | 'unknown';
  moves: TablebaseMove[];
  dtz?: number;
  dtm?: string;
}

export interface TablebaseMove {
  uci: string;
  san: string;
  category: 'win' | 'loss' | 'draw';
  dtz?: number;
  precise?: string;
}

// ── Opening Explorer ─────────────────────────────────────────

/**
 * Fetch opening statistics for a position from Lichess masters DB.
 * Free API, CORS-enabled, no auth needed.
 */
export async function fetchOpeningExplorer(
  fen: string,
  variant: 'masters' | 'lichess' = 'masters',
): Promise<OpeningStats | null> {
  try {
    const base = variant === 'masters'
      ? 'https://explorer.lichess.org/master'
      : 'https://explorer.lichess.org/lichess';
    const url = `${base}?fen=${encodeURIComponent(fen)}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();

    if (!data || !data.moves) return null;

    const moves: OpeningMove[] = data.moves.map((m: any) => ({
      san: m.san,
      uci: m.uci,
      white: m.white || 0,
      draws: m.draws || 0,
      black: m.black || 0,
      total: (m.white || 0) + (m.draws || 0) + (m.black || 0),
    }));

    return {
      white: data.white || 0,
      draws: data.draws || 0,
      black: data.black || 0,
      moves: moves.sort((a: OpeningMove, b: OpeningMove) => b.total - a.total).slice(0, 10),
      opening: data.opening?.name || data.opening?.eco,
    };
  } catch {
    return null;
  }
}

// ── Tablebase ────────────────────────────────────────────────

/**
 * Fetch Syzygy endgame tablebase data for positions with ≤7 pieces.
 * Free API from Lichess, CORS-enabled.
 */
export async function fetchTablebase(fen: string): Promise<TablebaseResult | null> {
  // Only works with ≤7 pieces
  const pieceCount = (fen.split(' ')[0].match(/[pnbrqkPNBRQK]/g) || []).length;
  if (pieceCount > 7) return null;

  try {
    const url = `https://tablebase.lichess.org/v3/standard?fen=${encodeURIComponent(fen)}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();

    if (!data || !data.moves) return null;

    const moves: TablebaseMove[] = (data.moves as any[])
      .filter((m: any) => m.uci)
      .map((m: any) => ({
        uci: m.uci,
        san: m.san || m.uci,
        category: m.category || 'unknown',
        dtz: m.dtz,
        precise: m.precise,
      }));

    // Sort: winning moves first, then draws, then losses
    const score = (c: string) => c === 'win' ? 0 : c === 'draw' ? 1 : 2;
    moves.sort((a, b) => score(a.category) - score(b.category));

    return {
      category: data.category || 'unknown',
      moves: moves.slice(0, 5),
      dtz: data.dtz,
      dtm: data.dtm,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a position qualifies for tablebase (≤7 pieces).
 */
export function isTablebasePosition(fen: string): boolean {
  const pieces = fen.split(' ')[0];
  let count = 0;
  for (const ch of pieces) {
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) count++;
    if (count > 7) return false;
  }
  return count <= 7;
}
