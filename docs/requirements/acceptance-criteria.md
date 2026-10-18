# Acceptance and traceability matrix

Future product gates, not executed tests. Each row links SRS IDs to observable evidence and the phase responsible. Owner approves the final release scope; P07 verifies the combined journeys.

| Requirements | Acceptance example                                                                                                                                                 | Evidence / phase                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| FR-01–02     | Changing published featured/category/offer data changes discovery; deep link opens correct item; missing content has useful empty state; required pages accessible | Integration/E2E + responsive review, P03/P06   |
| FR-03        | A color available in M but not XL is disabled for XL; forged XL request rejected server-side                                                                       | Catalog unit/integration, P05                  |
| FR-04        | Editing back leaves front unchanged; zoom/device rotation keeps physical transforms; output excludes mockup                                                        | Spike fixtures + P04 tests                     |
| FR-05–06     | Arabic/English edits survive save/import; grouped transforms and 50 undo/redo actions restore canonical state; locked object cannot move/delete until unlocked     | P02/P04 experiment and tests                   |
| FR-07        | 600 px image printed 100 mm wide reports 152.4 PPI; alpha remains; upsampling does not erase warning                                                               | P02/P04/P07 fixtures                           |
| FR-08        | Customer completes add/edit/review on touch device; keyboard and screen-reader alternatives work; external handoff retains work                                    | P01/P04/P07 usability review                   |
| FR-09        | Export/import round-trip works offline with embedded assets and licensed fonts; malformed/newer version rejected without data loss; preview includes garment       | P04 compatibility/malicious package tests      |
| FR-10        | Edit A/B, revisit A, create C: replacement names B; cancel preserves A/B; approved successful write leaves A/C; quota or interruption leaves original slots intact | P04 IndexedDB fault tests                      |
| FR-11/17     | Altered client total ignored; current rules produce exact amount; accepted snapshot persists unchanged after later price changes                                   | P05 pricing golden cases and admin integration |
| FR-12        | Double-click/retry with same intent creates one order; partial upload has no handoff; changed payload on same key rejected                                         | P05 concurrent/failure injection tests         |
| FR-13/18     | Opening or cancelling WhatsApp never confirms order; manual contact and staff action drive transitions; no binary attachment promised                              | P05/P06 E2E with no real sending               |
| FR-14        | A's token cannot read B, production assets or admin endpoints; expired/revoked links fail; raw object public access denied                                         | P05/P07 security tests                         |
| FR-15–16     | Authorized staff update actual variants/templates; public sees only published assets; read-only staff cannot mutate                                                | P06 role matrix tests                          |
| FR-19        | Pause rejects new finalizations even with bypassed UI; editing/export and browsing still function; notice and lead time editable                                   | P05/P06 integration                            |
| FR-20        | Invalid/stale staff authorization denied; catalog/price/status changes record actor, timestamp, before/after or revision                                           | P06/P07 auth/audit tests                       |
| FR-21        | Configured test area exports exact pixel dimensions with alpha; no grid/mockup; missing font blocks validated export; supplier accepts physical sample             | P02/P04/P07                                    |
| FR-22        | One token-file update changes UI colors; original logo file/hash remains untouched; temporary values labeled                                                       | P00/P01 review                                 |
| NFR-01–12    | Evidence meets the documented targets or a named exception is accepted before release                                                                              | P02 measurements + P07 release dossier         |

Phase 00's separate Definition of Done is in [the roadmap](../roadmap/phases.md): source preservation, consolidated documents, planned spike, minimal bootable application and actual tool-check evidence. Product acceptance is not claimed by a passing starter test.
