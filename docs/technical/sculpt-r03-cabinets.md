# SCULPT-R03 · Armarios paramétricos (laboratorio)

> **Laboratorio aislado. No integrado en RUBIK. No validado para fabricación ni pedido.**
> Rama `lab/sculpt-r03-cabinets` creada desde `master` `75615fd`. No toca ningún archivo del producto: todo vive en
> `labs/sculpt/r03-cabinets/` (excluido de Vercel por `.vercelignore`), `tests/`, `docs/` y un workflow propio.
> R03 no equivale a CAT-03. Tampoco modifica el catálogo maestro, las olas ni las decisiones del propietario.

## 1. Donante y derechos

`caikaidev/floorplan-3d` @ `2495d8e` (kai cai), presentado como wy51ai/floorplan-3d#11. Los derechos se analizan en
[`labs/sculpt/r03-cabinets/PROVENANCE.md`](../../labs/sculpt/r03-cabinets/PROVENANCE.md):

- el código original de wuyi está bajo **MIT acreditada**;
- la contribución de la PR #11 queda bajo **MIT por la cláusula D.6** de los Términos de GitHub, con el razonamiento documentado y el riesgo residual identificado;
- `vendor/three` no se duplica.

GOV-05 queda resuelto **solo para R03**.

## 2. Cortes ejecutados

| Corte | Estado | Evidencia |
|---|---|---|
| 0 · Diagnóstico | hecho (11/11) | informe en conversación |
| 1 · SOURCE / ISOLATE | **hecho** | `fetch-source-exact.sh`: 18 ficheros con sha256; respaldo por `refs/pull/11/head` probado; rechaza sobrescribir un destino (salida 3) y escribir en el repositorio (salida 2) |
| Baseline del donante | **hecho** | `tests/design.test.cjs` sin cambios: **13/13**. `tests/browser-smoke.cjs` sin cambios: **3/3 bloques PASS** y **0** peticiones externas |
| 2 · CLASSIFY | **hecho** | §3 |
| 3 · SCULPT | **hecho** | `cabinet-core.js`, con paridad exacta frente al donante literal (§5) |
| 4 · NORMALIZE | **hecho** (contrato de laboratorio) | `CabinetEvidenceV1` (§4) |
| 5 · TEST | **hecho** | `tests/sculpt-r03-cabinets.test.cjs`: **98/98** tras el corte de cierre (24 en `964072d`); H1–H4 en §6; defectos A–C en §11 |
| 6 · PREVIEW y pulido | **hecho** | `index.html` + `qa/lab-browser-qa.cjs` en 4 viewports y 17 escenarios; capturas en `docs/qa/artifacts/sculpt-r03/` |
| Cierre técnico | **hecho** | acta en §11 |
| Cirugía / integración | **no iniciada** | requiere decisión expresa del propietario |

## 3. Clasificación

| Pieza | Decisión | Motivo |
|---|---|---|
| `cavity`, `bays`, `openings`, `drawerSize`, `fronts`, `drawerDoorConflicts`, `presetColumn`, `defaultCabinet`, límites de `validateCabinet` | **KEEP** | aritmética correcta y probada; se reproduce exacta |
| `validateCabinet` | **GENERALISE** | recoge todos los problemas con un código estable; `issues[0]` conserva el mensaje del donante |
| `resizeCabinet`, `bayWidths`, división y unión de particiones del editor | **GENERALISE** (puras) | H1: el donante modifica el armario antes de validar |
| Obstáculos de puerta y cajón (`furnitureObstacles`) | **REPLACE** como evidencia | H2: la tabla de 18 mm no cubre el barrido. Ahora se calcula el sector de 90° y el cuadrado con la convención de RUBIK, sin crear una nueva autoridad de colisiones |
| `cabinetElevation` (cabinet-editor.js) | **GENERALISE** | primitivas sin DOM (`elevation`); los solapes se emiten como `overlap` |
| `cabinet-model.js` | **KEEP** (laboratorio) / OPTIONALISE (cirugía) | geometría 3D fiel; en el laboratorio se usa literal, con three.js r160 de RUBIK |
| Diálogo del editor, `view-settings.js`, paseo y colisiones de `index.html`, `circleRect` y `rayRect` | **REMOVE** en R03 | runtime y calibración ajenos a RUBIK; la calibración de cámara no es una misión de R03 |
| `ceilingHeight` de la vista | **REPLACE** | H4: solo se acepta una referencia vertical dada (la misma forma que en R02-A) o queda `unknown` |
| Valores por defecto (18/9/20/80, herrajes, recorrido, 90°) | **KEEP como supuestos** | H3: cada uno lleva su procedencia en `ASSUMED`; ninguno está medido |
| `vendor/three`, `wrangler.jsonc`, README | **REMOVE** | duplicado o despliegue ajeno |

## 4. Contrato `CabinetEvidenceV1` (`rubik-sota.cabinet-evidence` 0.2.0-lab, corte de cierre)

`propose({project, objectId, cabinet?, vertical?, useDefaults=true})` es una función pura: no escribe en el proyecto.
`propose()` y `validate()` usan **las mismas funciones puras**: `verticalCheck`, `interior`, `clearanceGeometry`, `candidates` y `summary`. Por eso una evidencia se re-deriva desde sus propios datos de origen.

**Estado del armario** (`cabinet.status`):
- `declared`: distribución recibida;
- `proposed-default`: los valores por defecto del donante, con la lista de supuestos;
- `invalid`: lleva la lista de problemas;
- `unknown`: no hay datos.

**Geometría calculada.** Hueco útil, módulos con aberturas y cajones, frentes y conflictos entre bisagra y cajón.

**Altura.** Una sola regla:
- La cota superior es `elevationMm + altura del armario`. La elevación es un entero de 0 a 10000; si falta se toma 0 (por defecto del esquema), y si no es válida queda `invalid`.
- Consistencia con `size.heightMm`: `match`, `differs`, `object-height-missing` u `object-height-invalid`, este último cuando el valor no cumple el contrato canónico.

Estados de la referencia vertical:
- `unknown`: no hay referencia;
- `invalid`: datos no válidos, con un código de problema estable;
- `unsourced`: hay números pero no procedencia;
- `declared` o `derived`: con procedencia indicada.

`check.status` puede ser `evaluated` (cabe o no cabe), `pending`, `invalid` o `not-applicable`. Queda `pending` cuando la referencia es `unknown` o `unsourced`, o cuando es `level-floor`: el objeto se apoya en el suelo terminado y no se conoce el acabado, así que no se inventa la cabida. `fits` y `marginMm` solo existen si el estado es `evaluated`. Se registra también lo que usaría el donante (2400, valor de calibración).

**Barridos.** Para cada puerta, en planta: el sector, el cuadrado y la tabla del donante.
- `rubikSquareProblems` son los problemas del cuadrado, calculados con `FloorPlanPlacement.problems`, la autoridad de RUBIK, sin modificar. Es conservador.
- `sectorHits` son los choques del sector de 90°, calculados con `LayoutReview.penetration`. Es **experimental**.
- `findings.doorSquare`, `findings.doorSector` y `findings.drawers` se presentan **por separado**: un hallazgo solo en el cuadrado no es una colisión del sector.

**`notEvaluated`.** Lista lo que no se comprueba: aperturas de más de 90°, herrajes reales, tolerancias, carga, paso, normativa y otras plantas. Incluye la altura libre siempre que la cabida no se haya evaluado.

**`previewDiff`.** Nunca se aplica (`applied:false`). Usa los estados de R02-A:
- `candidate-reviewable` con `op:'would-set'`;
- `pending` y `blocked`, ambos con `op:'none'`.

Cada candidatura lleva `blockers` (impiden la operación), `pendingOn` (falta información) e `independentIssues`. Estas últimas son la caja, el cuadrado de barrido, el sector experimental, los cajones y la bisagra; se listan con su autoridad y **no deciden la operación de altura**, porque la huella en planta no cambia.
- `size.heightMm`: `blocked` si el interior no es válido, el objetivo no es válido, no cabe o la referencia no es válida; `pending` si la cabida no se ha evaluado; revisable en otro caso.
- Interior: siempre `blocked` / `none`, porque `objects` es `additionalProperties:false`.

**`summary`.** Su `state` puede ser `clear`, `clear-with-pending`, `issues`, `invalid` o `incomplete`, y separa `blocking`, `notEvaluated` y `experimental`. Nunca muestra «sin problemas» si hay bloqueos.

**`rubikToday`.** Recoge:
- los problemas de colocación de la caja;
- la altura 3D fija de `index.html`: armario 2200, zapatero 1000, aparador 850. Ignora `size.heightMm`; el catálogo dice 1200 para el aparador y el 3D dibuja 850;
- que RUBIK no tiene interior ni barrido de puertas.

**`validate(evidence, context?)`** no lanza ante datos mal formados: protege cada acceso y devuelve códigos estables sin modificar la entrada.
- Re-deriva el estado y los problemas del armario, el interior, la geometría de los barridos, los hallazgos, la regla vertical, las candidaturas y el resumen.
- Con `context` (los argumentos de `propose`, proyecto incluido) recalcula la evidencia completa (`recomputed-mismatch`), incluidas la colocación y los choques, que necesitan el proyecto.

## 5. Paridad con el donante literal

Comparación del motor esculpido con `workshop/design.js`:

| Prueba | Resultado |
|---|---|
| `defaultCabinet` en una rejilla de 928 tamaños y 4 tipos | idéntico |
| `validateCabinet` en 3000 mutaciones con semilla | mismo resultado en todas; mismo primer mensaje |
| `resize` y `bayWidths` en 300 casos | idénticos cuando el donante acepta |
| `cavity`, `bays`, `openings`, `drawerSize`, `fronts`, conflictos en los 12 escenarios | todos `true` |

En el navegador, la evidencia es igual byte a byte a la calculada en Node en los 4 viewports y en los 17 escenarios.

## 6. Hipótesis del Corte 0 (reproducidas experimentalmente)

| Hipótesis | Resultado | Prueba |
|---|---|---|
| H1 · mutación antes de validar | **Reproducida en la API del donante.** `bayWidths(…,0,1800)` lanza el error pero deja `[1800, 64, 64]`; un `resizeCabinet` rechazado deja las baldas a 410. En la aplicación del donante, `editCabinet` clona antes de aplicar, así que sus datos están protegidos. El defecto está en el motor. **Corregido en el taller:** ninguna operación modifica su entrada | `H1 reproduced…`, `NaN never becomes…` |
| H2 · la puerta abierta no es un barrido | **Reproducida.** El obstáculo es una tabla de 18 mm (8 748 mm²) frente a un sector de 185 630 mm² (puerta de 491 mm, radio 486,3), y solo existe con la vista «abiertas». En la escena `nightstand-in-swing`, la mesilla queda dentro del barrido: el donante no la ve (cerradas ni abiertas), RUBIK tampoco y la evidencia sí | `H2 reproduced…`, `H2 at scene level…` |
| H3 · espesores y holguras sin medir | **Confirmada como supuesto, no como defecto.** Son constantes del donante, independientes de cualquier dato; la propia interfaz del donante dice que hay que confirmar los herrajes | `H3 confirmed…` |
| H4 · altura de cámara usada como altura arquitectónica | **Reproducida.** El donante usa 2400 por defecto y un mínimo de 2100: un techo real de 2050 no se puede representar. Con un techo de 2150, un armario de 2200 no genera aviso en el donante; la evidencia da `fits:false` y −50 mm | `H4 reproduced…` |

Se halló además un defecto propio durante las pruebas, ya corregido: un clon por JSON convertía `NaN` en `null` y una edición inválida podía validar.

## 7. Laboratorio visual (OBSERVE → CRITIQUE → CORRECT)

`labs/sculpt/r03-cabinets/index.html` contiene:
- el alzado (taller), con módulos M1…Mn y cotas legibles;
- el 3D con `cabinet-model.js` literal, con los sectores de barrido en el suelo y un aviso de estado;
- la planta con sector, cuadrado RUBIK, obstáculo del donante y conflictos;
- la evidencia: estado global, altura, módulos, divisores y puertas, barridos separados, previewDiff con bloqueos y pendientes, y supuestos;
- el comparador de 4 columnas y el JSON.

Las ediciones viven solo en memoria y pasan por el motor puro. Las rechazadas no cambian nada y explican el motivo en español.

**Ronda inicial (`964072d`):**
- ADJUST: cotas del SVG ilegibles, altura de la planta, muros y estancia en el comparador.
- KEEP: la vista móvil apilada.

**Corte de cierre:** detalle en §11.D.

`qa/lab-browser-qa.cjs` cubre 1440×900, 1280×800, 390×844 y 844×390, con 17 escenarios por viewport. Comprueba:
- 0 errores de consola o página, 0 peticiones externas y sin scroll horizontal;
- evidencia igual a la de Node, paridad e invariantes;
- que los estados de puerta cambian los píxeles del 3D y no el proyecto;
- interacciones, ediciones rechazadas sin efectos, restablecer, foco visible y comparador accesible.

## 8. Cómo reproducir

```bash
cd labs/sculpt/r03-cabinets/workshop && node --test tests/design.test.cjs
```

```bash
node --test tests/sculpt-r03-cabinets.test.cjs
```

```bash
bash labs/sculpt/r03-cabinets/fetch-source-exact.sh /tmp/r03-exact
```

```bash
node labs/sculpt/r03-cabinets/verify-workshop.cjs /tmp/r03-exact
```

```bash
node labs/sculpt/r03-cabinets/qa/lab-browser-qa.cjs
```

## 9. Límites y lo que no se hace

- No hay integración, merge ni Promote.
- No cambia `FloorPlanProjectV1` ni el catálogo F3, ni se añade persistencia o editor al producto.
- No hay segunda autoridad de colisiones: los barridos se miden con `FloorPlanPlacement`.
- No hay altura derivada propia: R03 consume la referencia vertical con la forma de R02-A, sin recalcularla.
- Los barridos son de 90°; la bisagra real se desconoce.
- No es un dictamen jurídico profesional.

## 10. Siguiente decisión humana

1. Revisión humana del laboratorio (PR draft).
2. Decidir el modelo canónico del interior. Hoy está bloqueado por `additionalProperties:false`. Opciones:
   - una extensión versionada del esquema;
   - un documento lateral vinculado al objeto;
   - no persistir.
3. Decidir si la cirugía usará `cabinet-model.js` o el 3D actual de RUBIK, y si la altura fija de 2200/1000/850 debe respetar `size.heightMm`, que es un hallazgo independiente de R03.

## 11. Acta de cierre técnico (11/11/2026)

### A. Estado y SHA

| Dato | Valor |
|---|---|
| PR | [#194](https://github.com/Juanmaes83/floorplan-3d/pull/194), **Draft**, rama `lab/sculpt-r03-cabinets` |
| SHA inicial del corte | `964072dbe3db1b455a8bf2cdc2f543fda97ddcd3` (CI 14/14) |
| Commits del corte | `1988751` (contrato A–C y pruebas) · `417f389` (auditoría visual, QA y capturas) · el commit de esta acta |
| SHA de código verificado | `417f389877b0b4de066bf8e5047bcfa9626e8dab`: CI **14/14** en verde, incluidos `real-3d`, `lab-unit`, `source-exact`, `donor-browser` y `lab-browser` (ejecuciones 43012908486, 43012908202, 43012908182, 43012908052, 43012908039 y 43012907989) |
| SHA final | el commit que contiene esta acta; su CI se registra en la PR y en la ficha R03 de #192 |
| Base | `master@75615fd`, sin cambios |

**Ficheros modificados**, todos dentro del perímetro autorizado:
- `labs/sculpt/r03-cabinets/cabinet-evidence-core.js`
- `cabinet-compare-core.js`
- `fixtures/cabinet-scenarios.js`
- `index.html`
- `qa/lab-browser-qa.cjs`
- `tests/sculpt-r03-cabinets.test.cjs`
- `docs/qa/artifacts/sculpt-r03/` (18 capturas y 3 evidencias de pruebas)
- este documento

**Sin cambios:**
- `cabinet-core.js`, `workshop/` (sigue literal), `PROVENANCE.md` y el workflow;
- ningún archivo del producto.

### B. Defectos corregidos

Procedimiento seguido:
1. Se escribieron las pruebas primero.
2. Se ejecutaron contra `964072d` en una copia aislada (`git archive`, fuera del repositorio activo).
3. Se aplicó la corrección mínima.
4. Se ejecutaron **las mismas** pruebas.

Las salidas están en `docs/qa/artifacts/sculpt-r03/closure-tests-before-964072d.tap.txt` (34/98) y `closure-tests-after.tap.txt` (98/98).

| Defecto | Caso concreto | Antes (`964072d`) | Después |
|---|---|---|---|
| **A · invariantes verticales** | `low-ceiling` manipulado con `fits:true`, `marginMm:300`, `topMm:2000`, `cabinetHeightMm:2100`, `elevationMm:300`, `marginMm:NaN` serializado como null, `fits:Infinity` o altura libre cambiada después | `validate()` devuelve `[]`: **aceptado** (8 casos) | rechazado: `vertical-fits`, `vertical-margin`, `vertical-top`, `vertical-cabinet-height`, `vertical-elevation`… |
| A | `bedroom-default` con `fits:false` | aceptado | rechazado |
| A | referencia `level-floor` (2750) frente a un objeto sobre el suelo terminado | `fits:true`, margen 550, **cabida inventada** | `pending` / `reference-not-comparable` |
| A | referencia sin `source` | `declared` con `source:'not stated'`, evaluada | `unsourced`, pendiente |
| A | `elevationMm: NaN` en el objeto | `fits:false`, `topMm: NaN` | `check: invalid / elevation-invalid`, sin veredicto |
| A | `heightMm` 2200,5 / −1 / 'alto' / NaN | `differs` (diferencia normal) | `object-height-invalid` |
| **B · robustez de `validate()`** | `cabinet`, `cabinet.spec`, `object`, `object.size`, `computed.cavity`, `computed.bays` o `clearance` a null; `computed.bays` como objeto; `clearance.doors` null; `candidates` como objeto | **TypeError** (10 casos) | códigos estables, sin excepción y sin modificar la entrada |
| B | `cabinet.issues` null u objeto; `object.size` como array; `computed.fronts` null; `clearance.drawers` como texto; `candidates` null; `notEvaluated` null; polígono vacío; ancho de módulo como texto; `spec.columns` no array | **aceptado como válido** (10 casos) | rechazado |
| B | dos módulos con ±5 mm compensados (siguen sumando el ancho); `cavity.depth` falseado | aceptado: solo se comprobaba el balance entre campos | `computed-mismatch`, recalculado con el motor puro |
| **C · previewDiff** | objeto de 2400 + techo de 2150 | `candidate-reviewable` / `would-set` | `blocked` / `none`: `does-not-fit` (−50) |
| C | objeto de 2400 + sin referencia | revisable | `pending` / `none`: `vertical-unknown` |
| C | objeto de 2400 + referencia `level-floor` | revisable | `pending` |
| C | candidatura bloqueada o pendiente falseada como revisable | aceptada | `candidates-mismatch` |
| C | altura distinta + mesilla en el barrido | candidatura sin ninguna mención al barrido | revisable para la altura; `independentIssues` con el cuadrado (FloorPlanPlacement) y el sector (experimental); estado global `issues` |
| C (protección nueva) | interior no válido + altura distinta | la candidatura **se omitía** (no era optimista, pero callaba) | `blocked` / `cabinet-invalid` explícita |

**Recuento** (98 pruebas finales contra `964072d`; las cifras de las filas suman 98):

| Grupo | Antes | Después |
|---|---|---|
| A, defectos reproducidos | 13 fallan | pasan |
| A, comportamientos ya correctos | 2 pasan | pasan |
| B, defectos reproducidos (20 mutaciones + recálculo con el motor) | 21 fallan | pasan |
| B, comportamientos ya correctos | 12 pasan | pasan |
| C, defectos reproducidos | 6 fallan | pasan |
| C, matriz de escenarios y contrato nuevo (no existían) | 15 fallan | pasan |
| Protección nueva | 1 falla | pasa |
| Pruebas previas adaptadas a propósito al nuevo contrato (`blockedBy` → `findings`; margen 550 → pendiente; códigos de `validate`; forma de la candidatura) | 5 | pasan |
| Pruebas nuevas sin etiqueta (fixtures, contexto, `readVertical`) | 3 fallan | pasan |
| Pruebas previas sin cambios | 20 pasan | pasan |

No se han contado como defectos los fallos debidos a campos que no existían.

### C. Cobertura conservada

- Donante, sin cambios:
  - pruebas unitarias 13/13;
  - `browser-smoke` 3/3 bloques, 0 peticiones externas (ejecutado el 11/11 sobre SOURCE EXACT);
  - `verify-workshop` frente a SOURCE EXACT: 3/3 ficheros.
- Paridad:
  - 928 tamaños, 3000 mutaciones con semilla y 300 redimensionados;
  - los 13 escenarios originales más 4 combinaciones nuevas.
- H1–H4: las mismas pruebas, ninguna rebajada.
- Laboratorio: **98/98**.
- Navegador: 4 viewports × 17 escenarios, más estados de puerta, interacciones y capturas.
- CI: ver A.

### D. Auditoría visual

**Escenarios y viewports:**
- 1440×900: los 6 prioritarios;
- 1280×800, 390×844 y 844×390: mesilla en el barrido y baldas no válidas;
- puertas cerradas, ocultas y abiertas a 1440×900 y 390×844 (`docs/qa/artifacts/sculpt-r03/r03-doors-*.png`).

**Cambio medido de píxeles del 3D entre estados** (96×64 píxeles, `closure-lab-browser-qa.json`):
- cerradas ↔ ocultas: 26,8 %;
- cerradas ↔ abiertas: unos 30,6 %;
- ocultas ↔ abiertas: unos 8,9 %.

En los cuatro viewports, y el proyecto no cambia.

**Hallazgos corregidos:**
1. La planta leía el campo retirado `blockedBy`.
2. El formulario rescataba valores no válidos: 1,5 cajones pasaba a 1 y una barra escrita como texto pasaba a «sin barra». Ahora los rechaza con su motivo.
3. «Particiones» se usaba para los módulos. Ahora se distinguen **módulos, divisores interiores y puertas**, con plural correcto (1 módulo → 0 divisores; 3 → 2).
4. Los errores aparecían en chino e inglés. Ahora están en español, indican el módulo y añaden «El armario no ha cambiado».
5. Cotas del alzado pequeñas (unos 10 px); ahora unos 13 px.
6. Hueco junto a la tarjeta de evidencia; ahora es ancha, en dos columnas.
7. Lienzo 3D vacío sin explicación cuando la distribución no es válida.
8. Faltaban el foco visible (3 px) y una tabla del comparador con desplazamiento interno en móvil (760 px dentro de 342 px).

**KEEP:**
- el mensaje literal del donante en su columna;
- los controles desactivados cuando la distribución no es válida, con «Restablecer» disponible.

**Riesgos visuales residuales:**
- con muchos módulos estrechos (más de 6 de unos 300 mm) los rótulos del alzado pueden solaparse;
- el rótulo del objeto en la planta puede pisar su huella.

### E. Capacidades preservadas

Siguen funcionando y probadas:
- armarios paramétricos, módulos, divisores, baldas, barras, cajones y puertas independientes;
- dividir y unir módulos;
- alzado, 3D (cerradas, ocultas, abiertas) y barrido de puertas y cajones;
- conflictos entre bisagra y cajón;
- evidencia experimental y comparador.

### F. Límites

- No validado para fabricación ni para pedido.
- Sin integración, sin persistencia canónica y sin escritura en proyectos.
- Sin aprobación de cirugía, sin merge, sin Production y sin Promote.

### G. GOV-05

Se mantiene el expediente de `PROVENANCE.md` sin cambios: MIT de wuyi y contribución de la PR #11 bajo D.6, solo para R03.
- MIT **no** elimina la obligación de atribución: se conservan los avisos de wuyi y la atribución a kai cai.
- No se extiende a otras piedras.

### H. Decisiones pendientes del propietario

1. Revisión humana y aceptación del laboratorio.
2. Contrato para interiores paramétricos (hoy bloqueado por el esquema): extensión versionada, documento lateral o no persistir.
3. Representación 3D en una futura integración: `cabinet-model.js` o el 3D actual.
4. Tratamiento de la altura real del mobiliario: el 3D de RUBIK fija 2200/1000/850 e ignora `size.heightMm`.
5. Alcance de la cirugía.
6. Relación del módulo con F3 y CAT-03: R03 **no** completa CAT-03.
7. Prioridad e ID maestro, si procede.
