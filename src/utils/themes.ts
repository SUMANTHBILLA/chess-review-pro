/**
 * Premium Chess Themes, Piece Sets, Textured Wallpapers & Presets — Chess.com Production Grade.
 * All textures/wallpapers are procedural SVG/CSS (zero external assets, instant loading,
 * royalty-free by construction, identical on every device).
 */

import bg1 from '@/assets/backgrounds/bg1.png';
import bg2 from '@/assets/backgrounds/bg2.png';
import bg3 from '@/assets/backgrounds/bg3.jpg';
import bg4 from '@/assets/backgrounds/bg4.png';
import bg5 from '@/assets/backgrounds/bg5.jpg';
import bg6 from '@/assets/backgrounds/bg6.jpg';
import bg7 from '@/assets/backgrounds/bg7.jpg';
import bg8 from '@/assets/backgrounds/bg8.jpg';
import bg9 from '@/assets/backgrounds/bg9.png';
import bg10 from '@/assets/backgrounds/bg10.png';
import bg12 from '@/assets/backgrounds/bg12.png';
import bg13 from '@/assets/backgrounds/bg13.png';
import bg14 from '@/assets/backgrounds/bg14.png';
import bg15 from '@/assets/backgrounds/bg15.png';
import bg16 from '@/assets/backgrounds/bg16.png';
import bg17 from '@/assets/backgrounds/bg17.png';
import bg18 from '@/assets/backgrounds/bg18.png';
import bg19 from '@/assets/backgrounds/bg19.png';
import bg20 from '@/assets/backgrounds/bg20.png';
import bg21 from '@/assets/backgrounds/bg21.png';
import classicImg from '@/assets/backgrounds/classic.jpeg';
import glassImg from '@/assets/backgrounds/glass.jpg';
import newspaperImg from '@/assets/backgrounds/newspaper.png';
import stauntonImg from '@/assets/backgrounds/staunton.png';
import tournamentImg from '@/assets/backgrounds/tournament.png';
import woodImg from '@/assets/backgrounds/wood.png';
import sWK from '@/assets/pieces/staunty/wK.svg';
import sWQ from '@/assets/pieces/staunty/wQ.svg';
import sWR from '@/assets/pieces/staunty/wR.svg';
import sWB from '@/assets/pieces/staunty/wB.svg';
import sWN from '@/assets/pieces/staunty/wN.svg';
import sWP from '@/assets/pieces/staunty/wP.svg';
import sBK from '@/assets/pieces/staunty/bK.svg';
import sBQ from '@/assets/pieces/staunty/bQ.svg';
import sBR from '@/assets/pieces/staunty/bR.svg';
import sBB from '@/assets/pieces/staunty/bB.svg';
import sBN from '@/assets/pieces/staunty/bN.svg';
import sBP from '@/assets/pieces/staunty/bP.svg';

/**
 * Bundled fallback pieces (Staunton) — guaranteed to render even when the
 * lichess CDN is unreachable (offline play, blocked network).
 */
export const PIECE_FALLBACKS: Record<string, string> = {
  wK: sWK, wQ: sWQ, wR: sWR, wB: sWB, wN: sWN, wP: sWP,
  bK: sBK, bQ: sBQ, bR: sBR, bB: sBB, bN: sBN, bP: sBP,
};

export interface BoardTheme {
  id: string;
  label: string;
  light: string;
  dark: string;
  /** Procedural SVG texture overlays for square feel (wood grain, marble, felt…) */
  lightTexture?: string;
  darkTexture?: string;
  tag?: 'Neon' | 'Luxe' | 'Wood' | 'Classic' | 'Modern' | 'Vibrant';
}

export interface PieceSet {
  id: string;
  label: string;
  /** For 3D variants: the flat set this is rendered from */
  base?: string;
  tag?: 'Classic' | 'Modern' | '3D' | 'Retro' | 'Fun' | 'Minimal';
}

export interface AppBackground {
  id: string;
  label: string;
  /** CSS class for procedural wallpapers; optional when `image` is set */
  bgClass: string;
  previewColor: string;
  isWallpaper?: boolean;
  /** Bundled wallpaper image (cover-fit) */
  image?: string;
}

export interface ThemePreset {
  id: string;
  label: string;
  boardThemeId: string;
  pieceSetId: string;
  backgroundId: string;
  blurb: string;
}

// ── Procedural SVG texture helpers ──────────────────────────────────────────

const svgTexture = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>${body}</svg>`
  )}`;

/** Directional noise → wood grain */
const WOOD_LIGHT = svgTexture(
  `<filter id='a'><feTurbulence type='fractalNoise' baseFrequency='0.03 0.24' numOctaves='3' seed='11'/><feColorMatrix type='saturate' values='0.5'/></filter><rect width='96' height='96' filter='url(%23a)' opacity='0.45'/>`
);
const WOOD_DARK = svgTexture(
  `<filter id='a'><feTurbulence type='fractalNoise' baseFrequency='0.03 0.24' numOctaves='3' seed='23'/><feColorMatrix type='saturate' values='0.5'/></filter><rect width='96' height='96' filter='url(%23a)' opacity='0.5'/>`
);

/** Large soft veins → marble */
const MARBLE = svgTexture(
  `<filter id='a'><feTurbulence type='fractalNoise' baseFrequency='0.012 0.06' numOctaves='4' seed='7'/><feColorMatrix type='saturate' values='0.3'/></filter><rect width='96' height='96' filter='url(%23a)' opacity='0.35'/>`
);

/** Fine uniform noise → felt / linen */
const FELT = svgTexture(
  `<filter id='a'><feTurbulence type='fractalNoise' baseFrequency='0.75 0.75' numOctaves='2' seed='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='96' height='96' filter='url(%23a)' opacity='0.14'/>`
);

/** Fine dark noise → carbon / velvet */
const CARBON = svgTexture(
  `<filter id='a'><feTurbulence type='fractalNoise' baseFrequency='0.9 0.9' numOctaves='3' seed='9'/><feColorMatrix type='saturate' values='0'/></filter><rect width='96' height='96' filter='url(%23a)' opacity='0.18'/>`
);

/** Diagonal shine → glass */
const GLASS = 'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 42%, rgba(255,255,255,0) 60%)';

export const APP_BACKGROUNDS: AppBackground[] = [
  { id: 'newspaper', label: 'Newspaper Vintage', bgClass: 'wallpaper-newspaper', previewColor: '#1a1d24', isWallpaper: true },
  { id: 'walnut_wood', label: 'Walnut Wood Grain', bgClass: 'wallpaper-walnut', previewColor: '#2a1a10', isWallpaper: true },
  { id: 'cosmos', label: 'Cosmic Nebula', bgClass: 'wallpaper-cosmos', previewColor: '#090821', isWallpaper: true },
  { id: 'forest', label: 'Emerald Moss Forest', bgClass: 'wallpaper-forest', previewColor: '#041c11', isWallpaper: true },
  { id: 'obsidian', label: 'Obsidian Carbon Gold', bgClass: 'wallpaper-obsidian', previewColor: '#121215', isWallpaper: true },
  { id: 'ocean', label: 'Abyss Ocean Waves', bgClass: 'wallpaper-ocean', previewColor: '#041c26', isWallpaper: true },
  { id: 'stadium', label: 'Sky Stadium', bgClass: 'wallpaper-stadium', previewColor: '#1e5c8c', isWallpaper: true },
  { id: 'royal', label: 'Royal Purple', bgClass: 'wallpaper-royal', previewColor: '#1e1030', isWallpaper: true },
  { id: 'rose', label: 'Rose Gold Dusk', bgClass: 'wallpaper-rose', previewColor: '#33151c', isWallpaper: true },
  { id: 'grid', label: 'Midnight Grid', bgClass: 'wallpaper-grid', previewColor: '#0c0c10', isWallpaper: true },
  { id: 'dark', label: 'Dark Charcoal', bgClass: 'bg-[#09090b]', previewColor: '#09090b' },
  { id: 'photo-bg1', label: 'Verdant Arena', bgClass: '', previewColor: '#213a2a', isWallpaper: true, image: bg1 },
  { id: 'photo-bg2', label: 'Tropical Green', bgClass: '', previewColor: '#1f3a2e', isWallpaper: true, image: bg2 },
  { id: 'photo-bg3', label: 'Stadium Lights', bgClass: '', previewColor: '#1b2838', isWallpaper: true, image: bg3 },
  { id: 'photo-bg4', label: 'Grand Hall', bgClass: '', previewColor: '#2a1f14', isWallpaper: true, image: bg4 },
  { id: 'photo-bg5', label: 'Wooden Sanctuary', bgClass: '', previewColor: '#2b1d10', isWallpaper: true, image: bg5 },
  { id: 'photo-bg6', label: 'Gold Spectacle', bgClass: '', previewColor: '#33230f', isWallpaper: true, image: bg6 },
  { id: 'photo-bg7', label: 'Crimson Court', bgClass: '', previewColor: '#331418', isWallpaper: true, image: bg7 },
  { id: 'photo-bg8', label: 'Brass Chamber', bgClass: '', previewColor: '#2c1f12', isWallpaper: true, image: bg8 },
  { id: 'photo-bg9', label: 'Emerald Palace', bgClass: '', previewColor: '#0e2317', isWallpaper: true, image: bg9 },
  { id: 'photo-bg10', label: 'Autumn Court', bgClass: '', previewColor: '#2e1d12', isWallpaper: true, image: bg10 },
  { id: 'photo-bg12', label: 'Ivory Grandeur', bgClass: '', previewColor: '#26201c', isWallpaper: true, image: bg12 },
  { id: 'photo-bg13', label: 'Dark Walnut Hall', bgClass: '', previewColor: '#241610', isWallpaper: true, image: bg13 },
  { id: 'photo-bg14', label: 'Vintage Club', bgClass: '', previewColor: '#2b2018', isWallpaper: true, image: bg14 },
  { id: 'photo-bg15', label: 'Navy Grand Hall', bgClass: '', previewColor: '#151d2b', isWallpaper: true, image: bg15 },
  { id: 'photo-bg16', label: 'Golden Arena', bgClass: '', previewColor: '#2d1d0e', isWallpaper: true, image: bg16 },
  { id: 'photo-bg17', label: 'Forrest Grand', bgClass: '', previewColor: '#122317', isWallpaper: true, image: bg17 },
  { id: 'photo-bg18', label: 'Olive Chamber', bgClass: '', previewColor: '#20240f', isWallpaper: true, image: bg18 },
  { id: 'photo-bg19', label: 'Rustic Lodge', bgClass: '', previewColor: '#2c1e12', isWallpaper: true, image: bg19 },
  { id: 'photo-bg20', label: 'Wine Cellar Club', bgClass: '', previewColor: '#2b1414', isWallpaper: true, image: bg20 },
  { id: 'photo-bg21', label: 'Marble Atrium', bgClass: '', previewColor: '#1d1d1d', isWallpaper: true, image: bg21 },
  { id: 'photo-wood', label: 'Sculpted Wood', bgClass: '', previewColor: '#241307', isWallpaper: true, image: woodImg },
  { id: 'photo-tournament', label: 'Tournament Stage', bgClass: '', previewColor: '#23272c', isWallpaper: true, image: tournamentImg },
  { id: 'photo-staunton', label: 'Staunton Portrait', bgClass: '', previewColor: '#1d1713', isWallpaper: true, image: stauntonImg },
  { id: 'photo-glass', label: 'Glass Artwork', bgClass: '', previewColor: '#1e2430', isWallpaper: true, image: glassImg },
  { id: 'photo-newspaper', label: 'Press Room', bgClass: '', previewColor: '#202020', isWallpaper: true, image: newspaperImg },
  { id: 'photo-classic', label: 'Classic Hall', bgClass: '', previewColor: '#1c232c', isWallpaper: true, image: classicImg },
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
  { id: 'dubrovny', label: 'Dubrovnik Tournament', tag: 'Classic' },
  { id: 'tatiana', label: 'Tatiana Wood', tag: 'Classic' },
  { id: 'maestro', label: 'Maestro Friendly', tag: 'Modern' },
  { id: 'riohacha', label: 'Rio Hacha Wood', tag: 'Modern' },
  { id: 'reillycraig', label: 'Reilly Craig', tag: 'Modern' },
  { id: 'companion', label: 'Companion', tag: 'Modern' },
  { id: 'chess7', label: 'Chess 7 Minimal', tag: 'Minimal' },
  { id: 'letter', label: 'Letter Tiles', tag: 'Minimal' },
  { id: 'fantasy', label: 'Fantasy Quest', tag: 'Fun' },
  { id: 'icpieces', label: 'Classic Clipart', tag: 'Retro' },
  { id: 'chessnut', label: 'Chess Nut Retro', tag: 'Retro' },
  { id: 'staunty-3d', label: 'Staunton 3D Deluxe', base: 'staunty', tag: '3D' },
  { id: 'cburnett-3d', label: 'Neo 3D Carved', base: 'cburnett', tag: '3D' },
  { id: 'merida-3d', label: 'Merida 3D Statue', base: 'merida', tag: '3D' },
  { id: 'california-3d', label: 'California 3D Carve', base: 'california', tag: '3D' },
  { id: 'dubrovny-3d', label: 'Dubrovnik 3D', base: 'dubrovny', tag: '3D' },
  { id: 'fantasy-3d', label: 'Fantasy 3D Warrior', base: 'fantasy', tag: '3D' },
  { id: 'maestro-3d', label: 'Maestro 3D Figurine', base: 'maestro', tag: '3D' },
  { id: 'cardinal-3d', label: 'Cardinal 3D Crest', base: 'cardinal', tag: '3D' },
];

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'sky_sea', label: 'Sky and Sea', light: '#b0c4de', dark: '#4682b4', lightTexture: GLASS, darkTexture: GLASS, tag: 'Vibrant' },
  { id: 'classic', label: 'Chess.com Green', light: '#eeeed2', dark: '#769656', lightTexture: FELT, darkTexture: FELT, tag: 'Classic' },
  { id: 'walnut', label: 'Walnut Wood', light: '#f0d9b5', dark: '#8b5e3c', lightTexture: WOOD_LIGHT, darkTexture: WOOD_DARK, tag: 'Wood' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', light: '#1e293b', dark: '#06b6d4', lightTexture: CARBON, darkTexture: GLASS, tag: 'Neon' },
  { id: 'midnight', label: 'Midnight Slate', light: '#181825', dark: '#45475a', lightTexture: CARBON, darkTexture: CARBON, tag: 'Modern' },
  { id: 'emerald', label: 'Emerald Luxe', light: '#064e3b', dark: '#10b981', lightTexture: FELT, darkTexture: GLASS, tag: 'Vibrant' },
  { id: 'gold', label: 'Obsidian Gold', light: '#262626', dark: '#d97706', lightTexture: CARBON, darkTexture: GLASS, tag: 'Luxe' },
  { id: 'crimson', label: 'Vampire Crimson', light: '#2d1217', dark: '#e11d48', lightTexture: CARBON, darkTexture: GLASS, tag: 'Neon' },
  { id: 'purple', label: 'Amethyst Glow', light: '#2e1065', dark: '#a855f7', lightTexture: FELT, darkTexture: GLASS, tag: 'Vibrant' },
  { id: 'ice', label: 'Glacier Ice', light: '#e0f2fe', dark: '#0284c7', lightTexture: MARBLE, darkTexture: MARBLE, tag: 'Modern' },
  { id: 'ocean', label: 'Deep Ocean', light: '#e0f2fe', dark: '#0d9488', lightTexture: MARBLE, darkTexture: MARBLE, tag: 'Modern' },
  { id: 'slate', label: 'Monochrome Steel', light: '#e2e8f0', dark: '#475569', lightTexture: CARBON, darkTexture: CARBON, tag: 'Modern' },
  { id: 'maple', label: 'Maple Honey', light: '#f5deb3', dark: '#b8860b', lightTexture: WOOD_LIGHT, darkTexture: WOOD_DARK, tag: 'Wood' },
  { id: 'rosewood', label: 'Rosewood Amber', light: '#f2cdb3', dark: '#9c4a2f', lightTexture: WOOD_LIGHT, darkTexture: WOOD_DARK, tag: 'Wood' },
  { id: 'ebony', label: 'Ebony Marble', light: '#4a4a52', dark: '#1c1c22', lightTexture: MARBLE, darkTexture: MARBLE, tag: 'Luxe' },
  { id: 'blue_felt', label: 'Classic Blue Felt', light: '#dee3e6', dark: '#7faab1', lightTexture: FELT, darkTexture: FELT, tag: 'Classic' },
  { id: 'navy', label: 'Midnight Navy', light: '#e8ecf2', dark: '#2b3a67', lightTexture: FELT, darkTexture: FELT, tag: 'Modern' },
  { id: 'citrine', label: 'Sunlit Citrus', light: '#fff3c4', dark: '#f2a007', lightTexture: GLASS, darkTexture: GLASS, tag: 'Vibrant' },
  { id: 'lilac', label: 'Lavender Mist', light: '#e9e4f5', dark: '#7c6bc4', lightTexture: FELT, darkTexture: FELT, tag: 'Vibrant' },
  { id: 'sandstone', label: 'Desert Sandstone', light: '#f0e4d2', dark: '#a8896a', lightTexture: MARBLE, darkTexture: MARBLE, tag: 'Wood' },
  { id: 'cherry', label: 'Cherry Blossom', light: '#ffeef1', dark: '#d96c8a', lightTexture: FELT, darkTexture: FELT, tag: 'Vibrant' },
  { id: 'chocolate', label: 'Dark Chocolate', light: '#c8a57a', dark: '#4a2e17', lightTexture: CARBON, darkTexture: CARBON, tag: 'Luxe' },
];

/** Chess.com-style curated presets — one tap sets board + pieces + background */
/** Resolve the underlying CDN set id for a piece set (3D variants map to their flat base). */
export function resolvePieceSet(pieceSet: string): string {
  return PIECE_SETS.find(p => p.id === pieceSet)?.base ?? pieceSet;
}

export function is3DPieceSet(pieceSet: string): boolean {
  return Boolean(PIECE_SETS.find(p => p.id === pieceSet)?.base);
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'classic-green', label: 'Classic Green', boardThemeId: 'classic', pieceSetId: 'cburnett', backgroundId: 'dark', blurb: 'The chess.com signature felt board' },
  { id: 'walnut-royale', label: 'Walnut Royale', boardThemeId: 'walnut', pieceSetId: 'california', backgroundId: 'walnut_wood', blurb: 'Warm wood tones end to end' },
  { id: 'sky-stadium', label: 'Sky Stadium', boardThemeId: 'sky_sea', pieceSetId: 'staunty', backgroundId: 'stadium', blurb: 'Open-air blue with glassy squares' },
  { id: 'cyberpunk', label: 'Cyberpunk Arena', boardThemeId: 'cyberpunk', pieceSetId: 'spatial', backgroundId: 'obsidian', blurb: 'Neon grid battle station' },
  { id: 'midnight', label: 'Midnight Minimal', boardThemeId: 'midnight', pieceSetId: 'kosal', backgroundId: 'dark', blurb: 'Quiet, focused, low-light' },
  { id: 'amethyst', label: 'Amethyst Night', boardThemeId: 'purple', pieceSetId: 'governor', backgroundId: 'cosmos', blurb: 'Galactic purple glass' },
  { id: 'crimson', label: 'Crimson Arena', boardThemeId: 'crimson', pieceSetId: 'cardinal', backgroundId: 'dark', blurb: 'Red alert match feel' },
  { id: 'emerald', label: 'Emerald Forest', boardThemeId: 'emerald', pieceSetId: 'fresca', backgroundId: 'forest', blurb: 'Mossy, natural calm' },
  { id: 'obsidian-gold', label: 'Obsidian Gold', boardThemeId: 'gold', pieceSetId: 'alpha', backgroundId: 'obsidian', blurb: 'Diamond-level contrast' },
  { id: 'glacier', label: 'Glacier Blue', boardThemeId: 'ice', pieceSetId: 'merida', backgroundId: 'ocean', blurb: 'Cool marble and sea' },
  { id: 'dubrovny-club', label: 'Dubrovnik Club', boardThemeId: 'classic', pieceSetId: 'dubrovny', backgroundId: 'dark', blurb: 'The official tournament set' },
  { id: 'rio-hacha', label: 'Rio Hacha', boardThemeId: 'rosewood', pieceSetId: 'riohacha', backgroundId: 'walnut_wood', blurb: 'Warm tournament wood' },
  { id: 'fantasy-quest', label: 'Fantasy Quest', boardThemeId: 'purple', pieceSetId: 'fantasy', backgroundId: 'cosmos', blurb: 'RPG-style battle set' },
];
