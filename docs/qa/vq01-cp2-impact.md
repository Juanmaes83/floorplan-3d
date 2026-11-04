# VQ-01 CP2 impact checkpoint

Authority: Juanma's CP2 mission in the implementation session. CP1 is technical PASS / visual NON-PASS. This checkpoint precedes product mutation.

## Frozen comparison

A0 `0f9c6ead9732901681498efec326d1ca92e42ffe`; B1 `fac408025c9cc11ed554f6f395cd3153d1838861`. Clean, matching local/remote B1 at entry. No local work was discarded. Hybrid and remote master match their frozen SHAs.

V2 remains sufficient: same Project, assignments, 1440x900 DPR1, Presentation overview, camera, geometry and synthetic environment. No V3 is needed. `tests/fixtures/vq01-cp2-views.json` freezes five QA-only closeups before B2. Plaster and concrete are on opposite walls and therefore get separate views. Camera poses use the existing pose API and never become product presets. Global screenshots preserve the CP1 capture protocol; detail images are immediate canvas readbacks without UI. `vq01-cp2-baselines.json` records two fresh A0 and B1 runs, PNG hashes, runtime identities and pixel deltas. All ten baseline closeups were inspected for actual material coverage.

## Stone → prove → sculpt → Rubikize

Sources read from the existing immutable stones under `.quarry/stones` (no quarry changes):

- CL `dee30681d465664a0aa714499cca7a15611f6eac`, `00-source/js/materials.js`: `tex/pbr/makeMaterials`; common physical scale for all maps, anisotropic filtering, stone finish and transparent Physical glass. Reject `inkAware`, room AO and reveal.
- CS `b47b775fae642439e8d42d6201ab5d1677d67f99`: existing Rubik verified base/normal/roughness triplets only. G is roughness; R stays unbound, B stays unknown. The current `marble-01` base depicts jointed beige stone, not broad-veined marble. Preserve that material identity.
- LT `c6029d9bb0647483709a502daedc24c1dd7bc029`, `001 Lintel/v10/code-materials.js`: physical height/gradient and bounded slope (lines 27–100), oak grain/joints/per-board response (175–267), plaster trowel/stipple (306–338), concrete aggregate/pores/roughness (384–417). Direct builders depend on `drawable` and `onBeforeCompile`; those are rejected. Translate the surface math into deterministic finite CPU-baked color/normal/roughness maps with mipmaps, no shader hook, room state or donor runtime.

## Executable impact plan

1. Stone: retain verified channels; use a Rubik Physical finish and a local texture transfer preserving the source stone pattern. Keep map alignment and physical repeat explicit. Do not invent marble veins or infer relief from brightness.
2. Timber: prototype LT-inspired physical boards, growth-ring grain, pores and joint relief as a correlated deterministic map set. Keep a verified original fallback. Normal signs come from the authored height derivatives, independently of the unresolved donor oak convention.
3. Plaster/concrete: separate finite procedural fields: fine trowel/stipple versus mineral cloud/aggregate/pores, with corresponding normal and spatial roughness. No geometry displacement. Mipmaps limit subpixel detail; no generic channel framework.
4. Glass/metal: evaluate existing Physical glass transmission/IOR/thickness with the frozen synthetic environment; preserve baseline if sorting/refraction introduces artifacts. Keep metal in its existing path.

SurfaceRenderer owns all generated surface textures and disposal. Initial ceilings: zero extra geometries, at most 8 extra renderer textures and 8 MiB extra surface GPU estimate. No global cache refactor or material schema. Procedural maps max 512px; no new donor bytes. Check deterministic hashes, height-to-normal sign, seams, channel semantics, fallback, base/enhanced, repeated recreation and context restoration. After each mechanism inspect its fixed closeup before proceeding. Final exact-SHA A0/B1/B2 workflow publishes global/details, deltas and diagnostics. Human score is unassigned: A0=100; desired B2≈130 is a design target, not a measured result.

Visual verdict: PENDING_JUANMA.

## Rejected glass trial and final QA boundary

A local Physical transmission trial (`transmission=.9`, `ior=1.5`, `thickness=.01`, `opacity=1`) reproduced, but the fixed window closeup showed a blue cast and softened interior without a convincing improvement under the frozen environment. It was reverted before the candidate checkpoint. Glass and metal retain B1 parameters and ownership; no extra transmission target is shipped. The mechanism from CL finally retained is coherent Physical stone/wood finish and aligned filtered maps, not a new glass system.

Full local suites: surfaces unit + finite recipe unit 12/12; material-detail browser 5/5; surfaces browser 7/7. Generated historical QA screenshots were saved externally and restored in the product tree. CP1's V2 workflow is retained as a manual exact-B1 historical replay; CP2 has a separate workflow with measured resource deltas, rather than applying CP1's identical-memory requirement to a richer material candidate. Original CP1 fixtures and tests are not rewritten.

CI run 41790140871 stopped on A0's combined capture-readiness wait, after its surfaces were ready. Protocol v3 splits the real pending-assets check from control readiness, records both control states and replays the existing `floorplan-asset-status` notification after actual completion on every side. This refreshes the historical missed UI notification without changing readiness data or baseline product source. V2 evidence remains historical; final comparisons must all use v3. The prior run 41789897374 was cancelled when superseded by the explicit shell/pipefail QA correction.

## CP2-B evidence and bounded corrections

The first baked wood/pores prototype was rejected locally for overly periodic grain and lattice-shaped pore normals. The revised recipe uses longitudinal multiscale grain, per-board log-section rings, sparse radial pores and four subpixel samples per texel. Finite maps deliberately omit LT's room-specific wear, world lookup, shaders and per-fragment octave logic. Mipmaps replace its screen-space filtering; this is a bounded approximation, not the full donor shader.

A strict repeated capture exposed asynchronous export UI readiness: enabled/disabled buttons differed between fresh contexts. `vq01-cp2-capture-v2.json` records the common readiness correction. A0 and B1 were regenerated from their exact detached SHAs and passed before accepting B2 repeats; original CP2-A evidence is preserved. No pose, Project, lighting or capture composition changed. SurfaceRenderer now announces terminal detail state through the existing `surface-status` event, and Presentation refreshes capture availability on that event. This fixes the actual late-material readiness path rather than hiding UI pixels.

Local procedural lifecycle proof: three enhanced/base/Presentation exit/re-entry cycles, forced CPU bake failure retaining verified albedo, real WEBGL_lose_context and reload recovery. Memory remains 1178 geometries / 21 textures across cycles and recovery; generated+verified surface GPU estimate 7,340,040 bytes. Context loss empties SurfaceRenderer records and pending assets. Rubik baseline recovery is reload; live context restoration is not claimed. No new donor asset provenance research was necessary: existing CS verified channels suffice for the stone transfer; generated fields are Rubik code, not copied image bytes.
