# MC-Sparse method loop

An eight-second, fixed-layout animated diagram. The page displays animated WebP directly as a picture, with no video player, title sequence, timeline, or chapter controls. A GIF version is included for sharing.

## Sequence

1. Similar query tokens move into groups, then exact top-K KV tokens are highlighted.
2. The anchor stores query groups, KV indices, and the dense-minus-sparse residual.
3. The same cache serves consecutive steps, each using fresh Q, K, and V.
4. The diagram resets and loops. The caption specifies that reuse lasts until the next anchor.

Text stays fixed throughout the loop. Token counts, score heights, colors, and the number of illustrated reuse steps are schematic, not measured results.

## Outputs

- `assets/figures/method-loop.webp`: horizontal animated WebP.
- `assets/figures/method-loop-mobile.webp`: vertically arranged animated WebP.
- `assets/figures/method-loop-still.webp`: horizontal still used when paused or reduced motion is preferred.
- `assets/figures/method-loop-mobile-still.webp`: vertical still.
- `assets/figures/method-loop.gif`: shareable horizontal GIF.

The page selects a horizontal or vertical version responsively, with a small text link to pause the animation. Reduced-motion preferences select the still image automatically.

## Regenerate

Requirements: Python 3 and Pillow with animated WebP support.

```sh
python3 animation/render_loop.py --output-dir assets/figures
```

The renderer uses locally available macOS or DejaVu fonts. Set `MCSPARSE_FONT_REGULAR` and `MCSPARSE_FONT_BOLD` to local font paths on other systems. No font files are distributed.

The original 48-second film has been removed from the page. Its previous implementation remains in Git history.
