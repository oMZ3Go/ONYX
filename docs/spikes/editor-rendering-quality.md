# Milestone 2 artwork rendering and garment clipping

Chromium verification on 2026-11-24 used a 1440 × 1000 CSS-pixel viewport, Arabic and English, and emulated device pixel ratios (DPR) of 1 and 2. The test reads the Konva artwork canvas for resize comparisons and the composed browser screen for silhouette comparisons.

## What caused the visible loss of detail?

The recovered checkpoint reports that the camera enlarged a fixed canvas through CSS. At 200% zoom on a DPR 2 display, its 1236 × 618 backing bitmap covered 1236.6 × 618.3 CSS pixels. That supplied about one backing pixel per CSS pixel on a display capable of two. The earlier canvas also used the browser's `low` interpolation hint. The checkpoint contained the historical measurements and release-hash comparison but omitted the raw pre-fix captures.

A controlled Chromium comparison isolated these two variables using the same original PNG. At the same 200% visual size, enlarging a 182 × 184 backing bitmap and drawing directly to a 364 × 368 backing bitmap produced different values for 33,213 of 133,952 RGBA pixels. Compared with the original PNG at the same physical size, the fixed backing changed 29,692 alpha values. The zoom-aware backing matched all 133,952 original alpha values. Changing only the smoothing hint on a 91 × 92 downsample produced identical PNGs. On this browser, the demonstrated improvement comes from supplying the backing resolution the camera needs. [Measurements and reproduction command](evidence/editor-m2/controlled-canvas.json) · [Fixed backing](evidence/editor-m2/zoom-fixed.png) · [Zoom-aware backing](evidence/editor-m2/zoom-aware.png)

The current investigation found no separate loss caused by releasing a resize. The drag changed the rendered pixels and object dimensions. Release preserved both at each tested DPR and in each language. Fine, irregular contours also exist in the source crown. Its RGBA PNG is 364 × 368 pixels, with a 300 × 304 nontransparent bounding box, 103,157 fully transparent pixels and 30,795 partially transparent pixels. At very small display sizes, several source pixels share one display pixel. At very large sizes the source has finite detail.

## Source identity and rendering

The artwork layer decodes the catalog original by its manifest identity. For the crown, the original request was `/images/landing/design-studio/prints/print-crown.png`, 73,161 bytes, SHA-256 `f1b1fa26e3d72d36652db5d4cf4142a048080f6bafdd6eac4774f9d334445010`. Each locale/DPR case fetched the original once. A separate optimized WebP served the catalog UI. The other three supplied originals also matched their manifest hashes. Dragon measured 1122 × 1402, nature 1356 × 1160 and space 1443 × 1090. [Verified source assets](evidence/editor-m2/source-assets.json)

Each draw reads the decoded original, with high-quality smoothing enabled before the layer draw. The resize gesture scales width and height proportionally around its anchor. Release writes the same dimensions into the v2 transform. Node scale represents flips. No object-sized bitmap, destructive resize or image encoder participates in this path.

With the silhouette enabled, the artwork scene requests DPR × camera scale for its backing allocation. With the silhouette disabled, each side draws directly into a viewport-sized canvas in screen CSS pixels. The document origin follows that side through pan and zoom. This keeps off-garment detail visible without allocating a large canvas at 25% zoom. Both paths cap each scene bitmap at 4,194,304 pixels and 4096 pixels per edge. These caps apply to the artwork bitmap. Both view, image decoding and browser compositing need additional memory.

## Measured results

The masked surface covered 618.30 × 309.14 CSS pixels at Fit and 1236.59 × 618.28 at 200%. The table shows current backing dimensions and the first 12 hex digits of each artwork-canvas PNG hash. English and Arabic produced the same values.

| DPR | Fit bitmap | 200% bitmap | Before resize  | During resize  | After release  |
| --- | ---------- | ----------- | -------------- | -------------- | -------------- |
| 1   | 618 × 309  | 1236 × 618  | `e3229f7656d0` | `5526ce503c06` | `5526ce503c06` |
| 2   | 1236 × 618 | 2473 × 1236 | `ce9d49a661bc` | `3fad31a43a5a` | `3fad31a43a5a` |

The browser also compared pixels after undoing and redoing a resize, repeated shrink/enlarge cycles, remounting the same side, and returning from fullscreen. The reconstructed-project test separately serialized an edited v2 project, opened a fresh page with a new controller and decoder, and mounted the shipping artwork surface. The test verified the transferred original's file digest and dimensions, the canonical 162.5-unit width and 17° rotation, the canvas dimensions and partially transparent output. Before/after raw RGBA hashes matched at both DPRs. [Rendering measurements](evidence/editor-m2/rendering-measurements.json) · [Reconstruction measurements](evidence/editor-m2/reconstruction-measurements.json)

| DPR | Reconstruction bitmap | Raw RGBA SHA-256 before and after                                  |
| --- | --------------------- | ------------------------------------------------------------------ |
| 1   | 640 × 320             | `546f9de0461fef97276b8ee6a7ca7d01d7062fefc6ba6a7483cf0ca39c1b486e` |
| 2   | 1280 × 640            | `6070a3ac90b7d79adef90fd04b2fb80b459cb5b9d836fc5553b65ff6f2c82e92` |

## Silhouette verification

The original front and back garment PNGs are both 1774 × 887. The front has 864,186 fully transparent pixels and the back has 879,790. Sampled torso pixels have alpha 253. Each original supplies its side's CSS alpha mask at the garment image bounds, retaining the varying edge alpha around the hood, shoulders and sleeves. The mask applies to artwork presentation. Hit targets, transform handles, the floating toolbar and garment photography remain separate. The toggle defaults on and leaves document revision and undo depth intact.

The browser compared screenshots first at a transparent corner inside the PNG, then in a 108 × 54 CSS-pixel crop entirely above its upper edge after a zoom and pan. With clipping disabled, the outer crop contained 685 bright crown pixels at DPR 1 and 792 at DPR 2. With clipping enabled, both counts were zero in both languages. The composed screenshots capture the mask applied by the browser. [Clipping disabled, DPR 2](evidence/editor-m2/outside-garment-clip-off.png) · [Clipping enabled, DPR 2](evidence/editor-m2/outside-garment-clip-on.png)

In Both view, the unmasked artwork layers paint above the two garment images. This allows an object to extend across the other mockup while its document coordinates and ownership stay on the original side. The neighboring-mockup regression places a Front object over the center of the Back mockup and compares composed pixels with the toggle in each state.

## Reproducing the evidence

Run `npm.cmd run check` and then `npm.cmd run test:e2e -- e2e/design-studio-rendering.spec.ts e2e/design-studio-reconstruction.spec.ts`. Run `node scripts/artwork-manifest.mjs --check` to compare the checked-in catalog manifest against the supplied original files. The rendering suite writes raw frames and metrics under `.cache/phase-03/editor-quality/`. The Playwright report includes clipping crops and reconstruction measurements. Representative screenshots and the review measurements are in the [Milestone 2 evidence archive](evidence/editor-m2/).

Chromium emulation verifies pixel identity and backing resolution for these cases. Physical display appearance, real-phone memory pressure, Safari interpolation and assistive-technology use remain unverified. Extreme zoom can reach the allocation cap. This preview establishes neither printable geometry nor physical print quality.
