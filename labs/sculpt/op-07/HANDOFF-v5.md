# OP-07 v5 · Corrección dirigida P0 de S7/S8 (20/11/2026)

> **Estado:** candidata correctiva independiente para auditoría de Codex.
> - Sin activación: `OP07_RELEASE='integrated'`.
> - Sin integración productiva.
> - No se ha tocado nada de A0, migraciones, catálogo, interfaces ni otros consumidores.
> - La v4 (`3afb9e18`, árbol `0e816dd5`) se conserva intacta como evidencia histórica (`patches-v4/`).

## Identidad

| Qué | Valor |
|---|---|
| Rama de la serie | `claude/op07-serie-v5`. Commits y árbol: los verificados en remoto al publicar (§4.3) |
| Base | master `8e917e1a70f499a6b8dc68850c8413b7d06c5682` (con Simulator E) |
| Parches | `patches/0001…0014` + `MANIFEST.sha256`. `apply-and-test.cjs` sobre `8e917e1a`: **79/79** |
| Delta respecto a v4 | `0013` = corrección (2 archivos de producto + regresión pura); `0014` = regresión de navegador. Del 0001 al 0012 solo cambia la base |
| Reproducción de Codex | `docs/integration/op07-a0-2026-11-20/cierre-v4-d/` en `codex/continuidad-p0-op02@3eee6937` (#275) |

## Las dos correcciones (causas acotadas por Codex)

1. **`js/persistence-editor.js` · vigencia por documento.**
   - Cada paso de edición queda pendiente **por documento** (`project` y `library`).
   - Al guardar, cada documento se comprueba solo con los pasos que **él** no ha confirmado, y un `commit` consume los pasos de los documentos que escribe.
   - Antes, un paso solo se olvidaba cuando *todos* los documentos existentes lo habían confirmado. Por eso la clave histórica, que existe pero nunca se escribe, mantenía viva una autorización ya consumida por la biblioteca.
   - Los pasos hechos mientras un guardado está en vuelo siguen pendientes.
   - Tope de 512 pasos: si se alcanza, solo puede rechazar, nunca autorizar.
2. **`js/project-core.js` · revocación al reintroducir una forma.**
   - `editIntent` declara, en **todo** paso (también en las ediciones normales), las formas que reintroduce: un muro vuelve a quedar curvo o inclinado, o reaparecen un muro o un hueco.
   - `composeIntent` revoca el permiso anterior de perderlas antes de añadir los del paso, también dentro del mismo lote.

## Regresiones permanentes

| Prueba | Contenido | v4 | v5 |
|---|---|---|---|
| `tests/op07-s8b-revival.test.cjs` (pura, 4) | enderezar → volver a curvar → pérdida genérica; nivelar → volver a inclinar → nivelación genérica; curva reintroducida por edición genérica; muro que reaparece (perdido fuera de los pasos). Con positivos | **0/4** | **4/4** |
| `tests/op07-s8b-intent.browser.test.cjs` (navegador, 4): la sonda de Codex como prueba | 4 escenarios exactos (curva, con/sin clave histórica, confirmaciones separadas y lote de variante); 2 equivalentes de inclinación; confirmación concurrente; positivos y control sin A0. En cada negativo: `guard-refused`, **revisión confirmada intacta** y **documentos persistidos byte a byte iguales** | **1/4** (solo pasan los positivos) | **4/4** |

Se conservan todas las pruebas positivas anteriores: enderezar, nivelar, dividir, deshacer, restaurar y aislamiento entre variantes y plantas (`op07-s7-*`, `op07-s8-*`).

## Resultados (Chromium 1243, Node 22.23, Linux, este contenedor)

- Suite pura completa: **1613 pruebas, 0 fallos** (2 omitidas).
- Navegador: OP-07 ×8 + persistencia + edificios + UX-03 + K4: **46/46**.
- `apply-and-test.cjs` sobre `8e917e1a`: **79/79**.

## Límites

- Solo Chromium en Linux. Faltan Firefox, WebKit y el Windows de Codex.
- A0 sigue representado por el sustituto etiquetado de las pruebas. Codex señala conflictos entre A0 (`112eaf52`) y S8 en el arranque de `persistence-editor.js` y en `regression-partitions.json`. Esa convivencia se resuelve al preparar el candidato conjunto autorizado, no en esta corrección.
- Ningún cambio en la interfaz, así que no hay capturas nuevas. La evidencia son las pruebas y la sonda reproducible.

## Rollback

- Rama de laboratorio: no usarla.
- Si se integrase, revertir `0013`/`0014` deja la v4 sobre `8e917e1a`, que sigue inactiva.

## Siguiente actuación

| Quién | Qué |
|---|---|
| Codex | Auditoría independiente y la sonda original sobre `claude/op07-serie-v5` en Windows, Firefox y WebKit |
| Propietario | Decidir tras la auditoría |
| Claude Code | Detenido en OP-07. OP-05 P3/P4 no empieza hasta cerrar esta P0 |
