# BCCA_ES — Adenda M1 al registro del gate de reutilización (05/11/2026)

**Registro original (no modificado):** `docs/legal/bcca-es-reuse-gate-2026-10-27.md`, con conclusión `UNKNOWN` y
catálogo gestionado `DISABLED`.
**Autor:** Claude Code 2 (misión M1, FT3D-8 S2). **No constituye asesoramiento jurídico.**

## 1. Hecho nuevo
El propietario ha comunicado (decisión DEC-04 del Documento Maestro E2 v1.1) que confirmó permisos comerciales
mediante consulta y otras fuentes.

## 2. Evidencia documental disponible en el repositorio a esta fecha
No se ha incorporado ningún documento primario o escrito que delimite, para la BCCA, todos estos puntos:
- titularidad y contacto;
- edición;
- consulta;
- adaptación;
- caché;
- alojamiento;
- redistribución;
- *embedding*;
- actualización;
- ámbito territorial;
- atribución.

## 3. Conclusión de máquina (sin cambios)
| Modo | Estado | Motivo |
|---|---|---|
| `user-supplied` (el profesional aporta el BC3) | Operativo con licencia `unknown` | RUBIK lo lee localmente; no lo descarga, aloja ni redistribuye. |
| `rubik-managed` (RUBIK obtiene, aloja, actualiza o redistribuye) | **`UNKNOWN` → desactivado** | La comunicación declarada no equivale a derechos de redistribución verificados. |
| `synthetic` | Solo pruebas | Datos inventados; no son evidencia legal. |

## 4. Implementación M1 (fail-closed)
- `FloorPlanCostCatalog.managedStatus()` devuelve siempre `enabled:false`.
  - Con `UNKNOWN` o `RESTRICTED`, el motivo es `legal-gate-not-verified` o `legal-gate-restricted`.
  - Incluso con un registro `VERIFIED` que tenga toda la evidencia, el motivo es `managed-distribution-not-implemented`:
    M1 no incluye ninguna operación de descarga, alojamiento ni actualización.
- El adaptador existente `FloorPlanBccaEsCostProvider` mantiene su propio bloqueo: `rubik-managed` exige `VERIFIED`
  con evidencia y, sin ella, devuelve `legal-gate-not-verified`.
- Pruebas que lo verifican: `tests/cost-catalog-core.test.cjs` (FT8-S2-07 / QA-07) y
  `tests/cost-provider-bcca-es*.test.cjs` (existentes).

## 5. Qué haría falta para activar el modo gestionado
1. Un documento escrito de la Consejería titular, o una licencia publicada aplicable a la edición concreta, que cubra
   cada uso del §2.
2. Revisión legal responsable y su registro en una nueva adenda: fecha, autor, enlaces y alcance.
3. Un cambio de código separado y autorizado que implemente la obtención y la caché con las condiciones
   documentadas. Solo entonces el estado podría pasar a `AUTORIZADO_COMERCIAL`.
