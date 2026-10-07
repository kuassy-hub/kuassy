import { ThemeConfig } from './types';

export const THEMES: Record<string, ThemeConfig> = {
  kuba: {
    id: 'kuba',
    label: 'Kuba (défaut)',
    gm: '#002A32',
    ac: '#ED254E',
    bg: '#f0e2c4',
    card: '#f8efdb',
    mut: '#6b5a45',
  },
  reef: {
    id: 'reef',
    label: 'Great Barrier Reef',
    gm: '#0b4f4a',
    ac: '#f47c5a',
    bg: '#e4f3ea',
    card: '#f2faf5',
    mut: '#3d6b66',
  },
  bonfire: {
    id: 'bonfire',
    label: 'Bonfire',
    gm: '#4a1a14',
    ac: '#f9a620',
    bg: '#fbe9c6',
    card: '#fff4dd',
    mut: '#7a4a30',
  },
  night: {
    id: 'night',
    label: 'Nightfall',
    gm: '#2b2142',
    ac: '#b57edc',
    bg: '#f4ecd6',
    card: '#faf5e6',
    mut: '#5d4f73',
  },
  mesa: {
    id: 'mesa',
    label: 'Mesa',
    gm: '#1f5c58',
    ac: '#e8825e',
    bg: '#f7e6cf',
    card: '#fcf2e2',
    mut: '#7a5240',
  },
  lascaux: {
    id: 'lascaux',
    label: 'Lascaux',
    gm: '#2e1c12',
    ac: '#d08a3c',
    bg: '#eddcc4',
    card: '#f6ebd8',
    mut: '#6d5038',
  },
  melon: {
    id: 'melon',
    label: 'Watermelon',
    gm: '#3a1f22',
    ac: '#f0506e',
    bg: '#e8f1d8',
    card: '#f3f8e8',
    mut: '#4f6b3c',
  },
  deep: {
    id: 'deep',
    label: 'Challenger Deep',
    gm: '#052a33',
    ac: '#2dd4a8',
    bg: '#e4f8ee',
    card: '#f1fcf6',
    mut: '#2f6a62',
  },
  love: {
    id: 'love',
    label: 'Lovebird',
    gm: '#1f5a5a',
    ac: '#d77c7c',
    bg: '#f4e1d2',
    card: '#faf0e6',
    mut: '#7a5a50',
  },
};

export function applyTheme(themeKey: string) {
  const theme = THEMES[themeKey] || THEMES.kuba;
  const root = document.documentElement;
  root.style.setProperty('--gm', theme.gm);
  root.style.setProperty('--ac', theme.ac);
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--card', theme.card);
  root.style.setProperty('--mut', theme.mut);
  root.style.setProperty('--bd', `color-mix(in srgb, ${theme.gm} 18%, ${theme.bg})`);
}
