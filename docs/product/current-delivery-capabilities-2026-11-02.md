# Rubik — Current Delivery capabilities

**Date:** 2026-11-02  
**Status:** factual capability inventory, not roadmap  
**Functional product baseline reviewed:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`  
**Scope:** current professional/client delivery services and the existing capabilities that feed them.

> `Entregar` is an existing product layer. Future work must not classify the whole delivery system as missing merely because a new presentation mechanism or donor experience is not yet integrated into it.

## 1. Delivery authority model

Delivery is downstream of project truth. It packages project facts and derived professional representations; it does not own geometry.

The current workspace is assembled by `js/professional-workspace-ui.js` and groups delivery around professional services rather than file extensions. It reads actual project state, prepared views, the current sheet, budget, branding and client-review state.

A capability may feed Delivery without appearing as a dedicated top-level card. Conversely, a card is not evidence that every prerequisite is available for every project.

## 2. Current service inventory

| Service / output | Current state | Source / authority | Important prerequisites and limits |
|---|---|---|---|
| Ficha de superficies | **EXISTS** | `surface-core`, `surface-sheet-ui` | Uses project/building room metrics. Measured/calibrated, estimated, partial or unavailable states remain explicit. Printable / Save as PDF through browser print. |
| Lámina profesional | **EXISTS** | `sheet-ui`, project geometry, brand snapshot | Uses real project sheet. Scale may be confirmed or orientative; branding/signature is optional. |
| Prepared 3D views | **EXISTS** | `project-views-ui`, existing 3D view and presentation stops | Session-derived frames from the real Rubik 3D view. Must be prepared/refreshed after relevant project changes. |
| Presentación 3D | **EXISTS** | `presentation-*` | Existing presentation system over the real project/model. Manual configuration remains available. |
| FT3D-6 professional templates | **EXISTS** | `presentation-templates-core/ui` inside existing Presentation | Profiles resolve against project capability availability; unavailable content is not invented. |
| Images | **EXISTS** | project preview, prepared 3D views, delivery-image | Includes plan/project views and context-dependent exterior imagery. Availability depends on actual geometry/context. |
| AI render of a prepared view | **EXISTS, AUGMENTED/ORIENTATIVE** | `ai-render-ui`, prepared real Rubik view | Sends the image view plus selected style/finish keys to the configured endpoint, not the editable project. Result is explicitly AI/orientative and is not geometry authority. Requires configured server/token. |
| Tour video | **EXISTS** | `tour-recorder`, `tour-video-ui`, active Presentation | Records the actual presentation stops/view. MP4 where browser encoding supports it, otherwise WebM. Does not edit project. |
| Project dossier | **EXISTS** | `project-dossier-ui` | Composes existing real outputs: sheet, surfaces, orientation/solar/site, exterior, prepared views, review/economic information and signature where available. Missing sections are omitted or identified; nothing is invented. |
| Economic dossier | **EXISTS** | `economic-dossier-core/ui`, current Budget report | Presents the budget prepared in `Presupuestar`; never edits it from Delivery. Professional/client variants. Incomplete quantities/prices/VAT remain visible. |
| Client file | **EXISTS** | `client-share-ui` + dossier/review authorities | Self-contained read-only HTML for offline/browser use. Can contain real views, sheet, areas, context/signature and observation form. Editable project is not embedded. |
| Client observations / professional response | **EXISTS** | `review-notes-core/ui`, `review-anchors` | Feedback can target project, rooms, elements, views/images or plan points. Import/decision workflow remains separate from project mutation; nothing is applied automatically. |
| Published client link | **EXISTS WHEN DEPLOYMENT IS CONFIGURED** | `share-link-ui`, same read-only client file | Publishes the finished client document, optionally tour video, through the deployment storage endpoint. Editable project is not sent. Link is a version snapshot, not a live project mirror. Requires configured Blob/token/server functions. |
| Professional identity / Mi estudio | **EXISTS** | `brand-core/ui` | Reusable browser-local profiles/signature, including logo and contact data. Can decorate sheet, presentation and delivery imagery. Project chooses delivery profile; identity is not geometry. |
| Editable project package | **EXISTS** | `project-core`, `building-core`, `project-package` | Continuity-of-work output, not the same thing as read-only client delivery. JSON/ZIP packages are validated and bounded. Building packages preserve their own building authority. |

## 3. Existing delivery composition

The current product already supports a chain roughly like:

```text
PROJECT / BUILDING TRUTH
        │
        ├── surfaces / quantities / context / solar / budget
        ├── sheet
        ├── Presentation / Story / FT3D-6
        └── prepared real 3D views
                │
                ▼
             ENTREGAR
        ┌───────┼─────────────────────────────────────────────┐
        │       │                                             │
        ▼       ▼                                             ▼
 documentation experience/media                         client workflow
 surfaces      presentation                              client HTML file
 sheet         images / AI image                         published link
 dossier       tour video                                observations/answers
 economic      professional branding                     editable package
 dossier
```

This means a future presentation capability can often become valuable in several existing outputs without creating a new delivery product:

`new presentation capability → Presentation → prepared views/images/video/dossier/client delivery`

That path must be evaluated before proposing a new top-level `Entregar` card.

## 4. Delivery services in more detail

### 4.1 Documentation

#### Surface schedule

The schedule is built from the project/building surface metrics. It can show multiple levels, included/excluded rooms, floor finishes and completeness/status notices. It deliberately distinguishes measured/calibrated, estimated and unavailable evidence.

**Authority:** project/building data + surface metrics.  
**Not authority:** presentation state or AI output.

#### Professional sheet

The sheet is produced from the actual project plan and can be fitted to page or printed at compatible scale when scale is known. Professional branding can be applied, but branding never changes geometric facts.

### 4.2 Presentation and media

#### Presentation

Presentation is an existing host for professional stories and FT3D capabilities. FT3D-6 templates resolve professional content inside this host; there is no second presentation engine created for templates.

Current Story narratives are non-destructive and deterministic over progress, so play/scrub/reverse can reuse the same state function and restore the model afterwards.

#### Project views and images

Prepared views are frames of the real 3D project view. Delivery can show/download them and reuse them in dossiers/client material. When project state makes previous views stale, the product should refresh them rather than silently presenting old frames as current.

#### Tour video

Video records the active Presentation itself. It is therefore an output of the presentation capability graph, not an independent geometry/camera authoring system.

#### AI render

AI image generation is already an augmented delivery path. It enhances a prepared image and is labelled as orientative. It must remain visually and semantically subordinate to Rubik's real project view.

### 4.3 Dossiers

#### Project dossier

`project-dossier-ui.js` explicitly follows a Project-First model: it composes outputs Rubik already produces. Available styles change composition/order, not project facts.

Current dossier sections may include:

- cover and professional signature;
- distribution sheet;
- surfaces;
- orientation and solar;
- site context;
- exterior;
- prepared real 3D views;
- observations/review status;
- economic section when a budget exists;
- sources/scope information.

#### Economic dossier

The economic dossier is downstream of `Presupuestar`. Delivery reads the current prepared budget/report and presents professional/client variants. It does not measure, price, total or persist budget edits itself.

### 4.4 Client handoff and review

#### Self-contained client file

The client file is a read-only delivery document, not a copy of the editable Rubik project. It is designed to be sent by the professional and to work without requiring a Rubik editing session.

#### Published link

The share-link path publishes the same client-facing document as a versioned snapshot. If the project changes, a new delivery must be published; the previous link is not silently rewritten as a live project.

#### Observations

Client review is intentionally advisory. The client can identify what the comment refers to, return an observations file, and receive professional answers/status. The professional retains the decision to incorporate or discard a request.

### 4.5 Professional identity

`Mi estudio` / Brand profiles are reused across delivery artifacts. This is a presentation/signature layer, not project truth. Profiles are browser-local in the current implementation and a project selects which profile signs its delivery.

### 4.6 Editable continuity

Editable JSON/ZIP/building packages exist so work can continue elsewhere or later. They are conceptually different from:

- read-only client files;
- images/videos;
- dossiers;
- published links.

Do not collapse `editable handoff` and `client delivery` into one capability.

## 5. What Delivery does **not** imply

The existence of a Delivery card or route does not prove that every project can produce every output. Availability can depend on:

- valid geometry;
- confirmed/estimated scale;
- valid rooms/surfaces;
- prepared 3D views;
- façade/roof derivability;
- north/location/site context;
- prepared budget;
- configured server endpoints/tokens;
- browser media-encoding support.

Correct product behavior is to expose availability and prerequisites, not to fabricate content.

## 6. Consequence for current donor / FT3D work

When evaluating a donor-inspired mechanism, first ask whether it can feed these established services.

Examples of the **integration question**, not implementation decisions:

- Can a stronger elevation transition enrich Presentation and then flow naturally into images, video, dossier and client delivery?
- Can a section narrative reuse the existing Story lifecycle and then become another presentation chapter rather than another delivery subsystem?
- Can a building-reading mechanism reuse existing building/axon/exploded capabilities and appear in current professional templates?

A visual mechanism alone does **not** justify a new `Entregar` card. A new card is justified only if it represents a genuinely distinct professional service/output that the current delivery model cannot express cleanly.

## 7. Evidence paths reviewed

Current `master` paths used for this inventory include:

- `js/professional-workspace-ui.js`
- `js/surface-sheet-ui.js`
- `js/sheet-ui.js`
- `js/project-views-ui.js`
- `js/presentation-core.js`
- `js/presentation-ui.js`
- `js/presentation-story-core.js`
- `js/presentation-templates-core.js`
- `js/presentation-templates-ui.js`
- `js/delivery-image.js`
- `js/ai-render-ui.js`
- `js/tour-recorder.js`
- `js/tour-video-ui.js`
- `js/project-dossier-ui.js`
- `js/economic-dossier-core.js`
- `js/economic-dossier-ui.js`
- `js/client-share-ui.js`
- `js/review-anchors.js`
- `js/review-notes-core.js`
- `js/review-notes-ui.js`
- `js/share-link-ui.js`
- `js/brand-core.js`
- `js/brand-ui.js`
- `js/project-package.js`
- `js/project-core.js`
- `js/building-core.js`

This inventory should be amended when a delivery service or authority changes materially; UI rearrangement alone does not require redefining the architecture.
