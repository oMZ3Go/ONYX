# Phase 01.1 — Arabic font loading and Linux CI

27–28 October 2026. Follow-up to release commit `c00e7ba57efe339d5ba360ea55084428c8e12972` on `feat/landing-motion-refinement`.

## Final recovery: the remaining body-font shift

The preload correction was pushed as `b56f7b0481b740ddec20ecac1e1fddccb0795bfa`. [Quality run 40467924688](https://github.com/oMZ3Go/ONYX/actions/runs/40467924688) passed the build/quality checks but finished **81/82 E2E**, with Arabic 390px still failing at **0.0013072997784108896**. The earlier local success below was therefore insufficient evidence of Linux stability.

The new [artifact 12716884847](https://github.com/oMZ3Go/ONYX/actions/runs/40467924688/artifacts/12716884847) was downloaded and its checksum verified. `layout-shifts-8` in the sole failing trace reports a shift at **263.7ms**, with font status `loaded`. The preceding seven fresh fixture documents had no recorded shifts. On this navigation the **Noto Sans Arabic body-font response took 230.188ms**; Alexandria finished in 16.347ms. The shift precedes category scrolling/image decoding. It is a timing-dependent body-font swap, not a repeat of the original Alexandria failure or accumulated measurements from earlier fixtures.

The diagnostic's rectangles are viewport x/y/width/height, in CSS pixels:

| Source                        | Before                            | After                             |
| ----------------------------- | --------------------------------- | --------------------------------- |
| Hero `.hero-description` text | 22 / 287.390625 / 346 / 52.046875 | 22 / 281.390625 / 346 / 52.046875 |
| Hero `.eyebrow` text          | 22 / 117 / 346 / 25               | 22 / 112 / 346 / 25               |
| Collection `.eyebrow` text    | 22 / 857.171875 / 346 / 25        | 22 / 852.171875 / 346 / 25        |
| Hero `.button-outline`        | 116 / 353.484375 / 121 / 46       | 105 / 353.484375 / 128 / 46       |
| Hero value “تصميمك الخاص”     | 207 / 459.484375 / 81 / 16.1875   | 215 / 457.484375 / 80 / 19        |

The trace, screenshot and error-context snapshot agree with those elements. A callback with font status `loaded` records the resulting rendered change, not proof that fonts had finished before the previous paint. Controlled response gating reproduces the same affected elements on both the real hydrated page and the script-free fixture. With local font aliases disabled, Windows falls through to Tahoma and measures 0.00097673; forcing unadjusted DejaVu measures 0.00098686. The OS/font differences explain why the original local check stayed below 0.001 while Linux did not.

### Metric-compatible Arabic fallbacks

`src/styles/font-fallbacks.css` supplies explicit local fallbacks using Tahoma on Windows and DejaVu Sans when Tahoma is unavailable on Linux. `next/font/local` now uses these named families for the two Arabic web fonts instead of its automatic Arial-only fallback. The original Arial fallback metrics remain available for non-Arabic glyphs, preserving loaded Latin text within Arabic pages. Arabic ranges **include normal and nonbreaking spaces**; leaving spaces on an unadjusted fallback recreated the baseline movement in the controlled experiment.

The vertical values come from the unchanged source fonts, both with 1000 units per em: Noto ascent/descent/line-gap = 1374/738/0; Alexandria = 968/251/0. Thus body overrides are 137.4%/73.8%/0%. The first heading-width calibration used all Arabic translations and produced 117.4%. Auditing the actual heading corpus gave a better match: sum of target advance widths / sum of regular fallback advance widths = 1.220068 for Tahoma and 1.191659 for DejaVu Sans. Each heading is counted once using its accessible label where present, excluding Hero animation duplicates, and measured at its actual 650/700 weight. Their rounded shared adjustment is **120.6%**. Dividing Alexandria's vertical overrides by 1.206 gives **80.2653%/20.8126%/0%**. These local faces intentionally use regular sources with browser-synthesized weight, as measured; the final web fonts still use their original variable weight ranges. This follows [metric-compatible font fallback guidance](https://developer.chrome.com/blog/font-fallbacks); recalibrate if the source fonts change.

No new font files or requests are introduced. Alexandria and Noto remain the actual rendered Arabic fonts after loading, Space Grotesk and Inter remain unchanged, and `font-display: swap` plus preloading are retained. No hidden-text interval, rendering gate, animation change, font replacement or threshold change is used. Matching local fallback geometry addresses the race instead of relying on download speed alone.

Four new `e2e/font-loading.spec.ts` cases hold the body font or both Arabic fonts until the first contentful paint at 390/1440px, then release the actual responses. They retain every layout-shift entry from navigation, capture the visible fallback frame, require the calibrated local fonts to actually render, and use Chromium's platform-font data to prove that Noto and Alexandria render afterward. They check Hero right-edge anchoring, vertical position/height, description geometry, horizontal overflow, clipped text and overlapping buttons before and after loading. The max-content RTL title can change its left edge as glyph advance widths change; exact width equality is not a valid invariant. Its right edge, vertical geometry and the whole-page shift limit remain strict. There are no sleeps, retries, skipped cases, observer resets or filtered shifts.

### Recovery verification status

The controlled prototype passed **72/72** combinations: six requested widths × Tahoma/DejaVu availability × body/heading/both held × actual/fixture document. Maximum accumulated shift was **0.0009527624**, below the unchanged 0.001 bound. Metric matching reduced the isolated DejaVu body-font case to **0.0001000316**. This is a Windows-hosted font-availability simulation, not a native Linux result.

The first implementation passed `npm.cmd run check` (30 unit tests, 14 pages), focused **28/28** and full **86/86** E2E, with zero flaky/skipped cases. All 144 dynamic-category navigation measurements were zero. The compiled CSS also passed **96/96** controlled actual/fixture loads across both languages and six widths with Tahoma/DejaVu availability; platform-font diagnostics confirmed those fallbacks and the final web fonts. This was Windows-hosted simulation, not native Linux.

The near-boundary prototype result **0.0009527624** was investigated rather than treated as sufficient margin. It occurs at 1440px when both fonts swap in one frame: the collection heading changes width and moves its small eyebrow, alongside navigation and button width changes from Noto. The largest horizontal heading-text change was x=947.6875 to 925.046875; y=792.390625 and height=52 remained stable. No image/card source was present. Separate-frame swaps measured 0.0005946849, demonstrating why font completion order matters. Heading-specific calibration to 120.6% reduced the controlled fast-release matrix maximum to **0.0007592688**, with **96/96** passing; it changes only fallback glyph metrics, not final typography.

The final compiled 120.6% CSS passed the same **96/96** fast-release cases, maximum **0.0007592688** (`final-font-matrix.json`). The matrix covers both `/ar` and `/en`, 390/600/768/820/1024/1440px, actual hydrated pages and script-free fixture shells. Arabic cases hold body, heading or both font responses through first contentful paint. Linux availability is simulated by making only Arial/Tahoma aliases unavailable; the declared DejaVu fallback stays enabled. Globally disabling local fonts would disable the intended solution too and is used only in the earlier diagnosis.

| Held font responses     | Windows/Tahoma maximum | Linux-font availability simulation maximum |
| ----------------------- | ---------------------- | ------------------------------------------ |
| Noto body only          | 0.0003669116           | 0.0002011424                               |
| Alexandria heading only | 0.0001815155           | 0.0001468525                               |
| Both                    | 0.0007592688           | 0.0005366285                               |

The residual sources are small text-width differences in navigation/buttons and the collection heading, not the original vertical Hero jump. Exact glyph-width equality between different font designs is not promised. The correction does not reserve different final layout dimensions or hide text. Systems lacking both local Tahoma and DejaVu Sans continue through the existing generic stack; their fallback metrics are outside this Windows/Linux calibration. Native mobile operating systems and other browser engines have not been newly tested here.

### Visual and performance comparison

Six full-page comparisons, Arabic/English at 390/768/1440px, have **zero changed pixels** and identical sampled Hero/category geometry after fonts and images settle. The 390/1440 baseline was captured from the actual `b56f7b0` build before editing. For the added 768 comparison, the previous generated Arial fallback rules/stacks were reconstructed on the same production shell; both before/after 768 loads use identical CSS routing overhead. The final font bytes, sizes, spacing, layout and animation source are unchanged. Delayed-font screenshots show readable, connected Arabic text before either web font is released; the tests also verify actual Tahoma/DejaVu then Noto/Alexandria usage. Existing no-JavaScript and reduced-motion tests remain in the full suite.

Three fresh-context samples per configuration gave these median FCP/LCP values (both were equal in this local, reduced-motion capture): Arabic 390 **132→136ms**, 768 **132→140ms**, 1440 **144→148ms**; English 390 **128→132ms**, 768 **136→140ms**, 1440 **140→152ms**. These small laboratory differences do not demonstrate a significant regression or establish production user metrics. Evidence: `baseline*-visual-performance.json`, `metrics-visual-performance.json`, `metrics-visual-comparison.json` and paired screenshots under the ignored diagnostic cache.

### Verification lifecycle finding

The final focused run passed all **22 category/font tests**, including the new text-range containment checks. The wider run was 27/28 because an existing English ambient-motion assertion read seven animations immediately after `emulateMedia`. This was investigated separately: `motion-event-audit.json` records eight controlled transitions where the media query already matched `reduce`, but its `change` event arrived 14–17ms after the immediate read. The application's existing listener canceled the animations when that event arrived. `e2e/final-composition.spec.ts` now waits for that observable cancellation with `expect.poll`, retaining the exact zero-animation requirement and the existing timeout. No production motion code, font observer, threshold, test retries or timed delays changed. This is a demonstrated asynchronous test-lifecycle correction discovered during final verification, distinct from the real Arabic font instability.

### Final local verification — 28 October 2026

Final production build: `3AJUKaQTMZatIthj9NuHd`. `npm.cmd run check` passed formatting, lint, types, **30/30 unit tests** and the **14-page build** (`final-check-v3.log`). The 22 category/font-focused cases passed; after correcting the demonstrated media-event race, both affected English/Arabic motion cases passed **2/2** (`final-motion.log`).

The complete final-source run passed **86/86 E2E in 4.4m**, with **zero unexpected, flaky or skipped tests**, using production mode, `CI=1`, one worker and Chromium 156.0.8078.4 (`final-full.log`, `final-full-data/report.json`). All **144 dynamic Category Grid fixture measurements were zero**. The four deliberately delayed-font results were: 390 body **0.0002537438**, 390 both **0.0003859009**, 1440 body **0.0003669116**, 1440 both **0.0005484272**. The separate fast-release matrix's worst case remains **0.0007592688**. No browser-error guard was disabled.

Fix commit **`555c49b1f12f59bd7397c639fe348d7f06969090`** was pushed to the existing branch. [Quality run 40583981781](https://github.com/oMZ3Go/ONYX/actions/runs/40583981781) finished **85/86 E2E** on Linux. Installation, quality/build, Chromium installation, **all Arabic font-loading tests and all dynamic Category Grid tests passed**. Its sole failure is a separate English process-animation test synchronization issue, documented in [the focused process timing report](ci-process-timing.md). The font correction is accepted by native Linux tests and is not changed by that follow-up; the overall workflow still requires a successful conclusion. All font diagnostic archives, screenshots, traces and scripts remain under ignored `.cache/phase-01.1/ci27/`. The following sections describe the first preload attempt and remain historical evidence.

## Historical preload attempt: failure and evidence

[Quality run 40360295587](https://github.com/oMZ3Go/ONYX/actions/runs/40360295587) passed installation, formatting, lint, types, 30 unit tests, the production build and Chromium installation. E2E finished with 74 passes and eight failures, all Arabic dynamic Category Grid cases at the unchanged `< 0.001` accumulated layout-shift assertion. The runner used Ubuntu 24.04.5, Node 24.21.0, Playwright 1.64.1 and Chromium 156.0.8078.4.

The complete job log and [browser-evidence artifact](https://github.com/oMZ3Go/ONYX/actions/runs/40360295587/artifacts/12668635989) were downloaded and inspected, including the HTML report's inline JSON attachments and all eight traces. The downloaded ZIP's SHA-256 matches GitHub's `b81a73e1cbec49416cd4f564657bf9b5b34c2d71b9ee7e761e142d06e95007d0`.

| Arabic viewport | Accumulated shift |
| --------------- | ----------------- |
| 390px           | 0.00194946        |
| 600px           | 0.00270818        |
| 768px           | 0.00211576        |
| 820px           | 0.00198159        |
| 1024px          | 0.00156504        |
| 1099px          | 0.00161089        |
| 1100px          | 0.00161081        |
| 1440px          | 0.00198776        |

The sources were text nodes in the Hero's `.headline-line` spans, **«صمّم هوديك» and «بطريقتك»**, plus **«تلفت الأنظار»** in the featured-products heading where it was visible. At 768px the first Hero line's text bounds changed from x=393/y=134.39/width=311 to x=340/y=159.39/width=364. The second line moved down 25px too. No category card or image appeared among the reported sources.

Shifts occurred 144–280ms into the document's initial load, before category scrolling/image decoding. Seven widths failed on the first two-card fixture; 1099px failed on its third navigation, with three cards. Navigation resets the observer's arrays, so this was not accumulation across fixtures. The observer covers the entire production shell, not just Categories; it correctly detected a visible heading change elsewhere in that shell.

### Preload correction

Alexandria, the font used by the initial Arabic headings, had `preload: false`. The trace shows its request being discovered later than the preloaded body fonts. The generated `next/font/local` fallback uses `local(Arial)` with adjusted metrics. A Linux runner does not provide the same fallback rendering as the Windows verification environment. Switching to Alexandria changes the Arabic text's width and baseline; a callback reporting `document.fonts.status === "loaded"` can still contain the shift caused by that completed font load.

An isolated Chromium diagnostic with `CSS.setLocalFontsEnabled({ enabled: false })` reproduced the CI values closely on Windows: approximately 0.001951 at 390px, 0.002114 at 768px and 0.001990 at 1440px. This also reproduced on the actual hydrated page, not only the script-free fixture. It is a real font-swap instability exposed by the test, not a defect in the dynamic collection, card geometry or reserved image dimensions. Disabling local font aliases is a focused approximation of the fallback difference, not a Linux operating-system test.

The production correction sets **only Alexandria's `preload` to `true`** in the locale layout, so Next emits an early font preload beside the body fonts. It preserves `font-display: swap`, the exact font bytes, weights, typography, layouts and animations. This prioritizes an existing 31,348-byte font; because the locale layout is shared, its preload also appears on English pages. No dependency, workflow or category architecture changes were needed.

The test's diagnostic now resolves text nodes to their owning element and records its section. It also waits two animation frames after image decoding so painting and observer delivery finish before the final measurement. The observer still starts at navigation, retains all entries, covers the whole page and uses the same `< 0.001` threshold. No shift filtering, resets after font loading, skipped tests, retries or increased timeouts were added.

Preloading removes late discovery; it does not promise zero font-swap CLS under every network condition. In the controlled diagnostic, deliberately holding the Alexandria response for another 180ms still produced measurable shifts with `swap`. Those results are retained, rather than hidden or excluded by changing the observer. Ordinary cold-load verification and the Linux workflow are the acceptance evidence for this CI correction.

### Local verification of the preload-only commit

Local environment: Windows, Node 24.22.0, Playwright 1.64.1, the same Chromium 156.0.8078.4 as CI. WSL is not installed and Docker is unavailable. Tests use production build `qse_7KOXmUSCLSpFe6Gta` on port 3000, `CI=1`, one worker and the project's normal runner; the browser-cache path is explicitly supplied locally.

| Check                                      | Result                                                             | Local evidence                                                 |
| ------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `npm.cmd run check`                        | PASS: format, lint, types, 30/30 unit tests and 14 generated pages | [check.log](../../.cache/phase-01.1/ci27/check.log)            |
| Focused category/layout/motion/route tests | 24/24, including all 144 dynamic data/viewport/locale combinations | [focused.log](../../.cache/phase-01.1/ci27/focused.log)        |
| Complete E2E suite                         | 82/82 in 4.4m; zero failures, flaky tests or skips                 | [full.log](../../.cache/phase-01.1/ci27/full.log)              |
| Fresh-page fallback comparison             | 64/64 below 0.001; Arabic maximum 0; English maximum 0.00013340    | [measurements](../../.cache/phase-01.1/ci27/fixed-matrix.json) |

Both focused and complete runs retained all 144 dynamic-fixture measurements; their maximum accumulated shift was zero. The additional comparison used eight widths × two locales × actual/fixture pages × two fresh contexts, with local font aliases disabled. Browser diagnostics and cached reports are evidence, not production dependencies.

The subsequent Linux result for this preload-only commit was **81/82, failure** in [run 40467924688](https://github.com/oMZ3Go/ONYX/actions/runs/40467924688), as analyzed above. Its local results remain historical evidence, not final Linux acceptance.

Original logs, extracted traces, shift summaries, controlled comparisons and local reports are retained under `.cache/phase-01.1/ci27/` and excluded from Git. These findings supersede the earlier assumption that preserving the production shell alone had resolved the Arabic initial-layout issue on every platform. The approved dynamic-grid implementation and the 26 October verification record remain otherwise unchanged.
