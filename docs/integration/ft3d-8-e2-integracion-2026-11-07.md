# FT3D-8 · Integración E2 en rama aislada (07/11/2026)

**Estado: CANDIDATA. Pendiente de la revisión visual del propietario (M2-GATE-09).**
- **No está fusionada en `master`** y no se ha promocionado a Production.

## Identidad

| Concepto | Valor |
|---|---|
| Rama | `integration/ft3d-8-e2-2026-11-07` |
| Base | `master@49fc123a011964651f801f286b1689546abf8927` (con #175 y #176 fusionadas) |
| Fuente | `feat/ft3d-8-m2-s4-correcciones-2026-11-06@fe37c26e95712fa7c244a0b44cedbddf9f58d837`; código probado `1620ba6af25d5ec793759225b183265f47f30d0b` |
| Método | **Importación selectiva por rutas**, sin el historial ni los archivos multimedia de la fuente. Cada archivo importado es idéntico, blob a blob, a la fuente. `index.html` es idéntico a la fusión de 3 vías de master y la fuente. |
| Trazabilidad | `docs/integration/ft3d-8-e2-importacion-manifiesto.json`: por cada archivo, commit y blob de origen, grupo y estado. |
| Preflight | `ft3d-8-preflight-integracion-e2-2026-11-07`: aceptado por el propietario. |

## Qué entra y qué no

| Grupo | Archivos | ¿Se publica en Vercel? |
|---|---|---|
| A · Producto (`js/`, `css/construction.css`, `evolucion/` y 9 `<script>` en `index.html`) | 34 | Sí |
| B · Pruebas y CI (incluidas INT-R1 y `ft3d-8-e2-integration.yml`) | 36 | — |
| C · Laboratorios (`labs/ft3d-8`, `labs/m1-s2-s3`) | 13 | **No**: `.vercelignore`. Siguen en GitHub para las pruebas. |
| E · Documentación de texto | 81 + 2 de integración | Igual que el resto de `docs/` del repositorio |
| **D · Evidencias multimedia y entregas generadas** | **179 (56 MB)** | **No están en la rama** |

**Dónde están las evidencias:** siguen en sus ramas, sin cambios.
- `feat/ft3d-8-m2-s4-correcciones-2026-11-06@fe37c26`, que contiene las de M1, Gate D y M2 y las rondas 1–3 con los vídeos V1–V5.
- `qa/ft3d-8-m2-examen-final-2026-11-06@5e0fc42`, con el examen y los vídeos V1–V4.

Los documentos de texto que enlazan a `evidencias/…` se refieren a esas ramas.

## Garantías conservadas
- **Identidad:** `entry.id` + `{type,id}` + huella.
- **Economía:** presupuesto canónico C1–C4 en `rubik-budget-v1`.
- **Plan de obra:** `rubik-construction-v1`, sin migraciones silenciosas.
- **Biblioteca:** `rubik-sota-project-library-v1`.
- **Integraciones:** Evolución (Gate D), Dibujo vivo (INT-R1), Catastro, marca y Entregar local. La publicación remota sigue bloqueada.

**No se activan:** BCCA gestionada, servicios de pago, cuentas de cliente ni #166.

## Pendientes heredados (no resueltos, no se presentan como tales)

| ID | Estado | Motivo |
|---|---|---|
| EX-05.3 | PARTIAL | El arnés no alcanza con el ratón los muros de carga del ejemplo en las 5 vistas probadas; con el teclado sí. La causa no está demostrada. |
| EX-09.10 | NOT_RUN | PNOA/MDT05 no se cargan en el examen. |
| EX-11-k.6 | PARTIAL | Se detecta el movimiento reducido, pero no se ha medido cuadro a cuadro. |
| EX-13 / QA-22 | PARTIAL | Medido hasta unos 1200 elementos sin GPU. |
| M2-GATE-09 | PENDIENTE | Aprobación visual del propietario. |
| DEC-05 / DEC-06 / DEC-07 | PENDIENTE | Decisiones del propietario. |
| Guía general frente a Recorrido de obra | PENDIENTE | Unificación del recorrido guiado: decisión de producto. |
| Contrato de fidelidad de mallas (Kimi) | PENDIENTE | Fuera del alcance de FT3D-8. |
| #166 Entregar | PENDIENTE | Un conflicto trivial en `index.html` (scripts al final) para quien integre segundo. Su código no se integra aquí. |
| Nota de método | Declarada | El arnés del examen bloquea la CDN de Three.js, así que el 3D principal de RUBIK se valida con INT-R1 y con las suites que usan `THREE_LOCAL_DIR`. |

## Resultados

Se rellenan con la CI real del SHA candidato: ver la sección «Resultados de CI» de la PR.
