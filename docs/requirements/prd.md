# Product requirements document

Status: consolidated requirements for owner review, 2026-10-18. Labels follow [documentation status](../README.md).

## Product and customers

**C:** ONYX is a premium custom-apparel brand initially serving Syria. Hoodies printed with DTF are the first major category. Instagram, TikTok, and influencers lead customers into discovery, customization, review, and a manual WhatsApp conversation. A streetwear/fashion identity, mobile usability, and understandable customization are essential.

Primary users: shoppers buying an existing design; shoppers modifying a template; customers starting from blank; authorized staff curating stock/content/prices and coordinating production. Initial customers need no accounts. Administrators require authentication and permission checks.

## Outcomes and boundaries

**C:** Customers can choose an actual available variant, edit both sides, retain their work, review a server-validated price, and explicitly send an order request in WhatsApp. Staff can identify the exact design and quoted price and manually confirm payment/delivery. Opening WhatsApp is not a sale or proof of message delivery.

**R:** Pilot success measures: task completion without assistance, recovery success, abandonment at review/handoff, invalid variant rejection, time to prepare a valid print, and reprint rate. Establish numerical business targets with the owner before pilot; do not collect tracking or personal data merely to populate metrics. No fabricated revenue targets.

## Confirmed capabilities

- Storefront: premium hero with purposeful motion and primary design CTA; secondary collection CTA; featured designs with prices/availability/order/customize paths; data-driven categories; offers; how-it-works; brand/founder/social/contact/policy footer; product, template, category, about, contact, sizing and policy pages.
- Studio: front/back mockups and print areas; images, Arabic/English text, shapes; transforms, multi-select, grouping, alignment/distribution, layers, undo/redo, grid/snapping/guides, locking, duplication/deletion, zoom/pan. Mobile uses touch patterns and contextual panels.
- Product options: garment type and hood configuration where offered, fabric/color/size, validated against complete sellable variants.
- Persistence: portable editable import/export, preview download, and exactly two recent automatic local project slots including assets.
- Ordering: validated server pricing, private uploaded project/preview, internal order reference, controlled share link, and explicit WhatsApp sending. Manual payments and delivery.
- Administration: catalog/variants/availability/optional stock; templates/categories; pricing/promotions; orders/statuses; content/settings; notices/preparation times; pause new orders while editing/browsing remain usable; roles and audit history.
- Printing: distinct mockup, editable document, and print output; transparent per-side high-resolution artwork with physical scale, asset/font handling, and configurable supplier specifications.

## Product constraints

The existing ONYX logo must be preserved. Official colors, fonts, and assets are pending. No payment gateway, mandatory customer login, general-purpose image suite, or 3D editor in the proposed first release. Image adjustments/filters remain planned; advanced processing is deferred. Phase 00 delivers documents and a minimal local app only.

## Risks and unresolved inputs

Arabic shaping/caret behavior and mobile export limits need experiments. Printing needs supplier samples and specifications. Catalog, currency, pricing formulas, delivery/refund policies, brand kit, rights to artwork/fonts, staff roles and data retention need owner decisions. See [the decision register](open-questions.md). Supplier/provider availability and real network performance in target locations must be checked before infrastructure selection is final.
