# SCULPT-R02-A normalizado — techos y equipos altos: sesión revisable, alternativas, contrato candidato y demostración

**Fecha:** 12/11/2026 · **Rama:** `lab/sculpt-r02a-normalized` · **Base:** `master@eae8cf6709a4523b1e6009e6b9bee393044977fc`
**Origen:** laboratorio [#193](https://github.com/Juanmaes83/floorplan-3d/pull/193) en `7d8a6269047ec714fcdc51cf308f28c2650b23dc`. **No se fusiona #193 entero.**
**Estado:** COMPLETA PARA AUDITORÍA, en laboratorio. **No integrada en RUBIK.**

- No es MEP, ni diseño lumínico o de climatización, ni comprobación reglamentaria.
- Sin ID maestro: su encaje en el catálogo es una decisión del propietario. La relación con LUZ-01 y OBR-04 es solo parcial.

## B1 · Auditoría y normalización

### Qué aporta realmente frente a RUBIK (`master@eae8cf6`)

| Capacidad | Estado | Evidencia |
|---|---|---|
| Capa de techo separada del suelo: un plafón no choca con la cama como si fuera un mueble de suelo | **Demostrada** | #193 C1; aquí, pruebas B3 y navegador |
| Referencia vertical explícita: declarada con fuente, derivada de la planta superior (`level-floor`) o desconocida; nunca supuesta | **Demostrada** | 22/22 de #193 en el núcleo normalizado y estados `contradictory` y `unknown` |
| Montaje vertical: arriba = altura libre − descuelgue; abajo = arriba − alto; caída de cortina | **Demostrada**, con paridad F/D 18/18 con el donante (en #193) | Pruebas de sección y 3D en coordenadas de mundo |
| Regla de altura libre del donante (D) | **Demostrada** | `exceeds-clear-height` |
| Choque con muros (huella girada) y recolocación del donante | **Demostrada solo con muros alineados a los ejes**. Con muros diagonales: `unsupported-wall-orientation` | #193 C3c |
| Interferencias 3D entre elementos y holgura sobre muebles de suelo | **Demostrada** (aportación de #193, no del donante) | Pruebas B3 |
| **Contención de la huella girada en la estancia** | **Nueva en este corte.** El núcleo la declaraba «no evaluada». Solo puede bloquear. | Prueba: un plafón entre el pasillo y el salón queda bloqueado |
| **Alternativas revisables** | **Nueva.** Rejilla acotada en la estancia; cada candidata vuelve a pasar por el núcleo | Prueba: 3 alternativas de la más cercana a la más lejana; ninguna cuando el problema es la altura |
| Comparación antes/después | **Nueva**, y `projectUnchanged` se mide, no se afirma | Prueba y navegador |
| Geometría de falso techo, luminarias reales, cálculo de iluminación, climatización, instalaciones, normativa | **No existe**, ni en el donante ni aquí | — |

### Clasificación de lo que entra en esta rama

| Pieza | Decisión |
|---|---|
| Núcleo `CeilingLayoutEvidenceV1` | **KEEP literal.** `js/r02a-ceiling-core.js` es idéntico a #193 salvo la ruta del `require`; una prueba comprueba el sha256 con la ruta restaurada. |
| Extractos del donante | **KEEP**, idénticos byte a byte (`js/r02a-donor-extracts.js`, sha256 `9cb9a794…`), con el aviso MIT en `docs/licenses/r02a-donor-MIT.txt` |
| Escenarios sintéticos, comparador y regla D literal | **KEEP**, en `labs/sculpt/r02a-normalized/` |
| Las 22 pruebas de comportamiento de #193 | **KEEP**, sin cambios salvo rutas (`tests/r02a-ceiling-core.test.cjs`) |
| Pruebas de procedencia, del taller del donante y guardas del laboratorio | Se quedan en #193, donde está la reconstrucción `SOURCE-EXACT` |
| Sesión, contención, alternativas y comparación | **SCULPT**, nuevo: `js/r02a-ceiling-session.js` |
| Persistencia | **REPLACE.** Contrato candidato aislado `x-r02a-ceiling` (§B.4); nunca la del donante |
| Editor, IA, reconocimiento y mallas detalladas del donante | **REMOVE** (igual que en #193) |

## B2 · Demostración funcional aislada (`labs/sculpt/r02a-normalized/`)

Una persona puede:

1. **Elegir una estancia** del piso sintético de referencia de RUBIK. Algunos muebles llevan alturas sintéticas (cama 500, armarios 2200, mesa 750) para poder mostrar holguras.
2. **Definir la referencia vertical:** desconocida, o confirmada con altura libre, origen (suelo acabado o forjado) y una fuente obligatoria. Se guarda por estancia.
3. **Proponer un elemento:**
   - tipos: plafón, colgante, calefactor de baño, riel o cajón de cortina, split mural;
   - medidas: las de catálogo del donante, etiquetadas como «no medidas», o editadas;
   - descuelgue, caída de cortina y giro.
4. **Colocarlo** tocando la planta (eventos de puntero, que funcionan también con un campo enfocado) o con X/Y y «Colocar» desde el teclado.
5. **Ver su ubicación y sus interferencias:**
   - en planta, coloreado por estado;
   - en sección vertical: techo, elemento, punto más bajo y muebles debajo;
   - en 3D: plano de techo traslúcido solo si hay referencia, y el elemento a sus cotas reales.
6. **Leer el estado** junto a las vistas, en lenguaje claro:
   - **revisable**, **pendiente de datos** o **bloqueado**;
   - con el motivo (por ejemplo, «queda por debajo de la parte alta de la cama»).
7. **Pedir alternativas revisables.** Se dibujan numeradas; se puede usar una. Si el problema es la altura, se explica que moverlo no ayuda.
8. **Rechazar posiciones inválidas:** fuera de una estancia, a caballo entre estancias, con datos no válidos.
9. **Comparar el antes y el después:**
   - el proyecto sigue «sin cambios» y la propuesta revisable tiene N elementos;
   - guardar exige una **casilla de confirmación expresa**;
   - al confirmar, cada elemento se **recomprueba** y se guarda solo en el proyecto sintético.

### Ciclos de pulido

| Observado | Cambio | Verificado |
|---|---|---|
| Las vistas quedaban en la columna estrecha | Rejilla con las vistas grandes y los pasos a 420 px | Captura a 1440 |
| La explicación mostraba IDs («obj_template-001») | `labelOf`, que dice «la cama» o «el armario» | Prueba de navegador |
| La sección decía «bed» | Etiqueta en español | Captura |
| Alternativas 1 y 3 superpuestas | Separación mínima de una huella | Captura y prueba |
| En móvil, el estado quedaba lejos de la planta | Línea de estado dentro de las vistas fijas | Prueba (`#stageState` visible) |
| En móvil, tocar con un campo enfocado no generaba `click` | Eventos de puntero con umbral de 10 px y retirada del foco | Prueba táctil a 390 y 844 |
| Colocar solo con el puntero (accesibilidad) | X/Y y botón «Colocar» | Prueba de teclado |
| Cotas superpuestas con elementos bajos | Una sola línea si el elemento mide menos de 260 mm | Captura de la sección |
| (Auditoría de ChatGPT, 12/11) «No prueban confirmación de la alternativa y reapertura de la persistencia». Era cierto: el laboratorio no tenía archivo, solo el JSON en pantalla | «Descargar proyecto JSON» y «Reabrir JSON». Al reabrir, `RubikCeilingContract.recheck` **vuelve a evaluar** cada elemento guardado con la referencia y los demás elementos tal como están en el archivo. Es de solo lectura: lo que ya no cumple se marca en rojo en la lista, la planta y el 3D, con su motivo, y no se mueve ni se borra | Prueba de navegador con el archivo real (alternativa → confirmar → descargar → página nueva → `input[type=file]`) y con el mismo archivo con la referencia rebajada a 1800 mm. Capturas `r02a-roundtrip-*` |
| Al reabrir, el control de referencia decía «Desconocida» aunque hubiera una guardada; la sección decía «techo desconocido» sin elemento seleccionado | El control y la sección muestran la referencia guardada de la estancia (nunca una supuesta) | Misma prueba |
| «Guardados 1 elementos», «1 confirmados» | Singular y plural | Misma prueba |

## B3 · Pruebas y resultados reales (local, Chromium de Playwright)

```
tests/r02a-ceiling-core.test.cjs      22/22   (comportamiento de #193 sobre el núcleo normalizado)
tests/r02a-ceiling-session.test.cjs   12/12   (estados, altura insuficiente, referencias ausentes, interferencias, lotes
                                               parcialmente inválidos, contención, alternativas, comparación, contrato,
                                               reapertura con recomprobación, guardas)
tests/r02a-lab.browser.test.cjs       13/13   (1440, 1280, 390×844, 844×390; ida y vuelta con el archivo real; sin peticiones externas)
Regresión unitaria del repositorio    1051 pruebas · 1049 pasan · 0 fallan
```

Capturas en `docs/qa/sculpt-r02a-normalized/`. El conjunto completo es el artefacto `r02a-<sha>` del workflow `R02-A normalized`.

## B.4 · Propuesta de contrato (decisión humana)

| | **A · `objects[]` con tipo de techo + `elevationMm`** | **B · `extensions["x-r02a-ceiling"]` (candidata, implementada)** | **C · colección `ceilingItems[]` + altura libre por estancia (versión menor)** |
|---|---|---|---|
| Válido hoy | Sí en el esquema, **pero** RUBIK los trata como muebles de suelo: `FloorPlanPlacement` bloquea un plafón sobre la cama y el 3D ignora `elevationMm` | **Sí**, en todos los lectores 1.x y en niveles de edificio estrictos | No: necesita esquema, `CHANGELOG` y `building-core` |
| Lectores actuales | Dibujarían el plafón en el suelo | Lo conservan y lo ignoran | — |
| Riesgo | Visual y funcional, inmediato | Huérfanos si se borra una estancia (`orphans` y `prune`) | Superficie de cambio antes de validar el producto |

**Recomendación:** **B ahora** (laboratorio y piloto) y **C como consolidación** en una versión menor, cuando el propietario valide el modelo. Además, R03 ya usa la misma forma de referencia vertical (`{clearHeightMm, reference, source}`). Si se aprueba B, el armario podrá leer la altura libre confirmada de la estancia sin inventar techos.

Hay que decidir:

1. **ID maestro:** G4 o seguir como investigación.
2. **Modelo de datos:** A, B o C.
3. **Ámbito de la referencia vertical:** por estancia (implementado) o por planta.
4. **GOV-05.**
5. **Autorizar o no** R02-B (formas 3D detalladas) o una cirugía de integración.

## Propuesta de cirugía (sin aplicar; corresponde a ChatGPT)

1. Cargar los módulos puros.
2. En la paleta del editor, añadir una capa «Techo», separada de la de mobiliario, que use `RubikCeilingSession.evaluate`.
3. Confirmar con `RubikCeilingContract.confirmItem` dentro de `mutate()`, para que entre en el deshacer de RUBIK.
4. En el 3D, dibujar los elementos confirmados a sus cotas (`mount`), sin tocar `buildFurniture`.
5. ENT-01 ya excluye `extensions` de la entrega al cliente.

## Recorrido para el propietario

1. Abrir la Preview de revisión. ChatGPT facilitará el enlace y el SHA.
2. En **2 · Referencia vertical**, elegir «Confirmada», escribir una fuente y pulsar «Usar en esta estancia».
3. En **3 · Elemento**, elegir «Lámpara colgante», poner alto 2300 y descuelgue 0, y tocar encima de la cama: sale **«Bloqueado: queda por debajo de la parte alta de la cama»**.
4. Pulsar **«Ver alternativas»**: aparecen 1, 2 y 3 en la planta. Pulsar «Usar alternativa 1»: pasa a **«Revisable»**.
5. Mirar las pestañas **Sección** y **3D**: el techo y la lámpara a sus alturas.
6. Pulsar **«Añadir a la propuesta revisable»**: el proyecto sigue **«sin cambios»**.
7. Marcar la casilla y pulsar **«Confirmar y guardar»**: aparece en «Guardados en el proyecto» como «Sigue siendo revisable».
8. Pulsar **«Descargar proyecto JSON»** y recargar la página: «Nada guardado todavía».
9. Pulsar **«Reabrir JSON»** con el archivo: vuelve la lámpara, la referencia «Confirmada» con su fuente, y el aviso «comprobado de nuevo y revisable».
10. Repetir sin referencia («Desconocida»): sale «Pendiente de datos» y no se dibuja ningún techo.

## Riesgos y HOLD

- **Sin regla de paso libre para personas:** el núcleo de #193 solo comprueba techo, muebles y otros elementos. Una lámpara que cuelgue a 40 cm del suelo en una zona libre sale «Revisable» (comprobado). Por eso todo es «revisable» y necesita una persona; una regla de altura de paso sería una decisión de producto, no algo que deba suponer este laboratorio.
- **GOV-05 abierto:** aportación con coautoría de IA y aviso MIT de wuyi.
- **Tamaños del catálogo:** son del donante, no de productos medidos.
- **Recolocación:** solo con muros alineados a los ejes.
- **Alternativas:** la búsqueda en rejilla está acotada (≤ 1600 puntos); no es una optimización.
- **Ninguna cota es reglamentaria.**
- **HOLD de integración:** decisiones 1–5 y cirugía autorizada.
