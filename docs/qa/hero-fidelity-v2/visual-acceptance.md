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

## Iteration 3 — separately declared HDR comparison, code `b0696419822eebedefc7984c286d3b6fc19d6800`

Corrected only the V2 test-server MIME for `.hdr`, reusing the presentation harness rule. The real `studio-small-09-1k.hdr` loaded successfully: status/environment `hdr`, 1,615,248 source bytes and 4,194,304 estimated PMREM bytes; exposure remained 1.04 with the neutral preset. `tests/hero-fidelity-v2-lighting.browser.test.cjs`: 1/1 PASS, three captures, no browser errors/warnings and unchanged Project/rendered geometry.

Opened the synthetic/HDR contact sheet and HDR D1/M1/M2 images. HDR gives the graphite a brighter metallic response, but washes out the bedroom, facade and glass more than the synthetic comparison. It is recorded as a valid technical lighting probe but not selected as superior visual evidence. No production lighting or material constants were changed for this probe.

Next: apply the already inspected iteration-2 recipe to every compatible real window in an explicit experimental capture, record exclusions and inspect general/facade views. Human approval remains pending.

## Coverage — all compatible real windows, code `5ad25c912004c81de3b549bb0ae70cf7c814a515`

Applied the inspected iteration-2 recipe explicitly to all 12 existing windows: 12 compatible, 12 treated, zero excluded. Opened OFF/V2 M1, M3 and G1 plus the contact sheet. The treatment is coherent across narrow and wide openings, preserves the real rooms and shows the same sill/reveal language on the visible facades. No new overlap or opaque-glass defect was observed in these views.

`tests/hero-fidelity-v2-coverage.browser.test.cjs`: 1/1 PASS. Shared resources at full coverage: 1 geometry, 6 materials, 3 textures, 69 owned meshes, 22 facade meshes, 9756 triangles and 1,101,450 estimated bytes, all within the declared budget. Three ON/OFF cycles returned every owned-resource count to zero; Project/rendered geometry stayed unchanged and no browser errors/warnings occurred.

Desktop ANGLE/NVIDIA frame intervals over 90 samples: OFF p50/p95 16.7/16.8 ms; V2 p50/p95 16.7/16.8 ms. This is a partial desktop navigation signal, not GPU duration, physical-mobile certification or proof for every scene.

Next: demonstrate a second architecturally distinct frame system using the same semantic recipe, then run emulated-mobile and expanded lifecycle checks without claiming a physical-device result.

Human verdict: VISUAL_PENDING_HUMAN.
