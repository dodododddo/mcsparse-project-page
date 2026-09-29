# Source asset mapping

Input folder: the supplied `mcsparse` materials folder.

## Paper and figures

| Page asset | Supplied source |
| --- | --- |
| `assets/paper.pdf` | `mcsparse.pdf` (16 pages) |
| `assets/figures/paper-cover.webp` | Rendered first page of `mcsparse.pdf` |
| `assets/figures/method.png` | Rendered `mcsparse_overview.pdf` |
| Geometry previews and reference images | Individual full-object images in `geo_vis_comparison.pptx`; method order verified against `geo_vis_comparison.pdf` |
| Headline speedups and relative-speedup chart | `mcsparse.pdf`, Figure 1 and Tables 1–2 |
| Results selector tables | `mcsparse.pdf`, Tables 1–2 |

## Current video selection

Input videos are read from the root of the supplied `mcsparse` materials folder. The latest files observed on September 29, 2026 are copied without re-encoding. Names displayed as scene titles describe observed content, not literal generation prompts.

| Position | Source | Display title |
| --- | --- | --- |
| H3 01 | `new_1.mp4` | City lights |
| H3 02 | `new_2.mp4` | Neon streets |
| H3 03 | `new_3.mp4` | An afternoon stroll |
| H3 04 | `new_4.mp4` | A duel in the rain |

The user requested the acknowledgment: **Some prompts are borrowed from VDN-H3.** It is displayed directly under the H3 gallery. No URL was supplied, so the attribution is plain text.

The teaser uses `new_dense.mp4` as Dense and `new_ours.mp4` as Ours. Both are 1344 × 768 at 24 fps with a duration of 14.375 seconds. The displayed images are generated from these exact files, and both copies were verified against their source SHA-256 hashes.

The old `1.mp4` and `new_1.mp4` have different file hashes but repeat the same night-street scene, as confirmed by visual inspection at 1, 6, and 12 seconds. The page keeps `new_1.mp4` and replaces the redundant entry with `new_4.mp4`, which shows a duel in the rain. The four active gallery scenes are distinct.

Old H3 scenes and all Hunyuan/Wan video examples are excluded from this repository. The original materials remain outside the repository.

## Original meshes

All original models are from `supp/` (the folder referred to as “sub” in the request).

| Case | Object | Dense | MC-Sparse | PISA | Sol-Attn |
| --- | --- | --- | --- | --- | --- |
| 1 | Winged guardian | `dense_case1.glb` | `ours_case1.glb` | `pisa_case1.glb` | `solattn_case1.glb` |
| 2 | Electric guitar | `dense_case2.glb` | `ours_case2.glb` | `pisa_case2.glb` | `sol_case2.glb` |
| 3 | Sailing ship | `dense_case3.glb` | `ours_case3.glb` | `pisa_case3.glb` | `solattn_case3.glb` |
| 4 | Clockwork bee | `dense_case4.glb` | `ours_case4.glb` | `pisa_case4.glb` | `solattn_case4.glb` |

All vertex positions and triangle indices are preserved. Browser-computed vertex normals are used for rendering because the input GLBs contain positions and indices without stored normals. Normal and clay shading apply the same material to all methods.

## Original method animation

The 48-second `assets/videos/method-explainer.mp4` is authored for this page from the method in Section 4 and Figure 5. `animation/render_method.py` is the editable source. The poster is `assets/posters/method-explainer.webp`; chapter titles are in `assets/videos/method-explainer.vtt`. It uses no external footage, music, or distributed fonts. All displayed attention scores and schedules are illustrative.
