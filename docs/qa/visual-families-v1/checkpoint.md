# Visual Families V1  -  isolated implementation checkpoint

## Reconciliation

Base: B2 `894607b38fa43a5e89a9f5296a41cdbcc989d5ce`. CI 41802674784 SUCCESS verified. PR 164 and 165 OPEN/DRAFT, no merge, verified at entry. Origin master remains `0f9c6ead9732901681498efec326d1ca92e42ffe`. Old CP2 worktree clean at c3c8a29, no unpublished local commits; remote added M08 test/CI fixes. No CP2 work repeated or modified. No prior Visual Families branch found. New worktree `C:/Users/temp123/floorplan-3d-visual-families-v1`, branch `feat/visual-families-v1`, based directly on immutable B2. Diff/review base is B2, not master; integration depends on PR165 disposition.

Claude's delivery branch changes head/footer script loading in index.html and delivery UI/runtime modules. Proposed shared-file seam: Visual Families only imports its adapter, binds existing window construction, and adds bounded cleanup/toggle API inside View3D. No delivery UI/API changes. User confirmation of this explicit seam is pending; no index.html mutation before it arrives.

## Decision and budget

F02 existing-window profile wins the first cut: impact 4, frequency 4, reuse 5, commercial relevance 5 / effort-risk 3 = relative score 133. F01 generalized relief 3 - 5 - 4 - 4/4=60 (identity risks across the remaining maps); F03 facade detail 4 - 4 - 4 - 4/5=51 (larger geometry boundary). Scores are prioritization estimates, not visual quality measurements.

One versioned recipe, two finishes (graphite/chalk), OFF equals B2. HERO only, explicit maximum three existing source IDs; doors, partial cut windows, unsupported dimensions and unselected windows excluded. Stepped stock/frame and seal profiles derive from existing opening dimensions and subdivisions, do not change Project or colliders. No false interiors, new windows, shutters, glass transmission or lighting. These profiles are presentation detail, not a claim that surveyed construction uses that exact section.

Budget for F02, separate from surfaces: zero textures/downloads, one shared unit-box geometry, two shared Standard materials, at most six instanced draw calls/3000 triangles/32 KiB estimated geometry+instance buffers across three targets; zero extra shadow casters. Balanced profile omits fine beads; detail adds them. Editing/walk/mobile default balanced; Presentation/capture detail. No general LOD/GPU manager. Default OFF, opt-in preview only, no persistence.

## Donor matrix

| Module (pinned repositories in references.json) | Classification / useful capability | Rubik authority and adaptation | Cost / rights / risk / QA |
|---|---|---|---|
| WORLD docs/32-VISUAL-SEMANTIC-META-TOKENS.md @1979efc73237fa506090d3c74b8de284af3740ce | Documentary concept: intent, vocabulary, hierarchy | Derived registry; recipe - session - element precedence | No copied code/assets; conceptual user-owned source; strict pure resolver tests |
| VECINIA tokens/catalog.js, resolver.js | Technique: ordered overrides; original resolver lacks validation | New small Rubik resolver validates enums, IDs, version, limits | No WorldStore; original implementation; deterministic serialization tests |
| builders/archetypes.js | Five executable cel/toon archetypes, not realistic PBR | No adoption in HERO cut | Context only future; no building facts imported |
| skin/three-house-prototypes.js | Technique: separated trim/reveal/sill planes, shared Standard/Physical materials | Existing Rubik window binding; original instanced stock profiles | No donor code/assets copied; depth/occlusion closeups + lifecycle |
| skin/residential-dna.js | Technique: identity/appearance, shared primitives; atlas/shader dependencies | Versioned opt-in source-ID binding only | Atlas/Fenestra excluded, rights unreviewed for distribution |
| skin/skin-binding.js | Concept/technique: versioned VISUAL_ONLY identity separation | Derived registry never receives mutable Project | No donor runtime; Project hash invariants |
| skin/glsl-visual-depth.js | Incompatible shader hooks for this cut | Not used | onBeforeCompile / shader framework excluded |
| skin/coastal-leisure-expansion.js, world-alive.js, scene-extras.js | Context/animation/environment techniques | No first-cut value | Not imported; F06 - F09 deferred |
| three-fenestra@0.2.0 + atlases | External dependency not authorized here | Not used | Rights/version review required before any future context use |

VECINIA has no root distribution license in the inspected tree. User identifies these repositories as owned sources, but that does not license third-party dependencies. This cut reimplements concepts in original Rubik code, copies no donor code/image/atlas/model and uses only the existing Three r160 MIT runtime. Reference PNGs inspected locally, hashes/paths recorded; no reference PNG redistribution in Git. Their visible atlas stretching, dark profiles and apparent rooms are donor evidence, not a Rubik baseline or quality certificate.

## Material inventory inherited unchanged

All 50 catalog assets retain existing per-entry CC0/provenance evidence. Four B2 identities are not one mechanism: oak verifies 256px originals then bakes 512px correlated color/normal/roughness; plaster/concrete verify 256px albedo then bake distinct 256px fields; marble preserves 256px stone pattern and existing normal, transfers color/roughness G. Repeat defaults 1000 - 1000mm, active SurfaceRenderer ownership, original-map fallback and disposal remain B2. Marble reads as beige jointed stone; no invented large veins. ARM.R unbound, B unknown.

Remaining 46 opportunities (no mass propagation): 9 wood - physical layout/orientation where source pattern agrees, not a blanket oak recipe; 10 ceramic - joint scale and measured finish; 9 stone - asset-specific pattern/finish, not invented geology; 9 mineral - separate fine cement/aggregate identities; 9 wall - fine finish only where compatible, preserve painted/patterned identities. Reuse scale/filtering/ownership mechanics first; any future advanced treatment needs identity-specific opt-in QA. F02 glass/frames are not floor textures.

## Future Delivery contract

Delivery may eventually consume an approved serializable visual decision: family/recipe/version, explicit source IDs, validated tokens, quality profile and enabled flag. Default OFF and original Rubik fallback are safe. Experimental decisions are VISUAL_PENDING_HUMAN and must not be auto-published/persisted. No requirement for Claude to import this branch now, no changes to its renderer/camera/navigation APIs. Integration remains human-reviewed and unmerged.

## Recoverable checkpoint / outstanding gate

Core/adapter unit QA: 3/3 PASS (strict resolver, declarative finish variants, compatibility including other-Project exclusion, original-frame restoration and resource disposal). Baseline browser QA: 3/3 PASS at 1440x900, 390x844, 844x390; Chrome151 on Windows/RTX5070Ti D3D11. 90 requestAnimationFrame samples per viewport: p50 16.7ms / p95 16.8ms, p99 not claimed. These are baseline frame intervals, not candidate improvement, GPU duration or mobile hardware certification. Full per-viewpoint metrics/hashes in baseline-evidence.json; PNGs local under C:/Users/temp123/work/visual-families-evidence/baseline-qa, not published.

Three baseline defects selected for the first recipe: flat undifferentiated stock section, no separate glazing bead/gasket reading, nearly black frame obscuring material response. Geometry of the real bay/interior and glass remain B2. D1/M1/M2/M3/G1 poses are fixed before integration. M3 is a second static oblique check; no animation/reflection mechanism changes, and no motion certification claimed.

Current status: TECHNICAL_PARTIAL / VISUAL_PENDING_HUMAN / BLOCKED at shared index.html seam only. New modules and tests exist; index.html remains byte-identical to B2. shared-seam.patch is a proposed, git-apply-check-validated diff, NOT an applied patch. Preview module is dormant until that seam is approved. No candidate render, candidate performance comparison, browser toggle/cleanup proof or visual convergence claim yet. Physical mobile remains pending.

Next operation after explicit shared-file contract approval: apply the proposed seam, inspect graphite/chalk at frozen views, test original/OFF equality and multiple/excluded windows, measure candidate p50/p95/resources/control response and lifecycle on the same profiles. Stop after 3-4 meaningful visual iterations if no convergence. Do not run CP2 again or change Delivery/Hybrid.
