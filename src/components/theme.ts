import { useColorScheme } from 'react-native';

export interface Palette {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  danger: string;
  warnBg: string;
}

const light: Palette = {
  bg: '#F6F7F5',
  surface: '#FFFFFF',
  text: '#16201B',
  muted: '#5B6660',
  border: '#DCE1DD',
  accent: '#1F6F50',
  accentText: '#FFFFFF',
  accentSoft: '#A9CDBD',
  danger: '#B3261E',
  warnBg: '#FCEFD9',
};

const dark: Palette = {
  bg: '#101412',
  surface: '#1A201D',
  text: '#E8EDEA',
  muted: '#A2ADA7',
  border: '#2E3632',
  accent: '#6CC29A',
  accentText: '#0B1510',
  accentSoft: '#335B49',
  danger: '#F2B8B5',
  warnBg: '#3A2E17',
};

export const palettes = { light, dark };

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const KIND_ICONS = {
  electricity: 'bolt',
  water: 'water-drop',
  gas: 'local-fire-department',
  custom: 'speed',
} as const;
