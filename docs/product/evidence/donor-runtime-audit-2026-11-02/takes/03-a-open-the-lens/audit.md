# 03-a · Open the lens — runtime audit

## ¿Qué problema profesional o de cliente resuelve?

Helps an architect explain what rooms and vertical movement lie behind one hillside section drawing while keeping the cut readable as perspective, material and light are introduced. One technical 1:100 section opens its lens without losing the cut, gains material and sunlight, visits stair/rooms/pool and returns to a material section before editorial service copy. The authored site, level values, labels and studio CTA are donor content, not Rubik project data.

## Identity and capture

Rubik baseline `0f9c6ead9732901681498efec326d1ca92e42ffe`; donor `Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6`; standalone `https://sam1983aing.github.io/flat-to-3d/03-open-section/index.html?dir=a`. RAW: `C:\Users\temp123\donor-runtime-audit-RAW-2026-11-02\03-a-open-the-lens`. Desktop and landscape Discovery were repeated from `window.__ready` because their original A0 was still entering; original attempts remain untouched. Portrait Discovery A0/A1 was visually stable. Semantic portrait and landscape were repeated after correcting viewport-specific targets; a final semantic correction waits for loader readiness in all viewports. Only the corrected attempt paths in `reconciliation.json` are used for validation.

## Observed A→B

| Milestone | Observed change | Desktop approximate native transition start / center / end | Pinned causal source |
|---|---|---|---|
| M01 | The flat 1:100 hillside section gains perspective while retaining the same stair spine, three levels, pool and slope. | 0.02 / 0.07 / 0.11 | 03-open-section/page.js:29-70,92-107; engine.js:561-592 |
| M02 | An orange spatial front crosses the section as material, sky, landscape and sunlight appear over the same cut geometry. | 0.11 / 0.17 / 0.22 | 03-open-section/page.js:70-107,199-211; engine.js:109-230,590-614 |
| M03 | The camera moves closer to the continuous stair and the first room chapter identifies the stair spine. | 0.25 / 0.31 / 0.35 | 03-open-section/page.js:29-70,101-110,118-155; engine.js:561-592 |
| M04 | The street-level kitchen, dining area and roof lantern occupy the section window while the same stair remains adjacent. | 0.36 / 0.42 / 0.46 | 03-open-section/page.js:29-70,101-110,118-155; engine.js:561-592 |
| M05 | The view follows the stair down to the bedroom level and cypress courtyard beyond the glazing. | 0.47 / 0.52 / 0.56 | 03-open-section/page.js:29-70,101-110,118-155; engine.js:561-592 |
| M06 | The camera reads the double-height garden-level living room, library wall and stair landing. | 0.59 / 0.64 / 0.68 | 03-open-section/page.js:29-70,101-110,118-155; engine.js:561-592 |
| M07 | The garden terrace and pool become the main section focus beyond the living room. | 0.68 / 0.71 / 0.74 | 03-open-section/page.js:29-70,101-110,118-155; engine.js:561-592 |
| M08 | The camera pulls back to the 1:100 material section; desktop and landscape show the whole cut, while portrait shows its left part before panning right. | 0.76 / 0.83 / 0.86 | 03-open-section/page.js:29-70,101-110,199-211; engine.js:561-592,628-700 |
| M09 | The page leaves the interactive section and presents the studio's hillside-section service message and authored project facts. | 0.88 / 0.94 / 0.96 | 03-open-section/page.js:190-212; index.html:194-227 |
| M10 | Selected-work cards, contact call to action and footer complete the standalone page below the audited section experience. | 0.96 / 0.98 / 1 | 03-open-section/index.html:194-227 |

The section starts as ink at 1:100, opens its perspective lens while the cut remains registered, changes material and light through an X-position front, visits the same stair/rooms/terrace/pool, pulls back to a material section, then yields to the studio's authored service copy, selected work and footer. B required natural wheel to the page end and further input after settling. Portrait represents the returned section as left then right halves (M08/M08R). Landscape uses desktop overlays at 844×390 and has a documented donor limitation.

## Reverse and restore

B→A was recorded continuously without reload, reset or internal calls. Editorial content retreats; material section and room frames reverse; colour and lens return to ink. Stable A0/A1 in each viewport are `VISUALLY_EQUIVALENT` for the drawing, hero/HUD, route/hash and scroll. Internal object identity is `NOT_OBSERVED`; the report does not claim `RESTORED`.

## Reconciliation

M01 and M03–M08 follow `page.js:PLAN.a/stateAt` and `engine.js:resolve/place`: one camera faces the cut; distance changes with lens so the cut frame remains legible. The authored three-level house, fixed PLAN and viewport bands are source-specific. Cut 1 D02 and Atlas cover the mechanism; runtime confirms and extends the temporal/mobile evidence.

M02 follows `page.js:colourAt` and `engine.js:withColour`: an X-position front blends ink and lit material on the same building geometry. `updateCaps` preserves cut lids; notes fade and return. Cut 1 D06 and Global document bounded section/cap/style mechanisms. The present audit records no runtime–Cut conflict.

Rubik current owns Project/Building geometry, Section descriptor/caps, Story camera and lifecycle, route planning, surface materials, UI and outputs. The 12-dimension evidence-backed crosswalk, gaps, bridge candidates (all `implementationAuthorized:false`), technical prerequisites, QA invariants and unresolved items are in `manifest.json` and `reconciliation.json`. No product merge or priority is decided.

## Known unknowns

Exact internal donor resource identity after reverse and product suitability of the service remain `NON_BLOCKING` with evidence needed recorded in `reconciliation.json`. Landscape overlap is classified as `DONOR_LIMITATION`, not a Rubik defect.
