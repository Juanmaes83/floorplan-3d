# Hero Fidelity V2 — progress

- Repository: `Juanmaes83/floorplan-3d`.
- Branch: `feat/visual-families-hero-fidelity-v2`; no merge or deploy.
- Base: Visual Families V1 `de6ba2c22a33f5ca6d51939fc92813a5dd64bab5`; B2 `894607b38fa43a5e89a9f5296a41cdbcc989d5ce`.
- Mission: `51896b010ff16d0f4f10edc895c4dc5a231b8ced`.
- Phase: R1 iterations 1–2 rendered, corrected and visually inspected; perceptible improvement recorded, human gate pending.
- Code tested / remote verified: `49555e9d063cb39ee47d5a90e7e35dfd70a7eba8` (`git ls-remote` matched).
- Improvement implemented: aperture liners, slimmer distinct outer frame/sash/bead/gasket sections, paired interior/exterior sills, clearer per-bay physical glazing over the real interior, and correlated plaster albedo/normal/roughness on associated neutral facade meshes. Default OFF; no Project or collider mutation.
- Tests: `node --test tests/visual-families.test.cjs` 3/3 PASS; `tests/hero-fidelity-v2.browser.test.cjs` 1/1 PASS on iteration 2, with 10 OFF/V2 captures, zero console/page errors, and unchanged Project/rendered geometry.
- Evidence: historical B2/V1 and iterations 1–2 OFF/V2 D1/M1/M2/M3/G1 images inspected. Permanent compressed comparison, detail and medium views are published under `evidence/iteration-1/` and `evidence/iteration-2/`; full PNGs and machine manifests remain local in `qa-results/`.
- State: IMPLEMENTED / VISUAL_PENDING_HUMAN / UNMEASURED / MERGE_NOT_AUTHORIZED.
- Open defects: slight glass veiling and subtle mineral variation; HDR was not evaluated because of MIME rejection. Propagation, glass sorting and candidate performance remain unreviewed.
- Next exact action: apply the existing presentation-harness HDR MIME rule in the V2 harness, capture a separately declared lighting comparison, inspect it and publish the result before expanding compatible coverage.
