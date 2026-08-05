import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';

interface ExplorerMove {
  san: string;
  uci: string;
  count: number;
  pct: number;
  name?: string;
}

interface ExplorerData {
  opening: string | null;
  moves: ExplorerMove[];
}

const posKey = (fen: string) => fen.split(' ').slice(0, 4).join(' ');
let dataPromise: Promise<{ names: Record<string, string>; moves: Record<string, [string, string, number, string?][]> }> | null = null;

function loadData() {
  if (!dataPromise) {
    dataPromise = fetch('/explorer.json')
      .then(r => r.json())
      .catch(() => ({ names: {}, moves: {} }));
  }
  return dataPromise;
}

export async function getExplorer(fen: string): Promise<ExplorerData> {
  const data = await loadData();
  const key = posKey(fen);
  const list = data.moves[key] || [];
  const total = list.reduce((s: number, m: any) => s + (Array.isArray(m) ? m[2] : m.n || 0), 0) || 1;
  return {
    opening: data.names[key] || null,
    moves: list.map((m: any) => {
      const san = Array.isArray(m) ? m[0] : m.s;
      const uci = Array.isArray(m) ? m[1] : m.u;
      const count = Array.isArray(m) ? m[2] : m.n;
      const name = Array.isArray(m) ? m[3] : m.o;
      return { san, uci, count, pct: Math.round((count / total) * 100), name };
    }),
  };
}

interface ExplorePanelProps {
  fen: string;
  onPlay?: (uci: string) => void;
}

export default function ExplorePanel({ fen, onPlay }: ExplorePanelProps) {
  const [data, setData] = useState<ExplorerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getExplorer(fen).then(d => {
      if (cancelled) return;
      setData(d);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [fen]);

  return (
    <div className="bg-[#111] rounded-lg px-3 py-2 border border-[#1f1f1f]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3 text-neutral-500" />
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Opening Explorer</span>
        </div>
        {data?.opening && (
          <span className="text-[10px] text-[#81b64c] truncate max-w-[150px]">{data.opening}</span>
        )}
      </div>
      {loading ? (
        <p className="text-[10px] text-neutral-600">Loading…</p>
      ) : !data || !data.moves.length ? (
        <p className="text-[10px] text-neutral-600">Out of book — no theory data.</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {data.moves.slice(0, 6).map((m) => (
            <div
              key={m.uci}
              onClick={() => onPlay?.(m.uci)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#252525] text-neutral-300 font-mono cursor-pointer hover:bg-[#222] transition-colors relative overflow-hidden"
            >
              {/* Frequency bar */}
              <div className="absolute inset-0 opacity-10" style={{ width: `${m.pct}%`, background: '#34d399' }} />
              <span className="relative z-10">{m.san}</span>
              <span className="relative z-10 text-neutral-600 ml-1">{m.pct}%</span>
              {m.name && (
                <span className="relative z-10 text-[8px] text-neutral-600 ml-1 hidden sm:inline">{m.name}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
