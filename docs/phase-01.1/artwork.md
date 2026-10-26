# Original ONYX brush artwork

## Dynamic category layout follow-up — 2026-10-26

The final Category Grid supports an ordered collection of published categories. Mobile keeps one column and desktop five; tablet uses two columns, with only the final odd published card spanning both at the paired-card height. This supersedes the earlier centered final card. Responsive `sizes` follows the rendered collection, requesting the full tablet width only for the spanning card. The 390px mobile and 1440px desktop image selection remains unchanged. All five source WebPs remain 700×700 and all original PNG hashes are preserved; wide/high-density rendering remains bounded by source resolution. See [current implementation and evidence](implementation.md#category-grid-final-responsive-layout).

The category measurements in the earlier audit below describe the pre-correction layout. Its responsive-selection finding is addressed; the latest production review and odd/even fixture screenshots are linked from the implementation report. High-DPR inspection and source-resolution limits remain separate considerations.

## Earlier image-quality audit — 2026-10-26, before the Category correction

This was an inspection only. No production image was regenerated, recompressed or enlarged. All original PNG hashes match the Phase 01 inventory. Six English production CSS viewports (320/390/768/820/1024/1440px) were sampled with reduced motion at DPR1; 390/1440 were also sampled at DPR2. The saved AR/EN production screenshots cover the visual/localization review. Exact per-image bounds, `sizes`, requested variants and fetched response dimensions are in `.cache/phase-01.1/final26/{audit,served-images}.json`.

| Image                 | Original PNG   | Optimized WebP                | Observed display size in CSS px                                       | Finding                                                                                                                                                                                                                                                                                                 |
| --------------------- | -------------- | ----------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero combined hoodies | 1536×1024      | 1536×1024, 183,880B           | 268×179 at 320; 620×414 at 768/820; 816×544 at 1440                   | At desktop DPR2, a requested 1920px variant contains only 1536 source pixels (about 1.88 pixels per CSS px). Original resolution is the limit.                                                                                                                                                          |
| Offer hoodie          | 1122×1402      | 800×1000, 98,380B             | 175×218 to 455×569                                                    | Desktop DPR2 requests 1080px but receives 800px (about 1.76 pixels per CSS px). Revisit the larger original only if high-density visual review warrants it.                                                                                                                                             |
| Story model           | 1536×1024      | 1400×933, 105,906B            | About 403×269 on mobile; 620×413 at 768; 561×374 at 820/1024/1440     | The 768px/DPR1 case chooses 384px for a roughly 620px-wide transformed image. `sizes` switches to 50vw before the artwork actually becomes that small. Fix responsive selection in the optional image pass.                                                                                             |
| Story background      | 1916×821       | 1600×686, 112,824B            | Image element 356×316 to 756×426                                      | `cover` and the overscanned parallax area need to be included in responsive quality evaluation, especially the tall tablet composition.                                                                                                                                                                 |
| Featured product      | 1254×1254      | 900×900, 74,510B              | Image element 286×238 to 452×475; `contain` fits the square inside it | DPR2 serves 750px on 390px viewport and 640px on desktop. Framing is complete. Check tablet/high-DPR variants in a future pass before increasing the source size.                                                                                                                                       |
| Five category images  | 1254×1254 each | 700×700 each; 26,578–117,400B | Normal cards 136×228 to 297×291; abstract mobile card up to 344×153   | `sizes` still uses 19vw on tablet despite the three-column layout. At 1024px/DPR1 it requests 256px for ~297px display. Abstract spans the mobile row but shares 46vw: at 390/DPR2 it gets 384px for 344px display, instead of roughly 688px. Portrait `cover` also increases effective sampling needs. |

Image-element bounds are not always painted-image bounds: `contain` letterboxes, `cover` crops by design, and transformed Story layers extend beyond the scene. `naturalWidth` with width-descriptor `srcset` is density-corrected; fetched response metadata was used to confirm actual raster dimensions. Measurements vary slightly with settling/transforms. These are concrete responsive-selection opportunities, not a claim that every image needs a larger file.

The Hero alpha>12 bounds remain x49…1508, y43…1023, with 287 opaque pixels on the final source row. Its lower crop is intrinsic. Corrected layout no longer adds the former negative-margin/tablet clipping; CSS cannot restore absent artwork. A fully uncropped replacement, if wanted, requires separate owner-approved art production. Preserve this original in the meantime.

No broken or severely degraded image was found in the reviewed captures. Dark fabric and gradients merit a future close comparison against PNGs: optimized WebPs use quality 84 (notes 90), and Next serves another quality-75 derivative, so some detail loss is plausible. This is not an assertion of a measured compression defect. Category `sizes` has since been corrected; prioritize accurate Story `sizes`, then compare high-DPR results and bytes before raising quality or resolution. Do not enlarge the Hero source to invent detail or replace it with generated hoodies.

## Brush production record

Created on 2026-10-21 with the built-in imagegen tool. No reference artwork was supplied. Official ONYX imagery was not changed. The generated PNGs remain in the image tool's original directory; only optimized transparent WebP assets are delivered.

| Asset                                             | Dimensions | Bytes  |
| ------------------------------------------------- | ---------- | ------ |
| `public/images/atmosphere/dry-brush-wide.webp`    | 1400 × 467 | 180046 |
| `public/images/atmosphere/dry-brush-gesture.webp` | 1100 × 629 | 92402  |

Sharp resize + WebP (quality 78, alpha quality 90, effort 6), with alpha preserved. Next Image serves responsive lazy derivatives. CSS desaturates the textures to remove colored fringes and blends them with ONYX surfaces. Absolute layers reserve no layout space and do not receive pointer events.

Used in Fan Favorites, Categories, How It Works and the footer, with distinct static scale, rotation and opacity. As of 2026-10-22, paint and all its parents have no continuous animation; environmental illumination has separate sibling layers. The original assets are unchanged. No background video or new runtime dependency.

## Scroll drawing (2026-10-22)

Each image has a local SVG luminance mask with seven overlapping curved bristles, small unequal start delays (0–70ms), and retained raster transparency. The wide curve follows the horizontal sweep rising right; the gesture follows the curved arc. Fan Favorites draws forward and Categories in reverse over 1100–1170ms. How It Works draws forward and footer in reverse over 1250–1320ms. Layout-specific placement remains intact in Arabic/English; the image itself is not mirrored automatically.

The existing reveal observer prepares offscreen artwork, runs once on entry, pauses offscreen/hidden and releases animations/mask at completion. Paint then remains fully static. Already-visible hydration content is not concealed. Reduced motion, manual pause and no JavaScript show the complete image. Decoration remains non-interactive and behind content. A completed-mask comparison differs by at most 1/255 per color channel from the unmasked image (`.cache/phase-01.1/refine-mask-review.json`), so removing the mask does not expose a missing patch.

## Wide brush prompt

Use case: stylized-concept. Asset type: original transparent decorative dry-brush texture for ONYX premium streetwear website. One wide, irregular horizontal sweep of real dry acrylic paint, gently rising toward its thin right end, with nuanced bristle striations, delicate broken pigment and feathered transparent edges. Cool muted steel blue #8AA9BA, slate blue and soft silver-grey, no other colors. Large negative transparent space around the isolated stroke. Art-directed fashion editorial texture, restrained and tactile, no heavy grunge, no neon, no text, no logos, no objects, no drop shadow, no rectangular backdrop. Wide landscape composition; keep entire mark inside frame. Actual transparent background.

## Gesture prompt

Use case: stylized-concept. Asset type: original transparent decorative brush texture for premium ONYX streetwear web campaign. One slender expressive diagonal dry-brush gesture, an incomplete sweeping curve with separated bristle tracks and sparse broken pigment at its tapering ends. Thin and airy with generous transparent negative space, no filled blob. Real dry acrylic pigment, tactile and refined fashion editorial style. Restrained muted steel blue #8AA9BA and soft slate grey only. Transparent edges and actual transparent background. Entire mark within frame, landscape composition. No text, logos, objects, neon, colored fringing, heavy grunge, shadows, rectangles or paper backdrop.
