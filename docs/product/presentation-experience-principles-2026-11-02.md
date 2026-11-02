# Rubik — Presentation experience principles

**Date:** 2026-11-02  
**Status:** product/experience principles derived from current Rubik architecture plus donor visual evidence; not roadmap  
**Functional product baseline considered:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`  
**Companion documents:**
- `docs/product/project-experience-delivery-architecture-2026-11-02.md`
- `docs/product/current-delivery-capabilities-2026-11-02.md`
- `docs/product/donor-to-rubik-integration-policy-2026-11-02.md`
- `docs/product/ft3d-donor-global-reconciliation-2026-11-01.md`
- `docs/product/evidence/donor-visual-observations-2026-11-02/manifest.md`

> Rubik should not only show a project. It should be able to explain the project while the same project changes representation, preserving technical rigor, spatial continuity and professional context.

This document records presentation principles. It does **not** authorize implementation, does not select donor takes, and does not imply that every observed donor UI/content should be reproduced.

## 1. Contextual professional information is part of the experience

A presentation can do more than move the camera between stops. Professional information can appear at the moment and place where it becomes useful to understanding the project.

Observed donor references show editorial/contextual cards coexisting with the live spatial experience. Their value is not the donor's fictional copy or branding; it is the presentation pattern:

```text
spatial state
→ contextual explanation
→ professional facts / options / evidence
→ user understanding or decision
→ continue through the same project
```

A contextual card may include, when supported by real Rubik data:

- room / level / façade identity;
- materials and finishes;
- surface/quantity facts;
- budget/cost context;
- solar/site/orientation information;
- programme/phase information;
- professional identity / authorship;
- images or alternatives;
- warnings, assumptions and evidence status;
- a CTA that opens an existing professional workflow.

The card must not invent facts because the presentation needs content.

### 1.1 Spatial anchoring

When useful, information may be associated with the room, material, element, façade or view being shown. A visual connector/hotspot is a possible interaction pattern, not a requirement for every card.

The important invariant is semantic: the user should understand **what the information refers to** in the project.

### 1.2 Profile-aware composition

FT3D-6 already resolves professional templates against available capabilities. Future contextual information may therefore vary by professional purpose without creating different project truths.

Examples of possible emphasis, not approved feature definitions:

- architecture: section, orientation, façade, material, surfaces;
- interior design: finishes, furniture, material alternatives, mood;
- renovation: existing/proposed state, scope, quantities, budget/sequence;
- real estate: spaces, areas, orientation, client-facing narrative;
- developer: building/level reading, programme and delivery facts where real data exists.

The same capability may support different profiles with different information hierarchy.

## 2. Hybrid registered representation is a first-class experience principle

Technical drawing and realistic/material representation should not be understood only as two endpoints separated by a fade.

The donor evidence includes intermediate states where different representation regimes coexist in one frame while remaining registered to the same architecture:

- technical line/hatch next to materialised surfaces;
- a façade partly technical and partly material/lighted;
- an interior where one spatial region remains line-based while another is materialised;
- technical shadow/line logic that corresponds to physical spatial/light behavior;
- the same opening, wall, section or room remaining identifiable while depth/material/light are introduced.

The product value is **continuity under representation change**.

### 2.1 Desired conceptual model

The useful abstraction is closer to:

```text
ONE RUBIK PROJECT / GEOMETRY
        │
        ├── technical representation
        ├── depth / section / spatial representation
        ├── material representation
        ├── light / shadow representation
        └── higher-fidelity representation
                 │
                 ▼
       controlled hybrid composition
```

This is a product principle, not a claim about the donor's exact renderer implementation and not an instruction to create multiple renderers.

### 2.2 Continuity invariants

During a representation transition, document what remains the same project:

- wall/opening identity;
- room/level identity;
- section plane/line;
- façade/window/door alignment;
- camera target or spatial landmark when relevant;
- material region / shadow correspondence where relevant.

A transition that swaps to unrelated geometry or imagery while pretending continuity violates this principle.

### 2.3 Intermediate states matter

The quality of an experience is not measured only by START and END.

Intermediate coexistence can provide:

- technical rigor while introducing realism;
- spatial orientation while a representation changes;
- confidence that the realistic view corresponds to the drawing;
- a richer educational/professional explanation of how the project becomes spatial/material.

Therefore future QA for these experiences should validate the transition band itself, not only endpoint screenshots.

## 3. Semantic timeline experiences must be data-driven

Construction/programme references reveal a different class of problem from a camera/material transition.

The useful system is not:

`scroll → show more meshes`.

It is conceptually:

```text
TIME / DATE / PROGRESS
        │
        ├── programme / calendar / Gantt
        ├── current professional activity or phase
        ├── affected project elements
        └── 3D construction / project state
```

Observed donor Schedule Build imagery shows the programme, week/day/date, named activity and changing construction state in the same experience.

### 3.1 Required semantic distinction

A faithful Rubik construction/programme service would require real or explicitly authored domain semantics such as:

- phase/activity;
- start/end or ordering;
- dependencies when relevant;
- elements involved;
- progress/state;
- trade/category when relevant;
- quantities/cost only when supported by real data.

If those semantics do not exist, Rubik must not fabricate a professional construction programme merely because it can animate geometry.

### 3.2 Presentation can consume semantics; it should not invent them

Story/Presentation may become the visualization/orchestration host for a future timeline capability, but the semantic schedule/phase authority belongs to the appropriate project/domain model.

This distinction is particularly important for Build Time-Lapse / Schedule Build references and for any later FT3D-8-style construction/time work.

## 4. High-quality UX is part of professional credibility

The donor references show that perceived quality comes from the composition of several systems, not only from Three.js fidelity:

```text
geometry
+ representation
+ camera
+ light
+ data
+ typography
+ information hierarchy
+ interaction
+ continuity
```

Rubik should preserve its own UI authority/mobile-first design rather than copying donor layouts, but the professional lesson remains: information hierarchy and interaction quality materially affect whether a spatial experience is understandable and credible.

A contextual card should therefore make clear:

- what is being shown;
- what the information refers to;
- why it matters;
- source/status/limitations where relevant;
- what the user can do next;
- whether an action changes project truth or only presentation.

## 5. Evidence vs implementation

The following must remain separate:

### Visual evidence can establish

- that a donor frame visibly combines technical and material/realistic representation;
- that contextual information cards appear alongside a spatial scene;
- that a visible programme/calendar is synchronized visually with a construction state;
- that intermediate states exist and are meaningful.

### Visual evidence alone cannot establish

- the exact shader/render-pass architecture;
- the internal data model;
- whether the same mesh or a substituted mesh is used without further source/runtime evidence;
- lifecycle/restore correctness;
- exact scroll/progress mapping;
- whether donor programme data is genuinely semantic or authored specifically for the demo;
- direct legal/code reusability.

Those questions remain for runtime/source/Cuts reconciliation.

## 6. Implications for Rubik integration

When donor audit evidence is reconciled, check these possibilities before proposing new product surfaces:

1. **Contextual card layer:** can existing Rubik data be presented contextually inside Presentation without a parallel delivery system?
2. **Hybrid representation capability:** can existing technical/material/light/section capabilities be connected into a registered transition/coexistence mechanism?
3. **Shared transition infrastructure:** can one representation primitive support plan, section, elevation, card-model or other services while preserving their distinct professional purpose?
4. **Semantic domain gap:** does a timeline experience require real phase/programme semantics that Rubik does not yet own?
5. **Delivery reuse:** can resulting experiences feed current views/images/video/dossier/client delivery rather than create duplicate outputs?

## 7. Non-goals

This document does not mean:

- copy donor cards verbatim;
- copy donor typography/desktop layout;
- import fictional donor people, materials, costs, programme or marketing claims;
- implement a universal `technical → realistic` state machine;
- create a new top-level Delivery card for every experience;
- fake construction schedules from animation timing;
- make AI output authoritative geometry.

## 8. Principle summary

Three principles are carried forward from the reviewed visual evidence:

1. **Contextual cards are part of the experience.** Professional explanation may be synchronized with the spatial state and real Rubik data.
2. **Hybrid registered representation is a first-class capability.** Technical and realistic/material states may coexist on the same project; the transition itself carries professional value.
3. **Timeline experiences must be semantic, not decorative.** Time/programme/activity/elements/3D state must stay synchronized and must not imply professional data that Rubik does not possess.

These principles should be tested against the full 14-take runtime audit before any implementation selection.