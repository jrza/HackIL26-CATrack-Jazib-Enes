/**
 * CAT Inspect AI Co-Pilot — Design Tokens
 *
 * "Liquid glass" language on a warm light canvas.
 * Floating translucent panels. Highlight edges on top/left.
 * Yellow used surgically for actions. Everything else is layered white.
 */

export const C = {
  yellow:        '#FFCD11',
  yellowSoft:    '#FFF0B3',
  yellowDark:    '#D4AB0F',

  black:         '#1A1A1A',
  charcoal:      '#2D2D2D',

  // Layered backgrounds — warm off-whites
  canvas:        '#F0EFEB',    // page background — warm parchment
  glass:         'rgba(255,255,255,0.72)', // primary glass panel
  glassStrong:   'rgba(255,255,255,0.88)', // raised glass (header, tab bar)
  glassMuted:    'rgba(255,255,255,0.45)', // recessed / well areas
  glassYellow:   'rgba(255,205,17,0.10)',  // yellow-tinted glass

  // Edges — the defining liquid glass detail
  edgeLight:     'rgba(255,255,255,0.95)', // bright highlight edge
  edgeSoft:      'rgba(0,0,0,0.06)',       // subtle shadow edge

  // Text
  textPrimary:   '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary:  '#9C9C9C',
  textOnYellow:  '#1A1A00',
  textOnDark:    '#F5F5F5',

  // Structure
  border:        'rgba(0,0,0,0.08)',
  borderStrong:  'rgba(0,0,0,0.14)',

  // Status
  pass:          '#2E8B42',
  monitor:       '#D49B0F',
  moderate:      '#D4700F',
  critical:      '#CF3333',
} as const;

export const T = {
  xs:   { fontSize: 11 as number, letterSpacing: 0.3 },
  sm:   { fontSize: 14 as number, lineHeight: 20 },
  base: { fontSize: 17 as number, lineHeight: 24 },
  lg:   { fontSize: 21 as number, lineHeight: 28 },
  xl:   { fontSize: 28 as number, lineHeight: 34 },

  w4: { fontWeight: '400' as const },
  w5: { fontWeight: '500' as const },
  w6: { fontWeight: '600' as const },
  w7: { fontWeight: '700' as const },
  w9: { fontWeight: '900' as const },
} as const;

export const S = {
  2: 2, 4: 4, 6: 6, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32, 48: 48,
} as const;

export const R = {
  xs:   6,
  sm:   12,
  md:   16,
  lg:   22,
  xl:   28,
  pill: 9999,
} as const;

export const HIT = {
  min: 48,
  std: 56,
  lg:  64,
} as const;
