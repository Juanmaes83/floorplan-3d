# Rubik — Construction programme domain addendum

**Date:** 2026-11-02  
**Status:** documentary/domain addendum from supplemental visual evidence; **not roadmap, not implementation authorization**  
**Functional product baseline considered:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`

## 0. Authority and non-duplication

This document does **not** create a new phase, replace FT3D-8, or supersede the existing donor reconciliation.

It supplements these prior authorities:

- `docs/product/flat-to-3d-presentation-knowledge-programme-2026-10-30.md` — already defines **FT3D-8 — Timeline de construcción** as a future, separate family where time becomes a dimension of the model;
- `docs/product/ft3d-donor-global-reconciliation-2026-11-01.md` — D16 time-per-element, D17 multiple views over the same model/time, D18 programme + 3D synchronization; all remain documentary dispositions, not implementation authorization;
- `docs/product/presentation-experience-principles-2026-11-02.md` — semantic timelines must be data-driven;
- `docs/product/evidence/donor-visual-observations-2026-11-02/manifest.md` — supplemental screenshot evidence.

The new screenshots deepen the **domain reading** of Build Time-Lapse / Schedule Build / complementary `ARCH // 12` references. They do not prove a general construction engine exists in the donor and do not change the current `DEFER`/future status.

## 1. Domain boundary

A professional construction experience should distinguish at least three authorities:

```text
FINAL PROJECT / BUILDING TRUTH
walls · openings · floors · roof · rooms · finishes · site/context

CONSTRUCTION PROGRAMME STATE
activities · phases · dates/order · progress · affected project elements

TEMPORARY SITE STATE
excavation · scaffolding · props · crane · plant · fencing · cabins · temporary works
```

These are related, but they are not interchangeable.

A crane, excavator, prop or scaffold shown for a construction phase must not silently become durable final-project geometry merely because it appears in the 3D scene.

Likewise, Story/Presentation may visualize programme state but must not become the authority that invents professional schedule semantics.

## 2. Supplemental visual observations

The reviewed frames show several distinct representations of a construction sequence.

### 2.1 Programme / WBS / critical-path-style view

Observed UI includes week columns, named work items, activity bars and a moving current-date/week indicator. Labels such as `WBS // CRITICAL PATH`, week/day and active activity are visible.

This supports the observation that the experience presents construction as **time-indexed professional information**, not only as animated visibility.

It does **not** prove a genuine CPM/critical-path dependency graph. Global D18 already warns that visible arrows/labels are insufficient evidence of a professional dependency model.

### 2.2 Technical phase sheets

Build Time-Lapse imagery includes technical/drawn phase sheets such as excavation/footings, lower level, walls/roof and later stages.

This suggests one programme can have several coordinated professional readings:

```text
PROGRAMME / PHASE AUTHORITY
        ├── technical phase drawing / sheet
        ├── schedule / WBS / calendar
        ├── 3D construction state
        ├── site camera / spatial visit
        └── completion / handover view
```

These should not automatically become separate products if they are only different representations of the same semantic state.

### 2.3 Temporary site entities

Observed construction frames include temporary or process-specific entities such as:

- excavation / changed ground state;
- excavator / plant;
- crane;
- site fencing / cabin;
- scaffolding;
- props / temporary supports;
- incomplete structural assemblies.

This reinforces the domain boundary in §1: construction presentation may need an ephemeral/temporal site layer distinct from final building truth.

### 2.4 Completion and handover

The sequence can move from construction state into a completed interior/handover state.

Therefore the professional narrative may be:

```text
programme
→ site/construction
→ completion
→ handover
→ existing Presentation / Delivery
```

Handover is a possible bridge into Rubik's current Presentation/Delivery system, not evidence that a new delivery system is needed.

## 3. Multi-representation synchronization

Some reference UI exposes different modes over the same construction state, visually comparable to:

```text
A // PROG
B // 1:1 SHEET
C // CAM
```

The transferable product principle is:

> one semantic state may support several coordinated representations.

Conceptually:

```text
current programme state
        │
        ├── programme / Gantt reading
        ├── technical sheet reading
        └── camera / 3D site reading
```

Do not infer from this visual evidence that the donor uses one internal data structure for all modes; runtime/source evidence must confirm mechanism.

For Rubik, if a future construction domain exists, Presentation should preferably consume that one authority rather than maintain unrelated schedule, drawing and 3D timelines.

## 4. Candidate semantic fields — documentary only

A faithful future domain may require some combination of:

- activity / phase ID;
- professional label;
- start/end or explicit ordering;
- week/date/progress mapping;
- dependencies when genuinely modelled;
- affected final-project elements;
- temporary site entities;
- trade/category;
- authored technical phase representation;
- quantities and cost only when derived from existing authoritative Rubik workflows;
- state/progress/status;
- completion/handover milestone.

This list is **not a schema proposal**. It records questions that future product/domain design would need to resolve before FT3D-8 implementation could be authorized.

## 5. Relationship to existing Rubik capabilities

Current Rubik already owns useful inputs/consumers:

- `FloorPlanProjectV1` / `FloorPlanBuildingV1`;
- levels, exterior, roof, site/territory and terrain context;
- quantities;
- budget / BC3 / economic dossier;
- Presentation / Story deterministic progress and lifecycle;
- section/elevation/axonometric presentation capabilities;
- images/video/dossier/client delivery.

Those do **not** by themselves prove Rubik owns construction programme semantics.

A future reconciliation must distinguish:

- `CONNECT_EXISTING` where an authority already exists and only presentation wiring is missing;
- `ORCHESTRATION_GAP` where existing states need professional sequencing;
- genuine `MISSING_CAPABILITY` / domain gap where phase/programme/temporary-site semantics do not yet exist.

## 6. Presentation responsibilities vs domain responsibilities

### Domain / semantic authority should answer

- what activity/phase is current;
- when/order it occurs;
- which project elements it affects;
- what temporary site state belongs to it;
- what evidence/provenance supports quantities/cost/dates.

### Presentation / Story may answer

- how the current state is framed;
- which representation is shown (`programme`, `sheet`, `3D/camera`);
- how the user scrubs/plays/reverses;
- which contextual information is visible;
- how the experience transitions into completion/handover;
- how state is restored on exit.

Presentation must not fabricate the first category merely to make the second visually convincing.

## 7. QA implications for any future authorized work

Future QA should test more than mesh visibility. Candidate invariants include:

- the same semantic time maps consistently to programme, sheet and 3D state;
- forward/reverse traversal restores the same state;
- final-project geometry is not mutated by temporary site representation;
- temporary site entities do not survive outside their authorized phase/lifecycle;
- programme labels and 3D state do not contradict each other;
- unknown/missing dates, dependencies, quantities or costs remain explicit;
- completion/handover does not overwrite project truth;
- mobile/reduced-motion behavior remains understandable.

## 8. Non-goals / prohibited inferences

The screenshots do not authorize or prove:

- that Rubik should implement FT3D-8 now;
- that every project needs a 14- or 38-week programme;
- that the donor's `CRITICAL PATH` label proves real CPM logic;
- that donor activity durations are professionally reusable;
- that temporary machines/assets may be copied or redistributed;
- that Story should own construction data;
- that quantity/budget data can automatically produce a construction schedule;
- that Build Time-Lapse and Schedule Build must become separate Rubik products.

## 9. Carry-forward conclusion

The evidence strengthens an existing conclusion rather than creating a new roadmap item:

> **FT3D-8 is a distinct future domain problem: one programme/time authority may drive technical drawings, schedule views, temporary site state, 3D construction state and handover. Rubik should not fake that domain with decorative animation.**

Selection, schema design and implementation remain deferred until the donor runtime audit and a later explicit product decision.