# Preliminary domain and relational model

Status: **R**, conceptual only. No migrations or database tables exist. These names describe ownership rather than a committed SQL schema.

| Entity                       | Key data / relationships                                                                   | Invariants and candidate indexes                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Product                      | ID, slug, garment type, hood configuration, published status, size-chart reference         | Unique slug; archive rather than break order references                                   |
| Fabric / Color / Size        | IDs, display labels, physical/specification metadata                                       | Color swatch never substitutes for variant availability                                   |
| ProductVariant               | Product + fabric + color + size; SKU; enabled; optional stock/version                      | Unique SKU and actual option tuple; nonnegative tracked stock; product lookup index       |
| PrintSpecificationRevision   | Provider constraints, units/PPI/format policy and version                                  | Immutable approved revisions; U until supplier signs off                                  |
| VariantPrintArea             | Variant + side + specification revision; width/height/mask/safe inset                      | Unique variant/side/revision; positive physical dimensions; unsupported side disabled     |
| Category / TemplateCategory  | Slug/label; many-to-many template membership                                               | Unique slugs and junction pair; indexed reverse lookup                                    |
| DesignTemplate               | Published metadata, canonical DocumentRevision, thumbnail and compatible products          | Publishing only validated revision; private source separated from approved public preview |
| DocumentRevision             | Project ID, schemaVersion, revision, content hash, private manifest/blob reference         | Immutable revision; object-store bytes validated against manifest                         |
| Asset                        | Storage key, digest, MIME, bytes, decoded dimensions, purpose, validation state            | No public customer asset paths; unique scoped content identity; asset lifecycle tracked   |
| DocumentAsset                | DocumentRevision ↔ Asset                                                                   | Referential completeness; cleanup cannot delete still-referenced assets                   |
| PricingRuleRevision          | Effective period, currency/scale, approved structured rule data                            | Version immutable once used; no arbitrary executable expressions                          |
| Promotion                    | Eligibility, effective period, version, stacking policy                                    | Server-clock evaluation; rule IDs included in price snapshot                              |
| QuoteSnapshot                | Inputs, line amounts, total, currency/scale, rule/catalog versions, expiry                 | Exact arithmetic; immutable accepted order snapshot; no floating-point money              |
| OrderIntent                  | Guest capability hash, idempotency key, payload digest, state, expiry                      | Unique scoped idempotency key; bounded staging lifecycle; not a confirmed order           |
| Order / OrderItem            | Internal ID/reference, status/version, submitted revision, option snapshot, quote snapshot | Unique reference; item immutable after accepted request; change creates reviewed revision |
| OrderAsset                   | Order/item → private project/preview/production artifact + digest                          | Artifact purpose determines allowed access, not filename                                  |
| ShareGrant                   | Order ID, token digest, scope, expiry, revokedAt                                           | Index digest; raw token never stored; order reference never acts as secret                |
| OrderEvent                   | Order, from/to, actor, time, reason, correlation ID                                        | Append-only event sequence; optimistic version prevents conflicting updates               |
| StaffRole / StaffAssignment  | Auth identity and granted permissions                                                      | Server-managed authority; no role from editable user metadata                             |
| AuditEvent                   | Actor, action, entity/revision, time, safe before/after data                               | Append-only, no tokens or customer binary content; indexed entity/time                    |
| SiteSetting / ContentSection | Published content, contact/social settings, demand notice, lead time, pause flag/version   | Only authorized publishing; pause is checked transactionally at order acceptance          |

Cardinality: Product 1:N Variant; Variant 1:N PrintArea revisions; Template N:M Category; DocumentRevision N:M Asset; Order 1:N Item and Event/ShareGrant; Item references one accepted document revision and price snapshot. A single-item MVP flow is proposed, while a child item model avoids baking that UI limitation into all storage.

No customer account table is required for initial requests. Collect only information needed for the manual order; names/phones/address should not be copied into share URLs. The point of collecting contact data remains U.

## Database correctness and access

Use foreign keys, unique/check constraints and transactions for invariants; do not rely only on form validation. Index referencing keys and actual filtering/policy predicates, then validate with query plans. Do not add speculative indexes to every column. Store instants consistently (UTC) and present user-facing dates in the appropriate locale/timezone.

Expose only intentional API surfaces. Enable RLS for every exposed table, keep internal orders/shares/audit in a private schema where practical, and explicitly review grants. Anonymous public access is limited to published catalog DTOs. Guest orders are mediated by server capability checks, not a broad `anon` insert/select policy. Admin reads/writes require specific roles and row/operation constraints. Test direct API access as well as application routes.

Stock reservation and decrement timing are U-03. Availability checks alone do not prevent concurrent overselling; if reservations are approved, atomic stock/version checks and expiration become part of the finalization transaction. Historical orders survive catalog retirement; sensitive customer artifacts follow an approved retention policy, not unconditional cascading deletion.
