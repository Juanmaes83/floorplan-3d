# Presupuestos y revisiones económicas A, B y C

**Código:** `49e8feb`. **Autoridad:** presupuesto C1–C4 (`rubik-budget-v1[prj_qa-vivienda-obra]`) y expediente M2 (`rubik-construction-v1`).
**Referencia independiente:** `F.referencia()` en `tests/qa-m2/obra-sintetica.cjs`. Calcula en **céntimos enteros**, con redondeo por línea `round(cantidad × (1 + merma) × precio × 100)` e IVA por línea `round(neto × 10 %)`. También calcula el IVA sobre el total para medir la diferencia de redondeo.

## Partidas generadas por C1–C4 (12)
- **Pavimentos:** `floor:mat_wood`, `floor:mat_antislip`, `floor:mat_tile600`, `floor:mat_tile800`, `floor:mat_walnut` y `floor:mat_marble`.
- **Otras partidas:** `skirting`, `paint` y `partition-new`.
- **Carpinterías:** `opening:door`, `opening:sliding-door` y `opening:window`.

RUBIK **no** genera partidas de cimentación, estructura, impermeabilización, aislamiento ni instalaciones, porque no tiene autoridad de geometría ni de medición para ellas. Las tareas T01, T02, T05, T06 y T08 quedan sin importe; lo correcto es que aparezcan como «sin partidas» y no con 0 €, y así ocurre.

## Revisión A — precios propios, IVA 10 %

| Magnitud | Referencia independiente | RUBIK | Resultado |
|---|---|---|---|
| Partidas valoradas / sin precio | 10 / 2 (mármol y puerta) | 10 / 2 | PASS |
| Importe por línea | — | diferencia máxima 0,00 € | PASS (EX-02.A3) |
| Partidas sin precio | importe desconocido (`null`) | `null`, nunca 0 | PASS (EX-02.A2) |
| Base imponible (neto conocido) | **21 601,18 €** | 21.601,18 € | PASS (EX-02.A4) |
| IVA por línea | **2 160,12 €** | 2160,12 € | PASS (EX-02.A6) |
| IVA sobre el total | 2 160,12 € | — | Diferencia de redondeo de 0,00 € en este caso |
| Declaración de total incompleto | obligatoria | «2 partidas sin precio: el total no está completo.» | PASS (EX-02.A5) |
| Rótulo del importe final | «parcial» o «—» | **«Total 23.761,30 €»** sin calificar | **FAIL** (EX-02.A7, defecto D-01) |

Además:
Observación (no es un defecto): el IVA se muestra como «2160,12 €», sin separador de miles, y la base como «21.601,18 €». Es la regla de `es-ES` (CLDR y RAE): los números de cuatro cifras no llevan separador de miles.
- la entrega HTML de la revisión A se generó y quedó marcada como «corresponde al estado actual» (EX-02.D2).

## Prueba crítica 5.1 — cambiar un precio desde la Evolución y volver

| Paso | Resultado |
|---|---|
| Desde la tarjeta de T04 se abre «Presupuestar» sobre la evolución, en la partida `partition-new` | PASS (R0, R1) |
| Al volver se mantienen la misma fecha (2027-04-09) y la misma tarea | PASS (R2, R3) |
| El coste de T04 se recalcula al 50 % de la partida: **4 486,28 €** | PASS (R4) |
| La identidad del proyecto no cambia; la revisión del plan se marca desactualizada | PASS (R5, R6) |
| **Tras recargar**, el coste persistido es el nuevo | PASS (R7) |

Observación: tras recargar, la Evolución abre en 2027-02-28 (antes del inicio) y sin selección. La fecha y la tarea de la sesión anterior no se conservan entre recargas. Se anota, pero no se exige.

## Revisión B — tres precios a mano, tarifa BC3 y una partida sin valorar

| Comprobación | Resultado |
|---|---|
| BCCA gestionada sigue bloqueada (`data-enabled=false`) | PASS (B0) |
| La vista previa de la referencia no cambia el presupuesto | PASS (B1) |
| Una **unidad incompatible** se bloquea con un mensaje claro y el presupuesto no cambia | PASS (B2) |
| Pintura a 7,90 € con procedencia `provider-reference` y `PINT-LISA` | PASS (B3) |
| Nogal sin precio: desconocido, no 0 | PASS (B4) |
| Neto conocido de **22 287,44 €**, igual a la referencia | PASS (B5) |
| El historial anota el cambio por tarifa con su revisión antes y después | PASS (B6) |
| El historial anota los **cambios manuales** (gres, tabique y ventana) | **FAIL** (B7, defecto D-04): solo aparece `paint` |
| En la Evolución, el importe por tarea coincide con la referencia (restos mayores en céntimos) | PASS (B8) |
| Sin doble contabilización: la suma por tareas es igual a lo asignado (22 287,44 €) | PASS (B9) |
| La entrega de la revisión A queda «desactualizada: ha cambiado el presupuesto» | PASS (B10) |

## Revisión C — reparto 60/40, fechas y elementos

| Comprobación | Resultado |
|---|---|
| Reparto de `partition-new` al 60 % (T03) y al 40 % (T04): primero bajar y después subir | PASS (C1, C2 tras reabrir) |
| Una partida ya repartida al 100 % aparece deshabilitada en el selector | PASS (EX-03.4) |
| El motor rechaza un reparto por encima del 100 % sin corromper datos | PASS (EX-03.5) |
| Las duraciones cambiadas se conservan tras reabrir | PASS (C3) |
| **Cambiar un elemento de T07** (ventana) en una tarea ya guardada | **FAIL** (C4, defecto D-02, P1): el guardado se rechaza con «FloorPlanConstructionSchedule: elementIds of tsk_… contradict elements» |
| El historial del plan conserva cada guardado (`create`, `save`, `duplicate`, `save`) | PASS (C5) |
| La revisión declarada queda obsoleta tras B y C | PASS (C6) |
| Histórico de entregas: la de A se conserva y se añade la de C, que corresponde al estado actual | PASS (C7, C8) |

## Conclusión económica
La aritmética es correcta: líneas, IVA por línea, repartos y ausencia de doble contabilización coinciden **céntimo a céntimo** con la referencia independiente en A, B y C. Los fallos están en cómo se presenta y se registra la información:
- un total parcial rotulado como «Total»;
- el historial no anota los cambios manuales;
- no se pueden editar los elementos de una tarea ya guardada.
