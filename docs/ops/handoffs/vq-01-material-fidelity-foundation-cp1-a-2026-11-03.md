# VQ-01 Material Fidelity Foundation — CP1-A durable fixture checkpoint

```yaml
workstream_id: vq-01-material-fidelity-foundation
mission: Durabilize and reproduce the canonical A fixture before any CP1 material mutation.

owner:
  account: ChatGPT -> Codex handoff
  tool: GitHub CI / Codex Terminal next

repository: Juanmaes83/floorplan-3d
baseline_sha: 0f9c6ead9732901681498efec326d1ca92e42ffe
branch: feat/vq-01-material-fidelity-foundation
remote_head_sha: f1c6da4e76dc016a7b8ce23b4353b32741c563c5
worktree: C:\Users\temp123\floorplan-3d-vq-01

status: IN_PROGRESS
safe_to_resume: true

last_checkpoint:
  sha: f1c6da4e76dc016a7b8ce23b4353b32741c563c5
  validation: CP1-A PASS. GitHub Actions workflow 41632402356 reproduced canonical A twice in fresh browser contexts and completed SUCCESS.
  timestamp: 2026-11-03

completed:
  - Added tracked canonical fixture tests/fixtures/vq01-material-ab-fixture.json.
  - Identified the exact CP0.1 Project fixture: oak floor on room index 0 + marble floor on room index 1.
  - Reproduced the documented Project JSON SHA-256 exactly: 9e0cf855bbc37576351f40aa109aebe253d4cb92ec620510b33975fdf61d0946.
  - Corrected a CP0.1 interpretation: 884x498 was an editor-pane observation, not the canonical full Presentation canvas. Canonical Presentation stage/canvas is 1440x900 at DPR 1.
  - Locked Presentation stop/state, camera, view options, lighting/environment fallback, material metrics, project bindings and lifecycle state.
  - Added tests/vq01-ab-fixture.browser.test.cjs with strict fixture assertions and two fresh-context reproductions.
  - Added isolated .github/workflows/vq-01-material-fixture.yml using Node 22.13.0, Playwright 1.62.1 and Three 0.160.0 without product package/lock mutation.
  - Verified CP1-A diff contains only fixture/test/workflow infrastructure; no product JS/index/assets/Hybrid changes.

verified:
  - Workflow run: 41632402356 — SUCCESS.
  - Workflow tested SHA: f1c6da4e76dc016a7b8ce23b4353b32741c563c5.
  - Artifact ID: 13228073916.
  - Artifact digest: sha256:2b5b07b7990fc380625bda559594a0f5aa8054acb689eb49cbb7c70b29ca9a52.
  - cp1-a-result.json: PASS / baseline 0f9c6ead... / project hash 9e0cf855... / runs=2 / fixtureStatus=cp1-a-locked.
  - A1 runtime JSON SHA-256 = A2 runtime JSON SHA-256 = 6ca18718f584ee7bd415c7f42ff83a1c610de7df7f45498f1066ce996be5ef5a.
  - A1 screenshot SHA-256 = A2 screenshot SHA-256 = f6749f6db8443167d9eb886e86a3b2e8643154e4ec0f81e4c23a203c18a48bbe.
  - Both runs: viewport/stage/canvas 1440x900 at DPR/pixelRatio 1; overview / Vista 1 de 2; moving=false; enhanced surface quality; oak+marble ready/ready; pendingAssets=0; no page/console errors.
  - Camera is frozen in the fixture with position/quaternion/target/FOV/aspect and reproduced within 1e-10 tolerance.
  - Lighting is frozen as neutral + synthetic fallback for this fixture because the harness intentionally reproduces the observed A state; B must use the same state. VQ-02 lighting/environment work remains out of scope.

files_or_areas_touched:
  - .github/workflows/vq-01-material-fixture.yml
  - tests/fixtures/vq01-material-ab-fixture.json
  - tests/vq01-ab-fixture.browser.test.cjs
  - No product source files changed in CP1-A.

external_outputs:
  - GitHub Actions run 41632402356 / artifact 13228073916.
  - Artifact contains a1-runtime.json, a2-runtime.json, a1-1440x900.png, a2-1440x900.png and cp1-a-result.json.

uncommitted_or_unpushed:
  - Remote branch state is known through f1c6da4e76dc016a7b8ce23b4353b32741c563c5.
  - Local Windows worktree state was NOT inspected by ChatGPT after these remote commits. Codex must fetch and reconcile before writing; never discard local unpushed work blindly.

blockers:
  - NONE for CP1-B under the exact canonical VQ-01 V1 contract.

known_unknowns:
  - New Casa Serra byte provenance remains unresolved; therefore new CS asset copy stays deferred.
  - Normal convention remains asset-specific.
  - AO remains unbound; ARM.B remains UNKNOWN.
  - The canonical automated A fixture intentionally uses the same synthetic light fallback captured by CP1-A; changing HDR/environment would invalidate causal A/B and belongs outside CP1.

do_not_redo:
  - Do not redo CP0, CP0.1 or CP1-A fixture discovery.
  - Do not replace the locked Project hash or assignments to make B easier.
  - Do not change camera, light, environment, stage, viewport, DPR or Presentation stop for B.
  - Do not touch Hybrid.
  - Do not open a new quarry.
  - Do not copy new Casa Serra assets.
  - Do not bind AO or interpret ARM.B as metalness.
  - Do not introduce onBeforeCompile, Lintel procedural shaders, registered reveal, Three upgrade or global cache refactor.

next_exact_action:
  - Codex resumes at CP1-B: implement the bounded material-fidelity slice under docs/product/vq-01-material-fidelity-foundation-contract-2026-11-03.md while preserving the locked A fixture. Then execute CP1-C and stop at READY_FOR_HUMAN_AB.

concurrency_warnings:
  - Codex is sole writer for feat/vq-01-material-fidelity-foundation / C:\Users\temp123\floorplan-3d-vq-01 once it resumes.
  - Before writing, reconcile local worktree against origin/feat/vq-01-material-fidelity-foundation@f1c6da4e76dc016a7b8ce23b4353b32741c563c5; do not reset away unknown local work.
  - ChatGPT documentation work remains on docs/multi-agent-ops-status-2026-11-02.
  - Hybrid and donor stones are read-only.

merge_status:
  ready: false
  human_gate: required
  notes: CP1-A is complete. CP1-B/CP1-C are authorized by the existing READY_FOR_CP1 contract. No CP2 or merge is authorized. Stop at READY_FOR_HUMAN_AB for Juanma PASS/FAIL/INCONCLUSIVE.
```

## Canonical A fixture summary

- Baseline product authority: `master@0f9c6ead9732901681498efec326d1ca92e42ffe`.
- Project SHA-256: `9e0cf855bbc37576351f40aa109aebe253d4cb92ec620510b33975fdf61d0946`.
- Assignments: `surface-oak-wood-planks` → floor room index 0; `surface-marble-01` → floor room index 1.
- Presentation: default / stop 0 / overview / `Vista 1 de 2` / enhanced.
- Viewport, stage and Presentation canvas: `1440×900`; DPR/pixelRatio `1`.
- The exact camera, view options, light/environment, surface metrics and material bindings live in the tracked fixture JSON and are asserted by the browser test.

CP1-B must treat that fixture as immutable A authority. If B requires changing the fixture or any non-canonized architecture option, stop with `CONTRACT_DELTA_REQUIRED`.
