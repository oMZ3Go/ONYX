# M2 rendering-quality and silhouette evidence

2026-11-23. This is a bounded Chromium investigation of the existing artwork pipeline, not a new engine comparison. Run `npm.cmd run test:e2e -- e2e/design-studio-rendering.spec.ts` after `npm.cmd run check` to reproduce the current checks. Original manifests are verified by `node scripts/artwork-manifest.mjs --check` and the unit suite.

## Findings

| Question                            | Evidence                                                                                                                                                                                                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Which image enters Konva?           | Original `/images/landing/design-studio/prints/print-crown.png`, 364 × 368, not the separate WebP thumbnail fetched by Next Image for the library/inspector. The source manifest records its digest/bytes.                                                      |
| Destructive resize or bitmap cache? | No encoder, resized-asset replacement or `node.cache()` exists in the live path. Numeric/object dimensions change; the original HTML image supplies every draw.                                                                                                 |
| Release-specific change?            | Pre-fix DPR 1/2 during/released PNG SHA-256 values match. A destructive release-time cause was not reproduced. Post-fix tests require matching pixels at both DPRs, in both locales.                                                                            |
| Avoidable loss?                     | The pre-fix context reported smoothing enabled with quality `low`; CSS zoom enlarged a fixed canvas. At 200%, DPR 2 yielded roughly one backing pixel per CSS pixel.                                                                                            |
| Fix                                 | Stable decoded-original cache; `imageSmoothingQuality = high` before every layer draw, including after canvas reallocation; per-layer DPR × zoom backing allocation, bounded at 4 Mi pixels/4096 per edge. No second geometry scale and no global DPR override. |
| Intentional texture                 | Crown strokes include distressed gaps/rough contours in the original. Those are retained. Finite bitmap resolution and tiny-screen downsampling still limit fine detail.                                                                                        |
| Alpha silhouette                    | Both original hoodie PNGs have usable alpha, 1774 × 887, transparent corners and nonrectangular body/sleeve/hood coverage. CSS alpha masking is registered to the image wrapper and applies only to artwork presentation.                                       |

At the measured 1440 × 1000 viewport, the surface is about 618.3 × 309.1 CSS pixels at Fit. Before the fix the backing bitmap stayed 618 × 309 (DPR 1) or 1236 × 618 (DPR 2) at 200% camera zoom. The corrected 200% DPR 2 frame is **2473 × 1236**, occupying about 1236.6 × 618.3 CSS pixels. This restores approximately two backing pixels per CSS pixel while remaining below the per-surface limit. Raster dimensions are floored internally by Konva, so fractional CSS dimensions can differ by less than one pixel.

## Repeatable acceptance checks

The browser suite compares canvas PNG hashes during/released resize, smaller/larger size cycles returning to the same canonical dimensions, resize undo/redo, and front/back surface reconstruction. It checks output dimensions, interpolation state, original-source requests, normal/200% zoom, fullscreen return, and memory bounds at DPR 1 and 2 in Arabic and English. PNGs, screenshots and JSON measurements are written under `.cache/phase-03/editor-quality/` and attached to the browser report. These are test evidence, not production-code hooks or export features.

The clipping test places white crown detail over a known transparent top-corner region, compares actual composed screenshot pixels with the toggle off/on, verifies no history/revision change, then checks editing, undo/redo, Both and side-specific mask registration. The artwork canvas itself intentionally remains unmasked; inspecting its PNG alone cannot verify the CSS preview mask. DOM controls are excluded only from the screenshot pixel measurement, not from interaction tests.

## Evidence archive

The review archive is `docs/spikes/evidence/editor-m2/`: pre-fix canvas metrics and alpha analysis, post-fix DPR/locale metrics, final validation summary and representative screenshots. Current raw images remain in the ignored `.cache` paths. The M1 comparison evidence remains unchanged.

No claim of lossless bitmap enlargement, physical print accuracy, Safari rendering equivalence or real-phone memory performance is made. The original report of release-only degradation is addressed by an explicit pixel-equality regression guard, while the measured downsampling/zoom deficiencies are corrected directly.
