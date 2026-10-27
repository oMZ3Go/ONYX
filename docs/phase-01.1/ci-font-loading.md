# Phase 01.1 — Arabic font loading and Linux CI

27 October 2026. Follow-up to release commit `c00e7ba57efe339d5ba360ea55084428c8e12972` on `feat/landing-motion-refinement`.

## Failure and evidence

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

## Cause and correction

Alexandria, the font used by the initial Arabic headings, had `preload: false`. The trace shows its request being discovered later than the preloaded body fonts. The generated `next/font/local` fallback uses `local(Arial)` with adjusted metrics. A Linux runner does not provide the same fallback rendering as the Windows verification environment. Switching to Alexandria changes the Arabic text's width and baseline; a callback reporting `document.fonts.status === "loaded"` can still contain the shift caused by that completed font load.

An isolated Chromium diagnostic with `CSS.setLocalFontsEnabled({ enabled: false })` reproduced the CI values closely on Windows: approximately 0.001951 at 390px, 0.002114 at 768px and 0.001990 at 1440px. This also reproduced on the actual hydrated page, not only the script-free fixture. It is a real font-swap instability exposed by the test, not a defect in the dynamic collection, card geometry or reserved image dimensions. Disabling local font aliases is a focused approximation of the fallback difference, not a Linux operating-system test.

The production correction sets **only Alexandria's `preload` to `true`** in the locale layout, so Next emits an early font preload beside the body fonts. It preserves `font-display: swap`, the exact font bytes, weights, typography, layouts and animations. This prioritizes an existing 31,348-byte font; because the locale layout is shared, its preload also appears on English pages. No dependency, workflow or category architecture changes were needed.

The test's diagnostic now resolves text nodes to their owning element and records its section. It also waits two animation frames after image decoding so painting and observer delivery finish before the final measurement. The observer still starts at navigation, retains all entries, covers the whole page and uses the same `< 0.001` threshold. No shift filtering, resets after font loading, skipped tests, retries or increased timeouts were added.

Preloading removes late discovery; it does not promise zero font-swap CLS under every network condition. In the controlled diagnostic, deliberately holding the Alexandria response for another 180ms still produced measurable shifts with `swap`. Those results are retained, rather than hidden or excluded by changing the observer. Ordinary cold-load verification and the Linux workflow are the acceptance evidence for this CI correction.

## Verification

Local environment: Windows, Node 24.22.0, Playwright 1.64.1, the same Chromium 156.0.8078.4 as CI. WSL is not installed and Docker is unavailable. Tests use production build `qse_7KOXmUSCLSpFe6Gta` on port 3000, `CI=1`, one worker and the project's normal runner; the browser-cache path is explicitly supplied locally.

| Check                                      | Result                                                             | Local evidence                                                 |
| ------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `npm.cmd run check`                        | PASS: format, lint, types, 30/30 unit tests and 14 generated pages | [check.log](../../.cache/phase-01.1/ci27/check.log)            |
| Focused category/layout/motion/route tests | 24/24, including all 144 dynamic data/viewport/locale combinations | [focused.log](../../.cache/phase-01.1/ci27/focused.log)        |
| Complete E2E suite                         | 82/82 in 4.4m; zero failures, flaky tests or skips                 | [full.log](../../.cache/phase-01.1/ci27/full.log)              |
| Fresh-page fallback comparison             | 64/64 below 0.001; Arabic maximum 0; English maximum 0.00013340    | [measurements](../../.cache/phase-01.1/ci27/fixed-matrix.json) |

Both focused and complete runs retained all 144 dynamic-fixture measurements; their maximum accumulated shift was zero. The additional comparison used eight widths × two locales × actual/fixture pages × two fresh contexts, with local font aliases disabled. Browser diagnostics and cached reports are evidence, not production dependencies.

The authoritative Linux result is the **Quality run attached to this fix's commit** in [the branch's workflow history](https://github.com/oMZ3Go/ONYX/actions/workflows/quality.yml?query=branch%3Afeat%2Flanding-motion-refinement). A successful local run alone is not a claim that GitHub CI passed.

Original logs, extracted traces, shift summaries, controlled comparisons and local reports are retained under `.cache/phase-01.1/ci27/` and excluded from Git. These findings supersede the earlier assumption that preserving the production shell alone had resolved the Arabic initial-layout issue on every platform. The approved dynamic-grid implementation and the 26 October verification record remain otherwise unchanged.
