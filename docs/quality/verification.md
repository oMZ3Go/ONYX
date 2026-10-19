# Verification strategy

Phase 01 now extends the foundation with localized component/catalog/timeline unit tests and actual Chromium Playwright acceptance tests. `npm run check` still runs format/lint/type/unit/build; `npm run test:e2e` exercises the production server when no preview is already running. CI performs both. [Phase 01 evidence](../phase-01/report-ar.md) records execution, screenshots, metrics, fixes and remaining device/browser limits. The historical Phase 00 coverage statements below describe the earlier baseline.

Phase 01 checks the landing page only. Passing these checks does not validate the future editor, backend security controls, pricing or DTF workflow.

## Local gates now

| Command                    | Purpose                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `npm.cmd ci`               | Reproduce pinned dependency graph from the lockfile            |
| `npm.cmd run format:check` | Check maintained text/code formatting; preserve source inputs  |
| `npm.cmd run lint`         | JavaScript/TypeScript/React Hooks rules, zero warnings         |
| `npm.cmd run typecheck`    | Generate route types, then strict no-emit TypeScript check     |
| `npm.cmd test`             | Vitest locale, asset, catalog and headline lifecycle contracts |
| `npm.cmd run build`        | Actual production compilation/prerender validation             |
| `npm.cmd run test:e2e`     | Chromium, both locales, responsive layouts and interactions    |

Record exact results and limitations in [the Phase 01 report](../phase-01/report-ar.md), including failed commands and fixes. The [Phase 00 report](../phase-00/report.md) preserves foundation-only evidence. The E2E runner reuses the workspace Chromium cache if present, respects an explicit `PLAYWRIGHT_BROWSERS_PATH`, and leaves the standard CI path unchanged. Stop owned local servers after verification. No credentials or external application resources are needed.

## Tests introduced with real features

- Pricing: table-driven rule fixtures, exact rounding/boundaries, discounts, empty sides, disabled variants, changed price acceptance and tampering rejection. Pure unit tests have no SDK dependency.
- Documents: round-trip and migration fixtures, asset completeness, unsupported versions, malformed ZIP/paths/dimensions, missing fonts and reference render comparisons.
- Persistence: IndexedDB transaction rollback, two-slot recency/replacement, quota denial, deletion/shared assets and conflicting tabs. Use a real browser in addition to isolated helpers.
- Orders: database transaction/idempotency races, partial uploads, orphan cleanup, expired intents/quotes, pause changes, snapshot immutability and allowed lifecycle transitions.
- Security: direct API/RLS/storage tests for anonymous, guest A/B and each staff role; token expiry/revocation/leakage; malicious uploads and rate limits. Never use production customer data.
- Playwright: extend the landing coverage when P03/P04 have real routes/interactions; add engine fixtures and workflow checks then. Stub external WhatsApp navigation, assert message contents and explicit open action, never send real messages in tests.
- Accessibility/performance: automated checks plus manual keyboard/screen-reader/touch testing; record device/network/build and actual budgets. Real embedded-browser tests cannot be replaced with Chromium viewport emulation.
- Printing: fixture pixel/alpha/geometry checks plus supplier-approved physical samples. Browser output cannot alone establish production readiness.

Use test environments and migrations only after their phase authorizes them. The local quality workflow now covers lint/type/unit/build and Chromium; remote CI execution has not been performed. No deployment credentials or automatic production release are included. Meaningful change gates belong in review checklists; do not add tests that merely mirror implementation details.
