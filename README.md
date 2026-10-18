# ONYX

Premium custom apparel, starting with DTF hoodies for customers in Syria. **Phase 00 only:** requirements, architecture, a planned editor comparison and a minimal local application. The storefront, editor, backend, admin and ordering workflows are not implemented.

## Local setup (Windows / PowerShell)

Work directly in `D:\ONYX`; the repository is already initialized. Do not clone into it again.

```powershell
node --version
npm.cmd --version
npm.cmd ci
npm.cmd run dev
```

Open <http://127.0.0.1:3000>. Stop the server with Ctrl+C. The app requires no credentials, Supabase project, external fonts or environment variables. `.env.example` documents future configuration only; copying it is optional. For a production-mode local check use `npm.cmd run build` then `npm.cmd start`.

Use **Node.js 24 LTS**, npm 11. Inspected environment: Node **24.22.0**, npm **11.19.1**. `.nvmrc` pins the tested runtime and `engines` restricts the supported major. If still using Node 25, explicitly switch to Node 24 LTS through your chosen manager/installer, reopen the terminal, verify versions and run `npm.cmd ci`. No global Node installation was changed by Phase 00. Windows PowerShell blocks `npm.ps1` here: `npm.cmd` works without weakening execution policy. Other shells can use `npm` normally.

## Verification commands

```powershell
npm.cmd run format:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

`npm.cmd run check` runs these in order. `npm.cmd run format` formats maintained files while excluding preserved inputs. `npm.cmd run test:watch` enables local watch mode. Typecheck runs Next route type generation before TypeScript, so it also works before a build on a fresh checkout. Generated `next-env.d.ts`, `.next`, caches and dependencies are ignored. The npm cache is workspace-local under `.cache/npm`.

## Structure

```text
src/
  app/          App Router layout, starter page, global styles, smoke unit test
  styles/       Clearly provisional semantic design tokens
docs/
  requirements/ PRD, SRS, journeys, scope, quality, acceptance, open questions
  architecture/ Boundaries, data, documents, pricing/orders, security, ADRs
  design/       UX, accessibility and brand integration
  printing/     Provisional DTF pipeline and supplier questions
  spikes/       Fabric/Konva experiment specification, not implementation
  roadmap/      Dependency-aware phases and Definition of Done
  quality/      Verification strategy
  phase-00/     Master request, inspection and actual completion report
  brand/        Original reference, preserved unchanged
```

Read the [documentation index](docs/README.md), [open decisions](docs/requirements/open-questions.md) and [Phase 00 report](docs/phase-00/report.md). Newer [master instructions](docs/phase-00/master-request.md) supersede the older documentation-only kickoff; both original root documents remain unchanged.

## Engineering boundaries

Next.js/React/strict TypeScript with Tailwind, ESLint, Prettier and Vitest. Exact versions plus `package-lock.json` are version-controlled; use `npm ci` for reproducibility. TypeScript 5.9 stays within the verified parser range. ESLint 10 uses compatible JavaScript, TypeScript and React Hooks rules directly. The full Next preset has incompatible legacy plugin peers; the standalone Next lint plugin also introduces an unpatched `braces` advisory, so it is deferred until a compatible fixed release exists (see ADR 0001). This is basic linting, not a complete framework or accessibility audit. Future domain logic stays independent of framework/storage SDKs. Canvas choice and portable file format require the Phase 02 spike. No Supabase SDK or browser-automation package is installed prematurely.

Tokens are in `src/styles/tokens.css`. Their colors/fonts are temporary, not official branding. No new logo was created. The Arabic starter does not decide the eventual UI language strategy. The starter's `noindex` metadata must be deliberately reviewed before any public launch; it is not an access-control mechanism.

Keep secrets and customer artwork out of Git. `.env.local` is ignored; privileged keys must never use `NEXT_PUBLIC_`. No uploads or storage policies exist yet. Security architecture describes future controls, not current enforcement of unimplemented workflows.

No push, deployment, production resources or next-phase work is authorized by this foundation. Review Phase 00 before continuing. This repository has no software license decision yet; public visibility alone does not establish a reuse license.
