# Hybrid Registered Elevation V1 — Sculpture Implementation Contract

Date: 2026-11-02

Status: IMPLEMENTATION AUTHORIZED FOR THIS CONTRACT ONLY

Repository: `Juanmaes83/floorplan-3d`

Implementation branch: `feat/hybrid-registered-elevation-v1`

Approved product baseline: `master@0f9c6ead9732901681498efec326d1ca92e42ffe`

Final donor runtime audit checkpoint: `audit/donor-runtime-7x14-2026-11-02@5b818cf96d3b16c5a2a4352f3e14d70da4bc2a59`

Pinned donor source: `Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6`

Implementer target: Claude Code / Opus 5.5

Final authority for QA / review / merge: Juanma + ChatGPT

Do not merge from this mission.

---

## 1. Product decision

Priority #1 is approved:

> Add to Presentation a Hybrid Registered Elevation capable of moving progressively from a technical architectural reading to real Rubik material/light on the same real project facade, while preserving Rubik as authority and remaining fully reversible.

The intended reading is:

```text
RUBIK OVERVIEW
  -> FRONTAL ELEVATION
  -> TECHNICAL READING
  -> SHADOW-COHERENT HATCH
  -> REGISTERED MATERIAL REVEAL
  -> REAL RUBIK MATERIAL + LIGHT / SHADOW
  -> OPTIONAL EXISTING SOLAR SNAPSHOT
  -> MATERIAL EXTERIOR READING
  -> RETURN TO RUBIK OVERVIEW
```

Core invariant:

> One project truth. One facade geometry. Several registered representations.

This mission does not reproduce the full donor `07-a-one-door` experience.

---

## 2. Mandatory implementation methodology: Sculpture

Use the Sculpture methodology previously used in the Museo / Costa Blanca Worlds style of reverse-engineering work.

The method is intentionally not "rewrite the smallest thing from prose".

It is:

```text
WORKING DONOR CAPABILITY
  -> TAKE A LARGE COHERENT STONE
  -> MAKE THE STONE RUN / PROVE ITS BEHAVIOUR
  -> SCULPT AWAY DONOR-SPECIFIC PARTS
  -> REPLACE AUTHORITIES WITH RUBIK AUTHORITIES
  -> CLEAN DEAD SCAFFOLDING
  -> QA THE FINAL RUBIK CAPABILITY
```

The implementation may temporarily contain a larger donor-derived block than will survive in the final product if that reduces uncertainty, token usage and implementation error.

Do not prematurely rewrite a proven mechanism merely to make the intermediate code look cleaner.

Preserve demonstrated behaviour first. Sculpt second.

The final integrated result must obey Rubik architecture even if the intermediate stone is deliberately larger.

---

## 3. Legal / provenance rule for the stone

The pinned donor repository is MIT licensed at the audited commit. Substantial copied portions must retain the required MIT copyright and permission notice.

When donor code is copied or substantially adapted:

- preserve required license attribution;
- record source repository, pinned SHA and source file(s);
- keep donor-derived code identifiable during the sculpture phase;
- remove donor-specific data/assumptions before final handoff;
- do not copy third-party code/assets whose license/provenance is not established by the donor MIT license.

If a required external dependency or asset has unclear provenance, do not transplant it. Reimplement the mechanism from evidence instead.

---

## 4. REA role

REA (`Juanmaes83/rea`) is authorized as a reverse-engineering accelerator when useful.

Use REA when a concrete question cannot be answered reliably from direct source inspection / runtime evidence, especially for:

- call graphs;
- shader dependency chains;
- uniforms and state flow;
- runtime inputs;
- source-to-runtime mapping;
- coordinate spaces;
- material/shadow lifecycle;
- hidden dependencies of the donor stone.

REA is not a new research phase and must not become a reason to delay implementation.

Use it surgically:

```text
CONCRETE UNKNOWN
  -> TRACE WITH SOURCE / REA
  -> GET EVIDENCE
  -> UPDATE THE STONE / SCULPTURE
  -> CONTINUE IMPLEMENTATION
```

Do not approximate a donor mechanism from appearance if its actual implementation can be established quickly from available source/runtime evidence.

---

## 5. Required reading before product edits

Read only what is needed to execute this contract.

### Rubik current

- `js/presentation-elevation-core.js`
- `js/presentation-story-core.js`
- runtime Presentation/elevation functions in `index.html`, including `presentationStoryBegin`, `presentationStoryApply`, `beginElevation`, `applyElevation`, `endElevation`
- `js/surface-renderer.mjs`

### Audit evidence

At audit checkpoint `5b818cf96d3b16c5a2a4352f3e14d70da4bc2a59`:

- `docs/product/evidence/donor-runtime-audit-2026-11-02/reports/reconciliation.md`
- `docs/product/evidence/donor-runtime-audit-2026-11-02/takes/07-a-one-door/manifest.json`

`07-b` and `07-c` may be consulted only to ensure the resulting mechanism remains reusable across the `SM-07-ELEVATION` family.

### Donor mechanism

At pinned donor SHA `d7b9b69753d3af679535ee56695a05c8d955c3c6`:

- `07-sunlit-elevation/a-one-door/page.js`
- `07-sunlit-elevation/engine/elevation.js`

Trace whatever supporting functions are actually required by the coherent stone.

---

## 6. Phase A — STONE

### Objective

Identify and bring across a coherent donor implementation block large enough to preserve the proven hybrid-elevation mechanism without guessing missing dependencies.

### Prefer taking too much over taking too little

The first stone may include more than the final product needs, including donor helper functions, shader code, uniform plumbing or local lifecycle glue, if those pieces form one coherent proven mechanism.

Do not copy the whole donor application.

The stone should be bounded around the mechanism needed for:

- technical/hatch representation;
- shadow relationship;
- registered material sweep;
- required shader/uniform support;
- any minimal light/material glue needed to make that mechanism demonstrably work.

### Exclude obvious unrelated donor domains immediately

Do not bring in:

- donor marketing UI;
- booking/order CTAs;
- sales/status data;
- address/property copy;
- Lenis as product transport;
- fixed townhouse data;
- donor route story beyond what is required to prove the visual mechanism;
- donor project persistence;
- unrelated donor experiences.

### Stone output

At the end of this phase there must be a clearly identifiable donor-derived working area / helper / experimental integration and a short provenance note stating what was taken and from where.

Do not optimize architecture yet.

---

## 7. Phase B — PROVE THE STONE

Before deep sculpture, prove that the stone still exhibits the essential mechanism it was taken for.

Minimum proof:

- hatch / technical state exists;
- material reveal exists;
- reveal is spatially registered to facade/world coordinates, not screen-space;
- reverse can retrace the same representation states;
- the shader/material path compiles in the target Three.js environment or any incompatibility is identified concretely.

This proof may initially use a narrow temporary harness if needed.

Do not spend time polishing UX at this phase.

If the donor mechanism cannot be reproduced because a hidden dependency was missed, expand the stone or use REA/source tracing to recover the missing dependency. Do not invent a replacement while the proven mechanism remains recoverable.

---

## 8. Phase C — SCULPT

Once the stone works, remove donor-specific material progressively.

Sculpt away, in roughly this order where practical:

1. donor hard-coded building/house geometry;
2. donor property / sales / marketing data;
3. donor fixed world coordinates;
4. donor camera keys not needed by Rubik;
5. donor scroll/Lenis transport;
6. donor sun angles / lighting authority;
7. donor hard-coded materials / brick assumptions;
8. donor UI / HUD assumptions;
9. donor lifecycle that Rubik already owns;
10. dead helper/scaffolding code that no longer contributes.

After each meaningful removal, keep the core behaviour working.

Prefer incremental sculpture to a second rewrite.

---

## 9. Phase D — RUBIKIZE

Replace donor authorities with Rubik authorities.

### Project / Building

Authoritative:

- `FloorPlanProjectV1`
- `FloorPlanBuildingV1`

No schema changes.

No persistence changes.

No second geometry truth.

If this capability appears to require Project/Building schema changes, stop and report the blocker instead of widening scope.

### Facade

Existing `FloorPlanPresentationElevation` remains authoritative for facade identity and geometric frame.

Use its real candidate information, including where available:

- `wallRefs`;
- `openingRefs`;
- center/frame;
- width;
- normal;
- tangent;
- envelope/orientation.

### Story

Existing Presentation Story remains authority for:

- absolute progress `p`;
- camera;
- seek;
- reverse;
- lifecycle.

Do not add a second Story engine or scheduler.

### Materials

Existing Rubik material assignments and `SurfaceRenderer` remain material authority.

The donor mechanism may inform shader maths, but donor material truth does not survive the sculpture.

### Light / Solar

Existing Rubik lighting and optional existing Solar snapshot remain authoritative.

V1 does not add a Solar timeline.

### Runtime target identity

Hybrid treatment must target the selected facade, not the entire scene.

Map authoritative facade IDs to runtime meshes through real source identity.

If narrow runtime-only `userData` ownership metadata derived from existing IDs is needed, that is allowed. It must not alter persistence/schema.

---

## 10. Final V1 representation contract

Current Rubik elevation is a real 3D frontal reading, not already a technical drawing.

V1 technical representation therefore means:

- same real facade geometry;
- controlled neutral/technical material reading;
- stable facade/world-space graphical hatch;
- hatch related coherently to actual Rubik lighting/shadow;
- registered transition to existing Rubik materials;
- optional minimal edge/silhouette enhancement only if it can be done safely without creating a second geometry authority.

V1 does not require:

- full CAD hidden-line rendering;
- dimensions;
- fake drawing scales;
- invented annotations.

---

## 11. Registered sweep — hard invariant

The material reveal must be tied to facade/project coordinates, not viewport pixels.

Use the selected facade's geometric frame to derive a stable local coordinate, conceptually:

```text
uFacade = projection(worldPosition - facadeCenter, facadeTangent)
```

normalized over the real facade width.

Story progress drives the reveal threshold.

Therefore:

- camera movement must not move the sweep relative to the facade;
- FOV changes must not move the sweep relative to the facade;
- perspective must not detach the transition from openings/walls;
- reverse must retrace the same physical boundary.

A CSS/screen-space wipe is a failure.

---

## 12. Hatch / shadow contract

Hatch must be stable in facade/world space and must not visibly swim with camera movement.

The final Rubik implementation should preserve the donor principle:

> technical graphic reading and physical shading describe the same geometry.

Do not create an independent fake sun merely to drive hatch.

Prefer the existing Rubik direct-light/shadow relationship as the source for technical intensity/density.

Do not hard-code donor solar values.

---

## 13. Story timeline

Do not replace the current `elevationOpen()` choreography.

Extend it.

Current semantics remain approximately:

```text
overview -> align -> frontal -> light -> perspective -> exterior -> return -> overview
```

Hybrid behaviour:

### p = 0

Normal Rubik overview. Hybrid OFF.

### align

Technical representation progressively enters.

### frontal

Strongest technical/hatch reading.

### frontal/light interval

Registered material reveal progresses across the facade.

### perspective / exterior

Material reveal complete. Existing Rubik material + light are authoritative. Existing optional Solar may be active.

### return

Hybrid state returns to neutral/off while the existing camera returns.

### p = 1

Exactly normal Rubik overview. No hybrid residue.

`stateAt(p)` must remain pure, deterministic plain data.

---

## 14. Material ownership / GPU lifecycle

`SurfaceRenderer` remains authority and owns its verified materials/maps.

Do not leak hybrid state into shared cached materials used by unrelated meshes.

Preferred safe pattern:

- save original material references for target meshes;
- create presentation-only material/shader instances when needed;
- borrow existing textures/maps rather than duplicating bytes;
- never dispose borrowed `SurfaceRenderer` textures;
- restore exact original material references at end/cancel/failure;
- dispose only Hybrid-created resources.

Preserve relevant material state including maps, transparency, clipping, side/depth behaviour and shadow compatibility.

Transparent glazing must not be forced through opaque hatch logic.

Hybrid must tolerate asynchronous `SurfaceRenderer` map readiness or fall back safely; do not create a competing asset loader.

---

## 15. Activation / fallback

Hybrid Registered Elevation is opt-in in V1.

Do not silently replace existing elevation behaviour.

Prefer extending existing `elevation-open` with an explicit hybrid option/variant.

Hybrid OFF must preserve existing behaviour.

Hybrid ON is allowed only when there is:

- a valid facade candidate;
- target facade meshes mapped from real identity;
- meaningful opaque architecture;
- safely adaptable material/shader capability.

If core requirements fail, fall back to normal existing elevation.

Do not show a half-converted facade.

Missing Solar is not a blocker for Hybrid itself.

---

## 16. Reduced motion / mobile / accessibility

Respect existing reduced-motion semantics.

Reduced motion may use stable semantic states instead of a long animated front:

```text
overview -> technical -> material -> material perspective -> overview
```

Required mobile viewports:

- `390x844`
- `844x390`

The facade must remain readable, the hatch must not become unstable/moire-heavy, and existing Presentation controls must remain usable.

The mode must have meaningful text in Presentation UI and remain keyboard reachable through existing configuration patterns.

---

## 17. Explicitly out of scope

Do not implement in this mission:

- full One Door route;
- front-door animation;
- parlour / atrium / garden route;
- automatic room visit;
- The Row plot/property service;
- The Face material supplier/sample-panel domain;
- material specification database;
- donor sales/property facts;
- construction timeline/WBS/programme/site-state domain;
- donor marketing copy;
- new renderer;
- renderer-wide rewrite;
- second Story engine;
- second geometry authority;
- new Project/Building schema;
- new top-level Delivery service.

---

## 18. Reusability requirement

The final mechanism must be generic enough to support later SM-07-ELEVATION work.

Do not hard-code:

- Albion Row;
- donor house dimensions;
- donor coordinates;
- donor camera positions;
- donor progress pixels/vh;
- donor material IDs;
- donor sun angles.

Final inputs should be generic concepts such as:

- facade frame;
- facade tangent/normal;
- authoritative target meshes;
- current Rubik materials;
- current Rubik lighting/shadow;
- Story hybrid state.

---

## 19. Phase E — CLEAN

Before final QA:

- remove dead donor scaffolding;
- remove temporary hard-coded test geometry/data;
- remove obsolete donor lifecycle glue now replaced by Rubik;
- keep required MIT attribution for surviving substantial donor-derived portions;
- document remaining donor-derived algorithms/sections and source SHA;
- ensure production code contains no hidden dependency on donor URLs/runtime.

Do not perform unrelated refactors.

The final architecture should look like a Rubik feature, not a donor app embedded inside Rubik.

---

## 20. Phase F — QA

Do not repeat the 7x14 donor audit.

Test the product bridge.

### Required functional proof

- real Rubik facade;
- same geometry technical/material;
- facade-space registered reveal;
- stable hatch;
- Rubik material/light authority at material-complete state;
- deterministic arbitrary seek;
- reverse;
- exact restore;
- Hybrid OFF regression;
- no project/schema mutation;
- async material safety;
- transparency/clipping compatibility;
- portrait and landscape;
- reduced motion;
- existing capture path.

### Lifecycle / resource proof

Run at least five cycles:

```text
begin -> seek -> reverse -> seek -> end
```

No monotonic accumulation of Hybrid-owned materials/programs/render targets/scene nodes/listeners.

Borrowed `SurfaceRenderer` textures must not be disposed.

### Automated tests

Add focused pure/browser tests following repository conventions.

Use existing Presentation QA infrastructure where appropriate, including:

- `scripts/qa/presentation/`
- `scripts/qa/render-presentation-story-frames.cjs`
- `scripts/qa/render-presentation-templates.cjs`

Run `node --check` for changed JS/CJS files and `git diff --check`.

Do not claim a broad suite passed unless it was actually executed.

### Visual evidence

At exact implementation SHA capture at least:

Desktop:

- overview;
- frontal technical;
- hatch/technical detail;
- ~50% material reveal;
- full material;
- optional Solar state when fixture supports it;
- exterior perspective;
- restored overview.

Portrait `390x844`:

- technical;
- mid reveal;
- material;
- restored.

Landscape `844x390`:

- technical;
- mid reveal;
- material;
- restored.

Reject before handoff if hatch swims, reveal is screen-fixed, boundary detaches from openings, transparency breaks, maps disappear, reverse leaves hybrid state, unrelated scene geometry is affected, or mobile is unreadable.

---

## 21. Hard PASS criteria

All required:

1. Hybrid uses a real current Rubik facade.
2. Technical/material states use the same facade geometry.
3. Reveal is facade-space registered.
4. Hatch is spatially stable.
5. Hatch/shading is coherent with Rubik light/shadow rather than a fake independent light authority.
6. Full material state uses real Rubik materials/maps.
7. Solar, if used, is existing Rubik Solar only.
8. `stateAt(p)` is deterministic and history-independent.
9. Reverse retraces representation state without accumulation.
10. End/cancel/failure restores exact original material references and Presentation state.
11. Hybrid OFF preserves existing elevation behaviour.
12. Project/Building JSON is unchanged by Presentation.
13. No Project/Building schema change.
14. Async material readiness is safe.
15. Transparency remains valid.
16. Existing clipping/material behaviour remains valid.
17. Portrait is usable.
18. Landscape is usable.
19. Reduced-motion meaning remains available.
20. Five-cycle resource test shows no monotonic Hybrid leak.
21. Existing relevant Presentation regression remains valid.
22. Existing capture can capture Hybrid state.
23. No donor-specific project/property/material facts enter Rubik truth.
24. Final mechanism contains no One-Door-specific architectural assumption preventing reuse.
25. Surviving substantial donor-derived code has required MIT attribution/provenance.

---

## 22. Stop conditions

Stop and report `BLOCKED` instead of widening scope if completion would require:

- new Project/Building schema;
- a second geometry authority;
- replacing `SurfaceRenderer`;
- global renderer rewrite;
- second Story engine;
- unknown/unusable legal provenance for a required transplanted dependency;
- fabricated project/material facts;
- major unrelated refactor.

Using a larger donor stone, a focused runtime shader helper, or REA tracing is not a blocker.

---

## 23. Git / workstream discipline

Work only on `feat/hybrid-registered-elevation-v1` in its own worktree.

Before implementation:

- fetch origin;
- verify branch baseline ancestry;
- verify clean worktree.

During work:

- make coherent checkpoints;
- keep donor-derived temporary stone identifiable;
- do not modify master/audit/docs workstreams.

At final handoff:

- commit coherent final implementation;
- push branch;
- verify exact remote HEAD;
- leave worktree clean;
- do not merge.

---

## 24. Final handoff

Return:

```text
MISSION
Hybrid Registered Elevation V1

METHOD
Sculpture: Stone -> Prove -> Sculpt -> Rubikize -> Clean -> QA

BASELINE
0f9c6ead9732901681498efec326d1ca92e42ffe

BRANCH
feat/hybrid-registered-elevation-v1

REMOTE HEAD
<exact SHA>

STATUS
READY_FOR_REVIEW or BLOCKED

STONE / PROVENANCE
<what donor block was initially taken, source files/SHA, what remains after sculpture>

REA USED
YES/NO
<if yes, concrete questions answered>

IMPLEMENTED
<short factual summary>

ARCHITECTURE
<registered sweep, hatch, target mapping, material ownership, lifecycle>

CHANGED FILES
<exact list>

TESTS
<commands + exact results>

VISUAL EVIDENCE
<exact paths/artifacts tied to SHA>

GPU / LIFECYCLE
<five-cycle result>

FALLBACK
<conditions>

KNOWN LIMITATIONS
<explicit list>

PROJECT/BUILDING SCHEMA CHANGED
NO

PROJECT DATA MUTATED BY PRESENTATION
NO

SURFACE RENDERER STILL MATERIAL AUTHORITY
YES

STORY STILL PROGRESS/LIFECYCLE AUTHORITY
YES

DONOR MIT ATTRIBUTION/PROVENANCE SATISFIED
YES

MERGED
NO

WORKTREE
clean / not clean
```

`READY_FOR_REVIEW` means implementation/self-QA is complete enough for Juanma + ChatGPT to begin final QA/review. It does not authorize merge.

---

## 25. Final principle

Do not optimize for recreating `07-a-one-door` as a demo.

Optimize for transferring a proven mechanism into Rubik quickly and safely using the Sculpture method.

When a working donor mechanism exists, prefer a coherent proven stone over speculative reconstruction. Then remove everything Rubik does not need and replace every surviving authority with Rubik's existing truth.

The desired final capability is:

> The same real Rubik project facade can be read technically, progressively materialized, and understood under real Rubik material/light context, with deterministic Story progress and exact restore, without ever ceasing to be the same project.
