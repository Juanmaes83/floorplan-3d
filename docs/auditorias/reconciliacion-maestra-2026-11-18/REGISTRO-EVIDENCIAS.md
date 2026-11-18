# Reconciliación maestra v1.12 — Registro de evidencias

**Fecha:** 18/11/2026 · **Autor:** Claude Code · **Rama:** `docs/reconciliacion-maestra-v1.12`, creada desde `origin/master@7dccf7a` en un worktree propio. Solo documentación.

## 1. SHA de partida

| Referencia | SHA | Fuente |
|---|---|---|
| `master` | `7dccf7a6095e6700b2a6b81161f4172b53c340fb` | `git fetch` + `git rev-parse origin/master` |
| Último merge | #250 `codex/consolidacion-base@8e2f1f7b` | `gh pr list` |
| Alpha `floorplan-3d-alpha.vercel.app` | Sirve `8525025a` | Huella de `js/home-demos.js` servido = blob de `8525025a` (`6bf496bf…`), distinta de `7dccf7a6` (`2562480c…`) |
| Demo `floorplan-3d-demo.vercel.app` | Sirve `7dccf7a6` | `index.html` servido = blob de `7dccf7a6` (`5e576618…`); `js/home-demos.js` = `2562480c…`. Deployment `dpl_64ndSF5qoDKDtey7XXwEYRAzYDTF`, READY y con destino Production, según ChatGPT |
| Despliegue de Production de `7dccf7a6` | Deployment GitHub `7877698056`, 18/11 08:08 UTC | Corresponde al SHA que sirve la Demo. **Corrección:** el primer corte decía «no promovido»; lo exacto es que no está asignado a Alpha |
| Beta 01 | Pendiente de identificación | No consta en el repositorio |
| Sello del registro de capacidades servido | `VERIFIED_AT='40b4ae5…'` | `curl` del archivo público |
| Laboratorio Studio | `lab/studio-presentation-e0e1@2d49a254` | `git fetch` |

## 2. PR abiertas en el corte

| PR | Rama | HEAD | Borrador | Archivos | Checks no verdes en su SHA |
|---|---|---|---|---|---|
| #251 | `feat/e2-comparativas-profesionales` | `a9a92996` | No | 14 | `historical (presentation-d)`: `presentation.browser.test.cjs` agotó el tiempo del archivo (sin líneas de resultado). Pasó después en #259; no se atribuye una regresión actual |
| #252 | `fix/h01-dossier-inventario-economico` | `75c47928` | No | 4 | Ninguno |
| #253 | `fix/h02-cabecera-economica-marca` | `b74dab7f` | No | 4 | Ninguno |
| #254 | `codex/mcp-etapa-2` | `4eb58ae9` | Sí | 19 | Ninguno |
| #255 | `codex/consolidacion-visual` | `15658307` | Sí | 34 | Ninguno |
| #257 | `codex/ux-beta-001-export-json` | `7dd0b454` | Sí | 2 | Ninguno |
| #258 | `codex/beta-ia-operativa` | `56e6777f` | Sí | 11 | Ninguno |
| #259 | `codex/candidata-conjunta` | `62155563` | Sí | 85 | `historical (details)`: en `surfaces.browser.test.cjs` pasan 7 pruebas y falla 1, «Architectural detail uses compatible geometry and returns to the original project», con `page.waitForFunction: Timeout 30000ms exceeded`. Diagnóstico asignado a Codex; causa no determinada |
| #260 | `codex/ci-inteligente-activacion` | `5b003bd6` | Sí | 4 | Ninguno |

`full-regression` aparece como `SKIPPED` en todas: es la omisión prevista del observador en `pull_request`. Los shards históricos no son bloqueantes, pero un fallo nuevo en una prueba que añade #255 no debe integrarse sin diagnóstico.

**Evidencia de CI consultada:** job `134831169667` (run `44309348607`, #259) y job `134819465679` (run `44308426529`, #251). Artefacto `historical-details-62155563…` descargado y leído.

**CI de master `7dccf7a6`:** nueve workflows con conclusión `success` (`gh run list --commit`).

## 3. Pruebas ejecutadas por Claude

Entorno: Windows 11, Node 24.14.1, worktree con `core.autocrlf=true`. Comando por archivo: `node --test --test-reporter=tap <archivo>`, con un límite de 120 s.

| Conjunto | Archivos | Pasan | Fallan |
|---|---|---|---|
| Pruebas puras de `tests/*.test.cjs` sin `browser` | 136 | 131 | 5 |

| Archivo que falla | Causa | Confirmación |
|---|---|---|
| `tests/assistant-ai-v2.test.cjs` | `write-schemas --check` compara bytes y el checkout tiene CRLF | 21/21 sobre `git archive` LF del mismo SHA |
| `tests/r02a-ceiling-session.test.cjs` | Comparación byte a byte con CRLF | 12/12 sobre copia LF |
| `tests/ux07-ent04-budget-coherence.test.cjs` | Comparación byte a byte con CRLF | 12/12 sobre copia LF |
| `tests/catalog-placement-core.test.cjs` | Invoca `python3`, que no existe en este Windows | El resto del archivo pasa: 5/6 |
| `tests/spend-ledger.test.cjs` | Exige `redis-server`, que no está instalado | El propio mensaje del test lo declara obligatorio |

No es evidencia de defecto del producto. La CI de Linux es la fuente de verdad para estos cinco archivos.

**No ejecutadas:** pruebas de navegador, pruebas de MCP (`tools/rubik-mcp/test`) y herramientas del laboratorio Studio.

## 4. Inspecciones de código que cambian la clasificación

| Hallazgo | Ubicación en `7dccf7a6` |
|---|---|
| El render IA no admite calidad y fija el tamaño | `api/render.js:122` |
| Los prompts prohíben añadir personas | `api/render.js:51`, `api/photo-reform.js:112` |
| El 3D tiene modo noche y hora | `index.html:2649` |
| El minimapa dibuja la cámara con su cono | `js/nav3d-ui.js:54` y `:156` |
| Heurística nombre → tipo duplicada | `js/nav3d-core.js:13`, `js/presentation-living-drawing-core.js:28` |
| El plan de obra se exporta en JSON propio | `js/construction-plan-ui.js:119` |
| RUBIK lee DXF pero no lo escribe | `js/plan-intake.js`; sin escritor en `js/` |
| Alineación entre plantas | `js/building-core.js:195` |
| Biblioteca de proyectos en `localStorage` | `js/project-library.js:7` |
| `render-cost-core` no se carga | `index.html` sin `<script>` de `js/render-cost-core.js` |
| Identidad por tester solo en Preview | `api/_beta-controls.js` en `62155563` |
| MCP y Asistente reutilizan los mismos núcleos | `tools/rubik-mcp/src/*.cjs` requieren `js/project-core.js`, `js/tracing-core.js`, `js/layout-review.js` |
| Licencias de materiales | `assets/materials/licenses/` |
| Guía y siguiente acción | `js/guide-core.js`, `js/journey-core.js` |

## 5. Verificaciones de recuento

| Comprobación | Resultado |
|---|---|
| IDs activos en la §3 del catálogo v1.11 | 98, todos distintos |
| Descartes X-01 a X-06 | 6, fuera del recuento |
| Filas de la matriz v1.12 | 98, todos distintos, mismo conjunto que el catálogo |
| Reparto por ola en v1.11 | 10 / 9 / 28 / 22 / 14 / 15 (PER-01 figura como «3 (final)») |

## 6. Cambios posteriores al corte

Segunda consulta a GitHub el 18/11/2026 a las 15:43 UTC, antes del commit:

- `master` sigue en `7dccf7a6095e6700b2a6b81161f4172b53c340fb`.
- Las nueve PR abiertas mantienen el mismo HEAD que en la §2. La última actualización es de las 14:15 UTC, en #259 y #260.
- Los dos checks no verdes siguen en `FAILURE`: `historical (details)` en #259 y `historical (presentation-d)` en #251.

No hay cambios posteriores que reconciliar. Cualquier avance desde esa hora queda fuera del corte auditado.
