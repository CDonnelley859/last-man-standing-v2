export const C = {
  teal: '#e90052',       // Premier League pink — primary accent
  tealMid: '#c4003f',
  tealDeep: '#8b002c',
  lime: '#ffffff',       // White — highlight / CTA accent
  limeDark: '#e0e0e0',
  dark: '#111111',
  dark2: '#2d003c',      // Deep PL purple
  white: '#ffffff',
  g1: '#F5F5F5',
  g2: '#E5E7EB',
  g3: '#9CA3AF',
  g4: '#6B7280',
  red: '#EF4444',
  redBg: '#FEE2E2',
  redText: '#991B1B',
  greenBg: '#D1FAE5',
  greenText: '#065F46',
};

export const BG = `linear-gradient(155deg, #420048 0%, #37003c 60%, #290032 100%)`;

export const SCREEN = {
  minHeight: '100vh',
  background: BG,
  fontFamily: "'Inter', sans-serif",
  position: 'relative',
  paddingBottom: 96,
  overflowX: 'hidden',
};

// Centres content at max 480 px on desktop — spread into the inner content div of each screen
export const WRAP = { maxWidth: 480, margin: '0 auto' };
