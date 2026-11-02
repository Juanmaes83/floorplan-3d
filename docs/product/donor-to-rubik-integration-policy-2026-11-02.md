# Rubik — Donor → capability → experience → delivery integration policy

**Date:** 2026-11-02  
**Status:** product integration policy for donor/reference work; not roadmap  
**Functional product baseline considered:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`  
**Companion authorities:**
- `docs/product/ft3d-donor-global-reconciliation-2026-11-01.md`
- `docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md`
- `docs/product/project-experience-delivery-architecture-2026-11-02.md`
- `docs/product/current-delivery-capabilities-2026-11-02.md`

> The 7 donor groups / 14 takes are references to understand completely. They are not a promise of 14 Rubik features, 14 buttons or 14 Delivery cards.

## 1. Purpose

This policy defines where donor-derived findings should land in Rubik after evidence is understood. It exists to prevent three recurring mistakes:

1. rebuilding a capability Rubik already owns;
2. creating a parallel presentation/delivery system for a visual mechanism;
3. turning documentary donor dispositions into implementation authorization.

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

## 3. Service first, mechanism second

Every take must first answer:

> **What professional/client problem does this experience solve?**

Only then ask how it works technically.

A shader, camera tween, clipping plane, exploded transform or scroll mapping is not by itself a product service.

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
- room/level navigation choreography.

Do not create a separate renderer or story engine unless current authorities are proven insufficient and a later implementation decision explicitly authorizes it.

### 5.2 Shared reusable capability

If multiple takes require the same technical primitive, prefer identifying a reusable capability/bridge rather than copying the mechanism into each experience.

Examples:

- section representation/transition;
- building exploded transforms;
- screen-space technical representation;
- scroll/progress driver;
- camera framing/choreography;
- material/light transition;
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
- the same opening/door/level remains identifiable across the transformation.

Therefore each candidate experience should preserve/document **continuity invariants**, not just visual endpoints.

If a proposed implementation would replace project truth with unrelated generated geometry/images while pretending continuity, it violates the architecture.

## 9. No universal donor state machine

Do not impose one global:

`pencil → 3D → realistic`

state machine across all 14 references.

That is a useful family resemblance, not a product contract.

Each take has its own professional service, semantic milestones and appropriate host capabilities. Shared infrastructure should be reused without flattening those differences.

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
- accessibility/lifecycle/restore.

Do not copy donor UI simply because the donor mechanism is useful.

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

`elevation + project materials + solar + camera/transition + Story lifecycle`

may be more accurate than `new standalone delivery feature`.

If a stronger elevation narrative becomes a Presentation capability, existing images/video/dossier/client delivery may consume it downstream.

### Section Sweep / Open Section

They may share section/camera/representation mechanisms while still solving different professional readings. Reuse of section infrastructure does not prove they should become one product experience.

### Exploded House takes

Board and Floor by Floor may share building/exploded infrastructure while expressing different information: systems/layers versus vertical organisation. Shared mechanism does not erase service identity.

### Schedule Build

A convincing schedule/construction experience may require real programme/phase semantics. If Rubik lacks that semantic authority, a camera/visibility animation alone is not a substitute for construction data.

## 13. Required reconciliation output before implementation

For every donor-derived candidate, later decision material should be able to state:

```text
professional service
observed semantic sequence
continuity invariants
donor mechanism
Cut / Atlas mapping
current Rubik capability mapping
real gap
minimum bridge candidate
existing outputs that can consume it
dependencies / technical prerequisites
mobile/lifecycle implications
QA invariants
conflicts / unresolved evidence
implementationAuthorized = false
```

Only after human product review may an implementation contract be created.

## 14. Final control rule

The correct question is not:

> “How do we copy this donor take into Rubik?”

It is:

> “What professional value does this reference demonstrate, which Rubik authorities/capabilities already provide part of it, what minimum gap remains, and how can that gap strengthen the existing Project → Experience → Delivery system without creating a second product?”

That question governs donor integration until a later product decision explicitly says otherwise.
