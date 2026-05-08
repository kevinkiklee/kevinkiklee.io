// Mirror of src/styles/tokens.css — keep in sync when tokens change.
export const tokens = {
  light: {
    bg: '#f5f4ee',
    fg: '#0a0a0a',
    fgMuted: '#4a4a4a',
    fgSubtle: '#525252',
    rule: '#0a0a0a',
    ruleSoft: '#c8c5b8',
    pillBg: '#0a0a0a',
    pillFg: '#f5f4ee',
    codeBg: '#ebe9df',
    accent: '#b83c10',
  },
  dark: {
    bg: '#0a0a0a',
    fg: '#f4f4f4',
    fgMuted: '#c8c8c8',
    fgSubtle: '#9a9a9a',
    rule: '#f4f4f4',
    ruleSoft: '#2f2f2f',
    pillBg: '#f4f4f4',
    pillFg: '#0a0a0a',
    codeBg: '#161616',
    accent: '#ff7849',
  },
} as const;

/** Pairs that must reach the AAA body threshold (7:1). */
export const aaaPairs: Array<[keyof typeof tokens.light, keyof typeof tokens.light]> = [
  ['fg', 'bg'],
  ['fgMuted', 'bg'],
  ['fgSubtle', 'bg'],
];

/** Pairs that must reach AA (4.5:1). */
export const aaPairs: Array<[keyof typeof tokens.light, keyof typeof tokens.light]> = [
  ['pillFg', 'pillBg'],
  ['fg', 'codeBg'],
  ['accent', 'bg'],
  ['accent', 'codeBg'],
];
