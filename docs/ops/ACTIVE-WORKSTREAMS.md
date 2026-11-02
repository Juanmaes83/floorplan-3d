# Rubik — Active Workstreams

**Actualizado:** 2026-11-02.  
**Propósito:** índice operativo compartido entre cuentas/agentes.  
**Regla:** este archivo indica ownership y checkpoint; no sustituye contratos, QA ni run-state específicos.

## WS-001 — Donor runtime audit 7×14

- **ID:** `donor-runtime-audit-7x14`
- **Objetivo:** auditar 7 grupos / 14 referencias donor mediante recorrido A→B→A, vídeo/telemetry/screenshots, source/Cuts/Rubik reconciliation y manifests; **sin implementación de producto**.
- **Baseline Rubik aprobado:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`.
- **Owner operativo actual:** Codex Terminal, cuenta/sesión que inició la misión el 2026-11-02.
- **Estado:** `PAUSED_EXTERNAL` — pausa por disponibilidad/créditos de la sesión, no por defecto demostrado del repo.
- **Branch local:** verificar desde la Terminal antes de reanudar; la misión recomendó `audit/donor-runtime-7x14-2026-11-02`.
- **Remote checkpoint:** **NO LOCALIZADO en GitHub al 2026-11-02 durante esta revisión**. No existe una rama remota coincidente con `audit/donor-runtime...` visible en ese momento.
- **Riesgo actual:** el trabajo iniciado localmente no es todavía recuperable por otra cuenta/agente desde remoto.
- **Siguiente acción segura:** cuando la sesión pueda continuar, primero inventariar el estado local actual; en el primer punto coherente crear commit + push y registrar aquí branch + SHA remoto + handoff. No reiniciar la auditoría desde cero.
- **Concurrencia:** ninguna otra cuenta/Claude debe escribir sobre el mismo worktree local mientras no exista checkpoint/handoff. Sí puede hacer revisión de sólo lectura de `master` y documentación ya remota.
- **Autoridades de la misión:** Cuts/Atlas/Global Donor Reconciliation + Audit Pack/run-state creado por la misión cuando esté disponible.
- **Merge:** no autorizado por la misión de auditoría.

## WS-002 — Documentation reconciliation + multi-agent operations

- **ID:** `documentation-reconciliation-multi-agent-ops`
- **Objetivo:** documentar protocolo multiagente y reconciliar el estado documental tras FT3D-5/FT3D-6 sin interferir con WS-001.
- **Baseline:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`.
- **Owner:** ChatGPT, sesión de revisión documental del 2026-11-02.
- **Branch:** `docs/multi-agent-ops-status-2026-11-02`.
- **Estado:** `IN_PROGRESS`.
- **Scope de escritura:** documentación exclusivamente.
- **Checkpoint remoto:** esta rama existe en GitHub y recibe commits documentales incrementales.
- **Siguiente acción:** completar `current-status-2026-11-02.md` + informe de reconciliación documental; revisar diff; dejar handoff/resultado.
- **Concurrencia:** no tocar la rama/worktree del donor runtime audit.
- **Merge:** pendiente de revisión; `pushed` no equivale a `approved`.

## Cómo añadir un workstream

Antes de iniciar escritura paralela, crear una entrada con:

`ID → objetivo → baseline → branch → owner → status → checkpoint → next action → concurrency warning`.

Si otra entrada ya posee la misma branch/worktree/autoridad mutable, detenerse y coordinar antes de editar.