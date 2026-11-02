# Run state and checkpoints

`audit-run-state.json` is the operational truth. It fixes the baseline, phase, 14 ordered takes and per-take capture, reconciliation, validation, last successful stage, attempts, blocking/nonblocking unresolved and timestamps. Stage statuses are `NOT_STARTED`, `IN_PROGRESS`, `COMPLETE`, `BLOCKED`, `FAILED`.

Advance only after writing each take's manifest, audit report, reconciliation, SHA256 list and individual validator result. Then checkpoint the state. On interruption read this file first, inspect the last valid checkpoint, and resume there. Do not repeat a validated take absent invalidating evidence. If a take is locally blocked, record it and continue with the next; never conceal the block to force a complete count.

Preparation must verify baseline, clean audit worktree at start, authorities read, pack present, 14 references inventoried, URLs resolved or explicitly blocked, agent-browser investigated, video path tested, RAW storage available, validator bootstrapped and product diff zero. No capture starts until blocking preparation checks pass. The validator preparation mode reports each check without claiming runtime completeness.

Raw assets stay outside Git in `donor-runtime-audit-RAW-2026-11-02/<take>/<viewport>/`. Record absolute paths and hashes. If viable package RAW as ZIP, hash it, and never upload it automatically.
