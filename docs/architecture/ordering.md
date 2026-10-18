# Pricing, order persistence and WhatsApp handoff

Status: confirmed workflow with **R** implementation design; U decisions listed below. Phase 00 has no endpoints, uploads or messaging integration.

## Pricing boundary

`calculateQuote(validatedSelection, printFacts, ruleRevision, promotionContext)` is a pure function returning line breakdown, total, currency/scale, rule IDs and normalized inputs. Inputs include actual variant, validated printed sides/area and quantity where approved. The application service supplies current catalog/rules/server time; the function does not fetch data. Use integer minor units or exact decimal arithmetic with an explicit currency scale and rounding rule. Currency, fees, taxes, print-area pricing, discounts/stacking, delivery treatment and quote lifetime remain U-04/U-15.

Client estimates improve responsiveness but are advisory. Server-derived print facts come from validated canonical objects, not a client “blank back” flag. Freeze the quote accepted for the request: line items, total, currency, option descriptors, catalog/pricing/promotion revisions and expiry/acceptance time. Never recompute historic order totals from current mutable tables. A changed amount or material selection requires another customer review before handoff; manual adjustments produce a new audited revision and explicit agreement.

## Proposed sequence and failure behavior

1. Browser validates UX input and sends a bounded order intent with canonical document metadata, selection and random idempotency key. Server validates all inputs, current availability, pause flag and quota; calculates an authoritative quote for review. A short-lived guest capability identifies the intent without requiring an account.
2. Customer accepts that quote/revision. Server issues uploads limited to fresh opaque object keys in a private staging prefix, exact purposes, type/size budget and expiry. It cannot grant a general bucket write capability. The internal intent is not yet a completed draft order.
3. Upload project/preview; retain local editable state. Server verifies object existence, size/signature/digest, canonical schema, complete asset references and decoded image budgets. Browser preview is informational; staff/production rendering must use the validated document.
4. Finalize: recheck intent ownership, exact payload hash, availability, pause and quote validity. If material price/rule inputs changed, return a new quote for explicit review. Transactionally allocate the order reference, store immutable design/selection/quote snapshots, asset references and state event; mark intent finalized. Storage staging cannot be rolled back by SQL, so failed/expired intents are cleaned by a later bounded cleanup process.
5. Create scoped share grant only after validated assets and order commit. Return the durable request summary and link. If link issuance fails after order commit, idempotent retry returns that order and safely resumes link issuance; it never creates another sale.
6. Show an explicit “Open WhatsApp” action (safe after asynchronous upload) with URL-encoded reference, product/variant/side summary, exact amount/currency and controlled order link. Provide copy-message/link fallback. Customer explicitly sends. Click-to-chat does not attach binary files or certify delivery.

Idempotency key uniqueness is scoped to the guest intent. Same key + same normalized payload returns the same result, even after network timeout; same key + changed payload is rejected. Finalization uses a transaction/unique constraint to handle concurrent requests. A new click with changed design needs a new reviewed intent, but rate/volume budgets still apply so attackers cannot bypass quotas with random keys. Retention of idempotency records must exceed the supported retry window.

## Order lifecycle

| State                       | Entry evidence / allowed next states                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `draft`                     | Validated request and assets committed; handoff preparation may be incomplete → `awaiting_customer_contact`, `cancelled` |
| `awaiting_customer_contact` | Handoff is ready; opening the link may be recorded as an event only → `pending_confirmation`, `cancelled`                |
| `pending_confirmation`      | Authorized staff matched an actual inbound customer conversation → `confirmed`, `cancelled`                              |
| `confirmed`                 | Staff records manual agreement/payment/delivery arrangement according to owner policy → `in_production`, `cancelled`     |
| `in_production`             | Staff starts production → `ready`; exceptional cancellation requires permission/reason                                   |
| `ready`                     | Completed and checked → `delivered`; exceptional cancellation requires permission/reason                                 |
| `delivered`                 | Staff records fulfillment; terminal for MVP, adjustments handled by audited policy                                       |
| `cancelled`                 | Authorized cancellation/abandoned request expiry with reason; terminal; new request if reopened                          |

An “opened WhatsApp” event never advances to pending or confirmed. No webhook or automated message integration is assumed. State changes require actor/role, current version and allowed transition; audit failures cannot silently allow a sensitive transition without evidence.

Pause policy (**R**): reject creation and finalization of new requests when paused, including intents started before pause; keep local art/export and already-finalized order views accessible. Do not accept payment or imply a reservation. A changed pause state returns a clear notice; order completion can be retried after reopening. Owner must approve handling of already-confirmed production.

Unresolved: token lifetime/renewal and recipients, upload budgets, currency/fees, stock reservation, abandonment TTL, single-item UX, WhatsApp number, staff contact-verification procedure and allowed manual quote adjustments. [WhatsApp click-to-chat documentation](https://faq.whatsapp.com/5913398998672934) is the vendor reference; the owner explicitly confirmed the binary attachment and manual-send constraints.
