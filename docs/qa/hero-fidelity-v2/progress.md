# Hero Fidelity V2 — progress

- Repository: `Juanmaes83/floorplan-3d`.
- Branch: `feat/visual-families-hero-fidelity-v2`; no merge or deploy.
- Base: Visual Families V1 `de6ba2c22a33f5ca6d51939fc92813a5dd64bab5`; B2 `894607b38fa43a5e89a9f5296a41cdbcc989d5ce`.
- Mission: `51896b010ff16d0f4f10edc895c4dc5a231b8ced`.
- Phase: R1 corrected; R2 HDR probe rendered and inspected. HDR technically valid but not selected over the clearer synthetic comparison; human gate pending.
- Code tested / remote verified: `b0696419822eebedefc7984c286d3b6fc19d6800` (`git ls-remote` matched).
- Improvement implemented: aperture liners, slimmer distinct outer frame/sash/bead/gasket sections, paired interior/exterior sills, clearer per-bay physical glazing over the real interior, and correlated plaster albedo/normal/roughness on associated neutral facade meshes. Default OFF; no Project or collider mutation.
- Tests: unit 3/3 PASS; fixed-view comparator 1/1 PASS on iteration 2; HDR comparator 1/1 PASS on `b069641`, with real 1,615,248-byte HDR/PMREM, three captures, zero browser errors/warnings and unchanged Project/rendered geometry.
- Evidence: historical B2/V1, iterations 1–2 and the separate synthetic/HDR comparison inspected. Compressed permanent images are under `evidence/iteration-1/`, `iteration-2/` and `iteration-3-hdr/`; full PNGs and machine manifests remain local in `qa-results/`.
- State: IMPLEMENTED / VISUAL_PENDING_HUMAN / UNMEASURED / MERGE_NOT_AUTHORIZED.
- Open defects: slight glass veiling and subtle mineral variation. HDR increases washout and is not the selected evidence lighting. Compatible coverage, glass sorting and candidate performance remain unreviewed.
- Next exact action: capture all compatible real windows with the iteration-2 recipe, record explicit exclusions, inspect general/facade views and publish R4 candidate coverage.
