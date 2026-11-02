# Estado operativo de producto e integración — 02-11-2026

**Fuente operativa de verdad para trabajo nuevo a partir de esta fecha.**  
**`master` verificado:** `0f9c6ead9732901681498efec326d1ca92e42ffe`.  
**Último cambio integrado:** PR #159 — FT3D-6 Professional Presentation Templates V1.

> Los documentos `current-status-*` anteriores se conservan como snapshots históricos. Cuando discrepen con este documento sobre el estado actual, prevalece este archivo para operaciones posteriores al 02-11-2026.

## 1. Estado real de master

El HEAD verificado `0f9c6ead9732901681498efec326d1ca92e42ffe` es el merge de PR #159 y tiene como padres:

- `e6bc3f3c19d1cd2ebef2dd44de05c007790d678e` — baseline/documentación canónica FT3D-6 previa a implementación;
- `0313ac14b17cedb998981e2c832b8175f9b9c03f` — HEAD exacto de la implementación FT3D-6 revisada.

No usar `e716ba9...` ni `e6bc3f3...` como descripción del estado actual de producto.

## 2. Flat-to-3D / Presentation Story — estado vigente

| Fase | Estado 02-11-2026 | Autoridad / nota |
|---|---|---|
| FT3D-0 | investigación base disponible; cierre formal histórico pendiente | programa Flat-to-3D + Cuts/Atlas/Global |
| FT3D-1 | **INTEGRADO** | plano → 3D → primera estancia |
| FT3D-2 | **INTEGRADO Y VALIDADO** | Story engine reusable; no se requiere 2b sin gap nuevo |
| FT3D-3 | **INTEGRADO Y VALIDADO** | sección dinámica |
| FT3D-4 | **INTEGRADO Y VALIDADO** | alzado/fachada narrativa |
| FT3D-5 | **INTEGRADO** | axonometría / exploded; código probado en `bf3e5ca5c8df1f6bc2bd61925a0a1456b2d1353d`; integración/reconciliación `18848fbf3308ef8c2c8841edf626221f74922d23` |
| FT3D-6 | **INTEGRADO, QA DE IMPLEMENTACIÓN COMPLETADO Y APROBACIÓN VISUAL HUMANA RECIBIDA** | PR #159; HEAD de rama `0313ac14b17cedb998981e2c832b8175f9b9c03f`; merge `0f9c6ead9732901681498efec326d1ca92e42ffe` |
| FT3D-7 | **PENDIENTE COMO FASE** | no iniciar automáticamente hasta cerrar la investigación/reconciliación donor activa y decidir bridges/producto |
| FT3D-8 | **FUTURO / FAMILIA TEMPORAL SEPARADA** | construcción/timeline; no mezclar por defecto con la investigación actual |

### FT3D-5

Autoridades en master:

- `docs/product/ft3d-5-axon-exploded-building-contract-2026-11-01.md`;
- `docs/product/ft3d-5-axon-exploded-building-contract-audit-addendum-2026-11-01.md`.

El run final acreditado para el checkpoint de código `bf3e5ca5c8df1f6bc2bd61925a0a1456b2d1353d` fue **710 PASS / 0 FAIL / 2 SKIP**. No atribuir ese conteo a otro SHA sin un run propio.

### FT3D-6

Contrato canónico:

- `docs/product/ft3d-6-profile-templates-working-contract-2026-11-01.md`.

Ledger de implementación:

- `docs/qa/ft3d-6-implementation-2026-11-01.md`.

Resultado de cierre real posterior al texto histórico inicial del ledger:

- cinco perfiles profesionales integrados;
- `Sin plantilla` preserva selección manual;
- una sola fuente `buildingReading` para compact/exploded;
- no se introdujo renderer/canvas/Story engine/cámara/geometría/persistencia paralela;
- 39 tests puros + 18 browser nuevos = **57/57 nuevos PASS**;
- Python final **56/56 PASS**;
- suite Node final registrada: **1251 PASS / 31 FAIL conocidos y reconciliados / 2 SKIP**;
- workflows del SHA `0313ac14...` terminaron en `success` antes de merge;
- revisión visual humana aprobada por Juanma;
- PR #159 mergeada y `master` verificado en `0f9c6ead...`.

Las frases del ledger que dicen `Implementation is in progress` pertenecen al protocolo pre-freeze y deben leerse como historia del proceso, no como estado vigente.

## 3. Donor / Cuts — fase activa después de FT3D-6

La fase activa no es implementar ciegamente 14 experiencias.

El trabajo actual es una **auditoría runtime de 7 grupos / 14 referencias** para comprender por completo cada evolución:

`START → evolución completa → END → reverse/restore`.

Objetivo:

- observar runtime completo;
- generar vídeo + screenshots semánticos + telemetry;
- reconciliar `OBSERVED_RUNTIME → DONOR_SOURCE → CUT/ATLAS → RUBIK_CURRENT`;
- identificar gaps reales, bridges candidatos y dependencias;
- separar reutilización técnica de servicio profesional;
- decidir después qué producto Rubik merece salir de las referencias.

**14 referencias no implican 14 features.**

Esta auditoría es documental/técnica. No autoriza implementación de producto ni merge.

### Estado operativo de la auditoría

La misión fue iniciada en Codex Terminal el 02-11-2026 sobre baseline aprobado `master@0f9c6ead...` y está temporalmente pausada por disponibilidad externa de la sesión. Durante la revisión documental del mismo día no se localizó todavía una rama remota `audit/donor-runtime...`; por tanto el primer checkpoint coherente debe ser commit + push + registro de SHA antes de transferir la misión a otra cuenta/agente.

Ver `docs/ops/ACTIVE-WORKSTREAMS.md`.

## 4. Orden operativo vigente

El orden anterior `FT3D-5 → reconciliar FT3D-6 → implementar FT3D-6` está superado.

Orden actual:

```text
FT3D-5 integrado
        ↓
FT3D-6 integrado + aprobación visual humana
        ↓
auditoría runtime donor 7×14 + evidencia A→B→A
        ↓
reconciliación global contra Cuts/Atlas/Rubik actual
        ↓
revisión humana de servicios, gaps, bridges y reuse
        ↓
seleccionar qué integrar / adaptar / reimplementar / diferir / rechazar
        ↓
misiones de implementación específicas autorizadas
        ↓
FT3D-7 cuando corresponda según el resultado y el roadmap vigente
        ↓
FT3D-8 permanece separado salvo decisión explícita
```

No saltar desde donor source directamente a implementación.

## 5. Modelo operativo multiagente

Desde 02-11-2026 Rubik adopta coordinación explícita multiagente para poder usar de forma segura:

- dos cuentas ChatGPT/Codex;
- Codex Terminal;
- Codex Desktop;
- Claude Code;
- navegadores/contextos separados cuando sean útiles.

Autoridad:

- repo/remote = memoria compartida;
- cada workstream con branch/worktree propio;
- checkpoints remotos frecuentes;
- handoff escrito antes de transferir ownership;
- no dos agentes escribiendo simultáneamente la misma branch/worktree;
- WIP pusheado no equivale a aprobación.

Contrato:

- `docs/ops/MULTI-AGENT-OPERATING-PROTOCOL.md`
- `docs/ops/ACTIVE-WORKSTREAMS.md`
- `docs/ops/HANDOFF-TEMPLATE.md`

## 6. Fases A / B / C — carry-forward

No se reabre aquí el estado histórico completo de A/B/C. Se conserva la última autoridad previa salvo hechos posteriores demostrados.

Carry-forward relevante:

- Fase C: funcionalmente completa 4/4 según el estado anterior;
- B4: validado real;
- B2/B8: validación externa OpenAI pendiente cuando exista acceso/créditos/configuración requerida; no reimplementar sin defecto demostrado;
- 360: diferido formalmente;
- cierres humanos/documentales históricos de A/B continúan siendo tareas de consolidación donde sigan aplicando.

## 7. Deuda / control

- `master` continúa sin branch protection habilitada en la verificación del 02-11-2026; mantener como deuda de consolidación.
- No confundir fallos históricos reproducidos en baseline con regresiones de FT3D-5/6 sin evidencia nueva.
- Los documentos fechados antiguos no deben borrarse para “hacerlos parecer actuales”; deben mantenerse como snapshots y enlazar a la autoridad nueva.
- El ledger FT3D-6 necesita una nota de cierre post-merge en una reconciliación documental futura o mediante edición segura local; su cuerpo pre-freeze debe preservarse.
- `docs/ROADMAP.md` y `roadmap-completion-matrix-2026-10-30.md` contienen estados fechados que no describen el HEAD actual; consultar este archivo para operaciones nuevas hasta su reconciliación explícita.

## 8. Regla para cualquier agente nuevo

Antes de actuar:

1. verificar `master` real;
2. leer este current status;
3. leer `docs/ops/ACTIVE-WORKSTREAMS.md`;
4. comprobar ownership de branch/worktree;
5. reconciliar trabajo existente antes de crear otro;
6. no depender de memoria de una conversación anterior;
7. al terminar o pausar: commit/push coherente + SHA + handoff + actualización de estado.

**Más contexto, no más falsa certeza.**