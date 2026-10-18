# UX direction, editor structure and provisional design system

Status: direction **R**; brand preservation and mobile-first behavior **C**. Official identity/locale choices remain U-01/U-05. Phase 00 is a foundation screen, not the commercial homepage.

## Experience and information architecture

Make clothing/design the focus of the future storefront. Use deliberate typography, breathable spacing and optimized garment photography once approved. Discovery emphasizes three understandable paths: buy a design, customize a template, start from blank. Prices/availability and a sizing guide belong near garment decisions. Avoid an admin-like grid of unrelated controls in the shopping experience.

The studio groups tasks into **Garment**, **Artwork**, **Layers**, **Review**. Garment controls select full variants; artwork tools add images/text/shapes; layers expose selection/ordering/locking; review shows both sides, warnings, garment options and price. File actions handle two local projects, portable import/export and preview download. Keep print boundaries visible while editing and explain what lies outside them. Review must distinguish a garment preview from production art.

Desktop recommendation: compact top bar for file/undo/side switch, canvas center, tools on one side, contextual properties/layers on the other. Only show properties relevant to selection. Provide numeric position/size/rotation inputs as alternatives to dragging. Do not represent advanced tools as unexplained icon-only controls.

Mobile recommendation: large canvas viewport, front/back switch, bottom tool rail, one contextual sheet at a time and persistent review action above safe-area insets. Text entry uses a real accessible input/textarea if required by the engine; keep it reachable when the software keyboard opens. Define one-finger object drag versus canvas pan, pinch zoom and selection gestures; offer visible buttons for every critical gesture. Avoid disabling page/browser zoom globally.

In-app browser handling: save before leaving for WhatsApp, offer a second explicit open action after upload completes, retain copy-message fallback, and explain when downloads require opening in the system browser. Do not assume file pickers, downloads or background tabs behave identically to full browsers. Phase 02 tests the actual devices/apps.

## Tokens and assets

`src/styles/tokens.css` owns all provisional color values and system-font fallbacks. `globals.css` maps those semantic tokens into Tailwind theme values. Components use semantic utilities (`bg-canvas`, `text-ink`, `border-line`, `text-muted`, `outline-focus`) rather than hex values. Temporary palette values are deliberately labeled in source and in the starter screen; they are not official brand specifications.

Token layers: future approved primitives → semantic roles (canvas/surface/ink/muted/accent/focus/line) → reusable component states when real components exist. Include spacing, typography, radius, motion and elevation tokens as actual design needs emerge. Add state tokens for error/warning/success when those interfaces are implemented; do not invent unused abstractions now.

Existing `docs/brand/onyx-brand-reference.jpeg` is preserved unchanged as a reference. Do not crop/reconstruct/retrace the hanger mark or extract purported official hex codes from a JPEG. The starter uses the brand name as ordinary text, not a replacement logo. When the owner supplies assets: record origin/rights/version, choose optimized delivery variants without altering proportions, add approved public assets, update centralized tokens/fonts, verify Arabic coverage/metrics and retest contrast/layout/performance. Keep working design files out of runtime bundles.

Fonts for site UI and printable artwork have separate roles and licensing requirements. A system UI fallback is acceptable in Phase 00 but cannot guarantee reproducible print text. Artwork fonts need a versioned allowlist, embedding/redistribution rights and actual glyph testing.

## Accessibility and responsive acceptance

Target [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/). Semantic headings/landmarks, visible focus, useful labels and logical tab order are baseline. Text contrast aims at 4.5:1 (large text 3:1); controls/focus need discernible contrast. Target 44 px touch areas where practical. A DOM object list and labeled property forms expose canvas state; announce selection/save/validation changes without flooding live regions.

Respect reduced motion and avoid attention-demanding loops. Future CTA motion must not delay navigation or obscure focus. Dialogs/sheets handle focus entry, escape, focus return and background interaction correctly. Errors include explanations and recovery actions, not color alone. Do not use muted availability styling that makes its label unreadable.

Validate 320/390/768/1280 CSS-pixel layouts, 200% zoom, landscape rotation and long Arabic labels. Use logical CSS properties for RTL; keep brand/product names and numeric values properly isolated when mixed with Arabic. Final UI language is unresolved, but Arabic/English artwork must work regardless of interface direction. Phase 01 produces approved wireframes and an asset inventory before a real storefront is implemented.
