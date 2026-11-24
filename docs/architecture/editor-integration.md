# Phase 03.2 editor foundation

**M2 implementation update, 2026-11-23:** M1 was approved. The live implementation and deviations from the proposal below are documented in [the M2 report](../phase-03/phase-03.2-milestone-2.md). The canonical types, validation and migration remain authoritative. `EditorController` implements the command/transaction boundary; the client `SurfaceBoundary` passes its engine-independent editor facade to the surface. `surface-contract.ts` remains the more generic proposed intent/asset-resolver protocol for later adapters, not a second live state store.

The live pointer adapter uses `clientToPreview` against the measured image wrapper after CSS camera application. This is the affine equivalent of the matrix chain below and excludes captions/gaps. The contextual toolbar uses `documentToClient` with the full fitted scene geometry. Neither path mirrors RTL coordinates or writes camera/DPR into transforms. Canvas listening is disabled; DOM handles and the viewport coordinator own all gestures. Explicit gesture tokens reject late samples/completions.

M2 preview rendering uses decoded original images, no node bitmap caches, high-quality smoothing before every layer draw, and per-layer backing resolution based on DPR × zoom, bounded at 4 Mi pixels/4096 per edge. `clipGarment` is session presentation state, default on. The actual front/back PNG alpha masks only `.ds-artwork-render`; handles and the floating toolbar are independent. This silhouette is **not** a calibrated printing region. The artwork canvas and original asset bytes remain unmasked and unchanged.

Milestone 1, 2026-11-21. **Review proposal; no editing UI enabled.** The renderer recommendation is [ADR 0002](decisions/0002-canvas-engine.md); measurements and limitations are in the [experiment report](../spikes/canvas-engine-results.md).

## Existing application boundaries

The locale route remains a Server Component: dictionary, cookie theme and `studioCatalog.getCatalog()` feed `StudioShell`. The separate landing catalog's `getFeatured()` projection is not a Studio inventory or price API. Studio selectors already filter active products, available preview variants with both mockups, and compatible artwork. Inspecting a library item does not place it.

`StudioShell` owns panels, five dock positions, Pin, theme, focus mode and camera. `Workspace` computes `fitViewport`, owns the viewport element, grid and camera controls. `GarmentScene` lays out front/back figures and crossfades an inert outgoing group. `GarmentImage` owns preview/original loading. All those components, styles, dictionaries and existing interactions are unchanged in M1.

M2 should introduce a controller at the shell boundary and an `EditorSurface` within each **current** garment figure's image rectangle. Keep image, ambient light and caption as existing DOM. Position the transparent artwork surface over the image and beneath workspace controls. Do not change figure flex dimensions or let a canvas intrinsic size affect layout. Give artwork geometry explicit LTR coordinates, irrespective of the shell's language. During the existing crossfade, the outgoing surface is a read-only projection with no controls/listeners; it must not create a second editing controller.

Load the selected surface from a Client Component using `next/dynamic` and `ssr: false`. This follows the installed Next 16.4.6 `01-app/02-guides/lazy-loading.md` and server/client guide. The server catalog read, landing routes and shell must not import a canvas package. A loading/error boundary retains the garment and shell; loading an engine is not a document edit.

## Canonical model and migration

Executable types: [`editor/document.ts`](../../src/modules/design-studio/editor/document.ts). Runtime boundary: [`validation.ts`](../../src/modules/design-studio/editor/validation.ts). Migration: [`migration.ts`](../../src/modules/design-studio/editor/migration.ts). M1 leaves the live v1 shell in place; M2 initializes the controller through this migration.

| Record        | Contract                                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Project v2    | Stable ID; monotonic revision; UTC ISO creation/update times; catalog revision; garment product/variant and nullable size; separate front/back; manifests; nullable production specification reference       |
| Side          | Versioned coordinate-space reference; `objectsById`; exact back-to-front `layerOrder`. Every object occurs once, with globally unique object IDs                                                             |
| Common object | Plain text name, visibility, lock, opacity 0–1, center/dimensions/rotation/flips. No renderer node, camera, selection or URL                                                                                 |
| Artwork       | Catalog artwork ID/revision, asset ID and rights snapshot. Snapshot is provenance, never current commercial authorization                                                                                    |
| Image         | Asset ID and crop rectangle in original source pixels, before flips/rotation. Reserved for a later milestone; no ingestion UI                                                                                |
| Text          | Original Unicode, font ID/version through manifest, size in side units, weight/style, line-height multiplier, language/direction, explicit left/center/right alignment and hex RGB fill. Opacity is separate |
| Asset         | SHA-256, MIME, byte count, source dimensions, catalog ID/revision or local content identity. Original bytes live outside document/history                                                                    |
| Font          | Asset ID, family, version, license and redistribution permission. Do not silently substitute unavailable fonts                                                                                               |

Current mockups lack physical calibration. Therefore v2 distinguishes `preview-px` (original mockup reference pixels, top-left origin) from `mm` (approved design space and calibration reference). Migration reads the catalog's original dimensions: the current 1774×887 reference image is a preview coordinate frame, **not a printable area**. The front and back have different reference identities. Preview space does not imply every pixel on the garment image is printable. No nominal chest area or supplier dimensions are invented.

An approved physical registration later supplies document-to-mockup mapping. Converting existing preview artwork to millimetres is an explicit, reviewed geometry command with calibration/production revisions; never reinterpret the same numbers as millimetres. The `mm` type requires calibration and production references, but the parser cannot prove a supplier approved those records. That is the future resolver/preflight's responsibility. Synthetic test references are not provider approval.

Transforms use positive width/height, finite centers, clockwise `rotationDeg` in `[-180,180)`, and explicit local flips. For images, crop the original first, fit it into the canonical box, flip in local axes, rotate around the center, then translate. Normalize transient engine scales into dimensions once at commit; reset node scales. Text resizes need a separate decision in M3: fixed-width wrapping versus font-size scaling; do not accidentally persist a renderer's measured glyph box as the text layout model. v2 defines fixed text boxes and line-height; the M3 adapter must specify clipping, baselines and overflow against approved font fixtures.

Shapes/groups are intentionally unsupported in v2 M1. Unknown kinds/fields are rejected, not flattened or discarded. Adding groups requires a schema migration defining local transforms, ordered children and cycle/depth limits. Future additive fields also require an explicit supported schema revision; this strict parser never silently drops data it does not understand.

Migration rules:

1. Stage an untrusted input separately from active work. Accept v2 only after structural/reference validation; clone the result.
2. Accept v1 only if it exactly matches the empty Phase 03.1 shell, both element arrays are empty, the catalog revision matches, and product/variant resolve through available-variant selectors. Preserve IDs; create independent empty sides, manifests and revision zero using caller-supplied stable identity/time.
3. Reject unknown versions, stale/unresolved v1 references or unexpected legacy objects with a recovery path. Never drop legacy content to make migration succeed. No existing stored projects are rewritten in M1.
4. Future load: verify byte budgets, file signatures, hashes, asset availability and font license/version into staging before swapping state. The M1 parser checks structure, digest syntax and referential consistency; it does not fetch bytes or validate ZIPs, actual digests, stock, commercial rights or production approval.

Defensive parsing caps are 1,000 objects per side, 1,000 assets, 100 fonts, 10,000 UTF-16 units per text and bounded finite geometry. They are provisional input guards, **not** proven rendering, upload or print budgets. No URLs are accepted in asset source records. Reject duplicate IDs, invalid layer orders, crop overflow and inconsistent manifest references. A future file decoder also needs compressed/expanded byte and pixel budgets before parsing/decoding.

The existing two-slot IndexedDB proposal remains unchanged. A save atomically writes a validated revision with referenced original Blobs; renderer JSON is never saved. Undo changes geometry but must still advance the live monotonic revision. Saved revision and history cursor are independent. Autosave, portable packages, eviction consent and cross-tab control belong to M5.

## Coordinate system

[`coordinates.ts`](../../src/modules/design-studio/editor/coordinates.ts) implements column-vector affine math. There is no locale or DPR argument. Origin is top-left; positive x is physically right and positive y down on **both** sides. Viewing the back does not mirror its artwork.

With client pointer `p`, registration `R`, mockup display scale `s`, per-image scene offset `o`, fitted scene dimensions `W,H`, viewport client origin `v`, viewport center `c`, camera CSS-pixel pan `t` and camera zoom percentage `z`:

```text
M = T(v + c + t) · S(z / 100) · T(-W/2, -H/2) · T(o) · S(s) · R
clientPoint = M · documentPoint
documentPoint = inverse(M) · clientPoint
objectMatrix = T(center) · Rclockwise(angle) · S(width * flipSignX, height * flipSignY)
```

Object-local coordinates span `[-0.5,0.5]` in each axis. Matrix helpers reject nonfinite and singular mappings. Preserve floating precision; rounding belongs to displayed inputs, not repeated conversions.

`R` is identity for preview pixels. A future calibrated mm document supplies approved mm-to-original-mockup registration; do not derive it from PNG dimensions. `s` equals fitted image height divided by original source height. Scene width/height include the existing captions and 20 px gap. For horizontal Both, front offset is `(0,0)` and back is `(frontImageWidth+20,0)`. For stacked focus mode, back is `(0,frontImageHeight+captionHeight+20)`. Unequal image widths must follow actual flex/stack alignment; use measured layout metadata, not guessed center offsets.

The existing `.ds-zoom-content` applies camera translation/scale **once** to garment and artwork together. The surface renders only registration and mockup scale in its local image coordinates; do not also apply camera zoom to its stage nodes. `M` is for pointer conversion and external overlays, not a second visible camera transform. DPR changes backing-store quality only. Caption toggles, panel resizing, Fit and orientation recompute mapping without editing objects. Cancel an active transform before its geometry basis changes. Both mode renders independent documents, while exactly one explicit `activeSide` owns selection/editing.

## Controller, gestures and history

The planned typed intent/props boundary is [`surface-contract.ts`](../../src/modules/design-studio/editor/surface-contract.ts). It contains no engine types. An asset resolver produces disposable Blobs from manifest identities with abort support. Runtime image/font caches and object URLs are outside project data and released on disposal.

Data flow: catalog/asset resolver → validated canonical project → controller → surface projection. The surface proposes selection and transform intents; it never calls persistence, mutates catalog entries or owns the saved document. Numeric inspector and keyboard commands use the same controller as pointer gestures.

| Action                                      | Canonical/history behavior                                                                                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inspect, select/deselect, active side, tool | Workspace state only. Selection never causes a document revision or dirty save                                                                                                                                       |
| Place                                       | Validate catalog compatibility and resolved asset identity; one command on one explicit side                                                                                                                         |
| Drag/resize/rotate begin                    | Capture gesture ID, side, target IDs, base revision, immutable before transforms and mapping. Reject locked/missing/hidden targets                                                                                   |
| Movement                                    | Update bounded transient transforms at most once per animation frame. Committed project/history stays unchanged                                                                                                      |
| Pointerup                                   | Validate complete proposed transforms, revision, locks, target existence and preview policy. Normalize scales/angle; commit one atomic before/after command only if geometry changed                                 |
| Cancel                                      | Escape, pointercancel, lost capture, second finger/pinch, blur, hidden document, side/variant change, mapping change or unmount discard transient state and re-project canonical geometry. No revision/history entry |
| Resize/rotate selection                     | One transaction containing each affected object; no cross-side selection. M2 uses uniform group scale and rotation to avoid shear that v2 cannot represent                                                           |
| Undo/redo                                   | Apply validated inverse/forward patches on the recorded side, advance revision, update dirty status. New edit after Undo clears redo. Missing assets/invalid patches fail atomically                                 |
| Keyboard nudge                              | Physical arrows remain left/right/up/down in RTL. Use 1 preview px or 0.1 mm according to space; Shift ×10. Coalesce key-repeat until keyup into one command                                                         |
| Text                                        | M3 coalesces deliberate edits around focus/composition boundaries; no global shortcuts during input, contenteditable or IME composition                                                                              |

Start with a provisional 100-command / 8 MiB serialized-patch cap, evict oldest completed entries first, and measure real sessions before product acceptance. These are configurable application defaults, not browser guarantees. Store metadata patches and asset IDs only, never image bytes, canvas snapshots or the renderer's object graph. No-op/rejected/cancelled commands retain the redo branch. A transaction cannot span a garment/side change or asynchronous asset replacement.

Before pointerup commits, flush the final pointer sample and cancel its scheduled animation frame. Cancellation also removes pending frames. Ignore callbacks whose gesture ID is no longer active, so late movement or lost-capture notifications cannot resurrect a cancelled gesture or revert a completed command.

Pointer ownership must be explicit before mounting an interactive surface. Today `useCameraNavigation` captures all touch pointers on `.ds-viewport`; adding a second independent drag listener would conflict. M2 introduces a shared coordinator at that boundary:

1. Hand mode or temporary Space: camera owns one-pointer pan. Existing wheel zoom/anchor behavior stays intact.
2. Select mode: unlocked artwork/handle owns one-pointer manipulation; empty-space click clears selection. Empty-space one-finger movement does not pan, preserving current Select-mode behavior. Marquee/multi-select is an explicit mode, not implicit touch panning.
3. On second touch, cancel artwork transaction **before** handing both pointers to camera pinch. A surviving finger cannot resume the old object drag; wait for all pointers to lift before the next gesture.
4. Panel body scrolling, panel drag/resize handles and artwork have separate owners. Capture only on the viewport/surface gesture owner, never page-wide. Flush pointerup before releasing capture so normal lost-capture cannot undo an already completed command.

Canvas is not the accessible control tree. Keep semantic layer buttons, labelled numeric transforms, visible focus, localized selected-object/live announcements, and focus return. Native input/textarea owns caret, selection, clipboard and composition. M1's harness only checks DOM keyboard editing/numeric input; it does not certify a full accessible Studio workflow or screen-reader output.

## M2 implementation sequence and acceptance

After owner approval of M1:

1. Add only the approved Konva/react-konva versions to production. Retain the separate locked comparison harness. Add a client loading/error boundary and controller initialized from the tested migration.
2. Resolve current catalog artwork originals into revisioned manifest identities/digests. No upload UI, invented prices or commercial approval. Keep library inspection distinct from an explicit Place action.
3. Mount one surface per current image using measured registration metadata; maintain crossfade, all docks/Pin, caption rules and camera. Add the pointer coordinator before enabling drag.
4. Implement single selection, place, drag, aspect-preserving resize and rotate, with DOM numeric alternatives. Use the same command transaction for pointer and keyboard operations; handle cancel/blur/pinch/side switch before adding multi-selection.
5. Add uniform multi-selection transforms and center/edge alignment on one explicit side. Fit/side changes never silently change geometry; locked nodes remain immutable. Preview bounds are not print-area validation.
6. Enable the existing Undo/Redo buttons for implemented commands; keep complete layer/text workflows for later milestones. Test branch invalidation, no-op commits and monotonic revisions.
7. Run all M1 unit tests and Phase 03.1 production browser regressions, then add end-to-end placement/manipulation/cancellation tests in Arabic and English, horizontal/stacked Both, all docks, reduced motion and zoom extremes. Assert one history entry per gesture, no geometry change under camera operations and no cross-side mutations.
8. Before accepting touch/text accessibility for release, complete real Android and Apple-device tests, embedded-browser recovery, Arabic reviewer/IME and assistive-technology review. Report each separately; desktop emulation cannot close those gates.

M2 ends at artwork placement/manipulation with history support. Text/uploads, persistence, pricing/checkout and production exports remain later milestones. No commit, push, merge or deployment was performed for M1.
