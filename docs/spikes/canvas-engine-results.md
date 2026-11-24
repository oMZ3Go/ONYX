# Canvas engine comparison — Phase 03.2 M1

Executed 2026-11-21. **Recommend Konva/react-konva for M2, pending owner approval.** This is measured feasibility evidence, not full editor, accessibility, mobile or production-print acceptance. [ADR 0002](../architecture/decisions/0002-canvas-engine.md) records the recommendation and decision gates. [Integration design and M2 plan](../architecture/editor-integration.md) define how to use it without changing the Phase 03.1 shell.

## Reproduction and environment

- [Harness and commands](../../experiments/canvas-engine/README.md), with an independent pinned lockfile. Candidates were installed only in ignored `.cache/canvas-engine`. Root `package.json` and lockfile are unchanged.
- Next **16.4.6**, React/React DOM **19.3.1**, Node **24.22.0**, npm **11.19.1**, TypeScript **5.9.3**, Playwright **1.64.1**, headless Chromium **156.0.8078.4**.
- Windows 10.0.26300 x64, Intel Core i7-12700H, 20 logical processors, 16,870,006,784 bytes system RAM. This is a desktop development machine, not a baseline phone. Background local tooling was not isolated; treat timings as a feasibility baseline, not a controlled engine ranking.
- Desktop viewport 1280×1000, DPR 1; separate Chromium touch emulation at 800×1000/DPR 2. No actual Android, Apple device or embedded browser was available. Headless Chromium is not a claim about Edge/Safari compatibility.
- Synthetic 300×350 unit fixture, preview at 2 CSS px/unit; six Arabic/English text objects, one original transparent Crown image and rotated semitransparent rectangles. 10/100/300 total objects. One locked rectangle. The fixture is deliberately smaller than the full historical group/crop/persistence acceptance plan.
- Noto Sans Arabic and Inter package **5.3.0**, specific local WOFF2 files loaded before rendering. Exact asset and fixture hashes are in [raw measurements](evidence/canvas-engine/measurements.json). The [measured fixture source](evidence/canvas-engine/measured-fixtures.txt) preserves the pre-formatting source hash; current harness formatting changes no fixture semantics.
- One warm-up, then five 30-second update/frame runs at 100 objects. Five one-second runs at 10/300 objects are smoke measurements only. One warm export followed by ten measured independent artwork renders/PNG encodings per engine. All individual frame samples, runs, output dimensions and raster hashes are retained. Cold export is tested separately, because warming hid a real SVG fidelity failure.

The benchmark replaces one object's position, reprojects the scene, then waits for `requestAnimationFrame`. It measures **update-to-next-frame callback**, not OS pointer-to-presented-pixel latency or a GPU trace. It does not measure native dragging throughput for 30 seconds, shape caching under real assets, sustained resize, or realistic high-resolution raster memory. No engine receives a blanket SP-08 performance pass from these numbers.

## Versions, compatibility and licenses

| Candidate         | Exact packages                                         | License                      | Local compatibility evidence                                                                                                                               |
| ----------------- | ------------------------------------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Konva/react-konva | `konva@10.10.0`, `react-konva@19.3.2`                  | MIT / MIT                    | Declared React/DOM peers `^19.3.0`; production build, typed Stage/Text/Transformer probe, production and development Strict Mode browser verification pass |
| Fabric            | `fabric@7.4.0`                                         | MIT                          | Declared Node `>=20`; production build, typed Canvas/Textbox/dispose probe, production and development Strict Mode browser verification pass               |
| Custom SVG/DOM    | Browser SVG, Pointer Events, DOM textarea              | No additional engine package | Production build and browser interaction work; cold SVG-to-PNG text fidelity fails                                                                         |
| Fonts             | Fontsource Variable Noto Sans Arabic and Inter `5.3.0` | OFL-1.1                      | Exact existing font bytes and copied license notices; no remote font requests                                                                              |

The [npm advisory report](evidence/canvas-engine/audit.json) returned **0 known vulnerabilities** for the experimental lockfile at test time; this is not an ongoing security guarantee. Fabric's optional Node dependency installation emitted deprecation notices for `whatwg-encoding@3.1.1` and `prebuild-install@7.1.3`; no native build scripts ran and Node canvas backends were not evaluated. React binding/reconciler compatibility must be checked again on upgrades. Package selection was not based on stars/download counts. Per-engine engineering time was not tracked separately, so no development-speed or maintenance-effort number is claimed.

This separate experiment does not contain ONYX's entire dependency graph. The application's [unresolved Picomatch review](../phase-03/security-review.md) remains in effect and unchanged; the experiment's audit does not clear the application for deployment.

Installed supporting packages: Next/React/React DOM are MIT; TypeScript and Playwright are Apache-2.0. The binding resolves `react-reconciler@0.34.0`, `scheduler@0.28.0` and `its-fine@2.1.1`, all MIT. Full resolved versions/integrity hashes remain in the separate experimental lockfile.

Primary supporting references: [react-konva compatibility/integration](https://github.com/konvajs/react-konva), [Konva Transformer](https://konvajs.org/docs/react/Transformer.html), [Fabric API](https://www.fabricjs.com/api/), [SVG coordinates](https://www.w3.org/TR/SVG2/coords.html). Installed package metadata, local builds and browser results are the evidence for the versions actually used.

## Measured results

| Measurement                                   | Konva/react-konva |       Fabric |                         SVG/DOM |
| --------------------------------------------- | ----------------: | -----------: | ------------------------------: |
| Decoded route JS bodies, bytes                |           804,692 |      750,451 |                         470,555 |
| Navigation to ready, ms (one local sample)    |               417 |          379 |                             361 |
| 100-object pooled update/frame p95, ms        |              17.9 |         18.0 |                            17.9 |
| 100-object largest sample, ms                 |              21.0 |         27.2 |                            27.1 |
| Warm render + PNG encode median, ms (10 runs) |            129.65 |        98.65 |                           79.35 |
| Warm render + PNG encode maximum, ms          |             178.8 |        148.6 |                           125.1 |
| Output after exact-allocation correction      |         3544×4134 |    3544×4134 |                       3544×4134 |
| Warm repeat raster hashes                     |      10 identical | 10 identical |                    10 identical |
| First export identical to immediate repeat    |               Yes |          Yes | **No: first export omits text** |

JS bodies include shared Next/React and harness code; these are **not** compressed transfer bytes, tree-shaken engine-only sizes or storefront bundle deltas. Native HTTP/asset caching and font decode are not isolated in the single ready-time observation. Warm render/encode timing excludes later raster hash/readback and Base64 serialization; it is not complete download latency. SVG's fast warmed export is disqualified as fidelity evidence by its cold failure.

Five 100-object runs (p95/max in milliseconds; raw medians and samples in the JSON):

| Candidate | Run 1       | Run 2       | Run 3       | Run 4       | Run 5       |
| --------- | ----------- | ----------- | ----------- | ----------- | ----------- |
| Konva     | 17.9 / 18.9 | 17.9 / 20.4 | 17.9 / 20.2 | 17.9 / 20.6 | 17.9 / 21.0 |
| Fabric    | 17.8 / 25.0 | 17.8 / 27.2 | 17.9 / 21.3 | 18.0 / 18.8 | 18.0 / 18.9 |
| SVG       | 17.9 / 20.5 | 17.9 / 18.6 | 17.9 / 27.1 | 17.9 / 23.8 | 18.0 / 26.3 |

Exact recorded sample counts, rechecked against every raw array on 2026-11-22 (warm-up samples excluded):

| Candidate | 10 objects: five 1 s runs | 100 objects: five 30 s runs                            | 300 objects: five 1 s runs |
| --------- | ------------------------- | ------------------------------------------------------ | -------------------------- |
| Konva     | 61 each; **305 total**    | 1,801 each; **9,005 total**                            | 61 each; **305 total**     |
| Fabric    | 61 each; **305 total**    | 1,800 / 1,802 / 1,802 / 1,801 / 1,801; **9,006 total** | 61 each; **305 total**     |
| SVG       | 61 each; **305 total**    | 1,801 each; **9,005 total**                            | 61 each; **305 total**     |

That is 45 measured update/frame runs and **28,846 recorded samples**, plus 30 measured warm exports across all candidates. Each object-count condition has a separate 300 ms warm-up, and each candidate has one unmeasured warm export. The recorded timings are individual callback intervals, not independent repeated hardware trials. Median/p95/max for the shorter smoke runs (ms) are: Konva 10 objects **16.7/17.8/18.6**, 300 **16.6/18.0/19.2**; Fabric 10 **16.6/17.8/18.9**, 300 **16.7/17.9/21.2**; SVG 10 **16.7/17.7/18.3**, 300 **16.7/17.7/18.1**. Rounded values do not replace the retained raw arrays.

All three are frame limited on this fixture/machine. There is no useful performance winner. Fabric is smaller than the full React-Konva route here; SVG is smaller than either. Konva is recommended for integration/interaction ownership, not claimed speed or bundle superiority.

## Interaction, text and fidelity observations

**Pointer/controls.** All three moved the same rectangle by +20/+10 document units after +40/+20 CSS-pixel mouse and emulated-touch drags, with exactly one completion. Native Konva/Fabric handles resized/rotated and emitted one completion each. A +30/+30 CSS handle move produced approximately 35-unit width in Konva, 34.077 in Fabric and 35 in the SVG prototype. Handle padding/stroke/anchor policies differ; these are observations, not a claim of identical manipulation semantics. SVG retained its center while native bottom-right handles shifted it. M2 must implement canonical anchor/bounds rules instead of assuming raw engine scales equal the UX contract.

**Text.** The six source strings (`مرحبا أونيكس`, `لا`, `مُحَمَّد`, mixed Latin/Arabic, multiline and punctuation/digits) remain Unicode. [Konva screenshot](evidence/canvas-engine/konva-text.png), [Fabric screenshot](evidence/canvas-engine/fabric-text.png), and [SVG screenshot](evidence/canvas-engine/svg-text.png) place engine text beside a native DOM reference. Visual inspection shows joined Arabic, lam-alef and diacritics in these fixtures; line-height/baseline placement differs across engines. This is not native-speaker typography approval or cross-engine pixel parity. No automatic wrapping, justification, styled spans, rich-text or glyph-coverage certification is claimed.

The shared labelled DOM textarea was exercised for source replacement, explicit middle selection/replacement and Backspace, with canonical Unicode checked after editing. The numeric X control updates canonical geometry by keyboard. This validates the proposed DOM editing boundary; it does **not** evaluate Fabric's native caret engine against Konva. Real OS Arabic IME, clipboard permissions, phone keyboard, selection handles, composing undo and native Arabic review remain unavailable.

**Cold SVG failure.** Production and development verification independently observed different first/repeat raster hashes with no document or workspace change. Inspection showed the first export had no text; the immediate repeat included it. This is consistent with an embedded-font rasterization readiness problem, but the precise browser cause is not established. It is a **failed current strategy**, not evidence that all SVG exports are inherently broken. No arbitrary timeout was added to hide it. Later camera/RTL/selection changes preserved the warmed output; RTL was not the cause.

Preserved raster evidence: [cold SVG output](evidence/canvas-engine/svg-cold.png) and [warmed output](evidence/canvas-engine/svg-repeat.png). In the top 2,400 rows, which contain only text, nontransparent pixels increase from **0 to 144,857**. The warmed capture followed workspace changes; the separate verification JSON also records an immediate repeat before those changes, proving the difference already exists without a camera/RTL change.

**Isolated output.** Fresh artwork-only surfaces never receive a mockup/grid/background/control object. Konva and Fabric pass exact output-size and cold-repeat hash assertions; changing ambient background to magenta, applying CSS camera transforms, deselecting, setting document RTL and using DPR 2 leaves their output hashes identical. All measured outputs have transparent sampled corners. Pixel equality of repeated renders is stronger than the historical ≤0.5% repeat-diff tolerance for this fixture, but it does not prove source-reference fidelity, all alpha fringes, calibrated masks, group/crop support or print-readiness.

The [first-run evidence](evidence/canvas-engine/initial-measurements.json) preserves the 3543×4133 truncation from Konva/Fabric multiplier helpers. Both adapters now allocate ceiled output dimensions before rendering. M1 implements this only in the experiment, never in the customer Studio.

**Lifecycle/accessibility.** Five explicit remounts retained one Konva canvas, two Fabric canvases, or one SVG element. Production and Next development Strict Mode runs recorded no page/console errors. [Production verification](evidence/canvas-engine/verification-production.json) and [development verification](evidence/canvas-engine/verification-development.json) include semantic-control snapshots and each candidate's pass/fail status. Konva/Fabric pass those automated checks; SVG makes the experiment verifier exit 1 for cold fidelity. This is not a whole-session leak proof. The collected final Chromium heap/counter sample has no controlled warm/GC baseline, so retained-memory acceptance is **not measured**. Full screen-reader flow and focus restoration remain manual/integration checks.

## Requirement comparison and decision

| ONYX need                | Konva/react-konva                                                                         | Fabric                                                                                     | SVG/DOM                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| React shell integration  | Declarative projection worked with installed React; Transformer attaches via refs         | Imperative Canvas adapter worked; must reuse nodes, reconcile selection and await disposal | DOM projection straightforward; prototype currently rebuilds its SVG tree                                |
| Artwork manipulation     | Native drag/resize/rotate exercised                                                       | Native drag/resize/rotate exercised                                                        | Basic custom handles exercised; their resize anchor differs and professional controls remain custom work |
| Arabic/English           | Display fixtures + shared DOM input work; native review/IME open                          | Textbox display + shared DOM input work; native caret advantage unmeasured                 | Browser text display works; isolated cold rasterization drops text                                       |
| Accessibility            | Requires semantic DOM alternatives                                                        | Requires semantic DOM alternatives despite native canvas text editing                      | Semantic DOM easier to expose, but editing controls/announcements still needed                           |
| Touch                    | Emulated single drag works; shared camera arbitration still needed                        | Same                                                                                       | Same, with custom gesture controller                                                                     |
| Engine-independent model | Plain canonical fixture drives scene                                                      | Plain canonical fixture drives objects; no Fabric JSON saved                               | Plain canonical fixture drives SVG; no DOM serialized as project                                         |
| Export feasibility       | Corrected exact-size allocation; cold/warm and viewport independence pass bounded fixture | Same                                                                                       | Warm output works, cold text fidelity fails                                                              |
| Maintenance trade-off    | Extra React renderer/version coupling; relatively direct fit for existing ownership       | More imperative synchronization, with richer native editing primitives                     | Lowest package burden; largest unimplemented interaction/export responsibilities                         |

Recommend **Konva/react-konva for the bounded M2 implementation**. Keep Fabric as a credible alternative if future gates expose a material Konva problem. Do not adopt the current SVG rasterization strategy. No production installation or fully accepted engine decision occurs until owner review; no numerical rubric score is offered while hard gates are open.

## Historical gate coverage

| Gate                             | M1 evidence / remaining work                                                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SP-01 text (hard)                | **Partial:** fixtures and DOM editing measured; native Arabic reviewer, IME/mobile caret and all browsers unavailable                                                                                           |
| SP-02 editor operations          | **Partial:** single drag/resize/rotate, canonical lock rejection. Groups, full layers, multi-select and 50 undo/redo sequence deferred                                                                          |
| SP-03 coordinates/sides (hard)   | **Foundation tests pass:** independent side records and inverse mappings. Full live surface/camera integration belongs to M2                                                                                    |
| SP-04 portable round-trip (hard) | **Partial:** v1/v2 JSON validation/migration tests pass. ZIP transport, actual Blob digests/offline package and corrupt-package isolation deferred                                                              |
| SP-05 output (hard)              | **Partial Konva/Fabric; failed SVG cold text:** exact synthetic dimensions, transparency samples and isolated/hash stability. Calibrated masks, groups/crops, cross-reference fidelity and supplier review open |
| SP-06 resolution                 | **Deferred:** no production effective-PPI preflight introduced                                                                                                                                                  |
| SP-07 real touch/recovery (hard) | **Blocked by unavailable devices:** emulation does not pass this gate                                                                                                                                           |
| SP-08 performance                | **Partial:** five 30-second 100-object update/frame runs; shorter 10/300 smoke runs. Real pointer-to-paint/resize trace and baseline-device budget open                                                         |
| SP-09 export/memory              | **Partial:** ten warmed desktop synthetic outputs. Real mobile, busy/cancel flow and retained-memory baseline open                                                                                              |
| SP-10 two slots (hard)           | **Deferred:** architecture retained; persistence implementation unauthorized in M1                                                                                                                              |
| SP-11 React/Next/types           | **Bounded pass:** builds, typed APIs, dev Strict Mode and explicit remount counts. Full route/controller disposal after integration needs M2 regression coverage                                                |
| SP-12 accessibility (hard)       | **Partial:** labelled keyboard controls/ARIA snapshots. Full layer editing/focus flow and assistive-technology review open                                                                                      |

No hard gate is silently waived. The owner can approve M2 development with this evidence without declaring the later editor/persistence/production gates passed.

## Application validation

The new foundational tests cover structural validation, malformed input rejection, detached staging, Unicode/manifest round trips, exact empty-v1 migration, side independence, physical-reference requirements and coordinate inversion through zoom/pan/registration/front-back layout. The live Studio shell, CSS, camera implementation, catalog fixtures and localization are unchanged. The [milestone review](../phase-03/phase-03.2-milestone-1.md#validation) records the repository check and Phase 03.1 browser regression results after these additions.
