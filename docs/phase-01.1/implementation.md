# Phase 01.1 — final implementation and verification

**Dynamic Category Grid completed and verified — 26 October 2026.** Workspace `D:\ONYX`, branch `feat/landing-motion-refinement`, HEAD `84ddf57aaa3b96e46a81281fceb21974dd9584f9`. Final test build: `RhTEEj7Sl7VsE5on2Q47v`. No staging, commit, push, PR, merge or deployment was performed. The branch is ready for owner approval.

## Dynamic category data and rendering

`src/modules/landing/categories.ts` defines an ordered, locale-resolved `LandingCategory` collection: stable `id`, `slug`, `title`, `description`, `image` (source and dimensions), and required `published` boolean. The initial adapter derives the five existing entries from their unchanged artwork and dictionary; all five explicitly have `published: true`. Their order and localized links remain unchanged.

The page supplies this collection to `CategoryGrid`. The component filters unpublished records **before mapping**, preserves input order and uses `category.id` as the React key and DOM identity. Unpublished records leave no hidden grid children. Array position controls only reveal staggering and responsive image selection, never identity. The grid accepts arbitrary identifiers, localized text, artwork and route slugs; no category-specific CSS or assumption of five items remains. Seven input records with two unpublished produce exactly five public cards.

A future provider can supply the same ordered, localized display data without changing layout CSS. Database access, publication workflows, remote-image policy and route provisioning for future slugs belong to that later integration. Existing five preview routes/404 behavior remain unchanged; no Dashboard, API, database, Supabase, customer-data mock switch or public test route was added.

## Category Grid: final responsive layout

This owner-requested adjustment supersedes the earlier centered-last-card tablet design.

| Viewport                      | Behavior                                                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Below 600px                   | Approved single column, original 16px gap, full container width and 220–300px card heights; no special last-card styling           |
| 600–1099px, even public count | Two equal columns and complete pairs; the final card stays at normal width                                                         |
| 600–1099px, odd public count  | Only `.category-grid > .category-card:last-child:nth-child(odd)` spans both columns, including a single-card collection            |
| 1100px+                       | Existing five-column proportions; extra cards create ordinary rows in input order, with no arbitrary stretching of incomplete rows |

Tablet `container-type: inline-size` makes each card's height depend on the paired-card width: `clamp(230px, calc((100cqw - 16px) / 2.5), 340px)`. Thus spanning does not double height. At 768px paired cards are 344×275.19px and the final odd card is 704×275.19px; at 1024px they are 456×340px and 928×340px. Mobile/desktop CSS was not changed. Current 390/1440px geometry matches the prior approved production measurements within 1px in both locales.

The existing centered `object-fit: cover`, overlays, radii, lower copy and logical arrow positioning remain. Server-rendered image `sizes` selects full tablet width only for the actual final odd published entry; there is no client-side layout/counting JavaScript. The 700×700 category WebPs and all 16 original PNG hashes are unchanged. A wide card may be wider than the raster source; no new pixels or asset upscaling pipeline was introduced. Hover, reveals, brush, orbital dots, local pointer dots, pause and reduced motion are preserved.

## Current verification and evidence

| Check                                      | Result                                                                                     | Evidence                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run check`                        | PASS: format, lint, types, **30/30 unit tests**, production build and **14 pages**         | [check.log](../../.cache/phase-01.1/dynamic26/check.log)                                                                                 |
| Focused category/layout/motion/route tests | **24/24**, 2.4m                                                                            | [focused-final.log](../../.cache/phase-01.1/dynamic26/focused-final.log)                                                                 |
| `npm.cmd run test:e2e`                     | **82/82**, 6.0m, one complete production run                                               | [e2e.log](../../.cache/phase-01.1/dynamic26/e2e.log)                                                                                     |
| Native-motion visual review                | **16/16** current-page cases in both locales, plus six odd/even/single fixture screenshots | [gallery](../../.cache/phase-01.1/dynamic26/gallery.html), [focused report](../../.cache/phase-01.1/dynamic26/focused-report/index.html) |
| Mobile/desktop preservation                | **4/4** 390/1440px locale comparisons, geometry unchanged within 1px                       | [comparison](../../.cache/phase-01.1/dynamic26/mobile-desktop-comparison.json)                                                           |

The focused command selected `category-grid.spec.ts`, `final-composition.spec.ts` and category-route tests in `refinements.spec.ts` using the existing project runner. Fixtures cover **1, 2, 3, 4, 5, 6, 7, 8 and 10 published cards × 390, 600, 768, 820, 1024, 1099, 1100 and 1440px × both locales = 144 combinations**. Each input includes two unpublished records, including the last stored record. Checks cover order/identity/content/links, odd/even span, equal height (including one item), row wrapping, RTL/LTR, cover, arrows/text, decoded images, unchanged document positions/sizes after loading, overflow and browser errors. Two additional current-page tests retain the 15-width matrix, including 599/600 and 1099/1100.

The initial focused run was 13/16: three Arabic fixture cases failed their <0.001 accumulated layout-shift assertion. A captured trace showed text-bound changes while the isolated component loaded Arabic typography above the fold. The fixture harness now retains the real production page shell, styles and font-loading context, replacing only the Category section with server markup rendered by the actual component. Scripts are omitted to prevent React from hydrating test data with the real collection. The same shift threshold is retained; image-load geometry checks were strengthened. No production style, tolerance, retry or timeout was relaxed. Initial logs/diagnostic trace are preserved in `dynamic26/initial-report`, `diagnostic-report` and `shift-diagnosis.json`.

All final native-page samples recorded zero shifts, overflow or browser errors; fixture shifts remain below the unchanged 0.001 bound. Visuals use completed native reveals and the actual production build. The prior server command was blocked because automatic approval review could not run after a usage limit; this was environmental, not an application failure. Supported project scripts and Playwright webServer worked on resumption, on the standard port 3000. No environmental blocker remains. The prior **66/66 and 198/198** results in `grid26` are historical; the triple suite was not rerun for this focused change.

## Preserved Offer and menu corrections

Offer rotation is **5700ms** via `--motion-offer-gradient`; product edges remain **3900ms**. The shared native angle stays synchronized across edge/halo/spill, with linear infinite timing and unchanged animation identity through hover. The palette uses muted blue-gray stops. Halo width/blur remain 18/12px, inset is −6px and opacity .86→1; inner inset is −12%, blur 16px, radial clear center 54%, opacity .14→.17. Hover transitions remain 450ms.

Menu rows share a logical 3px leading border, 10px leading padding and 14px icon/text gap, including hover/focus/current states. Measured visible indicator-to-icon separation is approximately **10.9–12.4px**, all six rows **48px**, with matching icon/text alignment in RTL/LTR. Scrolling, Escape and focus restoration pass.

Prior production polish evidence remains valid for these unchanged rules: four Offer recordings (both locales at 390/1440), each showing more than one native 5.7s cycle; eight menu cases at 320/390/768/844×320, including landscape scroll; hover exit, pause and reduced-motion checks; zero browser errors. See [polish gallery](../../.cache/phase-01.1/polish26/review.html) and [measurements](../../.cache/phase-01.1/polish26/review.json). The final complete E2E suite rechecks their behavior after the dynamic Category correction.

## Historical focused performance — before the dynamic category adjustment

The measurements below describe the earlier centered-card build, not the final wide-card tablet composition. This continuation verified loading/geometry/motion controls without rerunning that benchmark.

Category baseline/after samples use production on port 3000, fresh Chromium 156.0.8078.4 contexts, English 390/768/1440×900, DPR1, no throttling, six seconds per normal/paused state after settling. No concurrent E2E or recording. CDP task duration is main-thread CPU time per wall-clock second, with neighbors/probe overhead included; RAF cadence is not GPU frame presentation or field performance. One observation per state does not establish a causal percentage improvement.

| Width | State  | Before task ms/s | After task ms/s |
| ----- | ------ | ---------------- | --------------- |
| 390   | normal | 44.70            | 29.65           |
| 390   | paused | 21.48            | 13.27           |
| 768   | normal | 34.41            | 22.93           |
| 768   | paused | 19.47            | 11.17           |
| 1440  | normal | 38.42            | 30.03           |
| 1440  | paused | 17.64            | 13.95           |

All six final samples had zero measured layout work, no layout-shift entries, zero RAF intervals above 25ms, maximum interval 16.8ms, no overflow/errors and all category images loaded. Three existing orbits and four pointer dots remain; the patch adds no motion runtime. The 26-case visual matrix also recorded zero shifts in both locales. No regression requiring a broader benchmark was observed.

For the five category images combined at DPR1, encoded image bytes changed **44,484→79,386** at 390 and 768px because the displayed cards are larger and now select 384px variants; desktop 1440px changed **79,386→44,484**, selecting 256px variants for ~238px cards. This is an intentional resolution/transfer tradeoff, not unchanged transfer. No broken/duplicate category source was observed; original 700×700 WebPs and lazy-loading remain. [Before](../../.cache/phase-01.1/grid26/perf-before.json), [after](../../.cache/phase-01.1/grid26/perf-after.json).

The preceding Offer polish separately sampled normal/hover/paused/reduced at 390/1440. Normal task time was 68.79→58.25ms/s mobile and 120.87→63.85ms/s desktop; CPU Paint trace time was 12.71→10.87 and 28.57→11.99ms/s. Hover task time was 57.31→49.72 and 84.86→54.98ms/s. Paused/reduced samples ranged 15.48–17.58ms/s after polish with zero Paint events, and all final RAF maxima were ≤16.8ms. Paint trace duration is CPU evidence, not GPU raster cost; small idle differences are sample noise rather than claimed regressions. [Offer performance](../../.cache/phase-01.1/polish26/perf-after.json). Twenty locale switches retained 869 DOM nodes, 484–491 listeners and one dot root; heap grew 4,644,460→5,825,692B from cycles 1→20. This is bounded cleanup evidence, not proof of absence of long-term retention.

## Final implementation

| Area                  | Final behavior                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typography/navigation | Local Alexandria/Space Grotesk display fonts with OFL licenses; existing body fonts, bilingual semantics, dark sticky header, measured active underline, localized hash/category navigation and official-logo hover/focus reveal.                                                                                                                               |
| Hero composition      | One original combined hoodie asset. Below 1024px, normal stacked flow, reserved note/motion space and centered artwork up to 640px. Desktop keeps its established composition and lower paper ledge. Updated responsive `sizes`; no invented image pixels.                                                                                                      |
| Hero movement         | Independent entrance → float → magnet → hover wrappers. Float travel 8px stacked / 16px desktop, 7s round trip. Mouse movement over all of `#home` drives X ±10px / Y ±8px magnetic offsets with 125ms damping and a 48px edge falloff. Geometry is cached until scroll/resize/exit. Touch/coarse pointers remain static for garment float/magnet.              |
| Headline              | Single accessible H1; decorative drag echoes derive from velocity without blurring the primary glyphs. Completed-headline idle is exactly **15,000 active milliseconds** in deterministic tests; hidden/offscreen/manual pauses suspend active time.                                                                                                            |
| Offer                 | Partial conic gradient, thin rounded border, connected outer halo and broad inner spill with radial center mask, following the saved Hover.dev reference. Shared inherited angle, 5700ms linear native loop (product edges 3900ms), 450ms hover opacity transitions without replacing/restarting the animation.                                                 |
| Products              | Four presentation slots for one real fixture. Image, category/Preview badge, name, colors, sizes, price and CTA have separate readable regions. Optional `ProductDisplay.sizes` joins existing category/colors/price fields; minor-unit/scale currency formatting is retained. Missing data uses explicit AR/EN coming-soon labels. No invented catalog facts.  |
| Product motion        | One native transform animation per eligible ambient surface, 10s per alternate leg, independent of image hover and the hover/focus perimeter light. Four/two/one-column layout and zero grid-item minimums prevent narrow-layout clipping. CTA height ≥44px.                                                                                                    |
| Categories            | Three 4px orbit dots on 120/90/150px paths over 22/28/34s; four separate section-scoped pointer followers. No global pointer trail. Title spans the lower content grid; description and arrow share its bottom row. Five/two/one columns; only the last odd published tablet card spans both columns at the paired-card height; logical arrows work in RTL/LTR. |
| Story                 | Independent city/model/note composition and bounded scroll parallax; original images preserved.                                                                                                                                                                                                                                                                 |
| Brush artwork         | Two transparent WebPs in four sections. Seven staggered curved SVG-mask bristles draw once (wide 1100–1170ms; gesture 1250–1320ms). Completed animations/mask are released. Brushes and parents remain static; ambient light lives on separate siblings.                                                                                                        |
| Footer                | Restrained localized radial fields, ±9%/±3% translation and ±4° rotation, 20s round trip. Confirmed email `beyond.thelimit.team@gmail.com`; four social destinations remain null with honest unavailable labels.                                                                                                                                                |
| Mobile navigation     | Native details/summary fallback; five brush strokes reveal/erase with staggered labels and interruption recovery. Native scrolling remains available with the intrusive scrollbar hidden. Keyboard, Escape, outside click and focus restoration remain covered.                                                                                                 |
| Category previews     | Existing localized preview routes are preserved, including valid category content, return links and unknown-category 404. No editor, checkout, upload, storage or ordering implementation.                                                                                                                                                                      |

The final Offer values and current evidence are listed above; the remaining phase implementation is preserved.

## Lifecycle, fallback and accessibility

`browser-scheduler.ts` wraps native methods with their Window/Performance receivers, preserving the `Illegal invocation` fix. Headline/process timelines receive this safe adapter. `PageMotion` shares visibility observation and manual/reduced-motion listeners; eligible infinite animations pause offscreen/hidden/manual and cancel for reduced motion. Pointer controllers cancel pending RAF and clear transient offsets when ineligible. Locale disposal disconnects observers, cancels animations/timers and removes listeners/temporary dot roots.

Reveals prepare only offscreen content before entry. Already-visible content is never hidden during hydration; keyboard focus reveals targets immediately. The fitted brush image is the observed target. Once complete, brush drawing never becomes a continuous animation. Manual pause/reduced motion finish prepared brush content immediately; server/no-JS output stays readable.

Existing test coverage includes ARIA/headings, one H1, `lang/dir`, visible focus, non-intercepting decorations, no-JS navigation/content, mobile menu keyboard/outside-click/Escape and simulated page visibility. A human screen-reader audit and real OS tab switching were not performed. `refinements.css` stays organized by section, interaction, breakpoints and preferences; durations/easing are centralized in `tokens.css`. No motion dependency was introduced.

## Historical production benchmark — October 25, before final polish

The four saved files `final25/performance{,-reduced,-throttled,-reduced-throttled}.json` each contain AR/EN at 390×900 and 1440×900, DPR1, fresh Chromium contexts. `measure.ps1` ran capture, then each measurement, then effect/cleanup and brush probes sequentially. No competing browser/video workload was scheduled during measurement. The local image optimizer cache was already populated; this is not a cold-server benchmark.

Initial observation: `networkidle` then 11 seconds, followed by seven 1.5s RAF samples (Hero/process/offer/story/products/categories/footer). CPU/network emulation: **4× CPU, 100ms latency, 500,000B/s download (4Mbps), 125,000B/s upload (1Mbps)**. One sample per locale/viewport/mode. Browser/host recovered on October 26: Chromium **156.0.8078.4**, Playwright 1.64.1, Node **24.22.0**, Windows x64 10.0.26300, i7-12700H, 20 logical CPUs, 15.71GiB RAM. Prior JSON did not independently stamp these host/version details.

| Mode               | FCP ms  | LCP ms   | Maximum observed shift sum | Initial long tasks per case | Observed completed page transfer KiB |
| ------------------ | ------- | -------- | -------------------------- | --------------------------- | ------------------------------------ |
| Normal             | 124–152 | 124–152  | 0.000565                   | 0–1 (0–55ms total)          | 705.3–961.3                          |
| Reduced            | 120–132 | 120–132  | 0.000565                   | 0                           | 681.4–937.4                          |
| Normal, throttled  | 664–752 | 664–1012 | 0.002583                   | 2–3 (392–527ms total)       | 705.3–961.3                          |
| Reduced, throttled | 716–768 | 716–1004 | 0.002582                   | 2–3 (446–513ms total)       | 681.4–937.4                          |

Transferred script resources are **149,136B**, CSS **14,154B**, three font resources in every case. Initial resource totals exclude navigation and resources still pending at that sample; completed-page totals add navigation and completed resources after section sampling. They do not guarantee all possible lazy resources were loaded. Reduced mode transfers 24,524B less, associated with motion-only image loading; JavaScript/CSS do not shrink. No missing images, browser errors or horizontal overflow were reported in the 16 runs.

The script's `cls` is the accumulated value of layout-shift entries without recent input, not the standardized maximum-session-window CLS calculation. Long-task totals are summed task durations, not TBT. RAF intervals are main-thread callback cadence, not presented GPU frames or field INP/Core Web Vitals. No Lighthouse score or field result is claimed.

Normal unthrottled section samples had 0/2521 intervals above 25ms, p95 ≤16.8ms. Throttled normal had 28/2495 above 25ms, maximum 33.5ms, concentrated in process entry; reduced/throttled had 1/2525. Separate unthrottled probes found 6/174 longer intervals at product ambience, 4/176 at hover, 10/170 during scrolling and 8 during product brush entry. These finite hitches are recorded rather than described as perfect 60fps.

The offer is the largest stationary effect sample: **126.59ms main-thread task time per second**, versus **11.43** paused and **8.07** reduced. Hero is 67.28/12.19/9.50; product ambience 33.92/11.71/8.41; orbit dots 26.42/12.11/8.25; footer 26.80/12.30/8.37. Samples include neighbors and probe overhead; they neither isolate paint/GPU cost nor measure whole-device CPU. No direct paint trace was captured. Fixed blur radii still have rendering cost. These values describe the earlier build; current focused results are above.

All four brushes settle to `complete`, zero animations and no mask, including after scrolling away. Forty normal-motion locale switches with forced GC retain 863 DOM nodes and one four-dot root; listeners settle to 515 from cycle 5. Heap increases 4,804,200B → 6,043,692B (cycles 1→40), with 36,992B over the final ten. This is bounded cleanup evidence, not proof of absence of retention/leaks. No runtime errors were recorded.

Phase 01's local JSON used fresh contexts, the same widths/locales and an 11s observation, but lacked reduced/throttled/motion samples, CSS totals, full-page transfer and a recorded browser/host version. Script transfer grows from 142,545B to 149,136B (**+6,591B / 4.62%**); font requests increase 2→3. Cache, capture-window and layout differences prevent a causal load-speed/frame-rate comparison. See the Arabic report for all 16 exact rows.

## Image audit and remaining limitations

The original combined Hero is 1536×1024. Alpha>12 reaches y1023, with 287 opaque pixels on its bottom row: this intrinsic crop cannot be repaired by CSS. Required-width screenshots show the corrected layout without additional unintended garment clipping. The source and all other original PNGs remain unchanged.

[Artwork audit](artwork.md) records original/optimized/rendered/served sizes. Future optional work: correct Story `sizes` to its actual breakpoints, compare high-DPR derivatives with originals, and consider the original larger offer image only if visual review justifies it. Hero's original resolution limits desktop DPR2 detail. No broken or severely degraded image justified reprocessing in this phase.

Cross-engine/physical-device performance, actual browser-toolbar zoom, human assistive-technology review, GPU presentation tracing, long-duration heap retention and field metrics remain unverified. Catalog values/social links and final owner art acceptance remain external inputs. No Design Studio, Supabase, uploads, checkout, payments or order submission work started.

## Owner Git handoff

The working tree contains **32 modified tracked files and 38 untracked files**, all unstaged. Include `src/`, `messages/{ar,en}.json`, `e2e/`, `playwright.config.ts`, `scripts/measure-landing.mjs`, `docs/phase-01.1/`, `docs/README.md`, the existing Phase 01 documentation cross-link, **both `public/images/atmosphere/*.webp`**, and **both font WOFF2 files with their OFL licenses**. The measured source and tests must be saved together.

Keep `.cache/`, `.next/`, node_modules, browser/test reports, generated declarations/type caches, private source artwork, `.env` credentials and recordings out of the new commit. `docs/brand/onyx-logo-source.ai` already exists unchanged in baseline history; it is not a new file in this release, and was not removed or rewritten. No secrets or large accidental binaries were found among the changed/untracked release candidates; the largest new file is the required 180,046B brush. Pattern scanning is not a comprehensive secret-history audit.

See [Arabic owner commands](report-ar.md#أوامر-المراجعة-والحفظ-بعد-الموافقة) for the explicit staging scope, suggested commit and push commands. Local evidence links intentionally point into ignored `.cache`; the tables and findings in these documents remain available on GitHub without uploading diagnostic recordings. Approval remains the owner's final step.
