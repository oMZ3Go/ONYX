# ADR 0002 — Canvas selection requires comparative evidence

Date: 2026-10-18. Status: **proposed; decision pending Phase 02 spike**. No canvas package installed or winner claimed.

ONYX needs editable Arabic/English text, touch transformations, grouping, layers, faithful portable documents and physically sized transparent exports. Native serialization alone is not the durable model.

Recommendation: evaluate Fabric.js first as a hypothesis because its editing-oriented object/text controls may reduce custom editor code; implement the same bounded harness in Konva/react-konva for comparison. Konva's React integration may fit declarative UI well, while text editing may require an accessible DOM overlay. These are implementation hypotheses, not measured superiority or guaranteed Arabic support.

Both candidates must meet [the spike's hard gates and weighted rubric](../../spikes/canvas-evaluation.md). Arabic shaping/caret/IME, corrupt-import isolation, mockup-free print fidelity and mobile recovery cannot be traded for a higher average score. Record installed versions, maintenance/license review, representative devices, raw measurements, integration effort and failures. If neither passes, narrow/rework the text/rendering strategy and rerun the failed gate; do not silently choose a winner.

After evidence, amend this ADR with accepted engine, adapter contract, constraints and rejected alternative rationale. Phase 04 depends on that acceptance. Keep canonical schema independent so engine replacement/migration remains possible.
