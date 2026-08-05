import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { Chessboard, ChessboardProvider } from 'react-chessboard';
import { useTheme } from '@/hooks/useTheme';
import { Chess } from 'chess.js';
import { playMoveSound, playCaptureSound, playCheckSound, playBlunderSound, playBrilliantSound } from '@/utils/soundEffects';
import {
  Target,
  Trophy,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Zap,
  Clock,
  ExternalLink,
  Globe,
  RotateCcw,
  ChevronRight,
  Loader2,
  Lock,
  Star,
  Award,
  Layers,
  X,
  ShieldCheck,
  Settings,
  Volume2,
  VolumeX,
  Info,
  Play,
  Heart,
  TrendingUp,
  Flame,
  GraduationCap,
  AlertTriangle,
  Puzzle,
  BarChart3,
  Timer,
} from 'lucide-react';

interface LichessPuzzle {
  id: string;
  rating: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master' | 'Grandmaster';
  gameUrl: string;
  fen: string;
  moves?: string;
  solution?: string[];
  hint: string;
  theme: string;
  description: string;
}

export interface PuzzleLevel {
  id: number;
  title: string;
  subtitle: string;
  minElo: number;
  maxElo: number;
  puzzlesCount: number;
  icon: string;
  tier: 1 | 2;
}

export const PUZZLE_LEVELS: PuzzleLevel[] = [
  // Tier 1: Levels 1 - 5
  { id: 1,  tier: 1, title: 'Level 1: Novice Tactics',       subtitle: 'Hanging pieces & 1-move captures', minElo: 500,  maxElo: 950,  puzzlesCount: 5, icon: '♟️' },
  { id: 2,  tier: 1, title: 'Level 2: Basic Forks & Pins',    subtitle: 'Knight forks & bishop pins',        minElo: 950,  maxElo: 1150, puzzlesCount: 5, icon: '🗡️' },
  { id: 3,  tier: 1, title: 'Level 3: Skewers & Checks',     subtitle: 'Attacking valuable pieces',         minElo: 1150, maxElo: 1300, puzzlesCount: 5, icon: '🎯' },
  { id: 4,  tier: 1, title: 'Level 4: Back-Rank Mates',       subtitle: 'Trapping the enemy king',           minElo: 1300, maxElo: 1450, puzzlesCount: 5, icon: '⚡' },
  { id: 5,  tier: 1, title: 'Level 5: Discovered Attacks',   subtitle: 'Unmasking hidden threats',          minElo: 1450, maxElo: 1600, puzzlesCount: 5, icon: '💥' },

  // Tier 2: Levels 6 - 10 (Requires 4/5 Tier 1 completed)
  { id: 6,  tier: 2, title: 'Level 6: Removing Defender',    subtitle: 'Eliminating key protection',       minElo: 1600, maxElo: 1750, puzzlesCount: 5, icon: '🛡️' },
  { id: 7,  tier: 2, title: 'Level 7: Double Checks',         subtitle: 'Devastating forced checks',      minElo: 1750, maxElo: 1900, puzzlesCount: 5, icon: '🔥' },
  { id: 8,  tier: 2, title: 'Level 8: Deflection & Decoy',   subtitle: 'Luring pieces onto bad squares',   minElo: 1900, maxElo: 2050, puzzlesCount: 5, icon: '🌀' },
  { id: 9,  tier: 2, title: 'Level 9: Advanced Sacrifices',   subtitle: 'Queen & Rook sacrifices',           minElo: 2050, maxElo: 2200, puzzlesCount: 5, icon: '💎' },
  { id: 10, tier: 2, title: 'Level 10: Grandmaster Arena',    subtitle: 'Deep calculation combinations',     minElo: 2200, maxElo: 2800, puzzlesCount: 5, icon: '👑' },
];

function countCompletedTier1Levels(stars: Record<number, number>): number {
  let count = 0;
  for (let i = 1; i <= 5; i++) {
    if ((stars[i] || 0) > 0) count++;
  }
  return count;
}

function isLevelUnlocked(lvlId: number, unlockedLvl: number, stars: Record<number, number>): boolean {
  if (lvlId > 5) {
    const tier1Completed = countCompletedTier1Levels(stars);
    if (tier1Completed < 4) return false;
  }
  return lvlId <= unlockedLvl;
}

function getPuzzleSolution(p: any): string[] {
  if (!p) return [];
  if (Array.isArray(p.solution) && p.solution.length > 0) return p.solution;
  if (typeof p.solution === 'string' && p.solution.length > 0) return p.solution.split(' ').filter(Boolean);
  if (Array.isArray(p.moves) && p.moves.length > 0) return p.moves;
  if (typeof p.moves === 'string' && p.moves.length > 0) return p.moves.split(' ').filter(Boolean);
  return [];
}

function getSmartHintText(puzzle: any, step: number): string {
  if (!puzzle) return 'Look closely at the position for tactical opportunities.';
  const solution = getPuzzleSolution(puzzle);
  const nextMove = solution[step];
  const themeStr = puzzle.theme || puzzle.themes || 'tactics';

  if (!nextMove || nextMove.length < 4) {
    return `Look for tactical motifs: ${themeStr}`;
  }

  const fromSq = nextMove.slice(0, 2).toUpperCase();
  return `Focus on square ${fromSq} — what can your piece do from there? (Theme: ${themeStr})`;
}

// ── Dataset loading ──
let fullDataset: any[] | null = null;
let datasetLoad: Promise<any[]> | null = null;

async function getPuzzleDataset(): Promise<any[]> {
  if (fullDataset) return fullDataset;
  if (datasetLoad) return datasetLoad;
  datasetLoad = (async () => {
    try {
      const res = await fetch('/puzzles.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        fullDataset = data;
        return fullDataset;
      }
      throw new Error('Empty puzzle dataset');
    } catch (err) {
      datasetLoad = null;
      console.warn('Failed to load puzzle dataset:', err);
      return [];
    }
  })();
  return datasetLoad;
}

function getPuzzlesForLevel(all: any[], level: PuzzleLevel): any[] {
  if (!all || !all.length) return [];
  const pool = all.filter(p => (p.rating || 1500) >= level.minElo && (p.rating || 1500) <= level.maxElo);
  if (pool.length >= level.puzzlesCount) return pool.slice(0, level.puzzlesCount);
  return all.slice(0, level.puzzlesCount);
}

function pickPuzzle(all: any[], rating: number, recent: Set<string>): any | null {
  if (!all || !all.length) return null;
  for (const w of [100, 200, 400, 800, 9999]) {
    const pool = all.filter(p => Math.abs((p.rating || 1500) - rating) <= w && !recent.has(p.id));
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  return all[Math.floor(Math.random() * all.length)];
}

const RATING_KEY = 'chessreview:puzzleRating';
const RECENT_KEY = 'chessreview:recentPuzzles';
const UNLOCKED_LVL_KEY = 'chessreview:unlockedLevel';
const STARS_KEY = 'chessreview:levelStars';
const RUSH_HIGH_KEY = 'chessreview:rushHighScore';

const DIFFICULTY_OFFSETS: Record<string, number> = { Standard: 0, Hard: 200, 'Extra hard': 400, Random: 0 };

function difficultyOffset(difficulty: string): number {
  if (difficulty === 'Random') return Math.floor(Math.random() * 700) - 300;
  return DIFFICULTY_OFFSETS[difficulty] ?? 0;
}

function cardKeyHandler(fn: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };
}

function loadPuzzleRating(): number {
  try { return Number(localStorage.getItem(RATING_KEY)) || 1200; } catch { return 1200; }
}
function savePuzzleRating(r: number) {
  try { localStorage.setItem(RATING_KEY, String(Math.round(r))); } catch {}
}
function loadRecentIds(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecentIds(ids: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(-100))); } catch {}
}
function loadUnlockedLevel(): number {
  try { return Number(localStorage.getItem(UNLOCKED_LVL_KEY)) || 1; } catch { return 1; }
}
function saveUnlockedLevel(lvl: number) {
  try { localStorage.setItem(UNLOCKED_LVL_KEY, String(lvl)); } catch {}
}
function loadLevelStars(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(STARS_KEY) || '{}'); } catch { return {}; }
}
function saveLevelStars(stars: Record<number, number>) {
  try { localStorage.setItem(STARS_KEY, JSON.stringify(stars)); } catch {}
}
function loadRushHighScore(): number {
  try { return Number(localStorage.getItem(RUSH_HIGH_KEY)) || 0; } catch { return 0; }
}
function saveRushHighScore(s: number) {
  try { localStorage.setItem(RUSH_HIGH_KEY, String(s)); } catch {}
}

export function PuzzlePage() {
  const { pieces, boardTheme } = useTheme();
  const [allPuzzles, setAllPuzzles] = useState<any[]>([]);
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set(loadRecentIds()));
  const [currentPuzzle, setCurrentPuzzle] = useState<LichessPuzzle | null>(null);
  const [status, setStatus] = useState<'solving' | 'correct' | 'wrong'>('solving');
  const [game, setGame] = useState<Chess>(new Chess());
  const [fen, setFen] = useState('6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [solutionStep, setSolutionStep] = useState(1);
  const [userRating, setUserRating] = useState(loadPuzzleRating);
  const [streak, setStreak] = useState(4);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [pointsGained, setPointsGained] = useState(12);

  // Tab state: 'levels' | 'rated' | 'rush' | 'lichess_live'
  const [activeTab, setActiveTab] = useState<'levels' | 'rated' | 'rush' | 'lichess_live'>('levels');

  // Level Mode State
  const [unlockedLevel, setUnlockedLevel] = useState(loadUnlockedLevel);
  const [levelStars, setLevelStars] = useState<Record<number, number>>(loadLevelStars);
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [levelPuzzleIdx, setLevelPuzzleIdx] = useState(0);
  const [levelCorrectCount, setLevelCorrectCount] = useState(0);
  const [levelCompleteModal, setLevelCompleteModal] = useState(false);
  const [advanceIn, setAdvanceIn] = useState(0);
  const [selectedLevelCard, setSelectedLevelCard] = useState<PuzzleLevel | null>(null);

  // Chess.com Modals & Settings State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [difficultySetting, setDifficultySetting] = useState<'Standard' | 'Hard' | 'Extra hard' | 'Random'>('Standard');
  const [collectPuzzlePoints, setCollectPuzzlePoints] = useState(true);
  const [alwaysShowRating, setAlwaysShowRating] = useState(true);
  const [showPuzzleGoals, setShowPuzzleGoals] = useState(true);
  const [showMistakeFeedback, setShowMistakeFeedback] = useState(true);
  const [showChatHints, setShowChatHints] = useState(true);
  const [showTimer, setShowTimer] = useState(true);

  // Puzzle Rush states
  const [rushTimeLeft, setRushTimeLeft] = useState(180);
  const [rushScore, setRushScore] = useState(0);
  const [rushHighScore, setRushHighScore] = useState(loadRushHighScore);
  const [rushLives, setRushLives] = useState(3);
  const [rushActive, setRushActive] = useState(false);

  // Initial dataset load
  useEffect(() => {
    (async () => {
      const dataset = await getPuzzleDataset();
      setAllPuzzles(dataset);
      if (dataset.length > 0) {
        const lvlObj = PUZZLE_LEVELS[0];
        const pool = getPuzzlesForLevel(dataset, lvlObj);
        if (pool.length > 0) setCurrentPuzzle(pool[0]);
      }
    })();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (status === 'solving' && currentPuzzle && showTimer) {
      interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status, currentPuzzle, showTimer]);

  // Rush timer effect
  useEffect(() => {
    let interval: any = null;
    if (activeTab === 'rush' && rushActive && rushTimeLeft > 0 && rushLives > 0) {
      interval = setInterval(() => setRushTimeLeft(t => t - 1), 1000);
    } else if (rushTimeLeft === 0 || rushLives === 0) {
      setRushActive(false);
      if (rushScore > rushHighScore) {
        setRushHighScore(rushScore);
        saveRushHighScore(rushScore);
      }
    }
    return () => clearInterval(interval);
  }, [activeTab, rushActive, rushTimeLeft, rushLives, rushScore, rushHighScore]);

  const loadPuzzle = (p: LichessPuzzle | null) => {
    if (!p) return;
    setStatus('solving');
    setHintVisible(false);
    setHintSquare(null);
    setSolutionStep(1); // Player first move is at index 1!
    setTimerSeconds(0);

    try {
      const ch = new Chess(p.fen);
      const moves = getPuzzleSolution(p);

      // Play opponent setup move (moves[0]) automatically!
      if (moves.length > 0) {
        const setupUci = moves[0];
        try {
          ch.move({
            from: setupUci.slice(0, 2),
            to: setupUci.slice(2, 4),
            promotion: setupUci[4] || 'q',
          });
        } catch { /* ignore */ }
      }

      setGame(ch);
      setFen(ch.fen());
      // Orient board to player's side!
      setBoardOrientation(ch.turn() === 'w' ? 'white' : 'black');
    } catch {
      const ch = new Chess();
      setGame(ch);
      setFen(ch.fen());
      setBoardOrientation('white');
    }
  };

  useEffect(() => {
    if (currentPuzzle) {
      loadPuzzle(currentPuzzle);
    }
  }, [currentPuzzle]);

  const startLevel = (levelId: number) => {
    const lvlObj = PUZZLE_LEVELS.find(l => l.id === levelId) || PUZZLE_LEVELS[0];
    setCurrentLevelId(levelId);
    setLevelPuzzleIdx(0);
    setLevelCorrectCount(0);
    setLevelCompleteModal(false);
    setSelectedLevelCard(null);

    const pool = getPuzzlesForLevel(allPuzzles, lvlObj);
    if (pool.length > 0) {
      setCurrentPuzzle(pool[0]);
    }
  };

  const startLevelRef = useRef(startLevel);
  useEffect(() => {
    startLevelRef.current = startLevel;
  });

  useEffect(() => {
    if (!levelCompleteModal) {
      setAdvanceIn(0);
      return;
    }
    const nextLvl = currentLevelId + 1;
    if (!(isLevelUnlocked(nextLvl, unlockedLevel, levelStars) && nextLvl <= PUZZLE_LEVELS.length)) return;
    setAdvanceIn(4);
    let remaining = 4;
    const iv = setInterval(() => {
      remaining -= 1;
      setAdvanceIn(remaining);
      if (remaining <= 0) {
        clearInterval(iv);
        startLevelRef.current(nextLvl);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [levelCompleteModal, currentLevelId]);

  const completeLevel = (correctCount: number) => {
    const earnedStars = correctCount >= 4 ? 3 : correctCount >= 3 ? 2 : 1;
    const newStars = { ...levelStars, [currentLevelId]: Math.max(levelStars[currentLevelId] || 0, earnedStars) };
    setLevelStars(newStars);
    saveLevelStars(newStars);

    const nextLvl = currentLevelId + 1;
    if (nextLvl <= 5) {
      setUnlockedLevel(Math.max(unlockedLevel, nextLvl));
      saveUnlockedLevel(Math.max(unlockedLevel, nextLvl));
    } else if (nextLvl > 5 && nextLvl <= PUZZLE_LEVELS.length) {
      const t1Completed = countCompletedTier1Levels(newStars);
      if (t1Completed >= 4) {
        setUnlockedLevel(Math.max(unlockedLevel, nextLvl));
        saveUnlockedLevel(Math.max(unlockedLevel, nextLvl));
      }
    }
    setLevelCompleteModal(true);
  };

  const advanceLevelPuzzle = () => {
    const lvlObj = PUZZLE_LEVELS.find(l => l.id === currentLevelId) || PUZZLE_LEVELS[0];
    const pool = getPuzzlesForLevel(allPuzzles, lvlObj);
    const nextIdx = levelPuzzleIdx + 1;

    if (nextIdx < pool.length) {
      setLevelPuzzleIdx(nextIdx);
      setCurrentPuzzle(pool[nextIdx]);
    } else {
      completeLevel(levelCorrectCount);
    }
  };

  const fetchLiveLichessPuzzle = async () => {
    setIsLiveLoading(true);
    try {
      const res = await fetch('https://lichess.org/api/puzzle/daily');
      if (res.ok) {
        const data = await res.json();
        if (data && data.puzzle && data.game) {
          const livePuz: LichessPuzzle = {
            id: data.puzzle.id,
            rating: data.puzzle.rating || 1500,
            level: 'Advanced',
            gameUrl: `https://lichess.org/${data.game.id}`,
            fen: data.game.treeParts ? data.game.treeParts[0]?.fen : 'r6k/pp2r2p/4Rp1q/3p4/8/3P2R1/PPP1Q1PP/7K b - - 0 28',
            solution: data.puzzle.solution || ['e7e6'],
            hint: 'Find the highest engine evaluation move sequence.',
            theme: data.puzzle.themes ? data.puzzle.themes.slice(0, 2).join(' • ') : 'Lichess Daily Tactic',
            description: `Live Daily Lichess Puzzle #${data.puzzle.id}`,
          };
          setCurrentPuzzle(livePuz);
        }
      }
    } catch {
      loadPuzzle(currentPuzzle);
    } finally {
      setIsLiveLoading(false);
    }
  };

  const startRush = () => {
    setRushTimeLeft(180);
    setRushScore(0);
    setRushLives(3);
    setRushActive(true);
    if (allPuzzles.length > 0) {
      const puz = allPuzzles[Math.floor(Math.random() * allPuzzles.length)];
      setCurrentPuzzle(puz);
    }
  };

  const advanceRushPuzzle = () => {
    if (!allPuzzles.length) return;
    const puz = allPuzzles[Math.floor(Math.random() * allPuzzles.length)];
    setCurrentPuzzle(puz);
  };

  const handlePieceDrop = (args: any, secondArg?: any): boolean => {
    if (!currentPuzzle) return false;
    const sourceSquare = typeof args === 'object' && args ? args.sourceSquare : args;
    const targetSquare = typeof args === 'object' && args ? args.targetSquare : secondArg;
    if (!sourceSquare || !targetSquare) return false;
    if (status !== 'solving') return false;

    const solution = getPuzzleSolution(currentPuzzle);
    if (!solution || solutionStep >= solution.length) return false;

    const playedUci = sourceSquare + targetSquare;
    const expectedUci = solution[solutionStep];

    if (playedUci === expectedUci) {
      const gameCopy = new Chess(game.fen());
      try {
        const moveRes = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
        setGame(gameCopy);
        setFen(gameCopy.fen());

        if (moveRes && moveRes.captured) playCaptureSound();
        else playMoveSound();

        const nextStep = solutionStep + 1;
        if (nextStep >= solution.length) {
          setStatus('correct');
          setStreak(s => s + 1);
          playBrilliantSound();

          if (activeTab === 'levels') {
            const newCorrect = levelCorrectCount + 1;
            setLevelCorrectCount(newCorrect);

            const lvlObj = PUZZLE_LEVELS.find(l => l.id === currentLevelId) || PUZZLE_LEVELS[0];
            const pool = getPuzzlesForLevel(allPuzzles, lvlObj);
            if (levelPuzzleIdx >= pool.length - 1) {
              setTimeout(() => completeLevel(newCorrect), 900);
            } else {
              setTimeout(() => advanceLevelPuzzle(), 1600);
            }
          } else if (activeTab === 'rush' && rushActive) {
            setRushScore(sc => {
              const newSc = sc + 1;
              if (newSc > rushHighScore) {
                setRushHighScore(newSc);
                saveRushHighScore(newSc);
              }
              return newSc;
            });
            setTimeout(() => advanceRushPuzzle(), 600);
          } else {
            const pg = timerSeconds < 15 ? 18 : 12;
            setPointsGained(pg);
            setUserRating(userRating + pg);
            savePuzzleRating(userRating + pg);
          }
        } else {
          setSolutionStep(nextStep);
          setTimeout(() => {
            const oppUci = solution[nextStep];
            if (oppUci && oppUci.length >= 4) {
              try {
                gameCopy.move({ from: oppUci.slice(0, 2), to: oppUci.slice(2, 4), promotion: oppUci[4] || 'q' });
                setGame(new Chess(gameCopy.fen()));
                setFen(gameCopy.fen());
                setSolutionStep(nextStep + 1);
              } catch { /* ignore */ }
            }
          }, 350);
        }
        return true;
      } catch {
        return false;
      }
    } else {
      setStatus('wrong');
      setStreak(0);
      playBlunderSound();

      if (activeTab === 'rush' && rushActive) {
        setRushLives(l => {
          const newL = Math.max(0, l - 1);
          if (newL === 0) setRushActive(false);
          return newL;
        });
        setTimeout(() => advanceRushPuzzle(), 800);
      } else {
        const newR = Math.max(800, userRating - 10);
        setUserRating(newR);
        savePuzzleRating(newR);
      }
      return false;
    }
  };

  const showHintAction = () => {
    if (!currentPuzzle) return;
    setHintVisible(true);
    const solution = getPuzzleSolution(currentPuzzle);
    if (solution && solution[solutionStep]) {
      setHintSquare(solution[solutionStep].slice(0, 2));
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeLevelObj = PUZZLE_LEVELS.find(l => l.id === currentLevelId) || PUZZLE_LEVELS[0];
  const tier1CompletedCount = countCompletedTier1Levels(levelStars);
  const sideToMove = game.turn() === 'b' ? 'Black' : 'White';
  const totalStarsEarned = Object.values(levelStars).reduce((a, b) => a + b, 0);

  if (!currentPuzzle) {
    return (
      <div className="w-full flex-1 bg-transparent text-zinc-100 flex flex-col items-center justify-center py-16 px-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <span className="text-xs font-mono text-zinc-400">Loading Chess Puzzles...</span>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 bg-transparent text-zinc-100 flex flex-col justify-between py-3 max-w-6xl mx-auto px-3 selection:bg-emerald-500/30 relative">

      {/* ── CHESS.COM SETTINGS MODAL ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#2b2926] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl text-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-extrabold text-lg text-white">Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-white text-xs">Difficulty</label>
                <select
                  value={difficultySetting}
                  onChange={(e: any) => setDifficultySetting(e.target.value)}
                  className="w-full bg-[#1e1c1a] border border-zinc-700 rounded-xl p-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Standard">✓ Standard</option>
                  <option value="Hard">Hard</option>
                  <option value="Extra hard">Extra hard</option>
                  <option value="Random">Random</option>
                </select>
                <p className="text-[10px] text-zinc-400">All difficulty options are matched to your skill level.</p>
              </div>

              {[
                { label: 'Collect Puzzle Points', sub: 'Level up with points for each puzzle you solve!', state: collectPuzzlePoints, set: setCollectPuzzlePoints },
                { label: 'Always Show Rating', sub: 'Keep your rating in view as you earn Puzzle Points.', state: alwaysShowRating, set: setAlwaysShowRating },
                { label: 'Show Puzzle Goals', sub: 'Coach will advise you on the main goal of each Puzzle.', state: showPuzzleGoals, set: setShowPuzzleGoals },
                { label: 'Show Mistake Feedback', sub: 'Coach will help explain your mistakes.', state: showMistakeFeedback, set: setShowMistakeFeedback },
                { label: 'Show Chat Hints', sub: 'Get advice from Coach when you ask for a hint.', state: showChatHints, set: setShowChatHints },
                { label: 'Show Timer', sub: 'Display live puzzle stopwatch timer.', state: showTimer, set: setShowTimer },
              ].map(tg => (
                <div key={tg.label} className="flex items-center justify-between gap-3 pt-1 border-t border-white/5">
                  <div>
                    <div className="font-extrabold text-white text-xs">{tg.label}</div>
                    <div className="text-[10px] text-zinc-400 leading-tight">{tg.sub}</div>
                  </div>
                  <button
                    onClick={() => tg.set(!tg.state)}
                    className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${
                      tg.state ? 'bg-[#81b64c]' : 'bg-zinc-700'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${
                      tg.state ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 bg-[#81b64c] hover:bg-[#74a544] text-white font-extrabold rounded-xl text-xs transition-all shadow-md active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── CHESS PUZZLES INTRO MODAL ── */}
      {showIntroModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#2b2926] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center text-zinc-200 space-y-4 relative">
            <button onClick={() => setShowIntroModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 bg-zinc-800 rounded-2xl border border-white/10 flex items-center justify-center mx-auto shadow-inner">
              <svg viewBox="0 0 40 40" className="w-10 h-10">
                <rect x="6" y="22" width="7" height="14" rx="2" fill="#52525b" />
                <rect x="16.5" y="16" width="7" height="20" rx="2" fill="#71717a" />
                <rect x="27" y="10" width="7" height="26" rx="2" fill="#a1a1aa" />
                <path d="M5 24 L18 13 L33 5" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <polygon points="35,4 33,10 28,6" fill="#38bdf8" />
              </svg>
            </div>

            <div>
              <h2 className="font-extrabold text-xl text-white">Chess Puzzles</h2>
              <p className="text-xs text-zinc-400 mt-1">Train with chess puzzles and improve your game.</p>
            </div>

            <div className="text-left space-y-2.5 text-xs text-zinc-300 bg-[#1e1c1a] p-3.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2.5">
                <Puzzle className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Solve puzzles to increase your rating</span>
              </div>
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Puzzles get more difficult as you get better</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Timer className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Solve quickly for maximum time bonus</span>
              </div>
            </div>

            <button
              onClick={() => setShowIntroModal(false)}
              className="w-full py-3 bg-[#81b64c] hover:bg-[#74a544] text-white font-extrabold rounded-xl text-sm transition-all shadow-lg active:scale-95"
            >
              Ok
            </button>
          </div>
        </div>
      )}

      {/* ── LEVEL CARD DETAIL MODAL ── */}
      {selectedLevelCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#2b2926] border border-white/10 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#81b64c]/20 border border-[#81b64c]/40 flex items-center justify-center mx-auto text-3xl">
              {selectedLevelCard.icon}
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">{selectedLevelCard.title}</h3>
              <p className="text-xs text-zinc-400 mt-1">{selectedLevelCard.subtitle}</p>
              <div className="text-xs text-[#81b64c] font-mono mt-1 font-bold">Target Rating: {selectedLevelCard.minElo}–{selectedLevelCard.maxElo} ELO</div>
            </div>

            <div className="flex justify-center text-amber-400 gap-1 my-2">
              {[1, 2, 3].map(st => (
                <Star key={st} className={`w-5 h-5 ${(levelStars[selectedLevelCard.id] || 0) >= st ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedLevelCard(null)}
                className="flex-1 py-3 bg-[#1e1c1a] hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={() => startLevel(selectedLevelCard.id)}
                className="flex-1 py-3 btn-chess-green text-xs flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Level</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEVEL COMPLETED CELEBRATION MODAL ── */}
      {levelCompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#2b2926] border border-[#81b64c]/40 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#81b64c]/20 border border-[#81b64c]/40 flex items-center justify-center mx-auto text-[#81b64c]">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Level Complete!</h3>
              <p className="text-xs text-zinc-400 mt-1">You solved {levelCorrectCount} out of {activeLevelObj.puzzlesCount} puzzles in {activeLevelObj.title}!</p>
            </div>

            <div className="flex justify-center text-amber-400 gap-1 my-2">
              {[1, 2, 3].map(st => (
                <Star key={st} className={`w-6 h-6 ${st <= (levelCorrectCount >= activeLevelObj.puzzlesCount ? 3 : levelCorrectCount >= 3 ? 2 : 1) ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
              ))}
            </div>

            {currentLevelId === 5 && tier1CompletedCount < 4 && (
              <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl font-bold flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Complete at least 4 out of 5 Tier 1 Levels to unlock Levels 6–10! ({tier1CompletedCount}/4 Completed)</span>
              </div>
            )}

            {isLevelUnlocked(currentLevelId + 1, unlockedLevel, levelStars) && currentLevelId < PUZZLE_LEVELS.length ? (
              <>
                <button
                  onClick={() => {
                    setLevelCompleteModal(false);
                    startLevel(currentLevelId + 1);
                  }}
                  className="w-full py-3 bg-[#81b64c] hover:bg-[#74a544] text-white font-extrabold rounded-full text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Next Level ➔</span>
                </button>
                <p className="text-[10px] text-zinc-500 font-mono">
                  {PUZZLE_LEVELS[currentLevelId]
                    ? `Auto-starting ${PUZZLE_LEVELS[currentLevelId].title.split(':')[0]} in ${advanceIn}s…`
                    : 'Auto-starting next level…'}
                </p>
              </>
            ) : (
              <button
                onClick={() => setLevelCompleteModal(false)}
                className="w-full py-3 bg-[#81b64c] hover:bg-[#74a544] text-white font-extrabold rounded-full text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <span>View Level Map</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Header Controls Bar */}
      <div className="bg-[#2b2926] rounded-2xl border border-white/10 p-3 shrink-0 backdrop-blur-md shadow-md flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#81b64c] flex items-center justify-center text-zinc-950 font-bold shadow-md">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white leading-none">Chess Puzzles Arena</h1>
            <span className="text-[11px] text-zinc-400 font-mono">
              {activeTab === 'levels' ? 'Campaign Levels' : activeTab === 'rush' ? 'Puzzle Rush Mode' : activeTab === 'rated' ? 'Rated Tactics' : 'Live Lichess Daily'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {alwaysShowRating && activeTab !== 'rush' && (
            <div className="flex items-center gap-1 bg-[#1e1c1a] border border-zinc-700 px-2.5 py-1 rounded-full font-mono text-xs text-[#81b64c] font-bold shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{userRating}</span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-[#1e1c1a] border border-zinc-700 px-2 py-1 rounded-full font-mono text-xs text-amber-400 font-bold shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{streak}</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white border border-white/5"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
          <button
            onClick={() => setShowIntroModal(true)}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white border border-white/5"
            title="Puzzle Info"
          >
            <Info className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white border border-white/5"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Mode Segment Control Pills */}
      <div className="bg-[#2b2926] p-1 rounded-full border border-white/10 grid grid-cols-4 gap-1 mb-2 shadow-inner">
        <button
          onClick={() => setActiveTab('levels')}
          className={`py-1.5 rounded-full text-xs font-extrabold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'levels'
              ? 'bg-[#81b64c] text-white shadow-md scale-[1.02]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Levels</span>
        </button>

        <button
          onClick={() => setActiveTab('rated')}
          className={`py-1.5 rounded-full text-xs font-extrabold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'rated'
              ? 'bg-[#81b64c] text-white shadow-md scale-[1.02]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Rated</span>
        </button>

        <button
          onClick={() => setActiveTab('rush')}
          className={`py-1.5 rounded-full text-xs font-extrabold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'rush'
              ? 'bg-amber-500 text-black shadow-md scale-[1.02]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Rush</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('lichess_live');
            fetchLiveLichessPuzzle();
          }}
          className={`py-1.5 rounded-full text-xs font-extrabold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'lichess_live'
              ? 'bg-[#81b64c] text-white shadow-md scale-[1.02]'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Live API</span>
        </button>
      </div>

      {/* Rush Top Bar */}
      {activeTab === 'rush' && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl mb-2 flex items-center justify-between text-xs px-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-amber-400 font-extrabold font-mono text-sm">
              <Clock className="w-4 h-4" />
              <span>{formatTimer(rushTimeLeft)}</span>
            </div>
            <div className="text-white font-extrabold font-mono text-sm">
              Score: <span className="text-[#81b64c] font-black text-base">{rushScore}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex text-sm gap-1">
              {[1, 2, 3].map(l => (
                <Heart key={l} className={`w-4 h-4 ${l <= rushLives ? 'fill-red-500 text-red-500' : 'text-zinc-700'}`} />
              ))}
            </div>
            {!rushActive && (
              <button
                onClick={startRush}
                className="px-4 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-full text-xs transition-all shadow-md active:scale-95 flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>Start Rush</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN ARENA ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 items-start my-1" style={{ minHeight: 0 }}>

        {/* LEFT COLUMN: CHESSBOARD & COACH SPEECH BUBBLE (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center gap-2">

          {/* Coach Speech Bubble Above Board */}
          {showPuzzleGoals && (
            <div className="w-full max-w-[min(100%,430px)] bg-[#2b2926] border border-white/10 rounded-2xl p-2.5 flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shrink-0 shadow-md">
                <div className="w-full h-full bg-zinc-900 rounded-[10px] flex items-center justify-center text-amber-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#1e1c1a] border border-white/10 rounded-xl px-3 py-1.5 flex-1 relative text-xs">
                <div className="flex items-center gap-1.5 font-extrabold text-white">
                  <span className={`w-2.5 h-2.5 rounded-full ${game.turn() === 'b' ? 'bg-zinc-900 border border-white' : 'bg-white'}`} />
                  <span>{sideToMove} to move</span>
                </div>
                <p className="text-[11px] text-zinc-300 font-medium leading-tight mt-0.5">
                  {hintVisible
                    ? getSmartHintText(currentPuzzle, solutionStep)
                    : status === 'solving'
                    ? activeTab === 'rush' ? 'Fast! Solve as many tactics as possible!' : 'Look closely. The winning move is ready to play!'
                    : status === 'correct'
                    ? activeTab === 'rush' ? 'Great! +1 Rush Score!' : 'Great vision! You calculated the winning sequence.'
                    : activeTab === 'rush' ? 'Wrong! -1 Life remaining.' : 'Not quite! Try another move or tap Retry.'}
                </p>
              </div>
            </div>
          )}

          {/* Prominent Mobile Hint Banner directly above chessboard */}
          {hintVisible && (
            <div className="w-full max-w-[min(100%,430px)] bg-amber-500/20 border border-amber-500/40 rounded-2xl p-3 text-xs text-amber-200 font-bold flex items-center justify-between shadow-xl animate-in zoom-in-95">
              <div className="flex items-center gap-2.5">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                <span>{getSmartHintText(currentPuzzle, solutionStep)}</span>
              </div>
              <button
                onClick={() => setHintVisible(false)}
                className="p-1 rounded-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 ml-2 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Metadata Card */}
          <div className="w-full max-w-[min(100%,430px)] bg-[#2b2926] rounded-2xl border border-white/10 px-3.5 py-2 text-xs flex items-center justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-white">
                <a
                  href={currentPuzzle.gameUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#81b64c] flex items-center gap-1 transition-colors"
                >
                  <span>Lichess #{currentPuzzle.id}</span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              </div>
              <span className="text-[10px] text-[#81b64c] font-mono">{currentPuzzle.theme}</span>
            </div>

            <div className="flex items-center gap-2">
              {showTimer && activeTab !== 'rush' && (
                <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {timerSeconds}s
                </span>
              )}

              <span className="text-[10px] bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                {currentPuzzle.rating} ELO
              </span>
            </div>
          </div>

          {/* Chessboard Container */}
          <div className="w-full max-w-[min(100%,430px)] aspect-square relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl touch-none">
            <ChessboardProvider options={{
              pieces,
              position: fen,
              boardOrientation,
              darkSquareStyle: { backgroundColor: boardTheme.dark, backgroundImage: boardTheme.darkTexture },
              lightSquareStyle: { backgroundColor: boardTheme.light, backgroundImage: boardTheme.lightTexture },
              showNotation: true,
              onPieceDrop: handlePieceDrop,
              squareStyles: hintSquare ? { [hintSquare]: { backgroundColor: 'rgba(234, 179, 8, 0.65)', border: '2px solid #fbbf24' } } : {},
            }}>
              <Chessboard />
            </ChessboardProvider>
          </div>

          {/* Feedback Banners */}
          {status === 'correct' && (
            <div className="w-full max-w-[min(100%,430px)] bg-[#81b64c]/20 border border-[#81b64c]/40 rounded-2xl p-2.5 flex items-center gap-2 text-emerald-300 text-xs font-bold animate-in fade-in shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-[#81b64c] shrink-0" />
              <div>
                <div className="text-white font-extrabold">
                  {activeTab === 'rush'
                    ? 'Puzzle Rush Solved! (+1 Score)'
                    : activeTab === 'levels'
                    ? `Level Tactic Solved! (${levelCorrectCount}/${activeLevelObj.puzzlesCount})`
                    : collectPuzzlePoints
                    ? `Tactic Solved! (+${pointsGained} ELO)`
                    : 'Tactic Solved!'}
                </div>
                <span className="text-[10px] text-emerald-300 font-normal">
                  {activeTab === 'rush'
                    ? `Current Rush Score: ${rushScore} • Lives Left: ${rushLives}`
                    : currentPuzzle.description}
                </span>
              </div>
            </div>
          )}

          {status === 'wrong' && showMistakeFeedback && (
            <div className="w-full max-w-[min(100%,430px)] bg-red-500/20 border border-red-500/40 rounded-2xl p-2.5 flex items-center gap-2 text-red-300 text-xs font-bold animate-in fade-in shadow-lg" role="alert">
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <div className="text-white font-extrabold">
                  {activeTab === 'rush' ? 'Missed Tactic! (-1 Life)' : 'Incorrect Move (-10 ELO)'}
                </div>
                <span className="text-[10px] text-red-200 font-normal">
                  {activeTab === 'rush' ? `Lives Remaining: ${rushLives}` : 'Tap Retry below to calculate again!'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DYNAMIC PANEL BASED ON ACTIVE TAB (5 Cols) */}
        <div className="lg:col-span-5 w-full bg-[#2b2926] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[530px]">

          {/* TAB 1: LEVELS ROADMAP (ONLY SHOWN IN LEVELS TAB) */}
          {activeTab === 'levels' && (
            <>
              {/* Top Campaign Progress Card Header */}
              <div className="p-3 bg-[#1e1c1a] border-b border-white/10 shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#81b64c]" />
                    <span className="font-black text-xs text-white uppercase tracking-wider">Campaign Roadmap</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-400 font-bold font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{totalStarsEarned} / 30 Stars</span>
                  </div>
                </div>

                {/* Campaign Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span>Level {currentLevelId} of {PUZZLE_LEVELS.length}</span>
                    <span className="text-[#81b64c] font-bold">{Math.round((currentLevelId / PUZZLE_LEVELS.length) * 100)}% Complete</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-white/5">
                    <div
                      className="bg-gradient-to-r from-[#81b64c] to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(currentLevelId / PUZZLE_LEVELS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Gamified Vertical Campaign Timeline Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar">

                {/* Tier 1 Header */}
                <div className="flex items-center justify-between text-[10px] font-extrabold text-[#81b64c] pt-1 pb-1 border-b border-[#81b64c]/20">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>TIER 1 (LEVELS 1–5: NOVICE)</span>
                  </span>
                  <span className="font-mono bg-[#81b64c]/20 px-2 py-0.5 rounded-full">{tier1CompletedCount}/5 Complete</span>
                </div>

                {PUZZLE_LEVELS.filter(l => l.tier === 1).map(lvl => {
                  const unlocked = isLevelUnlocked(lvl.id, unlockedLevel, levelStars);
                  const stars = levelStars[lvl.id] || 0;
                  const isCurrent = lvl.id === currentLevelId;

                  return (
                    <div
                      key={lvl.id}
                      role="button"
                      tabIndex={unlocked ? 0 : -1}
                      aria-disabled={!unlocked}
                      onClick={() => unlocked && setSelectedLevelCard(lvl)}
                      onKeyDown={unlocked ? cardKeyHandler(() => setSelectedLevelCard(lvl)) : undefined}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? 'bg-[#81b64c]/20 border-[#81b64c] shadow-lg ring-2 ring-[#81b64c]/40 scale-[1.01]'
                          : unlocked
                          ? 'bg-[#1e1c1a] border-white/10 hover:border-[#81b64c]/40'
                          : 'bg-zinc-950/60 border-zinc-800/80 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border ${
                          isCurrent
                            ? 'bg-[#81b64c] text-white border-white/20 shadow-md'
                            : unlocked
                            ? 'bg-zinc-800 text-white border-white/10'
                            : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                        }`}>
                          {lvl.icon}
                        </div>

                        <div>
                          <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                            <span>{lvl.title}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider animate-pulse">
                                Current
                              </span>
                            )}
                            {!unlocked && <Lock className="w-3 h-3 text-zinc-500" />}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">{lvl.subtitle}</div>
                          <div className="text-[9px] text-[#81b64c] font-mono mt-0.5 font-bold">{lvl.minElo}–{lvl.maxElo} ELO</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {unlocked ? (
                          <div className="flex text-amber-400 text-xs">
                            {[1, 2, 3].map(st => (
                              <Star key={st} className={`w-3.5 h-3.5 ${st <= stars ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[9px] font-mono bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500">Locked</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Tier 2 Lock Gate Banner */}
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 my-2">
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-amber-400">
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>TIER 2 (LEVELS 6–10: ADVANCED)</span>
                    </span>
                    <span className={`font-mono px-2 py-0.5 rounded-full ${tier1CompletedCount >= 4 ? 'bg-[#81b64c]/20 text-[#81b64c]' : 'bg-amber-500/20 text-amber-300'}`}>
                      {tier1CompletedCount >= 4 ? 'UNLOCKED' : `LOCKED (${tier1CompletedCount}/4 Completed)`}
                    </span>
                  </div>
                </div>

                {PUZZLE_LEVELS.filter(l => l.tier === 2).map(lvl => {
                  const unlocked = isLevelUnlocked(lvl.id, unlockedLevel, levelStars);
                  const stars = levelStars[lvl.id] || 0;
                  const isCurrent = lvl.id === currentLevelId;

                  return (
                    <div
                      key={lvl.id}
                      role="button"
                      tabIndex={unlocked ? 0 : -1}
                      aria-disabled={!unlocked}
                      onClick={() => unlocked && setSelectedLevelCard(lvl)}
                      onKeyDown={unlocked ? cardKeyHandler(() => setSelectedLevelCard(lvl)) : undefined}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-500 shadow-lg ring-2 ring-amber-400/40 scale-[1.01]'
                          : unlocked
                          ? 'bg-[#1e1c1a] border-white/10 hover:border-amber-500/40'
                          : 'bg-zinc-950/60 border-zinc-800/80 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border ${
                          isCurrent
                            ? 'bg-amber-500 text-black border-white/20 shadow-md'
                            : unlocked
                            ? 'bg-zinc-800 text-white border-white/10'
                            : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                        }`}>
                          {lvl.icon}
                        </div>

                        <div>
                          <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
                            <span>{lvl.title}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider animate-pulse">
                                Current
                              </span>
                            )}
                            {!unlocked && <Lock className="w-3 h-3 text-zinc-500" />}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">{lvl.subtitle}</div>
                          <div className="text-[9px] text-amber-400 font-mono mt-0.5 font-bold">{lvl.minElo}–{lvl.maxElo} ELO</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {unlocked ? (
                          <div className="flex text-amber-400 text-xs">
                            {[1, 2, 3].map(st => (
                              <Star key={st} className={`w-3.5 h-3.5 ${st <= stars ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[9px] font-mono bg-zinc-800 px-2 py-0.5 rounded-full text-amber-400/80">
                            Requires 4/5 Tier 1
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

              </div>
            </>
          )}

          {/* TAB 2: PUZZLE RUSH DASHBOARD (SHOWN IN RUSH TAB) */}
          {activeTab === 'rush' && (
            <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="font-black text-sm text-white uppercase tracking-wider">Puzzle Rush Arena</span>
                  </div>
                  <span className="text-xs bg-amber-500/20 text-amber-300 font-mono px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold">
                    3 Minute Speed Run
                  </span>
                </div>

                {/* Score & Timer Big Display */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1e1c1a] border border-white/10 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Puzzles Solved</span>
                    <div className="text-3xl font-black text-[#81b64c] font-mono">{rushScore}</div>
                  </div>

                  <div className="bg-[#1e1c1a] border border-white/10 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Personal High</span>
                    <div className="text-3xl font-black text-amber-400 font-mono">{rushHighScore}</div>
                  </div>
                </div>

                {/* Lives Card */}
                <div className="bg-[#1e1c1a] border border-white/10 p-3.5 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300">Lives Remaining</span>
                  <div className="flex text-lg gap-1.5">
                    {[1, 2, 3].map(l => (
                      <Heart key={l} className={`w-5 h-5 ${l <= rushLives ? 'fill-red-500 text-red-500 animate-pulse' : 'text-zinc-700'}`} />
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-xs text-amber-200 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-300">
                  <Zap className="w-3.5 h-3.5 fill-amber-300" />
                  <span>How Rush Works:</span>
                </div>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Solve as many tactical puzzles as you can in 3 minutes! You have 3 lives. Each mistake loses 1 life. Good luck!
                  </p>
                </div>
              </div>

              {/* Start / Reset Rush Button */}
              <button
                onClick={startRush}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5 fill-black" />
                <span>{rushActive ? 'Restart Rush' : 'Start 3-Min Rush'}</span>
              </button>
            </div>
          )}

          {/* TAB 3: RATED DASHBOARD (SHOWN IN RATED TAB) */}
          {activeTab === 'rated' && (
            <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#81b64c]" />
                    <span className="font-black text-sm text-white uppercase tracking-wider">Rated Tactics Arena</span>
                  </div>
                  <span className="text-xs bg-[#81b64c]/20 text-[#81b64c] font-mono px-2.5 py-0.5 rounded-full border border-[#81b64c]/30 font-bold">
                    Official ELO
                  </span>
                </div>

                {/* ELO Display Card */}
                <div className="bg-[#1e1c1a] border border-white/10 p-5 rounded-2xl text-center space-y-1 shadow-inner">
                  <span className="text-xs text-zinc-400 uppercase font-black tracking-wider">Tactical ELO Rating</span>
                  <div className="text-4xl font-black text-[#81b64c] font-mono">{userRating}</div>
                  <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center justify-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+12 to +18 for a solve, −10 for a miss</span>
                  </div>
                </div>

                {/* Stats Breakdown */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#1e1c1a] p-3.5 rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Active Streak</span>
                    <div className="text-xl font-extrabold text-amber-400 font-mono mt-0.5 flex items-center justify-center gap-1">
                      <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {streak}
                    </div>
                  </div>

                  <div className="bg-[#1e1c1a] p-3.5 rounded-2xl border border-white/10 text-center">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Dataset Pool</span>
                    <div className="text-xl font-extrabold text-cyan-400 font-mono mt-0.5">{allPuzzles.length.toLocaleString() || '—'}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const puz = pickPuzzle(allPuzzles, userRating + difficultyOffset(difficultySetting), new Set());
                  if (puz) setCurrentPuzzle(puz);
                }}
                className="w-full py-3.5 btn-chess-green text-sm flex items-center justify-center gap-2"
              >
                <span>Play Next Rated Puzzle</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}

          {/* TAB 4: LICHESS LIVE API DASHBOARD (SHOWN IN LIVE API TAB) */}
          {activeTab === 'lichess_live' && (
            <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    <span className="font-black text-sm text-white uppercase tracking-wider">Live Lichess Daily</span>
                  </div>
                  <span className="text-xs bg-cyan-500/20 text-cyan-300 font-mono px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-bold">
                    Worldwide Live API
                  </span>
                </div>

                <div className="bg-[#1e1c1a] border border-white/10 p-4 rounded-2xl space-y-2 text-xs">
                  <div className="font-extrabold text-white flex items-center gap-1.5">
                    <span>Live Lichess Tactic #{currentPuzzle.id}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Fetched live from Lichess's public puzzle API.
                  </p>
                  <div className="text-[10px] text-[#81b64c] font-mono font-bold pt-1">
                    Theme: {currentPuzzle.theme}
                  </div>
                </div>
              </div>

              <button
                onClick={fetchLiveLichessPuzzle}
                disabled={isLiveLoading}
                className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold rounded-2xl text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLiveLoading ? 'Fetching Live API...' : 'Fetch New Live Daily Puzzle'}</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Sleek Chess.com Style Pill Action Bar */}
      <div className="p-2.5 bg-[#2b2926] border border-white/10 rounded-full shrink-0 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-2 px-3 mt-2">
        {showChatHints && (
          <button
            onClick={showHintAction}
            className="flex-1 py-2 rounded-full bg-[#1e1c1a] hover:bg-zinc-800 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Hint</span>
          </button>
        )}

        <button
          onClick={() => loadPuzzle(currentPuzzle)}
          className="flex-1 py-2 rounded-full bg-[#1e1c1a] hover:bg-zinc-800 border border-white/10 text-zinc-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          <span>Retry</span>
        </button>

        <button
          onClick={() => {
            if (activeTab === 'levels') {
              advanceLevelPuzzle();
            } else if (activeTab === 'rush') {
              advanceRushPuzzle();
            } else if (activeTab === 'lichess_live') {
              fetchLiveLichessPuzzle();
            } else if (activeTab === 'rated') {
              const recentSet = new Set(recentIds);
              const puz = pickPuzzle(allPuzzles, userRating + difficultyOffset(difficultySetting), recentSet);
              if (puz) {
                setRecentIds(new Set([...recentIds, puz.id]));
                saveRecentIds([...recentIds, puz.id]);
                setCurrentPuzzle(puz);
              }
            }
          }}
          disabled={isLiveLoading}
          className="flex-1 py-2 rounded-full bg-[#81b64c] hover:bg-[#74a544] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
        >
          <span>{isLiveLoading ? 'Loading...' : 'Next'}</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}
