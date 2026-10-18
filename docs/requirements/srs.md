# Software requirements specification

Status: required future behavior, not a statement of implemented features. **C** unless explicitly labeled **R**. [Acceptance criteria](acceptance-criteria.md) provide observable gates; [quality requirements](non-functional-requirements.md) apply across modules.

| ID    | Requirement                                                                                                                                                                         | Module             |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| FR-01 | Render mobile-first homepage with hero/design CTA, collection CTA, featured designs, categories, offers, how-it-works and required footer content; content administrable            | Storefront/content |
| FR-02 | Provide product, collection/category, template, about, contact, sizing and policy pages with direct links and buy/customize/start-blank journeys                                    | Storefront/catalog |
| FR-03 | Select actual garment/hood/fabric/color/size variants; disable unavailable combinations and validate again at ordering                                                              | Catalog            |
| FR-04 | Maintain independent front/back designs and mockup-only layers; show configured printable boundaries; support zoom/pan and responsive scale                                         | Studio             |
| FR-05 | Add/edit images, Arabic and English text, and shapes; move/rotate/resize; multi-select; group/ungroup; align/distribute; manage layer order                                         | Studio             |
| FR-06 | Undo/redo committed edits; show optional grid/snapping/guides; lock, duplicate and safely delete objects                                                                            | Studio             |
| FR-07 | Preserve image transparency and warn about poor effective resolution; plan basic adjustments, grayscale, brightness, contrast, dithering (**D** implementation of advanced filters) | Studio/printing    |
| FR-08 | Provide touch-first mobile tools, contextual properties/bottom sheets and persistent accessible review action; support in-app browser recovery                                      | Studio/UX          |
| FR-09 | Import/export a versioned editable project with required assets, validate before replacing active work, and download a garment preview                                              | Documents          |
| FR-10 | Automatically retain exactly two most recent editable projects/assets locally, restore/delete them, communicate save state and storage loss, and offer explicit portable backup     | Local persistence  |
| FR-11 | Display price estimates and obtain authoritative server recalculation from current catalog/rules; preserve an immutable order pricing snapshot                                      | Pricing            |
| FR-12 | Validate selection/design and securely upload project/preview, then finalize a draft record/reference before handoff; support bounded retries/idempotency                           | Orders/storage     |
| FR-13 | Share a controlled order link and prefilled reference/product/price via WhatsApp; customer explicitly sends; no automatic binary attachment or inferred confirmation                | Orders/handoff     |
| FR-14 | Protect customer assets with scoped, expiring, revocable access and upload validation/limits/rate control; isolate customer and admin permissions                                   | Security           |
| FR-15 | Manage products, fabrics, colors, sizes, variants, availability and optional inventory through authenticated administration                                                         | Administration     |
| FR-16 | Manage templates, categories, thumbnails, editable projects, featured designs and availability                                                                                      | Administration     |
| FR-17 | Manage base/fabric/printing/per-side/customization prices, promotions/discounts and versioned calculation rules                                                                     | Pricing/admin      |
| FR-18 | Manage draft, awaiting contact, pending confirmation, confirmed, in production, ready, delivered and cancelled states; preserve event history                                       | Orders/admin       |
| FR-19 | Manage homepage content, offers, contact/social settings, notices and lead-time messaging; pause new order acceptance without disabling editing/browsing                            | Content/admin      |
| FR-20 | Authenticate administrators, enforce roles on server/data boundaries and audit significant changes                                                                                  | Security/admin     |
| FR-21 | Export transparent, separate front/back print artwork at configured physical dimensions/resolution, excluding mockups/editor UI; validate fonts/assets                              | Printing           |
| FR-22 | Centralize provisional tokens and brand assets; replace them with official identity without recreating the logo or scattering color literals                                        | Design system      |

## Interfaces and constraints

Browser-to-server requests are untrusted: IDs, quantities, money, file metadata and document transforms all require validation. Browser operations use canonical design data through a canvas adapter; server operations call domain functions through application services. No canvas-native JSON is a durable contract. Future schema validation may use Zod after contracts exist.

The public catalog returns published material only. Guest order operations use a scoped guest intent, not broad anonymous database rights. Admin operations require authenticated, fresh authorization. Storage object paths and database IDs are not credentials. The intended flow and error transitions are defined in [ordering](../architecture/ordering.md).

Initial UI language, currency/decimal rules, tax/delivery treatment, supplier limits and browser support floor remain U. Arabic and English design text support is C independently of the UI locale choice. Phase 00 uses an Arabic starter page for owner review without deciding the final localization strategy.
