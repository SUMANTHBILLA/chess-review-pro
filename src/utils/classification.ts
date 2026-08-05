import { Gem, Target, Star, Sparkles, ThumbsUp, AlertTriangle, HelpCircle, CircleSlash, XCircle, BookOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MoveClassification } from '@/types/chess';

export const CLASSIFICATION_COLORS: Record<
  MoveClassification,
  { text: string; bg: string; border: string; label: string; icon: LucideIcon }
> = {
  brilliant: { text: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', label: 'Brilliant', icon: Gem },
  great:     { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40', label: 'Great', icon: Target },
  best:      { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', label: 'Best', icon: Star },
  excellent: { text: 'text-teal-400', bg: 'bg-teal-500/20', border: 'border-teal-500/30', label: 'Excellent', icon: Sparkles },
  good:      { text: 'text-zinc-300', bg: 'bg-zinc-800', border: 'border-zinc-700', label: 'Good', icon: ThumbsUp },
  inaccuracy:{ text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', label: 'Inaccuracy', icon: AlertTriangle },
  mistake:   { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40', label: 'Mistake', icon: HelpCircle },
  miss:      { text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/40', label: 'Miss', icon: CircleSlash },
  blunder:   { text: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/40', label: 'Blunder', icon: XCircle },
  book:      { text: 'text-stone-300', bg: 'bg-stone-800', border: 'border-stone-700', label: 'Book', icon: BookOpen },
};

/** Solid hex colors used for the stacked summary bar (matches Tailwind palette) */
export const CLASSIFICATION_BAR_COLORS: Record<MoveClassification, string> = {
  brilliant: '#22d3ee',
  great: '#60a5fa',
  best: '#34d399',
  excellent: '#2dd4bf',
  good: '#71717a',
  inaccuracy: '#fbbf24',
  mistake: '#fb923c',
  miss: '#e879f9',
  blunder: '#fb7185',
  book: '#78716c',
};

export const CLASSIFICATION_ORDER: MoveClassification[] = [
  'brilliant',
  'great',
  'best',
  'excellent',
  'good',
  'inaccuracy',
  'mistake',
  'miss',
  'blunder',
  'book',
];
