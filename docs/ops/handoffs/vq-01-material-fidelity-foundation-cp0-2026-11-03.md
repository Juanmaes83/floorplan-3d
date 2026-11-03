# VQ-01 Material Fidelity Foundation — CP0 handoff

```yaml
workstream_id: vq-01-material-fidelity-foundation
mission: Establish a single Rubik-owned Material Fidelity Foundation from proven CL/CS/LT stones without parallel donor authorities.

owner:
  account: ChatGPT + Codex
  tool: Codex Terminal / ChatGPT supervisor

repository: Juanmaes83/floorplan-3d
baseline_sha: 0f9c6ead9732901681498efec326d1ca92e42ffe
branch: feat/vq-01-material-fidelity-foundation
remote_head_sha: 0f9c6ead9732901681498efec326d1ca92e42ffe
worktree: C:\Users\temp123\floorplan-3d-vq-01

status: BLOCKED
safe_to_resume: true

last_checkpoint:
  sha: 0f9c6ead9732901681498efec326d1ca92e42ffe
  validation: CP0 read-only architecture/collision/transplant preflight completed. 94 selected nonbrowser baseline tests passed; browser material suite did not start because playwright was absent in this checkout. No source changes were made.
  timestamp: 2026-11-03

completed:
  - Verified exact VQ worktree/branch/HEAD and clean status.
  - Locked provenance identity of CL-STONE-01, CS-STONE-01 and LT-STONE-01.
  - Mapped Rubik surface/material/project/presentation authorities and lifecycle ownership.
  - Compared baseline 0f9c6ea against frozen Hybrid 07ae6f9 and produced collision map.
  - Mapped PBR channels, color-space behavior, physical scale contract and shader/onBeforeCompile risks.
  - Designed minimal VQ architecture and deterministic future A/B plan.
  - Published VQ branch to origin at the exact baseline SHA.

verified:
  - CL-STONE-01 header status CAPABILITY_PROVEN; donor Juanmaes83/casa-larga@dee30681d465664a0aa714499cca7a15611f6eac.
  - CS-STONE-01 header status CAPABILITY_PROVEN; donor Juanmaes83/casa-serra@b47b775fae642439e8d42d6201ab5d1677d67f99.
  - LT-STONE-01 header status CAPABILITY_PROVEN; donor Juanmaes83/lintel-flat-2d@c6029d9bb0647483709a502daedc24c1dd7bc029.
  - Rubik remains Project/surface/mesh-binding authority; no Project schema change required for a private material mechanism.
  - Hybrid does not modify surface-renderer.mjs or surface-catalog.js but has HIGH future collision with shader material cloning/onBeforeCompile composition.
  - Casa Serra ARM semantics proven R=AO, G=roughness, B=UNKNOWN; B must not be used as metalness.
  - Rubik geometry uses millimetres converted to world metres; one world unit is one metre in the mapped 3D path.

files_or_areas_touched:
  - NONE in product branch during CP0.
  - Documentation-only tracking is maintained separately on docs/multi-agent-ops-status-2026-11-02.

external_outputs:
  - CP0 report supplied to Juanma/ChatGPT on 2026-11-03.
  - Remote VQ branch: feat/vq-01-material-fidelity-foundation@0f9c6ead9732901681498efec326d1ca92e42ffe.

uncommitted_or_unpushed:
  - NONE reported at CP0 close.

blockers:
  - Reconcile stale CS/LT stone proof-body/passport text with final CAPABILITY_PROVEN human gate while preserving history.
  - Establish asset-specific provenance/rights for exact Casa Serra product candidates before copying assets into Rubik.
  - Establish normal-map convention and end-to-end ImageBitmap/Three flip behavior for any new donor normal map.
  - Approve replacement of historical Rubik PBR policy that hardcodes two 512px Casa Serra candidates with donor-neutral selective tiers.
  - Lintel timber/plaster procedural mechanisms remain coupled to donor shader/room/geometry preparation; no procedural CP1 transplant is authorized.
  - Restore/install the repo's Playwright browser-QA environment in this checkout and establish browser baseline before visual/runtime claims.
  - Consolidate or explicitly define ownership of legacy floorMats/matCache versus SurfaceRenderer for the scoped VQ path.

known_unknowns:
  - Exact family-level/publisher-byte provenance for selected Casa Serra marble/oak assets.
  - Exact normal Y convention for candidate Casa Serra normals.
  - AO alignment/visual correctness on Rubik meshes; ARM.R remains unbound for now.
  - Future shader patch composition contract with Hybrid clones.
  - Browser/GPU baseline metrics until Playwright/browser QA is restored.

do_not_redo:
  - Do not restart the donor 7x14 audit; it is CLOSED at 5b818cf96d3b16c5a2a4352f3e14d70da4bc2a59.
  - Do not repeat broad quarry extraction of Museo/flat-to-3d before first Rubik A/B; use only gap-fill if a concrete need emerges.
  - Do not reimplement registered reveal in VQ-01 CP1/CP2; reveal is out of scope and Hybrid remains frozen.
  - Do not upgrade Three.js in this workstream.

next_exact_action:
  - Run CP0.1 blocker-closure mission only; no CP1 implementation until ChatGPT/ Juanma re-review and issue READY_FOR_CP1.

concurrency_warnings:
  - Codex is sole writer for feat/vq-01-material-fidelity-foundation when work resumes.
  - Do not write to feat/hybrid-registered-elevation-v1@07ae6f9.
  - Quarry stones are evidence/read-only unless a separate explicit provenance/proof reconciliation task authorizes metadata updates.
  - Documentation work belongs on docs/multi-agent-ops-status-2026-11-02, not on the VQ product branch unless the VQ feature contract itself is intentionally committed there later.

merge_status:
  ready: false
  human_gate: required
  notes: CP0 is complete but BLOCKED. Remote checkpoint is not approval. No merge is authorized.
```

## Supervisor scope decision after CP0

The first VQ implementation slice, once unblocked, must remain narrower than the original broad composition idea:

- Casa Serra: candidate PBR semantics/assets only after exact provenance/channel gates.
- Casa Larga: Standard/Physical material construction patterns and glass response.
- Lintel: physical-scale/coordinate mechanism first; procedural timber/plaster shader mechanisms are deferred until isolated and justified by A/B need.
- No registered reveal, camera, post, lighting/environment replacement, geometry/bevel upgrade or Three.js modernization in CP1/CP2.
- No `onBeforeCompile` material mechanism in the first slice unless a later explicit architecture checkpoint authorizes composition with Hybrid.

The target remains one Rubik-owned material/render path, not permanent donor systems.
