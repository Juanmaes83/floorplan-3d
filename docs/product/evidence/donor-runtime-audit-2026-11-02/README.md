# Donor runtime audit evidence

Audit branch: `audit/donor-runtime-7x14-2026-11-02`. Rubik baseline: `0f9c6ead9732901681498efec326d1ca92e42ffe`.

`preparation.json` records preflight and tooling; `reference-inventory.json` holds the exact 14 selector-derived URLs; `audit-run-state.json` is the persistent operational checkpoint. Per-take evidence belongs in `takes/<id>/`. Raw video, telemetry and discovery samples reside in sibling `C:/Users/temp123/donor-runtime-audit-RAW-2026-11-02/` and are not in Git.

The local method is in `docs/product/donor-runtime-audit/`. Run `node scripts/audit/validate-donor-runtime-audit.mjs --prepare` before the first capture; `--take=<id>` after each take; global validation only after all 14.

HTTP HEAD verification in the inventory confirms published URL existence and final URL, not that a runtime experience has been audited. Completion remains under validator control.
