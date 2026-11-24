# Phase 03.2 — Milestone 2 implementation

2026-11-24. The temporary review branch `codex/temp-editor-m2-20261124` continues the existing editor checkpoint `f5a1f37`, a direct child of the Phase 03.1 merge `f2d5524`. The checkout on this machine initially contained a clean copy of `main`. Git had the checkpoint under `origin/feat/design-studio-editor`. It included Milestone 1, artwork editing, quality improvements, the contextual toolbar and the garment mask. The owner requested a temporary branch for transfer to their personal laptop.

## Editing behavior

- Library inspection is separate from **Add to design**. The explicit Front/Back target is visible beside placement. Catalog revision, available garment/variant, artwork compatibility, original dimensions and manifest references are validated before insertion. Each object gets a stable UUID. Initial size is proportional and placed centrally in provisional preview coordinates.
- Single selection, Shift-click/checkbox multi-selection, pointer drag, uniform corner resize and group rotation share canonical transform commands. X/Y describe the object center; width/height preserve aspect; clockwise rotation is normalized. Physical arrow keys nudge by one preview pixel, Shift by ten; held keys coalesce until keyup. Inputs own their normal editing keys.
- Duplicate, delete, front/back ordering, single-step ordering, alignment, lock and visibility work through commands. Locked/hidden objects cannot be transformed or duplicated/deleted by selection commands. Layer controls can unlock/reveal them. Front/back selections and artwork are independent. Undo/redo targets the side recorded in the command.
- The icon-only contextual toolbar offers side-centered horizontal/vertical group alignment, one-step forward/backward, duplicate, lock/unlock and delete. It uses localized accessible names/native tooltips, normal keyboard buttons and visible focus. Actions retain selection. It is positioned in viewport CSS pixels from the document matrix, clamped inside the workspace, hidden in Hand mode, and separate from the masked artwork. Detailed numeric controls remain in the inspector.
- Existing camera, Fit, grid, fullscreen, themes, panels, Pin, five docks and local view transitions remain in place. Browser memory retains the project, history, selection, active side/view and clipping preference across locale navigation. Reload loses the project; **Not saved yet** remains truthful.

## Document, history and gestures

The M1 v2 parser and empty-v1 migration initialize `EditorController`. All committed content is plain canonical data; no canvas node, bitmap, camera transform or UI clipping setting is serialized. Current original PNG assets have SHA-256, byte length and intrinsic dimensions in `catalog/artwork-manifest.json`. `node scripts/artwork-manifest.mjs --check` reproduces the integrity check. Rights snapshots preserve the current unverified/provisional commercial status and the UI states that preview use grants no commercial/printing permission.

History stores validated before/after snapshots for the edited side and its asset manifest. Entries contain metadata and references to originals. History is bounded by 100 entries and an 8 MiB serialized metadata budget. The controller rejects an oversized command before changing the document. Revisions advance through undo and redo. A completed edit clears redo. Selection, camera movement, presentation changes, no-ops and cancelled gestures preserve it.

Gesture start captures immutable transforms, side, base revision and a monotonically increasing token. Movement updates only transient transforms, at most once per animation frame. Pointerup flushes the final sample and commits once. Escape, pointercancel, lost capture, blur, hidden document, side/unmount, camera or image/layout changes restore canonical geometry. Late samples/completions cannot affect a newer gesture. Keyboard nudges use the same begin/preview/finish path.

The viewport capture-phase coordinator records touches without stealing the first artwork pointer. Hand/Space owns pan; a second touch cancels artwork before capturing both pointers for pinch. A remaining finger cannot resume the cancelled artwork gesture. Panel events remain outside the viewport coordinator. Konva nodes have listening disabled, preventing a competing native drag owner. The custom DOM handles are an intentional adaptation of the M1 native Transformer feasibility result.

The surface and camera coordinator check pointer ownership and the start time of the current interaction before accepting queued events. A new drag clears pending animation-frame samples. The English and Arabic browser tests replay old moves, releases, cancellations and capture loss during a newer drag, including reuse of the same mouse pointer ID. They check that the second drag commits exactly once and that undo restores its starting transform.

## Rendering quality investigation

See [rendering evidence and limits](../spikes/editor-rendering-quality.md).

The original crown is **364 × 368 PNG**, with transparent, intentionally distressed details. The artwork renderer was already loading that original, not the Next Image/WebP library thumbnail. There was no destructive resampling, asset re-encoding, node cache, or Transformer scale normalization in the live adapter; width/height were canonical geometry and scaleX/Y represented only flips.

The prior report measured a fixed-size backing bitmap under CSS camera enlargement. At 200% zoom, the DPR 2 layer remained 1236 × 618 while occupying about 1236.6 × 618.3 CSS pixels. The current layer supplies 2473 × 1236 pixels across that same area. An independent Chromium canvas comparison using the same crown found that changing backing resolution changed 33,213 output pixels. Switching only the smoothing hint produced identical 91 × 92 output in that experiment. Current live-resize tests recorded identical PNGs immediately before and after release at DPR 1 and 2 in Arabic and English. A separate release-time degradation remains unreproduced.

The renderer now decodes/caches only originals by stable source identity, avoids repeated decode work when metadata snapshots change, requests high-quality smoothing before each layer draw, and allocates backing pixels for DPR × camera zoom. The CSS parent still applies geometry exactly once. Per surface the backing bitmap is limited to 4 Mi pixels (16 MiB RGBA) and 4096 pixels per edge; Both can have two such scene bitmaps, with additional browser/Konva/mockup memory. Extreme zoom may reach this explicit quality/memory trade-off. No global low DPR is forced. Real mobile memory behavior remains unverified.

## Garment silhouette preview

The actual original front/back hoodie PNGs both measure 1774 × 887 and have transparent corners, meaningful body/sleeve/hood alpha and antialiased boundaries. The front contains 864,186 zero-alpha pixels and the back 879,790. Body alpha is commonly 253, so the mask retains the supplied alpha rather than inventing an opaque rectangle or tracing a generic hoodie.

**Clip to Garment / إخفاء الأجزاء خارج الهودي** defaults on and toggles only session presentation state. CSS alpha masking uses each side's original PNG at exactly 100% of the image wrapper. The garment itself, selection hit boxes, transform handles and contextual toolbar are outside that mask. Clipping never crops original bytes, changes coordinates, adds history or validates a physical print region. With clipping off, artwork remains subject to the existing editor viewport, not a garment silhouette. The current canvas remains suitable as an artwork-only render tree; no production export is implemented.

The checkpoint still cut off artwork at the PNG rectangle when the mask was disabled. The unclipped renderer now uses a viewport-sized canvas and projects each garment side's document origin into it. In Both view the paint order allows a graphic to extend over the neighboring mockup. The toolbar uses the same fitted side positions. Narrow layouts use 44 CSS-pixel action targets. Arabic uses right-to-left action order, and locking a visible selection leaves hidden layers alone.

## Files and dependencies

Production dependencies added: **konva 10.10.0**, **react-konva 19.3.2**, both MIT, plus their normal reconciler/support dependencies in the lockfile. Installed Next 16.4.6 and React/React DOM 19.3.1 are unchanged. No competing engine or image-processing dependency was added; Sharp and Playwright were already development tools. The existing [Picomatch review](security-review.md) remains unresolved and is not superseded by these validations.

| Area                       | Files                                                                                                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical editing          | `editor/controller.ts`, `controller.test.ts`, `use-editor.ts`                                                                                                                                                   |
| Originals and rendering    | `editor/catalog-assets.ts`, `decoded-image.ts`, `render-quality.ts`, `render-quality.test.ts`, `editor-surface.tsx`, `surface-boundary.tsx`, `catalog/artwork-manifest.json`, `scripts/artwork-manifest.mjs`    |
| Commands and contextual UI | `editor/editor-controls.tsx`, `context-toolbar.tsx`, existing `components/inspector.tsx`, `components/studio-icon.tsx`                                                                                          |
| Shell/camera integration   | existing `studio-shell.tsx`, `components/workspace.tsx`, `components/garment-scene.tsx`, `use-camera-navigation.ts`, `studio.css`; M1 `editor/coordinates.ts` extended with measured-image mapping              |
| Localization               | `messages/en.json`, `messages/ar.json`                                                                                                                                                                          |
| Browser coverage           | `e2e/design-studio-editor.spec.ts`, `design-studio-rendering.spec.ts`, `design-studio-reconstruction.spec.ts`, `fixtures/reconstructed-surface.tsx` and the placement assertion in `design-studio-page.spec.ts` |
| Architecture and evidence  | this report, rendering report/evidence, ADR 0002, editor integration, design documents, M1/handoff follow-up notes; original M1 evidence preserved                                                              |

The temporary branch updates these files from the recovered checkpoint.

- `components/garment-scene.tsx`, `components/workspace.tsx`, `viewport.ts`, `viewport.test.ts` and `editor/editor-surface.tsx` share side registration and extend the unclipped drawing surface.
- `editor/context-toolbar.tsx`, `editor/render-quality.ts`, `editor/render-quality.test.ts`, `editor/controller.ts`, `editor/controller.test.ts` and `studio.css` cover localization, hit targets, locking and the clip control.
- `use-camera-navigation.ts` and the gesture handlers in `editor/editor-surface.tsx` enforce pointer ownership.
- `components/inspector.tsx`, `editor/editor-controls.tsx` and the two files in `messages/` distinguish the current view, placement side and layer-editing side for assistive technology.
- The three editor Playwright specs, the reconstruction fixture, this report, the rendering report and its evidence archive cover reproduction and review. The package manifest and lockfile match the recovered checkpoint.

## Validation

**The complete production Playwright suite passed 186/186 in 613.33 seconds** using two Chromium workers. There were zero failures, flakes, skips, retries or global errors. This comprises 165 existing regressions and 21 editor cases. The first complete run had 184 passes and two failures. Both failures exposed the same ambiguity between the workspace view and Inspector side controls in Arabic and English. The buttons now have localized names for their individual purposes. The original viewport-matrix tests passed on the corrected development server and in the final production run. [Run counts](../spikes/evidence/editor-m2/verification.json)

On the temporary branch, `npm.cmd run check` passed formatting, ESLint with zero warnings, TypeScript, **124 unit tests in 14 files**, and the Next.js 16.4.6 production build. The original asset manifest also passed `node scripts/artwork-manifest.mjs --check`. The targeted production browser run passed **20/20**, with zero failed, flaky, skipped or retried tests. It included fresh-document reconstruction at both pixel densities. The additional Both-view overlap case is part of the complete regression run.

The earlier checkpoint recorded 122 passing unit tests and 18 passing focused Playwright tests before the last fixes.

Recovery preserved the earlier 8-test report (6 passed, 2 failed, zero flaky/skipped/retried). Its failures started touch manipulation during the closing-panel geometry transition; cancelling in that case is required. The tests now wait for the actual transition/observer settling rather than disabling cancellation. The earlier Hand-mode test assertion was corrected to inspect canonical numeric state while selection hit controls are intentionally hidden. No existing regression assertions were removed or disabled.

Preliminary full-suite runs were interrupted during final review: one to correct toolbar width accounting for its borders, another after the mouse tests exposed a real post-drag selection regression. Pointer capture retargeted the generated click to the surface, where blank-space deselection cleared the selection. The surface now consumes the completion click while preserving normal blank clicks and cancellation behavior; the regression explicitly asserts that a completed drag retains selection. Interrupted runs are not reported as completed regression validation.

## Limits and Milestone 3 boundary

No physical garment/print dimensions, print approval or supplier specification was invented. The silhouette can include areas that are not printable. The crown remains a finite-resolution distressed bitmap; interpolation cannot create missing source detail. Current catalog assets are PNGs; no fake vectorization or unreviewed SVG ingestion was added. Genuine SVG support should preserve sanitized originals behind a versioned resolver with external-resource/script restrictions before a future rendering/export path is enabled.

Real-device testing remains open for Android Chrome and iOS Safari touch and pinch, stylus input, mobile memory pressure and physical display appearance. Keyboard and semantic browser tests cover layer selection, numeric alternatives, localized action names and focus. Human Arabic-language review and screen-reader walkthroughs remain open.

Milestone 3 remains deferred. Its scope includes text and Arabic IME, font resolution, production uploads, IndexedDB/project recovery, calibrated print regions, production DTF export, pricing and checkout. Larger projects may warrant smaller per-object history patches and decoded-asset cache eviction.
