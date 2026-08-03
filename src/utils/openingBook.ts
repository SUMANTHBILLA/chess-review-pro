/**
 * Offline opening book & Opening Classifier.
 * Detects known book moves and classifies opening names from SAN move sequences.
 */

let cache: Set<string> | null = null;

export function posKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

export async function loadOpenings(): Promise<Set<string>> {
  if (cache) return cache;
  try {
    const res = await fetch('/openings.json');
    cache = new Set<string>(await res.json());
  } catch {
    cache = new Set();
  }
  return cache;
}

export async function isBookMove(fen: string): Promise<boolean> {
  const book = await loadOpenings();
  return book.has(posKey(fen));
}

interface OpeningRule {
  name: string;
  moves: string[];
}

const OPENING_RULES: OpeningRule[] = [
  // Ruy Lopez
  { name: 'Ruy Lopez: Berlin Defense, Berlin Wall', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6', 'O-O', 'Nxe4', 'd4'] },
  { name: 'Ruy Lopez: Berlin Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'] },
  { name: 'Ruy Lopez: Morphy Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'] },
  { name: 'Ruy Lopez', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'] },

  // Italian Game
  { name: 'Two Knights Defense: Fried Liver Attack', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5'] },
  { name: 'Two Knights Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'] },
  { name: 'Italian Game: Giuoco Piano', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'] },
  { name: 'Italian Game', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'] },

  // Scotch & Other 1.e4 e5
  { name: 'Scotch Game', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'] },
  { name: 'Four Knights Game', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3'] },
  { name: 'Petrov\'s Defense', moves: ['e4', 'e5', 'Nf3', 'Nf6'] },
  { name: 'Philidor Defense', moves: ['e4', 'e5', 'Nf3', 'd6'] },
  { name: 'King\'s Gambit Accepted', moves: ['e4', 'e5', 'f4', 'exf4'] },
  { name: 'King\'s Gambit', moves: ['e4', 'e5', 'f4'] },
  { name: 'Vienna Game', moves: ['e4', 'e5', 'Nc3'] },
  { name: 'Center Game', moves: ['e4', 'e5', 'd4'] },
  { name: 'Bishop\'s Opening', moves: ['e4', 'e5', 'Bc4'] },
  { name: 'King\'s Pawn Game', moves: ['e4', 'e5'] },

  // Sicilian Defense
  { name: 'Sicilian Defense: Najdorf Variation', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'] },
  { name: 'Sicilian Defense: Dragon Variation', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'] },
  { name: 'Sicilian Defense: Classical Variation', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'Nc6'] },
  { name: 'Sicilian Defense: Open', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4'] },
  { name: 'Sicilian Defense: Alapin Variation', moves: ['e4', 'c5', 'c3'] },
  { name: 'Sicilian Defense: Closed', moves: ['e4', 'c5', 'Nc3'] },
  { name: 'Sicilian Defense: French Variation', moves: ['e4', 'c5', 'Nf3', 'e6'] },
  { name: 'Sicilian Defense', moves: ['e4', 'c5'] },

  // French Defense
  { name: 'French Defense: Advance Variation', moves: ['e4', 'e6', 'd4', 'd5', 'e5'] },
  { name: 'French Defense: Exchange Variation', moves: ['e4', 'e6', 'd4', 'd5', 'exd5'] },
  { name: 'French Defense: Tarrasch Variation', moves: ['e4', 'e6', 'd4', 'd5', 'Nd2'] },
  { name: 'French Defense: Winawer Variation', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'] },
  { name: 'French Defense: Classical Variation', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6'] },
  { name: 'French Defense', moves: ['e4', 'e6'] },

  // Caro-Kann
  { name: 'Caro-Kann Defense: Advance Variation', moves: ['e4', 'c6', 'd4', 'd5', 'e5'] },
  { name: 'Caro-Kann Defense: Exchange Variation', moves: ['e4', 'c6', 'd4', 'd5', 'exd5'] },
  { name: 'Caro-Kann Defense: Classical Variation', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4'] },
  { name: 'Caro-Kann Defense', moves: ['e4', 'c6'] },

  // Scandinavian & Flank 1.e4
  { name: 'Scandinavian Defense: Main Line', moves: ['e4', 'd5', 'exd5', 'Qxd5'] },
  { name: 'Scandinavian Defense: Modern Variation', moves: ['e4', 'd5', 'exd5', 'Nf6'] },
  { name: 'Scandinavian Defense', moves: ['e4', 'd5'] },
  { name: 'Alekhine\'s Defense', moves: ['e4', 'Nf6'] },
  { name: 'Pirc Defense', moves: ['e4', 'd6'] },
  { name: 'Modern Defense', moves: ['e4', 'g6'] },
  { name: 'Nimzowitsch Defense', moves: ['e4', 'Nc6'] },

  // 1.d4 Openings
  { name: 'Queen\'s Gambit Declined: Slav Defense', moves: ['d4', 'd5', 'c4', 'c6'] },
  { name: 'Queen\'s Gambit Declined: Semi-Slav Defense', moves: ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'e6'] },
  { name: 'Queen\'s Gambit Declined: Orthodox Defense', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6'] },
  { name: 'Queen\'s Gambit Declined', moves: ['d4', 'd5', 'c4', 'e6'] },
  { name: 'Queen\'s Gambit Accepted', moves: ['d4', 'd5', 'c4', 'dxc4'] },
  { name: 'Queen\'s Gambit', moves: ['d4', 'd5', 'c4'] },
  { name: 'London System', moves: ['d4', 'd5', 'Bf4'] },
  { name: 'London System', moves: ['d4', 'Nf6', 'Bf4'] },
  { name: 'Colle System', moves: ['d4', 'd5', 'Nf3', 'Nf6', 'e3'] },
  { name: 'Richter-Veresov Attack', moves: ['d4', 'd5', 'Nc3'] },
  { name: 'Queen\'s Pawn Game', moves: ['d4', 'd5'] },

  // Indian Defenses (1.d4 Nf6)
  { name: 'Grünfeld Defense', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5'] },
  { name: 'King\'s Indian Defense', moves: ['d4', 'Nf6', 'c4', 'g6'] },
  { name: 'Nimzo-Indian Defense', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'] },
  { name: 'Queen\'s Indian Defense', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6'] },
  { name: 'Catalan Opening', moves: ['d4', 'Nf6', 'c4', 'e6', 'g3'] },
  { name: 'Bogo-Indian Defense', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'Bb4+'] },
  { name: 'Modern Benoni', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'e6'] },
  { name: 'Benoni Defense', moves: ['d4', 'Nf6', 'c4', 'c5'] },
  { name: 'Dutch Defense', moves: ['d4', 'f5'] },
  { name: 'Trompowsky Attack', moves: ['d4', 'Nf6', 'Bg5'] },
  { name: 'Indian Defense', moves: ['d4', 'Nf6'] },

  // Flank Openings
  { name: 'English Opening: Symmetrical Variation', moves: ['c4', 'c5'] },
  { name: 'English Opening: King\'s English Variation', moves: ['c4', 'e5'] },
  { name: 'English Opening: Anglo-Indian Defense', moves: ['c4', 'Nf6'] },
  { name: 'English Opening', moves: ['c4'] },
  { name: 'King\'s Indian Attack', moves: ['Nf3', 'd5', 'g3'] },
  { name: 'Réti Opening', moves: ['Nf3', 'd5', 'c4'] },
  { name: 'Réti Opening', moves: ['Nf3'] },
  { name: 'Nimzo-Larsen Attack', moves: ['b3'] },
  { name: 'Bird\'s Opening', moves: ['f4'] },
  { name: 'Sokolsky Opening', moves: ['b4'] },
  { name: 'Grob Opening', moves: ['g4'] },
];

export function detectOpeningFromMoves(moves: string[]): string | undefined {
  if (!moves || moves.length === 0) return undefined;

  const cleanMoves = moves.slice(0, 12).map(m => m.replace(/[+#!?]/g, '').trim());

  for (const rule of OPENING_RULES) {
    if (cleanMoves.length < rule.moves.length) continue;
    let match = true;
    for (let i = 0; i < rule.moves.length; i++) {
      if (cleanMoves[i] !== rule.moves[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      return rule.name;
    }
  }
  return undefined;
}
