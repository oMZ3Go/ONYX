# ADR 0002 — Recommend Konva/react-konva behind an ONYX-owned model

Original hypothesis: 2026-10-18. Updated: 2026-11-21, Phase 03.2 Milestone 1.

Status: **accepted by the owner for Milestone 2**, 2026-11-22. **Konva 10.10.0 + react-konva 19.3.2** are now the production artwork renderer. The earlier Fabric-first hypothesis was evaluated, not treated as a decision. The comparison below remains the original M1 evidence; M2 validation is recorded in the [implementation report](../../phase-03/phase-03.2-milestone-2.md).

M2 implementation refinement, 2026-11-23: Konva renders the artwork projection with listening disabled. ONYX owns DOM selection boxes/handles and the shared pointer coordinator, rather than enabling a second native Transformer gesture owner. This preserves accessible DOM controls, uniform multi-selection transforms and cancellation tokens. It adds custom handle maintenance; the choice does not invalidate the measured native Transformer feasibility. Artwork-only canvases receive bounded DPR × camera-zoom backing resolution and high-quality interpolation. Garment alpha masking is a separate CSS presentation layer, outside the document and future export tree.

## Evidence and rationale

The [measured comparison](../../spikes/canvas-engine-results.md) and [reproducible harness](../../../experiments/canvas-engine/README.md) compare Konva/react-konva, Fabric 7.4.0 and custom SVG/DOM with shared fixtures. All build under the installed **Next 16.4.6 / React 19.3.1**, display Arabic/English test strings, and support the exercised mouse/emulated-touch drag path. Native Konva/Fabric resize and rotation controls generate one completion event in the measured cases. All can render to an isolated transparent surface after explicit output-size handling.

Konva's declarative scene projection works with canonical ONYX data and React state without adopting renderer serialization. Its Transformer is sufficient for the tested single-object operation paths; the adapter must still normalize dimensions, enforce locks and own gesture transactions. This matches the existing shell's React ownership and keeps interaction overlays separate from artwork. Performance is not an evidenced distinguishing advantage here; the measured update-to-animation-frame timings are largely frame limited.

Fabric remains viable and has a useful editing-oriented object model. The experiment required explicit object reuse/update, active selection synchronization, and awaited canvas disposal. Its editable Textbox does not remove ONYX's need for bilingual caret/IME review, accessible DOM controls or canonical history. The comparative text path uses a common DOM textarea; it does not prove Fabric's built-in text editing is better or worse. Its measured route JavaScript is smaller than the full Konva binding in this harness, so bundle size is not a reason to prefer Konva.

SVG/DOM has the smallest measured route JavaScript and straightforward native text semantics. The implemented pointer/handle prototype demonstrates feasibility but exposes custom work: resize anchor policy differs from the native controllers, and multi-select, snapping, groups, touch arbitration and stable export font embedding still need ONYX implementation. It remains a fallback for a narrower object set, rather than the recommended professional manipulation engine.

## Decision constraints

- Canonical v2 documents, asset manifests and commands are authoritative. Engine objects are disposable projections, never the persistence format.
- Use the [integration boundary and coordinate contract](../editor-integration.md). Preserve shell/layout/docks/Pin/localization/camera. The existing camera and new artwork handlers need a shared pointer owner before interaction is enabled.
- Use a DOM text editor with explicitly resolved fonts; retain original Unicode. Full Arabic reviewer, caret/IME and native mobile-keyboard acceptance remains open.
- Allocate exact output pixel dimensions independently of viewport/DPR. The first experiment exposed truncation to 3543×4133 in both canvas engines' default multiplier paths; explicit 3544×4134 allocation fixed the synthetic case. This is not a production export implementation or supplier approval.
- Preview coordinates are versioned mockup reference pixels until approved physical registration exists. Later mm conversion is an explicit operation; do not assign invented physical dimensions.
- Keep only the selected engine in a future production graph. Other engines and their lockfile remain confined to the isolated experiment.

## Acceptance boundary and remaining gates

The historical [hard-gate rubric](../../spikes/canvas-evaluation.md) is **not fully passed**. No weighted score is assigned: a numeric average would hide unverified real Android/iOS and embedded-browser behavior, native Arabic/IME review, screen-reader flow, retained mobile memory, full text/layout fidelity and portable-package/persistence tests. Persistence and production-export gates belong to separately authorized milestones; they are not claimed complete by this architecture work.

This ADR asks for approval to proceed with the bounded M2 implementation using Konva, not permission to declare the full editor or print pipeline production-ready. If real-device or text gates fail, fix the adapter/text strategy and retest; reopen the engine decision if failures require it. Every engine upgrade must rerun the pinned compatibility/geometry/text fixtures. Changing engines must not require changing saved document semantics.

All three engine packages are MIT licensed; the bundled fixture font packages use OFL-1.1. Exact package/lockfile versions, audit result, measurement scope and limitations are recorded with the experiment. Upstream compatibility guidance is supporting context only: [react-konva repository](https://github.com/konvajs/react-konva), [Fabric API](https://www.fabricjs.com/api/), [SVG coordinate specification](https://www.w3.org/TR/SVG2/coords.html). The recommendation rests on the local experiments and ONYX integration requirements.
