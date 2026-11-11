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
| 5 · TEST | **hecho** | `tests/sculpt-r03-cabinets.test.cjs`: **24/24**; H1–H4 en §6 |
| 6 · PREVIEW y pulido | **hecho** | `index.html` + `qa/lab-browser-qa.cjs` en 4 viewports; capturas en `docs/qa/artifacts/sculpt-r03/` |
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

## 4. Contrato `CabinetEvidenceV1` (`rubik-sota.cabinet-evidence` 0.1.0-lab)

`propose({project, objectId, cabinet?, vertical?, useDefaults=true})` es una función pura: no escribe en el proyecto.

**Estado del armario** (`cabinet.status`):
- `declared`: distribución recibida;
- `proposed-default`: los valores por defecto del donante, con la lista de supuestos;
- `invalid`: lleva la lista de problemas;
- `unknown`: no hay datos.

**Geometría calculada.** Hueco útil, particiones con aberturas y cajones, frentes y conflictos entre bisagra y cajón.

**Altura.** Distingue la altura del armario y la del objeto (`match`, `differs` u `object-height-missing`). La referencia vertical puede ser `declared`, `derived`, `invalid` o `unknown`; con ella se dan `fits` y `marginMm`. También se registra lo que usaría el donante: 2400, valor de calibración.

**Barridos.** Para cada puerta, en planta:
- el sector, el cuadrado y la tabla del donante;
- `rubikSquareProblems`, calculados con `FloorPlanPlacement.problems`, la autoridad de RUBIK, sin modificar;
- `sectorHits`, calculados con `LayoutReview.penetration`: es un refinamiento informativo, nunca bloquea.

Para los cajones se da su extensión.

**`notEvaluated`.** Lista lo que no se comprueba: aperturas de más de 90°, herrajes reales, tolerancias, carga, paso, normativa y otras plantas. Incluye la altura libre cuando falta la referencia.

**`previewDiff`.** Nunca se aplica (`applied:false`):
- `size.heightMm` → `candidate-reviewable` cuando no coincide, porque el campo existe en el contrato;
- el interior → `blocked` con `op:'none'`, porque `objects` es `additionalProperties:false` y guardarlo exigiría cambiar el esquema canónico (no autorizado).

**`rubikToday`.** Recoge:
- los problemas de colocación de la caja;
- la altura 3D fija de `index.html`: armario 2200, zapatero 1000, aparador 850. Ignora `size.heightMm`; el catálogo dice 1200 para el aparador y el 3D dibuja 850;
- que RUBIK no tiene interior ni barrido de puertas.

**`validate(evidence)`** comprueba los invariantes: no canónico, sin aplicar, `blocked`⇒`none`, balance de anchos y alturas, `fits`⇔referencia, y el aviso de altura no evaluada.

## 5. Paridad con el donante literal

Comparación del motor esculpido con `workshop/design.js`:

| Prueba | Resultado |
|---|---|
| `defaultCabinet` en una rejilla de 928 tamaños y 4 tipos | idéntico |
| `validateCabinet` en 3000 mutaciones con semilla | mismo resultado en todas; mismo primer mensaje |
| `resize` y `bayWidths` en 300 casos | idénticos cuando el donante acepta |
| `cavity`, `bays`, `openings`, `drawerSize`, `fronts`, conflictos en los 12 escenarios | todos `true` |

En el navegador, la evidencia es igual byte a byte a la calculada en Node en los 4 viewports.

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
- el alzado (taller);
- el 3D con `cabinet-model.js` literal, con los sectores de barrido en el suelo;
- la planta con sector, cuadrado RUBIK, obstáculo del donante y conflictos;
- el resumen de la evidencia, el comparador de 4 columnas y el JSON.

Las ediciones viven solo en memoria y pasan por el motor puro; las rechazadas no cambian nada.

**Correcciones tras revisar las capturas:**
- ADJUST: las cotas del SVG eran ilegibles (el CSS anulaba el `font-size`).
- ADJUST: la planta alta estiraba la fila; se limita su altura.
- ADJUST: el comparador ahora muestra muros y estancia, no solo muebles.
- KEEP: la vista móvil apilada, con la tabla desplazable dentro de su contenedor.

`qa/lab-browser-qa.cjs` cubre 1440×900, 1280×800, 390×844 y 844×390, con 13 escenarios por viewport. Comprueba: 0 errores de consola o página, 0 peticiones externas, sin scroll horizontal, evidencia igual a la de Node, paridad, 3D con píxeles y ediciones rechazadas sin efectos.

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
