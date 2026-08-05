import { useState } from 'react';
import { Palette, ArrowLeft, Target, BarChart2, GraduationCap, Volume2, VolumeX } from 'lucide-react';
import mainIcon from '@/assets/main-icon.png';
import { isMuted, toggleMuted } from '@/utils/soundEffects';

interface NavbarProps {
  currentScreen: 'home' | 'review' | 'puzzles' | 'stats' | 'learn';
  onNavigateHome: () => void;
  onNavigatePuzzles: () => void;
  onNavigateStats: () => void;
  onNavigateLearn: () => void;
  onOpenThemePicker: () => void;
  gameInfo?: {
    white: string;
    black: string;
    result: string;
    whiteRating?: number;
    blackRating?: number;
  };
}

export function Navbar({
  currentScreen,
  onNavigateHome,
  onNavigatePuzzles,
  onNavigateStats,
  onNavigateLearn,
  onOpenThemePicker,
  gameInfo,
}: NavbarProps) {
  const [muted, setMutedState] = useState(() => isMuted());

  const handleToggleSound = () => {
    const next = toggleMuted();
    setMutedState(next);
  };
  return (
    <header className="sticky top-0 z-40 w-full bg-[#1e1c1a] border-b border-white/10 shadow-xl safe-top">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
        {/* Left Section: Grandmaster Shield Logo */}
        <div className="flex items-center gap-3 min-w-0">
          {currentScreen === 'review' ? (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#312e2b] hover:bg-[#3d3935] text-white border border-white/10 transition-all text-xs font-extrabold shrink-0 shadow-md active:scale-95 group"
            >
              <ArrowLeft className="w-4 h-4 text-[#81b64c] group-hover:-translate-x-0.5 transition-transform" />
              <span>New Analysis</span>
            </button>
          ) : (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              {/* Knight/Falcon Logo */}
              <div className="h-10 sm:h-12 w-auto shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center">
                <img src={mainIcon} alt="Chess Review PRO" className="h-full w-auto object-contain drop-shadow-[0_2px_10px_rgba(129,182,76,0.35)]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-black text-base text-white tracking-tight leading-none group-hover:text-[#81b64c] transition-colors flex items-center gap-1.5">
                  <span>Chess Review</span>
                  <span className="text-[9px] bg-[#81b64c]/20 text-[#81b64c] px-1.5 py-0.2 rounded-full border border-[#81b64c]/30 font-mono font-extrabold">PRO</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono font-semibold leading-none mt-1">
                  Grandmaster Studio
                </span>
              </div>
            </button>
          )}

          {/* Game summary header on review page */}
          {currentScreen === 'review' && gameInfo && (
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#262421] border border-white/10 text-xs text-zinc-300 min-w-0 shadow-sm">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-white shrink-0 shadow-sm" />
                <span className="font-bold text-white truncate max-w-[120px]">
                  {gameInfo.white}
                </span>
                {gameInfo.whiteRating && (
                  <span className="text-[10px] text-zinc-400 font-mono">({gameInfo.whiteRating})</span>
                )}
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#1e1c1a] text-[#81b64c] border border-[#81b64c]/20 font-mono shrink-0">
                {gameInfo.result}
              </span>
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-600 shrink-0" />
                <span className="font-bold text-white truncate max-w-[120px]">
                  {gameInfo.black}
                </span>
                {gameInfo.blackRating && (
                  <span className="text-[10px] text-zinc-400 font-mono">({gameInfo.blackRating})</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Navigation Tab Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={onNavigateLearn}
            title="Grandmaster Academy"
            className={`w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 ${
              currentScreen === 'learn'
                ? 'bg-[#81b64c] text-white shadow-md'
                : 'bg-[#262421] text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Academy</span>
          </button>

          <button
            onClick={onNavigatePuzzles}
            title="Tactical Puzzles"
            className={`w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 ${
              currentScreen === 'puzzles'
                ? 'bg-[#81b64c] text-white shadow-md'
                : 'bg-[#262421] text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <Target className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Puzzles</span>
          </button>

          <button
            onClick={onNavigateStats}
            title="Analytics"
            className={`w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 ${
              currentScreen === 'stats'
                ? 'bg-[#81b64c] text-white shadow-md'
                : 'bg-[#262421] text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <BarChart2 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Stats</span>
          </button>

          <button
            onClick={onOpenThemePicker}
            title="Custom Themes"
            className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl bg-[#262421] hover:bg-[#312e2b] text-zinc-300 hover:text-white border border-white/10 transition-all text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
          >
            <Palette className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Theme</span>
          </button>

          <button
            onClick={handleToggleSound}
            title={muted ? 'Unmute Move Sounds' : 'Mute Move Sounds'}
            className="w-9 h-9 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-xl bg-[#262421] hover:bg-[#312e2b] text-zinc-300 hover:text-white border border-white/10 transition-all text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400 shrink-0" /> : <Volume2 className="w-4 h-4 text-[#81b64c] shrink-0" />}
          </button>
        </div>
      </div>
    </header>
  );
}
