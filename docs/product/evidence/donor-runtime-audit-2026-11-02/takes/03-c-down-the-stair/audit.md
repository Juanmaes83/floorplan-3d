# 03-c · Down the stair — runtime audit

## Professional service

Helps an architect explain how one hillside house connects its street, bedroom and garden levels through the stair while retaining the section as the common spatial reference. A measured section gains depth and material, the camera descends from street kitchen through bedroom and living levels to the pool, then returns to the whole material section. The donor's Casa Graó, level numbers and studio copy remain authored examples, not Rubik project data.

## Identity and capture

Pinned donor: `Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6`. Frozen Rubik: `Juanmaes83/floorplan-3d@0f9c6ead9732901681498efec326d1ca92e42ffe`. Standalone: `https://sam1983aing.github.io/flat-to-3d/03-open-section/index.html?dir=c`. RAW: `C:\Users\temp123\donor-runtime-audit-RAW-2026-11-02\03-c-down-the-stair`. Three independent clean-context Discovery passes reached B and returned to scroll origin. The first portrait semantic pass failed at WebM encoder stop and remains in RAW; `semantic-correction-1` is the verified portrait pass.

## Observed A→B

| Milestone | Observed change | Desktop approximate native start / center / end | Pinned source |
|---|---|---|---|
| M01 | The initial 1:100 ink cut opens into a lit perspective section while preserving the stair, slabs, hillside and pool. | 0.03 / 0.07 / 0.1 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:03-open-section/page.js:61-83,92-107,190-212; engine.js:109-230,561-592 |
| M02 | The section-facing view frames the street-level kitchen, dining table and roof lantern above the stair. | 0.11 / 0.16 / 0.21 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:03-open-section/page.js:61-83,101-105,116-155; engine.js:561-592 |
| M03 | The camera descends the same stair to the bedroom landing and glazed cypress courtyard. | 0.25 / 0.32 / 0.37 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:03-open-section/page.js:61-83,101-105,116-155; engine.js:561-592 |
| M04 | The view descends to the double-height living room, library wall and garden glazing. | 0.43 / 0.49 / 0.54 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:03-open-section/page.js:61-83,101-105,116-155; engine.js:561-592 |
| M05 | The camera crosses the garden-level living room toward the terrace and cantilevered pool. | 0.57 / 0.63 / 0.67 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:03-open-section/page.js:61-83,101-105,116-155; engine.js:561-592 |
| M06 | The camera pulls back from the pool to the same three-level house and stair spine. | 0.66 / 0.7 / 0.74 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:03-open-section/page.js:61-83,101-105,190-212; engine.js:561-592 |
| M07 | The house returns to a measured material section; portrait first shows its left half. | 0.76 / 0.8 / 0.83 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:03-open-section/page.js:61-83,101-105,190-212; engine.js:491-513,561-592 |
| M08 | The interactive section yields to the studio's authored service copy and project facts on the same page. | 0.87 / 0.9 / 0.93 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:03-open-section/page.js:116-155,190-212; index.html:194-227 |
| M09 | Selected-work cards, contact call to action and footer close the standalone page. | 0.94 / 0.98 / 1 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:03-open-section/index.html:194-227 |

PLAN.c opens the initial cut, descends from street kitchen and lantern past the bedroom courtyard to the double-height living room and pool, pulls back to the same material section, then ends in studio copy, selected work and footer. Portrait shows left and right material-section halves as separate M07/M07R states. Landscape retains overlapping desktop overlays at 844×390. These are independent 03-c observations; 03-a has a different PLAN and scroll calendar.

## Reverse and lifecycle

Natural B→A was recorded without reload/reset. All three A0/A1 screenshots are visually equivalent for cut geometry, hero/HUD and route/scroll origin. Passive A1 metadata retains caption and room text absent at A0. Donor `page.js:121-129` removes show classes but does not clear this text. Full UI state is `NOT_RESTORED`; hidden object/resource identity is `NOT_OBSERVED`. Atlas U04 had previously recorded residual caption after 03C reverse, and this audit confirms it.

## Source, Cuts and Rubik

`PLAN.c` at `page.js:61-83` supplies a 1250vh authored vertical descent with its own stops and room cards. `stateAt`, `readScroll/frame` and `engine.js:resolve/place` connect native scroll, smoothed internal vh and section-facing camera. `colourAt/withColour` and `updateCaps` retain registered geometry through the material transition. Cut 1 D02/D06 and the Atlas support bounded frame/style mechanisms while rejecting the fixed donor house and PLAN as Rubik authority. Current Rubik already has Section, Story, route, geometry, mobile UI, lifecycle and outputs; the 12-dimension crosswalk distinguishes their integration/orchestration from any missing capability. All bridge candidates are `implementationAuthorized:false`.

## Unknowns

Exact internal donor resource identity after reverse and product suitability remain bounded `NON_BLOCKING` unknowns. There are no blocking unknowns in the final take record.
