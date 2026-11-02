# 04 · Build Time-Lapse — runtime audit

## Professional service

Explains a proposed construction sequence for one hillside house through an aligned programme, staged 3D site and fixed-week drawings. The visitor sees excavation through structure, props, finishes and handover while a week indicator and programme move together, then the completed house returns to drawing 06 on the six-view sheet. The 38 weeks and programme are a scripted example, not a Rubik construction plan or progress report.

## Identity and capture

Pinned donor: `Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6`. Frozen Rubik: `Juanmaes83/floorplan-3d@0f9c6ead9732901681498efec326d1ca92e42ffe`. Standalone: `https://sam1983aing.github.io/flat-to-3d/04-build-time-lapse/index.html`. RAW: `C:\Users\temp123\donor-runtime-audit-RAW-2026-11-02\04-demo-build-time-lapse`. Desktop and portrait original Discovery starts occurred before the autonomous hero completed; their RAW remains preserved. Desktop correction-1 and correction-2, portrait correction-1 and landscape original wait for `window.__heroDone`. Desktop correction-2 also waits 2.5 seconds at A1 and passively records programme bounds and opacity; earlier attempts remain preserved. All three traverse A→B→A in independent contexts; fresh semantic passes cover twelve milestones.

## Observed A→B

| Milestone | Observed change | Desktop native transition start / center / end | Pinned source |
|---|---|---|---|
| M01 | The six completed A-901 drawings yield to drawing 01; the excavation and footing geometry expands into the paper viewport. | 0.02 / 0.05 / 0.09 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:04-build-time-lapse/js/main.js:94-106,224-283,313-317,404-474; js/pipe.js:225-265 |
| M02 | The paper resolves into a material site with excavation, boundary protection, machine and exposed footings around the same pit. | 0.1 / 0.15 / 0.21 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:04-build-time-lapse/js/main.js:110-189,190-212,404-474; js/world.js:454-457,660-748 |
| M03 | The first concrete walls and mezzanine structure rise; crane, temporary stair/rail and props appear as the shared week indicator reaches the early teens. | 0.25 / 0.3 / 0.34 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:04-build-time-lapse/js/main.js:110-212,404-474; js/world.js:660-748; js/stage.js:1-120 |
| M04 | Roof formwork and dense yellow props occupy the same interior below the slab around week 19. | 0.39 / 0.45 / 0.5 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:04-build-time-lapse/js/main.js:190-212,404-474; js/world.js:660-748,1095-1120 |
| M05 | Temporary props disappear; the same structural room now has an oak floor, finished ceiling and framed window around week 27. | 0.52 / 0.55 / 0.58 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:04-build-time-lapse/js/main.js:190-212,404-474; js/world.js:660-748,1095-1120 |
| M06 | A fitted library wall appears in the second-floor room around week 32; the studio table enters at the edge of the frame. | 0.57 / 0.6 / 0.63 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:04-build-time-lapse/js/main.js:190-212,404-474; js/world.js:660-748; js/stage.js:1-120 |
| M07 | The same upper room gains desk, lounge furniture, pendant lights and finished surfaces around week 34. | 0.62 / 0.65 / 0.69 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:04-build-time-lapse/js/main.js:190-212,404-474; js/stage.js:1-120 |
| M08 | The camera descends to the first-floor kitchen and dining area with island, stools and stair as the fit out approaches week 36. | 0.69 / 0.74 / 0.77 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:04-build-time-lapse/js/main.js:168-212,404-474; js/stage.js:176-240 |
| M09 | At week 38 the first-floor living room, stair, sofa and terrace join the finished kitchen in one spatial view. | 0.77 / 0.8 / 0.84 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:04-build-time-lapse/js/main.js:168-212,404-474; js/stage.js:245-360 |
| M10 | The camera exits to the completed glazed hillside house and terrace, retaining the geometry assembled on site. | 0.85 / 0.9 / 0.93 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:04-build-time-lapse/js/main.js:213-283,404-474; js/pipe.js:127-265 |
| M11 | The completed house changes back from material rendering into drawing 06 on sheet A-901. | 0.92 / 0.95 / 0.97 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:04-build-time-lapse/js/main.js:213-283,404-474; js/pipe.js:127-265 |
| M12 | All six fixed-week drawings reappear together with the authored 'Your house, week by week' service close and contact action. | 0.96 / 0.99 / 1 | Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6:04-build-time-lapse/js/main.js:213-283,404-474; js/programme.js:1-55; js/pipe.js:225-265 |

Six live drawings of one house zoom through drawing 01 into a material site. Excavation, footings, walls, props, roof, finishes and furnishings follow the 38-week demo programme. The camera exits to the completed house, converts it to drawing 06 and returns it to the six-view sheet and authored service close. The portrait crop separates upper and lower interior details; the landscape programme consumes a large share of the 390px height.

## Reverse and lifecycle

Natural B→A reverses the site sequence and returns the drawings and scroll origin without reload. Stable A0/A1 screenshots show the initial docked programme block missing at A1 in desktop and portrait; at 844×390 the A0 dock is clipped to the right and the A1 dock is absent. The take's full UI restore verdict is `NOT_RESTORED`. Desktop correction-2 confirms that after 2.5 seconds the programme remains opacity 1 and retains its text, but its rect is x=2590.8, y=-364.3, 1842×117, entirely outside the 1440×900 viewport; at A0 it was x=839.6, y=62, 580×117. The exact style cause and hidden render-resource identity remain bounded `NOT_OBSERVED`.

## Source, Cuts and Rubik

`programme.js` defines one fixed 38-week PROG and six TILES. `main.js` maps 29.4 viewport heights through WEEK_KEYS and an authored four-leg route. `world.js` attaches appearance/removal times to geometry and temporary work, while `pipe.js` evaluates one scene at six tile times. Cut4 D16/D17 and the Atlas support time-evaluation and multi-view principles but explicitly reject treating the donor weeks and six-tile layout as a real Rubik plan. Rubik already has Project/Building identities, View3D, Story seek, lifecycle and output; its missing construction authority is a distinct domain decision. The twelve-dimension crosswalk, gaps and candidate bridges retain `implementationAuthorized:false`.

## Unknowns

The A1 programme cause, hidden render-resource identity and product suitability are non-blocking unknowns. No donor phase duration, work membership or actual-progress claim is promoted to a current Rubik contract.
