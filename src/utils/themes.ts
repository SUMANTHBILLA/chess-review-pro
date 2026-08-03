/**
 * Premium Chess Themes, Piece Sets & Textured Wallpapers — Chess.com Production Grade.
 */

export interface BoardTheme {
  id: string;
  label: string;
  light: string;
  dark: string;
  tag?: 'Neon' | 'Luxe' | 'Wood' | 'Classic' | 'Modern' | 'Vibrant';
}

export interface PieceSet {
  id: string;
  label: string;
  tag?: 'Classic' | 'Modern' | '3D' | 'Retro' | 'Fun' | 'Minimal';
}

export interface AppBackground {
  id: string;
  label: string;
  bgClass: string;
  previewColor: string;
  isWallpaper?: boolean;
}

export const APP_BACKGROUNDS: AppBackground[] = [
  { id: 'newspaper', label: 'Newspaper Vintage', bgClass: 'wallpaper-newspaper', previewColor: '#1a1d24', isWallpaper: true },
  { id: 'walnut_wood', label: 'Walnut Wood Grain', bgClass: 'wallpaper-walnut', previewColor: '#2a1a10', isWallpaper: true },
  { id: 'cosmos', label: 'Cosmic Nebula', bgClass: 'wallpaper-cosmos', previewColor: '#090821', isWallpaper: true },
  { id: 'forest', label: 'Emerald Moss Forest', bgClass: 'wallpaper-forest', previewColor: '#041c11', isWallpaper: true },
  { id: 'obsidian', label: 'Obsidian Carbon Gold', bgClass: 'wallpaper-obsidian', previewColor: '#121215', isWallpaper: true },
  { id: 'ocean', label: 'Abyss Ocean Waves', bgClass: 'wallpaper-ocean', previewColor: '#041c26', isWallpaper: true },
  { id: 'dark', label: 'Dark Charcoal', bgClass: 'bg-[#09090b]', previewColor: '#09090b' },
];

export const PIECE_SETS: PieceSet[] = [
  { id: 'staunty', label: 'Staunton 3D Luxe', tag: 'Classic' },
  { id: 'governor', label: 'Glass Metallic 3D', tag: '3D' },
  { id: 'cburnett', label: 'Neo (Chess.com)', tag: 'Modern' },
  { id: 'california', label: 'California Wood', tag: 'Modern' },
  { id: 'merida', label: 'Merida Traditional', tag: 'Classic' },
  { id: 'fresca', label: 'Fresca', tag: 'Modern' },
  { id: 'horsey', label: 'Horsey Cartoon', tag: 'Fun' },
  { id: 'cardinal', label: 'Cardinal', tag: 'Modern' },
  { id: 'kosal', label: 'Kosal Minimal', tag: 'Minimal' },
  { id: 'pixel', label: 'Pixel Retro', tag: 'Retro' },
  { id: 'leipzig', label: 'Leipzig Vintage', tag: 'Classic' },
  { id: 'gioco', label: 'Gioco', tag: 'Classic' },
  { id: 'alpha', label: 'Alpha', tag: 'Classic' },
  { id: 'pirouetti', label: 'Pirouetti', tag: 'Minimal' },
  { id: 'spatial', label: 'Spatial Modern', tag: 'Modern' },
  { id: 'shapes', label: 'Geometric Shapes', tag: 'Minimal' },
];

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'sky_sea', label: 'Sky and Sea', light: '#b0c4de', dark: '#4682b4', tag: 'Vibrant' },
  { id: 'classic', label: 'Chess.com Green', light: '#eeeed2', dark: '#769656', tag: 'Classic' },
  { id: 'walnut', label: 'Walnut Wood', light: '#f0d9b5', dark: '#8b5e3c', tag: 'Wood' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', light: '#1e293b', dark: '#06b6d4', tag: 'Neon' },
  { id: 'midnight', label: 'Midnight Slate', light: '#181825', dark: '#45475a', tag: 'Modern' },
  { id: 'emerald', label: 'Emerald Luxe', light: '#064e3b', dark: '#10b981', tag: 'Vibrant' },
  { id: 'gold', label: 'Obsidian Gold', light: '#262626', dark: '#d97706', tag: 'Luxe' },
  { id: 'crimson', label: 'Vampire Crimson', light: '#2d1217', dark: '#e11d48', tag: 'Neon' },
  { id: 'purple', label: 'Amethyst Glow', light: '#2e1065', dark: '#a855f7', tag: 'Vibrant' },
  { id: 'ice', label: 'Glacier Ice', light: '#e0f2fe', dark: '#0284c7', tag: 'Modern' },
  { id: 'ocean', label: 'Deep Ocean', light: '#e0f2fe', dark: '#0d9488', tag: 'Modern' },
  { id: 'slate', label: 'Monochrome Steel', light: '#e2e8f0', dark: '#475569', tag: 'Modern' },
];
