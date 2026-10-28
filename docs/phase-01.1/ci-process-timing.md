# Phase 01.1 — process visibility and Playwright clock

28 October 2026. Focused follow-up to `555c49b1f12f59bd7397c639fe348d7f06969090` on `feat/landing-motion-refinement`.

## Confirmed Linux failure

[Quality run 40583981781](https://github.com/oMZ3Go/ONYX/actions/runs/40583981781) passed installation, quality/build, Chromium installation, all Arabic font-loading tests and all dynamic Category Grid tests. E2E finished **85 passed, 1 failed**: the English process sequence expected step 2 after `page.clock.runFor(1500)` but remained at step 1. The 7000ms assertion timeout expired with `data-process-paused="false"`; the fake clock was no longer advancing during that assertion.

The complete job log and [browser evidence artifact 12770633758](https://github.com/oMZ3Go/ONYX/actions/runs/40583981781/artifacts/12770633758) were downloaded. ZIP SHA-256: `ca68573da5802e9c0be7f41719c01f3b52f9a672cfeb8a92411ba669b354fe2e`. Evidence is retained under ignored `.cache/phase-01.1/ci28-process/`.

## Cause demonstrated by the trace and controlled reproduction

`initializeProcess()` renders `entrance`/step 1 during offscreen initialization. That state describes the displayed frame; it does not mean the loop is running. `PageMotion` starts the active-time loop only after its `IntersectionObserver` reports the process visible. Observer delivery is a native asynchronous lifecycle event, not a timer scheduled by Playwright's fake clock.

The failing trace records these monotonic timestamps:

| Event                       | Timestamp (ms) | Process state                         |
| --------------------------- | -------------- | ------------------------------------- |
| Offscreen initialization    | 271160.693     | entrance, step 1, paused=true         |
| Scroll into view            | 271193.274     | Visibility notification pending       |
| Entrance assertion snapshot | 271265.309     | entrance, step 1, **paused=true**     |
| Start `runFor(1500)`        | 271265.990     | Loop has not resumed yet              |
| Step assertion snapshot     | 271717.711     | entrance, step 1, paused=false        |
| Assertion timeout snapshot  | 278726.652     | Same state; fake clock remains paused |

The `entrance` assertion accepted an already-rendered offscreen state, allowing fake time to advance before the visibility notification resumed the loop. A later real-time assertion cannot make up that lost active time while the fake clock is paused.

A controlled production-page diagnostic gated delivery of the **actual** visible process observer entry, without changing production code, geometry or clock durations. In both English and Arabic, advancing 1500ms before releasing the entry reproduced **step 1 / paused=false**. Waiting for resumed state and then advancing the same 1500ms produced **step 2 / paused=false**. Document visibility remained visible and reduced motion remained false in all four cases. Results: `visibility-clock-audit.json`; trace extraction: `trace-summary.jsonl`.

No scheduling defect was found in `createProcessLoop`, `initializeProcess`, `PageMotion` or `browserScheduler`. Their existing active-time pause/resume behavior is consistent with the trace and reproduction.

## Focused correction

`e2e/refinements.spec.ts` now waits for `data-process-paused="false"` after the entrance assertion and before the first `runFor`. This confirms visibility delivery and loop resumption. It also asserts actual manual-pause, manual-resume and document-hidden states before their subsequent clock advances.

The test keeps its existing assertions and fake-time intervals: 1500ms to step 2, 2800ms to rest, 11000ms still resting, 60000ms frozen while paused, and 1100ms to replay after resuming. Offscreen freezing, document visibility, readable replay content and reduced-motion behavior remain covered. No production code, font correction, animation duration, timeout, test retry or arbitrary sleep changed.

Clock installation still precedes page navigation and timer creation. `pauseAt` grants manual clock control; `runFor` executes the scheduled frames and timers after the application is ready, following the [Playwright clock guide](https://playwright.dev/docs/clock#tick-through-time-manually-firing-all-the-timers-consistently). Readiness is synchronized through application state, not by advancing additional time.

## Verification status

The affected English/Arabic cases passed **2/2** (`affected.log`), followed by **2/2** native process lifecycle cases (`lifecycle.log`). `npm.cmd run check` passed formatting, lint, types, **30/30 unit tests** and the **14-page production build** (`check.log`). Final build: `TaNTCYf5IHcmLH_4PGxz7`.

The complete E2E suite passed **86/86 in 4.5m**, on its single final run, with **zero unexpected, flaky or skipped tests** (`full.log`, `full-data/report.json`). Both affected process cases and both native lifecycle cases passed within that full run. Verification used the production server, `CI=1`, one worker and Chromium 156.0.8078.4 on Windows.

The authoritative Linux result is the Quality check attached to this fix's commit in [the feature branch's workflow history](https://github.com/oMZ3Go/ONYX/actions/workflows/quality.yml?query=branch%3Afeat%2Flanding-motion-refinement). Local results do not establish remote success. The final run URL, SHA, conclusion and job evidence are recorded in the delivery report and ignored `ci28-process/` verification receipt after GitHub completes. No full visual/performance audit was repeated for this test-only correction.

Unrelated untracked images under `public/images/landing/design-studio/` were present when this task resumed and are excluded from this fix. Diagnostic cache files remain outside Git. No merge, PR or deployment is part of this work.
