# MC-Sparse method animation

A 48-second, 1920 × 1080, 30 fps schematic animation. It uses vector-like shapes rendered with Pillow and encoded as H.264 MP4. The video has English on-screen explanations and no audio.

## Storyboard

| Time | Segment | Message |
| --- | --- | --- |
| 00–05 | Introduction | Precise token selection with extended reuse |
| 05–13 | Query grouping | Similar queries become equal-size, tile-aligned groups |
| 13–21 | Exact token selection | Aggregate exact attention mass per query group; select individual top-K KV tokens across block boundaries |
| 21–28 | Residual cache | Cache the dense-minus-sparse output difference at the anchor |
| 28–39 | Reuse | Fresh Q, K, and V use the cached groups, indices, and additive residual across subsequent steps |
| 39–44 | Refresh | Recompute metadata and residual at the next scheduled anchor |
| 44–48 | Closing | Fine-grained, exact, reusable sparse attention |

This is a conceptual illustration of Section 4 and Figure 5 of the supplied paper. Token counts, attention values, colors, and refresh intervals are illustrative, not measured results. The residual diagram scales colors for visibility. The video does not imply that Q/K/V are cached, that selection happens only once for the full trajectory, or that compensation exactly reconstructs dense attention at reuse steps.

## Regenerate

Requirements: Python 3, Pillow, and an FFmpeg installation with `libx264`.

```sh
python3 animation/render_method.py --output assets/videos/method-explainer.mp4 --stills /tmp/mcsparse-animation-frames
```

The script selects local macOS or DejaVu fonts. For other systems, set `MCSPARSE_FONT_REGULAR` and `MCSPARSE_FONT_BOLD` to your local font paths. Fonts are not distributed.

Use `--preview --stills /tmp/mcsparse-animation-frames` to render only the storyboard frames. Edit the scene functions to revise labels, timing, and diagrams. The browser requires no Python or rendering dependencies to play the exported video.
