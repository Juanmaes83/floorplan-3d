# 05-b · 1:1 Site Sheet — runtime audit

## Professional service

Explains how one planned building emerges from a foundation drawing and construction programme on its actual site footprint. A viewer follows the same authored week across printed plan, programme, staged geometry and camera, ending with the complete house over its drawing. Useful for spatial explanation of an illustrative build sequence; the printed dates, phase membership and completion percentages are fixed demo data, not verified project planning or execution.

## Capture and evolution

Pinned donor: `Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:05-schedule-build/`. Frozen Rubik: `Juanmaes83/floorplan-3d@0f9c6ead9732901681498efec326d1ca92e42ffe:`. Canonical URL: `https://sam1983aing.github.io/flat-to-3d/05-schedule-build/index.html?dir=b`. RAW: `C:\Users\temp123\donor-runtime-audit-RAW-2026-11-02\05-b-1-1-site-sheet`. Each viewport entered at virtual week 7, naturally wheeled to zero in the same context, then recorded continuous 0→14→0 Discovery. Independent semantic passes captured twelve milestones each; desktop correction-1 and portrait correction-2 are selected, preserving failed/short terminal attempts.

| Milestone | Observed change | Approximate virtual transition start / center / end | Pinned source |
|---|---|---|---|
| M01 | The foundation plan and fourteen-week programme are printed on the ground; site set-up and early excavation overlap above the same plan. | 0.005 / 0.03 / 0.055 | house.js:9-24,618-640,1416-1470; view.js:630-776,914-963 |
| M02 | Excavation and its temporary work occur inside the foundation footprint while the on-ground programme cursor advances. | 0.085 / 0.11 / 0.135 | house.js:9-24,618-640,1416-1470; view.js:285-329,730-776 |
| M03 | Pad footings, ring beam and slab develop over the matching drawn foundation geometry. | 0.175 / 0.2 / 0.225 | house.js:9-24,618-640,1416-1470; view.js:630-776 |
| M04 | The camera has moved to the oblique B3 view and timber portal frames rise, with future work still visible as ghost outlines. | 0.295 / 0.32 / 0.345 | house.js:618-640,1416-1470; view.js:285-329 |
| M05 | The CLT mezzanine and stair enter the frame as the adjacent phase bars fill on the site sheet. | 0.405 / 0.43 / 0.455 | house.js:618-640,1416-1470; view.js:730-776 |
| M06 | Wall cassettes replace some ghost outlines, retaining the one-house geometry above the printed programme. | 0.505 / 0.53 / 0.555 | house.js:618-640,1416-1470; view.js:730-776 |
| M07 | Roof cassettes and standing-seam surface close the same structure under the crane. | 0.615 / 0.64 / 0.665 | house.js:618-640,1416-1470; view.js:730-776 |
| M08 | Glazing and doors occupy the intended openings while the week line advances across the paper programme. | 0.705 / 0.73 / 0.755 | house.js:618-640,1416-1470; view.js:730-776 |
| M09 | Exterior cladding and internal finishes cover the assembled shell; sheet and HUD still track one virtual week. | 0.815 / 0.84 / 0.865 | house.js:618-640,1416-1470; view.js:730-776 |
| M10 | Furniture and handover pieces arrive after the finishes, with room tabs becoming available near the end. | 0.925 / 0.95 / 0.975 | house.js:618-640,1416-1470; view.js:730-776 |
| M11 | After the last authored phase ends at week 13.5, automatic camera returns overhead and the HUD wrongly says Site Mobilisation on a near-complete house. | 0.962 / 0.974 / 0.986 | view.js:127-130,285-329,491-500,730-776 |
| M12 | At week 14 the overhead view shows the completed house over the plan, filled programme bars and Practical Completion text. | 0.975 / 1 / 1 | view.js:285-329,491-500,730-776,951-963 |

The same foundation footprint remains visible as the house rises above a printed drawing and fixed fourteen-week programme. The camera moves top→b2→b3→top. At 13.5–14 the HUD falls back to Site Mobilisation until exact WK14 triggers Practical Completion. Room tabs are offered but the B canonical route does not automatically tour inside. Portrait crops the controls and sheet; landscape HUD cards obscure the sheet.

## Reverse and lifecycle

All three natural reverses return week zero, SHOT top, same route and native scrollY zero. A0/A1 screenshots are visually equivalent; hidden WebGL resource identity and exact camera history are NOT_OBSERVED. The late-phase fallback also appears while reversing.

## Source, Cuts and Rubik

Pinned `view.js:630-776` builds a cached ground sheet and updates a dynamic programme overlay from the virtual week; `view.js:285-329` controls the B camera. `house.js:9-24,618-640,1416-1470` supplies fixed phase assignments and piece appearance. Cut4 D18 and Global confirm shared-time illustration, but the B sheet continuity, camera thresholds, mobile limitations and late-phase fallback extend that prior scope. Rubik already owns Building geometry, Story seek/restore, presentation UI and economic C1–C4. The twelve-dimension crosswalk distinguishes those capabilities from a project plan projection, task membership and real planning authority. Candidate bridges are documentary and carry `implementationAuthorized:false`.

## Unknowns

Internal resource identity, exact reverse camera history and product suitability remain bounded non-blocking unknowns. Fixed donor dates, phases and percentages are not promoted to Rubik facts.
