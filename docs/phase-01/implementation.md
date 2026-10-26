# Phase 01 — Landing page implementation

Historical baseline. The current refinements, including the 15-second headline hold and confirmed contact information, are documented in [Phase 01.1](../phase-01.1/implementation.md). Durations and verification below describe Phase 01 as delivered.

Status: local Phase 01 implementation, finalized for owner review on 2026-10-20. This scope is authorized by the owner's Phase 01 brief and bilingual amendment, superseding the older roadmap's documentation-only P01 scope. The finalization pass is limited to review, verification, browser-path reliability and documentation; a separate visual/motion refinement phase awaits approval. No editor, backend, ordering, commit, push, merge or deployment is included.

## Recovery checkpoint

On resumption, `feat/landing-page` contained only package/lockfile changes. `next-intl`, Fontsource Inter and Noto Sans Arabic, Playwright and Sharp were installed completely; no Node/npm process remained. Existing `.cache/phase-01/asset-audit.json` and contact sheet were reused. The original attachment was accessible. Figma and asset inspections were not repeated.

## Reference and identity

The Figma integration returned the actual [ONYX Landing Page V2](https://www.figma.com/design/WKlvXnxgnQmiyf1NbE0c7E/ONYX-Landing-Page?node-id=6-2) screenshot, metadata and desktop design context (`6:9093`, 1440 × 2554). The first canvas context request returned a selection error; the subsequent child-frame request succeeded. Both desktop and mobile compositions were visually inspected. The reference uses crops of a flattened reference photograph; the owner's newer requirement explicitly takes precedence: implement with the independent local layers, never use that screenshot as page content.

Official colors: charcoal `#243136`, navy `#1A3651`, primary blue `#8AA9BA`, light gray `#DDDDDD`. All supporting color roles live in `src/styles/tokens.css`; color values shown in the decorative palette are display labels for these tokens. Existing logo PNGs are used without modification. Inter and Noto Sans Arabic are self-hosted variable UI fonts from pinned Fontsource packages (SIL OFL licenses in their packages), an implementation choice pending owner typography approval. No external font request occurs at runtime.

Intentional differences from Figma: four identical Drip Logo presentation cards; no invented price, swatches, discounts, stock, shipping or payment guarantees; no cart/search/favorite/newsletter controls; no fabricated addresses/social URLs/policies. Category cards are editorial inspiration, without fake navigation arrows. Offers is an editorial campaign banner. Start Designing and Customize lead to an accessible localized, temporary studio notice. Contact leads to the footer's honest pending-contact notice. The explicit preview caption must remain until genuine products are supplied.

## Shared locale architecture

`app/[locale]/layout.tsx` owns the root HTML, including server-rendered `lang` and `dir`, local fonts and the skip link. The old hardcoded root layout/page are removed. A single shared page serves `/ar` and `/en`; both are statically prerendered. `src/proxy.ts` redirects `/` using a validated `ONYX_LOCALE` cookie or Arabic, retaining the query string. Browser Accept-Language never overrides the owner's default. Unknown preference values fall back to Arabic.

`next-intl@4.14.9` declares Next 16 and React 19 compatibility; installed Next is 16.4.2, React 19.3.1. Its routing plugin/proxy and supported `requestLocale`/`setRequestLocale` APIs are used. The official current `next/root-params` alternative was reviewed; explicit locale props keep these small presentational components independent of request context. No app-wide client translation provider or duplicated page is needed. See [Next internationalization](https://nextjs.org/docs/app/guides/internationalization) and [next-intl routing](https://next-intl.dev/docs/routing/setup).

All UI copy is in `messages/ar.json` and `messages/en.json`; `Messages` derives from the English dictionary and both dictionaries are checked for matching leaf keys. Server code loads only the selected dictionary and passes small translated prop groups into interactive islands. Product descriptions/titles are localized product data, not UI translations. Proper nouns and branded English artwork remain unchanged. CSS logical properties control layout, button order and navigation. Images/logos are never mirrored; only directional UI arrows and the decorative cursor change orientation.

The language switch uses Next Link/router navigation, retains route/query/hash, and stores a supported locale in a one-year SameSite=Lax cookie (Secure under HTTPS). No client effect changes document language. Localized titles/descriptions and relative language alternates are supplied. There is no invented canonical domain. `noindex` remains deliberately enabled while fixtures and unavailable-feature notices are present.

Future feature DoD: both route directions, dictionary key parity, localized metadata and accessibility labels, localized product DTOs, URL context preservation, mobile keyboard/touch checks and reduced-motion coverage. Do not add untranslated text directly to a feature component.

## Components and read boundaries

- Server composition: SiteHeader, SiteFooter, HeroSection, FeaturedProducts/ProductCard, CategoryGrid, HowItWorks, OfferBanner, BrandStory and HandwrittenNote. Static section trees stay on the server.
- Client islands: LanguageSwitcher, native disclosure MobileNavigation, AnimatedHeroHeadline and PageMotion. No global state library, editor runtime or backend SDK is loaded.
- `modules/catalog/contracts.ts` is a read-only projection of the existing documented Product/ProductVariant concepts, not a competing schema. It supports localized text, optional image/category/color/price and variant availability. Money is represented with integer minor units, explicit currency/scale, and formatted with Intl. It performs no quote calculation.
- `CatalogReader.getFeatured()` returns a variable-length collection of ProductSlot values. `read-catalog.ts` selects the provider. `fixture-provider.ts` owns exactly one sample ProductDisplay and creates four unique presentation slot keys referencing the same object. There are no four invented domain IDs or database records.
- A real provider must return authorized published products, each in one slot keyed by its genuine identity, with `preview: false`. Remove four-slot repetition and the fixture provider before public release. Omit unknown price/availability; never infer inventory from a color swatch or photograph. UI already accepts zero/one/many slots without restructuring ProductCard. Availability is derived from supplied variants, not independent invented stock.

## Asset evidence and delivery

All 19 provided PNGs were inspected: three logos and 16 landing assets. Backgrounds and five category images are opaque by design. All logos, garments, model and notes have real alpha with fully transparent pixels; none was identified as an opaque-background cutout requiring manual removal. Combined hero/model have alpha maxima of 254, which are retained rather than incorrectly forced to 255.

The audit checked dimensions, ratios, alpha extrema, transparent-pixel fractions and visible bounds (alpha > 16). Significant bounds in original pixels:

| Asset                 | Canvas      | Visible bounds (x0,y0–x1,y1) | Composition consequence                                                                    |
| --------------------- | ----------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| Combined hero hoodies | 1536 × 1024 | 49,43–1508,1023              | One indivisible layer, lower edge already clipped in source; overscan covers floating edge |
| Offer hoodie          | 1122 × 1402 | 0,175–1121,1401              | Top transparent padding accounted for in vertical position                                 |
| Drip Logo             | 1254 × 1254 | 39,20–1210,1238              | Contain within product canvas, preserve silhouette                                         |
| Story model           | 1536 × 1024 | 199,14–1467,1023             | Height-controlled layer keeps the head visible                                             |
| Story people note     | 1086 × 1448 | 95,61–1038,1423              | Independent, unmirrored layer over the sky                                                 |
| Story wear note       | 793 × 1983  | 77,155–736,1871              | Separate vertical slot alongside copy                                                      |

`asset-inventory.json` lists every source, SHA-256, dimensions/alpha and derivative dimensions/bytes. `npm run assets:optimize` reproducibly creates WebP delivery assets under `public/images/landing/web/` with alpha quality 100, original aspect ratios, no background removal and no source changes. The 16 PNGs total 28,643,393 bytes; derivatives total 1,231,630 bytes (95.7% reduction). Next Image supplies responsive widths; backgrounds use fill/cover and garments use preserved proportions. Critical hero layers and header logo load eagerly; other artwork uses lazy loading. Derived images remain independent, never flattened together. Original PNGs and Illustrator files are untouched. There is no added ring or foreground stone.

## Motion and lifecycle

The signature animation uses a small deterministic timeline and direct DOM transforms, with no frame-by-frame React state. Native Web Animations handles environmental motion and reveals; this avoids a general animation library for one bounded sequence. Each transform has one owner: hero entrance → floating wrapper → hover wrapper; story parallax → depth wrapper. No systems overwrite the same transform.

| Active time             | Action                                                        |
| ----------------------- | ------------------------------------------------------------- |
| 0–450 ms                | Empty visual composition, cursor appears                      |
| 450–1000                | Cursor exits                                                  |
| 1000–2400               | Whole first line arrives with eight handles                   |
| 2400–3450               | Release first line; cursor exits again                        |
| 3450–4850               | Whole second line arrives selected                            |
| 4850–5400               | Context-click indication                                      |
| 5400–6300               | Three-color menu, cursor travels to Primary Blue              |
| 6300–6750               | Only second line transitions to brand blue                    |
| 6750–7750               | Cursor travels to measured CTA geometry                       |
| 7750–8250               | CTA pulse, never a navigation click                           |
| 8250–8550               | Cursor fades out                                              |
| Next exactly 30,000 ms  | Stable completed heading, no scheduled animation frames       |
| Next 800 + 500 + 400 ms | Cursor returns, group selection, simultaneous delete, restart |

The idle clock starts on the rendered frame that actually hides the cursor; frame rounding cannot shorten it. Visibility/offscreen suspension removes pending callbacks and retains elapsed active time. Resume never counts hidden time. ResizeObserver measures line sizes and CTA positions; RTL uses the corresponding geometry and entry side. Unmount, locale changes, Strict Mode reinitialization and motion preference changes clean up observers, listeners, frames and timeouts. Deterministic tests cover these boundaries. A single semantic H1 has a full accessible name; visual spans, handles, palette and cursor are excluded from repeated announcements. The overlays cannot receive pointer input.

The server fallback is the completed heading. Enhancement starts in a layout effect, without CSS that could permanently hide content when JS fails. If hydration occurs more than 750 ms after first contentful paint, the completed fallback receives a full idle hold before deletion, avoiding an abrupt blanking of text already being read. Reduced motion displays the completed localized heading immediately and cancels the sequence. The footer includes a manual motion toggle.

Environmental cycles: hero 0 to −10 px in a 7-second round trip, hover scale 1.03/glow; offer −4 to +4 px in 8 seconds; model scale 1 to 1.02 with 2 px displacement in 9 seconds. Desktop story parallax is bounded to 14 px background / 7 px model with passive scroll and at most one animation frame, never React scroll state. Continuous environmental motion is paused offscreen/hidden and disabled for coarse-pointer/touch devices. Notes reveal independently and scale gently on hover. Card reveals, horizontal copy reveals and notes use separate presets; process connectors reveal once. Initial CSS entrances do not block interaction or replay on ordinary rerenders.

## Responsive and accessibility choices

Desktop retains the reference's dark/light editorial rhythm, four product columns, five categories, three process steps and layered campaign/story panels. Mobile stacks hero copy/artwork, uses a two-column product/category grid with a full-width fifth category, a vertical process, a separate offer artwork strip and a stacked story. The header switches to a native details/summary menu below 1100 px; Escape closes it and restores summary focus. It is a disclosure, not a modal, so it does not trap focus or make false modal claims. Menu links, CTAs and language controls remain real links. Most interactive targets are at least 44 px high; focus remains visible. No scroll hijacking or whole-page overflow hiding is used to mask layout defects.

## Verification and environment notes

See `report-ar.md` for the completed check ledger and practical limitations. Screenshots, local metrics and browser traces are stored in ignored `.cache/phase-01/`, `test-results/` and `playwright-report/`; these are evidence, not runtime assets. CI uses Node 24/npm ci, format/lint/type/unit/build, then Chromium E2E, with no deployment job.

This Windows sandbox's alternate user identity was rejected by SWC's native-cache ownership validation. The native package was installed and intact; setting a workspace cache did not solve the trust check. Running Next typegen/dev/build/start with the ordinary user permissions resolved it, without reinstalling, changing ACLs, weakening PowerShell policy or modifying dependencies. Use `npm.cmd` in this PowerShell environment. Chromium was downloaded once into `.cache/ms-playwright`. `npm run test:e2e` now invokes `scripts/run-playwright.mjs`, which automatically chooses that existing workspace cache unless an explicit `PLAYWRIGHT_BROWSERS_PATH` or CI environment is present. Direct Playwright/measurement commands still need the explicit path to reuse this installation. The standard CI browser path requires no override. The runner never downloads browsers automatically; after a future Playwright upgrade, install the matching browser revision in the intended cache.
