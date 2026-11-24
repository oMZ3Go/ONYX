# Isolated ONYX canvas comparison

This is an experiment, not an application route. Production dependencies and Studio components do not import it. [Results and coverage](../../docs/spikes/canvas-engine-results.md) explain what was measured and what remains unverified.

Pinned candidate packages live in this directory's lockfile. Preparation copies the small app to ignored `.cache/canvas-engine`; all installations/build output and generated images stay there. The app uses the same Next 16.4.6 and React 19.3.1 as ONYX. Do not install these dependencies at the repository root.

From `D:\ONYX`, with the repository dependencies and Playwright Chromium installed:

```powershell
node experiments/canvas-engine/prepare.mjs
npm.cmd ci --prefix .cache/canvas-engine --ignore-scripts --no-audit --no-fund --cache D:/ONYX/.cache/npm
node experiments/canvas-engine/check-types.mjs
npm.cmd run build --prefix .cache/canvas-engine
npm.cmd run start --prefix .cache/canvas-engine
```

In a second terminal:

```powershell
node experiments/canvas-engine/measure.mjs
node experiments/canvas-engine/verify.mjs
```

Measure uses one warm-up followed by five 30-second **100-object** update/frame runs per candidate, with five one-second 10/300-object smoke runs, plus ten independent artwork renders/PNG encodings. Allow about nine minutes. `ONYX_SPIKE_DURATION_MS` can shorten the 100-object run for debugging; record the override and do not compare it as the full run. Raw per-frame samples, environment, decoded route script sizes, text sources, pointer results, hashes and screenshots go to `.cache/canvas-engine/results`. Measurements use one headless browser context per engine, local HTTP, desktop 1280×1000/DPR 1 and a separate touch-emulated DPR 2 context. They are not real-phone benchmarks or GPU presentation traces.

Verification asserts middle-of-string replacement/deletion in the shared DOM text editor, canonical lock rejection, exact output pixels, export invariance under CSS camera/background/RTL/selection/DPR changes, stable mount counts and absence of browser/console errors. It stores traces and accessibility snapshots. Those snapshots verify semantic test controls, not a complete screen-reader editing flow. The numeric input and textarea are intentionally shared adapter alternatives, not a comparative claim about Fabric's built-in text editor. Browser output is **synthetic, unapproved artwork**, never a production export.

The current SVG prototype has an observed **cold-export text failure**: its first rasterized SVG can omit text, while a second render includes it. `verify.mjs` records the candidate failure and exits 1 after writing all candidate results. Konva and Fabric pass this run. This is an intentional retained experiment failure, not a waived assertion; do not interpret the warmed SVG performance results as fidelity acceptance. Fixing SVG font rasterization would require a separate investigation if that strategy is reconsidered.

For development Strict Mode checks, stop the production server or use a separate port, then:

```powershell
node .cache/canvas-engine/node_modules/next/dist/bin/next dev .cache/canvas-engine --hostname 127.0.0.1 --port 3033
$env:ONYX_SPIKE_URL = 'http://127.0.0.1:3033'
node experiments/canvas-engine/verify.mjs
Remove-Item Env:ONYX_SPIKE_URL
```

Do not build into the same `.next` directory while its production server is active. Stop/restart the server after a build. A development run is for lifecycle/debugging only, never the performance table.

The synthetic fixture is 300×350 units, rendered at the **test-only** 300 PPI mapping. Geometry, text strings and original catalog Crown image are shared. Preparation copies exact existing font files and records SHA-256 hashes. Noto Sans Arabic/Inter package versions are 5.3.0, with OFL-1.1 license notices copied alongside the fonts. The Crown asset retains its unverified catalog rights; this experiment does not approve commercial use. No remote font, upload, persistence, checkout or supplier integration is involved.

The first run used raw multiplier output from Konva/Fabric and exposed 3543×4133 truncation. Current adapters allocate 3544×4134 explicitly, then render at the same synthetic pixel scale. The preserved initial report documents that failure. Fabric was changed from natural-width IText to fixed-width Textbox to model explicit text boxes; SVG explicitly embeds the same test font bytes for isolated rasterization. Canonical project types remain separate from these intentionally small renderer fixtures.

The fixtures do not implement production undo/redo, groups, crop, clipping masks, multiple sides, full touch arbitration or persistence. The native controllers and simplified SVG controls have different handle/anchor policies. Do not copy the harness into the Studio as the editing implementation; implement the [controller and coordinate contract](../../docs/architecture/editor-integration.md) with its own acceptance tests.

To repeat advisory review independently:

```powershell
npm.cmd audit --prefix .cache/canvas-engine --omit=dev --json
```

`--ignore-scripts` avoids optional native canvas build hooks; only browser paths are tested. Node canvas backends are outside this comparison. Package integrity comes from the included experimental lockfile, while the root lockfile is unchanged. All engines are MIT licensed. The SVG route uses platform APIs and adds no engine package. The experiment's audit does not supersede the application's unresolved Picomatch security review.
