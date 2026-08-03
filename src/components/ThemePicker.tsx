import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Palette, X, Sparkles, Check, Layers, Image as ImageIcon } from 'lucide-react';

interface ThemePickerProps {
  open: boolean;
  onClose: () => void;
}

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

  const [tab, setTab] = useState<'board' | 'piece' | 'background'>('board');
  const [filterTag, setFilterTag] = useState<string>('All');

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
        className="bg-[#0f0f0f] border border-[#262626] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1f1f1f] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-emerald-400">
                <Palette className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight">Theme Customizer</h3>
              <p className="text-[11px] text-zinc-400">Chess.com Standard Theme & Piece Picker</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Board Preview Banner (Matching Chess.com) */}
        <div className="bg-gradient-to-r from-[#141414] via-[#1a1a1a] to-[#141414] border-b border-[#1f1f1f] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 2x2 Mini Board Swatch */}
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/20 grid grid-cols-2 grid-rows-2 shadow-xl relative shrink-0">
              <div style={{ backgroundColor: boardTheme.light }} className="flex items-center justify-center">
                <img src={`https://lichess1.org/assets/piece/${pieceSet}/wK.svg`} alt="K" className="w-6 h-6 drop-shadow-md" />
              </div>
              <div style={{ backgroundColor: boardTheme.dark }} className="flex items-center justify-center">
                <img src={`https://lichess1.org/assets/piece/${pieceSet}/bN.svg`} alt="N" className="w-6 h-6 drop-shadow-md" />
              </div>
              <div style={{ backgroundColor: boardTheme.dark }} className="flex items-center justify-center">
                <img src={`https://lichess1.org/assets/piece/${pieceSet}/wP.svg`} alt="P" className="w-6 h-6 drop-shadow-md" />
              </div>
              <div style={{ backgroundColor: boardTheme.light }} className="flex items-center justify-center">
                <img src={`https://lichess1.org/assets/piece/${pieceSet}/bQ.svg`} alt="Q" className="w-6 h-6 drop-shadow-md" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{boardTheme.label}</span>
                <span className="text-zinc-500">&bull;</span>
                <span className="text-emerald-400 font-semibold">{currentPieceSet.label}</span>
              </div>
              <span className="text-[11px] text-zinc-400 mt-0.5">Live Preview Board</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-mono font-bold">
            <Sparkles className="w-3 h-3" />
            <span>HD Vector</span>
          </div>
        </div>

        {/* 3 Main Tabs (Board, Pieces, Background) */}
        <div className="grid grid-cols-3 border-b border-[#1f1f1f] bg-[#121212] text-xs font-bold text-center">
          <button
            onClick={() => { setTab('board'); setFilterTag('All'); }}
            className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              tab === 'board' ? 'border-emerald-500 text-emerald-400 font-extrabold' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>

          <button
            onClick={() => { setTab('piece'); setFilterTag('All'); }}
            className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              tab === 'piece' ? 'border-emerald-500 text-emerald-400 font-extrabold' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pieces</span>
          </button>

          <button
            onClick={() => { setTab('background'); setFilterTag('All'); }}
            className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              tab === 'background' ? 'border-emerald-500 text-emerald-400 font-extrabold' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Background</span>
          </button>
        </div>

        {/* Filter Tags (For Board & Pieces) */}
        {tab !== 'background' && (
          <div className="flex items-center gap-1.5 px-5 py-2 overflow-x-auto bg-[#0a0a0a] border-b border-[#181818] no-scrollbar">
            {(tab === 'board' ? boardTags : pieceTags).map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-3 py-0.5 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                  filterTag === tag
                    ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                    : 'bg-[#181818] hover:bg-[#222] text-zinc-400 hover:text-white border border-[#262626]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'board' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredBoardThemes.map(bt => {
                const active = boardTheme.id === bt.id;
                return (
                  <button
                    key={bt.id}
                    onClick={() => setBoardTheme(bt.id)}
                    className={`group relative flex flex-col p-3 rounded-2xl border text-left transition-all ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                        : 'border-[#222] bg-[#141414] hover:border-[#383838] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {active && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-md">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    {/* Swatch */}
                    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden grid grid-cols-2 grid-rows-2 border border-black/40 mb-2 shadow-md">
                      <div style={{ backgroundColor: bt.light }} />
                      <div style={{ backgroundColor: bt.dark }} />
                      <div style={{ backgroundColor: bt.dark }} />
                      <div style={{ backgroundColor: bt.light }} />
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
                    className={`group relative flex flex-col p-3 rounded-2xl border text-left transition-all ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                        : 'border-[#222] bg-[#141414] hover:border-[#383838] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {active && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-md">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    <div className="w-full aspect-[4/3] rounded-xl bg-zinc-950/80 border border-white/10 flex items-center justify-center mb-2 shadow-inner p-2">
                      <img
                        src={`https://lichess1.org/assets/piece/${ps.id}/wN.svg`}
                        alt={ps.label}
                        className="w-10 h-10 drop-shadow-lg group-hover:scale-110 transition-transform"
                      />
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
                    className={`group relative flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                        : 'border-[#222] bg-[#141414] hover:border-[#383838] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full border border-white/20 shadow-md shrink-0"
                      style={{ backgroundColor: bg.previewColor }}
                    />
                    <span className="text-xs font-extrabold text-white truncate">{bg.label}</span>
                    {active && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-black shadow-md shrink-0">
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
