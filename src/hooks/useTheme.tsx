import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { BOARD_THEMES, PIECE_SETS, APP_BACKGROUNDS, type BoardTheme, type AppBackground } from '@/utils/themes';

const STORAGE_KEY = 'chessThemeSettings';
const DEFAULT_PIECE_SET = 'staunty';
const DEFAULT_BOARD_THEME = 'sky_sea';
const DEFAULT_APP_BG = 'newspaper';

interface StoredSettings {
  pieceSet: string;
  boardTheme: string;
  appBackground: string;
}

function load(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { pieceSet: DEFAULT_PIECE_SET, boardTheme: DEFAULT_BOARD_THEME, appBackground: DEFAULT_APP_BG };
}

function save(settings: StoredSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
}

const PIECE_CDN = 'https://lichess1.org/assets/piece';
const PIECE_NAMES = ['K', 'Q', 'R', 'B', 'N', 'P'] as const;
type PieceColor = 'w' | 'b';

function buildPieceUrl(set: string, color: PieceColor, name: string): string {
  return `${PIECE_CDN}/${set}/${color}${name}.svg`;
}

function PieceImg({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className="chess-piece-3d"
      style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
    />
  );
}

export function buildPieceRenderObject(pieceSet: string): Record<string, () => React.ReactElement> {
  const pieces: Record<string, () => React.ReactElement> = {};
  for (const color of ['w', 'b'] as PieceColor[]) {
    for (const name of PIECE_NAMES) {
      const key = `${color}${name}`;
      const src = buildPieceUrl(pieceSet, color, name);
      pieces[key] = () => <PieceImg src={src} />;
    }
  }
  return pieces;
}

interface ThemeContextValue {
  pieceSet: string;
  boardTheme: BoardTheme;
  appBackground: AppBackground;
  pieces: Record<string, () => React.ReactElement>;
  setPieceSet: (id: string) => void;
  setBoardTheme: (id: string) => void;
  setAppBackground: (id: string) => void;
  allPieceSets: typeof PIECE_SETS;
  allBoardThemes: typeof BOARD_THEMES;
  allAppBackgrounds: typeof APP_BACKGROUNDS;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoredSettings>(load);

  useEffect(() => { save(settings); }, [settings]);

  const setPieceSet = useCallback((id: string) => {
    setSettings(s => ({ ...s, pieceSet: id }));
  }, []);

  const setBoardTheme = useCallback((id: string) => {
    setSettings(s => ({ ...s, boardTheme: id }));
  }, []);

  const setAppBackground = useCallback((id: string) => {
    setSettings(s => ({ ...s, appBackground: id }));
  }, []);

  const boardTheme = BOARD_THEMES.find(t => t.id === settings.boardTheme) || BOARD_THEMES[0];
  const appBackground = APP_BACKGROUNDS.find(b => b.id === settings.appBackground) || APP_BACKGROUNDS[0];
  const pieces = buildPieceRenderObject(settings.pieceSet);

  return (
    <ThemeCtx.Provider value={{
      pieceSet: settings.pieceSet,
      boardTheme,
      appBackground,
      pieces,
      setPieceSet,
      setBoardTheme,
      setAppBackground,
      allPieceSets: PIECE_SETS,
      allBoardThemes: BOARD_THEMES,
      allAppBackgrounds: APP_BACKGROUNDS,
    }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
