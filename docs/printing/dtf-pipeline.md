# DTF production and export contract

**C:** Direct-to-Film, independent front/back, transparent artwork, physical scale, original assets, resolution checks and no mockup/editor UI in print output. **R:** millimetre canonical coordinates, RGBA PNG candidate output, 300 PPI test target. **U:** actual provider dimensions, format, profiles, RIP, white ink, fabric and transfer limitations. This is not a finalized production specification.

## Three distinct artifacts

| Artifact           | Purpose               | Includes                                                                      |
| ------------------ | --------------------- | ----------------------------------------------------------------------------- |
| Garment preview    | Customer review       | Garment artwork/shadows and composited design; clearly a simulation           |
| Editable project   | Recovery/reproduction | Canonical objects, original assets, fonts and print-spec revision             |
| Production artwork | Transfer printing     | Printable objects only, transparent background, one artifact per printed side |

Build the print renderer from canonical design data into a fresh offscreen surface. Do not export a screenshot or rely on hiding selected UI layers in a live garment canvas. Exclude hoodie/mockup/shadows, grid, guides, handles, boundaries and UI irrespective of editor visibility. Blank sides produce no charged print artifact according to the eventual pricing policy.

## Dimensions and transformations

For physical width `w_mm`, height `h_mm`, target `ppi`:

```text
width_px  = ceil(w_mm / 25.4 * ppi)
height_px = ceil(h_mm / 25.4 * ppi)
pixels_per_mm = ppi / 25.4
```

Synthetic example only: 300×350 mm at 300 PPI yields **3544×4134 px**. It is not an ONYX print-area size. A single RGBA buffer is 58,603,584 bytes (about 55.9 MiB), before decoded originals, temporary render buffers or encoding. This motivates explicit memory limits and mobile export experiments, not a premature server farm.

Viewport transform, devicePixelRatio and browser zoom must not change physical output. Define a per-side print area in mm, optionally a provider-defined polygon mask and safe inset. Print area is tied to actual variant and specification revision; changing garment/size may invalidate previous placement. Warn and require adjustment/acceptance of a deliberate fit operation; never silently scale/crop artwork to a different size.

Detect rotated/transformed object bounds against printable mask/safe area. Proposed rule: invalid out-of-region printable artwork blocks production validation until moved, resized, removed or explicitly clipped with visible review; grid boundaries never become output marks. Supplier margin/bleed and clipping rules remain unknown.

## Effective raster resolution

For an uncropped raster of original usable width `n_px` displayed at `w_mm`, `effective_ppi_x = n_px / (w_mm / 25.4)`. Repeat vertically; use the worse axis after effective crop and object/group transforms. Example: 600 px across 100 mm = **152.4 PPI**. Nonuniform scaling/cropping must be evaluated against the actual sampled pixels and placed physical extent; rotation does not create extra detail.

Flag low-quality source assets against configured warn/block thresholds, initially a 300 PPI working target only. A high output pixel count, DPI metadata, or upsampling does not improve source detail. Preserve original dimensions and adjustment history. Vector-like shapes/text render at target resolution, but rasterized effects/cached layers must also meet the target. Thresholds and allowed overrides require supplier agreement.

## Proposed pipeline

1. Validate schema, finite transforms, original assets/digests, variant print areas and font availability/licenses.
2. Freeze document/print-spec/font/render versions; compute physical bounds and resolution report for each side.
3. Load approved fonts deterministically and await readiness; missing fonts block faithful output instead of silently falling back. Keep editable text in source even if a production workflow later outlines glyphs.
4. Render each side at physical pixel dimensions on transparent RGBA, with clipping rules explicit; retain alpha without compositing over white/black. Check alpha fringes, semi-transparency, antialiasing and light artwork on a transparent background.
5. Inspect pixel size/alpha and compare to a calibrated reference; store artifact digest, dimensions, warnings and renderer/spec revision.
6. Operator reviews the exact artifact and supplier performs sample transfer. Production approval requires physical measurement, readability and wash/finish expectations agreed with the owner.

Do not invent CMYK conversion, ICC profile, mirroring, white underbase, choke/spread or gang-sheet settings. Browser sRGB preview cannot promise exact fabric/transfer color. If provider output requirements exceed proven browser capabilities, evaluate a server export adapter after P02 measurements. Delivering a PNG successfully is not proof it is ready for this supplier.

## Questions for the print provider

- Accepted format, maximum file/pixel sizes, actual target PPI and minimum effective raster quality?
- Printable dimensions and safe zones by style, hood configuration, fabric, garment size and side? Placement datum and tolerances?
- sRGB/other input profile, embedded ICC support, who handles color conversion and proof matching?
- White ink underbase, semi-transparent edges, alpha gradients, halftone behavior, minimum line/text size and anti-aliasing?
- Should files be mirrored, cropped to artwork or retain full print-area dimensions? Who builds gang sheets and adds margins?
- Font handling (live text/outlines/raster), filename/job reference, front/back association and accepted transfer handoff?
- Actual sample approval process, fabric/color compatibility, operator rejection/reprint rules and retention?

Record answers as a versioned production specification; attach approved samples before accepting FR-21. No production export is implemented in Phase 00.
