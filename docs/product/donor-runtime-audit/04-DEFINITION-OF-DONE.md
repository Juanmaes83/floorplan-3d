# Definition of done

Only the validator judges completion. Take status `AUDITED` or `AUDITED_WITH_DONOR_LIMITATION` requires 21/21 hard gates:

| Gate | Required evidence |
|---|---|
| T01 | Canonical ID, group, title and inventory index |
| T02 | Discovered, resolved standalone URL with evidence |
| T03 | Exact donor repository and full pinned commit |
| T04 | Exact Rubik baseline |
| T05 | Toolchain and versions |
| T06 | Complete desktop A→B observation |
| T07 | Desktop B→A observation or demonstrated absence |
| T08 | Portrait audited or substantiated donor limitation |
| T09 | Landscape audited or substantiated donor limitation |
| T10 | START and END documented |
| T11 | Semantic milestones from a second pass |
| T12 | Continuous video available and verified |
| T13 | Semantic screenshots available and verified |
| T14 | Restore/lifecycle verdict |
| T15 | Same-project continuity invariants |
| T16 | Donor source reconciliation |
| T17 | Cuts/Atlas reconciliation |
| T18 | Twelve Rubik crosswalk dimensions |
| T19 | Explicit unknowns and not-observed; no invention |
| T20 | Assets exist and SHA256 verifies |
| T21 | Production diff zero |

Each viewport is independent. `AUDITED_WITH_DONOR_LIMITATION` requires proof of donor limitation and observed remaining behavior; it is not an exemption from evidence. Take statuses: `AUDITED`, `AUDITED_WITH_DONOR_LIMITATION`, `PARTIAL`, `BLOCKED`, `INVALID`. Runtime support: `SUPPORTED`, `DONOR_LIMITATION`, `BROKEN_AT_SOURCE`, `UNRESOLVED`.

Global completion requires A01–A18: exactly 14 canonical IDs; all statuses counted; 294/294 take gates; 14 verified standalone URLs; 14 complete desktop forward and reverse attempted/verdict; 14 portrait and landscape assessments; sufficient temporal video and semantic milestones for 14; source/Cuts reconciliation and 12 Rubik dimensions for 14; every asset/hash intact; RAW manifest and package hash; zero production diff; no inference-only hard gate; zero blocking unknowns; complete global reconciliation without roadmap.

The exact terminal line `AUDIT 14/14 COMPLETE` is emitted solely by the validator when these checks pass. Otherwise report the real count and failures. Nonblocking unknowns may remain only when explicit, attempted and bounded.
