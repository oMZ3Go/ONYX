# Delivery roadmap and phase gates

Status: **R** execution plan, with Phase 00 authorized now. Every later phase requires the owner's review of the preceding gate and explicit continuation. No dates/costs are promised before requirements and staffing are known. Completion means evidenced behavior, not just generated files.

## Dependency-aware order

```text
P00 foundation → owner review
  → P01 UX/brand and P02 bounded canvas investigation
  → P05A catalog/pricing/security contracts and backend foundations
  → P03 storefront and P04 studio (P04 also requires accepted P02)
  → P05B upload/order/WhatsApp integration
  → P06 complete admin workflows
  → P07 integrated release validation
  → explicit deployment approval → P08 controlled pilot
```

P01/P02 can progress independently on approved provisional fixtures; real branding and supplier approval still gate final visuals/production. Phase 05 is split because P03 needs a real catalog contract and P04 needs validated variant/price/document contracts. Deferring all backend decisions until after both UIs would create incompatible assumptions and duplicate rules. P05A can provide local development fixtures/interfaces and later a test database only when authorized; P05B requires a usable studio revision/export. Minimal staff auth/catalog administration can begin alongside P05A, but P06 completes order/content controls after their services exist. Security and accessibility are continuous, not postponed until P07.

## Phase 00 — Foundation and requirements

- **Objective:** establish a preserved, understandable and locally verifiable starting point.
- **Deliverables:** inspection and source precedence; PRD/SRS/scope/journeys/quality/acceptance/questions; architecture/data/security/ADRs; UX/DTF documents; comparative spike specification; minimal Next.js app/config/test/lockfile/README; results and roadmap.
- **Dependencies:** existing workspace and owner's master request; package access for installation/checks. Brand/printing answers are documented unknowns, not required to invent now.
- **Acceptance:** original file hashes unchanged; no real product workflows/cloud resources; clean lint/format/type/test/build results, or explicit environment limitation; exact changes and decisions reviewable.
- **Key risks:** conflicting older instructions, unstable runtime/library choices, oversized scaffolding or accidental scope expansion.
- **Definition of Done:** every requested A–H deliverable exists; permitted checks actually run and recorded; no push/deploy/next-phase implementation; owner receives Arabic summary. Owner acceptance is a separate pending decision, never inferred from technical completion.

## Phase 01 — UI/UX and brand integration

- **Objective:** make discovery, customization and ordering understandable on mobile and desktop.
- **Deliverables:** approved journey wireframes, storefront/studio/review/admin layouts, responsive states, token system, official asset/font inventory and usage mapping, content/localization plan.
- **Dependencies:** P00 review; U-01/U-05 for final brand/language; catalog/pricing/print unknowns reflected visibly. Provisional wireframes may precede asset delivery.
- **Acceptance:** owner approves key screens; representative users can explain next actions; keyboard/RTL/contrast/reduced-motion and small-screen layouts reviewed; original logo preserved.
- **Key risks:** incomplete assets, overwhelming editor controls, unsupported Arabic fonts, attractive but expensive animation.
- **Definition of Done:** approved design handoff with all essential empty/loading/error/disabled states, token decisions and unresolved exceptions recorded; no pending unapproved “official” branding.

## Phase 02 — Editor technical proof of concept

- **Objective:** resolve canvas/text/format/export risks before committing to the full editor.
- **Deliverables:** two bounded harnesses, common fixtures, real-device traces, comparison scores, canonical format proposal and accepted engine ADR.
- **Dependencies:** P00 spike specification, representative hardware/fonts; supplier answers where available, otherwise labeled synthetic fixtures. Full P01 visual polish is unnecessary.
- **Acceptance:** all hard gates SP-01–12 applicable to selection pass; measurements reproducible; limitations and export strategy explicit; no invented benchmark results.
- **Key risks:** Arabic caret/IME errors, mobile memory limits, in-app browser restrictions and renderer/native serialization coupling.
- **Definition of Done:** technical lead/owner accept evidence and scope; engine/adapter/text/export decisions recorded, unresolved blockers assigned before P04. A failed spike is useful evidence but does not approve production implementation.

## Phase 03 — Storefront implementation

- **Objective:** deliver fashion-focused, fast discovery tied to real catalog semantics.
- **Deliverables:** homepage sections, collection/category/product/template pages, about/contact/sizing/policies, metadata, responsive images and progressive loading; buy/customize links.
- **Dependencies:** approved P01 identity/copy, P05A catalog/content/availability contracts and owner-supplied SKUs/policies. Can use explicit development fixtures until data service readiness; never ship invented inventory/prices.
- **Acceptance:** FR-01–03 browsing portion passes; categories/offers are data-driven; disabled combinations clear; route/deep-link/responsive/a11y checks pass; no editor code downloaded on discovery routes.
- **Key risks:** unlicensed assets, incomplete policies, content hardcoding and heavy hero media on mobile networks.
- **Definition of Done:** real content/asset provenance and publish states validated, catalog integration tested, agreed performance budget met, reviewable local/approved test build.

## Phase 04 — Design Studio

- **Objective:** implement dependable, approachable garment editing and portable recovery.
- **Deliverables:** accepted engine adapter; all committed MVP tools; both sides and variant-aware print areas; Arabic/English text; image warnings; canonical import/export; preview download; two-slot IndexedDB UI/recovery; supplier-configurable export adapter.
- **Dependencies:** P01 interaction design, accepted P02 ADR/format, P05A catalog/quote interfaces, U-08 specification before production-ready validation.
- **Acceptance:** FR-04–10 and FR-21 pass with round-trip/recovery/hostile-import tests; real touch/browser evidence; printable artifact contains no mockup; missing fonts cannot silently change art.
- **Key risks:** lost work, transform drift, text rendering differences, file/memory abuse and touch/scroll conflicts.
- **Definition of Done:** supported format/version and limits documented, required editor operations proven, all failure states usable; supplier-dependent claims stay blocked until real sample approval.

## Phase 05 — Backend, pricing and ordering

- **Objective:** make variant/price/order decisions authoritative and preserve exact accepted designs.
- **Deliverables P05A:** validated domain contracts, catalog/variant/pricing rules, pure pricing tests, proposed-to-implemented schema migrations in authorized test infrastructure, least-privilege access, scoped guest intent design and role foundations.
- **Deliverables P05B:** bounded private uploads, document/preview validation, immutable snapshots, idempotent finalization, share expiry/revocation, WhatsApp message/open/copy path, cleanup and pause behavior.
- **Dependencies:** P00 review; U-02/03/04/07/10/13/14/15 resolved enough to implement; P02 document contract for A; P04 valid export/revision for B. No production resources without approval.
- **Acceptance:** FR-03 and FR-11–14/17–19 server behavior passes; concurrency/tampering/RLS/cross-customer/expiry tests pass; actual message sending is still a customer action.
- **Key risks:** stale quotes, duplicate orders, orphan uploads, leaked bearer links, overselling and unclear fees/stock policy.
- **Definition of Done:** local/test migration reproducibility and rollback demonstrated; end-to-end draft handoff works with safe test number/link; failure cleanup/retention tested; no click-to-chat action counts as a confirmed sale.

## Phase 06 — Administration dashboard

- **Objective:** allow authorized staff to operate catalog, content, prices and fulfillment safely.
- **Deliverables:** staff authentication/roles, catalog/variants/optional stock, templates/categories, pricing/promotion versioning, content/settings, high-demand notice/lead times/pause, order review/status changes and audit views.
- **Dependencies:** P01 admin UX, P05A/B services and owner-approved roles/stock/confirmation/retention policies.
- **Acceptance:** FR-15–20 pass for each permission level; unauthorized direct calls fail; changes are audited; public content reflects publishing; pause enforced server-side while browsing/editing continue.
- **Key risks:** stale permission claims, unaudited price changes, excessive privileges and confusion between drafts and sales.
- **Definition of Done:** representative staff complete catalog-to-confirmation-to-delivery exercises; audit/recovery/account lifecycle documented; no privileged key in client bundles.

## Phase 07 — Integration, security and testing

- **Objective:** validate the assembled release under real customer/production conditions.
- **Deliverables:** Playwright journeys, integration/security/abuse suite, accessibility review, recorded mobile/network budgets, real print samples, recovery drills and release defect register.
- **Dependencies:** P03/P04/P05/P06 complete; actual supplier/brand assets and business policies; representative users/devices and safe test infrastructure.
- **Acceptance:** every committed MVP requirement has evidence; cross-customer access and secret exposure tests pass; no unresolved critical/high release-blocking defect; supplier approves actual front/back samples.
- **Key risks:** gaps hidden by mocked services, embedded-browser behavior, provider access from target region and backup assumptions.
- **Definition of Done:** evidence maps to acceptance matrix, exceptions have explicit owner acceptance, security/performance/printing blockers closed and release candidate reproducible.

## Phase 08 — Pilot release and deployment

- **Objective:** launch a controlled pilot with operational safeguards and a reversible rollout.
- **Deliverables:** approved hosting/domain/environment setup, production migrations/configuration, monitored pilot, staff runbook, backups/restore/rollback procedure, privacy/store policies and feedback/defect review.
- **Dependencies:** P07 gate; explicit owner approval for infrastructure/spend/push/deployment; provider eligibility/region/access and costs verified; operations contact and recovery objectives assigned.
- **Acceptance:** public routes and actual phones work in target conditions; production smoke checks, access boundaries and alerting verified; order pause/rollback and restore are rehearsed; pilot criteria assessed.
- **Key risks:** unexpected cost, service access/latency, production data exposure, launch beyond staff/print capacity.
- **Definition of Done:** owner accepts pilot outcome and wider-launch decision; monitoring/incident ownership handed over. A successful deploy alone does not complete the pilot.

## Suggested reviewable changes after Phase 00 approval

1. P01 token/asset integration and approved wireframes: provenance, contrast, Arabic coverage and responsive review.
2. P02 common fixture harness + each candidate adapter: hard-gate evidence and no full-editor scope creep.
3. P05A catalog/pricing contracts and exact-money tests: no client authority, current availability, versioned rules.
4. P03 discovery routes/content: metadata, data-driven publishing and performance checks.
5. P04 document/persistence first, then tools/review/export: round-trip, rollback, Arabic, touch and physical output checks.
6. P05B order intent/uploads/finalization, then scoped share/handoff: failure injection, concurrency and security gates per change.
7. P06 admin modules, then P07 integration evidence and P08 approved pilot.

These are proposed future work units, not branches/PRs or cloud resources created in Phase 00. Stop after the foundation report and wait for owner review.
