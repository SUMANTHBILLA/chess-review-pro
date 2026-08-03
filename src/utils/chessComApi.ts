/**
 * Chess.com API integration — fetches game data from chess.com URLs.
 *
 * The callback API (www.chess.com/callback/…) is CORS-blocked in browsers,
 * so we use the public Player Games API (api.chess.com/pub/…) which has
 * `access-control-allow-origin: *`.
 *
 * Strategy:
 *   1. Extract game ID + username(s) from the share text
 *   2. Query the public API for the player's recent monthly archives
 *   3. Find the game by URL match and return its PGN
 */

import type { ParsedGame } from '@/types/chess';
import { parsePgn, parseMoveText } from '@/utils/pgnParser';

// ── URL parsing ────────────────────────────────────────────────

export function parseChessComGameId(text: string): number | null {
  const m = text.match(/chess\.com\/(?:live\/game|game\/live|analysis\/game\/live)\/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/** Extract usernames from share text like "player1 vs player2" */
export function parseChessComPlayers(text: string): { white?: string; black?: string } {
  const vsMatch = text.match(/(\w[\w.-]+)\s+vs\s+(\w[\w.-]+)/i);
  if (vsMatch) {
    return { white: vsMatch[1], black: vsMatch[2] };
  }
  // Try to find any chess.com username pattern
  const userMatch = text.match(/(?:player|member)\/(\w[\w.-]+)/i);
  if (userMatch) {
    return { white: userMatch[1] };
  }
  return {};
}

// ── Public API (CORS-friendly) ─────────────────────────────────

interface PlayerGame {
  url: string;
  pgn: string;
}

/**
 * Fetch a player's monthly archive and find a game by its ID.
 * The chess.com public API uses `access-control-allow-origin: *` ✓
 */
async function findGameInPlayerArchive(
  username: string,
  targetGameId: number,
): Promise<{ pgn: string; white: string; black: string } | null> {
  const now = new Date();
  // Search up to 6 recent months (generous for daily games)
  for (let offset = 0; offset < 6; offset++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - offset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    try {
      const resp = await fetch(
        `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${year}/${month}`,
      );
      if (!resp.ok) continue;
      const data: { games: PlayerGame[] } = await resp.json();
      const game = data.games?.find((g) => g.url.includes(String(targetGameId)));
      if (game) {
        // Extract player names from PGN headers
        const white = game.pgn.match(/\[White "([^"]+)"\]/)?.[1] || username;
        const black = game.pgn.match(/\[Black "([^"]+)"\]/)?.[1] || 'Opponent';
        return { pgn: game.pgn, white, black };
      }
    } catch {
      // network error — try next month
    }
  }
  return null;
}

// ── Main entry ─────────────────────────────────────────────────

/**
 * Fetch a game from a chess.com URL by looking it up via the public API.
 *
 * Requires the share text or URL to contain at least one player's username
 * so we can query their game archives.
 */
export async function fetchGameFromChessCom(input: string): Promise<ParsedGame | null> {
  const gameId = parseChessComGameId(input);
  if (!gameId) return null;

  // Extract player names from the share text
  const { white: whiteCandidate, black: blackCandidate } = parseChessComPlayers(input);
  const usernames = [whiteCandidate, blackCandidate].filter(Boolean) as string[];

  // Try each known username
  for (const username of usernames) {
    try {
      const result = await findGameInPlayerArchive(username, gameId);
      if (result) {
        // Use our robust PGN parser to extract everything cleanly
        const parsed = parsePgn(result.pgn);
        if (parsed && parsed.moves.length > 0) {
          return parsed;
        }
        // Fallback: construct minimal game from raw PGN if parser fails
        const moves = parseMoveText(result.pgn);
        if (moves.length > 0) {
          return {
            white: result.white,
            black: result.black,
            moves,
            pgn: result.pgn,
            result: '*',
          };
        }
      }
    } catch {
      // try next username
    }
  }

  return null;
}
