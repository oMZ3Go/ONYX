# Phase 03.2 — Milestone 1 review

Historical milestone report. The owner subsequently approved this milestone and explicitly authorized M2; see the [M2 continuation](phase-03.2-milestone-2.md). The measurements and prior validation below retain their original scope.

Experiments and validation: 2026-11-21. Recovery and final review: **2026-11-22**, branch `feat/design-studio-editor`. **Milestone 1 is ready for owner review; M2 editing functionality has not started.** No commit, push, merge or deployment. The existing Studio shell, styles, camera, panels, docks, animations, localization and production package manifests are unchanged.

## Deliverables

| Requested deliverable                                         | Review artifact                                                                                                                                                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Measured engine comparison, versions/licenses and limitations | [Results](../spikes/canvas-engine-results.md), [raw evidence](../spikes/evidence/canvas-engine/measurements.json), [locked reproducible harness](../../experiments/canvas-engine/README.md)               |
| Recommended engine and rationale                              | [ADR 0002](../architecture/decisions/0002-canvas-engine.md): Konva 10.10.0 + react-konva 19.3.2, pending owner approval                                                                                   |
| Versioned schema and migrations                               | [v2 types](../../src/modules/design-studio/editor/document.ts), [parser](../../src/modules/design-studio/editor/validation.ts), [empty-v1 migration](../../src/modules/design-studio/editor/migration.ts) |
| Document/mockup/camera coordinates                            | [Affine helpers](../../src/modules/design-studio/editor/coordinates.ts) and [coordinate design](../architecture/editor-integration.md#coordinate-system)                                                  |
| Surface integration and command/history boundaries            | [Typed surface intents](../../src/modules/design-studio/editor/surface-contract.ts), [controller/gesture contract](../architecture/editor-integration.md#controller-gestures-and-history)                 |
| Targeted foundational tests                                   | [Document tests](../../src/modules/design-studio/editor/document.test.ts), [coordinate tests](../../src/modules/design-studio/editor/coordinates.test.ts)                                                 |
| M2 implementation sequence and exit criteria                  | [Artwork placement/manipulation plan](../architecture/editor-integration.md#m2-implementation-sequence-and-acceptance)                                                                                    |

## Recommendation and material findings

Konva and Fabric both passed the bounded React/Next, pointer-control and isolated-render feasibility checks. The update-to-next-frame p95 at 100 objects was 17.9 ms for Konva, 18.0 ms for Fabric and 17.9 ms for SVG; these largely frame-limited measurements do not establish a speed winner. Konva's projection through React and native Transformer fit the existing state ownership; Fabric remains a viable alternative with explicit imperative reconciliation/disposal. The recommendation is architectural, supported by working experiments.

Two concrete failures informed the design: the initial Konva/Fabric multiplier paths rounded the synthetic output down one pixel per axis, fixed by allocating the exact ceiled target size; the SVG prototype's first raster export omitted text, while later exports included it. The latter remains a recorded failed fidelity check. The experiment verifier intentionally returns exit code 1 for that candidate while preserving successful Konva/Fabric results.

v2 separates independent front/back records, ordered layers, canonical transforms and asset/font manifests. Preview geometry uses explicitly labelled original mockup pixels until approved physical registration permits a reviewed conversion to millimetres. No printable dimensions or supplier specifications were invented. Camera, active side, selected IDs and renderer state are not saved geometry.

The existing camera captures touch pointers; M2 must add shared pointer ownership before enabling artwork drag. Gesture movement is transient, pointerup commits once, and Escape/cancel/lost capture/pinch/blur/side or geometry changes roll back. This milestone specifies those boundaries without enabling customer editing.

## Validation

- `npm.cmd run check`: **passed**, including formatting, ESLint, route/TypeScript generation, **97 tests in 12 files**, and production build. This includes **30 new foundational tests**. The first sandbox attempts hit SWC's Windows cache-owner policy; an approved normal-account run passed without dependency or permission changes.
- Isolated experiment: production Next build and strict typed engine API probe passed. Production and development Strict Mode verification passed for Konva and Fabric; SVG failed the explicitly recorded cold-export text check. Five 30-second 100-object samples and ten warm outputs per candidate are preserved, plus shorter 10/300-object smoke runs.
- `npm.cmd run test:e2e -- design-studio`: **69 passed, 0 failed, 0 flaky, 0 skipped**, no retries and no global errors, in **633.033 seconds**. The previous run completed on 2026-11-21; its full HTML report was recovered on 2026-11-22. All 69 detailed test results contain a single passed attempt with retry zero and no errors. [Recovery evidence](../spikes/evidence/canvas-engine/studio-regression-recovery.json) records individual results and the original HTML report's SHA-256. No duplicate suite was started.
- `git diff --check`: passed. No production engine dependency was installed.

The prior quality-check result remains valid: source, tests and dependency manifests were reviewed and left unchanged during recovery. Only documentation and a report-derived evidence record were finalized; formatting and whitespace checks were repeated for those changes. No active Node test/benchmark/server processes were found during recovery. The original HTML report remains in ignored `playwright-report/index.html`; extracted diagnostic data and recovery scripts remain in ignored `.cache/phase-03/m1-recovery` and `.cache`.

## Review conclusions and dependencies

The v2 validator owns schema structure and internal asset/font references; it returns a detached staging document and has no active-work replacement API. The v1 migration refuses unknown content and unresolved catalog references rather than dropping them. Coordinates have no locale or DPR parameter, and camera conversion never writes geometry. Global object IDs, separate side maps and explicit side-bearing intents avoid implicit front/back copying. The tests cover these contracts, while the live application continues using its existing v1 shell.

The renderer contract and history policy are specifications, not an implemented editing controller. M2 must validate every intent, normalize transforms, flush the final pointer sample, discard late gesture callbacks, and coordinate object manipulation with the camera's existing touch capture. Text baseline/wrapping, accessible editing and real-device recovery remain acceptance risks; no structural parser can verify supplier calibration, actual asset hashes, stock or commercial rights.

Root `package.json` and `package-lock.json` are unchanged. The separate experiment pins Konva, react-konva and Fabric alongside matching Next/React versions; its dependencies are installed only under ignored `.cache/canvas-engine/node_modules`. The ESLint addition applies only to experiment files. No experimental renderer, raw evidence, probe or benchmark script is imported by application code.

The [Phase 03.1 security review](security-review.md) and implementation record remain unchanged. **The unresolved Picomatch risk remains open.** The experiment's zero-advisory audit applies only to its separate lockfile; it is neither a new audit of the ONYX application nor a resolution of its documented findings. No dependency upgrade, override, permission change or deployment exception was introduced.

## Approval scope

Approve the proposed Konva adoption, v2 preview/physical coordinate distinction and controller integration plan to begin **M2: Artwork Placement and Manipulation**. That work adds the client surface, canonical controller, explicit placement, selection, drag/resize/rotate, single-side multi-selection/alignment and the necessary history/cancellation support, with all Phase 03.1 regressions retained.

Real Android/iOS and embedded-browser recovery, native Arabic/IME review, screen-reader editing, retained mobile memory and complete text/export fidelity remain unverified. Portable packages, persistence, uploads, pricing, checkout and production exports remain later work. Approval to implement M2 does not waive those release gates or certify print readiness.

## Complete file inventory

Recovery inventory: **42 files — 5 modified, 37 new/untracked**, with no staged changes. This actual Git inventory supersedes the earlier 29-file estimate and includes the new recovery evidence. Generated builds, dependency installations, raw Playwright reports and temporary recovery scripts remain ignored.

| State    | File                                                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Modified | [docs/architecture/decisions/0002-canvas-engine.md](../../docs/architecture/decisions/0002-canvas-engine.md)                                   |
| Modified | [docs/architecture/design-documents.md](../../docs/architecture/design-documents.md)                                                           |
| Modified | [docs/phase-03/phase-03.2-handoff.md](../../docs/phase-03/phase-03.2-handoff.md)                                                               |
| Modified | [docs/spikes/canvas-evaluation.md](../../docs/spikes/canvas-evaluation.md)                                                                     |
| Modified | [eslint.config.mjs](../../eslint.config.mjs)                                                                                                   |
| Created  | [docs/architecture/editor-integration.md](../../docs/architecture/editor-integration.md)                                                       |
| Created  | [docs/phase-03/phase-03.2-milestone-1.md](../../docs/phase-03/phase-03.2-milestone-1.md)                                                       |
| Created  | [docs/spikes/canvas-engine-results.md](../../docs/spikes/canvas-engine-results.md)                                                             |
| Created  | [docs/spikes/evidence/canvas-engine/audit.json](../../docs/spikes/evidence/canvas-engine/audit.json)                                           |
| Created  | [docs/spikes/evidence/canvas-engine/fabric-text.png](../../docs/spikes/evidence/canvas-engine/fabric-text.png)                                 |
| Created  | [docs/spikes/evidence/canvas-engine/initial-measurements.json](../../docs/spikes/evidence/canvas-engine/initial-measurements.json)             |
| Created  | [docs/spikes/evidence/canvas-engine/konva-text.png](../../docs/spikes/evidence/canvas-engine/konva-text.png)                                   |
| Created  | [docs/spikes/evidence/canvas-engine/measured-fixtures.txt](../../docs/spikes/evidence/canvas-engine/measured-fixtures.txt)                     |
| Created  | [docs/spikes/evidence/canvas-engine/measurements.json](../../docs/spikes/evidence/canvas-engine/measurements.json)                             |
| Created  | [docs/spikes/evidence/canvas-engine/studio-regression-recovery.json](../../docs/spikes/evidence/canvas-engine/studio-regression-recovery.json) |
| Created  | [docs/spikes/evidence/canvas-engine/svg-cold.png](../../docs/spikes/evidence/canvas-engine/svg-cold.png)                                       |
| Created  | [docs/spikes/evidence/canvas-engine/svg-repeat.png](../../docs/spikes/evidence/canvas-engine/svg-repeat.png)                                   |
| Created  | [docs/spikes/evidence/canvas-engine/svg-text.png](../../docs/spikes/evidence/canvas-engine/svg-text.png)                                       |
| Created  | [docs/spikes/evidence/canvas-engine/verification-development.json](../../docs/spikes/evidence/canvas-engine/verification-development.json)     |
| Created  | [docs/spikes/evidence/canvas-engine/verification-production.json](../../docs/spikes/evidence/canvas-engine/verification-production.json)       |
| Created  | [experiments/canvas-engine/README.md](../../experiments/canvas-engine/README.md)                                                               |
| Created  | [experiments/canvas-engine/app/fabric.js](../../experiments/canvas-engine/app/fabric.js)                                                       |
| Created  | [experiments/canvas-engine/app/fixtures.js](../../experiments/canvas-engine/app/fixtures.js)                                                   |
| Created  | [experiments/canvas-engine/app/harness.jsx](../../experiments/canvas-engine/app/harness.jsx)                                                   |
| Created  | [experiments/canvas-engine/app/konva.jsx](../../experiments/canvas-engine/app/konva.jsx)                                                       |
| Created  | [experiments/canvas-engine/app/layout.jsx](../../experiments/canvas-engine/app/layout.jsx)                                                     |
| Created  | [experiments/canvas-engine/app/page.jsx](../../experiments/canvas-engine/app/page.jsx)                                                         |
| Created  | [experiments/canvas-engine/app/svg.js](../../experiments/canvas-engine/app/svg.js)                                                             |
| Created  | [experiments/canvas-engine/check-types.mjs](../../experiments/canvas-engine/check-types.mjs)                                                   |
| Created  | [experiments/canvas-engine/measure.mjs](../../experiments/canvas-engine/measure.mjs)                                                           |
| Created  | [experiments/canvas-engine/next.config.mjs](../../experiments/canvas-engine/next.config.mjs)                                                   |
| Created  | [experiments/canvas-engine/package-lock.json](../../experiments/canvas-engine/package-lock.json)                                               |
| Created  | [experiments/canvas-engine/package.json](../../experiments/canvas-engine/package.json)                                                         |
| Created  | [experiments/canvas-engine/prepare.mjs](../../experiments/canvas-engine/prepare.mjs)                                                           |
| Created  | [experiments/canvas-engine/verify.mjs](../../experiments/canvas-engine/verify.mjs)                                                             |
| Created  | [src/modules/design-studio/editor/coordinates.test.ts](../../src/modules/design-studio/editor/coordinates.test.ts)                             |
| Created  | [src/modules/design-studio/editor/coordinates.ts](../../src/modules/design-studio/editor/coordinates.ts)                                       |
| Created  | [src/modules/design-studio/editor/document.test.ts](../../src/modules/design-studio/editor/document.test.ts)                                   |
| Created  | [src/modules/design-studio/editor/document.ts](../../src/modules/design-studio/editor/document.ts)                                             |
| Created  | [src/modules/design-studio/editor/migration.ts](../../src/modules/design-studio/editor/migration.ts)                                           |
| Created  | [src/modules/design-studio/editor/surface-contract.ts](../../src/modules/design-studio/editor/surface-contract.ts)                             |
| Created  | [src/modules/design-studio/editor/validation.ts](../../src/modules/design-studio/editor/validation.ts)                                         |
