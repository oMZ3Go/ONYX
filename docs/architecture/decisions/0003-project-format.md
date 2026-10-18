# ADR 0003 — ONYX-owned editable document and portable package

Date: 2026-10-18. Status: **recommended; validate in Phase 02 before implementation**.

Confirmed constraints: versioned editable import/export, required assets, two browser-local projects and distinct preview/print artwork. Recommendation: canonical JSON with explicit physical coordinates and a ZIP `.onyx` transport containing manifest, document and original assets. IndexedDB stores canonical data/Blobs directly; it need not repeatedly compress ZIPs during autosave.

Compared alternatives: engine-native JSON couples saved work to a renderer and omits asset/font guarantees; JSON+Base64 is portable but grows bytes/memory; remote-only references fail offline portability and outlive signed URLs. A ZIP package adds decompression/schema/asset-validation complexity, so enforce budgets and treat every import as hostile data. Only embed licensed fonts; preserve editable source text even if production outlines are generated separately.

Approve only after round-trip/migration, corrupt-package rejection, offline restore, font fidelity and mobile memory experiments pass. The schema is a proposal, not a published file-format compatibility promise. See [document strategy](../design-documents.md) for policies and the spike for measurable evidence.
