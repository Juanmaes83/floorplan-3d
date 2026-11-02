# Rubik — Active Workstreams

**Actualizado:** 2026-11-02.  
**Propósito:** índice operativo compartido entre cuentas/agentes.  
**Regla:** este archivo indica ownership y checkpoint; no sustituye contratos, QA ni run-state específicos.

## WS-001 — Donor runtime audit 7×14

- **ID:** `donor-runtime-audit-7x14`
- **Objetivo:** auditar 7 grupos / 14 referencias donor mediante recorrido A→B→A, vídeo/telemetry/screenshots, source/Cuts/Rubik reconciliation y manifests; **sin implementación de producto**.
- **Baseline Rubik aprobado:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`.
- **Owner operativo actual:** Codex Terminal, cuenta/sesión que inició la misión el 2026-11-02.
- **Estado:** `RUNNING_RESUMED` — la sesión agotó temporalmente créditos, después recuperó disponibilidad y el usuario confirmó el 2026-11-02 que volvió a ejecutar la misión. No se ha comunicado un defecto bloqueante del repo.
- **Branch local:** verificar desde la Terminal al cerrar el primer checkpoint; la misión recomendó `audit/donor-runtime-7x14-2026-11-02`.
- **Remote checkpoint:** **NO LOCALIZADO en GitHub en la última comprobación documental previa a la reanudación**. No asumir que sigue ausente cuando termine Codex: comprobar remoto/branch/SHA a partir de su informe final.
- **Riesgo actual:** mientras no exista un checkpoint remoto confirmado, el trabajo local no es todavía transferible con autoridad a otra cuenta/agente.
- **Siguiente acción segura:** dejar trabajar la sesión activa. En el primer punto coherente de checkpoint/cierre: inventariar estado local → commit → push → registrar branch + SHA remoto + handoff. No reiniciar la auditoría desde cero y no interrumpir el worktree mientras Codex esté trabajando.
- **Concurrencia:** ninguna otra cuenta/Claude debe escribir sobre el mismo worktree local sin checkpoint/handoff. Sí puede hacer revisión de sólo lectura de `master` y documentación ya remota.
- **Autoridades de la misión:** Cuts/Atlas/Global Donor Reconciliation + Audit Pack/run-state creado por la misión cuando esté disponible.
- **Merge:** no autorizado por la misión de auditoría.

## WS-002 — Documentation reconciliation + multi-agent operations

- **ID:** `documentation-reconciliation-multi-agent-ops`
- **Objetivo:** documentar protocolo multiagente, reconciliar el estado documental tras FT3D-5/FT3D-6 y registrar comprensión/evidencia suplementaria del producto/donor sin interferir con WS-001.
- **Baseline funcional:** `0f9c6ead9732901681498efec326d1ca92e42ffe`.
- **Owner:** ChatGPT, sesión de revisión documental del 2026-11-02.
- **Branch:** `docs/multi-agent-ops-status-2026-11-02`.
- **PR:** #160 Draft.
- **Estado:** `WIP_PUSHED / REVIEWED_WITH_TWO_SAFE_INSERTIONS_PENDING`.
- **Scope de escritura:** documentación exclusivamente.
- **Checkpoint remoto:** rama/PR remotos; HEAD documental tras la última ampliación visual/domain: `fc22224ca62f3486d5cdab63a0af557ea67a8d50` antes de esta actualización operativa; verificar siempre el HEAD vivo de #160 antes de integrar.
- **Revisión sustantiva:** aprobada; corregida la distinción entre `master` vivo y baseline funcional de producto, endurecidas autoridad de workstreams + frescura de run-state, y auditadas las autoridades previas antes de ampliar principios de experiencia/construcción.
- **Documentación de arquitectura/evidencia añadida:** mapa Project→Experience→Delivery, inventario actual de Delivery, política donor→Rubik, principios de Presentation, manifest visual y addendum de dominio construction/programme. El addendum complementa FT3D-8 + D16–D18; no crea una fase/schema nuevo.
- **Correcciones históricas aplicadas:** avisos `SUPERSEDED` en `current-status-2026-10-30.md` y `roadmap-completion-matrix-2026-10-30.md`, conservando su cuerpo histórico.
- **Pendiente seguro:** insertar un puntero en `docs/ROADMAP.md` y una nota post-merge en `docs/qa/ft3d-6-implementation-2026-11-01.md`. El conector disponible sólo reemplaza archivos completos; no reconstruir manualmente esos dos documentos largos para una inserción pequeña. Aplicar con edición local/patch seguro antes de merge.
- **Siguiente acción:** esperar el resultado de WS-001 para reconciliar su evidencia con estas autoridades; en paralelo, cuando sea oportuno, aplicar las dos inserciones históricas seguras y volver a revisar diff/HEAD/checks antes de decidir merge de #160.
- **Concurrencia:** no tocar la rama/worktree del donor runtime audit.
- **Merge:** no autorizado todavía; `pushed`/`reviewed` no equivale a permiso de merge.

## Cómo añadir un workstream

Antes de iniciar escritura paralela, crear una entrada con:

`ID → objetivo → baseline → branch → owner → status → checkpoint → next action → concurrency warning`.

Si otra entrada ya posee la misma branch/worktree/autoridad mutable, detenerse y coordinar antes de editar.
