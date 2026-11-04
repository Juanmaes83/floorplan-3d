# Hero Fidelity V2 — progress

- Repository: `Juanmaes83/floorplan-3d`.
- Branch: `feat/visual-families-hero-fidelity-v2`; no merge or deploy.
- Base: Visual Families V1 `de6ba2c22a33f5ca6d51939fc92813a5dd64bab5`; B2 `894607b38fa43a5e89a9f5296a41cdbcc989d5ce`.
- Mission: `51896b010ff16d0f4f10edc895c4dc5a231b8ced`.
- Phase: R3 second architectural system and R4 candidate coverage rendered and inspected. Human gate pending.
- Code tested / remote verified: `95c792f4a7aad3f027d0bb32d8cb4ada87f4d060` (`git ls-remote` matched).
- Improvement implemented: versioned `recessed-sash` and geometrically distinct `flush-sash`, aperture liners, separate frame/sash/bead/gasket sections, paired sills, clear per-bay glazing over real interiors and correlated plaster maps. Default OFF; no Project or collider mutation.
- Tests: unit 3/3 PASS; fixed-view, HDR, 12-window coverage and recessed/flush browser comparators PASS. Three full-coverage ON/OFF cycles leave zero owned resources. Desktop p50/p95 intervals 16.7/16.8 ms OFF and V2; not GPU time or physical mobile.
- Evidence: inspected permanent images for iterations 1–2, HDR probe, `coverage-12/` and `systems/` RECESSED/FLUSH D1/M1/M2/M3. Full PNGs and machine manifests remain local in `qa-results/`.
- State: IMPLEMENTED / VISUAL_PENDING_HUMAN / MEASURED_PARTIAL / MERGE_NOT_AUTHORIZED.
- Open defects: slight glass veiling and subtle mineral variation; HDR increases washout. Emulated-mobile, context loss and entry/exit lifecycle remain unreviewed.
- Next exact action: run emulated-mobile adaptive-quality capture and expanded lifecycle QA, inspect the images, publish results and prepare the unmerged handoff.
