import { describe, expect, it } from 'vitest';
import baseline from '../../tokens-baseline.json' with { type: 'json' };
import { contrastRatio } from './contrast.ts';
import { aaPairs, aaaPairs, seasonBackgrounds, tokens } from './tokens.ts';

const skip = new Set<string>(baseline.skip);

describe('token contrast', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const [fg, bg] of aaaPairs) {
      const key = `${theme}:${fg}/${bg}:aaa`;
      it(`${key} ≥ 7:1`, () => {
        if (skip.has(key)) return;
        const r = contrastRatio(tokens[theme][fg], tokens[theme][bg]);
        expect(r, `${theme} ${fg} on ${bg} is ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(7);
      });
    }
    for (const [fg, bg] of aaPairs) {
      const key = `${theme}:${fg}/${bg}:aa`;
      it(`${key} ≥ 4.5:1`, () => {
        if (skip.has(key)) return;
        const r = contrastRatio(tokens[theme][fg], tokens[theme][bg]);
        expect(r, `${theme} ${fg} on ${bg} is ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe('seasonal backgrounds hold AAA text contrast', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const [season, bg] of Object.entries(seasonBackgrounds[theme])) {
      for (const fgKey of ['fg', 'fgMuted', 'fgSubtle'] as const) {
        it(`${theme}/${season}: ${fgKey} on ${bg} ≥ 7:1`, () => {
          const r = contrastRatio(tokens[theme][fgKey], bg);
          expect(r, `${theme} ${fgKey} on ${bg} is ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(7);
        });
      }
      it(`${theme}/${season}: accent on ${bg} ≥ 4.5:1`, () => {
        const r = contrastRatio(tokens[theme].accent, bg);
        expect(r, `${theme} accent on ${bg} is ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
