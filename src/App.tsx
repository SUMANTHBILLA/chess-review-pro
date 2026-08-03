import { useState } from 'react';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { HomePage } from '@/sections/HomePage';
import { ReviewPage } from '@/sections/ReviewPage';
import { PuzzlePage } from '@/sections/PuzzlePage';
import { StatsPage } from '@/sections/StatsPage';
import { LearnPage } from '@/sections/LearnPage';
import { ThemePicker } from '@/components/ThemePicker';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import type { ParsedGame, GameReview } from '@/types/chess';
import './App.css';

type AppState =
  | { screen: 'home' }
  | { screen: 'review'; game: ParsedGame; review: GameReview }
  | { screen: 'puzzles' }
  | { screen: 'stats' }
  | { screen: 'learn' };

function AppInner() {
  const { appBackground } = useTheme();
  const [appState, setAppState] = useState<AppState>({ screen: 'home' });
  const [showThemePicker, setShowThemePicker] = useState(false);

  const gameInfo =
    appState.screen === 'review'
      ? {
          white: appState.game.white,
          black: appState.game.black,
          result: appState.game.result,
          whiteRating: appState.game.whiteRating,
          blackRating: appState.game.blackRating,
        }
      : undefined;

  return (
    <div className={`min-h-screen ${appBackground.bgClass} text-white flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200 transition-colors duration-300`}>
      {/* Top Navbar */}
      <Navbar
        currentScreen={appState.screen}
        onNavigateHome={() => setAppState({ screen: 'home' })}
        onNavigatePuzzles={() => setAppState({ screen: 'puzzles' })}
        onNavigateStats={() => setAppState({ screen: 'stats' })}
        onNavigateLearn={() => setAppState({ screen: 'learn' })}
        onOpenThemePicker={() => setShowThemePicker(true)}
        gameInfo={gameInfo}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {appState.screen === 'home' && (
          <HomePage
            onReview={(game, review) =>
              setAppState({ screen: 'review', game, review })
            }
          />
        )}
        {appState.screen === 'review' && (
          <ReviewPage
            game={appState.game}
            review={appState.review}
            onBack={() => setAppState({ screen: 'home' })}
          />
        )}
        {appState.screen === 'puzzles' && <PuzzlePage />}
        {appState.screen === 'stats' && <StatsPage onNavigateHome={() => setAppState({ screen: 'home' })} />}
        {appState.screen === 'learn' && <LearnPage />}
      </main>

      {/* Global Footer */}
      <Footer onNavigateHome={() => setAppState({ screen: 'home' })} />

      {/* Customization Modal */}
      <ThemePicker open={showThemePicker} onClose={() => setShowThemePicker(false)} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

export default App;
