# Rubik — Donor → capability → experience → delivery integration policy

**Date:** 2026-11-02  
**Status:** product integration policy for donor/reference work; not roadmap  
**Functional product baseline considered:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`  
**Companion authorities:**
- `docs/product/ft3d-donor-global-reconciliation-2026-11-01.md`
- `docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md`
- `docs/product/flat-to-3d-presentation-knowledge-programme-2026-10-30.md`
- `docs/product/project-experience-delivery-architecture-2026-11-02.md`
- `docs/product/current-delivery-capabilities-2026-11-02.md`
- `docs/product/presentation-experience-principles-2026-11-02.md`
- `docs/product/construction-programme-domain-addendum-2026-11-02.md`
- `docs/product/evidence/donor-visual-observations-2026-11-02/manifest.md`

> The 7 donor groups / 14 takes are references to understand completely. They are not a promise of 14 Rubik features, 14 buttons or 14 Delivery cards.

## 1. Purpose

This policy defines where donor-derived findings should land in Rubik after evidence is understood. It exists to prevent recurring mistakes:

1. rebuilding a capability Rubik already owns;
2. creating a parallel presentation/delivery system for a visual mechanism;
3. turning documentary donor dispositions into implementation authorization;
4. treating professional contextual UI as decorative rather than as part of the experience;
5. reducing hybrid technical/material transitions to endpoint style swaps;
6. faking semantic construction/programme data because the renderer can animate geometry;
7. treating several representations of one semantic state as separate durable product truths;
8. assuming maximum realism must be the endpoint of every professional narrative.

`Rubik commands; donor informs.`

## 2. Authority and evidence precedence

For donor work, keep the layers distinct:

```text
OBSERVED RUNTIME
        ↓
DONOR SOURCE
        ↓
CUT / ATLAS / GLOBAL RECONCILIATION
        ↓
RUBIK CURRENT
        ↓
GAP
        ↓
BRIDGE CANDIDATE
        ↓
HUMAN PRODUCT DECISION
        ↓
IMPLEMENTATION (only if later authorised)
```

Do not collapse these steps.

Existing documentary dispositions from Cuts/Global Reconciliation remain exactly what they are:

- `KEEP EXISTING`
- `REUSE`
- `ADAPT`
- `REIMPLEMENT`
- `REFERENCE ONLY`
- `DEFER`
- `REJECT`
- `UNRESOLVED`

They are documentary knowledge, **not implementation authorization**.

A later runtime audit may describe an implementation bridge candidate such as `CONNECT_EXISTING` or `ADAPT_EXISTING`; that is a separate reconciliation field. It must not silently rewrite the Cut disposition.

Supplemental screenshots may establish visual coexistence or information hierarchy, but they do not replace runtime/source evidence for mechanism, lifecycle, semantics or legal reuse.

## 3. Service first, mechanism second

Every take must first answer:

> **What professional/client problem does this experience solve?**

Only then ask how it works technically.

A shader, camera tween, clipping plane, exploded transform, contextual card or scroll mapping is not by itself a product service.

The mapping order is:

```text
professional service
→ semantic experience/evolution
→ donor mechanism(s)
→ current Rubik capability/capabilities
→ real gap
→ minimum bridge candidate
→ existing Presentation/Delivery surfaces that could consume it
```

This is why two takes may share technical infrastructure while remaining distinct professional services, and why multiple takes may collapse onto one reusable Rubik capability.

## 4. Search Rubik before declaring a gap

Before `MISSING_CAPABILITY`, search the current product across all relevant layers, not only for a matching donor name.

At minimum consider:

### Project / building truth

- `FloorPlanProjectV1`
- `FloorPlanBuildingV1`
- levels / stairs
- geometry / rooms / openings / objects
- materials / surfaces
- provenance / calibration
- exterior / roof
- site / north / location
- parcel / orthophoto / terrain / building placement

### Professional readings

- surface and quantity metrics
- layout review
- variants
- solar/context
- budget / BC3 / cost references
- moodboard/material workflows

### Presentation / experience

- existing Presentation host
- routes/stops/project views
- Story lifecycle and deterministic progress
- section
- elevation
- axonometric / exploded levels
- solar
- site context
- FT3D-6 templates
- manual presentation controls
- existing professional/project data that could feed contextual information

### Delivery

- surface schedule
- professional sheet
- prepared real 3D views
- images
- tour video
- project dossier
- economic dossier
- client file
- client observations/responses
- published client link
- professional identity
- editable project/package
- current AI image augmentation

Absence of a donor-named button is not evidence of a missing capability.

## 5. Preferred landing zones

### 5.1 Presentation capability / Story narrative

If the donor value is primarily **how the same project is explained through time/progress/camera/representation**, the default integration question is whether it belongs inside the existing Presentation/Story architecture.

Examples of mechanism families that often belong here:

- technical drawing → depth/spatial reading;
- section sweep/opening;
- elevation → perspective/material/solar reading;
- axonometric/exploded building reading;
- room/level navigation choreography;
- contextual professional information synchronized with the current spatial subject;
- controlled coexistence of technical and material/realistic representation.

Do not create a separate renderer or story engine unless current authorities are proven insufficient and a later implementation decision explicitly authorizes it.

### 5.2 Shared reusable capability

If multiple takes require the same technical primitive, prefer identifying a reusable capability/bridge rather than copying the mechanism into each experience.

Examples:

- section representation/transition;
- building exploded transforms;
- screen-space technical representation;
- registered technical/material composition;
- scroll/progress driver;
- camera framing/choreography;
- material/light transition;
- contextual card/anchor presentation where supported by real Rubik data;
- lifecycle capture/restore.

Shared technical capability does **not** automatically merge professional services.

### 5.3 Delivery integration

When a new experience/capability becomes available, first test whether existing Delivery surfaces can consume it:

```text
new/stronger capability
        ↓
Presentation / prepared project views
        ↓
images · video · dossier · client file/link · professional templates
```

A new top-level `Entregar` card is not the default.

Create/propose a distinct Delivery service only when the output solves a professional/client need that cannot be represented cleanly by the existing delivery system.

### 5.4 Analysis / budget / project semantic capability

Some donor experiences may reveal a missing **semantic domain**, not merely a presentation effect.

For example, construction/programme/time-based experiences may require real schedule/phase semantics before a faithful Rubik service can exist. In such cases, do not fake semantic data with presentation animation. Classify the missing domain/bridge accurately and defer implementation decisions to the relevant product phase.

### 5.5 Contextual professional information

Donor cards/panels should be evaluated as an information-system pattern, not copied as desktop UI.

Ask:

- what project/professional fact is being explained?
- what room/material/façade/phase/view does it refer to?
- does Rubik already own the underlying data?
- is the information useful during the spatial experience or better suited to an existing dossier/workspace?
- can FT3D-6/profile logic choose the information hierarchy without creating new project truth?

Fictional donor copy, people, material claims, costs and marketing numbers are not Rubik data.

A contextual card may be a Presentation-layer consumer of existing data; it is not automatically a new durable semantic model.

When cards combine measured/project-derived facts with professional explanation, preserve the distinction:

```text
DERIVED / AUTHORITY-BACKED FACT
≠ PROFESSIONAL-AUTHORED NARRATIVE
```

The professional may explain *why* something matters without changing the project's factual authority.

### 5.6 Hybrid registered representation

When donor evidence shows technical drawing and material/realistic imagery coexisting in one frame, do not reduce the finding to `style A → style B`.

Audit whether the professional value depends on:

- the same geometry remaining identifiable;
- a moving spatial/material boundary;
- technical line/hatch/poché remaining visible while depth/material/light appears;
- physical shadow/material behavior corresponding to the technical reading;
- a continuity invariant that makes the transformation trustworthy.

The preferred Rubik question is whether a **shared registered representation capability/bridge** can serve several experiences without creating parallel project geometries or independent worlds.

Visual coexistence alone does not prove the donor's exact shader/pass architecture. Source/runtime evidence must establish mechanism.

### 5.7 Semantic timeline / programme experiences

For Build Time-Lapse / Schedule Build style references, distinguish presentation choreography from domain truth.

The target conceptual relationship is:

```text
time/date/progress
        ↕
programme / activity / phase
        ↕
affected project elements
        ↕
3D state
```

If Rubik lacks real or explicitly authored phase/programme semantics, classify that honestly as a semantic/domain gap. Do not derive a professional schedule from arbitrary animation timing.

A later implementation may use Presentation to visualize the timeline, but Presentation must consume the semantic authority rather than invent it.

FT3D-8 and Global Reconciliation D16–D18 remain the existing documentary authorities for this future family. Supplemental screenshots strengthen the domain reading but do not move the work out of `DEFER`/future status.

### 5.8 Multi-representation synchronization

Some donor/reference experiences visibly expose several readings of one apparent semantic state, for example programme, technical sheet and camera/3D modes.

Do not automatically translate:

```text
A // PROG
B // 1:1 SHEET
C // CAM
```

into three Rubik features.

First test whether they are better understood as:

```text
ONE SEMANTIC AUTHORITY
        ├── programme representation
        ├── technical-sheet representation
        └── spatial/camera representation
```

If that reading is confirmed by runtime/source evidence, prefer shared state plus multiple consumers over duplicated timelines/state machines.

### 5.9 Enriched return to technical representation

A donor narrative may return to plan/section/elevation after opening depth, materials or human-scale space.

Do not assume the product service must end at maximum realism.

A technical representation can be a valid final state when the journey has made it more understandable to the client/professional. This is especially relevant to section experiences where `the same cut` returns after spatial/material exploration.

Keep technical lifecycle restore separate from narrative meaning: a reverse scrub still must restore exact state even if the authored story deliberately ends on a technical drawing.

### 5.10 Temporary construction/site state

Construction references show excavation, plant, cranes, scaffolding, props, fencing and other temporary/process entities.

If future evidence supports implementing this domain, distinguish:

```text
FINAL PROJECT / BUILDING TRUTH
≠ PROGRAMME / PHASE STATE
≠ TEMPORARY SITE STATE
```

Do not persist construction-only objects in final project truth merely because a 3D timeline needs them.

See `docs/product/construction-programme-domain-addendum-2026-11-02.md` for documentary boundary questions. No schema is approved by this policy.

### 5.11 Complementary reference universes

The current formal runtime audit remains exactly the 7 groups / 14 takes already authorized.

Supplemental screenshots also expose an `ARCH // 12 [INDEX]` reference universe with labels such as `The Section`, `The Elevation`, `The Study Model`, `The Exploded Axo`, `The Sun Study`, `Site to Room`, `The Napkin Sketch`, `The Build`, `The Material Board` and `Section Sweep`.

Treat this as **complementary visual/reference evidence**, not as an automatic expansion from 14 audited takes to 26 features or a second runtime mission.

If later investigation of an `ARCH // 12` reference is useful, it requires an explicit evidence task or targeted escalation; do not silently add it to the current Definition of DONE.

## 6. Gap interpretation

Prefer the smallest accurate gap.

Useful distinctions include:

- `NO_GAP`
- `INTEGRATION_GAP` — pieces exist but are not connected;
- `ORCHESTRATION_GAP` — pieces exist but are not sequenced into the professional experience;
- `REPRESENTATION_GAP`
- `TRANSITION_GAP`
- `CAMERA_CHOREOGRAPHY_GAP`
- `MATERIAL_LIGHT_GAP`
- `INTERACTION_GAP`
- `MOBILE_GAP`
- `LIFECYCLE_GAP`
- `OUTPUT_GAP`
- `QA_GAP`
- `MISSING_CAPABILITY`
- `PRODUCT_DECISION_REQUIRED`
- `DONOR_LIMITATION`
- `UNRESOLVED`

For timeline experiences, also distinguish a real semantic/domain gap from a mere orchestration gap even if both would appear visually as “missing animation”.

Do not escalate an integration/orchestration gap into `MISSING_CAPABILITY` merely because the final experience is not currently visible as one button.

## 7. Bridge interpretation

A bridge candidate describes the minimum technical connection that evidence suggests. It does not authorize coding.

Typical bridge meanings:

- **reuse existing** — Rubik already owns the responsibility;
- **connect existing** — required capabilities exist but are not wired together for this service;
- **adapt existing** — an existing Rubik capability needs bounded extension;
- **reimplement mechanism** — reproduce the useful behavior with Rubik's own implementation/authorities;
- **reference only** — retain narrative/visual/professional insight, not runtime code/mechanism;
- **defer** — valid question outside current readiness/phase;
- **reject** — donor assumption conflicts with Rubik's authority/product model;
- **unresolved** — evidence is insufficient.

Every bridge candidate should state which Rubik authorities remain untouched.

## 8. Continuity is a product property

Donor value is often not a simple style swap. The important behavior may be that:

- the drawing is recognisably the same building acquiring depth;
- the technical section is the same model becoming spatial;
- the drawn shadow corresponds to the physical shadow;
- the card model is the same project at another representational scale;
- the same opening/door/level remains identifiable across the transformation;
- technical and material/realistic regimes coexist while remaining registered to the same architecture.

Therefore each candidate experience should preserve/document **continuity invariants**, not just visual endpoints.

If a proposed implementation would replace project truth with unrelated generated geometry/images while pretending continuity, it violates the architecture.

Intermediate transition states may be the professional value and must be included in visual/runtime QA when relevant.

## 9. No universal donor state machine

Do not impose one global:

`pencil → 3D → realistic`

state machine across all 14 references.

That is a useful family resemblance, not a product contract.

Each take has its own professional service, semantic milestones and appropriate host capabilities. Shared infrastructure should be reused without flattening those differences.

A narrative may also return to a technical/abstract state after spatial exploration; the final state is determined by professional purpose, not a universal realism ladder.

## 10. Mobile and interaction

Donor desktop limitations are evidence about the donor, not Rubik requirements.

Rubik remains mobile-first. Any approved experience must eventually make clear:

- where the user is;
- what the experience does;
- why it is useful;
- prerequisites/availability;
- progress/state;
- touch/scroll/scrub behavior;
- portrait/landscape behavior;
- accessibility/lifecycle/restore;
- how contextual information is opened/closed without hiding the project or trapping navigation;
- when several readings/modes exist, which one is active and whether they share the same semantic state.

Do not copy donor UI simply because the donor mechanism is useful.

The semantic hierarchy visible in donor/reference menus can inform Rubik's own mobile-first hierarchy, but Point 9 remains the product IA authority: `DISEÑAR / ANALIZAR / PRESUPUESTAR / ENTREGAR / MI ESTUDIO`.

## 11. Preserve existing product value

Donor integration must be additive.

Do not remove or subordinate without explicit product approval:

- free editor/navigation;
- manual presentation controls;
- existing Story experiences;
- professional templates;
- sheets/surface documents;
- images;
- video;
- dossier/client delivery;
- review/feedback;
- editable packages.

New scroll-driven or cinematic experiences are additional services/modes, not replacements for established professional workflows.

## 12. Examples — hypotheses, not decisions

These examples illustrate the policy and are **not implementation authorization**.

### Sunlit Elevation

Possible current reading:

`elevation + project materials + solar + camera/transition + Story lifecycle + registered technical/material representation`

may be more accurate than `new standalone delivery feature`.

If a stronger elevation narrative becomes a Presentation capability, existing images/video/dossier/client delivery may consume it downstream.

### Section Sweep / Open Section

They may share section/camera/representation mechanisms while still solving different professional readings. Reuse of section infrastructure does not prove they should become one product experience.

`Open the Lens`, `Down the Stair`, `Section Sweep` and complementary `The Section` references should therefore be reconciled against the existing FT3D-3 section authority before proposing another section engine.

### Contextual Craft / Team / Services / room cards

The donor UI demonstrates that spatial presentation can be paired with high-quality professional explanation. The Rubik question is not “copy this panel”; it is whether a reusable contextual information layer can present real Rubik data plus clearly separated professional-authored narrative, profile-aware, while the project remains visible and authoritative.

### Schedule Build / The Build

The donor programme/3D synchronization is evidence of a distinct semantic problem. Rubik should not treat it as only another scroll animation.

Visible programme, technical sheet and camera modes may be several readings of the same time/phase state. Temporary construction entities additionally suggest domain state outside final building truth.

A faithful bridge depends on real/authored phase-programme semantics and explicit mapping to affected elements; until then the correct result may be `MISSING_CAPABILITY`, `PRODUCT_DECISION_REQUIRED` or `DEFER`, depending on the audited evidence.
