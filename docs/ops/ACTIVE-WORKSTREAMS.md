# Rubik — Active Workstreams

**Actualizado:** 2026-11-03.  
**Propósito:** índice operativo compartido entre cuentas/agentes.  
**Regla:** este archivo indica ownership y checkpoint; no sustituye contratos, QA ni run-state específicos.

## WS-001 — Donor runtime audit 7×14

- **ID:** `donor-runtime-audit-7x14`
- **Objetivo:** auditar 7 grupos / 14 referencias donor mediante recorrido A→B→A, vídeo/telemetry/screenshots, source/Cuts/Rubik reconciliation y manifests; **sin implementación de producto**.
- **Baseline Rubik aprobado:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`.
- **Owner final:** Codex Terminal.
- **Estado:** `CLOSED`.
- **Branch:** `audit/donor-runtime-7x14-2026-11-02`.
- **Remote checkpoint final:** `5b818cf96d3b16c5a2a4352f3e14d70da4bc2a59`.
- **Cierre:** 14/14 referencias; 294/294 take gates; 18/18 global gates; producción vs baseline funcional sin diff; 0 blockers sin resolver.
- **Siguiente acción segura:** no reiniciar la auditoría salvo evidencia nueva contradictoria. Usar su evidencia y `post-audit-operating-authority-2026-11-02.md` para bridges posteriores.
- **Concurrencia:** cerrado; no reutilizar su branch como workstream de implementación.
- **Merge:** no aplica como feature de producto; branch de evidencia/auditoría.

## WS-002 — Documentation reconciliation + multi-agent operations

- **ID:** `documentation-reconciliation-multi-agent-ops`
- **Objetivo:** mantener documentación operativa/canónica, protocolo multiagente y reconciliar estado después de FT3D-5/6, cierre del audit y nuevos bridges sin interferir con branches de producto.
- **Baseline funcional:** `0f9c6ead9732901681498efec326d1ca92e42ffe`.
- **Owner:** ChatGPT, revisión/supervisión documental.
- **Branch:** `docs/multi-agent-ops-status-2026-11-02`.
- **PR:** #160 Draft.
- **Estado:** `WIP_PUSHED`.
- **Scope de escritura:** documentación exclusivamente.
- **Checkpoint remoto actual al iniciar esta actualización:** `10764965b56a88bb9329bfba0e3aa22601416974`; verificar HEAD vivo antes de integrar.
- **Siguiente acción:** mantener al día ACTIVE-WORKSTREAMS, handoffs y autoridades operativas según checkpoints reales; no mezclar código de producto.
- **Concurrencia:** no escribir en worktrees de Hybrid ni VQ-01.
- **Merge:** no autorizado; `pushed`/`reviewed` no equivale a permiso de merge.

## WS-003 — Hybrid Registered Elevation V1

- **ID:** `hybrid-registered-elevation-v1`.
- **Objetivo:** representación híbrida registrada técnica→material para alzado/fachada usando autoridades Rubik existentes.
- **Baseline:** `0f9c6ead9732901681498efec326d1ca92e42ffe`.
- **Branch:** `feat/hybrid-registered-elevation-v1`.
- **Owner de implementación:** Claude Code durante el workstream; actualmente sin escritura autorizada.
- **Estado:** `READY_FOR_REVIEW_TECHNICALLY / HUMAN_VISUAL_NOT_APPROVED`.
- **Remote checkpoint congelado:** `07ae6f9969cae9df746443e97410e40cee2e932a`.
- **QA técnico reportado:** F11 corregido; suites dirigidas PASS; lifecycle/GPU sin crecimiento observado; Project schema inalterado; Surface/Story authorities preservadas.
- **Gate pendiente:** revisión visual humana posterior sobre una base de materialidad mejorada; no continuar embellecimiento en esta branch ahora.
- **Siguiente acción:** mantener congelado mientras VQ-01 establece la foundation de materialidad; más adelante revisar adaptación/rebase e integración visual.
- **Concurrencia:** VQ-01 puede inspeccionar Hybrid en sólo lectura para collision analysis; no escribir ni cherry-pick/merge desde Hybrid sin autorización.
- **Merge:** NO autorizado.

## WS-004 — VQ-01 Material Fidelity Foundation

- **ID:** `vq-01-material-fidelity-foundation`.
- **Objetivo:** establecer una única foundation Rubik de fidelidad material mediante mecanismos seleccionados de CL-STONE-01, CS-STONE-01 y LT-STONE-01, sin crear sistemas donor paralelos.
- **Baseline funcional:** `0f9c6ead9732901681498efec326d1ca92e42ffe`.
- **Branch:** `feat/vq-01-material-fidelity-foundation`.
- **Worktree local autorizado:** `C:\Users\temp123\floorplan-3d-vq-01`.
- **Owner operativo:** Codex como writer técnico del workstream; ChatGPT como supervisor/arquitectura; Juanma como gate visual/producto.
- **Remote checkpoint actual:** `0f9c6ead9732901681498efec326d1ca92e42ffe`.
- **Estado:** `BLOCKED_AFTER_CP0`.
- **CP0:** read-only architecture/collision/transplant preflight completado; no cambios de producto, commits ni merges. Informe final: `BLOCKED`.
- **Hallazgos principales:** Rubik conserva autoridad de surface identity/binding; SurfaceRenderer + caches legacy requieren consolidación cuidadosa; policy histórica PBR 512px/2-candidates/Casa-Serra-only necesita decisión; CS asset provenance y normal convention no están cerrados; LT procedural timber/plaster sigue acoplado a shader/room/geometry; Hybrid presenta colisión alta con futuros `onBeforeCompile`; browser baseline no ejecutó por dependencia Playwright ausente en ese checkout.
- **Decisiones supervisoras tras CP0:** first slice sin registered reveal ni shader procedural Lintel; mantener luz/environment/post/cámara/geometría congelados; no usar ARM.B; AO permanece sin binding; VQ entra por autoridad Rubik existente; no convertir CP1 en refactor total de todos los caches legacy; Playwright se tratará como tooling restaurable, no defecto de producto.
- **Siguiente acción exacta:** `CP0.1 blocker closure` antes de CP1: reconciliar proof records; demostrar provenance de assets exactos propuestos; resolver normal convention/flip behavior; restaurar browser QA environment; formalizar nueva policy PBR; aislar/deferir mecanismos LT procedurales; redactar contrato durable VQ-01 y revisar gate.
- **Concurrencia:** ningún otro agente debe escribir en esta branch/worktree mientras Codex sea owner. Hybrid y quarry stones sólo lectura salvo misión separada explícita.
- **Merge:** NO autorizado; `remote checkpoint != approved`.

## Cómo añadir un workstream

Antes de iniciar escritura paralela, crear una entrada con:

`ID → objetivo → baseline → branch → owner → status → checkpoint → next action → concurrency warning`.

Si otra entrada ya posee la misma branch/worktree/autoridad mutable, detenerse y coordinar antes de editar.
