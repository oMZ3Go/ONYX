# Security and storage design

Status: **R** threat model and future controls. None of the protected workflows exist yet; this document is not a security certification.

## Trust boundaries and access

Public catalog images may be deliberately public after publication review. Customer documents, uploaded originals, previews and production exports use private buckets. A template's approved thumbnail is separate from its editable source. Storage keys, order references and unguessable IDs alone do not grant access.

Guest requests use narrow application capabilities rather than mandatory customer accounts or unrestricted anonymous SQL/storage grants. Staff authentication is separate. RLS covers every exposed table and storage access; service/secret keys remain server-only and bypass privileges are used only inside explicitly authorized adapters. Review grants in addition to RLS. Never trust editable `user_metadata` for roles; sensitive actions check current authoritative assignments, since cached JWT claims can be stale. Views require invoker semantics or explicit protected access.

| Actor                   | Allowed                                                         | Denied                                                                                         |
| ----------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Unauthenticated visitor | Published catalog/content and explicitly approved public assets | Customer drafts, storage listing, staff APIs                                                   |
| Guest intent capability | Upload/finalize own bounded intent, resume same request         | Arbitrary keys, other intents, catalog/pricing mutation                                        |
| Share-grant bearer      | Approved read-only order summary/preview for one order          | Admin actions, unrelated orders, contact data, default access to editable/production artifacts |
| Authorized staff        | Role-scoped catalog/order/production operations                 | Unassigned privileges or silent audit deletion                                                 |

Editable project/production downloads are staff-only by default (**R**). If the owner wants customer project sharing, use a separate explicit download scope with retention/rights approval; do not expand the default WhatsApp link silently. Staff opening the same link must still authenticate before seeing production artifacts.

## Scoped share link proposal

Generate at least 256 bits of cryptographic random token material; persist only its digest plus order ID, exact scope, expiry and revocation. Constant-time token handling where applicable, rate-limited lookup and non-enumerating error responses. Tokens are bearer secrets: anyone receiving a forwarded link can use its allowed scope until expiry/revocation. Explain this to the owner; it is controlled sharing, not proof of recipient identity.

Prefer a fragment-based token exchanged by the share page for a narrow, short-lived secure HttpOnly session, then remove the fragment with `history.replaceState`. This avoids routine URL query/referrer logging but still needs an in-app browser usability spike. Validate Origin/CSRF for session mutations; SameSite and TLS are required. No third-party analytics/scripts on private share pages. Use `Referrer-Policy: no-referrer`, `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`; redact capability URLs in logs/errors. Redaction rules must cover application, proxy and monitoring layers.

Serve private artifacts through a checked application route where immediate revocation matters. Alternatively issue very short-lived signed URLs after grant validation; acknowledge that an already-issued storage URL remains usable until expiry unless stronger mediation is added. Revocation cannot retract a downloaded copy. Do not place permanent raw storage links in WhatsApp. Expired links give a neutral response; only a valid owner intent or authorized staff can renew, never an order number alone. Final mechanism and TTLs are U-10.

## Threats and required tests

| Threat                                     | Control / negative test                                                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IDOR / cross-customer access               | Bind grant to one order, purpose and assets; A token requesting B fails at route and data boundaries                                                        |
| Upload / ZIP / image decompression abuse   | Bounded compressed and expanded bytes, pixels, entries, depth/objects/fonts; signature/decode checks; reject traversal/duplicate paths and scriptable types |
| Malicious SVG/HTML/remote assets           | MVP accepts allowlisted raster formats; reject script/external-reference payloads; never fetch arbitrary document URLs (SSRF)                               |
| Price/side/variant tampering               | Recalculate from validated canonical data/current catalog; reject disabled variants and stale acceptance                                                    |
| Double clicks / racing clients             | Unique scoped idempotency key, payload digest and atomic finalize; concurrency tests plus volume caps                                                       |
| Token leakage / preview crawlers           | Scoped read-only data, fragment exchange candidate, no-referrer/no-store, redacted logs; link preview must reveal no customer detail                        |
| Staff account compromise / role escalation | MFA recommended, least privilege, fresh permissions, session revocation plan, server checks; test editable metadata/stale role claims                       |
| Stored XSS                                 | Treat text/category/name fields as plain text; no unchecked HTML; sanitize any later rich content; contextual output encoding                               |
| CSRF / excessive requests                  | Origin validation, CSRF protection for cookie mutations, per-intent and network/global rate and storage budgets; accessible abuse challenge only if needed  |
| Lost assets / abandoned drafts             | Intent lifecycle, reference-aware cleanup, restore tests and owner-approved retention; never clean an active production dependency                          |
| Secret leakage in public repo              | Ignored local env/cache, placeholder-only example, dependency review; never `NEXT_PUBLIC_` privileged keys                                                  |

Before implementation, choose actual size/rate/expiry limits from P02 evidence and operational budget. Deny by default until configured. No production customer data in tests, Git or preview environments. Audit records identify actor/action/revision without storing tokens, full customer art or unnecessary PII. Backup, deletion, retention and log-access responsibilities must be agreed before pilot.

Supabase behavior checked against [storage access control](https://supabase.com/docs/guides/storage/security/access-control) and [RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security). The changelog Markdown endpoint failed to load; the [HTML changelog](https://supabase.com/changelog) was available. No Supabase API implementation is pinned yet; recheck SDK/auth/grant behavior when Phase 05 begins.
