import { Crown, ShieldCheck, Heart, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigateHome?: () => void;
}

export function Footer({ onNavigateHome }: FooterProps) {
  return (
    <footer className="w-full bg-[#09090b] border-t border-white/[0.08] text-zinc-400 text-xs py-6 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand info */}
        <div className="flex items-center gap-2 text-center md:text-left">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Crown className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="font-extrabold text-white tracking-tight">Chess Review</span>
          <span className="text-zinc-600">&middot;</span>
          <span className="text-zinc-400 font-mono text-[11px]">Grandmaster Analysis Studio</span>
        </div>

        {/* Engine status pill */}
        <div className="flex items-center gap-2 bg-zinc-900/80 border border-white/10 px-3.5 py-1.5 rounded-full text-[11px] text-zinc-300 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Grandmaster Neural Engine</span>
          <span className="text-zinc-600">&bull;</span>
          <span className="text-emerald-400 font-medium">100% Local</span>
        </div>

        {/* Action link & copyright */}
        <div className="flex items-center gap-4 text-[11px] text-zinc-400">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="hover:text-emerald-400 font-medium transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
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
