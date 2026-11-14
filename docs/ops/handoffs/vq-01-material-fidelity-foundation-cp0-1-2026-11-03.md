# VQ-01 Material Fidelity Foundation — CP0.1 closure / CP1 authorization handoff

```yaml
workstream_id: vq-01-material-fidelity-foundation
mission: Close CP0 blockers, freeze the first VQ-01 contract, then authorize only the bounded CP1 material-fidelity vertical slice.

owner:
  account: ChatGPT + Codex
  tool: Codex Terminal / ChatGPT supervisor

repository: Juanmaes83/floorplan-3d
baseline_sha: 0f9c6ead9732901681498efec326d1ca92e42ffe
branch: feat/vq-01-material-fidelity-foundation
remote_head_sha: 0f9c6ead9732901681498efec326d1ca92e42ffe
worktree: C:\Users\temp123\floorplan-3d-vq-01

status: APPROVED
safe_to_resume: true

last_checkpoint:
  sha: 0f9c6ead9732901681498efec326d1ca92e42ffe
  validation: CP0.1 blocker closure completed without product changes. Browser/material baseline established; worktree clean; contract now grants READY_FOR_CP1 subject to preflight identity and CP1-A fixture reproduction.
  timestamp: 2026-11-03

completed:
  - Reconciled CL/CS/LT proof-record status while preserving historical preparation text.
  - Established an exact Casa Serra donor asset ledger and deferred new product copies where publisher-to-donor byte origin/transform chain remains unconfirmed.
  - Established the tested Rubik ImageBitmap/Three flip path and marble-specific normal evidence; retained asset-specific normal convention.
  - Restored Playwright/browser QA through external tooling with no tracked package/lock changes.
  - Established material ownership as SAFE_BOUNDED: SurfaceRenderer owns new VQ surface resources; legacy caches remain in place for the first slice.
  - Deferred Lintel procedural shaders, registered reveal and donor room/drawable/environment dependencies.
  - Produced a reproducible external A baseline/manifest without changing product source.
  - Published the canonical VQ-01 V1 contract: docs/product/vq-01-material-fidelity-foundation-contract-2026-11-03.md.
  - Issued READY_FOR_CP1 for the contract-bounded first vertical slice only.

verified:
  - Product worktree identity at CP0.1 close: C:\Users\temp123\floorplan-3d-vq-01 / feat/vq-01-material-fidelity-foundation / local+remote HEAD 0f9c6ead9732901681498efec326d1ca92e42ffe / clean.
  - Playwright 1.62.1 and existing Chromium were usable from external tooling; no product package/lock mutation.
  - tests/material-detail.browser.test.cjs: 5 PASS, 0 FAIL, 0 SKIP.
  - selected tests/surfaces.browser.test.cjs baseline cases: 2 PASS, 0 FAIL, 0 SKIP.
  - selected presentation-reveal.browser.test.cjs baseline case: 1 PASS, 0 FAIL, 0 SKIP.
  - tests/surfaces.test.cjs: 8 PASS, 0 FAIL, 0 SKIP.
  - Browser baseline reported no page/console errors in the executed material paths; separate probes reported no WebGL/shader/renderer warnings.
  - Baseline Project JSON SHA-256: 9e0cf855bbc37576351f40aa109aebe253d4cb92ec620510b33975fdf61d0946.
  - Baseline viewport 1440x900, DPR 1, observed 3D canvas 884x498; camera/light/stage/project identity reproduced across two runs.
  - CL-STONE-01, CS-STONE-01 and LT-STONE-01 remain CAPABILITY_PROVEN at their pinned donor revisions.
  - Hybrid remains frozen at 07ae6f9969cae9df746443e97410e40cee2e932a and was not modified.
  - master remains the functional baseline at 0f9c6ead9732901681498efec326d1ca92e42ffe.

files_or_areas_touched:
  - NONE in the VQ product branch during CP0.1.
  - Quarry 20-sculpt metadata only: seven proof/passport/REA files were reconciled outside the product worktree.
  - Documentation authority added/updated only on docs/multi-agent-ops-status-2026-11-02.

external_outputs:
  - C:\Users\temp123\work\vq01-qa-tooling\metadata-diff.patch
  - C:\Users\temp123\work\vq01-qa-tooling\normal-harness.cjs
  - C:\Users\temp123\work\vq01-qa-tooling\baseline-manifest.json
  - C:\Users\temp123\work\vq01-qa-tooling\baseline-1440x900.png
  - C:\Users\temp123\work\vq01-qa-tooling\material-detail\1440x900-metrics.json
  - These paths are local evidence from the CP0.1 report and are not claimed as shared/durable repository artifacts.

uncommitted_or_unpushed:
  - Product worktree: NONE reported at CP0.1 close.
  - External tooling/cache and quarry metadata evidence exist outside the product branch as described above.

blockers:
  - NONE blocking CP1 under the exact canonical VQ-01 V1 contract.

known_unknowns:
  - Exact publisher-to-donor transformation/byte origin for new Casa Serra candidate files remains unconfirmed; therefore NEW_CS_ASSET_COPY stays deferred.
  - Normal convention remains asset-specific; evidence for marble must not be generalized to oak/other families.
  - AO alignment/UV correctness is not established for Rubik; ARM.R remains unbound in CP1.
  - ARM.B remains UNKNOWN and must never be inferred as metalness.
  - renderer.info.programs was not exposed by the baseline instrumentation.
  - Full camera/light/stage/timing values currently live in the CP0.1 external manifest; CP1-A must durabilize them before material mutation.

do_not_redo:
  - Do not restart donor 7x14 audit.
  - Do not extract more donors for VQ-01 before first Rubik A/B unless a later explicit gap-fill mission is authorized.
  - Do not copy new Casa Serra product bytes in CP1.
  - Do not investigate/implement Lintel procedural shaders or registered reveal in CP1.
  - Do not upgrade Three.js.
  - Do not refactor all legacy material caches before A/B.
  - Do not touch feat/hybrid-registered-elevation-v1.

next_exact_action:
  - CP1-A: in the VQ branch, first persist/durabilize the CP0.1 A/B fixture and reproduce A at master@0f9c6ead9732901681498efec326d1ca92e42ffe with no drift. Only after that succeeds may Codex implement CP1-B and CP1-C inside docs/product/vq-01-material-fidelity-foundation-contract-2026-11-03.md.

concurrency_warnings:
  - Codex is sole writer for feat/vq-01-material-fidelity-foundation / C:\Users\temp123\floorplan-3d-vq-01 during CP1.
  - ChatGPT documentation edits stay on docs/multi-agent-ops-status-2026-11-02.
  - Claude/other agents must not write VQ or Hybrid without a new explicit lease/mission.
  - Hybrid and quarry stones are read-only during CP1 except a separately authorized evidence/provenance mission.

merge_status:
  ready: false
  human_gate: required
  notes: READY_FOR_CP1 authorizes only CP1-A/B/C under the exact VQ-01 V1 contract. It is not visual approval, CP2 approval or merge authorization. The next product gate is READY_FOR_HUMAN_AB followed by Juanma PASS/FAIL/INCONCLUSIVE.
```

## Contract decision summary

The following CP0.1 conclusions are now binding for CP1:

- no new Casa Serra asset copy;
- normal convention is asset-specific;
- AO is recognized but unbound;
- `ARM.B=UNKNOWN` and must not become metalness;
- SurfaceRenderer owns new VQ surface resources;
- legacy cache split is tolerated as a bounded first-slice boundary;
- no `onBeforeCompile`, registered reveal, Lintel procedural shader, Three upgrade, Hybrid dependency or new quarry.

The following remain technical options, not product architecture decisions:

- global `BASE/PBR1K/HIGH/DELIVERY` tiers;
- general relaxation of 512 px / 512 KiB restrictions;
- blanket 1K/2K policy;
- KTX2;
- global independent-channel framework / AO binding;
- full provenance-schema migration;
- full cache/material refactor;
- new Casa Serra assets based only on inferred publisher similarity.

If CP1 cannot achieve its bounded A/B without one of those options, Codex must stop with `CONTRACT_DELTA_REQUIRED` rather than silently expanding scope.
