# ADR 0001 — Local application foundation

Date: 2026-10-18. Status: accepted for Phase 00 implementation; commercial deployment/provider decisions remain open.

## Context and decision

The repository contains only reference documents/assets. The master request requires a minimal App Router/TypeScript/Tailwind application, Node LTS, lint/format/type/unit/build checks and preservation of existing work. Initialize manually in the repository root so no generator overwrites documents or creates a nested project.

Use Next.js + React + strict TypeScript, Tailwind's PostCSS integration, ESLint, Prettier and Vitest. Node 24 LTS/npm 11 are the supported baseline. Exact direct versions and a lockfile make installation reviewable; versions are resolved from the official npm registry and validated together. A small synchronous render test is enough to prove the starter/test pipeline without inventing business logic. Playwright is planned with real interactive journeys, not installed for a static Phase 00 screen.

Server-rendered public routes support metadata/SEO while the future studio is a separately loaded client area. A modular monolith keeps transactions, operations and deployment simpler than microservices. PostgreSQL fits variants, order snapshots and staff audit relationships; Supabase is a preferred adapter/provider, not embedded domain logic.

## Alternatives and consequences

A plain SPA is simpler initially but leaves catalog rendering/SEO and a separate backend to assemble. Next.js has framework/runtime upgrade costs; isolate domain functions and browser-only canvas logic to limit coupling. Full UI/state/animation/validation SDK stacks add no value to this starter. Add shadcn/ui, Motion, Zustand, Zod or Supabase only when a concrete feature needs them. No external fonts, image generation, cloud connections, payment, CI deployment or background service is needed.

The foundation uses provisional semantic CSS tokens and system fonts. It is not the storefront or approved brand identity. Provider-specific hosting and canvas selection are explicitly deferred. Check results and any version compatibility fixes are recorded in [the Phase 00 report](../../phase-00/report.md).

## Lint compatibility resolution

Use maintained ESLint 10 with JavaScript, TypeScript and React Hooks configs. The inspected full Next preset includes React/JSX accessibility plugins whose published peer ranges stop at ESLint 9. ESLint 9 is [end of life](https://eslint.org/version-support/), so do not force incompatible peers or keep an unsupported major merely for a preset. The chosen rule packages declare ESLint 10 compatibility; TypeScript 5.9 stays below the parser's `<6.1` ceiling. Follow [typescript-eslint's flat config guidance](https://typescript-eslint.io/getting-started/).

The standalone `@next/eslint-plugin-next@16.4.2` was evaluated but removed: its `fast-glob → micromatch → braces` dependency introduced [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), with no published patched version at inspection. This affects development lint dependencies, not the starter's application routes. Downgrading to a mismatched old Next lint plugin or using `audit fix --force` is unnecessary. Basic maintained lint rules satisfy Phase 00; revisit framework/a11y plugins when patched and compatible before the real storefront grows. Record this coverage limitation, retain type/build checks, and perform manual accessibility review rather than claiming equivalent lint coverage.
