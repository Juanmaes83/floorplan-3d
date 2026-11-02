# 06 · Card Model — runtime audit

## ¿Qué problema profesional o de cliente resuelve?

Lets an architect explain to a client how one physical 1:100 study model relates to the spatial scale and lived rooms of the proposed house. The same house and contoured site move from card and desk into a materialized exterior/interior visit, reveal a nested model in the study, and return to the original card presentation. The donor's named house, centimetre/metre readout and studio copy are authored presentation, not verified Rubik project data.

## Identity and capture

Donor pinned: `Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6`. Rubik frozen baseline: `Juanmaes83/floorplan-3d@0f9c6ead9732901681498efec326d1ca92e42ffe`. Standalone: `https://sam1983aing.github.io/flat-to-3d/06-card-model/index.html`. RAW: `C:\Users\temp123\donor-runtime-audit-RAW-2026-11-02\06-demo-card-model`. Original A0 began during automatic card assembly in all three viewports; those six original attempts are retained but superseded. Discovery-correction-1 waits for complete hero assembly/copy and records natural A→B→A, WebM, NDJSON and 5% samples independently at 1440×900, 390×844 and 844×390. Semantic-correction-1 starts another clean context for M01–M14, continuous WebM and passive camera/HUD telemetry.

## Observed A→B

| Milestone | Observed semantic change | Approximate native transition start / center / end | Pinned causal source |
|---|---|---|---|
| M01 | The camera approaches the card house on its layered contour board; a 1:100 desk versus 1:1 house scale readout appears. | 0.03 / 0.05 / 0.08 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:184-223,246-307,420-451; js/desk.js:292-340,316-390 |
| M02 | The camera descends toward a small human figure at the card model's entry, making its scaled height tangible. | 0.14 / 0.18 / 0.2 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:270-307,420-451,545-557; js/desk.js:412-425 |
| M03 | A bright sweep begins over the same model, with card and materialized house appearances overlapping. | 0.22 / 0.25 / 0.28 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:97-108,479-526; js/sweep.js:12-104 |
| M04 | Glass, dark mullions, planted ground and finished materials appear on the same house and site while workshop references still surround it. | 0.29 / 0.32 / 0.36 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:479-526; js/sweep.js:12-104; js/real.js:367-445 |
| M05 | The now materialized house is seen from outside with its balcony, stair, glazing and garden relation legible. | 0.37 / 0.4 / 0.43 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:454-468,487-526; js/real.js:367-445 |
| M06 | The camera approaches the glazed facade and balcony at house scale. | 0.44 / 0.46 / 0.49 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:227-242,454-468; js/real.js:367-445 |
| M07 | The route enters the living and dining interior; furniture, bookcase and upper gallery belong to the same house. | 0.49 / 0.51 / 0.54 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:227-242,463-468; js/real.js:446-745 |
| M08 | The camera drops to a lower interior view under the table, with the stair, shelving and daylight still spatially continuous. | 0.55 / 0.58 / 0.61 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:227-242,463-468; js/real.js:446-745 |
| M09 | A small card model appears on a desk in the full-size house's upper study, beside books and a lit task lamp. This is a nested model inside the real house, not yet the return to the original workshop desk. The capture filename retains the preliminary slug for traceability. | 0.62 / 0.65 / 0.68 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:227-242,463-468; js/real.js:746-780 |
| M10 | The route reveals the upper study and living area with terrace beyond the glass; the workshop drawings remain visible outside the donor scene. | 0.68 / 0.7 / 0.73 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:227-242,463-468,545-568; js/real.js:706-780 |
| M11 | The route reaches the terrace as lighting darkens; rail, lounge chairs, planted ground and interior glass relation remain identifiable. | 0.74 / 0.77 / 0.8 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:235-244,470-474,479-526; js/real.js:367-445 |
| M12 | The house is again seen at desk scale while a luminous boundary and scale readout accompany the return toward card representation. | 0.82 / 0.85 / 0.88 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:470-526; js/sweep.js:12-104 |
| M13 | The card house and contour board are back on the cutting mat with 1:100/1:1 scale readout and desk tools. | 0.88 / 0.91 / 0.94 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:483-526,545-576; js/desk.js:292-340,316-390 |
| M14 | The workshop darkens and the editorial final message appears over the same card house. | 0.95 / 0.98 / 1 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:06-card-model/js/page.js:529-576; index.html:57-66; css/page.css:158-184,208-239 |

The model descends to a figure, the same roof/glazing/balcony/site gains real materials through an amber spatial front, the camera visits living and upper study, encounters a separate small card model of the same house inside that study, backs out to the terrace, and returns through the front to the original card presentation. M09's early filename slug `desk-context-return` is retained for file traceability; its state is the nested model on the study desk, not the original workshop return. B is evidenced by stable final copy, max natural scroll and additional wheel with no new transformation.

## Reverse and restore

B→A is recorded without reload/reset. In all corrected viewports the assembled card house, contour board, headline/HUD and scroll origin are visually equivalent at A0/A1. The formal verdict is `VISUALLY_EQUIVALENT`, since hidden resource identity is `NOT_OBSERVED`. The reverse video is available for material/front/light timing; no separate reverse-only semantic state is established. The 844×390 donor layout overlaps the final headline and header, classified `DONOR_LIMITATION`; portrait final copy remains legible.

## Source, Cuts/Atlas, Rubik and gaps

`houseParts` supplies both primary card and real house. `desk.js` makes the thick layered card site and oversized desk; the main model does not carry a global .01 scale. `real.js` places a distinct .01 miniature inside the upper study. `page.js` maps native scroll to smoothed chapters, a scale-weighted dive, interior route, back-out, radius and lamp/end copy. `sweep.js` uses a fixed bulb center, growing/contracting radius, complementary material discard, narrow additive seam, light contribution separation and matching depth discard. Cut3 D14/D15 and Global already document those mechanisms; the present runtime confirms and extends temporal/mobile/restore evidence. Historical Atlas 06 records the recursive study and return; its earlier roadmap language is not adopted.

Rubik current already owns project geometry/units, framing, Story seek/camera/lifecycle, route, material/light and outputs. The exact physical card representation and radius-driven dual-state front are separate, bounded gaps; neither implies Rubik lacks general geometry, light or scale. The 12-dimension crosswalk, source locators, gaps, candidate bridges (all `implementationAuthorized:false`), technical prerequisites, QA invariants and explicit unknowns are in `reconciliation.json` and `manifest.json`. No product fusion, priority or implementation is decided.

## Known unknowns

Hidden donor render-resource identity after reverse and later product suitability remain `NON_BLOCKING`. No blocking unknown is asserted after corrected capture and source review.
