#!/usr/bin/env bash
# TikTok versions of the 100 videos: media/videos/tiktok/<slug>.mp4.
# TikTok covers the bottom fifth of the screen with the caption and the
# account name, and the right edge with its buttons; the subtitles of the
# original videos sit at 80 to 85 % of the height, under that overlay. Each
# frame is scaled to 85 % and set 48 px from the top on the videos' own navy
# gradient (scripts/video/tiktok/safe-zone-bg.png), which puts the subtitles
# at 70 to 77 % and keeps the cards clear of the buttons. Audio is copied.
#   bash scripts/video/make-tiktok-videos.sh        # 3 at a time
set -euo pipefail
cd "$(dirname "$0")/../.."
BG=scripts/video/tiktok/safe-zone-bg.png
mkdir -p media/videos/tiktok
ls media/videos/*.mp4 | xargs -P 3 -I{} sh -c '
  out="media/videos/tiktok/$(basename "$1")"
  [ -s "$out" ] && exit 0
  ffmpeg -loglevel error -y -loop 1 -i "$2" -i "$1" -filter_complex "[1:v]scale=612:1088:flags=lanczos[fg];[0:v][fg]overlay=54:48:shortest=1,fps=30,format=yuv420p" \
    -c:v libx264 -preset veryfast -tune stillimage -crf 26 -c:a copy -movflags +faststart -shortest "$out"
' _ {} "$BG"
echo "$(ls media/videos/tiktok/*.mp4 | wc -l) TikTok videos in media/videos/tiktok/"
