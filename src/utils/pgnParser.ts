import type { ParsedGame } from '@/types/chess';

/**
 * Parse a full PGN string into structured game data.
 * Handles standard PGN headers, clock annotations {[%clk ...]},
 * NAG symbols ($1-$9), ellipses (...), and variations in parentheses.
 */
export function parsePgn(pgn: string): ParsedGame | null {
  try {
    // Extract headers
    const whiteMatch = pgn.match(/\[White "([^"]+)"\]/);
    const blackMatch = pgn.match(/\[Black "([^"]+)"\]/);
    const whiteEloMatch = pgn.match(/\[WhiteElo "(\d+)"\]/);
    const blackEloMatch = pgn.match(/\[BlackElo "(\d+)"\]/);
    const resultMatch = pgn.match(/\[Result "([^"]+)"\]/);
    const dateMatch = pgn.match(/\[Date "([^"]+)"\]/);
    const timeControlMatch = pgn.match(/\[TimeControl "([^"]+)"\]/);
    const openingMatch = pgn.match(/\[Opening "([^"]+)"\]/);
    const ecoMatch = pgn.match(/\[ECO "([^"]+)"\]/);
    const ecoUrlMatch = pgn.match(/\[ECOUrl "([^"]+)"\]/);

    // Use ECOUrl to derive opening name if Opening header missing
    const openingName = openingMatch?.[1] || (() => {
      if (ecoUrlMatch) {
        const parts = ecoUrlMatch[1].split('/');
        return decodeURIComponent(parts[parts.length - 1] || '').replace(/-/g, ' ');
      }
      return undefined;
    })();

    // Extract move text:
    // 1. Remove PGN headers
    // 2. Remove variations in parentheses (annotations)
    // 3. Remove clock annotations {[%clk ...]}
    // 4. Remove NAG symbols $1-$9
    // 5. Remove ellipses (...)
    // 6. Remove result
    let moveText = pgn
      .replace(/\[.*?\]\s*/g, '')          // remove headers
      .replace(/\{[^}]*\}/g, '')           // remove braces (clock annotations, comments)
      .replace(/\([^)]*\)/g, '')           // remove parenthetical variations
      .replace(/\$\d+/g, '')               // remove NAG symbols
      .replace(/\.\.\./g, '')              // remove ellipses
      .replace(/1-0|0-1|1\/2-1\/2|\*/g, '') // remove result
      .replace(/\d+\./g, ' ')              // replace move numbers with spaces
      .replace(/\s+/g, ' ')                // collapse whitespace
      .trim();

    // Parse moves
    const moveTokens = moveText.split(' ').filter((t) => t.length > 0);
    const moves: string[] = [];

    for (const token of moveTokens) {
      // Normalize castling notation (O-O, O-O-O)
      const clean = token
        .replace(/o/g, 'O')     // lowercase o -> O
        .replace(/0/g, 'O');    // digit 0 -> O

      // Remove check/mate symbols for validation
      const stripped = clean.replace(/[+#]/g, '');

      if (
        stripped === 'O-O' ||
        stripped === 'O-O-O' ||
        /^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?$/.test(stripped) ||
        /^[a-h][1-8](?:=[QRBN])?$/.test(stripped)
      ) {
        moves.push(clean);  // push with +# for display
      }
    }

    const opening = openingName || (ecoSuffix(ecoMatch?.[1]));

    return {
      white: whiteMatch?.[1] || 'White',
      black: blackMatch?.[1] || 'Black',
      whiteRating: whiteEloMatch ? parseInt(whiteEloMatch[1]) : undefined,
      blackRating: blackEloMatch ? parseInt(blackEloMatch[1]) : undefined,
      result: resultMatch?.[1] || '*',
      date: dateMatch?.[1],
      timeControl: timeControlMatch?.[1],
      opening,
      moves,
      pgn,
    };
  } catch {
    return null;
  }
}

function ecoSuffix(eco: string | undefined): string | undefined {
  if (!eco) return undefined;
  // Simple ECO-to-name mapping for common codes
  const ecoNames: Record<string, string> = {
    A00: 'Irregular Openings', A01: 'Nimzowitsch-Larsen Attack',
    A02: 'Bird\'s Opening', A03: 'Bird\'s Opening',
    A04: 'Réti Opening', A05: 'Réti Opening',
    A06: 'Réti Opening', A07: 'King\'s Indian Attack',
    A08: 'King\'s Indian Attack', A09: 'Réti Opening',
    A10: 'English Opening', A11: 'English Opening: Caro-Kann Defensive System',
    A12: 'English Opening: Caro-Kann Defensive System',
    A13: 'English Opening: Agincourt Defense',
    A14: 'English Opening: Neo-Catalan Declined',
    A15: 'English Opening: Anglo-Indian Defense',
    A20: 'English Opening: Sicilian Variation',
    A30: 'English Opening: Symmetrical Variation',
    A40: 'Queen\'s Pawn Opening',
    A45: 'Queen\'s Pawn Opening: Indian Defense',
    B00: 'King\'s Pawn Opening',
    B01: 'Scandinavian Defense',
    B02: 'Alekhine\'s Defense', B03: 'Alekhine\'s Defense',
    B07: 'Pirc Defense', B08: 'Pirc Defense: Classical Variation',
    B10: 'Caro-Kann Defense',
    B11: 'Caro-Kann Defense: Two Knights Attack',
    B12: 'Caro-Kann Defense',
    B13: 'Caro-Kann Defense: Exchange Variation',
    B15: 'Caro-Kann Defense',
    B17: 'Caro-Kann Defense: Steinitz Variation',
    B20: 'Sicilian Defense',
    B21: 'Sicilian Defense: Smith-Morra Gambit',
    B22: 'Sicilian Defense: Alapin Variation',
    B23: 'Sicilian Defense: Closed',
    B30: 'Sicilian Defense: Rossolimo Variation',
    B40: 'Sicilian Defense: Classical Variation',
    B50: 'Sicilian Defense',
    B56: 'Sicilian Defense: Najdorf Variation',
    B70: 'Sicilian Defense: Dragon Variation',
    B80: 'Sicilian Defense: Scheveningen Variation',
    C00: 'French Defense',
    C01: 'French Defense: Exchange Variation',
    C02: 'French Defense: Advance Variation',
    C10: 'French Defense: Paulsen Variation',
    C20: 'King\'s Pawn Game',
    C21: 'Center Game',
    C22: 'Center Game',
    C23: 'Bishop\'s Opening',
    C24: 'Bishop\'s Opening',
    C25: 'Vienna Game',
    C30: 'King\'s Gambit',
    C31: 'King\'s Gambit Declined',
    C32: 'King\'s Gambit: Falkbeer Countergambit',
    C33: 'King\'s Gambit Accepted',
    C34: 'King\'s Gambit Accepted: King\'s Knight\'s Gambit',
    C35: 'King\'s Gambit Accepted: Cunningham Defense',
    C36: 'King\'s Gambit Accepted: Abbazia Defense',
    C37: 'King\'s Gambit Accepted: Quaade Gambit',
    C38: 'King\'s Gambit Accepted: Philidor Gambit',
    C39: 'King\'s Gambit Accepted: Kieseritzky Gambit',
    C40: 'King\'s Knight Opening',
    C41: 'Philidor Defense',
    C42: 'Petrov\'s Defense',
    C43: 'Petrov\'s Defense: Modern Attack',
    C44: 'King\'s Pawn Game: Symmetrical Variation',
    C45: 'Scotch Game',
    C46: 'Four Knights Game',
    C47: 'Four Knights Game: Scotch Variation',
    C48: 'Four Knights Game: Spanish Variation',
    C49: 'Four Knights Game: Spanish Variation, Rubinstein Variation',
    C50: 'Italian Game',
    C51: 'Evans Gambit',
    C52: 'Evans Gambit: Main Line',
    C53: 'Italian Game: Classical Variation',
    C54: 'Italian Game: Classical Variation',
    C55: 'Two Knights Defense',
    C56: 'Two Knights Defense',
    C57: 'Two Knights Defense: Fried Liver Attack',
    C58: 'Two Knights Defense: Classical Variation',
    C60: 'Ruy Lopez',
    C61: 'Ruy Lopez: Bird\'s Defense',
    C62: 'Ruy Lopez: Old Steinitz Defense',
    C63: 'Ruy Lopez: Schliemann Defense',
    C64: 'Ruy Lopez: Classical Defense',
    C65: 'Ruy Lopez: Berlin Defense',
    C66: 'Ruy Lopez: Berlin Defense',
    C67: 'Ruy Lopez: Berlin Defense, Berlin Wall',
    C68: 'Ruy Lopez: Exchange Variation',
    C69: 'Ruy Lopez: Exchange Variation',
    C70: 'Ruy Lopez: Morphy Defense',
    C71: 'Ruy Lopez: Steinitz Defense',
    C72: 'Ruy Lopez: Steinitz Defense',
    C73: 'Ruy Lopez: Steinitz Defense',
    C77: 'Ruy Lopez: Morphy Defense',
    C80: 'Ruy Lopez: Open Variation',
    C82: 'Ruy Lopez: Open Variation, Breyer Variation',
    C83: 'Ruy Lopez: Open Variation, Classical Defense',
    C84: 'Ruy Lopez: Closed Variation',
    C88: 'Ruy Lopez: Closed Variation',
    C89: 'Ruy Lopez: Closed Variation, Marshall Attack',
    C90: 'Ruy Lopez: Closed Variation',
    C91: 'Ruy Lopez: Closed Variation',
    C92: 'Ruy Lopez: Closed Variation, Zaitsev Variation',
    C93: 'Ruy Lopez: Closed Variation, Smyslov Defense',
    C94: 'Ruy Lopez: Closed Variation, Breyer Variation',
    C95: 'Ruy Lopez: Closed Variation, Breyer Variation',
    C96: 'Ruy Lopez: Closed Variation',
    D00: 'Queen\'s Pawn Game',
    D01: 'Richter-Veresov Attack',
    D02: 'Queen\'s Pawn Game',
    D03: 'Queen\'s Pawn Game',
    D04: 'Queen\'s Pawn Game: Colle System',
    D05: 'Queen\'s Pawn Game: Colle System',
    D06: 'Queen\'s Gambit',
    D07: 'Queen\'s Gambit Declined: Chigorin Defense',
    D08: 'Queen\'s Gambit Declined: Albin Countergambit',
    D09: 'Queen\'s Gambit Declined: Albin Countergambit',
    D10: 'Queen\'s Gambit Declined: Slav Defense',
    D11: 'Queen\'s Gambit Declined: Slav Defense',
    D12: 'Queen\'s Gambit Declined: Slav Defense',
    D13: 'Queen\'s Gambit Declined: Slav Defense, Exchange Variation',
    D14: 'Queen\'s Gambit Declined: Slav Defense, Exchange Variation',
    D15: 'Queen\'s Gambit Declined: Slav Defense',
    D16: 'Queen\'s Gambit Declined: Slav Defense, Alapin Variation',
    D17: 'Queen\'s Gambit Declined: Slav Defense, Czech Defense',
    D18: 'Queen\'s Gambit Declined: Dutch Variation',
    D19: 'Queen\'s Gambit Declined: Dutch Variation',
    D20: 'Queen\'s Gambit Accepted',
    D21: 'Queen\'s Gambit Accepted',
    D22: 'Queen\'s Gambit Accepted: Alekhine Defense',
    D23: 'Queen\'s Gambit Accepted',
    D24: 'Queen\'s Gambit Accepted',
    D25: 'Queen\'s Gambit Accepted',
    D26: 'Queen\'s Gambit Accepted',
    D27: 'Queen\'s Gambit Accepted: Classical Defense',
    D30: 'Queen\'s Gambit Declined',
    D31: 'Queen\'s Gambit Declined: Semi-Slav Defense',
    D32: 'Queen\'s Gambit Declined: Tarrasch Defense',
    D33: 'Queen\'s Gambit Declined: Tarrasch Defense',
    D34: 'Queen\'s Gambit Declined: Tarrasch Defense',
    D35: 'Queen\'s Gambit Declined: Exchange Variation',
    D36: 'Queen\'s Gambit Declined: Exchange Variation',
    D37: 'Queen\'s Gambit Declined',
    D38: 'Queen\'s Gambit Declined: Ragozin Defense',
    D39: 'Queen\'s Gambit Declined: Ragozin Defense',
    D40: 'Queen\'s Gambit Declined: Semi-Tarrasch Defense',
    D41: 'Queen\'s Gambit Declined: Semi-Tarrasch Defense',
    D42: 'Queen\'s Gambit Declined: Semi-Tarrasch Defense',
    D43: 'Queen\'s Gambit Declined: Semi-Slav Defense',
    D44: 'Queen\'s Gambit Declined: Semi-Slav Defense',
    D45: 'Queen\'s Gambit Declined: Semi-Slav Defense',
    D46: 'Queen\'s Gambit Declined: Semi-Slav Defense',
    D47: 'Queen\'s Gambit Declined: Semi-Slav Defense',
    D48: 'Queen\'s Gambit Declined: Semi-Slav Defense, Meran Variation',
    D49: 'Queen\'s Gambit Declined: Semi-Slav Defense, Meran Variation',
    D50: 'Queen\'s Gambit Declined',
    D51: 'Queen\'s Gambit Declined',
    D52: 'Queen\'s Gambit Declined',
    D53: 'Queen\'s Gambit Declined',
    D54: 'Queen\'s Gambit Declined: Anti-Neo-Orthodox Variation',
    D55: 'Queen\'s Gambit Declined',
    D56: 'Queen\'s Gambit Declined: Lasker Defense',
    D57: 'Queen\'s Gambit Declined: Lasker Defense',
    D58: 'Queen\'s Gambit Declined: Tartakower Defense',
    D59: 'Queen\'s Gambit Declined: Tartakower Defense',
    D60: 'Queen\'s Gambit Declined: Orthodox Defense',
    D61: 'Queen\'s Gambit Declined: Orthodox Defense',
    D62: 'Queen\'s Gambit Declined: Orthodox Defense',
    D63: 'Queen\'s Gambit Declined: Orthodox Defense',
    D64: 'Queen\'s Gambit Declined: Orthodox Defense',
    D65: 'Queen\'s Gambit Declined: Orthodox Defense',
    D66: 'Queen\'s Gambit Declined: Orthodox Defense, Bd3 Line',
    D67: 'Queen\'s Gambit Declined: Orthodox Defense',
    D68: 'Queen\'s Gambit Declined: Orthodox Defense',
    D69: 'Queen\'s Gambit Declined: Orthodox Defense',
    D70: 'Queen\'s Gambit Declined: Neo-Grünfeld Defense',
    D71: 'Queen\'s Gambit Declined: Neo-Grünfeld Defense',
    D72: 'Queen\'s Gambit Declined: Neo-Grünfeld Defense',
    D73: 'Queen\'s Gambit Declined: Neo-Grünfeld Defense',
    D74: 'Queen\'s Gambit Declined: Neo-Grünfeld Defense',
    D75: 'Queen\'s Gambit Declined: Neo-Grünfeld Defense',
    D76: 'Queen\'s Gambit Declined: Neo-Grünfeld Defense',
    D77: 'Queen\'s Gambit Declined: Neo-Grünfeld Defense',
    D78: 'Queen\'s Gambit Declined: Neo-Grünfeld Defense',
    D79: 'Queen\'s Gambit Declined: Neo-Grünfeld Defense',
    D80: 'Grünfeld Defense',
    D81: 'Grünfeld Defense: Russian Variation',
    D82: 'Grünfeld Defense: Russian Variation',
    D83: 'Grünfeld Defense: Russian Variation',
    D84: 'Grünfeld Defense: Russian Variation',
    D85: 'Grünfeld Defense: Exchange Variation',
    D86: 'Grünfeld Defense: Exchange Variation, Classical Variation',
    D87: 'Grünfeld Defense: Exchange Variation',
    D88: 'Grünfeld Defense: Exchange Variation',
    D89: 'Grünfeld Defense: Exchange Variation',
    D90: 'Grünfeld Defense: Three Knights Variation',
    D91: 'Grünfeld Defense: Three Knights Variation',
    D92: 'Grünfeld Defense: Three Knights Variation',
    D93: 'Grünfeld Defense: Three Knights Variation',
    D94: 'Grünfeld Defense: Three Knights Variation',
    D95: 'Grünfeld Defense: Three Knights Variation',
    D96: 'Grünfeld Defense: Russian Variation',
    D97: 'Grünfeld Defense: Russian Variation',
    D98: 'Grünfeld Defense: Russian Variation',
    D99: 'Grünfeld Defense: Russian Variation',
    E00: 'Queen\'s Pawn Game: Neo-Indian Variation',
    E01: 'Catalan Opening: Closed',
    E02: 'Catalan Opening: Open, 5.Qa4',
    E03: 'Catalan Opening: Open, 5.Qa4',
    E04: 'Catalan Opening: Open, 5.Nf3',
    E05: 'Catalan Opening: Open, 5.Nf3',
    E06: 'Catalan Opening: Closed, 5.Nf3',
    E07: 'Catalan Opening: Closed, 5.Nf3',
    E08: 'Catalan Opening: Closed, 5.Nf3',
    E09: 'Catalan Opening: Closed, 5.Nf3',
    E10: 'Queen\'s Pawn Game: Blumenfeld Countergambit',
    E11: 'Bogo-Indian Defense',
    E12: 'Queen\'s Indian Defense',
    E13: 'Queen\'s Indian Defense',
    E14: 'Queen\'s Indian Defense',
    E15: 'Queen\'s Indian Defense',
    E16: 'Queen\'s Indian Defense',
    E17: 'Queen\'s Indian Defense',
    E18: 'Queen\'s Indian Defense',
    E19: 'Queen\'s Indian Defense',
    E20: 'Nimzo-Indian Defense',
    E21: 'Nimzo-Indian Defense: Three Knights Variation',
    E22: 'Nimzo-Indian Defense: Spielmann Variation',
    E23: 'Nimzo-Indian Defense: Spielmann Variation',
    E24: 'Nimzo-Indian Defense: Sämisch Variation',
    E25: 'Nimzo-Indian Defense: Sämisch Variation',
    E26: 'Nimzo-Indian Defense: Sämisch Variation',
    E27: 'Nimzo-Indian Defense: Sämisch Variation',
    E28: 'Nimzo-Indian Defense: Sämisch Variation',
    E29: 'Nimzo-Indian Defense: Sämisch Variation',
    E30: 'Nimzo-Indian Defense: Leningrad Variation',
    E31: 'Nimzo-Indian Defense: Leningrad Variation',
    E32: 'Nimzo-Indian Defense: Classical Variation',
    E33: 'Nimzo-Indian Defense: Classical Variation',
    E34: 'Nimzo-Indian Defense: Classical Variation',
    E35: 'Nimzo-Indian Defense: Classical Variation',
    E36: 'Nimzo-Indian Defense: Classical Variation',
    E37: 'Nimzo-Indian Defense: Classical Variation',
    E38: 'Nimzo-Indian Defense: Classical Variation',
    E39: 'Nimzo-Indian Defense: Classical Variation',
    E40: 'Nimzo-Indian Defense: Rubinstein Variation',
    E41: 'Nimzo-Indian Defense: Rubinstein Variation',
    E42: 'Nimzo-Indian Defense: Rubinstein Variation',
    E43: 'Nimzo-Indian Defense: Rubinstein Variation',
    E44: 'Nimzo-Indian Defense: Rubinstein Variation',
    E45: 'Nimzo-Indian Defense: Rubinstein Variation',
    E46: 'Nimzo-Indian Defense: Rubinstein Variation',
    E47: 'Nimzo-Indian Defense: Rubinstein Variation',
    E48: 'Nimzo-Indian Defense: Rubinstein Variation',
    E49: 'Nimzo-Indian Defense: Rubinstein Variation',
    E50: 'Nimzo-Indian Defense: Four Knights Variation',
    E51: 'Nimzo-Indian Defense: Four Knights Variation',
    E52: 'Nimzo-Indian Defense: Four Knights Variation',
    E53: 'Nimzo-Indian Defense: Four Knights Variation',
    E54: 'Nimzo-Indian Defense: Four Knights Variation',
    E55: 'Nimzo-Indian Defense: Four Knights Variation',
    E56: 'Nimzo-Indian Defense: Four Knights Variation',
    E57: 'Nimzo-Indian Defense: Four Knights Variation',
    E58: 'Nimzo-Indian Defense: Four Knights Variation',
    E59: 'Nimzo-Indian Defense: Four Knights Variation',
    E60: 'King\'s Indian Defense',
    E61: 'King\'s Indian Defense',
    E62: 'King\'s Indian Defense',
    E63: 'King\'s Indian Defense',
    E64: 'King\'s Indian Defense: Fianchetto Variation',
    E65: 'King\'s Indian Defense: Fianchetto Variation',
    E66: 'King\'s Indian Defense: Fianchetto Variation',
    E67: 'King\'s Indian Defense: Fianchetto Variation',
    E68: 'King\'s Indian Defense: Fianchetto Variation',
    E69: 'King\'s Indian Defense: Fianchetto Variation',
    E70: 'King\'s Indian Defense: Four Pawns Attack',
    E71: 'King\'s Indian Defense: Four Pawns Attack',
    E72: 'King\'s Indian Defense: Normal Variation',
    E73: 'King\'s Indian Defense: Normal Variation',
    E74: 'King\'s Indian Defense: Normal Variation',
    E75: 'King\'s Indian Defense: Normal Variation',
    E76: 'King\'s Indian Defense: Four Pawns Attack',
    E77: 'King\'s Indian Defense: Four Pawns Attack',
    E78: 'King\'s Indian Defense: Four Pawns Attack',
    E79: 'King\'s Indian Defense: Four Pawns Attack',
    E80: 'King\'s Indian Defense: Sämisch Variation',
    E81: 'King\'s Indian Defense: Sämisch Variation',
    E82: 'King\'s Indian Defense: Sämisch Variation',
    E83: 'King\'s Indian Defense: Sämisch Variation',
    E84: 'King\'s Indian Defense: Sämisch Variation',
    E85: 'King\'s Indian Defense: Sämisch Variation',
    E86: 'King\'s Indian Defense: Sämisch Variation',
    E87: 'King\'s Indian Defense: Sämisch Variation',
    E88: 'King\'s Indian Defense: Sämisch Variation',
    E89: 'King\'s Indian Defense: Sämisch Variation',
    E90: 'King\'s Indian Defense: Normal Variation',
    E91: 'King\'s Indian Defense: Normal Variation',
    E92: 'King\'s Indian Defense: Normal Variation',
    E93: 'King\'s Indian Defense: Normal Variation',
    E94: 'King\'s Indian Defense: Normal Variation',
    E95: 'King\'s Indian Defense: Normal Variation',
    E96: 'King\'s Indian Defense: Normal Variation',
    E97: 'King\'s Indian Defense: Normal Variation',
    E98: 'King\'s Indian Defense: Normal Variation',
    E99: 'King\'s Indian Defense: Normal Variation',
  };
  return ecoNames[eco] || `ECO ${eco}`;
}

/**
 * Try to find a chess.com game ID in various URL formats:
 * - https://www.chess.com/live/game/123456789
 * - https://www.chess.com/game/live/123456789
 * - https://www.chess.com/analysis/game/live/123456789
 * - live://game/123456789 (from share link)
 */
export function parseChessComGameId(input: string): string | null {
  const patterns = [
    /chess\.com\/(?:live\/game|game\/live)\/(\d+)/,
    /chess\.com\/analysis\/game\/live\/(\d+)/,
    /chess\.com\/game\/(\d+)/,
    /live:\/\/game\/(\d+)/,
    /\/live\/game\/(\d+)(?:\/|$)/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function detectInputType(input: string): 'pgn' | 'url' | 'unknown' {
  if (input.includes('[Event ') || input.includes('[White "') || input.includes('[Black "')) {
    return 'pgn';
  }
  if (input.includes('chess.com') || input.startsWith('http')) {
    return 'url';
  }
  if (input.match(/^\d+\s*\.\.\.?\s*/) || input.match(/^[RNBQK1-8O]/)) {
    return 'pgn';
  }
  return 'unknown';
}

// Extract PGN from a chess.com share text format
export function parseShareText(text: string): { url: string | null; pgn: string | null } {
  const urlMatch = text.match(/(https:\/\/www\.chess\.com\/[^\s]+)/);
  const pgnMatch = text.match(/(1\.\s*[a-h1-8NORBQKO].*)/);

  return {
    url: urlMatch?.[1] || null,
    pgn: pgnMatch?.[1] || null,
  };
}

// Parse move list from text like "1. e4 e5 2. Nf3 Nc6"
export function parseMoveText(text: string): string[] {
  const moves: string[] = [];
  // Remove annotations, comments, variations
  const clean = text
    .replace(/\{[^}]*\}/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\$\d+/g, '')
    .replace(/\.\.\./g, '')
    .replace(/\d+\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = clean.split(' ');

  for (const token of tokens) {
    const t = token.trim();
    if (!t) continue;

    const normalized = t.replace(/o/g, 'O').replace(/0/g, 'O');
    const stripped = normalized.replace(/[+#]/g, '');

    if (
      stripped === 'O-O' ||
      stripped === 'O-O-O' ||
      /^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?$/.test(stripped) ||
      /^[a-h][1-8](?:=[QRBN])?$/.test(stripped)
    ) {
      moves.push(normalized);
    }
  }

  return moves;
}
