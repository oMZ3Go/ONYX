# Phase 02 — Design Studio Showcase

Implemented locally on `feat/design-studio-showcase`, 2026-10-29. This replaces the temporary landing-page notice while retaining `#design-studio`. No editor, commerce flow, backend, dependency upgrade, or deployment is included.

## Composition and component boundaries

- `components/design-studio-showcase.tsx` is the server-rendered section: translated narrative, three explanatory steps, decorative imagery, and a native details/summary CTA explaining the future editor.
- `studio/studio-scene.tsx` is the client interaction boundary: garment, four persistent print layers, selection frame, toolbar, palette, artwork buttons, and user-only live announcement.
- `studio/artworks.ts` centralizes optimized image dimensions and individual artwork scale/offset settings.
- `styles/studio.css` owns the isolated scene layout. Existing semantic tokens, local fonts, and SVG icon conventions are retained. The old `studio-notice` styles were removed.
- `motion/studio-demo.ts` owns the small timeout-based sequence. `motion/studio-dom.ts` connects it to visibility, layout, preferences, image readiness, and the existing `onyx-motion-change` event.

The reference's pale editorial panel, split narrative/garment composition, translucent navy tools, actual artwork thumbnails, selection handles, and blue brush strokes are reproduced as independent layers. The supplied Crown replaces the reference's ONYX wordmark as the initial print. The approved garment has a different silhouette; its full hem is visible. The CTA stands alone, with the future editor explained only when the disclosure is opened; the color palette is swatches only. Arabic reverses the content/scene columns and reading order without flipping garment or artwork pixels.

## Print registration

The original garment is **1356 × 1159**; the runtime WebP is **1200 × 1026**. The calibrated print region begins at **34% left / 31% top**, occupies **36% width / 42% height**, and belongs to the same floating wrapper as the garment and selection frame. Its center stays at 52% of garment height; the taller boundary accommodates Dragon without pushing it onto the hood or hem.

| Artwork | Original dimensions | WebP dimensions | Width within print region | X / Y offset |
| ------- | ------------------- | --------------- | ------------------------- | ------------ |
| Crown   | 364 × 368           | 364 × 368       | 82%                       | −1.5% / 0    |
| Space   | 1443 × 1090         | 600 × 453       | 94%                       | −3% / −1%    |
| Nature  | 1356 × 1160         | 600 × 513       | 96%                       | −1% / −4%    |
| Dragon  | 1122 × 1402         | 480 × 600       | 78%                       | −2% / +1%    |

Offsets are percentages of the artwork image. Source alpha bounds and visual weight informed the adjustments: Space has asymmetric transparent margins, Nature has more weight in the lower landscape, and Dragon is **21.9% larger** than the prior 64% setting. Each print was inspected on the garment and checked to remain inside its selection frame.

Images preserve their intrinsic aspect ratios. The stable selection rectangle denotes the print region; it does not offer resize handles as working controls. Prints have no floating shadow or color filter. Four mounted layers crossfade over **420ms**, with scale `.96 → 1` and maximum opacity `.93`. A requested image that has not loaded leaves the previous print visible until ready; the active button updates immediately. Rapid input converges on the latest request.

## Motion and lifecycle

The default is Crown. An eligible demonstration waits **5000ms**, moves toward Space over **720ms**, hovers **240ms**, selects with **220ms** click feedback, then rests again. Nature, Dragon, Crown follow in order. Only one timeout is scheduled at a time; there is no continuous JavaScript animation frame loop.

Hero and Studio render the same `DesignerCursorGraphic`: the existing **25 × 31px** SVG, white fill, canvas stroke, and 1.5px stroke width. Shared selectors in `motion.css` and `refinements.css` retain the same RTL mirror and 18px click ring with its blue border, background, and glow. Studio's click ring uses Hero's **210ms linear** opacity `.75 → 0` and scale `.35 → 1.5` curve inside its existing 220ms click phase. The Hero timeline and controller are unchanged; no animation state is shared.

Cursor coordinates come from actual button offsets inside the same floating panel, subtracting Hero's SVG hotspot **(2, 2) in LTR / (23, 2) in RTL**. RTL ordering, scrolling, and panel floating therefore retain tip alignment. The cursor remains visible during rest while the demo is active. Each approach moves from its previous local position to the next measured target; interrupted movement captures the current transform before cancellation, preventing a jump back to a stale origin. Opacity uses a separate 160ms CSS fade. A scene resize cancels the current gesture and starts a fresh rest. The cursor has `pointer-events: none`, is hidden from assistive technology, and never moves focus.

Automatic activity requires a visible selector, a visible document, no reduced-motion preference, no site-wide pause, and all print images loaded. Ineligibility cancels pending work and hides the cursor. Resuming starts a fresh five-second rest without catch-up clicks. Touch devices may run the demonstration too; the separate ambient float remains static for coarse pointers.

**Manual selection restarts the delay; it no longer disables the demonstration.** Mouse, keyboard, and touch selections update the authoritative current index immediately, cancel the old gesture, and set a new deadline 5000ms later. The next automatic selection is the following artwork, wrapping Dragon to Crown. Clicking the current artwork also restarts its delay. Subsequent automatic cycles continue indefinitely while eligible.

Only a genuine mouse entering the artwork selector on a hover-capable device suspends the demonstration for pointer interaction. It fades the cursor out and cancels the pending gesture without resetting the deadline. While inside, no automatic selection runs. Leaving fades the cursor back in and waits any remaining delay. If the deadline elapsed during hover, leaving starts a complete 720ms approach and 240ms hover before clicking; it never produces an immediate catch-up click. Hovering the hoodie, toolbar, palette, CTA, or general section does not suspend the demonstration. Touch pointer events cannot create a sticky hover. Global suspension takes precedence and resumes with a fresh rest.

The existing scheduler owns one artwork index, one deadline, and at most one timeout. Every cancellation invalidates a generation token, so a stale queued callback cannot start another timeline or overwrite user input. Duplicate eligibility/hover notifications are no-ops. Disposal cancels native movement without measuring a potentially detached React node, cancels the timeout, and removes selector pointer listeners alongside existing lifecycle listeners and observers.

`PageMotion` supplies a shared **8s round trip**: garment moves **0 → −9px**, while toolbar, palette, and artwork panel move **0 → +4px, +3px, +5px**, respectively. Equal active time preserves opposite phase; varied amplitudes avoid a rigid identical float. The group observes the scene together, pauses together, and resumes without independent clock drift. This adds no JavaScript frame loop. The same existing offscreen/document/manual/reduced-motion lifecycle applies; coarse pointers keep the composition static.

The atmosphere is a clipped decorative layer with a **28s round-trip CSS transform/opacity animation** of static radial backgrounds. Only this background layer clips; garment overflow remains visible. `PageMotion` switches its play state, removing the animation entirely for reduced motion/coarse pointers. **The foreground wave is stationary:** it is a sibling of the garment's reveal wrapper inside the stable positioning container. Neither floating nor entrance transforms affect it. It naturally scrolls with the section and needs no animation or counter-transform. The garment's print and frame remain inside its floating wrapper. Entrances for the other layers still use the existing `data-reveal` controller with a 0–380ms stagger. Disposal disconnects observers, removes lifecycle/image listeners, cancels the timeout/cursor animation, and releases the shared ambient layers.

## Responsive and accessible behavior

Studio reuses Offer's existing `.offer-wrap` and `.offer-frame` layout classes. Both visible frames have the same **1388px maximum width**, centered margins, and horizontal gutters: **26px normally, 22px below 768px, and 16px below 360px**. Studio overrides only its own vertical spacing and panel presentation. Offer's component and styles are unchanged. The obsolete general `.container` and mobile width override are removed from Studio.

Desktop keeps the editorial split, with a 414px scene reservation and a garment capped at 640px rather than enlarging every element with the wider frame. Narrow desktop reserves 470px, brings the garment inward, and lowers the selector to clear the print. Local isolation and bounded gutters retain artistic overflow without global clipping. Tablet stacks the narrative above a large garment scene and reserves 560px so the opaque foreground brush clears the note and steps. At 600px and below, the nonessential toolbar is hidden and the selector becomes a wide panel below the garment. Steps and CTA follow it. Arabic reverses the columns and reading order while the garment/artwork pixels retain their original orientation.

Artwork buttons use native Tab/Enter/Space activation, `aria-pressed`, translated names, visible focus, actual image thumbnails, and at least 44px targets in the verified matrix. Touch selection restarts the same five-second delay without a hover lock. User-driven changes announce once through a polite live region; automatic changes do not announce or move keyboard focus. The Image toolbar button is visually selected with `aria-pressed`; clicking it is intentionally a no-op. Other tools retain unavailable semantics. Tooltips contain only the translated tool name, appear only on fine-pointer hover, and disappear on pointer exit even when a button remains focused. The palette contains only circular swatches and a navy selection mark; unavailable variants retain `aria-disabled` and translated color names without visible slashes, title disclaimers, or a palette caption.

The CTA uses native disclosure rather than a nonexistent route. Its title and subtitle remain unchanged, with no status line underneath; opening it explains the current limits. Existing Hero/product/offer navigation still reaches the section. Without JavaScript, the complete Crown scene and native CTA disclosure remain readable; switching artwork requires hydration.

## Final visual refinements

The continuation brief's ten refinements are implemented in place:

1. Individually calibrated artwork and a taller print region, with a larger Dragon (values above).
2. Selected Image tool with no click side effects and hover-only tooltip visibility.
3. Compact swatch-only palette; no slashes, visible availability caption, or invented color variants.
4. The existing wave is a stationary foreground accent across the lower edge. It starts below the print, sits below controls, and ignores pointer events. Mobile reduces its width. The duplicate background wave was removed. Final polish sets its CSS opacity to **1 at every breakpoint**, removing the prior 0.52 desktop and 0.36 mobile reductions. No filter, blending, background rectangle, source edit, or alpha amplification was added; natural painted-pixel alpha remains intact.
5. All panels share a navy translucent surface, 10px backdrop blur, thin blue edges, internal highlight, and layered shadows. Unsupported backdrop filtering falls back to the solid semantic surface color. Text/icon contrast remains prioritized over stronger transparency.
6. Stronger, synchronized opposite-direction float with varied panel amplitudes.
7. A soft blue-gray atmospheric background with lifecycle-managed CSS motion and an attractive static fallback.
8. Clearer 1px blue-gray grid lines behind the garment, using 36px spacing (28px on mobile).
9. A content-sized middle step column keeps the Customize description on one line at desktop widths; mobile retains natural wrapping. Narrow desktop reserves more scene height, and tablet lowers the selector to clear the taller print.
10. A refined CTA with a framed pencil icon, stronger hierarchy, edge highlight, 3px hover lift, small icon tilt, and a directional arrow response. Touch press adds a restrained inset state. Keyboard focus and reduced-motion behavior are preserved.

## Assets and performance

All seven original PNGs remain byte-for-byte unchanged. Their hashes and derivative metadata are recorded in [asset-inventory.json](asset-inventory.json). `npm.cmd run assets:optimize -- --studio` runs the existing Sharp pipeline only for this phase; the ordinary full pipeline also recognizes studio limits and writes its inventory separately from Phase 01.

The seven source files total **9,629,316 bytes**; transparent WebP derivatives total **726,290 bytes**, a **92.5% reduction** before Next Image's responsive delivery. The garment is capped at 1200px, prints at 600px, and brushes at 1000px. Native alpha is retained. All new images are lazy, have intrinsic dimensions and responsive `sizes`, and add no preload competing with the Hero. No animation library, remote font, canvas engine, or new package was added. Layout space is reserved before image loading.

## Verification

The prior continuous-cursor pass completed 46 unit tests and its saved final browser result reported `passed` with no failures. The stationary-brush, shared-cursor, and wider-frame changes are revalidated independently below; earlier results are not substituted for final checks.

- `npm.cmd run check`: **PASS** — formatting, lint, type generation/typecheck, **46 unit tests**, and a production build with **14 static pages**.
- `npm.cmd run test:e2e`: **100/100 PASS** in **5.2 minutes**, against the production build, including the complete existing Hero and landing-page regressions. No tests were disabled and no failures remain.
- `npm.cmd run format:check`: **PASS**. `git diff --check`: **PASS**.
- Browser checks cover looping/wraparound, the five-second restart after keyboard/touch input, retained focus, silent automatic changes, real selector hover, unrelated hover, interruption just before click, rapid re-entry, expired hover deadlines, reduced motion, site pause, offscreen/hidden states, resizing, and cursor targeting during shared floating movement. They also check removed labels and foreground opacity in both locales.
- Unit tests exercise sequence timing, manual restarts in multiple gesture phases, current-artwork reselection, partial/expired hover deadlines, duplicate lifecycle notifications, stale callbacks, full disposal including pointer listeners, source hashes, localization encoding, and the server-rendered fallback.
- Layout matrix: **320, 390, 600, 768, 844, 1024, 1199, 1280, 1440, 1920px** and **720 × 500** (200%-equivalent desktop reflow), including **844 × 390 landscape**, in both locales. Assertions cover horizontal overflow, real control hit-testing, target sizes, print registration, and selector/print separation. This is CSS viewport/reflow coverage, not a physical-device or manual browser-zoom certification.
- The layout matrix compares both visible frame edges against Offer within 1 CSS pixel. Controlled native-animation samples span two complete 8-second float cycles: the brush has no animated ancestor, stays at identical bounds, and remains stationary on global pause; the garment, print/frame, and opposite-phase panels retain their expected movement. Browser checks compare shared SVG markup and computed cursor/ring styling in both languages, measure the true hotspot during floating, and inspect the 210ms click pulse.
- Desktop/mobile/tablet screenshots are produced in `test-results/` by the showcase suite. The sticky header and skip link are hidden only during section captures to keep them from overlaying the exported image. Normal test interactions retain both.

The initial sandboxed build could not load SWC because its native cache rejected the sandbox account's ownership. Running the same commands with normal process permissions succeeded; no dependencies or security configuration were changed.

### Final production visual and motion review

Reviewed the final production build in both languages at 320, 390, 768, 1024, 1440, and 1920px. Both visible panels have exactly matching left/right edges in these measurements, with **0px horizontal overflow**:

| Viewport | Offer and Studio left edge | Right edge | Panel width |
| -------- | -------------------------- | ---------- | ----------- |
| 320px    | 16px                       | 304px      | 288px       |
| 390px    | 22px                       | 368px      | 346px       |
| 768px    | 26px                       | 742px      | 716px       |
| 1024px   | 26px                       | 998px      | 972px       |
| 1440px   | 26px                       | 1414px     | 1388px      |
| 1920px   | 266px                      | 1654px     | 1388px      |

A **17.522-second real-time sample** spans more than two hoodie cycles. Foreground-brush x, y, width, and height each had **0px drift**; the hoodie and selection frame both traveled **8.985px**. The recording also confirms that manual Nature remains selected during a six-second selector hover with cursor opacity 0; leaving resumes the approach, selects Dragon, and restores cursor opacity 1. No browser errors were observed.

Review artifacts remain local and ignored: [English desktop](../../.cache/phase-02/final/en-1440.png), [Arabic wide desktop](../../.cache/phase-02/final/ar-1920.png), [Arabic tablet](../../.cache/phase-02/final/ar-768.png), [Arabic mobile](../../.cache/phase-02/final/ar-390.png), [English small mobile](../../.cache/phase-02/final/en-320.png), [motion recording](../../.cache/phase-02/final/stationary-brush-and-cursor.webm), and [measurements](../../.cache/phase-02/final/review.json).

### Previous visual and runtime baseline

The production build was reviewed against both supplied references at 1440px and 1920px in English and Arabic, with additional mobile/tablet captures at 320px, 390px, 768px, and 1024px. All four prints were inspected individually. The final composition brings the reference's layered brush treatment, translucent panels, compact palette, grid, and blue-gray atmosphere closer while retaining the approved garment silhouette and supplied artwork. The larger Dragon remains inside the print frame; the tablet selector clears it.

Local review artifacts (ignored, not source assets): [English desktop](../../.cache/phase-02/en-1440.png), [Arabic desktop](../../.cache/phase-02/ar-1920.png), [English mobile](../../.cache/phase-02/en-390.png), [Arabic mobile](../../.cache/phase-02/ar-390.png), [CTA hover](../../.cache/phase-02/cta-hover.png), [motion recording](../../.cache/phase-02/motion.webm), and [runtime measurements](../../.cache/phase-02/review.json). Additional viewport and artwork captures are in `test-results/`.

Production observations at 390px, 1440px, and 1920px in both locales:

- Horizontal overflow was **0px** throughout. Loading the scene added **no observed layout shift**: initial English mobile CLS was approximately **0.000254** and remained unchanged; the other five cases measured **0**.
- No studio image preload links were present. Native lazy loading requested **0 studio image resources** during the initial mobile view, but **11 resources** ahead of view on desktop. Lazy loading is browser-controlled; the implementation does not guarantee that desktop studio requests wait until scrolling. Delivered studio image body bytes were approximately **229KB mobile / 243KB desktop** in this local review.
- A continuous 13-second motion sample captured the garment moving through approximately **0 to −9px**, with opposite-phase panel movement through **0 to +4/+3/+5px**, while the demo selected Space and began the next gesture. Browser assertions also checked the cursor tip against moving controls, shared phase, and atmosphere pause/resume behavior.
- With JavaScript disabled, the initial Crown print remained visible and the native coming-soon disclosure opened successfully.

These are local Chromium observations, not field performance, GPU profiling, or a before/after LCP benchmark.

### Final-polish scope

The continuation changes `src/styles/studio.css`, `studio/studio-scene.tsx`, `components/design-studio-showcase.tsx`, the page's locale prop, `motion/studio-demo.ts`, `motion/studio-dom.ts`, their tests, `studio/artworks.test.tsx`, translations, `e2e/design-studio.spec.ts`, and this report. It adds `motion/designer-cursor-graphic.tsx`, replaces Hero's inline visual markup with that component, and extends the existing cursor style selectors in `motion.css` / `refinements.css` without changing Hero's computed appearance or controller. The Offer perimeter test now scopes its frame locator to `#offers` because Studio shares the layout class; all existing assertions remain.

Artwork calibration, original/optimized assets, palette design, shared ambient motion, and Offer rendering are preserved. Unused `studio.tools.preview`, `studio.comingSoon`, and `studio.colors.current` translations were removed from both languages after removing their references. The mobile narrative preview sentence is retained; it is not one of the requested tool/CTA status labels.

## Footer final refinements — 2026-10-30

The interrupted pass already contained the six requested refinements. The resumed pass preserved that implementation, corrected the reduced-motion hover selector's specificity, made the profile-navigation test wait for the existing entrance to finish, and completed the browser review. The approved logo size, four-column desktop composition, navigation, contact details, social layout, typography, brush asset, and existing motion controller are retained.

- At 1200px and above, founders stack vertically with MZ first, equal starting edges, a 14px gap, and no divider between entries. Tablet/mobile retain their working side-by-side presentation. Only the names are links: [MZ](https://github.com/oMZ3Go) and [Tala Jarkas](https://www.instagram.com/talajarkas.123/) use `target="_blank"` and `rel="noopener noreferrer"`, translated accessible names, subtle color feedback, and visible keyboard focus.
- The social surfaces now receive the same 320ms hover treatment whether they are configured anchors or disabled placeholders: 2px lift, blue border, a gentle highlight, white icon/text, and a soft shadow. All four current placeholders retain `aria-disabled`, a default cursor, no `href`, and no navigation. Keyboard focus is visible. Reduced motion and manual pause suppress movement and transitions; the corrected reduced-motion selector now outranks the hover rule.
- The descriptions are exactly **Official social links** and **حساباتنا الرسمية**. No other translation text was changed by this refinement pass.

### Background coverage and utility-bar stability

The corner artifacts came from the rectangular light layer's bounds, not the brush. The existing animation translates the light by ±9% horizontally and ±3% vertically while rotating it ±4°. Translation percentages use the enlarged light layer's own dimensions; the former percentage insets did not cover the transformed corners on wide screens. Before correction, the sampled desktop coverage deficit reached **38.376 CSS pixels**. The former small-screen-only horizontal expansion did not address wide-screen rotation.

The atmosphere wrapper is now a size query container. The light has block insets of `calc(-2cqh - 4cqw)` and inline insets of `calc(-3cqw - 5cqh)`, so its extra coverage responds to both dimensions, including rotation's effect across axes. The original three gradient definitions, base color, opacity endpoints, 10-second alternating animation, brush position/opacity, and clipping remain intact. No opaque overlay, replacement artwork, or animation suppression was introduced.

The utility-bar shift came from replacing differently sized Pause/Play labels in a content-sized flex item. The measured copyright x-position changed by **10.953px in English** and **5.641px in Arabic**. The control now reserves the intrinsic width of both translated labels in one grid cell, hiding the inactive label visually and from accessibility APIs. The utility bar uses separate Grid tracks. Across six repeated toggles at every reviewed width, its own bounds and every child's x, y, width, and height changed by **0px**, including copyright and slogan.

### Final footer validation

- `npm.cmd run check`: **PASS** — formatting, ESLint, generated route types/TypeScript, **46 unit tests**, and **14 generated static pages**.
- `npm.cmd run test:e2e -- e2e/footer.spec.ts`: **10/10 PASS** in **54.1 seconds**.
- `npm.cmd run test:e2e`: **110/110 PASS** in **6.9 minutes**, including all existing landing-page and studio tests. No tests were disabled or weakened.
- `git diff --check`: **PASS**. Responsive visual review and measurements cover **320, 390, 768, 1024, 1200, 1440, and 1920px**, in `/en` and `/ar`, with no horizontal overflow or clipped footer content.
- Controlled samples cover two complete 20-second round trips at 100ms intervals, including midpoint, reversal, and restart frames. All four corners remain inside the light; the smallest margin across the 14 locale/viewport combinations is **25.531px**. Boundary-adjacent samples show no abrupt transform/opacity jump. The brush remains visible and stationary.
- Two additional real-time recordings confirm uninterrupted native motion across more than two round trips, with no browser errors:

| Locale / viewport | Observed time | Sampled frames | Minimum corner margin | Brush drift | Paused frames |
| ----------------- | ------------- | -------------- | --------------------- | ----------- | ------------- |
| English / 1440px  | 42.023s       | 1,525          | 39.804px              | 0px         | 0             |
| Arabic / 1920px   | 42.016s       | 915            | 50.712px              | 0px         | 0             |

Local review artifacts are ignored: [English desktop](../../.cache/footer-final/after/en-1440-0.png), [Arabic wide desktop](../../.cache/footer-final/after/ar-1920-10000.png), [Arabic mobile](../../.cache/footer-final/after/ar-390-5000.png), [social hover](../../.cache/footer-final/after/en-social-hover.png), [English recording](../../.cache/footer-final/after/en-two-cycles.webm), [Arabic recording](../../.cache/footer-final/after/ar-two-cycles.webm), [responsive measurements](../../.cache/footer-final/after/matrix.json), and [live measurements](../../.cache/footer-final/after/live.json). The earlier failing screenshots and measurements remain in `.cache/footer-final/before/`.

The prior session's focused browser-test and preview-server commands were not executed because automatic approval review hit a usage limit. Both were approved through the normal process when resumed; all validation above completed successfully. The first resumed focused run exposed the reduced-motion specificity issue and a test click during the entrance animation; both were corrected before the successful focused and full runs.

Profile tests verify generated destinations, real new-tab navigation, and `window.opener === null` with intercepted destination responses; they do not audit third-party profile availability. Browser validation uses local Chromium, not physical devices, Safari, or Firefox. No requested local verification remains blocked.

This refinement changes `src/components/site-footer.tsx`, `src/components/contact-config.ts`, the toggle markup in `src/modules/landing/motion/page-motion.tsx`, `src/styles/motion.css`, `src/styles/refinements.css`, `messages/en.json`, `messages/ar.json`, `e2e/footer.spec.ts`, and this existing report. Diagnostic/review scripts and recordings stay in ignored `.cache/footer-final/`. The refinement pass preserved all previous work and ended before any commit, push, PR, merge, or deployment.

## Release candidate verification — 2026-10-30

The owner approved Phase 02 for release to `main`. The final audit covered all 43 changed or added paths against `origin/main`, including the earlier source-artwork commit, production code, translations, tests, documentation, and seven optimized assets. No unrelated modifications, generated review artifacts, or secret-pattern matches were found. Original hashes, WebP dimensions, transparency, and byte counts match the asset inventory.

- `npm.cmd run check`: **PASS** — formatting, lint, type checking, **46 unit tests**, and the production build with **14 static pages**.
- `npm.cmd run test:e2e`: **110/110 PASS** in **6.4 minutes** against the freshly built release candidate.
- `git diff --check`: **PASS**. Only this documentation was updated after validation; runtime code, assets, and tests are unchanged.

The release proceeds through a feature-branch PR with remote CI verification before merging, followed by verification of CI on `main`. No deployment is included. Screenshots, recordings, caches, build output, and local reports remain ignored. The GitHub PR and workflow runs provide the final commit and merge status.

## Limits and future work

This is a visual showcase, not a production print proof or editor. Selection handles, text, uploads, garment customization, adjustments, and additional colors do not edit the garment. Genuine garment variants, editing tools, production geometry, saving, ordering, and backend integration belong to later phases. Dragon is provisional showcase artwork and is not approved for commercial products. Verification uses Chromium; Safari, Firefox, assistive technology sessions, and physical devices remain separate follow-up checks. No production LCP regression claim is made without comparable before/after field measurements.

The complete Phase 02 work also includes the initial integration in `src/app/globals.css`, `src/components/icon.tsx`, `src/modules/landing/motion/page-motion.tsx`, `scripts/optimize-landing-assets.mjs`, `e2e/landing.spec.ts`, `docs/README.md`, the `studio/` configuration/client/tests, seven optimized WebPs, and this phase's asset inventory. Existing assertions were retained: the old CTA expectation now verifies the disclosure, the Hero color assertion is scoped to its own palette, and the Offer perimeter locator is scoped to its section. No tests were disabled.

Phase 03 starts with approved product requirements, UX/UI, and technical planning for the actual editor. No implementation branch, editor components, canvas dependency, or backend choice is part of this release.
