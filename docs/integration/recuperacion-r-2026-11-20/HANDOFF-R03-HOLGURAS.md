# R03 · Recuperación del análisis de holguras (20/11/2026)

> **Estado:** candidata recuperada, pura y de solo lectura, para auditoría e integración por Codex.
> - **No está conectada** a ninguna interfaz: ningún archivo de producto la carga.
> - No escribe el proyecto ni aplica propuestas.

## Identidad

| Qué | Valor |
|---|---|
| Rama | `claude/r03-holguras`. HEAD y árbol: los verificados en remoto al publicar (§4.3) |
| Base | master `4ea7cb3bb72e6c3bdd9a176cb08bd9e41b8866f2` |
| Origen | Laboratorio `lab/sculpt-r03-cabinets@fc5a4224`, `labs/sculpt/r03-cabinets/cabinet-evidence-core.js`. Las funciones `clearanceGeometry`, `pseudo`, `clearanceBlock` e `independentIssues` se copian **sin cambios de lógica**. Escenas sintéticas: copia exacta en `tests/fixtures/r03-cabinet-scenarios.js` |

## Por qué es valor no integrado

**Lo que master ya tiene** (R03 integrado: `js/r03-cabinet-*`):
- armario paramétrico, editor y 3D;
- en el núcleo, `swing`, `drawerReach` y `verticalCheck`.

**Lo que no tiene:** la **comprobación de holguras** del laboratorio:
- si el barrido de cada puerta y el alcance de cada cajón chocan con muros, puertas de estancia o muebles;
- los conflictos bisagra/cajón como incidencias, cada una **con su autoridad**.

## Reutilización (sin motores nuevos)

| Pieza | Autoridad que se reutiliza |
|---|---|
| Barrido, alcance, giro a planta y conflictos bisagra/cajón | `RubikCabinetCore` (`js/r03-cabinet-core.js`). `swing`, `drawerReach`, `toPlan` y `drawerDoorConflicts` son **idénticas byte a byte** a las del laboratorio |
| Colocación | `FloorPlanPlacement.problems`, aplicado al **cuadrado** que barre cada hoja (la convención de RUBIK para las puertas de estancia) y al cuerpo extendido del cajón |
| Sector exacto de 90° | `FloorPlanLayoutReview.penetration`: evidencia **experimental** que nunca bloquea nada |
| Armario de cada objeto | Contrato R03 (`RubikCabinetContract.read`): el guardado o el de su tipo por defecto |

**API:** `RubikCabinetClearance.analyze(project, objectId)` devuelve:
- `status`: `evaluated`, o el estado del contrato;
- `clearance`: hallazgos separados en `doorSquare`, `doorSector` y `drawers`;
- `issues`: cada incidencia con su autoridad;
- `summary`: `clear`, `experimental-only` o `issues`;
- `applied: false`.

## Pruebas (Node 22.23, Linux)

| Prueba | Resultado |
|---|---|
| `tests/r03-cabinet-clearance.test.cjs` (nueva) | **7/7**, con los mismos escenarios y valores esperados que el laboratorio |
| Suite pura completa | 1518/1520, 0 fallos, 2 omitidas (master + 7) |

Lo que cubren:
- **mesilla en el barrido:** `furniture:obj_nightstand` en el cuadrado y en el sector;
- **zapatero en un pasillo de 800 mm:** la salida de la estancia solo en el cuadrado; el muro en los dos;
- **armario bien colocado:** sin hallazgos;
- **cajones atravesados por una bisagra:** incidencia con la regla del donante como autoridad;
- **hallazgo solo del sector:** `experimental R03`;
- **todas las escenas:** el proyecto queda intacto; un objeto que no es armario sale `not-cabinet` y un id inexistente `unknown-object`;
- **guardas:** usa los motores de producto, no define `swing`, `penetration` ni `problems` propios, no escribe y no lo carga `index.html`.

## Límites

- Apertura supuesta de 90° (`K.ASSUMED`). No evalúa herrajes reales, recorrido de personas ni normativa.
- El cuadrado es conservador: un hallazgo solo en el cuadrado no es una colisión del sector.

## Plan de conexión (no ejecutado, requiere autorización)

1. Mostrar `analyze()` en solo lectura en el editor R03 (`r03-cabinet-editor-ui.js`), junto a la validación existente, sin bloquear el guardado.
2. Prueba de navegador del editor con la escena de la mesilla.
3. Firefox y WebKit por Codex.

## Lo que no se recupera, y por qué

| Pieza del laboratorio | Motivo |
|---|---|
| `propose`/`previewDiff`/candidatura de `size.heightMm` | Exige el contrato de propuesta revisable, no autorizado; no se aplican propuestas automáticamente |
| `verticalCheck` de altura libre | Ya está en `js/r03-cabinet-geometry.js` |
| `donor*`, comparador y taller | Herramientas de paridad con el donante, solo de laboratorio |
