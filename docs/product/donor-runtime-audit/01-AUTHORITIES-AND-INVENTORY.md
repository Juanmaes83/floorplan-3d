# Authorities and inventory

## Pinned authorities

| Authority | Revision | Use |
|---|---|---|
| Rubik | `0f9c6ead9732901681498efec326d1ca92e42ffe` | Sole current product baseline, FT3D-6 merged |
| Atlas | `7696fb2c6c30f158001d38ecc53feb2674acaa25` | Historical identities and hypotheses |
| Cut 1 | `6a573f1955fd70dd52bb10450c9b9df9b4833aa0` | D01–D08 |
| Cut 2 | `cc04f67fc0b46c87bc696bf566adb362f43041fd` | D09–D13 only; cumulative D01–D08 not recounted |
| Cuts 3–5 | `docs/product/evidence/donor-cuts-2026-11-01/manifest.md` | Four byte-preserved sources, including Cut 5 completion precedence |
| Global reconciliation | `docs/product/ft3d-donor-global-reconciliation-2026-11-01.md` | Component dispositions and conflicts; historical product base, not this audit base |
| FT3D-5 / FT3D-6 | Contracts, QA, and code at approved Rubik SHA | Current capabilities; distinguish source, configured, connected, exercised and effective |
| flat-to-3d | `d7b9b69753d3af679535ee56695a05c8d955c3c6` | Pinned donor for all 14 runtime references |
| lintel-flat-2d | `c6029d9bb0647483709a502daedc24c1dd7bc029` | Cut 5 context only |
| lintel-live | `791612f6f07fdd79bafeedc74ec6c9eee0f9a86a` | Cut 5 context only |
| REA | `aa48d494e9726d469a1b9ed917f021d8a1a4c7ea` | Auxiliary only for a narrowly stated remaining technical question |

The Global reconciliation used an earlier Rubik baseline. Its donor findings and dispositions are prior research; all current Rubik assertions require checks at the approved SHA. If runtime differs from a Cut, record a conflict instead of silently editing either.

## Canonical references

The sole machine-readable ordered inventory is `docs/product/evidence/donor-runtime-audit-2026-11-02/reference-inventory.json`. Its 14 IDs are fixed by the mission. Selector URLs, standalone URLs, final URLs, source entrypoints, method and evidence must be recorded for each. A source-derived path remains pending until actual URL resolution. A redirect must retain both original and final URL.

Do not infer a new take from an alias, add a take, or remove one. Shared runtime is an observation attached to separate IDs.
