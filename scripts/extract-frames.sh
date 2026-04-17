#!/usr/bin/env bash
# Extract the hero scroll-sync frame sequence from the source video.
# Requires ffmpeg on PATH.  https://ffmpeg.org/download.html
#
# Usage:   bash scripts/extract-frames.sh
# Output:  assets/frames/frame_0001.jpg ... frame_NNNN.jpg
#
# After running, open js/hero-scroll.js and set FRAME_COUNT to the number
# of files produced (see the console message printed at the end).

set -euo pipefail
cd "$(dirname "$0")/.."

SRC="video background 2.mp4"
OUT="assets/frames"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found on PATH. Install it first:"
  echo "  Windows:  winget install ffmpeg   (or https://www.gyan.dev/ffmpeg/builds/)"
  echo "  macOS:    brew install ffmpeg"
  echo "  Linux:    sudo apt install ffmpeg"
  exit 1
fi

mkdir -p "$OUT"
rm -f "$OUT"/frame_*.jpg

# 30 fps at 1920px wide, quality 4 JPEG — aim for ~150–300 total frames, ≤15MB.
ffmpeg -hide_banner -loglevel error -i "$SRC" \
  -vf "fps=30,scale=1920:-2" -q:v 4 \
  "$OUT/frame_%04d.jpg"

COUNT=$(ls "$OUT"/frame_*.jpg | wc -l | tr -d ' ')
echo "Extracted $COUNT frames to $OUT/"
echo "Update FRAME_COUNT in js/hero-scroll.js to: $COUNT"
