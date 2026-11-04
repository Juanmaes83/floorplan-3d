# Hero Fidelity V2 — progress

- Repository: `Juanmaes83/floorplan-3d`.
- Branch: `feat/visual-families-hero-fidelity-v2`; no merge or deploy.
- Base: Visual Families V1 `de6ba2c22a33f5ca6d51939fc92813a5dd64bab5`; B2 `894607b38fa43a5e89a9f5296a41cdbcc989d5ce`.
- Mission: `51896b010ff16d0f4f10edc895c4dc5a231b8ced`.
- Phase: R5 candidate QA complete within the tested scope; R6 handoff pending. Human visual gate remains pending.
- Code tested / remote verified: `e044da7038c361aed46d6bdf7598cdd3a0758edf` (`git ls-remote` matched).
- Improvement implemented: versioned `recessed-sash` and geometrically distinct `flush-sash`, aperture liners, separate frame/sash/bead/gasket sections, paired sills, clear per-bay glazing over real interiors and correlated plaster maps. Default OFF; no Project or collider mutation.
- Tests: unit 3/3 PASS; fixed-view, HDR, 12-window coverage, recessed/flush and emulated-mobile lifecycle browser tests PASS. Three full-coverage ON/OFF cycles leave zero owned resources. Presentation exit now releases derived resources after entry restoration; reentry restores all 12 balanced windows; forced context loss leaves zero resources and unchanged Project/geometry.
- Performance: desktop and emulated 390×844 viewport p50/p95 intervals 16.7/16.8 ms OFF and V2. Balanced profile: 7740 triangles and 1,090,698 estimated bytes versus capture 9756/1,101,450. Not GPU time or physical mobile.
- Evidence: inspected permanent images for iterations 1–2, HDR probe, `coverage-12/`, `systems/` and `lifecycle/` MOBILE M1/G1. Full PNGs and machine manifests remain local in `qa-results/`.
- State: IMPLEMENTED / VISUAL_PENDING_HUMAN / MEASURED_PARTIAL / MERGE_NOT_AUTHORIZED.
- Open defects: slight glass veiling and subtle mineral variation; HDR increases washout. No physical-mobile or GPU-duration certification.
- Next exact action: run final focused regression on the definitive code SHA, publish remaining evidence and prepare a draft PR without merge or deploy.
