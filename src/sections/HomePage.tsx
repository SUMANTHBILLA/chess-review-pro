import { useState, useRef, useEffect } from 'react';
import { useChessEngine } from '@/hooks/useChessEngine';
import { useGameAnalysis } from '@/hooks/useGameAnalysis';
import { parsePgn } from '@/utils/pgnParser';
import { isChessComUrl, isLichessUrl, fetchChessComGame, fetchLichessGame } from '@/utils/gameFetcher';
import type { ParsedGame, GameReview } from '@/types/chess';
import {
  Loader2,
  ArrowRight,
  ClipboardPaste,
  History,
  Sparkles,
  Search,
} from 'lucide-react';

interface HomePageProps {
  onReview: (game: ParsedGame, review: GameReview) => void;
}

const RECENT_KEY = 'chessReview_recentGames';

export function HomePage({ onReview }: HomePageProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [recentGames, setRecentGames] = useState<
    { label: string; pgn: string; timestamp: number }[]
  >([]);

  const engine = useChessEngine();
  const analysis = useGameAnalysis();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecentGames(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persistRecent = (updated: { label: string; pgn: string; timestamp: number }[]) => {
    setRecentGames(updated);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(updated.slice(0, 5))); } catch { /* ignore */ }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { setInput(text.trim()); setError(''); }
    } catch {
      setError('Clipboard access denied. Please paste manually.');
    }
  };

  const saveRecent = (game: ParsedGame, pgn: string) => {
    const label = `${game.white || 'White'} vs ${game.black || 'Black'} (${game.result})`;
    const updated = [{ label, pgn, timestamp: Date.now() }, ...recentGames.filter(g => g.pgn !== pgn)];
    persistRecent(updated);
  };

  const submitPgn = async (pgnString: string) => {
    setError('');
    try {
      const parsed = parsePgn(pgnString);
      if (!parsed || parsed.moves.length === 0) {
        setError('No valid chess moves found. Please paste a valid PGN or move list.');
        return;
      }
      const rev = await analysis.analyzeGame(parsed, engine);
      if (rev) { saveRecent(parsed, pgnString); onReview(parsed, rev); }
      else setError('Analysis failed. Please check the move format.');
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze game.');
    }
  };

  const handleSubmit = async () => {
    const raw = input.trim();
    if (!raw) { setError('Please paste a PGN string, move text, or Chess.com game link.'); return; }
    setError('');
    try {
      let pgnString = raw;
      if (isChessComUrl(raw)) pgnString = await fetchChessComGame(raw);
      else if (isLichessUrl(raw)) pgnString = await fetchLichessGame(raw);
      await submitPgn(pgnString);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch or parse game.');
    }
  };

  const loadRecent = async (pgn: string) => {
    setError('');
    try {
      const parsed = parsePgn(pgn);
      if (!parsed || parsed.moves.length === 0) return;
      const rev = await analysis.analyzeGame(parsed, engine);
      if (rev) onReview(parsed, rev);
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze game.');
    }
  };

  return (
    <div className="w-full flex-1 bg-[#262421] text-zinc-100 flex flex-col items-center justify-center py-6 px-3">
      {/* Main Hero Card Container */}
      <div className="w-full max-w-2xl bg-[#2b2926] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        
        {/* Header Title & Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#81b64c]/20 border border-[#81b64c]/30 text-[#81b64c] text-xs font-extrabold font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Grandmaster Stockfish 16 Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Import &amp; Review Your Chess Game
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Paste any Chess.com URL, Lichess link, or PGN notation for instant Grandmaster move-by-move evaluation and accuracy scores.
          </p>
        </div>

        {/* Input Box & Action Buttons */}
        <div className="space-y-3 text-left">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => { setInput(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Paste Chess.com URL, Lichess URL, or PGN notation..."
              className="w-full bg-[#1e1c1a] border border-white/15 focus:border-[#81b64c] rounded-2xl py-3.5 pl-4 pr-24 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner font-mono"
            />
            <button
              onClick={handlePaste}
              className="absolute right-2 top-2 bottom-2 px-3 bg-[#312e2b] hover:bg-[#3d3935] text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/5 active:scale-95"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-amber-400" />
              <span>Paste</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold animate-in fade-in">
              ⚠️ {error}
            </div>
          )}

          {/* Primary Action Button */}
          <button
            onClick={handleSubmit}
            disabled={analysis.isAnalyzing}
            className="w-full btn-chess-green py-3.5 text-sm sm:text-base flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {analysis.isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Evaluating Moves with Neural Engine... ({Math.round(analysis.progress)}%)</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Start Game Review ➔</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Sample Games Grid */}
        <div className="pt-4 border-t border-white/10 space-y-2 text-left">
          <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider block">
            Try Sample Grandmaster Battles:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { label: 'Magnus Carlsen vs Hikaru Nakamura', pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 16. Bh4 c5 17. dxe5 Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21. Nc4 Nxc4 22. Bxc4 Nb6 23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 27. Qe3 Qg5 28. Qxg5 hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33. f3 Bc8 34. Kf2 Bf5 35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Nf4 38. g3 Nxh3 39. Kd2 Kb5 40. Rd6 Kc5 41. Ra6 Nf2 42. g4 Bd3 43. Re6 1/2-1/2' },
              { label: 'Kasparov vs Deep Blue 1997', pgn: '1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4 Nf6 5. Nf3 Bg4 6. Be2 e6 7. h3 Bh5 8. O-O Nc6 9. Be3 cxd4 10. cxd4 Bb4 11. a3 Ba5 12. Nc3 Qd6 13. Nb5 Qe7 14. Ne5 Bxe2 15. Qxe2 O-O 16. Rac1 Rac8 17. Bg5 Bb6 18. Bxf6 gxf6 19. Nc4 Rfd8 20. Nxb6 axb6 21. Rfd1 f5 22. Qe3 Qf6 23. d5 Rxd5 24. Rxd5 exd5 25. b3 Kh8 26. Qxb6 Rg8 27. Qc5 d4 28. Nd6 f4 29. Nxb7 Ne5 30. Qd5 f3 31. g3 Nd3 32. Rc7 Re8 33. Nd6 Re1+ 34. Kh2 Nxf2 35. Nxf7+ Kg7 36. Ng5+ Kh6 37. Rxh7+ 1-0' },
            ].map(sample => (
              <button
                key={sample.label}
                onClick={() => submitPgn(sample.pgn)}
                disabled={analysis.isAnalyzing}
                className="p-3 rounded-2xl bg-[#1e1c1a] hover:bg-[#312e2b] border border-white/10 hover:border-[#81b64c]/40 text-xs font-bold text-white text-left transition-all flex items-center justify-between group active:scale-95"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base">♟️</span>
                  <span className="truncate group-hover:text-[#81b64c] transition-colors">{sample.label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#81b64c] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Games History List */}
        {recentGames.length > 0 && (
          <div className="pt-4 border-t border-white/10 space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#81b64c]" />
                <span>Recent Game Analyses ({recentGames.length})</span>
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
              {recentGames.map((g, idx) => (
                <button
                  key={idx}
                  onClick={() => loadRecent(g.pgn)}
                  disabled={analysis.isAnalyzing}
                  className="w-full p-2.5 rounded-xl bg-[#1e1c1a] hover:bg-[#312e2b] border border-white/5 hover:border-[#81b64c]/30 text-xs font-medium text-zinc-200 hover:text-white flex items-center justify-between transition-all group"
                >
                  <span className="truncate group-hover:text-[#81b64c] transition-colors">{g.label}</span>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0 ml-2">Analyze ➔</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
