import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Zap, BarChart2, Calendar, ChessKnight, ArrowRight, Gem, Target, XCircle, CircleSlash } from 'lucide-react';
import { getStatsData } from '@/utils/statsStorage';

interface StatsPageProps {
  onNavigateHome?: () => void;
}

export function StatsPage({ onNavigateHome }: StatsPageProps) {
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    const data = getStatsData();
    setStatsData(data);
  }, []);

  return (
    <div className="w-full flex-1 bg-transparent text-zinc-100 flex flex-col justify-between py-3 max-w-xl mx-auto px-3 selection:bg-[#81b64c]/30">
      {/* Header */}
      <div className="bg-zinc-900/90 rounded-3xl border border-white/10 p-4 mb-3 shrink-0 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#81b64c] flex items-center justify-center text-white font-bold shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-white leading-none">Personal Progress & Analytics</h1>
              <span className="text-xs text-zinc-400 font-mono mt-0.5 block">
                {statsData ? 'Live Data from Your Analyzed Games' : 'Your Official Performance Metrics'}
              </span>
            </div>
          </div>
          {statsData && (
            <span className="text-[10px] bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30 font-mono font-bold px-3 py-1 rounded-full">
              Local Sync
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!statsData ? (
        /* Clean Empty State when user hasn't analyzed any games yet */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-900/60 rounded-3xl border border-white/10 my-2 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-zinc-800/80 border border-white/10 flex items-center justify-center text-[#81b64c] shadow-xl">
            <ChessKnight className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h2 className="text-base font-extrabold text-white">No Game Data Saved Yet</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Import a PGN or paste moves on the Home Screen to analyze your first game. Your real accuracy, ELO growth, and move metrics will appear here live!
            </p>
          </div>
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="px-5 py-2.5 bg-[#81b64c] hover:bg-[#74a544] text-white font-extrabold rounded-full text-xs transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <span>Analyze Your First Game</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Real Stats Grid from User Games */
        <div className="space-y-3 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/90 rounded-3xl p-4 border border-white/10 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Average Accuracy</span>
                <Zap className="w-4 h-4 text-[#81b64c]" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-[#81b64c] mt-2">
                {statsData.avgAccuracy}%
              </div>
              <span className="text-[10px] text-zinc-500 mt-1">Across {statsData.totalGames} analyzed games</span>
            </div>

            <div className="bg-zinc-900/90 rounded-3xl p-4 border border-white/10 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
                <span>Peak ELO Rating</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-amber-400 mt-2">
                ~{statsData.peakRating}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1">Estimated from move accuracy</span>
            </div>
          </div>

          <div className="bg-zinc-900/90 rounded-3xl p-4 border border-white/10 shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/5 pb-2">
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-[#81b64c]" />
                <span>Accumulated Move Badges</span>
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">Real Games</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-zinc-950/80 p-3 rounded-2xl border border-[#81b64c]/20">
                <div className="flex justify-center"><Gem className="w-5 h-5 text-[#81b64c]" /></div>
                <div className="font-extrabold text-[#81b64c] font-mono mt-1 text-base">{statsData.totalBrilliant || 0}</div>
                <div className="text-[10px] text-zinc-400 font-semibold">Brilliant</div>
              </div>

              <div className="bg-zinc-950/80 p-3 rounded-2xl border border-[#81b64c]/20">
                <div className="flex justify-center"><Target className="w-5 h-5 text-[#81b64c]" /></div>
                <div className="font-extrabold text-[#81b64c] font-mono mt-1 text-base">{statsData.totalGreat || 0}</div>
                <div className="text-[10px] text-zinc-400 font-semibold">Great</div>
              </div>

              <div className="bg-zinc-950/80 p-3 rounded-2xl border border-fuchsia-500/20">
                <div className="flex justify-center"><CircleSlash className="w-5 h-5 text-fuchsia-400" /></div>
                <div className="font-extrabold text-fuchsia-400 font-mono mt-1 text-base">{statsData.totalMisses || 0}</div>
                <div className="text-[10px] text-zinc-400 font-semibold">Missed Tactics</div>
              </div>

              <div className="bg-zinc-950/80 p-3 rounded-2xl border border-red-500/20">
                <div className="flex justify-center"><XCircle className="w-5 h-5 text-red-400" /></div>
                <div className="font-extrabold text-red-400 font-mono mt-1 text-base">{statsData.totalBlunders || 0}</div>
                <div className="text-[10px] text-zinc-400 font-semibold">Blunders</div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/90 rounded-3xl p-4 border border-white/10 shadow-md space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/5 pb-2">
              <span>Your Analyzed Game History</span>
              <span className="text-[11px] text-zinc-400 font-mono">Accuracy</span>
            </div>

            <div className="space-y-2">
              {statsData.history.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/90 border border-white/5 text-xs">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-bold text-white text-xs truncate">{item.opening}</div>
                    <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      <span>{item.white} vs {item.black} ({item.result})</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-extrabold text-[#81b64c] text-sm">
                      {Math.round((item.whiteAccuracy + item.blackAccuracy) / 2)}%
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">~{Math.round((item.whiteElo + item.blackElo) / 2)} ELO avg</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
