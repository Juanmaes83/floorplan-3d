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
- **Remote checkpoint final histórico registrado aquí:** `5b818cf96d3b16c5a2a4352f3e14d70da4bc2a59`; existe evidencia/remoto posterior de validación global y debe prevalecer si se reconcilia este workstream de nuevo.
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
- **Checkpoint remoto:** verificar HEAD vivo antes de integrar; esta branch contiene ya el contrato VQ-01 canónico y su reconciliación CP0.1.
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
- **Owner operativo:** Codex como único writer técnico del workstream; ChatGPT como supervisor/arquitectura; Juanma como gate visual/producto.
- **Remote product checkpoint actual:** `0f9c6ead9732901681498efec326d1ca92e42ffe`; todavía no contiene cambios VQ.
- **Estado:** `READY_FOR_CP1`.
- **CP0:** preflight read-only completado; su handoff histórico permanece en `docs/ops/handoffs/vq-01-material-fidelity-foundation-cp0-2026-11-03.md`.
- **CP0.1:** blocker-closure completado. Proof records reconciliados; nuevos bytes Casa Serra deferred por provenance; normal convention tratada asset-specific; browser baseline restaurado/establecido; ownership `SAFE_BOUNDED`; Lintel procedural y reveal deferred; producto/worktree quedó limpio y sin commit.
- **Contrato exacto autorizado:** `docs/product/vq-01-material-fidelity-foundation-contract-2026-11-03.md` — **CANONICAL IMPLEMENTATION CONTRACT V1 — READY_FOR_CP1 — MERGE NOT AUTHORIZED**.
- **Handoff actual:** `docs/ops/handoffs/vq-01-material-fidelity-foundation-cp0-1-2026-11-03.md`.
- **Primer slice:** `STONE/MARBLE`, `TIMBER/WOOD`, `PLASTER/CONCRETE`, `GLASS/METAL`; Rubik mantiene Project/Surface/Render authorities.
- **Aceptado para CP1:** no new CS asset copy; normals asset-specific; AO unbound; `ARM.B=UNKNOWN` y nunca metalness; SurfaceRenderer owner de nuevos recursos VQ de superficies; no refactor global de caches; no Three upgrade; Hybrid read-only; no `onBeforeCompile`.
- **No canonizado aún:** tiers globales `BASE/PBR1K/HIGH/DELIVERY`, relajación general 512px/512KiB, blanket 1K/2K, KTX2, framework general de canales opcionales, AO binding, full cache refactor, nuevos assets CS por inferencia.
- **Siguiente acción exacta:** `CP1-A`: durabilizar en la branch VQ el fixture A/B ya demostrado por CP0.1 y reproducir A exacto antes de cualquier mutación visual. Sólo si no hay drift, continuar a CP1-B/CP1-C dentro del contrato.
- **Gate siguiente:** `READY_FOR_HUMAN_AB`; Juanma emite `PASS / FAIL / INCONCLUSIVE` sobre A=`master@0f9c6ead...` vs B=misma vivienda/geometry/camera/light/environment/viewport + cambios materiales CP1.
- **Concurrencia:** ningún otro agente escribe en esta branch/worktree mientras Codex sea writer. Hybrid y stones son sólo lectura salvo misión separada explícita.
- **Merge:** NO autorizado. `READY_FOR_CP1` autoriza implementación acotada, no merge ni CP2.

## Cómo añadir un workstream

Antes de iniciar escritura paralela, crear una entrada con:

`ID → objetivo → baseline → branch → owner → status → checkpoint → next action → concurrency warning`.

Si otra entrada ya posee la misma branch/worktree/autoridad mutable, detenerse y coordinar antes de editar.
