# Hybrid Registered Elevation V1 — donor provenance

Donor: `Sam1983Aing/flat-to-3d` @ `d7b9b69753d3af679535ee56695a05c8d955c3c6` (MIT, Copyright (c) 2026 Samnang Aing).
File: `07-sunlit-elevation/engine/elevation.js`. `07-sunlit-elevation/a-one-door/page.js` was read only to see how the
engine is driven (sweep `uSweep.z` from absolute progress, sun direction set by the page); nothing of it was taken.

## Phase A — STONE (taken)

`js/vendor/donor-elevation-stone.mjs` (temporary, never loaded by the product), extracted verbatim by marker:

- `GLSL_COMMON`: `revealAt` (diagonal sweep in world coordinates), `lineAt` / `lineFade` (pixel-width ink lines and
  density fade, anti-moiré), `frontBand` (laser + halo + grid at the sweep front), `hatchWipe`, `detailWipe`, noise,
  `planeUV`.
- `mat()` onBeforeCompile pieces: world position / normal varyings after `#include <worldpos_vertex>`, the
  `shadowmask_pars_fragment` include, the reveal/discard prelude of `main()`, and the composite after
  `#include <dithering_fragment>`: paper, shade = 1 − `getShadowMask()` · smoothstep(N·sun) (hatching read from the shadow
  map), 45° hatch, `mix(paper, lit, reveal)`, front band.

Not taken: Lenis, scroll/`run()`, camera keys, the townhouse/street/figure geometry, brick/zinc/wood material kinds and
their height/normal perturbation, porch AO, drafting lines (`lineMat`), HUD/beats/radar copy, sales/address data, sun
angles (`CONVENTION`, `LATE`), environment sphere.

## Phase B — PROVE

`scripts/qa/hybrid-elevation-stone-proof.cjs` runs the stone unmodified on Three r160 (Chromium, SwiftShader) with a
synthetic wall + projecting slab + pier and one shadow-casting directional light: compiles; technical state is paper
where lit and hatched where the shadow map says shade; the reveal exists; two cameras with different pose and FOV see the
same world points on the same side of the boundary (registered, not screen space); returning to the same uniforms gives
identical pixels (reverse, no accumulation). 7/7 checks.

## Phases C/D — SCULPT + RUBIKIZE (what survives)

`js/presentation-elevation-hybrid.js` carries the full MIT notice in its header. Surviving donor-derived parts, each
rewritten for Rubik inputs:

- `lineAt` / `lineFade` → `hybridLineAt` / `hybridLineFade` (unchanged maths).
- shade = 1 − `getShadowMask()` · smoothstep(−0.02, 0.06, N·sun) (unchanged maths); `sun` is now the direction of Rubik's
  own directional light (solar snapshot included), never a donor convention.
- `revealAt` sweep smoothstep and the diagonal direction (√½, −√½), now in façade-local metres (centre/tangent/normal of
  `FloorPlanPresentationElevation`), threshold from Story `materialReveal`.
- `frontBand` laser + halo (grid removed), accent = Rubik.
- paper composite after `dithering_fragment`; paper / ink colours (0xf2efe7 / 0x1d1c19).
- ink contours: `EdgesGeometry(geo, 25°)` → `LineSegmentsGeometry.fromEdgesGeometry` → `LineSegments2` + `LineMaterial`
  (width in CSS px × DPR) with visibility cut by the same sweep — the donor `add()`/`lineMat()` mechanism, applied to the
  target meshes' own geometry (no second model). Requires three@0.160.0 line addons, vendored through
  `scripts/vendor-three.cjs` (official package, MIT; existing vendored files unchanged).

Removed in sculpture: material kinds (brick/zinc/wood…), height/normal perturbation, porch AO, drafting animation
(`uDraw`, `vT0`), hatch/detail wipes, noise, discard modes, depth cue, `uReal`, `realLines`, all donor geometry, camera
keys, sun angles, copy and data.

## Phase E — CLEAN

The stone (`js/vendor/donor-elevation-stone.mjs`) and its proof harness (`scripts/qa/hybrid-elevation-stone-proof.cjs`)
were removed from the tree after the integrated visual QA; both remain in history at `6a646a3` for differential
diagnosis (STONE → SCULPT → RUBIK). No production code loads donor URLs or runtime.
