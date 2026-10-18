# System architecture

Status: **R**, modular-monolith target. Only the Next.js starter is implemented in Phase 00. PostgreSQL/Supabase remain proposed providers with no resources provisioned.

## Boundaries and flow

```text
Customer browser                         Staff browser
  Storefront (server-rendered)              Admin UI
  Studio client island                      |
    Canonical document ↔ canvas adapter     |
    IndexedDB / portable project            |
               | HTTPS                      | authenticated HTTPS
               v                            v
        Next.js application boundary: validation, authorization, rate limits
               | application use cases
        Catalog | Documents | Pricing | Orders | Content | Admin/Audit
               | infrastructure adapters
        PostgreSQL + private object storage + staff authentication
               |
        Scoped order view → explicit WhatsApp handoff → manual staff workflow
```

The diagram describes logical responsibilities, not separate services. A single repository/application is enough. Avoid event buses, microservices, generic repository frameworks and empty directory hierarchies until a concrete need exists.

| Module            | Owns                                                                                  | Must not own                                                 |
| ----------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Catalog           | Product/variant definitions, availability, published selections                       | Client-authored final prices or artwork objects              |
| Documents         | Canonical schema, migration, validation, asset manifests, revisions                   | Canvas-library native objects as the source of truth         |
| Studio            | Interaction/selection, viewport, undo transactions, adapter rendering                 | Backend authorization or authoritative prices                |
| Pricing           | Deterministic calculation over validated inputs/rule versions, rounding and breakdown | UI, database clients, storage, network calls                 |
| Orders            | Idempotent intent/finalization, immutable snapshots, lifecycle/events                 | Assuming WhatsApp delivery/confirmation from link navigation |
| Content/templates | Published editorial content and reusable document revisions                           | Mutating customer copies when templates change               |
| Admin/audit       | Staff use cases, permissions and append-only change evidence                          | Permissions enforced only by hidden UI buttons               |
| Infrastructure    | Database, storage, session and rate-limit adapters                                    | Business policy scattered across SDK callbacks               |

## Frontend and backend

Server Components handle public read-oriented pages/metadata. Interactive studio code loads only on studio routes, behind a client boundary. Do not instantiate browser/canvas APIs during server rendering. Keep viewport/selection state separate from durable design data and from server catalog state. Introduce Zustand only if cross-panel state actually justifies it.

Server route handlers/actions authenticate or resolve guest capabilities, validate input, run application services and return bounded DTOs. Every mutation, including a Server Action, needs its own authorization check. Domain functions consume plain typed data with no Next.js or Supabase imports. Infrastructure resolves current variants, rules and assets. Apply Zod at trust boundaries once those schemas exist; TypeScript alone cannot validate requests.

When implemented, co-locate cohesive features under `src/modules/<name>/` and server adapters under their module or `src/server/` as needed. Cross-module calls use exported use-case contracts, not another module's database internals. Keep shared UI under `src/components/` only once reused. Phase 00 has `src/app/` and `src/styles/` only.

## Data ownership and transactions

Catalog references identify current data; order snapshots capture what was accepted. Document revision blobs are immutable and content-addressed in their manifest, while order references are human-readable identifiers, never authorization tokens. Database constraints enforce relationships and uniqueness. Object storage cannot participate in a database transaction: uploads need staging, finalize verification, and orphan cleanup with bounded retention.

Public catalog caching is allowed; private order/share responses require `no-store`. Invalidate published content after authorized changes. Recheck availability, pause mode, pricing revision and quote validity at finalization despite cached browsing data. Price acceptance/requote behavior belongs to the ordering contract.

## Deployment later

Use standard Next.js capabilities. Vercel is a candidate, not a requirement or a dependency. Compare managed Node/container hosting and Vercel after confirming regional access, cost, runtime/upload limits, image processing, backups, connection pooling and observability. Large print rendering may eventually need a bounded worker; measure first, do not create it in Phase 00.

Separate local/test/preview/production credentials and data. Preview must never use real customer art or production privileged keys. Production needs HTTPS, explicit origins, environment validation, migration/rollback practice, restore drills and monitoring ownership. Owner approval is required for hosting/infrastructure or deployment. No hosting configuration has been created.
