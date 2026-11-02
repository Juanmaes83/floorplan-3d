# Rubik — Agent Handoff Template

Usar este formato al transferir un workstream entre cuentas/agentes o antes de una pausa prolongada.

```yaml
workstream_id: <stable-id>
mission: <one-line purpose>

owner:
  account: <ChatGPT A / ChatGPT B / Claude / other>
  tool: <Codex Terminal / Codex Desktop / Claude Code / other>

repository: Juanmaes83/floorplan-3d
baseline_sha: <sha>
branch: <branch>
remote_head_sha: <sha-or-NOT_PUSHED>
worktree: <path-or-NOT_APPLICABLE>

status: <IN_PROGRESS|PAUSED_EXTERNAL|BLOCKED|WIP_PUSHED|READY_FOR_REVIEW|APPROVED>
safe_to_resume: <true|false>

last_checkpoint:
  sha: <sha-or-NOT_PUSHED>
  validation: <what passed / what was not run>
  timestamp: <ISO-8601>

completed:
  - <fact>

verified:
  - <test/evidence and result>

files_or_areas_touched:
  - <path/scope>

external_outputs:
  - <path/link/hash or NONE>

uncommitted_or_unpushed:
  - <describe exactly or NONE>

blockers:
  - <blocker or NONE>

known_unknowns:
  - <explicit unknown or NONE>

do_not_redo:
  - <validated investigation/work that another agent should reuse>

next_exact_action:
  - <single concrete next action>

concurrency_warnings:
  - <process/browser/worktree/branch another agent must not touch>

merge_status:
  ready: <true|false>
  human_gate: <required/passed/not-applicable>
  notes: <...>
```

## Handoff quality gate

A handoff is insufficient if the receiving agent still needs a private chat to know:

- which SHA to start from;
- what is already proven;
- what remains;
- whether local work exists that is not on remote;
- which next action is safe.

The repository must contain enough context to resume without conversational memory.