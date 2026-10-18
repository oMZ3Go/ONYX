# Verification strategy

Phase 00 checks only the foundation. A passing render test/build does not validate the future editor, security controls, pricing, mobile UX or DTF workflow.

## Local gates now

| Command                    | Purpose                                                       |
| -------------------------- | ------------------------------------------------------------- |
| `npm.cmd ci`               | Reproduce pinned dependency graph from the lockfile           |
| `npm.cmd run format:check` | Check maintained text/code formatting; preserve source inputs |
| `npm.cmd run lint`         | JavaScript/TypeScript/React Hooks rules, zero warnings        |
| `npm.cmd run typecheck`    | Generate route types, then strict no-emit TypeScript check    |
| `npm.cmd test`             | Vitest starter render and in-page navigation contract         |
| `npm.cmd run build`        | Actual production compilation/prerender validation            |

Record exact results and limitations in [the Phase 00 report](../phase-00/report.md), including failed commands and fixes. Production HTTP smoke checks can verify the generated route, language/direction and headers without claiming visual/browser QA. Stop owned local servers after verification. No credentials or external application resources are needed.

## Tests introduced with real features

- Pricing: table-driven rule fixtures, exact rounding/boundaries, discounts, empty sides, disabled variants, changed price acceptance and tampering rejection. Pure unit tests have no SDK dependency.
- Documents: round-trip and migration fixtures, asset completeness, unsupported versions, malformed ZIP/paths/dimensions, missing fonts and reference render comparisons.
- Persistence: IndexedDB transaction rollback, two-slot recency/replacement, quota denial, deletion/shared assets and conflicting tabs. Use a real browser in addition to isolated helpers.
- Orders: database transaction/idempotency races, partial uploads, orphan cleanup, expired intents/quotes, pause changes, snapshot immutability and allowed lifecycle transitions.
- Security: direct API/RLS/storage tests for anonymous, guest A/B and each staff role; token expiry/revocation/leakage; malicious uploads and rate limits. Never use production customer data.
- Playwright: introduce when P03/P04 have real routes/interactions; desktop/mobile viewport flows and engine fixtures. Stub external WhatsApp navigation, assert message contents and explicit open action, never send real messages in tests.
- Accessibility/performance: automated checks plus manual keyboard/screen-reader/touch testing; record device/network/build and actual budgets. Real embedded-browser tests cannot be replaced with Chromium viewport emulation.
- Printing: fixture pixel/alpha/geometry checks plus supplier-approved physical samples. Browser output cannot alone establish production readiness.

Use test environments and migrations only after their phase authorizes them. Add CI for lint/type/unit/build when repository review approves it; no deployment credentials or automatic production release in that workflow. Meaningful change gates belong in review checklists; do not add tests that merely mirror implementation details.
