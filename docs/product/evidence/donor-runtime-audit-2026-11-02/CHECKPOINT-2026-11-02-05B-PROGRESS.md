# Handoff — 05-b partial progress (IN_PROGRESS)

This is a remote recoverability checkpoint, **not** validation of 05-b. Its commit is the HEAD SHA containing it; compare `git rev-parse HEAD` with `git ls-remote origin refs/heads/audit/donor-runtime-7x14-2026-11-02`. Previous actual remote HEAD before this checkpoint: `710664f10ea5bf71f5fc069a334314d00d77aab6`. The user's older known SHA `53e3e175ef461f23cc9966d56dd6d719fdb17c96` is not the current branch tip. Frozen Rubik baseline: `0f9c6ead9732901681498efec326d1ca92e42ffe`. Pinned donor: `Sam1983Aing/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6`. Sole branch/worktree: `audit/donor-runtime-7x14-2026-11-02`, `C:\Users\temp123\floorplan-3d-donor-runtime-audit-2026-11-02`.

## Exact status

**8/14 takes and 168/294 take gates are validated.** `03-a-open-the-lens` is already `COMPLETE` and passed 21/21 at its earlier checkpoint; do not regress it to partial. `05-a-the-programme` is also validated 21/21 at the immediately preceding checkpoint. `05-b-1-1-site-sheet` remains **`PARTIAL / IN_PROGRESS`**: capture `IN_PROGRESS`, reconciliation `NOT_STARTED`, validation `NOT_STARTED`, and **zero accredited 05-b gates**. No 05-b manifest or reconciliation exists yet. The plan is `READY_FOR_CAPTURE`, not validated. No current technical blocker prevents continuing, but remaining capture, visual review, reconciliation and the 21 gates are required.

| Viewport | Current valid evidence | Remaining |
|---|---|---|
| desktop | Original Discovery 7→0→14→0, 21 samples, forward/reverse telemetry and video; `semantic-correction-1` captures 12 planned milestones with exact week-14 completion | Review all 12 milestones, reconcile and validate |
| portrait | Original Discovery 7→0→14→0 and 21 samples; original semantic M01–M11 usable | Correct semantic M12 terminal: it stopped at week 13.9995 and still showed the donor fallback; then review and validate |
| landscape | Original Discovery 7→0→14→0 and 21 samples | Fresh semantic pass, review and validate |

All three Discovery passes used independent canonical `?dir=b` browser contexts and natural wheel input. Native scrollY stayed 0, while the exposed virtual week changed. Desktop forward/reverse telemetry has 312/233 samples, portrait 303/243, landscape 505/459. All returned to virtual week 0, `SHOT=top`, the same route and visually equivalent start. The initial site sheet prints a foundation plan and fourteen-week programme as a ground texture. The house builds over that sheet; camera changes top→b2→b3→top, and ghost future pieces appear during the middle stages. The canonical B route does **not** automatically take the five-stop interior tour, although room tabs are offered. At weeks 13.5–14, all static `PHASES` have ended while `T<14`; `view.js:491` therefore falls back to **SITE MOBILISATION** on the nearly complete house. The exact week-14 branch says **PRACTICAL COMPLETION**. This is observed in desktop and portrait and source-confirmed by `house.js:9-24` and `view.js:285-329,491-500,631-776`.

The original desktop semantic pass and `semantic-correction-1` are both preserved. Original M12 stopped just short of week 14 and wrongly appeared to represent completion; correction-1 captures week 14 exactly. Portrait original M12 remains short of week 14 and is **not** valid evidence of completion. The current semantic script changed its terminal target threshold, but portrait still stopped at 13.9995 because its 500-input cap was reached; do not call portrait M12 complete. At 390×844 the top controls, paper plan/programme and HUD crop/overlap. At 844×390 the phase and date cards cover much of the sheet. These are donor limitations pending final review. Hidden WebGL resource identity, exact camera history after reverse and product suitability are non-blocking unknowns, not inferred from images.

## Recoverability and integrity

RAW remains untouched at `C:\Users\temp123\donor-runtime-audit-RAW-2026-11-02`. Current inventory: **1,693 files, 2,472,910,835 bytes**. Sorted virtual package-content SHA256: `1eb91bad36c799e8703150e68078bff7325bec9bbc3af63cb65f69d439ab3d39`; inventory manifest SHA256: `b01b22992122ffbb0db49418e500a2ecc4ebf08375fda4b0d55df718dc3d6be6`. This is a directory-content hash, not a ZIP hash. `raw-inventory.json` records path, bytes and SHA256 for every RAW file; `hashes/05-b-1-1-site-sheet-partial.sha256` lists all 159 05-b RAW files. `takes/05-b-1-1-site-sheet/partial-raw/` mirrors and hash-verifies all **147 non-video files (46,288,706 bytes)**, including three-viewport Discovery screenshots, telemetry and metadata, both desktop semantic attempts, portrait semantic screenshots, plus the current semantic plan. `partial-evidence-index.json` identifies the selected attempts and all 12 videos. The **12 WebM files (47,104,633 bytes) remain only in RAW local**, referenced by SHA256, and were not added to Git. Earlier RAW attempts must never be deleted or overwritten. The checkpoint script itself is in `scripts/audit/checkpoint-05b-progress.mjs`.

## Exact next step after user confirmation

From the audit worktree, first run the pending landscape semantic pass in a fresh context:

```powershell
node scripts/audit/capture-virtual-semantic.mjs --take=05-b-1-1-site-sheet --viewport=landscape
```

Then inspect the twelve screenshots and week-14 terminal state. Correct the portrait terminal capture in a distinct `--run=semantic-correction-1` directory after ensuring the capture reaches exactly week 14. The UI's ▶ BUILD control or a source-grounded final settling/input correction may be needed because the current loop can stop at 13.9995. Preserve the portrait original. Reconcile only after all three semantic passes are valid, then build the manifest/hashes, run 21/21 validator, inventory RAW again, checkpoint and push before 05-c. Do not repeat validated 01-a, 01-b, 01-c, 02, 03-a, 03-c, 04 or 05-a. Do not repeat the three valid 05-b Discovery passes or the valid desktop semantic correction without evidence of a defect. Do not touch master, production, product contract/schema, roadmap, PR #160 or other branches. No bridge implementation is authorized.
