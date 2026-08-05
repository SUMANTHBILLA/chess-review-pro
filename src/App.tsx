import { useState, type CSSProperties } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { HomePage } from '@/sections/HomePage';
import { ReviewPage } from '@/sections/ReviewPage';
import { PuzzlePage } from '@/sections/PuzzlePage';
import { StatsPage } from '@/sections/StatsPage';
import { LearnPage } from '@/sections/LearnPage';
import { ThemePicker } from '@/components/ThemePicker';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { ParsedGame, GameReview } from '@/types/chess';
import './App.css';

const ACTIVE_REVIEW_KEY = 'chessReview_activeReviewState';

interface ReviewData {
  game: ParsedGame;
  review: GameReview;
}

function AppInner() {
  const { appBackground } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeReviewData, setActiveReviewData] = useState<ReviewData | null>(() => {
    try {
      const stored = sessionStorage.getItem(ACTIVE_REVIEW_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return null;
  });

  const [showThemePicker, setShowThemePicker] = useState(false);

  const path = location.pathname;
  const currentScreen: 'home' | 'review' | 'puzzles' | 'stats' | 'learn' =
    path.startsWith('/review')
      ? 'review'
      : path.startsWith('/puzzles')
      ? 'puzzles'
      : path.startsWith('/stats')
      ? 'stats'
      : path.startsWith('/learn')
      ? 'learn'
      : 'home';

  const bgStyle: CSSProperties | undefined = appBackground.image
    ? {
        backgroundColor: appBackground.previewColor,
        backgroundImage: `url(${appBackground.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : undefined;

  const gameInfo =
    currentScreen === 'review' && activeReviewData
      ? {
          white: activeReviewData.game.white,
          black: activeReviewData.game.black,
          result: activeReviewData.game.result,
          whiteRating: activeReviewData.game.whiteRating,
          blackRating: activeReviewData.game.blackRating,
        }
      : undefined;

  const handleReview = (game: ParsedGame, review: GameReview) => {
    const data: ReviewData = { game, review };
    setActiveReviewData(data);
    try {
      sessionStorage.setItem(ACTIVE_REVIEW_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
    navigate('/review');
  };

  return (
    <div
      style={bgStyle}
      className={`min-h-screen ${appBackground.bgClass} text-white flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 transition-colors duration-300`}
    >
      {/* Top Navbar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigateHome={() => navigate('/')}
        onNavigatePuzzles={() => navigate('/puzzles')}
        onNavigateStats={() => navigate('/stats')}
        onNavigateLearn={() => navigate('/learn')}
        onOpenThemePicker={() => setShowThemePicker(true)}
        gameInfo={gameInfo}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <ErrorBoundary fallbackTitle="Section Error">
          <Routes>
            <Route path="/" element={<HomePage onReview={handleReview} />} />
            <Route
              path="/review"
              element={
                activeReviewData ? (
                  <ReviewPage
                    game={activeReviewData.game}
                    review={activeReviewData.review}
                    onBack={() => navigate('/')}
                  />
                ) : (
                  <HomePage onReview={handleReview} />
                )
              }
            />
            <Route path="/puzzles" element={<PuzzlePage />} />
            <Route path="/stats" element={<StatsPage onNavigateHome={() => navigate('/')} />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="*" element={<HomePage onReview={handleReview} />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Global Footer */}
      <Footer onNavigateHome={() => navigate('/')} />

      {/* Customization Modal */}
      <ThemePicker open={showThemePicker} onClose={() => setShowThemePicker(false)} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <ThemeProvider>
        <HashRouter>
          <AppInner />
        </HashRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
