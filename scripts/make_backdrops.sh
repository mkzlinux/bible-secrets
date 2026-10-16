#!/usr/bin/env bash
# Render 16:9 hero backdrops from the 2:3 poster art (ImageMagick required).
set -euo pipefail
cd "$(dirname "$0")/../public/posters"
for f in poster-*.jpg; do
  base=${f#poster-}
  convert "$f" -resize 1920x -gravity center -crop 1920x1080+0+0 +repage -quality 86 "backdrop-$base"
done
echo "backdrops refreshed"
