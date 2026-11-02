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

## 3. Asset registry — pending upload

Populate this table after the user uploads the screenshots to the repository.

| Evidence ID | Repository path | SHA256 | Group/take | Observation | Status |
|---|---|---|---|---|---|
| VIS-001-A | `PENDING` | `PENDING` | Services/Craft/Team reference | Contextual professional card + spatial scene | `PENDING_UPLOAD` |
| VIS-002-A | `PENDING` | `PENDING` | hybrid plan/space reference | Technical + realistic/material coexistence | `PENDING_UPLOAD` |
| VIS-002-B | `PENDING` | `PENDING` | 07 Sunlit Elevation | Technical façade + material/light coexistence | `PENDING_UPLOAD` |
| VIS-003-A | `PENDING` | `PENDING` | 05 Schedule Build | Week/day/programme + construction state | `PENDING_UPLOAD` |

Add rows rather than overwriting evidence when more screenshots are uploaded.

## 4. Relationship to the runtime audit

These screenshots are supplemental human visual evidence. The canonical donor runtime audit must still establish per take:

`START → full evolution → END → reverse/restore`

with URL, viewport, telemetry/video/screenshots, source/Cuts/Rubik reconciliation and explicit unresolved items.

If runtime/source evidence conflicts with a screenshot interpretation, record the conflict rather than forcing consistency.

## 5. Current carried-forward conclusions

Pending the full audit, these screenshots justify preserving three investigation hypotheses/principles:

1. contextual professional information can be an integral part of the spatial experience;
2. hybrid registered technical/material representation can have value as a shared presentation capability;
3. construction/programme experiences should be treated as semantic time/data synchronization problems, not as decorative mesh animation.

They do not authorize implementation.