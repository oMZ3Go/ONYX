# Design documents, assets and local persistence

Status: **R** architecture satisfying confirmed portability and two-slot requirements. See [format ADR](decisions/0003-project-format.md). No import/export or autosave is implemented yet.

Phase 03.2 M1 added the tested [v2 document/migration and editor integration contract](editor-integration.md). Approved M2 now initializes the live editor through that migration and keeps canonical v2 documents in browser memory across locale navigation. Reload starts a new project; there is no project persistence. The v2 parser is not a portable-package decoder and does not validate asset bytes or supplier authorization. Current catalog originals have a reproducible digest/dimension manifest and integrity tests. [M2 implementation](../phase-03/phase-03.2-milestone-2.md) records commands, rendering and preview-only silhouette masking.

## Canonical document

Use an ONYX-owned schema with `schemaVersion`, project ID, revision, creation/update times, garment/variant references and snapshot, print-spec revision, per-side print areas and ordered object trees, asset manifest and font manifest. Nodes are discriminated types (image, text, shape, group), with stable IDs, visibility/lock state and finite transforms. Text preserves Unicode content, language/direction, font identity/version and supported styling. Object names are plain text.

Recommended document coordinate unit: millimetres, top-left origin per side, x right/y down, explicit rotation convention. UI language does not mirror the physical coordinate system. Define origin, matrix order and group transform semantics before adapter implementation. Zoom/device-pixel ratio belongs to viewport state, never persisted physical geometry. Avoid arbitrary precision loss through repeated adapter conversions.

Until physical calibration exists, v2 uses explicitly tagged `preview-px` coordinates tied to original mockup identity/revision. Those pixels are not millimetres or printable dimensions. Approved calibration permits an explicit reviewed conversion to `mm`, never an implicit reinterpretation. See the executable affine mapping and migration tests linked from the integration contract. Groups remain unsupported pending an explicit schema rule.

Garment mockup IDs/references are preview metadata and never print objects. Render adapter translates canonical objects to Fabric/Konva; export adapter renders canonical artwork into an isolated surface. Preserve originals of raster assets for quality analysis and print output. Canvas engine state is disposable, not authoritative.

## Candidate portable `.onyx` package

```text
manifest.json       format/schema versions, file sizes/digests and compatibility
document.json       canonical editable objects and physical specifications
assets/<digest>     original validated image bytes
fonts/<digest>      only redistributable licensed fonts, if embedding permitted
preview.png         optional convenience image, never trusted as canonical data
```

ZIP container is recommended for efficient embedded binary assets. Compare against JSON with Base64 (size/memory overhead) and remote-reference JSON (not portable). Portable exports must include required asset bytes; do not export expiring signed URLs as the only source of assets. Font references are acceptable only where the supported font bundle can be resolved reliably; unresolved fonts must block faithful export/print with an actionable message. Outline-only text can be a separate production artifact; it cannot replace editable source text.

Schema versions support explicit migrations on copies. Unknown newer major versions fail safely; supported older versions migrate with fixture tests. Missing/corrupt assets fail before replacing active work. Never evaluate serialized code, HTML, scripts or canvas class names from imports. Reject path traversal, duplicate paths/IDs, invalid transforms, object/depth count excess, decompression bombs, MIME/signature mismatches, external fetch URLs and inconsistent digests. Bounds apply to compressed bytes, expanded bytes, individual dimensions and decoded pixels. Limits are U-14, informed by spike measurements.

Digests detect corruption/deduplicate; they do not establish trust in customer data. Validate again on server before an order becomes usable. Never silently discard unsupported objects. Include migration/render version in production evidence so a later engine update cannot invisibly alter an accepted design.

## Exactly two automatic local slots

IndexedDB holds project records and Blob assets, with one logical database transaction covering slot metadata/document/asset references. Avoid large binary data in localStorage. Track `lastEditedAt` only on successful edits; simply viewing a project does not evict another. A stable project ID gets one slot, not a new slot for every undo step.

1. First/second project saves to an empty slot. Display “saved on this device” only after commit.
2. Editing a saved project updates that slot atomically after an idle debounce; a bounded pending change can be lost on an abrupt crash, and the UI must not overpromise.
3. A third new/imported project identifies the least recently edited saved project and offers **export and replace**, **replace**, or **cancel**. Stage validation in memory; until consent, keep the two existing slots and clearly mark the current new work unsaved if editing is allowed.
4. On approved replacement, transactionally install the new valid document/assets and replace the selected slot. Failure rolls back; garbage-collect assets only when no saved project references them. No persistent third automatic recovery slot.
5. Deleting a slot requires a clear action/confirmation with backup opportunity. Shared blobs remain while referenced. Clear local history never deletes an already-created server order.

Use optimistic revision checks and cross-tab notifications to prevent lost writes. A stale tab must request reload or explicit fork; never overwrite newer work automatically. Autosave after meaningful committed operations; debounce continuous drag. A closing-tab event is not a reliable place to begin the only save. History can be bounded in memory; document/assets, not the entire undo log, are required for restoration.

Quota denial, private mode, storage eviction and corrupted databases show a persistent unsaved/recovery state and portable export option. Request persistent storage only as a best-effort enhancement; browser storage is never a guaranteed backup. Warn that clearing site data or changing browser/origin removes access to local projects. Schema upgrades and failed replacements require fault-injection tests in P04. [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) supplies asynchronous structured and Blob storage; the recovery policy above is an ONYX proposal.
