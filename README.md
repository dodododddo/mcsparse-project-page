# MC-Sparse project page

A self-contained English research project page built from the supplied paper, video results, and original GLB meshes.

## Preview

With Node.js installed, open a terminal in this folder and run:

```sh
npm start
```

Open `http://localhost:4173`. No package installation or build step is required. Set `PORT=8080 npm start` to use a different port.

The included server supports byte-range requests for video seeking and binds to the local computer. Opening `index.html` through `file://` does not support module imports and GLB loading reliably; use the preview server or a static web host.

## Included interactions

- Teaser with synchronized Dense / Ours slider comparison and an Ours-only option.
- Four selected MiniMax-H3 scenes: `new_1.mp4`, `new_2.mp4`, `new_3.mp4`, and `new_4.mp4`.
- Prompt acknowledgment: “Some prompts are borrowed from VDN-H3.”
- Single-video pause, restart, seek, speed, and fullscreen controls.
- Four original 3D cases, each with Dense, MC-Sparse, PISA, and Sol-Attn meshes.
- Shared-camera mesh comparison in a default 2 × 2 layout.
- A Dense-versus-method selector for slider comparisons with MC-Sparse, PISA, or Sol-Attn.
- Orbit, zoom, pan, reset, auto-rotation, normal colors, and clay shading.
- Keyboard-adjustable dividers. Arrow keys orbit a focused 3D canvas; + / - zoom, and R resets it.
- Responsive layouts, reduced-motion support, loading progress, retry controls, and geometry image previews.
- Paper PDF, labeled method diagrams, pipeline illustration, and results from Tables 1–2 and Figure 1.
- The performance chart reports relative denoising speedup (1.00×, 1.61×, 1.80×), with no absolute runtime values.

## Edit the content

- `index.html`: title, author information, introductory copy, method description, paper links.
- `data.js`: video groups, scene names, per-method filenames, mesh case labels, and metric tables.
- `styles.css`: layout, colors, typography, and responsive styles.
- `video-player.js`: single-method video playback and shared divider helpers.
- `video-compare.js`: synchronized Dense / Ours teaser playback.
- `mesh-viewer.js`: GLB loading, shared camera, scissor rendering, and geometry controls.
- `assets/paper.pdf`: the supplied `mcsparse.pdf`.
- `assets/videos/`: original MP4 files, unchanged.
- `assets/meshes/`: all 16 original GLB files, unchanged.
- `assets/posters/`: video poster frames and geometry previews extracted from the supplied comparison slides.
- `ASSETS.md`: source mapping and naming notes.

The paper lists anonymous authors, so the page retains **Anonymous authors · Under review**. No unprovided author names, institutions, code repositories, arXiv identifiers, or publication claims have been invented.

## 3D fidelity and loading

Each supplied GLB contains approximately 2 million triangles and is about 36 MB. Geometry is not decimated. The complete page folder is dominated by the original full-resolution meshes.

The viewer opens in a 2 × 2 layout and loads all four methods for the current case on entering the 3D section. Selecting a comparison method switches to the Dense-versus-method slider, keeping the camera viewpoint. Changing cases cancels pending fetches and releases the previous geometry. One camera and one normalization derived from the Dense mesh are used for every method in a case.

For public deployment, use a static host that accepts the asset sizes and serves `.js` as JavaScript and `.glb` as `model/gltf-binary`. HTTP compression of GLB files can reduce transfer size without changing geometry. Do not simplify or separately recenter each method if preserving the scientific comparison is the priority.

## Video showcase

The teaser supports a synchronized Dense / Ours divider and an Ours-only view. Its sources are configured by `teaser` in `data.js`. The Dense source is `new_dense.mp4` and the Ours source is `new_ours.mp4`. Both retain the original 1344 × 768 resolution, 24 fps, and 14.375-second duration.

The gallery displays `new_1`, `new_2`, `new_3`, and `new_4` in that order. The old `1.mp4` repeats the night-street content of `new_1.mp4`, so it is no longer displayed; `new_4.mp4` adds the distinct rain-duel scene. Each player retains the source aspect ratio and provides play/pause, restart, seeking, playback speed, and fullscreen controls. Offscreen videos pause automatically; reduced-motion preferences disable autoplay.

Hunyuan and Wan video examples and model selectors have been removed from the page. The quantitative table selector now contains MiniMax-H3 and 3D generation. This repository includes only the media used by the current page. Unused source videos are kept outside this repository.

The three method cards now explain their symbols with labels: query colors indicate similarity, highlighted KV bars indicate retained tokens, and the two residual equations show the anchor and reuse steps. These are schematic illustrations, not experimental plots.

## Verification

Validated in desktop Chrome and a 390 px mobile viewport:

- Ours-only source selection and single-video playback controls.
- All four selected H3 video sources and their playback.
- Teaser split / single view switching and playback synchronization.
- Labeled method diagrams at desktop and mobile widths.
- Default 2 × 2 layout and all three Dense-versus-method slider options.
- 3D divider dragging, keyboard limits, and layout switching during loading.
- All 16 GLBs, surface modes, orbiting, and rapid case switching.
- Mobile page width, four-mesh layout, and horizontally scrollable tables.
- JavaScript syntax checks and runtime/resource error checks.

The page can be served directly without a build process. `npm run check` checks the authored JavaScript syntax.

## Third-party dependency

Three.js 0.180.0 is included locally under its MIT license in `vendor/LICENSE`. No runtime CDN, font service, analytics, or external network service is needed by this page.

## Repository visibility

This repository is private. GitHub Pages is not enabled. Run `npm start` to preview it locally.

The repository includes the six active videos, all sixteen full-resolution GLB meshes, the paper PDF, preview images, and the local Three.js runtime. Media files use ordinary Git storage; no Git LFS download step is required.
