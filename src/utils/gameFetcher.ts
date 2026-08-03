import { Chess } from 'chess.js';

export function isChessComUrl(url: string): boolean {
  return /chess\.com\//i.test(url);
}

export function isLichessUrl(url: string): boolean {
  return /lichess\.org\/([a-zA-Z0-9]{8,12})/i.test(url);
}

function decodeChar(c: string): number {
  const code = c.charCodeAt(0);
  if (code >= 97 && code <= 122) return code - 97;       // a-z -> 0..25
  if (code >= 65 && code <= 90) return code - 65 + 26;   // A-Z -> 26..51
  if (code >= 48 && code <= 57) return code - 48 + 52;   // 0-9 -> 52..61
  if (c === '!') return 62;
  if (c === '?') return 63;
  return 0;
}

function decodeSquare(val: number): string {
  const f = val % 8;
  const r = Math.floor(val / 8) + 1;
  return String.fromCharCode(97 + f) + r;
}

export function decodeChessComMoveList(moveListStr: string): string[] {
  const chess = new Chess();
  for (let i = 0; i < moveListStr.length; i += 2) {
    const fromVal = decodeChar(moveListStr[i]);
    const toVal = decodeChar(moveListStr[i + 1]);
    const from = decodeSquare(fromVal);
    const to = decodeSquare(toVal);

    try {
      const res = chess.move({ from, to });
      if (!res) {
        // Try with promotion
        const moves = chess.moves({ verbose: true });
        const promo = moves.find(m => m.from === from && m.to === to);
        if (promo) chess.move(promo);
      }
    } catch { /* skip invalid plies */ }
  }
  return chess.history();
}

async function safeFetch(url: string): Promise<any> {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('json')) return await res.json();
      return await res.text();
    }
  } catch {
    // CORS or network error — swallow silently
  }
  return null;
}

export async function fetchChessComGame(url: string): Promise<string> {
  const match = url.match(/(?:game\/live\/|live\/game\/|game\/daily\/|daily\/game\/|game\/)(\d+|\w+)/i);
  if (!match || !match[1]) {
    throw new Error('Invalid Chess.com URL format. Could not extract game ID.');
  }

  const gameId = match[1];
  const isDaily = /daily/i.test(url);
  const path = isDaily ? `/callback/daily/game/${gameId}` : `/callback/live/game/${gameId}`;
  const targetUrl = `https://www.chess.com${path}`;

  let data: any = null;

  // 1. Try local Vite dev proxy first (if running on localhost, avoids CORS console errors)
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    data = await safeFetch(`/chess-api${path}`);
  }

  // 2. Try codetabs CORS proxy
  if (!data) {
    const proxied = await safeFetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
    if (typeof proxied === 'string') {
      try { data = JSON.parse(proxied); } catch { /* ignore */ }
    } else {
      data = proxied;
    }
  }

  // 3. Try allorigins CORS proxy
  if (!data) {
    const proxied = await safeFetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
    if (typeof proxied === 'string') {
      try { data = JSON.parse(proxied); } catch { /* ignore */ }
    } else {
      data = proxied;
    }
  }

  // 4. Try direct fetch (as fallback for mobile native / non-browser environments)
  if (!data) {
    data = await safeFetch(targetUrl);
  }

  if (data?.game) {
    const g = data.game;
    const h = g.pgnHeaders || {};
    const white = g.players?.bottom?.username || h.White || 'White';
    const black = g.players?.top?.username || h.Black || 'Black';
    const whiteElo = g.players?.bottom?.rating || h.WhiteElo || '';
    const blackElo = g.players?.top?.rating || h.BlackElo || '';
    const result = h.Result || (g.colorOfWinner === 'white' ? '1-0' : g.colorOfWinner === 'black' ? '0-1' : '*');

    let movesSan: string[] = [];
    if (g.moveList) {
      movesSan = decodeChessComMoveList(g.moveList);
    } else if (g.pgn) {
      return g.pgn;
    }

    if (movesSan.length > 0) {
      let pgnText = `[Event "Live Chess"]\n[Site "Chess.com"]\n[White "${white}"]\n[Black "${black}"]\n[Result "${result}"]\n`;
      if (whiteElo) pgnText += `[WhiteElo "${whiteElo}"]\n`;
      if (blackElo) pgnText += `[BlackElo "${blackElo}"]\n`;
      if (h.ECO) pgnText += `[ECO "${h.ECO}"]\n`;
      pgnText += `\n`;
      movesSan.forEach((m, idx) => {
        if (idx % 2 === 0) pgnText += `${Math.floor(idx / 2) + 1}. ${m} `;
        else pgnText += `${m} `;
      });
      return pgnText.trim() + ' ' + result;
    }
  }

  throw new Error(
    `Could not automatically fetch Chess.com game #${gameId}.\n\n` +
    `Please paste the PGN text directly into the input box.`
  );
}

export async function fetchLichessGame(url: string): Promise<string> {
  const match = url.match(/lichess\.org\/([a-zA-Z0-9]{8,12})/i);
  if (!match || !match[1]) throw new Error('Invalid Lichess URL format.');

  const gameId = match[1];
  const exportPath = `/game/export/${gameId}?evals=false&clocks=false`;
  const targetUrl = `https://lichess.org${exportPath}`;

  // 1. Try local dev proxy first if on localhost
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    const devProxied = await safeFetch(`/lichess-api${exportPath}`);
    if (devProxied && typeof devProxied === 'string' && devProxied.includes('[Event')) return devProxied;
  }

  // 2. Direct fetch (Lichess API supports CORS natively)
  const direct = await safeFetch(targetUrl);
  if (direct && typeof direct === 'string' && direct.includes('[Event')) return direct;

  // 3. Fallback proxies
  const codetabs = await safeFetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
  if (codetabs && typeof codetabs === 'string' && codetabs.includes('[Event')) return codetabs;

  const proxied = await safeFetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
  if (proxied && typeof proxied === 'string' && proxied.includes('[Event')) return proxied;

  throw new Error(`Could not fetch Lichess game #${gameId}. Please paste the PGN directly.`);
}
