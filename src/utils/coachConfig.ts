export interface CoachProfile {
  id: string;
  name: string;
  rating: number;
  avatar: string;
  style: string;
  description: string;
}

export const COACH_PROFILES: CoachProfile[] = [
  {
    id: 'beginner',
    name: 'Coach Leo',
    rating: 800,
    avatar: '🐣',
    style: 'Beginner & Friendly',
    description: 'Gentle, simple advice focusing on basic piece captures and king safety.',
  },
  {
    id: 'club',
    name: 'Coach Marcus',
    rating: 1400,
    avatar: '♟️',
    style: 'Club Player',
    description: 'Focuses on tactical forks, pins, and avoiding major blunders.',
  },
  {
    id: 'master',
    name: 'Coach Danny',
    rating: 2200,
    avatar: '🧔‍♂️',
    style: 'Master Coach',
    description: 'Comprehensive grandmaster-level positional and tactical feedback.',
  },
  {
    id: 'gm',
    name: 'GM Stockfish AI',
    rating: 2700,
    avatar: '🤖',
    style: 'Grandmaster AI',
    description: 'Deep engine calculations and high-level structural analysis.',
  },
];

export function getSavedCoach(): CoachProfile {
  try {
    const saved = localStorage.getItem('chess_selected_coach');
    if (saved) {
      const found = COACH_PROFILES.find(c => c.id === saved);
      if (found) return found;
    }
  } catch { /* ignore */ }
  return COACH_PROFILES[2]; // Default Coach Danny (2200 ELO)
}

export function saveCoach(coachId: string) {
  try {
    localStorage.setItem('chess_selected_coach', coachId);
  } catch { /* ignore */ }
}
