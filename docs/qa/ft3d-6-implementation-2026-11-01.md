# FT3D-6 — Implementation and verification ledger

Implementation is in progress. No final validation, preview approval or merge is claimed.

### Final review publication protocol

The final PR description is the dated final implementation report, with the exact final source SHA, completed test/edge/QA1–47 matrices, visual findings, baseline comparison, CI and preview. This source-controlled ledger records the pre-freeze requirements and execution protocol; it must not silently claim future runs passed. Final test logs and the reviewed/hash-verified manifest remain under the external QA root. No code changes after that freeze can reuse affected evidence.

The new CI workflow publishes `ft3d-6-human-review-<exact SHA>`: frozen-baseline/candidate screenshots, real videos and hashes. The candidate reuses the baseline's ZIP fixtures (identical bytes), blocks all nonlocal requests except locally fulfilled pinned Three, and records capture as `CAPTURED`, never as human-approved. The preview remains a project preview, not a production deployment. The final PR must include reviewer access/protection details and an artifact link; a local-only handoff is not complete.

Temporal evidence QA caught overly fast automated scrubbing (180 ms holds). The evidence harness now waits at least 1 s at each scrubbed state, including reduced-motion/mobile and reverse checkpoints. This changes only capture pacing, not product timings. The earlier `a8ff068` campaign and interrupted broad run are retained as development/stale evidence; the final campaign and complete suite must use the subsequent clean checkpoint.

End-frame review of `09db29b` found that one video closed before the compositor encoded the restored editor, although its restored PNG and state checks were correct. Capture now holds configuration/closing for 1 s and the restored editor for 2 s before closing the browser context. The product is unchanged. That campaign/interrupted broad run is also stale; final visual review must include actual raw end frames before the full final suite starts.

Authority audit then reproduced one missing resource: in a one-level building, `site` belongs to the building even though the presentation plan uses the single-project path. The host now uses the same existing building/project site authority as Elevation. A real validated synthetic one-level building test fails before that one-line correction and passes after it. No territory/provider/schema/data changes are involved. Final browser coverage now includes 18 cases; all final evidence must use the subsequent checkpoint (the earlier `ec845e7` preview/campaign is superseded).

Landscape review at `cdcb0b6` caught the original room-checkbox autofocus scrolling the newly added template picker above the viewport. Dialog entry now focuses the template selector without scrolling and starts at scrollTop 0, for single-project and building configuration. Both mobile tests assert focused picker, visible heading/picker and top scroll position before choosing a profile. No player or room-selection semantics change. Earlier media/runs remain stale; final review uses the following checkpoint.

Planned final commands (actual outputs/counts belong to the final review record):

```text
node --test --test-reporter=tap --test-concurrency=1 [all tests/*.test.cjs sorted]
python [each tests/*.test.py, with the isolated jsonschema/UTF-8 environment]
node --check [each changed JS/CJS file]
git diff --check
node scripts/qa/render-presentation-templates.cjs <frozen base> <external baseline output> baseline
QA_FIXTURE_DIR=<baseline output> node scripts/qa/render-presentation-templates.cjs <candidate> <external candidate output> candidate
```

Development additions: post-mutation Apply failure and historical explicit sidecar checks **2/2 PASS** (`logs/browser-extra.log`,12134.6042 ms); real overview endpoints/five cycles/zero per-Apply rebuilds for compact and exploded **2/2 PASS** (`logs/browser-cycles-fixed.log`,19629.4828 ms). A skipped scene stays skipped on subsequent seek; it must not recreate renderer state. All final-head cases are rerun after the final checkpoint.

## Implementation checkpoints (not final evidence)

- Pure resolver checkpoint `25761d7`: 39/39 pure tests PASS after adding the detached/frozen runtime boundary and malformed-catalog diagnostics.
- Configuration/player integration: 13/13 Chromium tests PASS, 0 FAIL, 0 SKIP; `logs/browser-fifth.log`, 64775.7726 ms. These are development results; final HEAD validation must replace them at handoff.
- Five profiles start their compiled story on the existing player. Further rooms stay navigation stops, with one descent per level. No additional narrative, route, renderer, timer or output format was introduced.
- No template selection/overrides/automatic room selection is stored. The existing guide/journey/pane progress writes remain; their three exact keys are proven in the frozen baseline campaign. Browser checks preserve every other storage key/value, including existing room sidecars, brand and audience.
- `Sin plantilla` keeps manual choices and the existing story path. Switching profiles and reset clear session overrides; existing valid room sidecars remain authoritative.
- Snapshot authority is structural levels, independent of selected rooms. Start revalidates the source key. Runtime checks read the active structural level revision; they do not rederive building geometry per frame.
- Missing materialized anchors produce structured notices and degraded state. Begin/Apply/reframe failures call the existing renderer End rollback and evaluate the remaining minimum; the run skips safely or closes and restores. The frozen semantic story is never silently replaced.

### Changed-file responsibility

| File | Responsibility / requirements |
|---|---|
| `js/presentation-templates-core.js` | Pure catalog, validator, immutable snapshot, policies/minima, rooms, sequence/anchors, runtime-failure policy; F6-02–48 |
| `js/presentation-templates-ui.js` | Ephemeral selector/options/warnings/resources, keyboard focus and localized labels; F6-05/22/29/35/39 |
| `js/presentation-ui.js` | Existing authorities → DTO; real plan materialization; frozen run → existing player; failure rollback; F6-02/09/18/42/46 |
| `index.html` | Load the two new modules before the existing UI; no renderer/camera/model edits |
| `css/design-system.css` | Scoped template configuration styles, 44px controls, bounded content; F6-39 |
| `tests/presentation-templates.test.cjs` | 39 pure contract/edge tests |
| `tests/presentation-templates.browser.test.cjs` | 18 real-browser integration tests, five profiles, mobiles, languages, failure, source authority and restore |
| `scripts/qa/render-presentation-templates.cjs` | Reproducible baseline/candidate screenshots, held states and actual normal-motion desktop playback; hashes; no approval inferred |
| `.github/workflows/ft3d-6-presentation-templates.yml` | Exact-head validation and downloadable review artifact; read-only repository permission |
| This ledger | Requirements, baseline, limitations and evidence traceability |

### Development defect / harness ledger

| Finding | Resolution | Current state |
|---|---|---|
| New browser harness omitted JavaScript MIME for `.mjs` | Correct MIME; no runtime change | Fixed |
| Storage assertion incorrectly required existing guide/journey/pane progress to stay unchanged | Frozen baseline proves these exact three writes; all other values/new keys still fail | Fixed |
| Automation `selectOption` does not focus the native select | Focus before changing it, then require preserved focus | Fixed |
| Playwright `isDisabled` reports false for a native disabled `<option>` | Assert the native option's `disabled` property; unsupported choice still disabled/rejected | Fixed |
| Starting test while 3D entry was still busy | Wait for actual editor view readiness, not an arbitrary sleep | Fixed |
| Active structural level omitted from room-selected plan | Validate frozen structural identity, not membership in selected room plan | Fixed; lower-only/all→all test PASS |
| Materialization can omit scenes without a real overview | Show its structured warnings and degraded state | Fixed |

The corrected Three-local supplemental baseline finished with **58 tests: 41 PASS / 17 FAIL / 0 SKIP**, 1050003.213 ms (`logs/baseline-three-local-supplement.log`). It ran on the frozen PINNED_BASE archive, independently of candidate edits. Preserve these results alongside the original broad baseline, not as a replacement or an aggregate count.

## Authority and control

- Implementation authorized by the attached user mission (167 sections), 2026-11-01.
- PINNED_BASE: `e6bc3f3c19d1cd2ebef2dd44de05c007790d678e`.
- Initial fetched `origin/master` equals PINNED_BASE.
- Dedicated worktree: `C:/Users/temp123/work/floorplan-3d-ft3d-6-implementation`.
- Branch: `feat/ft3d-6-professional-presentation-templates` (absent locally/remotely before creation).
- Authority: canonical implementation contract V1, `docs/product/ft3d-6-profile-templates-working-contract-2026-11-01.md` at PINNED_BASE.
- Historical preserved decisions: `5db3c1b48972128f2769598141cbe2268b792bfa`, especially family priorities and warning/sidecar rules. The current mission explicitly specifies recommended room budget 6 (§52); historical smaller profile budgets are superseded by that instruction.
- Global reconciliation and Cuts are reference evidence, not permission to introduce donor mechanisms.
- No human visual approval or merge is implied by automated results.
- External QA root: `C:/Users/temp123/work/ft3d-6-qa-2026-11-01`.

## Requirements traceability matrix — recorded before product edits

IDs refer to canonical contract sections. Planned artifacts are commitments, not evidence of implementation. All entries start **PLANNED**; results must be linked before final handoff.

| ID | Authority / requirement | Planned code / symbol | Unit / integration | Browser | Visual evidence | Status / notes |
|---|---|---|---|---|---|---|
| F6-02 | §2–4: pure semantic composition; existing authorities/player | `presentation-templates-core.js`, `resolveTemplate`; `presentation-ui.js` adapter boundary | deterministic frozen inputs, serialization | same Story runtime | profile campaign | PLANNED |
| F6-05 | §5: five immutable profiles; Sin plantilla default; passive audience | catalog; config select | five IDs, immutable catalog | default/reopen/switch | configuration, parity | PLANNED |
| F6-07 | §6–8,21: six families, scope/coverage, catalog validation | capability catalog, `validateCatalog`, coverage evaluator | invalid catalogs/grammar/dependencies/coverage | truthful controls | disabled reasons | PLANNED |
| F6-09 | §9–10,25–27: real anchors, dedup, ordered adapters | adapter registry, materialization | first eligible overview, missing anchor, one slot | whole Story | scene handoffs | PLANNED |
| F6-11 | §11–17: normalize one FT3D-5 descriptor, reasons, exclusions | `buildSnapshot` | QA1–17 / variants | partial/single/two levels | compact/exploded/partial | PLANNED |
| F6-18 | §18: session snapshot lifetime/key invalidation | snapshot key/session cache | key change/reuse | reopen/edit, no revision mutation | configuration | PLANNED |
| F6-19 | §19–20: policies, minimum before execution, P11 | policy catalog, `evaluateMinimum`, resolver | all five minima, coverages, no-plan | unavailable scenarios | unavailable reasons | PLANNED |
| F6-22 | §22–24: overrides/reset/switch; one buildingReading source | session normalizer, config controller | off/rejected/required/reset | switches/reset/controls | all building choices | PLANNED |
| F6-28 | §28: unchanged SCENE_MS, one building-reading | existing Story constants consumed | 7000/10000, no double duration | timeline | video holds | PLANNED |
| F6-29 | §29–30 + historical §29: family priorities, sidecar, hybrid room-tour, budget | room selector; existing stop navigation | unclassified/diversity/ties/missing/>6 | ordering/selection | selected room flow | PLANNED |
| F6-31 | §31–34: Section/Elevation/Solar/site authorities unchanged | snapshot consumption; adapter bindings | partial/unsupported/hosts | facade/solar choices | section/elevation | PLANNED |
| F6-35 | §35–36,43–45: resources separate; Brand/closing/capture preserved | resources/recommendations; terminal marker | no resource chapters, one terminal | brand/capture/share smoke | final state | PLANNED |
| F6-39 | §39–41: mobile/accessibility/i18n/reduced semantic identity | config select/details + design-system.css; existing localization | same semantic output | ES/EN/ZH, keyboard, mobile, reduced | 390×844,844×390 | PLANNED |
| F6-42 | §42,45: offline/no persistence/project JSON invariant | session-only UI, no new services | no DOM/network/storage core | offline, storage and JSON snapshots | local campaign | PLANNED |
| F6-46 | §46–47: runtime failure safety and structured warnings | failure adapter boundary | minimum-preserving failure policy | injected failures/restore | restore videos | PLANNED |
| F6-48 | §48–49: complete contractual QA and edge cases | `presentation-templates.test.cjs`, browser tests | QA1–41, edge matrix | QA18–19,30–34,42–47 | QA42–47 | PLANNED |
| F6-QA | mission §86–167: baseline, frozen references, complete suites, final SHA evidence, PR/preview | this ledger; external QA manifest | complete canonical tests, syntax/diff | exact final HEAD | hashes/review rubric | IN PROGRESS |

## Frozen visual reference set (before product edits)

| ID | Location | Type / provenance | Demonstrates / dimensions | Reuse boundary | Availability |
|---|---|---|---|---|---|
| REF-V1 | `videos/proyecto-floor-plan-3d.mp4` at PINNED_BASE | user project reference video; 554s,1280×866 | framing, composition, graphic hierarchy, temporal coordination | QA reference only; no media/code copying | AVAILABLE |
| REF-V1-HI | `C:/Users/temp123/Downloads/PROYECTO Y WEB REFERENCIA DE FLOOR PLAN 3D.mp4` | same user reference, higher resolution; 554s,1840×1246 | comparison at readable resolution | QA reference only | AVAILABLE |
| REF-V2 | `C:/Users/temp123/Downloads/PROYECTO Y WEB DONDE DEBEMOS DE RECORRER VISITAR Y AUDITAR PARA IMPLEMENTAR EN FLOOR PLAN 3D.mp4` | user audit reference video;130.4s | section/camera continuity, spatial readability | QA reference only | AVAILABLE |
| REF-STILLS | `C:/Users/temp123/work/ft3d-reference-workspace/evidence/{V1-master,V2-audit}/` | prior extracted reference frames/contact sheets | reference-indexed temporal comparisons; sheet-01 inspected before edits | no product assets | AVAILABLE |
| REF-D14 | canonical evidence Cut3, D14 | documentary source | prominence/support/composition; no arbitrary global .01 scaling | reference mechanisms do not authorize new features | AVAILABLE |
| REF-D15 | canonical evidence Cut3, D15 | documentary source | fixed-center visual sweep is not moving actual light | no shader/light mechanism implementation | AVAILABLE |
| REF-D19 | canonical evidence Cut3, D19 | documentary source | Rubik renderer remains authority | no renderer replacement | AVAILABLE |
| REF-C4 | canonical evidence Cut4 | documentary source | spatial exploded reading distinct from construction/time | no FT3D-8 | AVAILABLE |
| REF-D20 | canonical evidence Cut5 base/completion | documentary source | quality is multicausal: semantic truth, geometry, light, depth, camera, hierarchy, temporal stability | reference only | AVAILABLE |
| REF-D21 | canonical evidence Cut5 base/completion | documentary source | executed and reviewed evidence tied to HEAD | capture does not imply approval | AVAILABLE |
| REF-GLOBAL | `docs/product/ft3d-donor-global-reconciliation-2026-11-01.md` | approved integrated reconciliation | taxonomy/legal boundaries/carry-forward/QA | no donor auto-canonization | AVAILABLE |

FROZEN_REFERENCE_SET = REF-V1, REF-V1-HI, REF-V2, REF-STILLS, REF-D14, REF-D15, REF-D19, REF-C4, REF-D20, REF-D21, REF-GLOBAL. Do not replace it to favor the implementation.

## Baseline and execution record

### Historical carry-forward checklist

| Preserved rule | Historical authority | Canonical mapping |
|---|---|---|
| Real estate: living,kitchen,bedroom,bathroom; developer: living,kitchen,bedroom; architecture: living,kitchen,bedroom,office; renovation: kitchen,bathroom,living,bedroom; interior: living,bedroom,dining,office | §29.2 | §29 |
| Valid explicit sidecar precedes automatic selection; reset preserves it | §23,29.2 | §22–23,29 |
| Unclassified rooms use area descending, source order, ID; never infer family from name | §29.3–4 | §29 |
| Hybrid tour = one descent per level plus existing navigation stops; no continuous route and no new room→overview narrative | §29.1,30 | §25–29 |
| Facade candidate comes from FT3D-4; stale choice becomes automatic with warning and reconfirmation | §32 | §32,47 |
| Optional Solar defaults OFF, stays on elevation only; facade survives missing Solar | §34 | §34 |
| Resource presence does not imply a Story adapter | §35 | §35,43–45 |
| No profession-based autoplay policy; Brand remains transversal | §36,45 | §36,45 |
| Required disable may degrade only while minimum stays satisfied; closing remains terminal | §21,36 | §23,36 |

### Baseline tooling and media

Frozen video hashes were recomputed and match the historical reference inventory (external `references/frozen-videos.json`). All three required videos are accessible. The reference contact sheets V1-master/sheet-01 and V2-audit/sheet-01 were inspected before implementation.

The external baseline browser campaign ran five scenarios (Sin plantilla desktop/portrait/landscape, compact, two-level exploded), each with zero page errors and unchanged project JSON/revision. Reviewed stills: portrait configuration, landscape overview, compact hold, exploded hold. An initial capture-harness mistake scaled single-scene progress as a whole Story; that run is rejected evidence. The harness was corrected to use the actual slider maximum and all five scenarios were regenerated on PINNED_BASE. Final baseline manifest: `baseline/campaign.json`.

Python tooling was installed in the external QA virtual environment only (`jsonschema==4.26.0`, matching existing CI). Native Windows default encoding and the missing `python3` command caused initial harness failures; UTF-8 mode and an external venv interpreter alias resolve those environmental issues. Verified command: all ten `tests/*.test.py`, external venv on PATH, `PYTHONUTF8=1`: **56 PASS, 0 FAIL**. Logs retain both initial attempts and corrected execution (`logs/baseline-python-utf8.log`). No repository dependency or test source changed.

Baseline full Node suite started before product edits: `node --test --test-concurrency=1` over all 151 `tests/*.test.cjs`, alphabetical order. Node v24.14.1; npm 11.14.1; Playwright 1.62.1; Chromium executable `C:/Users/temp123/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe`. Log: external `logs/baseline-complete.log`. Exact final counts pending completion.

The initial optional `THREE_LOCAL_DIR` probe used a nonexistent versioned subdirectory and emitted a path error before tests. The suite continues with its existing CDN fallback. This is recorded as a tooling probe error, not a product failure. Later commands must use `vendor/three` if local Three is required.

Existing F3 browser tests write tracked QA PNGs. Those generated baseline files will be copied into external evidence and restored byte-for-byte to PINNED_BASE before staging. They are outside the permitted product diff.

## Final verification and handoff

PENDING — implementation, final tests, reviewed evidence, exact HEAD, normal push, PR, CI and exact-SHA Preview. Human visual review PENDING. No merge.

### Completed baseline before product edits

- Full 151-file Node run on PINNED_BASE: **1227 tests; 1174 PASS, 23 FAIL, 30 SKIP, 0 cancelled**, exit 1; **3972132.461 ms**. These are actual new counts, not historical FT3D-5 totals.
- Exact failure and skip lists: external `manifests/baseline-summary.json`; full diagnostic output `logs/baseline-complete.log`. No baseline failure was repaired.
- The skips include tests requiring explicit `THREE_LOCAL_DIR` and two unavailable Blender cases. The recording smoke was rerun with `vendor/three`: **1 PASS / 0 FAIL / 0 SKIP** (`logs/baseline-recorder-ci.log`). A supplement for the other skipped browser files is launched with local Three against the frozen source archive, so it cannot read subsequent implementation edits.
- One FT3D-5 baseline failure reproduces in isolation: geometry counter sequence `56,25,56,56,56` fails the existing growth inequality (`logs/baseline-axon-targeted.log`). The existing assertion is preserved.
- The broad-run FT3D-5 Begin/restore/resize timeout passes in isolation with local Three: **1 PASS / 0 FAIL** (`logs/baseline-axon-failure-targeted.log`). Both results are retained; no claim of consistent broad-run success.
- Test-generated changes: **311 tracked files** copied outside the repository and restored byte-for-byte from PINNED_BASE; **365 untracked output files** preserved externally and removed individually from the dedicated worktree. No reset/clean/rebase. Audit confirmed no product source had changed.
- Frozen source archive: external `baseline/pinned-source.tar`, SHA256 `2be50feb10e6ccde29b63a65ae08e216a7be013fcfe86084c0d63d9a4c8d5a7a`; extracted at `baseline/source` with explicit PINNED_BASE marker. Runtime source is retained for later controlled comparisons, never served from the changing candidate checkout.
- Chromium reported **151.0.7922.34**; viewport emulation with software SwiftShader, not physical-device performance. Five baseline videos reviewed through decoded frame sheets; final temporal QA will have its own exact-HEAD review record.

## Canonical §48 acceptance ledger — before product edits

| Gate | Contract requirement | Planned verification | Result |
|---|---|---|---|
| QA1 | axon supported con 1 nivel válido | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA2 | axon partial | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA3 | `no-levels` | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA4 | `invalid-level-geometry` | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA5 | `degenerate-building-envelope` | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA6 | exploded `single-level` | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA7 | exploded `insufficient-valid-levels` | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA8 | exploded partial | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA9 | scope building/coverages any+building | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA10 | sin `ft3d5-pending` | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA11 | axon→axon-open | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA12 | exploded→exploded-levels-open | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA13 | primer overview elegible | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA14 | sin overview → no anchor inventado | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA15 | p0/p1 = overview | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA16 | una sola building-reading | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA17 | exploded no añade axon separado | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA18 | reverse/seek/replay sin drift | Unit + browser lifecycle/restore | IMPLEMENTED; final-head rerun pending |
| QA19 | Close/Escape/Back restaura | Unit + browser lifecycle/restore | IMPLEMENTED; final-head rerun pending |
| QA20 | developer automatic 2 niveles válidos → exploded | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA21 | developer automatic 1 nivel → compact | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA22 | architecture automatic → compact | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA23 | architecture explicit exploded → exploded si supported y puede satisfacer la alternativa volumétrica del minimumStory | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA24 | exploded unsupported → override disabled/rejected | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA25 | `off` sólo si minimumStory sigue válido | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA26 | `toggles` no introduce una segunda fuente de verdad para axon/exploded | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA27 | axon hold .5 | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA28 | exploded holds .22/.645 | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA29 | misma semántica con reduced | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA30 | source usa niveles estructurales, no sólo rooms | Unit + browser lifecycle/restore | IMPLEMENTED; final-head rerun pending |
| QA31 | active→all no altera snapshot | Unit + browser lifecycle/restore | IMPLEMENTED; final-head rerun pending |
| QA32 | levelView restore exacto | Unit + browser lifecycle/restore | IMPLEMENTED; final-head rerun pending |
| QA33 | site-context no adquiere host FT3D-5 | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA34 | preservar contexto runtime no equivale a enhancement activo | Unit + browser lifecycle/restore | IMPLEMENTED; final-head rerun pending |
| QA35 | 7000/10000 desde SCENE_MS | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA36 | exploded no suma axon | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA37 | no confundir SCENE_MS con frames/wall-clock/performance | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA38 | developer sin rooms + axon supported → minimum true, execution unavailable | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA39 | overview(building) sigue unsupported | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA40 | FT3D-5 no se ejecuta sin overview real | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA41 | equivalencia de un nivel no crea overview(building) | Pure core / adapter contract tests | IMPLEMENTED; final-head rerun pending |
| QA42 | developer multinivel | Browser + reviewed screenshot/video | FINAL VISUAL REVIEW PENDING |
| QA43 | architecture compact | Browser + reviewed screenshot/video | FINAL VISUAL REVIEW PENDING |
| QA44 | architecture explicit exploded | Browser + reviewed screenshot/video | FINAL VISUAL REVIEW PENDING |
| QA45 | exploded reverse/recompose/restore | Browser + reviewed screenshot/video | FINAL VISUAL REVIEW PENDING |
| QA46 | 390×844 y 844×390 en holds críticos | Browser + reviewed screenshot/video | FINAL VISUAL REVIEW PENDING |
| QA47 | reduced compact/exploded | Browser + reviewed screenshot/video | FINAL VISUAL REVIEW PENDING |
