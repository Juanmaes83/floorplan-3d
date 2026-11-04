# Hero Fidelity V2 — progress

- Repository: `Juanmaes83/floorplan-3d`.
- Branch: `feat/visual-families-hero-fidelity-v2`; no merge or deploy.
- Base: Visual Families V1 `de6ba2c22a33f5ca6d51939fc92813a5dd64bab5`; B2 `894607b38fa43a5e89a9f5296a41cdbcc989d5ce`.
- Mission: `51896b010ff16d0f4f10edc895c4dc5a231b8ced`.
- Phase: R1 mechanism implemented; visual loop not yet run.
- Code tested: pending commit containing `F02/window-assembly@2`.
- Improvement implemented: aperture liners, distinct outer frame/sash/bead/gasket sections, paired interior/exterior sills, per-bay physical glazing over the real interior, and correlated plaster albedo/normal/roughness on associated neutral facade meshes. Default OFF; no Project or collider mutation.
- Tests: `node --test tests/visual-families.test.cjs` 3/3 PASS; Chromium real-fixture smoke 1/1 PASS with zero console/page errors; three representative windows ON, original frames/glass/facade restored OFF, zero owned resources OFF.
- Evidence: historical B2/V1 images inspected locally; V2 candidate not rendered yet.
- State: IMPLEMENTED / VISUAL_PENDING_HUMAN / LOCAL_ONLY / UNMEASURED / MERGE_NOT_AUTHORIZED.
- Open defects: visual quality, glass sorting, facade scale and candidate performance remain unreviewed.
- Next exact action: capture fixed D1/M1/M2/M3/G1 OFF and V2 views with Playwright/Chromium, open the images and correct the dominant visual defect.
