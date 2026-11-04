# Hero Fidelity V2 — progress

- Repository: `Juanmaes83/floorplan-3d`.
- Branch: `feat/visual-families-hero-fidelity-v2`; no merge or deploy.
- Base: Visual Families V1 `de6ba2c22a33f5ca6d51939fc92813a5dd64bab5`; B2 `894607b38fa43a5e89a9f5296a41cdbcc989d5ce`.
- Mission: `51896b010ff16d0f4f10edc895c4dc5a231b8ced`.
- Phase: R4 candidate coverage rendered and inspected: 12/12 compatible real windows treated, zero exclusions. Human gate pending.
- Code tested / remote verified: `5ad25c912004c81de3b549bb0ae70cf7c814a515` (`git ls-remote` matched).
- Improvement implemented: aperture liners, slimmer distinct outer frame/sash/bead/gasket sections, paired interior/exterior sills, clearer per-bay physical glazing over the real interior, and correlated plaster albedo/normal/roughness on associated neutral facade meshes. Default OFF; no Project or collider mutation.
- Tests: unit 3/3 PASS; fixed-view and HDR comparators PASS; full-coverage browser test 1/1 PASS, three ON/OFF cycles with zero owned resources OFF and unchanged Project/rendered geometry. Desktop 90-frame p50/p95: OFF 16.7/16.8 ms, V2 16.7/16.8 ms; not GPU time or physical mobile.
- Evidence: inspected permanent images for iterations 1–2, separate HDR probe and `coverage-12/` OFF/V2 M1/M3/G1. Full PNGs and machine manifests remain local in `qa-results/`.
- State: IMPLEMENTED / VISUAL_PENDING_HUMAN / MEASURED_PARTIAL / MERGE_NOT_AUTHORIZED.
- Open defects: slight glass veiling and subtle mineral variation; HDR increases washout. Second architectural variant, emulated-mobile, context loss and entry/exit lifecycle remain unreviewed.
- Next exact action: implement and capture a geometrically distinct second frame system through the existing semantic token, then run adaptive/mobile and expanded lifecycle QA.
