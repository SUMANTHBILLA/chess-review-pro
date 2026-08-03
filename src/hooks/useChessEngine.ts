import { useCallback, useRef, useState, useEffect } from 'react';

type EngineStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface EngineAnalysis {
  evaluation: number;
  bestMove: string;
  depth?: number;
}

const STOCKFISH_URL = 'https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16-single.js';
const STOCKFISH_WASM_URL = 'https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16-single.wasm';

export function useChessEngine() {
  const [status, setStatus] = useState<EngineStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<Worker | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  const initEngine = useCallback((): Promise<void> => {
    if (initPromiseRef.current) return initPromiseRef.current;
    setStatus('loading');
    setError(null);

    initPromiseRef.current = (async () => {
      let worker: Worker;
      try {
        const resp = await fetch(STOCKFISH_URL, { cache: 'no-cache' });
        if (!resp.ok) throw new Error(`Failed to fetch Stockfish script: ${resp.status}`);
        const scriptText = await resp.text();
        const safeScript = scriptText.replace(/stockfish-nnue-16-single\.wasm/g, STOCKFISH_WASM_URL);
        const bootstrap = `self.Module = self.Module || {}; self.Module.locateFile = function(path){ return ${JSON.stringify(STOCKFISH_WASM_URL)}; };\n` + safeScript;
        const blobUrl = URL.createObjectURL(new Blob([bootstrap], { type: 'application/javascript' }));
        worker = new Worker(blobUrl);
        URL.revokeObjectURL(blobUrl);
      } catch (fetchErr) {
        setStatus('error');
        setError('Unable to fetch Stockfish. Check network connection.');
        initPromiseRef.current = null;
        return;
      }

      const timeout = setTimeout(() => {
        const msg = 'Stockfish did not finish loading.';
        worker.terminate();
        engineRef.current = null;
        setStatus('error');
        setError(msg);
        initPromiseRef.current = null;
      }, 30_000);

      worker.onmessage = (event: MessageEvent<unknown>) => {
        if (typeof event.data !== 'string' || !event.data.includes('uciok')) return;
        clearTimeout(timeout);
        engineRef.current = worker;
        setStatus('ready');
      };

      worker.onerror = () => {
        clearTimeout(timeout);
        worker.terminate();
        engineRef.current = null;
        setStatus('error');
        setError('Unable to load Stockfish.');
        initPromiseRef.current = null;
      };

      worker.postMessage('uci');
    })();
    return initPromiseRef.current;
  }, []);

  useEffect(() => { initEngine().catch(() => {}); }, [initEngine]);

  const runSearch = useCallback(
    (fen: string, targetDepth: number, movetimeMs: number): Promise<EngineAnalysis> =>
      new Promise((resolve) => {
        const worker = engineRef.current;
        if (!worker) {
          resolve({ evaluation: 0, bestMove: 'e2e4', depth: 0 });
          return;
        }

        let highestDepth = 0;
        let lastEvaluation = 0;
        let lastBest = 'e2e4';

        const timeout = setTimeout(() => {
          worker.removeEventListener('message', onMsg);
          const side = fen.split(' ')[1];
          resolve({ evaluation: side === 'b' ? -lastEvaluation : lastEvaluation, bestMove: lastBest, depth: highestDepth });
        }, movetimeMs + 1500);

        const onMsg = (event: MessageEvent<unknown>) => {
          if (typeof event.data !== 'string') return;
          const str = event.data;

          // Parse current depth from info line
          const depthMatch = str.match(/\binfo\s+.*?\bdepth\s+(\d+)/);
          const currentDepth = depthMatch ? parseInt(depthMatch[1], 10) : 0;

          const sc = str.match(/\bscore\s+cp\s+(-?\d+)/);
          const mt = str.match(/\bscore\s+mate\s+(-?\d+)/);

          if (currentDepth >= highestDepth) {
            if (sc) {
              highestDepth = currentDepth;
              lastEvaluation = Number(sc[1]) / 100;
            } else if (mt) {
              highestDepth = currentDepth;
              const mateIn = parseInt(mt[1], 10);
              lastEvaluation = mateIn > 0 ? 10 : -10;
            }
          }

          const bm = str.match(/^bestmove\s+(\S+)/);
          if (bm) {
            clearTimeout(timeout);
            worker.removeEventListener('message', onMsg);
            lastBest = bm[1];
            const side = fen.split(' ')[1];
            resolve({ evaluation: side === 'b' ? -lastEvaluation : lastEvaluation, bestMove: lastBest, depth: highestDepth });
          }
        };

        worker.addEventListener('message', onMsg);
        worker.postMessage('stop');
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${targetDepth} movetime ${movetimeMs}`);
      }),
    []
  );

  const analyzePosition = useCallback(
    async (fen: string, opts?: { depth?: number; movetime?: number }): Promise<EngineAnalysis> => {
      try {
        if (!engineRef.current && status === 'idle') await initEngine();
        const targetDepth = opts?.depth || 12;
        const movetime = opts?.movetime || 1200;
        return await runSearch(fen, targetDepth, movetime);
      } catch {
        return { evaluation: 0, bestMove: 'e2e4', depth: 0 };
      }
    },
    [initEngine, runSearch, status]
  );

  return { status, isReady: status === 'ready', error, initEngine, analyzePosition };
}
