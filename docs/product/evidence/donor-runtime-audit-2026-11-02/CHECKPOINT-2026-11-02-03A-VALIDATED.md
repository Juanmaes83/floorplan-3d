# Handoff — 03-a validated

The commit containing this checkpoint is the audit branch checkpoint. Confirm with `git rev-parse HEAD` and `git ls-remote origin refs/heads/audit/donor-runtime-7x14-2026-11-02` before continuing. Previous remote HEAD was `53e3e175ef461f23cc9966d56dd6d719fdb17c96`. Frozen Rubik baseline remains `0f9c6ead9732901681498efec326d1ca92e42ffe`; pinned donor remains `d7b9b69753d3af679535ee56695a05c8d955c3c6`.

## Validated state

`03-a-open-the-lens` passed the individual validator **21/21 gates** as `AUDITED_WITH_DONOR_LIMITATION`; preparation passed **13/13** and production diff is zero. Completed formal scope is now **5/14 takes, 105/294 gates**. `01-a`, `01-b`, `01-c`, `02` and `03-a` require no repeat absent new invalidating evidence. `03-c-down-the-stair` is next and has not been captured.

Final 03-a evidence uses these separate clean-context runs:

| Viewport | Discovery A→B→A | Semantic A→B |
|---|---|---|
| desktop | `discovery-correction-1` | `semantic-correction-2` |
| portrait | `discovery-correction-1` | `semantic-correction-3` |
| landscape | `discovery-correction-2` | `semantic-correction-2` |

The failed landscape `discovery-correction-1` remains in RAW. Portrait `semantic-correction-2` was preserved but its M06 landed after the living-room chapter; Discovery p055/p060/p065 located M06 at 0.60 native progress, and `semantic-correction-3` visibly shows the living room. The corrected landscape A0/A1 are visually equivalent. The donor's 844×390 overlays obscure parts of the cut; this is documented as `DONOR_LIMITATION`. Internal donor resource identity after reverse remains `NOT_OBSERVED`, a bounded non-blocking unknown. No `RESTORED` claim is made.

`takes/03-a-open-the-lens/{audit.md,reconciliation.json,manifest.json,semantic-plan.json}` and `hashes/03-a-open-the-lens.sha256` contain the final record. The manifest hashes 313 selected/raw assets and verifies all final continuous videos by codec, dimensions and decode. Historical Git keyframes were preserved; final selected keyframes include their correction-run prefix. `audit-run-state.json` records capture/reconciliation/validation `COMPLETE`, zero blocking unknowns, and the failed attempt history.

## RAW inventory and provenance

RAW remains at `C:\Users\temp123\donor-runtime-audit-RAW-2026-11-02`. It contains **958 files, 1,442,594,612 bytes**. `raw-inventory.json` includes all attempts and their SHA256 values; its sorted virtual package-content SHA256 is `0e584d78e14279fd3f1a3724b1c67af0fabec43c85d26209861af6575b144470`, and the inventory manifest SHA256 is `aa75d26d08a5b769f5a5c8d77b31d9ebe63db0e1779181afcd334cbed6971637`. This is a directory-content hash, not a ZIP hash. WebM remains outside Git. `node scripts/audit/inventory-raw.mjs --verify` passed.

## Next work

1. Confirm local/remote SHA and a clean audit worktree; read `audit-run-state.json`, the Audit Pack, the pinned `03-c` reference and the existing scripts. Do not touch master, production, PR #160 or validated takes.
2. Continue the canonical order at `03-c-down-the-stair`, using a fresh clean context per viewport. Verify actual runtime and source before choosing semantic targets; `03-a` targets are not transferable.
3. Complete capture, semantic review, donor source, Cuts/Atlas, Rubik baseline crosswalk, reconciliation, hashes, validator and checkpoint for 03-c before proceeding to 04.

The audit is not globally complete. The existing formal scope remains exactly 14 takes. No product implementation is authorized; bridge candidates retain `implementationAuthorized:false`.
