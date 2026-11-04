# Hero Fidelity V2 — visual acceptance

## Iteration 1 — code `9e8829a51ca93ee3661cd0d5300af3ac207e63e7`

Opened and inspected OFF/V2 D1, M1, M2, M3 and G1 Chromium renders of the real fixture. The candidate adds a legible sill and nose, deeper lateral reading and distinct frame/sash/bead lines. M1 and M2 show a perceptible architectural improvement rather than a finish-only change; the real bedroom remains visible and G1 preserves the source geometry.

Remaining defects: the combined outer frame and sash still read too dark/heavy, glazing slightly washes out the interior, and mineral facade variation is too subtle at medium distance. Iteration 1 is not human-approved and is not a propagation gate.

Next correction: reduce stock overlap, improve graphite response and lower glazing opacity/transmission while retaining the new aperture/sill geometry. Then repeat the same cameras and lighting.

Lighting for both variants: requested `assets/environments/studio-small-09-1k.hdr`; effective environment is synthetic fallback because the harness reports invalid HDR MIME; exposure 1.04, neutral preset. No HDR evaluation is claimed.

## Iteration 2 — code `49555e9d063cb39ee47d5a90e7e35dfd70a7eba8`

Repeated the same OFF/V2 cameras and lighting after reducing the outer section from 48 to 38 mm, the sash from 32 to 26 mm and maximum frame depth from 72 to 56 mm. Graphite response is lighter and glazing opacity/transmission is reduced. Opened the new D1, M1, M2, M3 and G1 renders plus the OFF/V2 contact sheet.

The slimmer perimeter and mullions read less heavy, the real bedroom is clearer, and the reveals, paired sills and nose remain legible. No new occlusion or construction regression was observed in the inspected views. This is a perceptible improvement over OFF and iteration 1 in detail and medium views, not only a finish change. Remaining limitations are slight glass veiling, subtle facade grain and the unresolved HDR fallback. Human approval is still pending.

## Iteration 2 QA

`tests/visual-families.test.cjs`: 3/3 PASS. `tests/hero-fidelity-v2.browser.test.cjs`: 1/1 PASS; 10 captures, no browser errors/warnings, Project and rendered geometry unchanged. Resources remain 1 geometry, 6 materials, 3 textures, 19 owned meshes, 6 facade meshes, 2964 triangles and 1,065,226 estimated bytes. Rendering used the NVIDIA GeForce RTX 5070 Ti through ANGLE; this is not a mobile or GPU-time certification.

Next independent correction: serve the existing HDR with the presentation harness MIME rule and capture a separately declared lighting comparison before expanding coverage.

Human verdict: VISUAL_PENDING_HUMAN.
