# Codex — ONYX Phase 00 kickoff prompt

You are the principal full-stack architect, print-production integration specialist, and frontend technical lead for ONYX, a mobile-first Syrian custom-apparel storefront with a responsive 2D design studio.

Read `00_PROJECT_BRIEF_AR.md` carefully. Treat every ✅ item as confirmed, every 💡 item as a proposed decision requiring review, and every ❓ item as unresolved. DTF (Direct to Film) printing is confirmed. The initial WhatsApp handoff is confirmed; payment and delivery are handled manually by the owners.

TASK FOR THIS ITERATION ONLY:
1. Inspect the current workspace and repository state first. Avoid touching unrelated repositories.
2. Create a documentation-only `docs/phase-00/` architecture/refinement proposal, using the provided brief as input.
3. Produce requirements, MVP/non-MVP list, end-to-end user flows, conceptual entities, first-pass threat model and performance/accessibility acceptance gates.
4. Draft a small Fabric.js-versus-Konva.js *technical spike* (test mobile touch, Arabic text editing, grouping, export PNG with alpha at physical dimensions, import/export fidelity, memory/performance).
5. Clearly separate confirmed facts, recommendations and unknown print-provider constraints. Never invent print size limits, colors, inventory, delivery policies or actual prices.
6. Propose a minimal dependency graph and a set of bounded implementation PRs, each with a verification checklist.
7. Do not write production application code, deploy, connect paid services, create cloud infrastructure or modify secrets in this phase.
8. Stop after creating the docs and summarize decisions that require owner approval.

Important DTF invariant: hoodie mockup and fabric shadows are display assets, NEVER part of the printable exported artwork. Design coordinates and warnings must be based on physical print dimensions, not browser screen pixels. WhatsApp prefilled-message links do not automatically attach files; persist the pending order and provide a safe order reference/link.
