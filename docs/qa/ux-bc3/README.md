# §5.2 · BC3: hacer visible el paso de comparar a aplicar

**Rama:** `claude/ux-bc3` · **base:** `master` `dacb5d39`. **Ruta:** Presupuestar → Precios de referencia → «Pavimento Parqué de
roble» → **Otro BC3** → **Zona B** → buscar **ROBLE** (m²) → **Ver precio** → comparar → procedencia → aplicar y confirmar.

**BC3 de prueba:** el archivo de la prueba humana («RUBIK QA BC3 SINTETICO») no está en el repositorio. Se usa una
**reconstrucción sintética declarada**: `tests/fixtures/bc3/rubik-qa-sintetico.cjs`, con columnas Zona A / Zona B, ROBLE a
**42,75 €/m² en Zona B** (el valor de la captura) y una referencia de unidad incompatible (`ROBLE-UD`, ud). Si el propietario
aporta su archivo, la prueba lo admite cambiando solo el fixture.

## Antes → después
| Problema (prueba humana) | Ahora |
|---|---|
| El aviso de carga contaba «partidas con precio» del catálogo y se confundía con los precios aplicados al proyecto | «Catálogo leído: «BC3 · RUBIK QA» · 3 referencias disponibles para buscar. **Todavía no se ha aplicado ningún precio al proyecto.**» Si falta elegir columna, el aviso está junto al selector y desaparece al elegirla |
| La tabla «Comparar y decidir» cortaba «Procedencia y decisión» y exigía desplazar | Cada referencia en su **tarjeta**: fuente y edición, estado, código, precio con unidad, diferencia y la acción completa **«Revisar procedencia y decidir»**. Sin desplazamiento horizontal en escritorio ni a 390 px |
| El recorrido no era evidente | Pasos visibles **Buscar → Comparar → Revisar procedencia → Aplicar y confirmar**, con el actual marcado |
| Antes de confirmar no se veía a qué partida iba | **Partida destino, cantidad, fuente, columna, unidad y precio** junto a «Ahora / Después» |
| Sin confirmación clara del guardado | Aviso **«Precio aplicado y guardado»** con partida, precio, importe y fuente, más **«Revisar en el presupuesto»** |
| En la ficha Presupuesto el Asistente tapaba «Revisado» | El Asistente va en su propia fila al final del diálogo |

Se conservan los filtros por unidad, la confirmación explícita, el consentimiento para sustituir un precio revisado y el historial.

## Comprobado (prueba `tests/bc3-comparar-aplicar.browser.test.cjs`, 2/2, estable 2/2)
- Aplicar ROBLE (Zona B): precio 42,75 €/m², **importe 1.461,66 € sin IVA** = 32,56282 m² × 1,05 × 42,75. La cifra de
  referencia del encargo (≈ 1.461,54 €) usa la cantidad redondeada a 32,56 m²: **diferencia de redondeo, registrada**.
- Tras recargar y abrir el mismo presupuesto: precio 42,75, fuente «referencia» con código ROBLE, estado **sin revisar**, e
  historial «desconocido → 42,75 €» con las revisiones antes/después.
- Cancelar no cambia el presupuesto. La referencia en unidades (ud) no se aplica a una partida en m²: bloqueada y explicada.
- Móvil 390×844: sin desplazamiento horizontal; cada acción entera dentro del diálogo.

## Regresión
- 87/87. `M2-QA-08 · MP4 of the same plan` agotó su tiempo en la primera tanda con la CPU ocupada por un render;
  repetida aislada con el render pausado: pasa (1/1).

Capturas: `1-comparar-escritorio.png`, `2-antes-de-confirmar.png`, `3-guardado.png`, `4-presupuesto-tras-recargar.png`,
`5-movil-comparar.png`.

## Correcciones de la revisión humana de la Preview (26/11/2026, instrucción del propietario en el chat de trabajo)
Ya comprobado visualmente por el propietario: se puede aplicar ROBLE. El cierre de §5.2 queda pendiente de revisar esto:
1. **Avanzar sin buscar:** «Ver precio» centra la referencia elegida y enfoca **«Revisar procedencia y decidir»**. En la
   confirmación, **Confirmar** (principal) y **Cancelar** van juntos al final y a la vista. **Cancelar** conserva partida,
   búsqueda y referencia («Cancelado: el presupuesto no ha cambiado. Sigues con la misma partida, búsqueda y referencia.»).
2. **Filtro por unidad que avisa:** se mantiene; junto a los resultados, «N coincidencias ocultas por estar en otra unidad»
   y **«Mostrar otras unidades»** (la casilla conserva la elección). **ROBLE-UD** en una partida en m²: «No se puede aplicar
   a esta partida: la referencia se mide en ud y la partida en m². RUBIK no convierte unidades; el presupuesto y el
   historial no cambian.»; su acción pasa a secundaria «Ver procedencia (no aplicable)». Presupuesto e historial intactos.
3. **Importe entendible:** «Cómo se calcula el importe de la partida»: superficie medida **32,56 m²**, merma **5 %**,
   cantidad presupuestada **34,19 m² (= 32,56 × 1,05)**, precio **42,75 €/m²**, importe de la partida **1.461,66 € sin IVA**
   (el que calcula el presupuesto; se explica que la medida completa es 32,56282 m² y solo se redondea el importe). El
   importe confirmado = el de la partida guardada (comprobado). El «importe conocido de todo el presupuesto» se rotula
   aparte («no es el importe de esta partida»). Importes con separador de miles siempre (1.461,66 €).
4. **Recorrido real** en `tests/bc3-revision-humana.browser.test.cjs` (escritorio 1440×900 y móvil 390×844): cancelar →
   Mostrar otras unidades → ROBLE-UD bloqueado → aplicar ROBLE → «Revisar en el presupuesto» → recargar (precio 42,75,
   fuente referencia ROBLE, «sin revisar», historial). Local: 2/2 + prueba anterior 2/2.
Descarga del BC3 sintético: `docs/qa/ux-bc3/rubik-qa-sintetico.bc3`.


## Aprobación humana · 27/11/2026

El propietario revisó y aprobó la Preview de §5.2 BC3. Queda registrada la aprobación humana de las correcciones de comparación, confirmación y guardado de precios del corte publicado.

[Preview revisada](https://floorplan-3d-pbmh51p45-juanma-espinosas-projects.vercel.app/) · SHA de la aplicación: `cb51c9a11a0742a44a2c21b7acd8e2914a56be0d`. Esta aprobación corresponde a la revisión humana del corte y no equivale a CI, fusión ni activación.
