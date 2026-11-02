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
