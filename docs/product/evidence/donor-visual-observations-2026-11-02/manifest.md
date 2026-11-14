# Donor visual observations — evidence manifest

**Date:** 2026-11-02  
**Status:** EVIDENCE INDEX IN PREPARATION  
**Scope:** screenshots supplied during product review; repository asset paths/hashes pending user upload.

> This manifest records what the screenshots visibly support and what they do not. It is not a runtime audit and does not replace the 14-take A→B→A evidence mission.

## 1. Handling rule

When the screenshot files are uploaded to the repository, add for each item:

- repository-relative asset path;
- SHA256;
- original capture filename if useful;
- donor group/take when identifiable;
- timestamp/frame position when known;
- whether the observation is direct visual evidence or an inference.

Do not change `PENDING_UPLOAD` to `VERIFIED_ASSET` until path and hash are recorded.

## 2. Observation groups

### VIS-001 — Contextual professional cards inside the spatial experience

**Asset status:** `PENDING_UPLOAD`  
**Observed references:** Lintel-style Services / Craft / Team frames supplied on 2026-11-02.

**Visually observed:**

- high-quality editorial cards coexist with a live/realistic 3D room;
- cards contain hierarchy such as section label, title, explanatory copy, imagery, metrics, controls and CTA;
- some frames visually connect the card to a location/subject in the 3D scene;
- content can vary by topic/person/material while the spatial scene remains the context;
- the presentation can therefore explain professional information during the spatial journey rather than only before/after it.

**Does NOT prove by itself:**

- internal card data model;
- whether spatial anchors are semantic project IDs or authored screen coordinates;
- responsive/mobile behavior;
- lifecycle/restore behavior;
- direct reusability of donor UI/code/content.

**Product principle reference:** `docs/product/presentation-experience-principles-2026-11-02.md` §1.

---

### VIS-002 — Hybrid technical + material/realistic representation in the same frame

**Asset status:** `PENDING_UPLOAD`  
**Observed references:** plan-to-space / Lintel frames and Sunlit Elevation frames supplied on 2026-11-02.

**Visually observed:**

- technical drawing and material/realistic representation coexist spatially within intermediate frames;
- part of a building/room/façade may be materialised while adjacent or continuous regions remain line/hatch based;
- the same architectural landmarks remain recognisable across the representation boundary;
- the intermediate state is not merely an endpoint screenshot and contributes to continuity/rigor;
- material/light/shadow can coexist with technical linework rather than replacing it all at once.

**Does NOT prove by itself:**

- exact render-pass/shader architecture;
- whether the same mesh is always used internally;
- exact masking/ID/depth implementation;
- source-level mapping to a specific Cut component;
- reverse/restore correctness.

**Product principle reference:** `docs/product/presentation-experience-principles-2026-11-02.md` §2.

---

### VIS-003 — Schedule/programme synchronized with construction state

**Asset status:** `PENDING_UPLOAD`  
**Observed references:** `05 · SCHEDULE BUILD` frames supplied on 2026-11-02.

**Visually observed:**

- the experience exposes a programme/Gantt-like calendar divided by weeks;
- a current time/date indicator moves through the programme;
- the scene shows different construction states at different times;
- the UI labels the active week/day/date and named activity/phase;
- visible states include an empty site, digging/excavation, timber frames, floors and later more complete construction/interior states;
- the visual programme and 3D state are presented as one synchronized professional explanation.

**Does NOT prove by itself:**

- that donor schedule data is a general semantic construction model rather than authored demo data;
- exact task dependencies or element binding implementation;
- cost/quantity semantics;
- runtime reverse/restore correctness;
- suitability of the donor's 14-week programme as Rubik product data.

**Product principle reference:** `docs/product/presentation-experience-principles-2026-11-02.md` §3.

---

### VIS-004 — Multi-representation Build modes over one apparent semantic state

**Asset status:** `PENDING_UPLOAD`  
**Observed references:** complementary `ARCH // 12` → `08 The Build` screenshots supplied on 2026-11-02.

**Visually observed:**

- `The Build` exposes visibly distinct modes/readings including labels comparable to `A // PROG`, `B // 1:1 SHEET`, `C // CAM`;
- programme/WBS-like information, technical phase/sheet imagery and spatial/camera construction imagery are presented within one Build experience;
- week/state labels remain part of the construction narrative while the representation changes;
- the UI therefore suggests multiple professional representations around one construction/time concept.

**Does NOT prove by itself:**

- that all modes share one internal data structure;
- that mode switches preserve one exact normalized runtime progress value;
- that the technical sheet is generated from the 3D model rather than authored separately;
- that `CAM`, `AUTO`, `ISO` or other visible controls have the inferred behavior without runtime/source evidence.

**Product principle reference:** `docs/product/presentation-experience-principles-2026-11-02.md` §3.3.  
**Domain addendum:** `docs/product/construction-programme-domain-addendum-2026-11-02.md` §§2–3.

---

### VIS-005 — Temporary construction/site entities and process state

**Asset status:** `PENDING_UPLOAD`  
**Observed references:** Build Time-Lapse / `ARCH // 12` construction screenshots supplied on 2026-11-02.

**Visually observed:**

- construction states visibly include excavation/ground change;
- plant such as an excavator is shown;
- crane/site equipment appears in later construction states;
- fencing/site cabin, scaffolding and props/temporary supports are visible in different frames;
- incomplete structural assemblies are presented as time-specific states rather than only final-building geometry.

**Does NOT prove by itself:**

- how temporary entities are modelled or loaded;
- whether they share IDs with final project elements;
- whether temporary works are derived from schedule data or authored per scene;
- asset/code licensing or reuse rights;
- cleanup/restore correctness.

**Product principle reference:** `docs/product/presentation-experience-principles-2026-11-02.md` §3.4.  
**Domain addendum:** `docs/product/construction-programme-domain-addendum-2026-11-02.md` §§1–2.3.

---

### VIS-006 — Enriched return from spatial/material experience to technical representation

**Asset status:** `PENDING_UPLOAD`  
**Observed references:** `03 Open Section` / complementary section screenshots supplied on 2026-11-02.

**Visually observed:**

- section imagery appears in technical/drawn form and in coloured/material/spatial forms;
- a visible caption states `The same cut, now in colour`, explicitly framing the coloured/spatial state as the same section rather than a new project;
- technical section views remain meaningful after room/spatial exploration;
- the narrative therefore supports a return to a technical/section reading after richer spatial/material states.

**Does NOT prove by itself:**

- exact sequence order for every take/variant;
- whether the final technical state is pixel/state-identical to the initial one;
- whether the donor uses the same mesh/section implementation throughout;
- lifecycle restore correctness.

**Product principle reference:** `docs/product/presentation-experience-principles-2026-11-02.md` §2.4.

---

### VIS-007 — Context cards tied to room/level/camera narrative state

**Asset status:** `PENDING_UPLOAD`  
**Observed references:** `03 Open Section` room/space cards supplied on 2026-11-02.

**Visually observed:**

- sequential cards identify subjects such as stair, kitchen, bedroom, living room and pool;
- cards visibly include room/subject number, level, dimensions/material facts and explanatory architectural narrative;
- a small `KEY · CAMERA AT ...` diagram is visible in several frames;
- the contextual card therefore appears coordinated with a spatial/camera state, not merely with a static marketing page;
- factual-looking data and authored architectural explanation coexist in the same card.

**Does NOT prove by itself:**

- which fields are generated vs hard-authored;
- whether camera key diagrams are runtime-derived;
- exact anchor IDs / room mapping;
- whether card text can be edited by the professional;
- responsive/mobile layout behavior.

**Product principle reference:** `docs/product/presentation-experience-principles-2026-11-02.md` §§1.1–1.3.

---

### VIS-008 — Complementary `ARCH // 12` reference universe

**Asset status:** `PENDING_UPLOAD`  
**Observed references:** screenshots whose top navigation shows `ARCH // 12 [INDEX]`.

**Visually observed:**

- a second reference universe exists visually in the supplied material, separate from `STARTER PROMPTS // 07 [INDEX]`;
- visible labels include examples such as `The Section`, `The Elevation`, `The Study Model`, `The Exploded Axo`, `The Sun Study`, `Site to Room`, `The Napkin Sketch`, `The Build`, `The Material Board`, `Section Sweep`;
- this universe contains patterns useful for product understanding, especially Build/section/card information hierarchy.

**Does NOT prove by itself:**

- exact total/complete list of all 12 references from the screenshots shown;
- that these references are part of the currently authorized 14-take runtime audit;
- that each visible navigation item is a distinct Rubik-worthy feature;
- exact source repository/commit mapping without further evidence.

**Policy:** treat `ARCH // 12` as complementary visual/reference evidence only. Do not expand the current audit Definition of DONE automatically.

---

## 3. Asset registry — pending upload

Populate this table after the user uploads the screenshots to the repository.

| Evidence ID | Repository path | SHA256 | Group/take | Observation | Status |
|---|---|---|---|---|---|
| VIS-001-A | `PENDING` | `PENDING` | Services/Craft/Team reference | Contextual professional card + spatial scene | `PENDING_UPLOAD` |
| VIS-002-A | `PENDING` | `PENDING` | hybrid plan/space reference | Technical + realistic/material coexistence | `PENDING_UPLOAD` |
| VIS-002-B | `PENDING` | `PENDING` | 07 Sunlit Elevation | Technical façade + material/light coexistence | `PENDING_UPLOAD` |
| VIS-003-A | `PENDING` | `PENDING` | 05 Schedule Build | Week/day/programme + construction state | `PENDING_UPLOAD` |
| VIS-004-A | `PENDING` | `PENDING` | ARCH // 12 · The Build | Programme / sheet / camera modes | `PENDING_UPLOAD` |
| VIS-004-B | `PENDING` | `PENDING` | 04 Build Time-Lapse / complementary Build sheet | Technical phase drawings + programme | `PENDING_UPLOAD` |
| VIS-005-A | `PENDING` | `PENDING` | Build construction sequence | Excavation / excavator / ground state | `PENDING_UPLOAD` |
| VIS-005-B | `PENDING` | `PENDING` | Build construction sequence | Crane / props / scaffolding / incomplete structure | `PENDING_UPLOAD` |
| VIS-006-A | `PENDING` | `PENDING` | 03 Open Section | Same cut returning in colour/technical reading | `PENDING_UPLOAD` |
| VIS-007-A | `PENDING` | `PENDING` | 03 Open Section | Stair/kitchen/bedroom/living/pool contextual cards | `PENDING_UPLOAD` |
| VIS-008-A | `PENDING` | `PENDING` | ARCH // 12 index | Complementary reference-universe navigation | `PENDING_UPLOAD` |

Add rows rather than overwriting evidence when more screenshots are uploaded.

## 4. Relationship to the runtime audit

These screenshots are supplemental human visual evidence. The canonical donor runtime audit must still establish per take:

`START → full evolution → END → reverse/restore`

with URL, viewport, telemetry/video/screenshots, source/Cuts/Rubik reconciliation and explicit unresolved items.

If runtime/source evidence conflicts with a screenshot interpretation, record the conflict rather than forcing consistency.

The current 14-take audit remains unchanged. `ARCH // 12` observations do not enter its 14/14 completion count unless a later explicit mission changes scope.

## 5. Current carried-forward conclusions

Pending the full audit, these screenshots justify preserving the following investigation hypotheses/principles:

1. contextual professional information can be an integral part of the spatial experience;
2. hybrid registered technical/material representation can have value as a shared presentation capability;
3. construction/programme experiences should be treated as semantic time/data synchronization problems, not as decorative mesh animation;
4. one semantic state may support several professional representations such as programme, technical sheet and camera/3D;
5. a narrative can return to an enriched technical drawing/section after spatial exploration;
6. contextual narrative may combine authority-backed facts with clearly separate professional-authored explanation;
7. temporary construction/site state must be distinguished from final building truth if ever implemented;
8. complementary reference universes can inform product understanding without silently expanding the authorized runtime audit.

They do not authorize implementation.