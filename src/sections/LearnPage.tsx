import { useState, type KeyboardEvent } from 'react';
import { Chessboard, ChessboardProvider } from 'react-chessboard';
import { useTheme } from '@/hooks/useTheme';
import { Chess } from 'chess.js';
import { playMoveSound, playCaptureSound, playBlunderSound, playBrilliantSound } from '@/utils/soundEffects';
import { GraduationCap, Award, CheckCircle2, ChevronRight, Check, Play } from 'lucide-react';

interface LessonStep {
  stepNumber: number;
  prompt: string;
  fen: string;
  expectedMoveUci: string; // e.g. 'e2e4'
  opponentReplyUci?: string; // e.g. 'e7e5'
  explanation: string;
}

interface Lesson {
  id: string;
  category: 'Foundations' | 'Tactics' | 'Openings' | 'Strategy' | 'Sacrifices' | 'GM Endgames';
  chapter: string;
  title: string;
  eloRange: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master' | 'Grandmaster';
  overview: string;
  steps: LessonStep[];
}

const COMPLETE_GM_CURRICULUM: Lesson[] = [
  // ── DOMAIN 1: FOUNDATIONS (0 - 1000 ELO) ──
  {
    id: 'f-1',
    category: 'Foundations',
    chapter: 'Domain 1: Basic Foundations',
    title: '1. Occupying the Center',
    eloRange: '0 - 1000 ELO',
    difficulty: 'Beginner',
    overview: 'Master central control: occupying d4, e4, d5, e5 gives your pieces maximum space and mobility.',
    steps: [
      {
        stepNumber: 1,
        prompt: 'White to move: Play 1. e4 to stake your claim in the center of the board!',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        expectedMoveUci: 'e2e4',
        opponentReplyUci: 'e7e5',
        explanation: 'Excellent! 1. e4 controls d5 and f5 while opening diagonals for your Queen and Light-Squared Bishop.',
      },
      {
        stepNumber: 2,
        prompt: 'Black played 1... e5. Now develop your Knight to f3 to attack Black\'s e5 pawn!',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        expectedMoveUci: 'g1f3',
        opponentReplyUci: 'b8c6',
        explanation: 'Perfect! Developing with threat (Nf3 attacking e5) forces Black to defend, keeping the initiative.',
      },
    ],
  },
  {
    id: 'f-2',
    category: 'Foundations',
    chapter: 'Domain 1: Basic Foundations',
    title: '2. Rapid Piece Development',
    eloRange: '0 - 1000 ELO',
    difficulty: 'Beginner',
    overview: 'Develop your minor pieces (Knights & Bishops) before moving major pieces or pawns twice.',
    steps: [
      {
        stepNumber: 1,
        prompt: 'White to move: Develop your Knight to f3, attacking Black\'s e5 pawn!',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        expectedMoveUci: 'g1f3',
        opponentReplyUci: 'b8c6',
        explanation: 'Perfect! Developing with threat forces Black to react, keeping the initiative.',
      },
      {
        stepNumber: 2,
        prompt: 'Now develop your Bishop to b5 (Bb5) — the Ruy Lopez. It pins Black\'s knight against their king!',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3',
        expectedMoveUci: 'f1b5',
        opponentReplyUci: 'a7a6',
        explanation: 'Excellent! Bb5 develops a piece and puts pressure on the c6 knight. That is 3 pieces developed in 3 moves.',
      },
    ],
  },
  {
    id: 'f-3',
    category: 'Foundations',
    chapter: 'Domain 1: Basic Foundations',
    title: '3. King Safety & Castling',
    eloRange: '0 - 1000 ELO',
    difficulty: 'Beginner',
    overview: 'Safeguard your King behind a wall of pawns while activating your Rook.',
    steps: [
      {
        stepNumber: 1,
        prompt: 'White to move: Castle Kingside (O-O) to tuck your King into safety!',
        fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
        expectedMoveUci: 'e1g1',
        opponentReplyUci: 'd7d6',
        explanation: 'Grandmaster Move! Castling moves your King out of the dangerous center and connects your Rooks.',
      },
      {
        stepNumber: 2,
        prompt: 'Finish development: bring your Knight to c3 (Nc3) so both knights are in the game.',
        fen: 'r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 5 5',
        expectedMoveUci: 'b1c3',
        opponentReplyUci: 'e8g8',
        explanation: 'Solid! Now both knights are developed and Black has castled too. Development first, attacks later.',
      },
    ],
  },
  {
    id: 'f-4',
    category: 'Foundations',
    chapter: 'Domain 1: Basic Foundations',
    title: '4. The Back-Rank Mate',
    eloRange: '0 - 800 ELO',
    difficulty: 'Beginner',
    overview: 'Exploit trapped kings on the 8th rank blocked by their own pawns.',
    steps: [
      {
        stepNumber: 1,
        prompt: 'White to move: Deliver a Back-Rank Checkmate with 1. Rd8#!',
        fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
        expectedMoveUci: 'd1d8',
        explanation: 'Checkmate! Black\'s King is trapped behind its own pawn wall on f7, g7, and h7.',
      },
    ],
  },

  // ── DOMAIN 2: ESSENTIAL TACTICS (800 - 1200 ELO) ──
  {
    id: 't-1',
    category: 'Tactics',
    chapter: 'Domain 2: Essential Tactics',
    title: '5. The Knight Fork',
    eloRange: '800 - 1200 ELO',
    difficulty: 'Intermediate',
    overview: 'Attack King and Heavy pieces simultaneously with your Knight.',
    steps: [
      {
        stepNumber: 1,
        prompt: 'White to move: Play Nc7+ to fork Black\'s King on e8 and Rook on a8!',
        fen: 'rnbqkbnr/pppp1ppp/8/1N2p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3',
        expectedMoveUci: 'b5c7',
        explanation: 'Brilliant Fork! The knight attacks the King and the Rook simultaneously. Black must respond to check, and you win material next move.',
      },
    ],
  },
  {
    id: 't-2',
    category: 'Tactics',
    chapter: 'Domain 2: Essential Tactics',
    title: '6. The Absolute Pin',
    eloRange: '800 - 1200 ELO',
    difficulty: 'Intermediate',
    overview: 'Pin enemy pieces to the King so they cannot move legally.',
    steps: [
      {
        stepNumber: 1,
        prompt: 'White to move: Play Bg5 to pin Black\'s Knight to the Queen!',
        fen: 'r1bqk2r/pppp1ppp/2n2n2/4p3/4P3/2NP1N2/PPP2PPP/R2QKB1R w KQkq - 0 5',
        expectedMoveUci: 'c1g5',
        explanation: 'Deadly Pin! Moving the f6 Knight would expose Black\'s Queen to capture.',
      },
    ],
  },
  {
    id: 't-3',
    category: 'Tactics',
    chapter: 'Domain 2: Essential Tactics',
    title: '7. Discovered Check',
    eloRange: '800 - 1200 ELO',
    difficulty: 'Intermediate',
    overview: 'Unveil a check from your Bishop or Rook by moving an attacking piece out of the way.',
    steps: [
      {
        stepNumber: 1,
        prompt: 'White to move: Move your Knight to d5 (Nd5+) to deliver a discovered check from your Bishop!',
        fen: 'r1bqk2r/pppp1ppp/8/4N3/1b2n3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 5',
        expectedMoveUci: 'e5d5',
        explanation: 'Devastating Discovered Check! Black\'s King is under check from the Bishop on c4.',
      },
    ],
  },

  // ── DOMAIN 3: OPENING SYSTEMS (1200 - 1500 ELO) ──
  {
    id: 'o-1',
    category: 'Openings',
    chapter: 'Domain 3: Opening Systems',
    title: '8. Italian Game & Fried Liver',
    eloRange: '1200 - 1500 ELO',
    difficulty: 'Intermediate',
    overview: 'Target the weak f7 pawn with Bishop and Knight coordination.',
    steps: [
      {
        stepNumber: 1,
        prompt: 'White to move: Play Bc4 to enter the Italian Game targeting f7!',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3',
        expectedMoveUci: 'f1c4',
        opponentReplyUci: 'g8f6',
        explanation: 'Classic Opening Choice! Bc4 exerts pressure directly on Black\'s weakest square (f7).',
      },
      {
        stepNumber: 2,
        prompt: 'Support the center: play d3 to keep your pawn structure flexible.',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 4',
        expectedMoveUci: 'd2d3',
        opponentReplyUci: 'd7d6',
        explanation: 'The Italian setup! d3 keeps the center solid and prepares to reroute the Bishop to e3 or b3 later.',
      },
    ],
  },
  {
    id: 'o-2',
    category: 'Openings',
    chapter: 'Domain 3: Opening Systems',
    title: '9. The Queen\'s Gambit',
    eloRange: '1200 - 1500 ELO',
    difficulty: 'Intermediate',
    overview: 'Sacrifice a flank pawn (2. c4) for complete domination over the center.',
    steps: [
      {
        stepNumber: 1,
        prompt: 'White to move: Play 2. c4 to offer the Queen\'s Gambit!',
        fen: 'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2',
        expectedMoveUci: 'c2c4',
        explanation: 'Strategic Mastery! If Black takes (dxc4), White plays e4 for full pawn center supremacy.',
      },
    ],
  },

  // ── DOMAIN 4: POSITIONAL STRATEGY (1500 - 1800 ELO) ──
  {
    id: 's-1',
    category: 'Strategy',
    chapter: 'Domain 4: Positional Strategy',
    title: '10. The Unshakeable Outpost',
    eloRange: '1500 - 1800 ELO',
    difficulty: 'Advanced',
    overview: 'Establish a Knight on a central outpost that enemy pawns cannot drive away.',
    steps: [
      {
        stepNumber: 1,
        prompt: 'White to move: Plant your Knight on the dominant d5 outpost square!',
        fen: 'r2q1rk1/ppp1bppp/2n2n2/3p4/3P4/2N2N2/PPP1BPPP/R2Q1RK1 w - - 0 9',
        expectedMoveUci: 'c3d5',
        explanation: 'Master Outpost! On d5, your Knight dominates central diagonals and cannot be kicked by pawns.',
      },
    ],
  },
  {
    id: 's-2',
    category: 'Strategy',
    chapter: 'Domain 4: Positional Strategy',
    title: '11. Good vs Bad Bishop',
    eloRange: '1500 - 1800 ELO',
    difficulty: 'Advanced',
    overview: 'Keep your pawns on squares of opposite color to your Bishop to maximize mobility.',
    steps: [
      {
        stepNumber: 1,
        prompt: 'White to move: Advance your pawn to b3 to keep your light-squared Bishop active!',
        fen: '2r1k2r/pp2bppp/1q2p3/3pP3/1P1P4/P4N2/5PPP/R2Q1RK1 w k - 0 16',
        expectedMoveUci: 'b4b3',
        explanation: 'Positional Precision! Keeping pawns off your Bishop\'s color complex prevents bad bishop traps.',
      },
    ],
  },

  // ── DOMAIN 5: ADVANCED SACRIFICES (1800 - 2200 ELO) ──
  {
    id: 'sac-1',
    category: 'Sacrifices',
    chapter: 'Domain 5: Advanced Sacrifices',
    title: '12. The Greek Gift (Bxh7+)',
    eloRange: '1800 - 2200 ELO',
    difficulty: 'Master',
    overview: 'Demolish the castled King\'s pawn shield with a tactical Bishop sacrifice on h7.',
    steps: [
      {
        stepNumber: 1,
        prompt: 'White to move: Execute Bxh7+ to strip Black\'s King cover!',
        fen: 'r1bq1rk1/ppp2ppp/2n5/3pP3/3P4/2PB1N2/P4PPP/R2Q1RK1 w - - 0 1',
        expectedMoveUci: 'd3h7',
        opponentReplyUci: 'g8h7',
        explanation: 'Devastating Sacrifice! Black\'s King is drawn out, setting up Ng5+ and Qh5 attack.',
      },
    ],
  },

  // ── DOMAIN 6: GRANDMASTER ENDGAME (2200 - 2500+ ELO) ──
  {
    id: 'gm-1',
    category: 'GM Endgames',
    chapter: 'Domain 6: GM Endgames',
    title: '13. Lucena Position (Rook Bridge)',
    eloRange: '2200 - 2500+ ELO',
    difficulty: 'Grandmaster',
    overview: 'Learn the essential GM endgame technique: building a bridge with your Rook to promote your pawn.',
    steps: [
      {
        stepNumber: 1,
        prompt: 'White to move: Play Rd4! Prepare the rook bridge on the 4th rank.',
        fen: '1K1R4/1P2k3/8/8/8/8/8/2r5 w - - 0 1',
        expectedMoveUci: 'd8d4',
        explanation: 'Grandmaster Perfection! On the 4th rank, the Rook will intercept all checks when your King steps out.',
      },
    ],
  },
];

export function LearnPage() {
  const { pieces, boardTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeLesson, setActiveLesson] = useState<Lesson>(COMPLETE_GM_CURRICULUM[0]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [stepStatus, setStepStatus] = useState<'pending' | 'success' | 'wrong'>('pending');
  const [game, setGame] = useState<Chess>(new Chess(COMPLETE_GM_CURRICULUM[0].steps[0].fen));
  const [fen, setFen] = useState(COMPLETE_GM_CURRICULUM[0].steps[0].fen);

  const filteredCurriculum = selectedCategory === 'All'
    ? COMPLETE_GM_CURRICULUM
    : COMPLETE_GM_CURRICULUM.filter(l => l.category === selectedCategory);

  const currentStep = activeLesson.steps[currentStepIdx] || activeLesson.steps[0];

  const loadLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setCurrentStepIdx(0);
    setStepStatus('pending');
    try {
      const ch = new Chess(lesson.steps[0].fen);
      setGame(ch);
      setFen(ch.fen());
    } catch {
      const ch = new Chess();
      setGame(ch);
      setFen(ch.fen());
    }
  };

  const handlePieceDrop = (args: any, secondArg?: any): boolean => {
    const sourceSquare = typeof args === 'object' && args ? args.sourceSquare : args;
    const targetSquare = typeof args === 'object' && args ? args.targetSquare : secondArg;
    if (!sourceSquare || !targetSquare) return false;

    let stepToEvaluate = currentStep;
    let stepIndexToEvaluate = currentStepIdx;

    if (stepStatus === 'success') {
      if (currentStepIdx + 1 < activeLesson.steps.length) {
        stepIndexToEvaluate = currentStepIdx + 1;
        stepToEvaluate = activeLesson.steps[stepIndexToEvaluate];
        setCurrentStepIdx(stepIndexToEvaluate);
        setStepStatus('pending');
      } else {
        nextStepAction();
        return false;
      }
    }

    const playedUci = sourceSquare + targetSquare;

    if (playedUci === stepToEvaluate.expectedMoveUci) {
      const gameCopy = new Chess(game.fen());
      try {
        const moveRes = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
        setGame(gameCopy);
        setFen(gameCopy.fen());
        setStepStatus('success');

        if (moveRes && moveRes.captured) playCaptureSound();
        else playMoveSound();

        if (stepToEvaluate.opponentReplyUci) {
          const oppUci = stepToEvaluate.opponentReplyUci;
          setTimeout(() => {
            try {
              gameCopy.move({ from: oppUci.slice(0, 2), to: oppUci.slice(2, 4), promotion: 'q' });
              setGame(new Chess(gameCopy.fen()));
              setFen(gameCopy.fen());
              playMoveSound();
            } catch { /* ignore */ }
          }, 450);
        }

        if (stepIndexToEvaluate + 1 >= activeLesson.steps.length) {
          playBrilliantSound();
          if (!completedLessonIds.includes(activeLesson.id)) {
            setCompletedLessonIds(prev => [...prev, activeLesson.id]);
          }
        }
        return true;
      } catch {
        return false;
      }
    } else {
      setStepStatus('wrong');
      playBlunderSound();
      return false;
    }
  };

  const nextStepAction = () => {
    if (currentStepIdx + 1 < activeLesson.steps.length) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      setStepStatus('pending');
      const ch = new Chess(activeLesson.steps[nextIdx].fen);
      setGame(ch);
      setFen(ch.fen());
    } else {
      const currentLessonIndex = filteredCurriculum.findIndex(l => l.id === activeLesson.id);
      if (currentLessonIndex + 1 < filteredCurriculum.length) {
        loadLesson(filteredCurriculum[currentLessonIndex + 1]);
      }
    }
  };

  return (
    <div className="w-full flex-1 bg-transparent text-zinc-100 flex flex-col justify-between py-3 max-w-6xl mx-auto px-3 selection:bg-[#81b64c]/30 relative">
      {/* Top Header Controls Bar */}
      <div className="bg-[#2b2926] rounded-2xl border border-white/10 p-3 shrink-0 backdrop-blur-md shadow-md flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#81b64c] flex items-center justify-center text-white font-bold shadow-md">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white leading-none">Grandmaster Chess Academy</h1>
            <span className="text-[11px] text-zinc-400 font-mono">Complete Path: Beginner to GM (0–2500+ ELO)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#1e1c1a] border border-zinc-700 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#81b64c]">
          <Award className="w-4 h-4 text-amber-400" />
          <span>{completedLessonIds.length} / {COMPLETE_GM_CURRICULUM.length}</span>
        </div>
      </div>

      {/* Unified Rounded Category Filter Pill Bar */}
      <div className="bg-[#2b2926] p-1.5 rounded-full border border-white/10 shadow-md flex items-center gap-1 overflow-x-auto no-scrollbar mb-3">
        {['All', 'Foundations', 'Tactics', 'Openings', 'Strategy', 'Sacrifices', 'GM Endgames'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 active:scale-95 ${
              selectedCategory === cat
                ? 'bg-[#81b64c] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">

        {/* Left Column: Interactive Lesson Studio */}
        <div className="lg:col-span-7 bg-[#2b2926] rounded-2xl border border-white/10 p-3.5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div>
              <span className="text-[10px] text-[#81b64c] font-mono font-bold uppercase tracking-wider">
                {activeLesson.chapter}
              </span>
              <h2 className="text-sm font-extrabold text-white">{activeLesson.title}</h2>
            </div>
            <span className="text-[10px] bg-[#1e1c1a] text-zinc-300 px-2.5 py-0.5 rounded-full font-mono border border-zinc-700 font-bold">
              {activeLesson.eloRange}
            </span>
          </div>

          <div className="bg-[#1e1c1a] p-3 rounded-xl border border-[#81b64c]/30 text-xs flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#81b64c]/20 text-[#81b64c] flex items-center justify-center font-extrabold shrink-0">
              {currentStep.stepNumber}
            </div>
            <p className="text-zinc-200 font-medium leading-snug">{currentStep.prompt}</p>
          </div>

          <div className="w-full aspect-square relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-w-[min(100%,380px)] mx-auto touch-none">
            <ChessboardProvider options={{
              pieces,
              position: fen,
              boardOrientation: 'white',
              darkSquareStyle: { backgroundColor: boardTheme.dark, backgroundImage: boardTheme.darkTexture },
              lightSquareStyle: { backgroundColor: boardTheme.light, backgroundImage: boardTheme.lightTexture },
              showNotation: true,
              onPieceDrop: handlePieceDrop,
            }}>
              <Chessboard />
            </ChessboardProvider>
          </div>

          {stepStatus === 'success' && (
            <div className="p-3 rounded-xl bg-[#81b64c]/20 border border-[#81b64c]/40 text-xs text-emerald-200 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-[#81b64c]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Correct Move Executed!</span>
                </span>
                <button
                  onClick={nextStepAction}
                  className="px-3 py-1 bg-[#81b64c] hover:bg-[#74a544] text-white font-bold rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-1 text-[11px]"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-100">{currentStep.explanation}</p>
            </div>
          )}

          {stepStatus === 'wrong' && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-200 flex items-center justify-between animate-in fade-in">
              <span>Incorrect move. Follow the GM prompt instructions to play the key move.</span>
              <button
                onClick={() => {
                  setStepStatus('pending');
                  const ch = new Chess(currentStep.fen);
                  setGame(ch);
                  setFen(ch.fen());
                }}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg text-[11px] shrink-0 ml-2"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Curriculum List */}
        <div className="lg:col-span-5 bg-[#2b2926] rounded-2xl border border-white/10 p-3.5 shadow-xl space-y-2 max-h-[640px] overflow-y-auto">
          <div className="text-xs font-bold text-zinc-400 px-1 font-mono uppercase tracking-wider">
            Curriculum Lessons ({filteredCurriculum.length})
          </div>
          {filteredCurriculum.map(lesson => {
            const isActive = activeLesson.id === lesson.id;
            const isDone = completedLessonIds.includes(lesson.id);
            return (
              <div
                key={lesson.id}
                role="button"
                tabIndex={0}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => loadLesson(lesson)}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    loadLesson(lesson);
                  }
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                  isActive
                    ? 'bg-[#81b64c]/20 border-[#81b64c]/50 shadow-md font-bold'
                    : 'bg-[#1e1c1a] border-white/5 hover:bg-zinc-800/80 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isDone ? 'bg-[#81b64c] text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <Play className="w-3 h-3" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-[#81b64c] font-mono">{lesson.chapter}</div>
                    <div className="text-white font-bold truncate text-xs">{lesson.title}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono border border-zinc-700">
                    {lesson.difficulty}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
