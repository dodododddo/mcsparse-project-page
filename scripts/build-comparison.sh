#!/bin/sh
# Run from the repository root. Requires FFmpeg with libx264 and libwebp.
# Inputs: 1344x768, 24 fps, 345 corresponding frames each.
set -eu
ffmpeg -hide_banner -y \
  -i assets/videos/new_dense.mp4 -i assets/videos/new_ours.mp4 \
  -filter_complex '[0:v]setpts=PTS-STARTPTS[dense];[1:v]setpts=PTS-STARTPTS[ours];[dense][ours]hstack=inputs=2:shortest=1[paired]' \
  -map '[paired]' -an -r 24 -c:v libx264 -preset medium -crf 12 \
  -profile:v high -level:v 5.1 -pix_fmt yuv420p -movflags +faststart \
  assets/videos/new_comparison.mp4
ffmpeg -hide_banner -y -i assets/videos/new_comparison.mp4 \
  -frames:v 1 -c:v libwebp -quality 90 assets/posters/new_comparison.webp
