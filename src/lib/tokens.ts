// Mirror of src/styles/tokens.css — keep in sync when tokens change.
export const tokens = {
  light: {
    bg: '#eff1e7',
    fg: '#2c352b',
    fgMuted: '#49523f',
    fgSubtle: '#464f3b',
    rule: '#2c352b',
    ruleSoft: '#ccd3bd',
    panel: '#f6f7ef',
    codeBg: '#e6e9da',
    accent: '#8f4a26',
    gardenInk: '#3f4c3a',
  },
  dark: {
    bg: '#161b14',
    fg: '#dfe3cf',
    fgMuted: '#aab599',
    fgSubtle: '#a0ac8e',
    rule: '#dfe3cf',
    ruleSoft: '#313c2b',
    panel: '#1c221a',
    codeBg: '#10140e',
    accent: '#d9a05b',
    gardenInk: '#7d8a6e',
  },
} as const;

/** Seasonal --bg overrides (spec §3.4): only bg and garden-ink may vary. */
export const seasonBackgrounds = {
  light: { spring: '#eef2e4', summer: '#eff1e7', autumn: '#f2f0e3', winter: '#edefe9' },
  dark: { spring: '#151c12', summer: '#161b14', autumn: '#191b12', winter: '#14181a' },
} as const;

/** Pairs that must reach the AAA body threshold (7:1). */
export const aaaPairs: Array<[keyof typeof tokens.light, keyof typeof tokens.light]> = [
  ['fg', 'bg'],
  ['fgMuted', 'bg'],
  ['fgSubtle', 'bg'],
];

/** Pairs that must reach AA (4.5:1). */
export const aaPairs: Array<[keyof typeof tokens.light, keyof typeof tokens.light]> = [
  ['fg', 'codeBg'],
  ['accent', 'bg'],
  ['accent', 'codeBg'],
];
