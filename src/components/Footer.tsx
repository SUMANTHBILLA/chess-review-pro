import { ShieldCheck, Heart, Sparkles } from 'lucide-react';
import mainIcon from '@/assets/main-icon.png';

interface FooterProps {
  onNavigateHome?: () => void;
}

export function Footer({ onNavigateHome }: FooterProps) {
  return (
    <footer className="w-full bg-[#09090b] border-t border-white/[0.08] text-zinc-400 text-xs py-2 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 text-center">
        {/* Brand info */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-7 sm:h-8 w-auto shrink-0 flex items-center justify-center">
            <img src={mainIcon} alt="Chess Review PRO" className="h-full w-auto object-contain drop-shadow-[0_1px_6px_rgba(129,182,76,0.3)]" />
          </div>
          <span className="font-extrabold text-white tracking-tight">Chess Review</span>
          <span className="text-zinc-600">&middot;</span>
          <span className="text-zinc-400 font-mono text-[11px]">Grandmaster Analysis Studio</span>
        </div>

        {/* Engine status pill */}
        <div className="flex items-center gap-2 bg-zinc-900/80 border border-white/10 px-3.5 py-1.5 rounded-full text-[11px] text-zinc-300 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-[#81b64c] shrink-0" />
          <span>Grandmaster Neural Engine</span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-[#81b64c] font-medium">100% Local</span>
        </div>

        {/* Action link & copyright */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="hover:text-[#81b64c] font-medium transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-[#81b64c]" />
              <span>Analyze New Game</span>
            </button>
          )}
          <span className="flex items-center gap-1 text-zinc-500">
            Built with <Heart className="w-3 h-3 text-red-500 fill-red-500/30 inline" /> for Chess Players
          </span>
        </div>
      </div>
    </footer>
  );
}
