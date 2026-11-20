# Expediente SCULPT OP-05 / OP-11 — OpenPlan3D → RUBIK SOTA

**Estado:** INVESTIGACIÓN GUARDADA; misión preparada para Codex, **NO EJECUTADA**.  
**Fecha:** 2026-11-20.  
**Rama:** `sculpt/op05-op11-research-handoff-20261120` (solo documentación).  
**Base auditada:** `floorplan-3d/master@8e917e1a70f499a6b8dc68850c8413b7d06c5682`.

## Documentos

1. [01 · Investigación profunda de fuentes, modelos, licencias, dependencias y límites](01-INVESTIGACION-OPENPLAN3D-OP05-OP11-2026-11-20.md)
2. [02 · Matriz operativa de subcortes OP-05 residual y OP-11/C1–C6; gate por fase](02-MATRIZ-CORTES-Y-GATES-2026-11-20.md)
3. [03 · Mandato completo para Codex con controles, entregables y reglas de no integración](03-MANDATO-CODEX-SCULPT-2026-11-20.md)

## Reglas de lectura

- No reemplaza el plan maestro ni los IDs canónicos; SCULPT es método transversal.
- Donante OpenPlan3D fijado a `771c9e1ad30bd1c3cc7584d6eca74deb2e14943d`.
- OP-05 tiene laboratorio previo `a722f9dd` y NO se reabre desde cero.
- OP-11 C1/C2 tiene 64 GLB naturaleza y 4 GLB plantas de interior como **fuente**, no como activos aprobados/integrados.
- Los modelos CC0 requieren verificar procedencia/bytes por recurso antes de entrar en un catálogo.
- Los 12 símbolos 2D de entourage no son modelos 3D; personajes y vehículos 3D siguen HOLD.
- OpenLandscape3D es donante separado; 250 fichas de plantas y 36 materiales no constituyen contenido validado para España.
- Esta rama no cambia código, catálogo, assets, schema, base de datos, Vercel, Production ni ramas de otros agentes.

**Instrucción de inicio:** Codex lee **03** y los enlaces 01/02, verifica primero SOURCE EXACT/OP-05 existente y ejecuta sólo una misión aislada y auditable; se detiene antes de merge y pide decisión humana cuando corresponda.
