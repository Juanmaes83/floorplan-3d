## Validación funcional con un proyecto autorizado de Beta 01

El propietario autorizó el uso local de una exportación FloorPlanProjectV1 1.0.0. El archivo se leyó mediante el servidor stdio y no forma parte de Git ni del Preview.

| Comprobación | Resultado |
| --- | --- |
| Inventario | 70 muros, 22 huecos, 13 estancias (11 computables), 46 objetos y 8 materiales |
| Área útil | 87,1828 m² al sumar los polígonos computables. El resumen devuelve 87,18 m² tras corregir el redondeo intermedio. |
| Medida de referencia de cocina | A (620, 5190), B (600, 7960) en mm. Distancia euclídea 2770,072 mm, igual a los 2770 mm redondeados que muestra RUBIK. |
| Herramienta de medición MCP | 1389,568 mm entre dos centros almacenados del proyecto, contrastado con la distancia euclídea de esos puntos. |
| Revisión con umbral de 600 mm | 41 hallazgos de holgura o puerta. La respuesta por stdio coincide con el motor canónico. |
| Búsqueda de despeje de la puerta | Con presupuesto de una posición devolvió `search-budget-exhausted`. Con presupuesto de 4000 posiciones y paso de 25 mm examinó 2065 y devolvió `search-grid-exhausted`. Conservó `applied:false` en ambos casos. |
| Protección del original | Huella distinta rechazada como `stale-source`. Lectura binaria y fecha de modificación idénticas antes y después. |

La escala del JSON es `estimated`. La comprobación acredita la consistencia de la geometría digital del exportado. No certifica medidas físicas ni normativa. La búsqueda de este caso no encontró una candidata aplicable.

Pruebas de la integración en Linux con Node.js 22: 137/137. Auditoría del lock de producción: cero vulnerabilidades después de actualizar Zod a 4.6.7 y las dependencias transitivas afectadas. Rollback mediante revert de los commits de esta PR sin modificar proyectos.
