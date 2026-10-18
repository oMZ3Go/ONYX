# ONYX — Project Brief / Phase 00
**Version:** 0.1 — Draft for review

**Date:** 2026-10-18
**Status labels:** ✅ Confirmed by founder · 💡 Proposed pending approval · ❓ Unknown

## 1. Product vision
✅ ONYX is a Syrian apparel brand with a premium, mobile-first storefront and a responsive 2D custom garment editor. Initial emphasis: hoodies. Customers arrive primarily from influencer campaigns on Instagram/TikTok. In the initial launch, payment, delivery arrangements, and order follow-up happen manually through WhatsApp.

**Success principle:** customers must be able to discover, personalize, preview, and request a printable garment in a few understandable steps. The editor is not a general graphic-design application.

## 2. Confirmed business requirements
- ✅ Home page with premium animated hero, clear design CTA, featured premade hoodie designs, categories (cars, anime, etc.), editable designs, offers, and footer with brand/founder information.
- ✅ Responsive on all screen sizes, with mobile touch as a first-class interaction.
- ✅ 2D garment preview, front/back, changing garment type, color, size and fabric.
- ✅ Display unavailable colors/variants as disabled rather than silently offering them.
- ✅ Edit images, text and shapes; move/resize/rotate; multi-select; alignment; undo/redo; optional grid.
- ✅ Image processing including dithering is desired; suggested as a post-MVP feature until validated.
- ✅ Live price; customer clicks order and proceeds to WhatsApp.
- ✅ Import/export editable ONYX project files.
- ✅ Admin dashboard for products, fabric, variants, stock, templates, pricing rules, site settings and high-demand notice.
- ✅ Printing method: **DTF — Direct to Film**.

## 3. Proposed decisions to validate
- 💡 Three shopping paths: buy an existing design, customize an existing design, create from blank.
- 💡 No account required to place an initial request; protected admin access only.
- 💡 Before redirecting to WhatsApp, persist the order and immutable price snapshot; produce a unique order reference and a secure, expiring asset link. Opening WhatsApp is not equivalent to a confirmed order.
- 💡 Use a modular monolith: Next.js / React / TypeScript; PostgreSQL & object storage; avoid premature microservices.
- 💡 Canvas engine chosen after proof of concept (Fabric.js vs Konva.js), especially Arabic RTL text, touch interactions, serialization, and print exports.
- 💡 MVP means a limited set of garment templates and editor tools. Advanced filters, background removal and 3D preview are out of MVP scope.
- 💡 Mobile UI uses bottom sheets rather than squeezing desktop sidebars.

## 4. Core user journeys
### A. Order premade design
Social post → deep-linked product/template page → choose available variant → inspect price and preview → request order → ONYX saves pending order → open WhatsApp with order number/link → admin confirms manually.

### B. Customize template
Home/category → pick template → studio → modify design → validate print safety → review size/color/fabric/price → save draft → request order → WhatsApp handoff.

### C. Design from scratch
Start Designing → select product variant → blank front/back print zones → add images/text/shapes → adjust alignments/layers → inspect low-resolution warnings → export project (optional) → request order.

### D. Admin
Sign in → update available variants, price rules, designs and offers → inspect pending WhatsApp requests → confirm or cancel requests → update production stages → toggle high-load notice or disable new requests.

## 5. Domain model (conceptual, not DB schema)
- GarmentProduct: apparel style and descriptive content.
- GarmentVariant: garment + color + size + fabric + sellable availability and stock.
- PrintArea: physical width/height and constraints per garment style, variant, and side.
- DesignDocument: versioned, editable art elements (front/back), original asset references, dimensions and metadata.
- DesignTemplate: shareable product art plus editorial catalog information.
- PricingRule: versioned garment cost, print side/area or complexity, options, discounts and margin policy.
- QuoteSnapshot: computed server-side amount, currency, quote validity / effective rule revision.
- Order & OrderItem: immutable selected option/design/price snapshot plus lifecycle status.
- OrderAsset: protected production export and preview, not public customer media by default.
- AdminUser, AuditEvent, SiteSettings, Promotion.

## 6. DTF production contract (provisional)
- ✅ DTF is the physical printing method.
- 💡 Separate the garment mockup and shadow overlays from the print artwork. Mockup must **never** be part of final print raster.
- 💡 Save the editable source document with vector-like objects, uploaded original images, front/back design layers and **physical dimensions** independent of display resolution.
- 💡 Use transparent PNG (RGBA) export as the first candidate format; final accepted file format depends on print supplier/RIP workflow.
- 💡 Candidate target = 300 PPI at *actual output size*, not simply setting 300-DPI metadata on a low-pixel image.
- 💡 Warn about effective raster resolution of enlarged user images; warn about areas outside printable safe zone.
- 💡 Handle sRGB preview; do not promise perfect garment color matching. Obtain printer/supplier color profile and white-underbase/RIP requirements.
- 💡 Maintain per-side print files and production audit/preview.
- ❓ Maximum print dimensions (cm) per garment style and size.
- ❓ Minimum line width and text size that remain legible on the actual transfer.
- ❓ White underbase, semi-transparency, gradients, halftones, anti-aliasing, and transparency handling of the supplier's RIP software.
- ❓ Whether the supplier needs transparent PNG, PDF, TIFF or gang sheets; whether they perform mirroring.

**Pixel calculation:** `ceil(width_cm / 2.54 * target_ppi)` and similarly for height. Example only: 30 × 35 cm at 300 PPI ≈ 3544 × 4134 pixels. These are NOT assumed ONYX print-zone measurements.

## 7. Functional requirements — first release
- FR-01: user may navigate templates by category and directly visit a shareable URL.
- FR-02: user may begin from blank or edit a premade design.
- FR-03: editor supports front and back and respects print-area boundaries.
- FR-04: editor supports text, raster image, basic shapes, move/scale/rotate, grouping or multi-select, layer ordering, undo/redo, grid and alignment.
- FR-05: product variant choices are validated against admin-specified availability; unavailable options are disabled.
- FR-06: visible price recalculates as relevant options change, and authoritative quote is recalculated on server.
- FR-07: editable design imports and exports with schema-version validation.
- FR-08: a new order request stores the actual art revision, product variant and price snapshot *before* external WhatsApp handoff.
- FR-09: WhatsApp handoff sends a text message with order reference and protected order-view link; it must NOT promise automatic file attachment.
- FR-10: admin manages products, variants, templates, pricing, offers, demand notice and order status.
- FR-11: draft restoration and error handling prevent avoidable work loss.
- FR-12: customer personal data and production files are access-controlled and minimized.

## 8. Quality and security acceptance gates
- Mobile touch interactions do not fight page scrolling; editor tools are reachable on narrow screens.
- Undo/redo and serialized re-import restore the same logical design.
- PNG export renders only printable content at the configured physical scale and retains alpha transparency.
- An intentionally low-resolution uploaded image produces a warning.
- The server rejects disabled variants and tampered prices, even if the UI is bypassed.
- No client-bundled privileged database/service-role keys; protected assets use scoped access.
- Staff cannot modify price rules without suitable authorization; changes are audited.
- Keyboard focus visibility, readable labels and reduced-motion preference are considered.
- Playwright end-to-end tests cover creation, export, variant changes and WhatsApp handoff (using test links rather than sending live messages).
- No production deployment or paid services without explicit owner approval.

## 9. Open business decisions, in priority order
1. DTF supplier/printer specifications and maximum print size on each garment.
2. Initial SKU list: first garment silhouettes (hoodie with hood, sweatshirt without hood, etc.), size charts and actual fabric choices.
3. Exact sellable colors per garment/size/fabric and how stock is counted.
4. Price basis: garment, per-side DTF transfer, area-dependent printing, add-ons, discounts and delivery fees.
5. Languages (Arabic only or Arabic + English), currency, shipping coverage, refund/reprint policies.
6. Phone/WhatsApp business number, messaging format, fulfillment team roles.
7. Rights to published templates, use of licensed art and customer-uploaded copyrighted images.
8. Approved brand kit and original garment mockup assets.

## 10. Delivery plan
- P00: requirement confirmation, DTF production contract, repository conventions, PRD/SRS and acceptance tests.
- P01: UX flows, wireframes, mobile-first mockups and approved design system in Figma.
- P02: technical spike: Fabric.js vs Konva.js with Arabic text, touches, alignment, serialization and DTF export.
- P03: storefront + catalog + deep links.
- P04: production-grade design studio + project import/export.
- P05: product options, pricing, order persistence and WhatsApp handoff.
- P06: admin controls + order lifecycle + audit.
- P07: security, performance, accessibility, QA, pilot users and sample print verification.
- P08: launch readiness, domain, hosting and controlled release.

## 11. Immediate Codex request
Only inspect an existing ONYX repository if present. If none exists, ask for the intended new repository/project location before writing production code. Draft docs and spike plan. Do not provision paid resources or deploy. Document assumptions separately; do not fabricate print-zone measurements, SKU prices or supplier requirements.

## References for provisional DTF guidance
- DTF supplier file preparation: https://dtf.nl/en-US/aanleverspecificaties
- Next.js local development: https://nextjs.org/docs/app/getting-started/installation
