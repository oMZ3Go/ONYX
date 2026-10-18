# ONYX — Master Project Initialization & Phase 00

You are acting as the **Principal Software Architect, Senior Full-Stack Engineer, Senior UI/UX Designer, Technical Lead, and Quality Assurance Architect** for ONYX.

We will build ONYX together, incrementally, with professional engineering standards.

Treat ONYX as a real commercial product intended for public launch, not a demonstration, tutorial, or throwaway prototype.

Prioritize correctness, maintainability, performance, security, user experience, and practical business value. Do not select technologies merely because they are familiar or easy.

**Your immediate task is to establish the project foundation and complete Phase 00. Do not attempt to implement the entire product in this task.**

---

# 1. Project Environment

The current development environment is:

- Operating system: Windows 11.
- IDE: Visual Studio Code.
- AI coding assistant: Codex inside VS Code.
- Local project directory: `D:\ONYX`.
- GitHub repository: `https://github.com/oMZ3Go/ONYX`.
- Default branch: `main`.
- Git is already initialized.
- The GitHub remote `origin` is already configured.
- The repository currently has no commits.
- The local workspace already contains `00_PROJECT_BRIEF_AR.md`, `01_CODEX_START_PROMPT.md`, and the `docs/` directory.
- The currently installed Node.js version is v25.2.1, with npm v11.7.0.
- Node.js 24 LTS is the preferred development runtime. Check the environment, document any compatibility concern, and recommend switching to LTS. Do not silently change system-wide Node installations.

## Critical instructions

1. Work directly inside `D:\ONYX`.
2. Do not clone the repository again.
3. Do not create a nested `ONYX` directory.
4. Inspect the existing workspace before modifying anything.
5. Read both existing Markdown files before starting.
6. Preserve useful existing documentation and incorporate it into the new structure.
7. Do not delete or overwrite existing files unnecessarily.
8. Do not push, deploy, or create production infrastructure without explicit approval.
9. Do not install unnecessary dependencies.
10. Maintain clear separation between confirmed business requirements, architectural recommendations, and unresolved decisions.

---

# 2. Product Vision

ONYX is a modern, premium custom-apparel brand initially targeting customers in Syria.

Its first major product category is customizable hoodies, printed using Direct-to-Film (DTF) technology.

The product combines:

- An elegant fashion e-commerce storefront.
- A responsive and interactive 2D garment customization studio.
- Ready-made designs that customers can purchase or modify.
- A centralized system for clothing variants, pricing, availability, and design templates.
- An administration dashboard.
- A simplified ordering workflow through WhatsApp.

The primary customer acquisition channels will initially be Instagram and TikTok, including influencer marketing.

A typical customer journey is:

Instagram/TikTok → ONYX Website → Explore Designs or Create a Design → Customize Hoodie → Review Product → Order via WhatsApp.

The website should communicate a distinctive streetwear/fashion identity rather than resemble a generic online shop or administrative application.

---

# 3. Official Visual Identity

ONYX already has its own brand identity.

The existing logo integrates the word ONYX with the silhouette of a clothing hanger.

Its current visual direction includes dark navy, charcoal, muted blue, and light neutral tones.

However, the complete professional brand identity package is NOT available yet.

The owner will soon provide:

- Official logos in PNG and potentially vector formats.
- Official brand colors.
- Typography recommendations, if available.
- Additional visual identity guidelines and assets.

## Rules

- Do not redesign, replace, or reinterpret the existing ONYX logo.
- Do not generate a new logo.
- Do not permanently finalize brand colors or typography.
- Do not invent an official brand book.
- Treat currently available visual references as provisional.
- Design the application around a centralized token-based design system.
- Use temporary, clearly labeled design tokens wherever official values are missing.
- Make replacing temporary assets with final brand assets straightforward.
- Avoid hardcoded colors throughout components.

The intended experience is premium, contemporary, elegant, and visually distinctive.

Use animations with purpose, not excessive decorative effects.

---

# 4. Storefront Requirements

The storefront must be fully responsive and mobile-first.

## 4.1 Homepage

The homepage should include:

### Hero Section

- Premium clothing-focused visual presentation.
- Attractive but optimized animations.
- Showcases of ONYX hoodies or designs.
- A prominent animated "Start Designing" CTA.
- A secondary CTA to explore the collection.

### Featured Designs

- Curated ready-made hoodie designs.
- Product previews.
- Prices and availability.
- Direct ordering.
- An option to customize an existing design.

### Design Categories

Examples include:

- Cars.
- Anime.
- Typography.
- Minimal.
- Abstract.
- Other categories controlled by administrators.

Categories must be data-driven rather than permanently hardcoded.

### Offers

- Active promotions.
- Featured collections.
- Admin-controlled offer visibility.

### How It Works

Briefly communicate the customization and ordering workflow.

### Footer

- Brand information.
- Founder information.
- Social links.
- Contact information.
- Relevant store policies.

The architecture must support adding and modifying content through the future administration dashboard.

## 4.2 Other Storefront Pages

Plan for:

- Product detail pages.
- Collection/category browsing.
- Ready-made template details.
- Basic brand/about information.
- Contact information.
- Sizing guide.
- Appropriate store-policy pages.

The initial release should not require customers to create accounts.

---

# 5. ONYX Design Studio

The Design Studio is the most technically important part of the platform.

It is a specialized apparel editor, not a general-purpose Photoshop replacement.

Customers should be able to customize clothing directly inside their browsers.

## 5.1 Garment Preview

The editor should provide:

- An interactive 2D hoodie preview.
- Front and back views.
- Switching between garment sides.
- Realistic but efficient garment mockups.
- Separate printable regions for each side.
- Visible print boundaries when editing.
- Zoom and pan controls.
- Proper scaling across desktop and mobile devices.

Garment mockup artwork and printable design artwork must be separate.

## 5.2 Editing Tools

Plan for:

- Adding and positioning images.
- Adding and editing text.
- Support for Arabic and English text.
- Editable shapes.
- Moving, rotating, and resizing elements.
- Multi-object selection.
- Grouping and ungrouping.
- Horizontal and vertical alignment.
- Distribution tools.
- Layer management.
- Bring forward/send backward.
- Undo and redo.
- Optional grid display.
- Snapping and alignment guides.
- Object locking.
- Zoom controls.
- Safe deletion and duplication of elements.

The interface must remain approachable for inexperienced customers.

## 5.3 Images and Filters

The editor should eventually support:

- Image uploads.
- Transparency.
- Basic image adjustments.
- Grayscale.
- Contrast and brightness.
- Dithering effects.
- Additional effects where practical.

Advanced image-processing features may be postponed until after the first usable release.

Do not build expensive image-processing infrastructure prematurely.

## 5.4 Clothing Customization

Customers should be able to select:

- Garment type.
- Hoodie with or without a hood, where available.
- Fabric type.
- Color.
- Size.
- Available product variants.

Unavailable colors or combinations must appear disabled or visually muted.

Availability must be evaluated per actual product variant, not merely per color.

## 5.5 Mobile Experience

Do not simply shrink the desktop editor.

Design a touch-first interface using appropriate patterns such as:

- Bottom toolbars.
- Contextual property panels.
- Bottom sheets.
- Touch-friendly controls.
- Gesture-based movement and scaling.
- A persistent and accessible order/review action.

Prioritize usability inside mobile browsers and Instagram/TikTok in-app browsers.

---

# 6. DTF Printing Requirements

**Confirmed printing technology: Direct-to-Film (DTF).**

The editing system must distinguish between:

1. The garment mockup.
2. The editable design document.
3. The final print-ready artwork.

The final printable artwork must not contain the hoodie mockup, editing grid, selection borders, or editor controls.

Plan for:

- Transparent-background exports.
- Independent front/back artwork.
- Physical print dimensions.
- Resolution validation.
- High-resolution raster export.
- Correct handling of transparent regions.
- Warnings for poor-quality uploaded images.
- Consistent coordinate systems independent of screen resolution.
- Proper handling of fonts and embedded design assets.
- A versioned editable document format.

Use 300 PPI at physical print size as an initial working assumption only, subject to confirmation with the actual print provider.

Do not assume final print dimensions, supported fabric dimensions, printer color profiles, RIP settings, or white-ink processing.

These details remain unresolved until the production workflow is documented.

The architecture must allow print specifications to be configured later.

---

# 7. Design Files and Local Persistence

Customers must be able to:

- Export their editable ONYX design project.
- Import a previously exported project.
- Download a preview of their customized hoodie.
- Continue editing without starting over.

Introduce a proposed versioned project format such as `.onyx`.

The exact file format should be evaluated and documented before implementation.

A possible approach is a versioned package containing project metadata, object data, and embedded or referenced assets.

Do not assume that the canvas library's native JSON serialization alone is a sufficient long-term storage format.

## Last Two Projects

**Confirmed requirement:**

Automatically preserve the most recent two editable projects locally in the customer's browser.

Preferred technology: IndexedDB.

Requirements:

- Preserve the editable state and required assets.
- Restore projects when the user returns.
- Clearly indicate locally saved projects.
- Maintain only the two most recent automatic project slots.
- Avoid silently overwriting a project without an appropriate recovery or replacement policy.
- Provide a way to delete locally saved projects.
- Explain that browser storage may disappear if site data is cleared.
- Support explicit export as a more portable backup mechanism.

Do not store large binary assets in localStorage.

---

# 8. Initial Ordering System

There will initially be no integrated online payment gateway.

Payments, delivery arrangements, and final customer communication will be handled manually through WhatsApp.

The approved ordering architecture is:

1. The customer finishes customizing a garment.
2. The customer clicks "Order Now".
3. The system validates the garment selection and design.
4. The backend recalculates the final displayed price.
5. The editable design project and preview are uploaded securely to Supabase Storage.
6. A draft order record is created with an internal order reference.
7. A secure sharing mechanism provides controlled access to the design.
8. WhatsApp opens with a prefilled message containing the order reference, product summary, price, and design/order link.
9. The customer explicitly sends the message.
10. The business handles confirmation, payment, and delivery manually.

## Important WhatsApp limitation

WhatsApp click-to-chat links cannot automatically attach arbitrary binary project files.

Therefore, the initial system will share a link to the uploaded project rather than promise automatic binary attachment.

Do not assume WhatsApp messages can be sent automatically without a separate approved API integration.

Opening WhatsApp does NOT automatically mean the customer submitted or confirmed the order.

Document order states accordingly.

## Security requirements

- Customer project files must not be placed in unrestricted public storage.
- Avoid permanently exposing raw storage objects.
- Design an appropriate scoped share-link mechanism.
- Consider expiration, revocation, and link-token security.
- Do not expose administrator access through customer links.
- Prevent unauthorized access to other customers' projects.
- Apply upload size, type, and rate restrictions.
- Ensure repeated order clicks do not accidentally create unlimited duplicate orders.
- Do not trust customer-provided prices.
- Preserve an immutable pricing snapshot for each order.

Do not implement the complete WhatsApp/Supabase workflow during Phase 00.

Document it and its unresolved technical decisions.

---

# 9. Administration Dashboard

ONYX requires an authenticated administration interface.

Administrators should eventually manage:

## Product Catalog

- Products.
- Clothing types.
- Fabric options.
- Colors.
- Sizes.
- Product variants.
- Availability.
- Stock information, if inventory tracking is enabled.

## Design Library

- Templates.
- Categories.
- Template thumbnails.
- Editable template projects.
- Featured designs.
- Template availability.

## Pricing

- Base garment prices.
- Fabric-dependent pricing.
- Printing costs.
- Front/back printing charges.
- Customization charges.
- Discounts and promotions.
- Price calculation rules.

The pricing engine should be centralized and independently testable.

## Order Management

Plan for states such as:

- Draft.
- Awaiting customer contact.
- Pending confirmation.
- Confirmed.
- In production.
- Ready.
- Delivered.
- Cancelled.

Distinguish automatically created draft orders from confirmed sales.

## Website Content

- Homepage sections.
- Featured products.
- Promotions.
- Contact information.
- Social media links.
- General notices.

## High Demand Mode

Administrators must be able to:

- Display a configurable high-demand notice.
- Communicate increased preparation times.
- Temporarily pause acceptance of new orders without disabling browsing or design editing.

## Administrative Security

- Secure authentication.
- Role-based authorization.
- Server-side permission checks.
- Audit logs for important administrative changes.
- Proper separation between public and administrative APIs.

---

# 10. Proposed Technical Architecture

The following technology choices are initial recommendations, not unquestionable commitments.

Evaluate them based on project requirements.

## Frontend

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui where appropriate.
- Motion for React for selected animations.
- Zustand for suitable interactive client state.
- Zod for validation.

## Canvas / Design Editor

Evaluate:

- Fabric.js.
- Konva.js with React integration.

Do not finalize this choice without a focused technical proof of concept.

The evaluation must consider:

- Editable Arabic/English text.
- Multi-selection.
- Object transformations.
- Layers.
- Serialization.
- Import/export.
- High-resolution print output.
- Mobile interactions.
- Performance.
- Maintainability.
- Integration with React and TypeScript.

Document the recommendation as an Architecture Decision Record.

## Backend

- Prefer a modular monolith.
- Next.js server-side capabilities where suitable.
- PostgreSQL as the primary relational database.
- Supabase as the initially preferred database/storage/authentication provider.
- Explicit separation between domain logic and infrastructure integrations.

## Testing

- Unit tests using Vitest.
- End-to-end tests using Playwright.
- TypeScript type checks.
- Linting and formatting.
- Build validation.
- Accessibility and responsive testing.

## Deployment

Vercel is a potential future hosting provider but is NOT required for local development.

Do not introduce hosting-provider-specific coupling without a good reason.

Keep deployment decisions open until the project is ready for preview hosting.

---

# 11. Engineering Principles

Apply the following principles:

- Modular architecture.
- Clear separation of concerns.
- Strong typing.
- Testable domain logic.
- Small and reviewable changes.
- Avoid unnecessary dependencies.
- Avoid premature abstractions.
- Avoid microservices for the initial product.
- Avoid unnecessary customer authentication.
- Avoid premature payment integration.
- Avoid speculative features.
- Prefer stable and well-maintained libraries.
- Pin appropriate dependency versions and commit the lockfile.
- Use accessible, semantic UI components.
- Design for mobile performance and SEO.
- Keep secrets out of the repository.
- Validate sensitive operations on the server.
- Design database access with least privilege.
- Plan Row Level Security for all exposed Supabase data.
- Keep business rules configurable where appropriate.
- Document assumptions instead of silently inventing them.

The public GitHub repository must never contain credentials, private access tokens, production customer data, or sensitive environment files.

---

# 12. Phase 00 — Tasks to Execute NOW

Perform the following work in order.

## Task A — Repository Inspection

Inspect:

- Current Git state.
- Remote configuration.
- Existing files.
- Existing project documentation.
- Current tooling.
- Node/npm versions.

Report anything unexpected.

Do not overwrite existing work.

## Task B — Requirements Consolidation

Create a clear and internally consistent documentation set.

Suggested structure:

`docs/requirements/`

- Product Requirements Document (PRD).
- Software Requirements Specification (SRS).
- User journeys and workflows.
- MVP scope.
- Functional requirements.
- Non-functional requirements.
- Acceptance criteria.
- Open business questions.

Separate:

- Confirmed requirements.
- Recommended features.
- Deferred features.
- Unresolved decisions.

Use the existing Arabic project brief as an input, not as an infallible source.

The confirmed requirements in this prompt supersede older conflicting assumptions.

## Task C — Architecture Documentation

Create:

`docs/architecture/`

Document:

- High-level system architecture.
- Module boundaries.
- Data flow.
- Preliminary domain model.
- Proposed database entities and relationships.
- Design-document storage strategy.
- Pricing-engine boundaries.
- Ordering and WhatsApp handoff architecture.
- Storage security approach.
- Frontend/backend responsibilities.
- Future deployment considerations.

Do not create production database tables.

## Task D — Design and Print Documentation

Create:

`docs/design/`

Document:

- Initial UX direction.
- Desktop and mobile interaction patterns.
- Editor information architecture.
- Preliminary design-system structure.
- Brand asset integration approach.
- Accessibility requirements.

Create:

`docs/printing/`

Document:

- DTF export pipeline.
- Printable-region handling.
- Physical dimension calculations.
- Resolution validation.
- Transparent export requirements.
- Open questions for the printing provider.

Do not finalize colors or visual assets until the official brand package arrives.

## Task E — Technical Spike Planning

Create a detailed proof-of-concept specification for comparing Fabric.js and Konva.js.

Define measurable experiments and acceptance criteria.

Do not implement the complete design editor in Phase 00.

## Task F — Bootstrap the Application

If the inspected repository confirms that no application exists, initialize a clean, minimal Next.js application directly in the current workspace.

Requirements:

- TypeScript.
- App Router.
- Tailwind CSS.
- Sensible source directory organization.
- Minimal responsive starter page.
- Basic linting.
- Basic formatting configuration.
- Vitest setup for future unit tests.
- A minimal working test.
- A suitable `.gitignore`.
- `.env.example` without real credentials.
- A README with installation and development instructions.
- A documented Node.js runtime recommendation.

Choose a practical folder structure without creating excessive empty abstractions.

Preserve the existing documentation.

Do not build the real storefront, editor, dashboard, or ordering system yet.

## Task G — Verification

Where the environment permits, run:

- Dependency installation.
- Linting.
- Type checking.
- Unit tests.
- Production build.

Clearly report actual results.

Do not claim tests passed unless you executed them.

If the current Node.js version causes issues, document the issue and identify the required corrective action.

## Task H — Roadmap

Create:

`docs/roadmap/`

Include:

- Phase 00: Foundation and requirements.
- Phase 01: UI/UX and brand integration.
- Phase 02: Editor technical proof of concept.
- Phase 03: Storefront implementation.
- Phase 04: Design Studio.
- Phase 05: Backend, pricing, and ordering.
- Phase 06: Administration dashboard.
- Phase 07: Integration, security, and testing.
- Phase 08: Pilot release and deployment.

For every phase, define:

- Objective.
- Deliverables.
- Dependencies.
- Acceptance criteria.
- Key risks.
- Definition of Done.

Provide a dependency-aware execution order. Adjust the proposed ordering if technically justified and document why.

---

# 13. Explicitly Out of Scope for Phase 00

Do NOT:

- Implement the complete homepage.
- Build the complete editor.
- Implement the administration dashboard.
- Create production Supabase resources.
- Implement actual customer file uploads.
- Implement the WhatsApp order flow.
- Implement online payments.
- Create production-ready DTF exports.
- Generate new official brand assets.
- Deploy the website.
- Purchase or configure domains.
- Push changes to GitHub.
- Modify unrelated repositories.
- Introduce unnecessary background services.

Do not create a large amount of placeholder functionality that has no real behavior.

Keep Phase 00 focused and verifiable.

---

# 14. Expected Final Report

When the work is complete, report:

1. Repository inspection results.
2. Exact files created or modified.
3. Application structure.
4. Technical decisions and reasoning.
5. Assumptions and unresolved business decisions.
6. Node.js environment status.
7. Dependency and test results.
8. Security or architecture concerns.
9. Recommended next steps.
10. Whether Phase 00 meets its Definition of Done.

Provide the final executive summary in Arabic, while retaining standard technical terminology in English where appropriate.

Do not automatically continue into the next phase.

**Stop after Phase 00 and wait for owner review and approval.**

Remember: ONYX is intended to become a real commercial brand and platform. Build the foundation deliberately, keep the architecture practical, and prioritize production quality over generating a large amount of code.