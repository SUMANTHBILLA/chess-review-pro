export interface ChessMove {
  san: string;
  uci: string;
  fen: string;
  eval?: number;
  classification?: MoveClassification;
  timeTaken?: number;
}

export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'miss'
  | 'blunder'
  | 'book';

export interface GameReview {
  white: PlayerStats;
  black: PlayerStats;
  moves: AnalyzedMove[];
  opening: string;
  result: string;
  accuracy: {
    white: number;
    black: number;
  };
  keyMoments: KeyMoment[];
}

export interface PlayerStats {
  name: string;
  rating: number;
  accuracy: number;
  estimatedRating?: number;
  accuracies: {
    brilliant: number;
    great: number;
    best: number;
    excellent: number;
    good: number;
    inaccuracy: number;
    mistake: number;
    blunder: number;
    book: number;
  };
}

export interface AnalyzedMove {
  moveNumber: number;
  white: MoveDetail;
  black?: MoveDetail;
}

export interface MoveDetail {
  san: string;
  uci: string;
  fen: string;
  eval: number;
  classification: MoveClassification;
  timeTaken?: number;
  // engine's recommended move (UCI) for the position before this move
  bestMoveUci?: string;
  // engine's recommended move in SAN for easier display
  bestMoveSan?: string;
}

export interface KeyMoment {
  moveNumber: number;
  side: 'white' | 'black';
  classification: MoveClassification;
  san: string;
  evalBefore: number;
  evalAfter: number;
  fen: string;
}

export interface ParsedGame {
  white: string;
  black: string;
  whiteRating?: number;
  blackRating?: number;
  result: string;
  date?: string;
  timeControl?: string;
  opening?: string;
  moves: string[];
  pgn: string;
}
