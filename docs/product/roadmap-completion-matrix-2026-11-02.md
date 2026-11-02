# Matriz de cierre del roadmap — 02-11-2026

**Base funcional consolidada:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`.  
**Cambio respecto a la matriz 30-10/01-11:** FT3D-5 y FT3D-6 ya no son pendientes; ambos están integrados, y la investigación donor runtime 7×14 es el workstream activo antes de decidir bridges/implementación posterior.

## Convenciones

- **INTEGRADO:** contenido presente en `master`.
- **VALIDADO:** QA exigido para el alcance acreditado.
- **APROBADO HUMANO:** existe revisión humana requerida para el alcance visual/funcional.
- **PENDIENTE:** fase/capability todavía no implementada.
- **EN INVESTIGACIÓN:** evidencia activa; no implica autorización de implementación.
- **DIFERIDO:** fuera del cierre actual por decisión explícita.

## A / B / C carry-forward

| Bloque | Estado vigente | Pendientes principales |
|---|---|---|
| Fase A | implementación completa según cierre anterior | cierres humanos/documentales históricos donde sigan aplicando |
| Fase B | capacidades principales integradas; B4 validado real | B2/B8 validación externa OpenAI; presentación avanzada se sigue consolidando; cierres humanos/documentales |
| Fase C | **COMPLETA 4/4** | mantener QA/autoridades; no reimplementar |
| 360 | **DIFERIDO** | sólo reabrir con caso de uso independiente |

## Flat-to-3D / Presentation Story

| Fase | Estado 02-11-2026 | Nota |
|---|---|---|
| FT3D-0 | investigación/contratos base disponibles | cierre formal histórico no bloquea la auditoría actual |
| FT3D-1 | **INTEGRADO** | continuidad plano→3D→estancia |
| FT3D-2 | **INTEGRADO Y VALIDADO** | Story engine reusable; no 2b sin gap demostrado |
| FT3D-3 | **INTEGRADO Y VALIDADO** | sección dinámica |
| FT3D-4 | **INTEGRADO Y VALIDADO** | alzado/fachada narrativa |
| FT3D-5 | **INTEGRADO** | tested checkpoint `bf3e5ca...` 710 PASS / 0 FAIL / 2 SKIP; integración `18848fbf...` |
| FT3D-6 | **INTEGRADO + APROBADO HUMANO** | PR #159; implementation head `0313ac14...`; merge/master `0f9c6ead...` |
| Donor 7×14 | **EN INVESTIGACIÓN** | auditoría A→B→A; no es una fase de implementación ni 14 features |
| FT3D-7 | **PENDIENTE** | esperar resultados/revisión de investigación y autorización de siguiente misión |
| FT3D-8 | **FUTURO / SEPARADO** | construcción/timeline; no mezclar automáticamente con donor audit |

## FT3D-5 — cierre operativo

- Contrato: `docs/product/ft3d-5-axon-exploded-building-contract-2026-11-01.md`.
- Addendum: `docs/product/ft3d-5-axon-exploded-building-contract-audit-addendum-2026-11-01.md`.
- Checkpoint de código probado: `bf3e5ca5c8df1f6bc2bd61925a0a1456b2d1353d`.
- QA acreditado en ese checkpoint: **710 PASS / 0 FAIL / 2 SKIP**.
- Integración/reconciliación en master: `18848fbf3308ef8c2c8841edf626221f74922d23`.

## FT3D-6 — cierre operativo

- Contrato canónico: `docs/product/ft3d-6-profile-templates-working-contract-2026-11-01.md`.
- Ledger: `docs/qa/ft3d-6-implementation-2026-11-01.md`.
- Branch de implementación histórica: `feat/ft3d-6-professional-presentation-templates`.
- HEAD exacto revisado: `0313ac14b17cedb998981e2c832b8175f9b9c03f`.
- PR: #159.
- Merge: `0f9c6ead9732901681498efec326d1ca92e42ffe`.
- Nuevos tests: **57/57 PASS** (39 pure + 18 browser).
- Python: **56/56 PASS**.
- Suite Node final registrada: **1251 PASS / 31 fallos conocidos reconciliados / 2 SKIP**.
- Checks remotos del HEAD exacto: success antes de merge.
- Revisión visual humana: aprobada.

**Decisión:** FT3D-6 está integrado. No seguir usando el estado histórico `DRAFT / pendiente de reconciliación tras FT3D-5`.

## Workstream activo — donor runtime audit 7×14

La investigación actual estudia 14 referencias/takes, no 14 features obligatorias.

Protocolo de producto:

```text
14 referencias
→ A→B→A observado
→ runtime/source/Cuts/Rubik reconciliation
→ servicios profesionales
→ mecanismos compartidos
→ gaps reales
→ bridges candidatos
→ revisión humana
→ sólo después decidir implementación
```

Un take no se considera revisado sólo por abrir la página o capturar START/END.

## Orden operativo vigente

```text
master@0f9c6ead (FT3D-6 integrado)
        ↓
donor runtime audit 7×14
        ↓
reconciliación y dependency/reuse map
        ↓
revisión humana de producto
        ↓
autorizar workstreams de bridges/capabilities concretos
        ↓
FT3D-7 cuando el resultado/roadmap lo justifique
        ↓
FT3D-8 separado salvo decisión explícita
```

No existe autorización genérica para implementar todos los mecanismos donor.

## Coordinación multiagente

El trabajo puede repartirse entre cuentas ChatGPT/Codex y Claude Code, pero usando el repo como memoria compartida:

- workstream → branch/worktree propio;
- checkpoints remotos frecuentes;
- handoff con SHA;
- ownership explícito;
- no escritura concurrente sobre la misma branch/worktree;
- revisión paralela de sólo lectura sí permitida.

Ver `docs/ops/MULTI-AGENT-OPERATING-PROTOCOL.md`.

## Deuda que sigue abierta

- B2/B8: validación externa OpenAI cuando se desbloquee la dependencia correspondiente.
- branch protection de `master`: pendiente.
- documentación histórica: varias fuentes fechadas 30-10/01-11 describen FT3D-4/5 como estado vigente; se conservan como historia pero deben enlazar a la autoridad 02-11.
- FT3D-6 ledger: su encabezado pre-freeze aún dice `Implementation is in progress`; necesita nota de cierre segura sin borrar la historia del proceso.
- limpieza administrativa histórica de ramas/PRs donde siga pendiente.

## Criterio de siguiente autorización

No abrir automáticamente FT3D-7 sólo porque FT3D-6 esté integrado. Primero cerrar la auditoría donor y decidir qué bridges/capabilities aportan valor real y cuáles son reutilización, variación, defer o rechazo.