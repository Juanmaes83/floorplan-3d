# Rubik donor runtime audit · 7 groups / 14 references

Date: 2026-11-02. This is evidence gathering, not product implementation or a roadmap.

## Authority and scope

- Rubik commands; the donor informs. Freeze Rubik at `0f9c6ead9732901681498efec326d1ca92e42ffe` even if `origin/master` moves.
- Audit exactly the 14 canonical references in `reference-inventory.json`, in order. Preserve each identity even when runtimes share mechanisms.
- Work only on `audit/donor-runtime-7x14-2026-11-02` in its isolated worktree. Do not modify `master`, merge, push, or change production files.
- Allowed changes: `docs/`, evidence manifests and selected keyframes, `scripts/audit/`, validators, audit tooling. Keep raw video and safety samples outside Git.
- A loaded page, endpoints, or fixed 0/25/50/75/100 samples do not constitute an audit. Observe continuous A→B, B→A or prove no reverse, then make a fresh semantic pass for every viewport.
- Report professional service as well as technical mechanism. Continuity of the same project matters. No transition is evidence unless observed.
- Never infer a Rubik gap from a missing donor-named control. Keep Rubik mobile first. Classify donor mobile limits as `DONOR_LIMITATION`.
- No implementation, product fusion, selection, ordering, or roadmap language. A bridge candidate always has `implementationAuthorized: false`.

## Operational sequence

Preflight → authorities → audit pack → URL discovery → tooling and capture check → preparation validator → one take at a time: capture → manifest → reconciliation → hashes → individual validator → checkpoint. Resume from `audit-run-state.json`.

Only `scripts/audit/validate-donor-runtime-audit.mjs` may emit `AUDIT 14/14 COMPLETE` after all global gates pass.
