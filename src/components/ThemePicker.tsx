import { useState, useEffect, useRef } from 'react';
import { useTheme, Piece3D } from '@/hooks/useTheme';
import { THEME_PRESETS, resolvePieceSet, is3DPieceSet, PIECE_FALLBACKS } from '@/utils/themes';
import { Palette, X, Sparkles, Check, Layers, Image as ImageIcon, LayoutGrid, Crown, Trees, CloudSun, Zap, Moon, Sparkle, Flame, Leaf, Gem, Waves } from 'lucide-react';

const PIECE_CDN = 'https://lichess1.org/assets/piece';

/** Piece thumbnail that renders 3D variants with the volumetric engine. */
function PieceThumb({ setId, name, className }: { setId: string; name: string; className?: string }) {
  const src = `${PIECE_CDN}/${resolvePieceSet(setId)}/${name}.svg`;
  if (is3DPieceSet(setId)) {
    return <div className={`relative ${className ?? ''}`}><Piece3D src={src} fallbackSrc={PIECE_FALLBACKS[name]} /></div>;
  }
  return <img src={src} alt="" draggable={false} className={className} onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const fb = PIECE_FALLBACKS[name];
    if (img.src !== fb) img.src = fb;
  }} />;
}

interface ThemePickerProps {
  open: boolean;
  onClose: () => void;
}

const PRESET_ICONS: Record<string, typeof Crown> = {
  'classic-green': Crown,
  'walnut-royale': Trees,
  'sky-stadium': CloudSun,
  cyberpunk: Zap,
  midnight: Moon,
  amethyst: Sparkle,
  'crimson-arena': Flame,
  emerald: Leaf,
  'obsidian-gold': Gem,
  glacier: Waves,
  'dubrovny-club': Gem,
  'rio-hacha': Trees,
  'fantasy-quest': Zap,
};

type Tab = 'presets' | 'board' | 'piece' | 'background';

export function ThemePicker({ open, onClose }: ThemePickerProps) {
  const {
    pieceSet,
    boardTheme,
    appBackground,
    setPieceSet,
    setBoardTheme,
    setAppBackground,
    allPieceSets,
    allBoardThemes,
    allAppBackgrounds,
  } = useTheme();

  const [tab, setTab] = useState<Tab>('presets');
  const [filterTag, setFilterTag] = useState<string>('All');

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(el => !el.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const presets = usePresetMeta();

  if (!open) return null;

  const currentPieceSet = allPieceSets.find(p => p.id === pieceSet) || allPieceSets[0];

  const boardTags = ['All', 'Classic', 'Wood', 'Vibrant', 'Neon', 'Luxe', 'Modern'];
  const pieceTags = ['All', 'Modern', 'Classic', '3D', 'Fun', 'Retro', 'Minimal'];

  const filteredBoardThemes = filterTag === 'All'
    ? allBoardThemes
    : allBoardThemes.filter(t => t.tag === filterTag);

  const filteredPieceSets = filterTag === 'All'
    ? allPieceSets
    : allPieceSets.filter(p => p.tag === filterTag);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Theme Customizer"
        className="bg-[#0f0f0f] border border-[#262626] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1f1f1f] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#81b64c] flex items-center justify-center text-white shadow-md">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight">Theme Customizer</h3>
              <p className="text-[11px] text-zinc-400">Presets, Board, Pieces & Backgrounds</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close theme customizer" className="p-1.5 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Board Preview Banner (Matching Chess.com) */}
        <div className="bg-gradient-to-r from-[#141414] via-[#1a1a1a] to-[#141414] border-b border-[#1f1f1f] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 2x2 Mini Board Swatch */}
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/20 grid grid-cols-2 grid-rows-2 shadow-xl relative shrink-0">
              <div style={{ backgroundColor: boardTheme.light, backgroundImage: boardTheme.lightTexture }} className="flex items-center justify-center">
                <PieceThumb setId={pieceSet} name="wK" className="w-6 h-6" />
              </div>
              <div style={{ backgroundColor: boardTheme.dark, backgroundImage: boardTheme.darkTexture }} className="flex items-center justify-center">
                <PieceThumb setId={pieceSet} name="bN" className="w-6 h-6" />
              </div>
              <div style={{ backgroundColor: boardTheme.dark, backgroundImage: boardTheme.darkTexture }} className="flex items-center justify-center">
                <PieceThumb setId={pieceSet} name="wP" className="w-6 h-6" />
              </div>
              <div style={{ backgroundColor: boardTheme.light, backgroundImage: boardTheme.lightTexture }} className="flex items-center justify-center">
                <PieceThumb setId={pieceSet} name="bQ" className="w-6 h-6" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{boardTheme.label}</span>
                <span className="text-zinc-500">&bull;</span>
                <span className="text-[#81b64c] font-semibold">{currentPieceSet.label}</span>
              </div>
              <span className="text-[11px] text-zinc-400 mt-0.5">Live Preview Board</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] text-[#81b64c] bg-[#81b64c]/10 px-2.5 py-1 rounded-full border border-[#81b64c]/20 font-mono font-bold">
            <Sparkles className="w-3 h-3" />
            <span>HD Vector</span>
          </div>
        </div>

        {/* 4 Tabs (Presets, Board, Pieces, Background) */}
        <div className="grid grid-cols-4 border-b border-[#1f1f1f] bg-[#121212] text-xs font-bold text-center">
          <button
            onClick={() => { setTab('presets'); setFilterTag('All'); }}
            className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              tab === 'presets' ? 'border-[#81b64c] text-[#81b64c] font-extrabold' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>

          <button
            onClick={() => { setTab('board'); setFilterTag('All'); }}
            className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              tab === 'board' ? 'border-[#81b64c] text-[#81b64c] font-extrabold' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>

          <button
            onClick={() => { setTab('piece'); setFilterTag('All'); }}
            className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              tab === 'piece' ? 'border-[#81b64c] text-[#81b64c] font-extrabold' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pieces</span>
          </button>

          <button
            onClick={() => { setTab('background'); setFilterTag('All'); }}
            className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              tab === 'background' ? 'border-[#81b64c] text-[#81b64c] font-extrabold' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Background</span>
          </button>
        </div>

        {/* Filter Tags (For Board & Pieces only) */}
        {(tab === 'board' || tab === 'piece') && (
          <div className="flex items-center gap-1.5 px-5 py-2 overflow-x-auto bg-[#0a0a0a] border-b border-[#181818] no-scrollbar">
            {(tab === 'board' ? boardTags : pieceTags).map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-3 py-0.5 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                  filterTag === tag
                    ? 'bg-[#81b64c] text-white font-extrabold shadow-sm'
                    : 'bg-[#181818] hover:bg-[#222] text-zinc-400 hover:text-white border border-[#262626]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Presets Banner */}
        {tab === 'presets' && (
          <div className="px-5 py-2 bg-[#0a0a0a] border-b border-[#181818]">
            <p className="text-[11px] text-zinc-500">
              One-tap combos of board, pieces and background — like Chess.com presets.
            </p>
          </div>
        )}

        {/* Scrollable Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'presets' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {presets.map(p => {
                const active = p.boardThemeId === boardTheme.id && p.pieceSetId === pieceSet && p.backgroundId === appBackground.id;
                const Icon = PRESET_ICONS[p.id] || Crown;
                return (
                  <button
                    key={p.id}
                    onClick={() => { setBoardTheme(p.boardThemeId); setPieceSet(p.pieceSetId); setAppBackground(p.backgroundId); }}
                    className={`group relative flex flex-col p-3 rounded-2xl border text-left transition-all lift-hover ${
                      active
                        ? 'border-[#81b64c] bg-[#81b64c]/10 shadow-lg shadow-[#81b64c]/10'
                        : 'border-[#222] bg-[#141414] hover:border-[#383838] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {active && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#81b64c] flex items-center justify-center text-white shadow-md z-10">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    {/* Preview: wallpaper + mini board */}
                    <div
                      className={`relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/10 mb-2 shadow-md ${p.backgroundClass}`}
                      style={p.backgroundImage ? { backgroundImage: `url(${p.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="grid grid-cols-2 grid-rows-2 w-16 h-16 rounded-md overflow-hidden border border-black/30 shadow-lg rotate-3 group-hover:rotate-0 group-hover:scale-105 transition-all duration-300">
                          <div style={{ backgroundColor: p.boardTheme.light, backgroundImage: p.boardTheme.lightTexture }} />
                          <div style={{ backgroundColor: p.boardTheme.dark, backgroundImage: p.boardTheme.darkTexture }} />
                          <div style={{ backgroundColor: p.boardTheme.dark, backgroundImage: p.boardTheme.darkTexture }} />
                          <div style={{ backgroundColor: p.boardTheme.light, backgroundImage: p.boardTheme.lightTexture }} />
                        </div>
                      </div>
                      <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-md bg-black/60 border border-white/15 flex items-center justify-center">
                        <PieceThumb setId={p.pieceSetId} name="wK" className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-white truncate flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-[#81b64c] shrink-0" />
                      {p.label}
                    </span>
                    <span className="text-[10px] text-zinc-500 truncate mt-0.5">{p.blurb}</span>
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'board' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredBoardThemes.map(bt => {
                const active = boardTheme.id === bt.id;
                return (
                  <button
                    key={bt.id}
                    onClick={() => setBoardTheme(bt.id)}
                    className={`group relative flex flex-col p-3 rounded-2xl border text-left transition-all lift-hover ${
                      active
                        ? 'border-[#81b64c] bg-[#81b64c]/10 shadow-lg shadow-[#81b64c]/10'
                        : 'border-[#222] bg-[#141414] hover:border-[#383838] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {active && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#81b64c] flex items-center justify-center text-white shadow-md">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    {/* Swatch with texture */}
                    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden grid grid-cols-2 grid-rows-2 border border-black/40 mb-2 shadow-md">
                      <div style={{ backgroundColor: bt.light, backgroundImage: bt.lightTexture }} />
                      <div style={{ backgroundColor: bt.dark, backgroundImage: bt.darkTexture }} />
                      <div style={{ backgroundColor: bt.dark, backgroundImage: bt.darkTexture }} />
                      <div style={{ backgroundColor: bt.light, backgroundImage: bt.lightTexture }} />
                    </div>
                    <span className="text-xs font-extrabold text-white truncate">{bt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'piece' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredPieceSets.map(ps => {
                const active = pieceSet === ps.id;
                return (
                  <button
                    key={ps.id}
                    onClick={() => setPieceSet(ps.id)}
                    className={`group relative flex flex-col p-3 rounded-2xl border text-left transition-all lift-hover ${
                      active
                        ? 'border-[#81b64c] bg-[#81b64c]/10 shadow-lg shadow-[#81b64c]/10'
                        : 'border-[#222] bg-[#141414] hover:border-[#383838] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {active && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#81b64c] flex items-center justify-center text-white shadow-md">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    <div className="w-full aspect-[4/3] rounded-xl bg-zinc-950/80 border border-white/10 flex items-center justify-center mb-2 shadow-inner p-2">
                      <PieceThumb setId={ps.id} name="wN" className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-extrabold text-white truncate">{ps.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'background' && (
            <div className="grid grid-cols-2 gap-3">
              {allAppBackgrounds.map(bg => {
                const active = appBackground.id === bg.id;
                return (
                  <button
                    key={bg.id}
                    onClick={() => setAppBackground(bg.id)}
                    className={`group relative flex items-center gap-3 p-3 rounded-2xl border text-left transition-all lift-hover ${
                      active
                        ? 'border-[#81b64c] bg-[#81b64c]/10 shadow-lg shadow-[#81b64c]/10'
                        : 'border-[#222] bg-[#141414] hover:border-[#383838] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {/* Real wallpaper preview swatch */}
                    <div
                      className={`w-12 h-12 rounded-xl border border-white/15 shadow-md shrink-0 overflow-hidden ${bg.isWallpaper && !bg.image ? bg.bgClass : ''}`}
                      style={bg.image
                        ? { backgroundImage: `url(${bg.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { backgroundColor: bg.previewColor }}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-extrabold text-white truncate block">{bg.label}</span>
                      <span className="text-[10px] text-zinc-500">{bg.isWallpaper ? 'Wallpaper' : 'Solid'}</span>
                    </div>
                    {active && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-[#81b64c] flex items-center justify-center text-white shadow-md shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Resolve preset metadata (board/piece/background objects + wallpaper class) */
function usePresetMeta() {
  const { allBoardThemes, allPieceSets, allAppBackgrounds, boardTheme, pieceSet, appBackground } = useTheme();

  return THEME_PRESETS.map(p => {
    const b = allBoardThemes.find(t => t.id === p.boardThemeId) || boardTheme;
    const ps = allPieceSets.find(s => s.id === p.pieceSetId) || allPieceSets.find(s => s.id === pieceSet) || allPieceSets[0];
    const bg = allAppBackgrounds.find(a => a.id === p.backgroundId) || appBackground;
    return {
      id: p.id,
      label: p.label,
      blurb: p.blurb,
      boardThemeId: p.boardThemeId,
      pieceSetId: ps.id,
      backgroundId: p.backgroundId,
      boardTheme: b,
      backgroundClass: bg.isWallpaper ? bg.bgClass : '',
      backgroundImage: bg.image,
    };
  });
}
