#!/usr/bin/env tsx
/**
 * Subset variable JetBrains Mono into TWO WOFF2 files:
 *
 *   1. `jetbrains-mono.woff2` — primary Latin (U+0000–007F + U+00A0–00FF)
 *   2. `jetbrains-mono-ext.woff2` — extended punctuation, currency, arrows,
 *      box-drawing, block-shapes
 *
 * The two files are declared as separate `@font-face` blocks with non-
 * overlapping `unicode-range`s, so the browser only fetches the extended
 * file when a glyph in that range is encountered. Body text stays under
 * 30 KB; the rare prose with box-drawing pulls the extras lazily.
 *
 * Also copies the raw variable TTF + a static bold cut for the server-side
 * OG renderer (Satori). Uses `subset-font` (Node-based) so we don't need
 * pyftsubset.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import subsetFont from 'subset-font';

interface Bundle {
  output: string;
  ranges: ReadonlyArray<readonly [number, number]>;
  label: string;
}

const SOURCE = 'fonts/source/JetBrainsMono[wght].ttf';

const BUNDLES: Bundle[] = [
  {
    output: 'public/fonts/jetbrains-mono.woff2',
    label: 'primary Latin',
    ranges: [
      [0x0000, 0x007f], // ASCII
      [0x00a0, 0x00ff], // Latin-1 supplement
    ],
  },
  {
    output: 'public/fonts/jetbrains-mono-ext.woff2',
    label: 'extended (punct, currency, arrows, box-drawing)',
    ranges: [
      [0x2010, 0x2027],
      [0x2030, 0x2030],
      [0x2032, 0x2033],
      [0x2070, 0x2070],
      [0x2074, 0x2079],
      [0x20a0, 0x20bf],
      [0x2122, 0x2122],
      [0x2191, 0x2199],
      [0x2500, 0x257f],
      [0x2580, 0x259f],
    ],
  },
];

function buildTargetText(ranges: Bundle['ranges']): string {
  const codePoints: number[] = [];
  for (const [start, end] of ranges) {
    for (let cp = start; cp <= end; cp++) {
      codePoints.push(cp);
    }
  }
  return String.fromCodePoint(...codePoints);
}

async function main(): Promise<void> {
  mkdirSync('public/fonts', { recursive: true });
  mkdirSync('public/fonts/og', { recursive: true });

  if (!existsSync(SOURCE)) {
    console.error(`missing source: ${SOURCE}`);
    process.exit(1);
  }
  const buf = readFileSync(resolve(SOURCE));

  for (const bundle of BUNDLES) {
    console.log(`subsetting ${bundle.label} -> ${bundle.output}`);
    const text = buildTargetText(bundle.ranges);
    const subset = await subsetFont(buf, text, {
      targetFormat: 'woff2',
      preserveNameIds: [0, 1, 2, 3, 4, 5, 6],
      variationAxes: { wght: { min: 100, max: 800 } },
    });
    writeFileSync(resolve(bundle.output), subset);
    console.log(`  wrote ${subset.byteLength.toLocaleString()} bytes`);
  }

  // Copy raw TTF for Satori (server-side OG renderer).
  const ogDst = 'public/fonts/og/JetBrainsMono-Variable.ttf';
  copyFileSync(resolve(SOURCE), resolve(ogDst));
  console.log(`copied ${SOURCE} -> ${ogDst}`);

  // Also instance the variable font at weight 700 as a static TTF.
  // @vercel/og/Satori's bundled opentype.js cannot parse our fvar table,
  // so the OG endpoint loads this static cut instead.
  const ogBoldDst = 'public/fonts/og/JetBrainsMono-Bold.ttf';
  const latinAscii = String.fromCodePoint(...Array.from({ length: 0x100 }, (_, i) => i));
  const ogBold = await subsetFont(buf, latinAscii, {
    targetFormat: 'truetype',
    preserveNameIds: [0, 1, 2, 3, 4, 5, 6],
    variationAxes: { wght: { min: 700, max: 700 } },
  });
  writeFileSync(resolve(ogBoldDst), ogBold);
  console.log(`wrote ${ogBoldDst} (${ogBold.byteLength.toLocaleString()} bytes)`);

  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
