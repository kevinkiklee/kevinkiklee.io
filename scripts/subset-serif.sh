#!/usr/bin/env bash
# Subsets Source Serif 4 static instances to the latin range the site uses.
# Requires: pipx (or pip-installed fonttools[woff]).
set -euo pipefail
SRC_DIR="${1:?usage: subset-serif.sh <dir containing SourceSerif4-*.ttf>}"
OUT=public/fonts
UNICODES='U+0000-00FF,U+2010-2027,U+2030,U+2039-203A,U+2044,U+2192,U+2197'
FLAGS=(--flavor=woff2 --layout-features='kern,liga' --unicodes="$UNICODES" --no-hinting --desubroutinize)
pipx run --spec 'fonttools[woff]' pyftsubset "$SRC_DIR/SourceSerif4-Regular.ttf"  "${FLAGS[@]}" --output-file="$OUT/source-serif-4-roman-400.woff2"
pipx run --spec 'fonttools[woff]' pyftsubset "$SRC_DIR/SourceSerif4-Semibold.ttf" "${FLAGS[@]}" --output-file="$OUT/source-serif-4-roman-600.woff2"
pipx run --spec 'fonttools[woff]' pyftsubset "$SRC_DIR/SourceSerif4-It.ttf"       "${FLAGS[@]}" --output-file="$OUT/source-serif-4-italic-400.woff2"
# OG variant keeps TTF flavor (Satori needs TTF) and only the glyphs titles use.
mkdir -p "$OUT/og"
pipx run --spec 'fonttools[woff]' pyftsubset "$SRC_DIR/SourceSerif4-Semibold.ttf" \
  --unicodes='U+0020-007E,U+2013,U+2014,U+2018-201D,U+2026' --layout-features='kern' \
  --output-file="$OUT/og/SourceSerif4-Semibold-og.ttf"
ls -la "$OUT"/source-serif-4-*.woff2 "$OUT/og/SourceSerif4-Semibold-og.ttf"
