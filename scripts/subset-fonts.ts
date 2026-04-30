#!/usr/bin/env tsx
/**
 * Subset variable JetBrains Mono to a Latin-leaning glyph range and re-encode
 * as WOFF2. Also copies the raw variable TTF for the server-side OG renderer
 * (Satori). Uses `subset-font` (Node-based) so we don't need pyftsubset.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import subsetFont from 'subset-font';

interface Source {
  input: string;
  output: string;
}

const SOURCES: Source[] = [
  { input: 'fonts/source/JetBrainsMono[wght].ttf', output: 'public/fonts/jetbrains-mono.woff2' },
];

// Latin + extended Latin + common punctuation, arrows, currency, box-drawing.
const RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x0000, 0x007f],
  [0x00a0, 0x00ff],
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
];

function buildTargetText(): string {
  const codePoints: number[] = [];
  for (const [start, end] of RANGES) {
    for (let cp = start; cp <= end; cp++) {
      codePoints.push(cp);
    }
  }
  return String.fromCodePoint(...codePoints);
}

async function main(): Promise<void> {
  mkdirSync('public/fonts', { recursive: true });
  mkdirSync('public/fonts/og', { recursive: true });

  const text = buildTargetText();

  for (const { input, output } of SOURCES) {
    if (!existsSync(input)) {
      console.error(`missing source: ${input}`);
      process.exit(1);
    }
    console.log(`subsetting ${input} -> ${output}`);
    const buf = readFileSync(resolve(input));
    const subset = await subsetFont(buf, text, {
      targetFormat: 'woff2',
      preserveNameIds: [0, 1, 2, 3, 4, 5, 6],
      variationAxes: { wght: { min: 100, max: 800 } },
    });
    writeFileSync(resolve(output), subset);
    console.log(`  wrote ${subset.byteLength.toLocaleString()} bytes`);
  }

  // Copy raw TTF for Satori (server-side OG renderer).
  const ogSrc = 'fonts/source/JetBrainsMono[wght].ttf';
  const ogDst = 'public/fonts/og/JetBrainsMono-Variable.ttf';
  copyFileSync(resolve(ogSrc), resolve(ogDst));
  console.log(`copied ${ogSrc} -> ${ogDst}`);

  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
