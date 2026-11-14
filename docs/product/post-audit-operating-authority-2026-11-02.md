# Rubik — Post-audit operating authority

**Date:** 2026-11-02  
**Status:** current authority for post-audit donor→Rubik bridge selection, implementation method and priority interpretation  
**Functional product baseline:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`  
**Closed donor audit checkpoint:** `audit/donor-runtime-7x14-2026-11-02@5b818cf96d3b16c5a2a4352f3e14d70da4bc2a59`

This document exists because the donor audit finished after some earlier documents were written and because the implementation method was refined during the first authorized post-audit bridge.

It does **not** delete historical documents. It supersedes only the obsolete operational interpretations identified below.

---

## 1. Authority / supersession

For work after the completed 7×14 audit, use this document together with the architecture and the exact authorized feature contract.

This document supersedes:

1. `docs/product/current-status-2026-11-02.md` section 3 statements that describe the donor runtime audit as still active or without a remote checkpoint;
2. `docs/product/current-status-2026-11-02.md` section 4 insofar as it still describes the pre-closure audit sequence as the active operating loop;
3. any reading of `docs/product/donor-to-rubik-integration-policy-2026-11-02.md` section 7 that treats `REIMPLEMENT_MECHANISM` as a requirement to rewrite a proven donor mechanism from scratch;
4. any reading of `minimum bridge candidate` as meaning that the **initial implementation stone** must contain the minimum possible amount of donor code.

The older documents remain valuable for product architecture, service-first reasoning, evidence precedence, gap taxonomy, continuity, Delivery and semantic-domain limits.

### Current precedence for post-audit bridge work

```text
MASTER / INTEGRATED PRODUCT
        ↓
PROJECT / BUILDING / RENDER / STORY AUTHORITIES
        ↓
THIS POST-AUDIT OPERATING AUTHORITY
        ↓
EXACT AUTHORIZED FEATURE CONTRACT
        ↓
IMPLEMENTATION BRANCH CHECKPOINTS
        ↓
QA / HUMAN REVIEW
```

Audit evidence remains evidence, not product authority.

---

## 2. Audit closure — current fact

The donor runtime audit is **CLOSED / COMPLETE**.

Authoritative audit branch and final remote checkpoint:

`audit/donor-runtime-7x14-2026-11-02@5b818cf96d3b16c5a2a4352f3e14d70da4bc2a59`

Closure facts:

- 14 references audited;
- 2 `AUDITED`;
- 12 `AUDITED_WITH_DONOR_LIMITATION`;
- 0 partial / blocked / invalid;
- 294/294 take gates;
- 18/18 global A01–A18 gates;
- 0 blocking unresolved;
- 26 non-blocking unresolved;
- desktop forward/reverse/portrait/landscape evidence for 14/14;
- production diff against frozen product baseline: ZERO;
- global validator terminal result: `AUDIT 14/14 COMPLETE`.

Do not restart the 7×14 audit unless new contradictory evidence appears.

---

## 3. Bridge classification and implementation method are different decisions

This distinction is mandatory.

A bridge classification describes **what Rubik is missing / how the final product should connect**.

Examples:

- `REUSE_EXISTING`
- `CONNECT_EXISTING`
- `ADAPT_EXISTING`
- `REIMPLEMENT_MECHANISM`
- `REFERENCE_ONLY`
- `DEFER`
- `REJECT`
- `UNRESOLVED`

The implementation method describes **how we most safely and efficiently reach that final Rubik state**.

The two must not be conflated.

Example:

`ADAPT_EXISTING` can still use a large donor stone temporarily when a difficult visual/shader mechanism is already proven in the donor.

`REIMPLEMENT_MECHANISM` does **not** mean "ignore the donor source and invent a clean replacement from prose".

The final code must obey Rubik authorities; the path to it may use reverse engineering and a deliberately large proven donor stone.

---

## 4. Primary bridge-selection rule

Use this rule before writing an implementation contract.

> **If the real gap is mainly integration/orchestration between capabilities Rubik already owns → CONNECT / ADAPT EXISTING. Do not import a donor stone just because one exists.**

> **If the gap contains a complex mechanism already demonstrated in the donor and rebuilding it from prose would add uncertainty → Sculpture + REA, then Rubikize.**

### Decision matrix

| Situation | Default implementation method |
|---|---|
| Rubik already owns all important primitives and only wiring is missing | `CONNECT_EXISTING` / narrow `ADAPT_EXISTING` |
| Rubik owns most primitives but one simple bounded adapter is missing | narrow native Rubik implementation |
| Donor contains a complex proven shader / transition / geometry / temporal mechanism that Rubik lacks | `Sculpture + REA → RUBIKIZE` |
| Donor mechanism is useful but its code/provenance cannot legally or safely be transplanted | reverse engineer with REA/source/runtime, then reimplement from established evidence |
| Missing value is semantic/domain truth, not a renderer mechanism | do not fake it; `DEFER` / domain work / product decision |
| Donor service is already substantially present in Rubik | reuse/connect; donor remains reference/QA benchmark only |

### Important consequence

**Sculpture is not a universal rule for every bridge.**

It is a tool for gaps where a proven complex donor mechanism is valuable as a starting stone.

For a low-gap connection such as Floor-by-Floor level→room handoff, importing a large donor block would normally be unnecessary and counterproductive.

---

## 5. Sculpture methodology

When Sculpture is selected, the canonical sequence is:

```text
STONE
  ↓
PROVE
  ↓
SCULPT
  ↓
RUBIKIZE
  ↓
CLEAN
  ↓
QA
  ↓
READY_FOR_REVIEW
```

### STONE

Take a **large enough coherent proven donor block** to preserve hidden dependencies and demonstrated behavior.

Prefer a stone that is too complete over a prematurely minimal rewrite when uncertainty is high.

The stone may temporarily contain donor-specific helpers, shader plumbing, uniforms or runtime glue.

It must not be mistaken for final Rubik architecture.

### PROVE

Before aggressively modifying the stone, prove it still demonstrates the mechanism for which it was taken.

Use a narrow harness if useful.

This creates an oracle for later differential debugging.

### SCULPT

Remove donor-specific assumptions incrementally while preserving proven behavior.

Typical removals:

- donor geometry/data;
- donor cameras;
- donor transport/scroll runtime;
- donor materials;
- donor solar/light authority;
- donor UI/copy;
- donor lifecycle already owned by Rubik.

Do not perform a second clean rewrite merely for elegance.

### RUBIKIZE

Replace each donor authority with the real Rubik authority:

- project/building truth;
- geometry ownership;
- materials / SurfaceRenderer;
- lighting / Solar;
- Story progress/camera/lifecycle;
- Presentation configuration;
- mobile/accessibility/output systems.

### CLEAN

Only after the mechanism is correctly integrated:

- remove dead scaffolding;
- remove temporary test geometry/data;
- retain required license/provenance attribution;
- ensure no hidden donor runtime dependency survives;
- keep the final code understandable as Rubik code.

### QA

Functional PASS alone is insufficient for a visual/professional bridge.

QA includes:

- deterministic behavior;
- forward/reverse/restore;
- GPU/resource lifecycle;
- mobile;
- accessibility;
- fallback;
- regression;
- visual and temporal quality against frozen references;
- exact-SHA evidence;
- human review before merge.

---

## 6. REA role

REA (`Juanmaes83/rea`) is an accelerator for reverse engineering, not a new project phase.

Use it surgically when direct source/runtime inspection leaves a concrete unknown, for example:

- call graph;
- hidden dependency;
- shader chunk chain;
- uniform/state flow;
- coordinate spaces;
- shadow/material lifecycle;
- source→runtime mapping.

Canonical pattern:

```text
CONCRETE UNKNOWN
    ↓
SOURCE / RUNTIME / REA TRACE
    ↓
ESTABLISH WHAT REALLY DRIVES THE BEHAVIOR
    ↓
UPDATE STONE OR BRIDGE
    ↓
CONTINUE
```

Do not use REA as an excuse to restart broad research already closed by the audit.

---

## 7. Visual excellence / mother-repo QA

For donor-derived visual mechanisms, the donor is not only source evidence. It is also a **quality benchmark**.

Rubik must not accept "technically works" when the transferred mechanism is visibly inferior for correctable implementation reasons.

Use three distinct benchmarks:

### A — donor mechanism quality

Frozen audit evidence at `5b818cf...`.

For `07-a-one-door`, relevant Hybrid Elevation states are primarily:

- M01 `ink-depth-reveal`;
- M02 `material-sweep-onset`;
- M03 `material-sweep-complete`;
- M04 `sun-and-shadow-change`.

The audit branch already contains semantic keyframes for desktop, portrait and landscape. The RAW audit contains continuous forward/reverse videos and telemetry.

Reuse this evidence before recapturing donor runtime.

### B — Rubik professional visual language

Use existing Rubik reference material, including:

`videos/proyecto-floor-plan-3d.mp4`

as a benchmark for overall professional finish, spatial depth, composition and visual language where relevant.

### C — Rubik baseline regression

Use the approved product baseline to prove Hybrid OFF / unaffected flows remain unchanged.

### Quality parity, not pixel parity

Do not force Rubik to copy donor geometry, brick, camera, sun or authored property data.

Compare the **quality of the mechanism**:

- registration;
- hatch/line stability;
- shadow coherence;
- anti-aliasing / moiré;
- material richness;
- depth;
- lighting;
- transition continuity;
- temporal smoothness;
- reverse;
- restore;
- mobile framing.

Use Playwright, Chromium/Chrome, ffmpeg, CLI tools, screenshots, videos, contact sheets, image analysis and GPU/runtime diagnostics as useful.

`READY_FOR_REVIEW` for a visual bridge means zero BLOCKER and zero correctable MAJOR visual defects within scope, plus evidence tied to the exact candidate SHA.

---

## 8. Post-audit implementation loop

The long audit/reconciliation process is closed. The operating loop is now intentionally short:

```text
ANALYZE / PRIORITIZE
        ↓
BRIDGE + SHORT CONTRACT
        ↓
IMPLEMENT
        ↓
QA / HUMAN CHECK
        ↓
MERGE
        ↓
NEXT HIGHEST-VALUE GAP
        ↓
repeat
```

Roles:

- **Analyze / prioritize:** Juanma + ChatGPT;
- **Bridge / short contract:** ChatGPT;
- **Implementation:** Claude Code / Opus 5.5 by default for these product bridges;
- **QA / review / merge decision:** Juanma + ChatGPT;
- **Codex / other agents:** optional validator, deterministic harness, adversarial review or targeted analysis when useful.

Do not insert another broad documentary phase between every bridge unless new evidence genuinely requires it.

---

## 9. The four previously selected items are the four highest-priority immediate candidates — not the full universe

The previously discussed table was a **priority shortlist**, not an exhaustive catalogue.

Current top four:

| Priority | Service/capability | Value | Gap | Default implementation method |
|---|---|---|---|---|
| **1** | **Sunlit Elevation — technical → registered material/light representation** | Very high | Low–medium | **Sculpture + REA → Rubikize** because the complex donor hatch/shadow/sweep mechanism is proven and Rubik already owns the surrounding elevation/material/Story authorities |
| **2** | **Section → spatial visit / Down the Stair** | Very high | Medium | likely hybrid strategy: connect existing Section/Story/route first; Sculpture only for genuinely missing complex section-transition mechanism |
| **3** | **Floor-by-Floor → level-to-room handoff** | High | Low | **CONNECT_EXISTING**; Rubik already owns compact/exploded levels and route/room capabilities; avoid unnecessary donor stone |
| **4** | **The Face — material/relief + raking sun** | High | Medium–high | connect sourced material/relief semantics first; Sculpture/adapter only for proven complex visual mechanism once authoritative material data exists |

Priority #1 is currently authorized and in implementation on its dedicated branch.

The other priorities are product candidates, not implementation authorization.

---

## 10. Complete audited service/capability universe after grouping

The audit contains 14 takes, but they do **not** equal 14 product features.

After collapsing shared mechanism families while preserving distinct professional services, the current product candidate universe is approximately the following nine service/capability families.

### Family A — Hybrid Registered Elevation

Primary evidence: `07-a-one-door` / `SM-07-ELEVATION`.

Current status: **priority #1 / implementation authorized**.

Product value retained for V1:

- technical elevation;
- registered hatch/shadow;
- registered material reveal;
- Rubik material/light/Solar continuity;
- reversible Story lifecycle.

The donor door/interior route is not part of this first bridge.

### Family B — Section → spatial visit

Evidence:

- `02-demo-section-sweep`;
- `03-a-open-the-lens`;
- `03-c-down-the-stair`;
- shared `SM-03-OPEN-SECTION` where applicable.

Current status: **priority #2 candidate**.

Likely product value:

- preserve the real section;
- open depth/material/light;
- derive valid project stops/route;
- move through real spatial relationships;
- return to enriched section.

Implementation method must be decided per actual missing mechanism; do not assume the entire donor section engine must be imported.

### Family C — Floor-by-Floor → level-to-room handoff

Evidence: `01-c-floor-by-floor` / `SM-01-EXPLODED`.

Current status: **priority #3 candidate**.

Most of the building-reading service already exists in Rubik.

The main remaining opportunity is the connector from a selected/isolated real level to a valid room/route/camera state.

Default method: **CONNECT_EXISTING**, not Sculpture.

### Family D — The Face / material-relief inspection

Evidence: `07-c-the-face` / `SM-07-ELEVATION`.

Current status: **priority #4 candidate**.

Professional value:

- inspect a real facade/material system;
- drawing/material continuity;
- relief under normal/raking light;
- human-scale approach.

Prerequisite: Rubik must have sourced/verified material/relief semantics. Do not invent donor specifications.

### Family E — Unfolded Room

Evidence: `01-b-unfolded-room` / `SM-01-EXPLODED`.

Current status: **later high-value candidate; product decision required**.

Professional value:

- relate developed floor/elevations/ceiling drawing to the enclosed room;
- fold/unfold the same room representation;
- enter the real room.

Gap:

- representation + orchestration.

Potential method:

- if the fold/unfold mechanism is still genuinely missing and complex, **Sculpture + REA** is appropriate;
- if Rubik later owns equivalent panel/room representation primitives, prefer adapt/connect.

### Family F — Card / study model → full-scale spatial reading

Evidence: `06-demo-card-model`.

Current status: **later high-value candidate; product decision required**.

Professional value:

- connect architectural study-model abstraction to real spatial scale;
- preserve identity while moving from card/model representation to material exterior/interior;
- potentially return enriched to the model.

Gap:

- representation + transition + orchestration.

Potential method: likely Sculpture for the complex proven representation transition, followed by Rubikization, but only after product service selection.

### Family G — Board / assembly → lived space

Evidence: `01-a-the-board` / `SM-01-EXPLODED`.

Current status: **later candidate; product decision required**.

Professional value:

- explain how an assembly/component reading relates to the finished walkable project.

Rubik must first decide what real assembly/component authority exists. Do not translate donor-authored assembly labels into project facts.

### Family H — The Row / multi-unit comparison + show-house handoff

Evidence: `07-b-the-row` / `SM-07-ELEVATION`.

Current status: **later candidate; product/semantic decision required**.

Professional value:

- compare multiple units/plots in one composition;
- maintain selected unit identity through technical→material representation;
- optionally hand off to a valid interior experience.

Prerequisites may include real multi-unit/plot semantics and, if commercial availability is ever desired, an explicit authoritative data source. Donor availability/sales copy is not Rubik truth.

### Family I — Construction programme / site timeline

Evidence:

- `04-demo-build-time-lapse`;
- `05-a-the-programme`;
- `05-b-1-1-site-sheet`;
- `05-c-site-camera`;
- shared `SM-05-SCHEDULE` where applicable.

Current status: **future / FT3D-8 / DEFER as an implementation family until semantic authority exists**.

Professional value is potentially very high, but it is not merely a visual bridge.

A faithful implementation needs real/authored:

- programme/activity/phase semantics;
- mapping to affected project elements;
- temporary construction/site state where required;
- synchronization across programme/sheet/3D/camera representations.

Do not fake construction truth from animation progress.

---

## 11. Provisional order beyond the first four

This is **not a locked roadmap**. Re-evaluate after every merged bridge.

If current product assumptions remain unchanged, the provisional next candidates after #4 are:

5. **Unfolded Room** — strong architectural/client communication, but a real representation mechanism still needs product integration;
6. **Card / Study Model → full scale** — very strong experiential value, larger representation/transition gap;
7. **Board / Assembly → lived space** — useful if Rubik develops real assembly/component semantics;
8. **The Row** — valuable for multi-unit/developer workflows, but more dependent on product/data semantics than the first candidates;
9. **Construction programme / site timeline family** — potentially major professional value, but intentionally deferred until its semantic domain is ready.

This order may change when a newly merged capability lowers the gap of another family.

Example: Hybrid Registered Elevation may reduce the later visual gap for `07-c-the-face` or `07-b-the-row`; a successful Section bridge may make several section services cheap connectors rather than separate implementations.

Therefore priorities are **dynamic**, not a one-time donor ordering.

---

## 12. Shared mechanisms do not equal product services

Audit shared-mechanism families remain useful:

- `SM-01-EXPLODED` — 01-a / 01-b / 01-c;
- `SM-03-OPEN-SECTION` — 03-a / 03-c;
- `SM-05-SCHEDULE` — 05-a / 05-b / 05-c;
- `SM-07-ELEVATION` — 07-a / 07-b / 07-c.

A mechanism implemented once should be reused where appropriate.

But do not collapse distinct professional services merely because they share code.

Conversely, do not build the same mechanism repeatedly for each service.

The desired direction is:

```text
ONE RUBIK CAPABILITY / PRIMITIVE
        ↓
MULTIPLE PROFESSIONAL EXPERIENCES
        ↓
EXISTING DELIVERY OUTPUTS
```

---

## 13. Current authorized implementation

Current authorized bridge:

**Hybrid Registered Elevation V1**.

Implementation branch:

`feat/hybrid-registered-elevation-v1`

Feature-specific contract:

`docs/product/hybrid-registered-elevation-v1-sculpture-implementation-contract-2026-11-02.md`

That feature contract owns implementation detail for this mission.

The generic post-audit methodology in this document governs future bridge selection and resolves ambiguity in older policy language.

Do not authorize priorities #2+ from this document alone.

---

## 14. Short rule for future agents

Before implementing a donor-derived bridge, answer in this order:

1. **What professional service are we adding?**
2. **What does Rubik already own?**
3. **What is the smallest real gap?**
4. **Is that gap mainly connection/orchestration, or a complex missing mechanism?**
5. If connection/orchestration → **CONNECT / ADAPT RUBIK**.
6. If complex proven donor mechanism → **STONE → PROVE → SCULPT → RUBIKIZE → CLEAN → QA**, with REA when useful.
7. Preserve Rubik authorities throughout the final product.
8. Use donor/mother-repo evidence as a visual QA benchmark where relevant.
9. Stop at `READY_FOR_REVIEW`; human review decides merge.
10. After merge, re-rank the remaining gaps using the new Rubik baseline.

**Rubik commands. Donor informs. A proven donor mechanism may be used as the stone, but it never becomes the product authority.**
