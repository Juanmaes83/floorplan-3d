# Rubik — Project → Experience → Delivery architecture

**Date:** 2026-11-02  
**Status:** current product architecture note  
**Functional product baseline reviewed:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe` (FT3D-6 integrated)  
**Purpose:** give humans and agents a compact mental model of the product so existing capabilities are reused instead of rebuilt as parallel systems.

> This document is an architectural reading of the current product. It is not a roadmap and it does not authorize implementation.

## 1. The invariant: one project truth

Rubik is project-first. Presentation, analysis, budget, delivery and AI-assisted representation consume project truth; they must not silently become independent authorities for geometry.

For a single level, the durable project contract is `FloorPlanProjectV1` (`js/project-core.js`, `js/project-schema.js`). Renderer geometry is derived from that project and is not a second durable model.

For multi-level work, `FloorPlanBuildingV1` (`js/building-core.js`, `js/building-ui.js`) is the building container. It embeds one validated `FloorPlanProjectV1` per level and adds building-level facts such as level order/elevation/offset and stairs. It does not replace the per-level project contract with presentation state.

Project truth can also include contextual facts when they are explicitly available: site/location/north, building placement, parcel, orthophoto metadata and terrain metadata. Those facts are validated through the project/building contracts and territory adapters; imagery or external source data must not silently reposition or rewrite the home.

## 2. Mental map

```text
INPUT / INTAKE
PDF · raster · vector · DXF · compatible project/building packages · tracing/calibration
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PROJECT / BUILDING TRUTH                         │
│ FloorPlanProjectV1 · FloorPlanBuildingV1                            │
│ geometry · rooms · openings · objects · materials · measurements    │
│ provenance · levels/stairs · site/north/location · territory        │
│ parcel · orthophoto metadata · terrain metadata · exterior/roof     │
└─────────────────────────────────────────────────────────────────────┘
        │
        ├───────────────┬──────────────────┬───────────────────┐
        ▼               ▼                  ▼                   ▼
     DESIGN          ANALYZE             BUDGET            EXPERIENCE
 editor/model     measurements,       quantities,       Presentation / Story
 materials       layout review,       prices, VAT,      FT3D capabilities
 furniture       solar/context,       BC3, economic     deterministic narratives
 variants        professional facts   presentation      over the same model
        │               │                  │                   │
        └───────────────┴──────────────────┴───────────────────┘
                                │
                                ▼
                     PROFESSIONAL DELIVERY
          sheet · surface schedule · project dossier
          images · prepared 3D views · tour video
          economic dossier · client file · observations
          share link · professional identity · editable package
                                │
                                ▼
                              CLIENT
             read / understand / review / return observations

AUGMENTED REPRESENTATION
prepared real Rubik view → labelled AI render (current, orientative)
Rubik truth → Blender / higher-end rendering → AI audiovisual (later premium path)
```

The arrows express dependency and authority, not a required user journey. A professional may move between Design, Analyze, Budget, Presentation and Deliver as needed.

## 3. Current product zones

### 3.1 Input / intake

`js/plan-intake.js` and `js/plan-intake-ui.js` detect input by content and convert supported sources into the Rubik project contract. Intake is therefore a route **into** project truth, not a parallel viewer-only model.

Current code recognises a broad family of source formats and distinguishes what can be converted, traced, calibrated or rejected. The exact support level of every format remains governed by the intake code/tests, not by this mental map.

### 3.2 Design

The editor remains the place where the professional changes the project itself: walls, openings, rooms, furniture, materials/surfaces, measurements and related project facts. Layout helpers/review, room-layout proposals, catalogues and variants support this work without changing the authority model.

`js/project-variants.js` compares validated project alternatives read-only; a variant is a project alternative, not a presentation state.

### 3.3 Building and site context

The current product is not limited to one isolated interior floor:

- `js/building-core.js` / `js/building-ui.js`: multi-level building container and level context;
- `js/exterior-core.js`, `js/exterior-volumes.js`, `js/roof-core.js`: exterior/roof derivations where the project supports them;
- `js/geo-provider.js`, `js/territory-ui.js`, `js/territory-integration-core.js`: location/territorial context;
- `js/parcel-core.js` plus provider/adapters: parcel context;
- `js/orthophoto-core.js` plus PNOA/provider adapter: orthophoto context;
- `js/terrain-core.js` plus terrain provider/adapter: terrain context;
- `js/solar-core.js`, `js/solar-ui.js`, `js/solar-renderer-adapter.js`: explicit, reversible, orientative solar representation.

These capabilities are important inputs to later presentation/delivery experiences, especially façade, solar, exterior and site-oriented narratives.

### 3.4 Analyze

Analysis is a professional reading of the same project, not a separate project. Existing modules include surface/quantity calculations, layout review/coherence checks, orientation/solar and contextual/site readings. Where evidence is incomplete, Rubik generally exposes estimated/partial/unavailable states instead of inventing certainty.

### 3.5 Budget

Budget is a separate professional document derived from project quantities, not a replacement for project truth. Current modules include `quantity-*`, `budget-*`, cost-provider bridges, BC3/FIEBDC-3 support and economic dossier presentation.

Quantities originate in the project; prices/review state belong to the budget workflow. Missing price or incomplete evidence must remain explicit rather than silently becoming a false zero/complete result.

### 3.6 Experience / Presentation

This layer explains the project without mutating it.

The current presentation system includes:

- `js/presentation-core.js` / `js/presentation-ui.js`;
- routes and prepared stops/views;
- deterministic Story narratives in `js/presentation-story-core.js`;
- section, elevation and axonometric presentation capabilities;
- FT3D-6 professional templates in `js/presentation-templates-core.js` and `js/presentation-templates-ui.js`.

The Story contract is especially important: narratives are deterministic functions over the real project/model, support play/scrub/reverse, and restore presentation state instead of persisting narrative transforms as project edits.

FT3D-6 lives **inside the existing Presentation system**. It resolves professional templates against available capabilities; it is not a second story engine or renderer.

### 3.7 Delivery

`Entregar` is an existing product layer, not a future placeholder. Its detailed current capability inventory is documented separately so that implementation audits do not classify established delivery services as missing.

At architecture level, Delivery consumes project facts plus generated professional representations and packages them for professional/client use. Delivery must not invent a second geometry authority.

### 3.8 Client review and continuity

The current review system keeps client feedback separate from project mutation. Observations can be anchored to the project, rooms, elements, images or points; the professional decides what to incorporate. Client feedback does not automatically edit the project.

Editable JSON/ZIP packages serve a different purpose: continuity of work. They should not be confused with read-only client delivery.

## 4. Augmented and premium representation

The premium path has two different maturity levels and must not be collapsed into one label.

### Current: AI image augmentation

`js/ai-render-ui.js` can send **only a prepared real Rubik view image** to the configured render endpoint. The editable project, location and professional data are not sent by that flow. The output is labelled AI-generated/orientative and the project geometry remains the authority.

This already implements an important product principle:

`real Rubik view → enhanced image`, not `AI image → new project truth`.

### Later: higher-end geometric/cinematic pipeline

The intended premium evolution remains:

`Rubik geometric truth → Blender/high-end materials & lighting/render → AI audiovisual/cinematic enhancement`.

Blender and later audiovisual AI may improve representation, but they must not silently alter walls, openings, dimensions or other project facts and then present the result as authoritative geometry.

## 5. Product architecture rules

1. **One truth, many professional readings.** Do not create a second project authority for presentation, delivery or AI.
2. **Existing capability before rebuild.** Search current Rubik capabilities and bridges before declaring a missing feature.
3. **Experience is non-destructive.** Presentation/Story transforms are ephemeral and restorable.
4. **Delivery packages existing truth and representations.** It is not a second editor.
5. **Client feedback is advisory until the professional acts.** Nothing is applied automatically.
6. **Context keeps its provenance and limits.** Parcel, terrain, orthophoto and solar are contextual/orientative unless stronger evidence exists.
7. **AI enhancement is labelled and subordinate to project truth.** Current AI image output is not geometry authority.
8. **Service names matter more than file formats.** The product should expose professional outcomes; PDF/PNG/JSON/WebM/HTML are implementation/output formats underneath them.
9. **Mobile-first remains a Rubik requirement.** Donor/reference limitations do not define Rubik's target UX.
10. **This architecture is not a roadmap.** Reuse, grouping, prioritisation and implementation require separate evidence and human approval.

## 6. Evidence paths reviewed for this note

The 2026-11-02 review checked the current `master` implementations represented by:

- project authority: `js/project-core.js`, `js/project-schema.js`, `js/building-core.js`, `js/building-ui.js`;
- intake: `js/plan-intake.js`, `js/plan-intake-ui.js`;
- context: `js/territory-ui.js`, `js/solar-ui.js`, parcel/orthophoto/terrain providers/adapters, exterior/roof modules;
- design/analysis: room/layout/surface/quantity/review/variant modules;
- presentation: `js/presentation-*`, `js/project-views-ui.js`, `js/tour-recorder.js`;
- budget: `js/quantity-*`, `js/budget-*`, cost providers, BC3/FIEBDC-3 modules;
- delivery/client: `js/professional-workspace-ui.js`, `js/surface-sheet-ui.js`, `js/sheet-ui.js`, `js/project-dossier-ui.js`, `js/economic-dossier-*`, `js/client-share-ui.js`, `js/review-notes-*`, `js/share-link-ui.js`, `js/project-package.js`, `js/brand-*`;
- augmented output: `js/ai-render-ui.js`, `js/delivery-image.js`.

This file should be revised when product authority or layer boundaries change materially; it should not be rewritten merely because an individual UI label moves.
