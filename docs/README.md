# ONYX documentation

Baseline: 2026-10-18. Phase 00 establishes a reviewable foundation; it does not implement the commercial platform.

Current local scope, 2026-10-19: [Phase 01 implementation and localization conventions](phase-01/implementation.md), [Arabic verification/delivery report](phase-01/report-ar.md), and [asset inventory](phase-01/asset-inventory.json). The newer owner brief authorizes the complete bilingual landing page; its amendment takes precedence over older unresolved locale/palette and roadmap statements. Historical Phase 00 findings remain historical evidence.

2026-10-26 final refinement review: [Phase 01.1 implementation](phase-01.1/implementation.md), [Arabic delivery and Git handoff](phase-01.1/report-ar.md), and [image-quality audit](phase-01.1/artwork.md). Production performance and saved test evidence are reconciled; the branch is ready for owner review before commit/push. Phase 01 remains the historical comparison baseline.

## Authority and status

The [master request](phase-00/master-request.md) supersedes conflicting statements in [the original brief](../00_PROJECT_BRIEF_AR.md) and [the original kickoff](../01_CODEX_START_PROMPT.md). Both originals and the [brand reference](brand/onyx-brand-reference.jpeg) are preserved unchanged. Despite its filename, the original Arabic brief currently contains English prose.

- **Confirmed (C):** explicitly required by the owner. This does not mean implemented.
- **Recommended (R):** engineering proposal, including proposed release scope and quality budgets.
- **Deferred (D):** excluded from the proposed first release; not a rejected product requirement.
- **Unresolved (U):** requires owner, supplier, or experimental evidence.
- **Implemented:** exists in the local Phase 00 starter and has the verification recorded in the report.

Older conflicts resolved: a minimal app is now authorized; no customer accounts, two local projects, private order uploads and server pricing are confirmed; 300 PPI remains provisional. The original brief's example print dimensions remain examples, not ONYX production specifications.

## Reading order

1. [Phase 00 inspection](phase-00/inspection.md) and [final report](phase-00/report.md).
2. [PRD](requirements/prd.md), [MVP scope](requirements/mvp-scope.md), [open questions](requirements/open-questions.md).
3. [SRS and functional requirements](requirements/srs.md), [journeys](requirements/user-journeys.md), [quality requirements](requirements/non-functional-requirements.md), [acceptance matrix](requirements/acceptance-criteria.md).
4. [System architecture](architecture/overview.md), [domain and data](architecture/domain-model.md), [design persistence](architecture/design-documents.md), [pricing and ordering](architecture/ordering.md), [security](architecture/security.md).
5. ADRs: [foundation](architecture/decisions/0001-foundation.md), [canvas evaluation](architecture/decisions/0002-canvas-engine.md), [project format](architecture/decisions/0003-project-format.md).
6. [UX and tokens](design/ux-and-design-system.md), [DTF contract](printing/dtf-pipeline.md), [canvas spike plan](spikes/canvas-evaluation.md).
7. [Roadmap and phase gates](roadmap/phases.md), [verification strategy](quality/verification.md), [primary sources](references.md).

Documentation describes future behavior unless explicitly marked implemented. No database schema, editor, upload API, pricing engine, or order flow exists in Phase 00.
