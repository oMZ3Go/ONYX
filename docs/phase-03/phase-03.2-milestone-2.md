# Phase 03.2 — Milestone 2 implementation

2026-11-23. Branch: `feat/design-studio-editor`, based on completed Phase 03.1 merge `f2d5524bc7ba6c778af5846b6e30ec22528b7b13`. All M1 work was retained. Changes remain local and uncommitted. M1 and the engine versions were explicitly approved; the subsequent M2 request added rendering quality, a contextual toolbar and garment preview clipping. No M3 work is included.

## Editing behavior

- Library inspection is separate from **Add to design**. The explicit Front/Back target is visible beside placement. Catalog revision, available garment/variant, artwork compatibility, original dimensions and manifest references are validated before insertion. Each object gets a stable UUID. Initial size is proportional and placed centrally in provisional preview coordinates.
- Single selection, Shift-click/checkbox multi-selection, pointer drag, uniform corner resize and group rotation share canonical transform commands. X/Y describe the object center; width/height preserve aspect; clockwise rotation is normalized. Physical arrow keys nudge by one preview pixel, Shift by ten; held keys coalesce until keyup. Inputs own their normal editing keys.
- Duplicate, delete, front/back ordering, single-step ordering, alignment, lock and visibility work through commands. Locked/hidden objects cannot be transformed or duplicated/deleted by selection commands. Layer controls can unlock/reveal them. Front/back selections and artwork are independent. Undo/redo targets the side recorded in the command.
- The icon-only contextual toolbar offers side-centered horizontal/vertical group alignment, one-step forward/backward, duplicate, lock/unlock and delete. It uses localized accessible names/native tooltips, normal keyboard buttons and visible focus. Actions retain selection. It is positioned in viewport CSS pixels from the document matrix, clamped inside the workspace, hidden in Hand mode, and separate from the masked artwork. Detailed numeric controls remain in the inspector.
- Existing camera, Fit, grid, fullscreen, themes, panels, Pin, five docks and local view transitions remain in place. Browser memory retains the project, history, selection, active side/view and clipping preference across locale navigation. Reload loses the project; **Not saved yet** remains truthful.

## Document, history and gestures

The M1 v2 parser and empty-v1 migration initialize `EditorController`. All committed content is plain canonical data; no canvas node, bitmap, camera transform or UI clipping setting is serialized. Current original PNG assets have SHA-256, byte length and intrinsic dimensions in `catalog/artwork-manifest.json`. `node scripts/artwork-manifest.mjs --check` reproduces the integrity check. Rights snapshots preserve the current unverified/provisional commercial status and the UI states that preview use grants no commercial/printing permission.

History stores side-specific before/after metadata and manifest references, with immutable object sharing. No Blob/image payload is copied. It is bounded by 100 entries and an 8 MiB serialized metadata budget; an oversized command is rejected before changing the document. Revisions advance through undo/redo; a new completed edit clears redo, while selection, camera, presentation changes, no-ops and cancellations do not. The before/after entries currently contain side snapshots rather than per-object patches; they remain bounded, but very large future projects may warrant finer patches.

Gesture start captures immutable transforms, side, base revision and a monotonically increasing token. Movement updates only transient transforms, at most once per animation frame. Pointerup flushes the final sample and commits once. Escape, pointercancel, lost capture, blur, hidden document, side/unmount, camera or image/layout changes restore canonical geometry. Late samples/completions cannot affect a newer gesture. Keyboard nudges use the same begin/preview/finish path.

The viewport capture-phase coordinator records touches without stealing the first artwork pointer. Hand/Space owns pan; a second touch cancels artwork before capturing both pointers for pinch. A remaining finger cannot resume the cancelled artwork gesture. Panel events remain outside the viewport coordinator. Konva nodes have listening disabled, preventing a competing native drag owner. The custom DOM handles are an intentional adaptation of the M1 native Transformer feasibility result.

## Rendering quality investigation

See [rendering evidence and limits](../spikes/editor-rendering-quality.md).

The original crown is **364 × 368 PNG**, with transparent, intentionally distressed details. The artwork renderer was already loading that original, not the Next Image/WebP library thumbnail. There was no destructive resampling, asset re-encoding, node cache, or Transformer scale normalization in the live adapter; width/height were canonical geometry and scaleX/Y represented only flips.

The pre-fix experiment measured low-quality canvas downsampling and a fixed backing bitmap under CSS camera enlargement. At 200% zoom, the DPR 2 layer remained 1236 × 618 while occupying about 1236.6 × 618.3 CSS pixels: only about one backing pixel per CSS pixel on a DPR 2 display. This is a confirmed avoidable resolution loss. A distinct degradation triggered only by releasing the resize **was not reproduced**: before/after release PNG hashes matched at DPR 1 and 2. It would be inaccurate to attribute a destructive release-time mutation without evidence.

The renderer now decodes/caches only originals by stable source identity, avoids repeated decode work when metadata snapshots change, requests high-quality smoothing before each layer draw, and allocates backing pixels for DPR × camera zoom. The CSS parent still applies geometry exactly once. Per surface the backing bitmap is limited to 4 Mi pixels (16 MiB RGBA) and 4096 pixels per edge; Both can have two such scene bitmaps, with additional browser/Konva/mockup memory. Extreme zoom may reach this explicit quality/memory trade-off. No global low DPR is forced. Real mobile memory behavior remains unverified.

## Garment silhouette preview

The actual original front/back hoodie PNGs both measure 1774 × 887 and have transparent corners, meaningful body/sleeve/hood alpha and antialiased boundaries. The front contains 864,186 zero-alpha pixels and the back 879,790. Body alpha is commonly 253, so the mask retains the supplied alpha rather than inventing an opaque rectangle or tracing a generic hoodie.

**Clip to Garment / إخفاء الأجزاء خارج الهودي** defaults on and toggles only session presentation state. CSS alpha masking uses each side's original PNG at exactly 100% of the image wrapper. The garment itself, selection hit boxes, transform handles and contextual toolbar are outside that mask. Clipping never crops original bytes, changes coordinates, adds history or validates a physical print region. With clipping off, artwork remains subject to the existing editor viewport, not a garment silhouette. The current canvas remains suitable as an artwork-only render tree; no production export is implemented.

## Files and dependencies

Production dependencies added: **konva 10.10.0**, **react-konva 19.3.2**, both MIT, plus their normal reconciler/support dependencies in the lockfile. Installed Next 16.4.6 and React/React DOM 19.3.1 are unchanged. No competing engine or image-processing dependency was added; Sharp and Playwright were already development tools. The existing [Picomatch review](security-review.md) remains unresolved and is not superseded by these validations.

| Area                       | Files                                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical editing          | `editor/controller.ts`, `controller.test.ts`, `use-editor.ts`                                                                                                                                                       |
| Originals and rendering    | `editor/catalog-assets.ts`, `decoded-image.ts`, `render-quality.ts`, `render-quality.test.ts`, `editor-surface.tsx`, `surface-boundary.tsx`, `catalog/artwork-manifest.json`, `scripts/artwork-manifest.mjs`        |
| Commands and contextual UI | `editor/editor-controls.tsx`, `context-toolbar.tsx`, existing `components/inspector.tsx`, `components/studio-icon.tsx`                                                                                              |
| Shell/camera integration   | existing `studio-shell.tsx`, `components/workspace.tsx`, `components/garment-scene.tsx`, `use-camera-navigation.ts`, `studio.css`; M1 `editor/coordinates.ts` extended with measured-image mapping                  |
| Localization               | `messages/en.json`, `messages/ar.json`                                                                                                                                                                              |
| Browser coverage           | new `e2e/design-studio-editor.spec.ts`, `design-studio-rendering.spec.ts`; one existing placement-disabled assertion in `design-studio-page.spec.ts` now checks enabled placement and zero objects after inspection |
| Architecture and evidence  | this report, rendering report/evidence, ADR 0002, editor integration, design documents, M1/handoff follow-up notes; original M1 evidence preserved                                                                  |

## Validation

Final validation is in progress; this section will be updated with completed counts. Latest completed quality check: formatting, ESLint, TypeScript, **122 unit tests in 14 files**, and production build passed. The focused editor/refinement run passed **18/18** with no retries, skips, failures or browser-console errors before the final toolbar width correction and added fullscreen/mobile toggle assertions.

Recovery preserved the earlier 8-test report (6 passed, 2 failed, zero flaky/skipped/retried). Its failures started touch manipulation during the closing-panel geometry transition; cancelling in that case is required. The tests now wait for the actual transition/observer settling rather than disabling cancellation. The earlier Hand-mode test assertion was corrected to inspect canonical numeric state while selection hit controls are intentionally hidden. No existing regression assertions were removed or disabled.

Preliminary full-suite runs were interrupted during final review: one to correct toolbar width accounting for its borders, another after the mouse tests exposed a real post-drag selection regression. Pointer capture retargeted the generated click to the surface, where blank-space deselection cleared the selection. The surface now consumes the completion click while preserving normal blank clicks and cancellation behavior; the regression explicitly asserts that a completed drag retains selection. Interrupted runs are not reported as completed regression validation.

## Limits and Milestone 3 boundary

No physical garment/print dimensions, print approval or supplier specification was invented. The silhouette can include areas that are not printable. The crown remains a finite-resolution distressed bitmap; interpolation cannot create missing source detail. Current catalog assets are PNGs; no fake vectorization or unreviewed SVG ingestion was added. Genuine SVG support should preserve sanitized originals behind a versioned resolver with external-resource/script restrictions before a future rendering/export path is enabled.

Unverified: real Android/iOS Safari touch and pinch, stylus behavior, mobile memory pressure, display-specific raster appearance, Arabic human review and screen-reader workflows. Chromium emulation and DOM assertions do not establish those results. Accessibility includes semantic layer selection, numeric alternatives, localized action names, visible focus and keyboard commands; formal assistive-technology review remains open.

M3 remains deferred: text/Arabic IME and font resolution, production upload validation, IndexedDB/project recovery and persistence, calibrated print regions, artwork-only production DTF export, pricing and checkout. Larger projects may need a narrower renderer facade, per-object history patches and runtime asset-cache eviction. No commit, push, branch change, PR, merge or deployment was performed.
