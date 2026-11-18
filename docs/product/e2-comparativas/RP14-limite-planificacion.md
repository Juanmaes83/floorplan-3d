# E2.5 · Orden de cambio (RP14): límite de planificación

Estado: vigente en E2. Afecta a `comparar/` (orden de cambio) y a su manifiesto `rubik-sota.change-order-draft` 1.0.0.

## Qué exige el contrato RP14

El plazo de una orden de cambio solo se muestra con un plan válido. Sin plan no hay plazo. El plazo nunca se infiere de la superficie, del presupuesto ni del número de cambios.

## Qué hace E2

- El comparador **no lee planes de obra**. Compara dos revisiones guardadas de la biblioteca (`rubik-sota-project-library-v1`) y sus presupuestos (`rubik-budget-v1`). No lee nada más.
- La orden de cambio siempre dice «Sin plazo: estas revisiones no tienen un plan de obra vinculado en el comparador. La orden no estima duración.»
- El manifiesto lleva siempre `schedule: null`. No hay ningún campo de duración, fecha de fin ni retraso.
- Prueba: `tests/e2-comparativas.browser.test.cjs`, caso «E2.5 · orden de cambio… sin plazo».

## Por qué no se calcula

El producto sí tiene un plan de obra: `js/construction-schedule-core.js`, esquema `rubik-sota.construction-schedule` 0.2.0. Pero ese plan va unido al proyecto en curso, no a una revisión concreta de la biblioteca. Hoy nada garantiza a qué revisión «antes» y «después» corresponde un plan. Un plazo calculado con un plan de otra revisión sería un dato falso con apariencia de exacto.

## Qué haría falta para mostrar plazo (fuera de E2, requiere GO)

1. Cada revisión guarda su plan, o una referencia con huella SHA-256 al plan revisado con el que se presupuestó.
2. Los dos planes pasan la validación de `construction-schedule-core` (dependencias, fechas) y tienen nivel `plan-approved`. `plan-estimated` no basta para una orden.
3. La diferencia de plazo se calcula solo entre esos dos planes. Se muestra con su procedencia (qué plan y qué huella) y como plan, nunca como obra ejecutada.
4. Si falta uno de los dos planes o alguno no es válido, la orden sigue diciendo «Sin plazo», igual que hoy.

## Otros límites de la orden de cambio en E2

- **Conformidad:** no se infiere. El manifiesto lleva `acceptance: "not-recorded"`.
- **Firma:** no hay firma digital. El manifiesto lleva `signature: "none"`; la firma queda para E7.
- **Publicación:** la orden es un borrador interno. Se descarga en este equipo y no se publica: `publication: "none"`.
- **Marca:** el borrador no lleva la marca del estudio, así que cambiarla no lo desfasa. Prueba: «Marca · los borradores del comparador no llevan la marca».
- **Vigencia:** si los datos guardados cambian mientras se genera la orden, se descarta y no se puede descargar. Prueba: «A26/H03 · orden de cambio: cambio de datos DURANTE su generación la descarta».
