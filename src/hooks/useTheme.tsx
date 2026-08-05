import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode, type ReactElement } from 'react';
import { BOARD_THEMES, PIECE_SETS, APP_BACKGROUNDS, PIECE_FALLBACKS, resolvePieceSet, is3DPieceSet, type BoardTheme, type AppBackground } from '@/utils/themes';

const STORAGE_KEY = 'chessThemeSettings';
const STORAGE_VERSION = 2;
const DEFAULT_PIECE_SET = 'staunty';
const DEFAULT_BOARD_THEME = 'sky_sea';
const DEFAULT_APP_BG = 'newspaper';

interface StoredSettings {
  pieceSet: string;
  boardTheme: string;
  appBackground: string;
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Validate raw stored payload; unknown/legacy/corrupt values resolve to
 * catalog-valid entries so board and pieces always fall back consistently. */
function sanitize(raw: unknown): StoredSettings {
  const known = (id: unknown, catalog: ReadonlyArray<{ id: string }>, fallback: string) =>
    isString(id) && catalog.some(e => e.id === id) ? id : fallback;
  if (!isRecord(raw)) return { pieceSet: DEFAULT_PIECE_SET, boardTheme: DEFAULT_BOARD_THEME, appBackground: DEFAULT_APP_BG };
  return {
    pieceSet: known(raw.pieceSet, PIECE_SETS, DEFAULT_PIECE_SET),
    boardTheme: known(raw.boardTheme, BOARD_THEMES, DEFAULT_BOARD_THEME),
    appBackground: known(raw.appBackground, APP_BACKGROUNDS, DEFAULT_APP_BG),
  };
}

function load(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return sanitize(undefined);
    return sanitize(JSON.parse(raw) as unknown);
  } catch { /* corrupt storage — fall through to defaults */ }
  return sanitize(undefined);
}

function save(settings: StoredSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, v: STORAGE_VERSION })); } catch {}
}

const PIECE_CDN = 'https://lichess1.org/assets/piece';
const PIECE_NAMES = ['K', 'Q', 'R', 'B', 'N', 'P'] as const;
type PieceColor = 'w' | 'b';

function buildPieceUrl(set: string, color: PieceColor, name: string): string {
  return `${PIECE_CDN}/${set}/${color}${name}.svg`;
}

function PieceImg({ src, fallbackSrc }: { src: string; fallbackSrc?: string }) {
  const [current, setCurrent] = useState(src);
  useEffect(() => { setCurrent(src); }, [src]);
  return (
    <img
      src={current}
      alt=""
      draggable={false}
      className="chess-piece-3d"
      onError={() => { if (fallbackSrc && current !== fallbackSrc) setCurrent(fallbackSrc); }}
      style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
    />
  );
}

/** Detect mask-image support (property + data-URI URL form) so the shading
 * overlay can degrade to flat rendering on engines without it. */
function supportsImageMask(): boolean {
  if (typeof document === 'undefined') return false;
  const style = document.createElement('div').style as CSSStyleDeclaration & { webkitMaskImage?: string };
  style.maskImage = 'url(data:image/svg+xml,<svg/>)';
  style.webkitMaskImage = 'url(data:image/svg+xml,<svg/>)';
  return Boolean(style.maskImage || style.webkitMaskImage);
}

/** Renders a flat piece SVG as a 3D object: extruded base, ground shadow,
 * and a silhouette-masked cylinder gradient for real volumetric shading.
 */
export function Piece3D({ src, fallbackSrc }: { src: string; fallbackSrc?: string }) {
  const canMask = useMemo(() => supportsImageMask(), []);
  const [current, setCurrent] = useState(src);
  useEffect(() => { setCurrent(src); }, [src]);

  const handleError = () => { if (fallbackSrc && current !== fallbackSrc) setCurrent(fallbackSrc); };

  if (!canMask) return <PieceImg src={current} fallbackSrc={fallbackSrc} />;

  return (
    <div style={{ width: '100%', height: '100%', aspectRatio: '1 / 1', position: 'relative' }}>
      <img
        src={current}
        alt=""
        draggable={false}
        onError={handleError}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'contain', pointerEvents: 'none',
          filter: 'brightness(0.22) saturate(0.75)',
          transform: 'translate(1.5px, 2.5px)',
          opacity: 0.9,
        }}
      />
      <img
        src={current}
        alt=""
        draggable={false}
        onError={handleError}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'contain', pointerEvents: 'none',
          filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.45))',
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(105deg, rgba(255,255,255,0.55) 2%, rgba(255,255,255,0.08) 32%, rgba(0,0,0,0.04) 58%, rgba(0,0,0,0.5) 100%)',
          mixBlendMode: 'overlay',
          WebkitMaskImage: `url("${current}")`,
          maskImage: `url("${current}")`,
          WebkitMaskSize: 'contain', maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center', maskPosition: 'center',
        }}
      />
    </div>
  );
}

export function buildPieceRenderObject(pieceSet: string): Record<string, () => ReactElement> {
  const srcSet = resolvePieceSet(pieceSet);
  const is3D = is3DPieceSet(pieceSet);
  const pieces: Record<string, () => ReactElement> = {};
  for (const color of ['w', 'b'] as PieceColor[]) {
    for (const name of PIECE_NAMES) {
      const key = `${color}${name}`;
      const src = buildPieceUrl(srcSet, color, name);
      const fallbackSrc = PIECE_FALLBACKS[key];
      pieces[key] = () => (is3D ? <Piece3D src={src} fallbackSrc={fallbackSrc} /> : <PieceImg src={src} fallbackSrc={fallbackSrc} />);
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
  const pieces = useMemo(() => buildPieceRenderObject(settings.pieceSet), [settings.pieceSet]);

  const contextValue = useMemo<ThemeContextValue>(() => ({
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
  }), [settings.pieceSet, settings.boardTheme, settings.appBackground, boardTheme, appBackground, pieces, setPieceSet, setBoardTheme, setAppBackground]);

  return (
    <ThemeCtx.Provider value={contextValue}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
