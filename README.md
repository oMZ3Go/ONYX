# ONYX

Premium custom apparel, starting with DTF hoodies for customers in Syria. **Phase 01:** a local bilingual animated landing page at `/ar` (default, RTL) and `/en` (LTR), using the official ONYX artwork. The catalog is an explicitly labeled four-card preview of one design. The studio, backend, admin and ordering workflows remain unimplemented.

## Local setup (Windows / PowerShell)

Work directly in `D:\ONYX`; the repository is already initialized. Do not clone into it again.

```powershell
node --version
npm.cmd --version
npm.cmd ci
npm.cmd run dev
```

Open <http://127.0.0.1:3000/ar> or <http://127.0.0.1:3000/en>. Stop the server with Ctrl+C. The app requires no credentials, backend project, third-party font requests or environment variables. Inter and Noto Sans Arabic are served locally. `.env.example` documents future configuration only; copying it is optional. For a production-mode local check use `npm.cmd run build` then `npm.cmd start`.

Use **Node.js 24 LTS**, npm 11. Inspected environment: Node **24.22.0**, npm **11.19.1**. `.nvmrc` pins the tested runtime and `engines` restricts the supported major. If still using Node 25, explicitly switch to Node 24 LTS through your chosen manager/installer, reopen the terminal, verify versions and run `npm.cmd ci`. No global Node installation was changed by Phase 00. Windows PowerShell blocks `npm.ps1` here: `npm.cmd` works without weakening execution policy. Other shells can use `npm` normally.

## Verification commands

```powershell
npm.cmd run format:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

`npm.cmd run check` runs format, lint, typecheck, unit tests and the production build. Run `npm.cmd run test:e2e` separately for real-browser checks. `npm.cmd run format` formats maintained files while excluding preserved inputs. `npm.cmd run test:watch` enables local watch mode. Typecheck runs Next route type generation before TypeScript, so it also works before a build on a fresh checkout. Generated `next-env.d.ts`, `.next`, caches and dependencies are ignored. The npm cache is workspace-local under `.cache/npm`.

## Structure

```text
src/
  app/[locale]/ Shared localized server layout and landing page
  components/   Site shell, navigation, language switcher, icons
  i18n/         Typed messages, locale validation, next-intl configuration
  modules/      Catalog read contract/fixture and landing sections/motion/tests
  styles/       Official semantic tokens and motion styles
messages/       Complete Arabic/English UI dictionaries
e2e/            Playwright acceptance tests
scripts/        Reproducible image optimization and local performance sampling
docs/
  requirements/ PRD, SRS, journeys, scope, quality, acceptance, open questions
  architecture/ Boundaries, data, documents, pricing/orders, security, ADRs
  design/       UX, accessibility and brand integration
  printing/     Provisional DTF pipeline and supplier questions
  spikes/       Fabric/Konva experiment specification, not implementation
  roadmap/      Dependency-aware phases and Definition of Done
  quality/      Verification strategy
  phase-00/     Master request, inspection and actual completion report
  phase-01/     Implementation decisions, asset inventory and Arabic delivery report
  brand/        Original reference, preserved unchanged
```

Read the [Phase 01 implementation guide](docs/phase-01/implementation.md), [Arabic delivery report](docs/phase-01/report-ar.md), [documentation index](docs/README.md) and [open decisions](docs/requirements/open-questions.md). The owner's newer Phase 01/bilingual brief supersedes the older roadmap's documentation-only P01 scope; historical Phase 00 reports and original root inputs remain preserved.

## Engineering boundaries

Next.js/React/strict TypeScript with Tailwind, next-intl, ESLint, Prettier, Vitest and Playwright. Exact versions plus `package-lock.json` are version-controlled; use `npm ci` for reproducibility. Existing lint rules are retained (see ADR 0001 for the Phase 00 compatibility evaluation); passing them does not constitute a complete accessibility audit. Domain projections remain independent of storage SDKs. Canvas choice and portable file format still require a separately authorized Phase 02 spike. No backend SDK is installed.

Tokens are in `src/styles/tokens.css` and use the four owner-supplied brand colors. Logo and source images are unchanged. Arabic/English localization is mandatory for future features. Typography is a documented implementation choice pending visual approval. The `noindex` metadata and temporary fixture repetition must be deliberately reviewed before public launch; noindex is not access control.

Keep secrets and customer artwork out of Git. `.env.local` is ignored; privileged keys must never use `NEXT_PUBLIC_`. No uploads or storage policies exist yet. Security architecture describes future controls, not current enforcement of unimplemented workflows.

No commit, push, merge, deployment, production resources or next-phase work is authorized by this task. This repository has no software license decision yet; public visibility alone does not establish a reuse license.

`npm.cmd run test:e2e` automatically reuses `.cache/ms-playwright` when that workspace cache exists. An explicit `PLAYWRIGHT_BROWSERS_PATH` takes precedence; CI uses its standard cache. For direct `npx.cmd playwright` commands or `node scripts/measure-landing.mjs`, set `$env:PLAYWRIGHT_BROWSERS_PATH='D:\ONYX\.cache\ms-playwright'` first to reuse this installation. No reinstall is needed here. Fresh checkouts can install Chromium into the default cache with the command above. `npm.cmd run assets:optimize` regenerates delivery WebP files without modifying original PNGs; the measurement script samples a running production server. See the implementation guide for the Windows SWC sandbox cache limitation and final verification scope.
