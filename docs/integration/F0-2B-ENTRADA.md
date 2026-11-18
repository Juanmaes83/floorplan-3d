# F0.2b · Entrada al corte del editor

Base comprobada `master@dd528119bdfd80733c4faf5bb56a594190fea5ac`. F0.2a y el permiso de #264 ya están en esa base. El primer corte F0.2b conecta el editor a la sesión existente de `FloorPlanPersistence`. El [contrato propuesto de OP-05](https://github.com/Juanmaes83/floorplan-3d/blob/a722f9ddaf735d1ef45ffc17c6fbb87c2e8f43a6/labs/sculpt/op-05/private-glb-references.md) deja preparados los límites de F0.2c y F0.3. Los binarios privados quedan fuera de la conexión inicial.

| Delta verificado en la base consolidada | Impacto en la cirugía |
|---|---|
| `index.html` carga `project-library.js` y aún abre la biblioteca con `localStorage`. La API de sesión existente muestra `pending`, `saving`, `saved` y conflictos. | Iniciar una sola sesión antes de leer la biblioteca y entregar su fachada a los consumidores. Revisar los mensajes y operaciones cuyo código actual trata `setItem()` como guardado confirmado. Mostrar confirmación a partir de la transacción terminada. |
| Presupuesto, obra, observaciones y lecturas del espacio profesional todavía acceden a claves gestionadas de forma directa. `KEYS` fija cinco claves. | Pasar la fachada canónica a esos consumidores y preservar los accesos de preferencias fuera del dominio de persistencia. |
| Fuera del mapa inicial, `comparar/comparar.js` lee biblioteca y presupuesto de la copia local, y `evolucion/library-source.js` lee esa copia **y escribe entregas** mediante `R.open(localStorage).addDelivery()`. | Tratar también las dos rutas satélite. Comparar necesita una lectura de revisión íntegra y confirmada. Evolución debe encaminar la escritura a la misma autoridad y distinguir vista embebida de pestaña independiente. Conservar el modo demo en memoria y el contrato de mensajes de mismo origen. |
| #266, #267 y #268 tienen historia sobre `index.html` y permanecen abiertos. | Aislar esta entrada, fijar la base efectiva al iniciar el candidato y revisar la relación con esos diffs antes de tocar el arranque del editor. |

## Gate del primer corte

Probar en el editor real una migración, guardado confirmado y recarga. Cubrir fallo al abrir, cuota, conflicto entre dos pestañas y recuperación. Comprobar que el comparador lee una sola revisión y que Evolución confirma una entrega conservando su vínculo con el expediente. Usar las suites de presupuesto, obra, observaciones, variantes y edificio que corresponden al [contrato vigente](../contracts/persistencia-v1.md#8-mapa-de-f02b). La verificación en Firefox, Safari y móvil sigue siendo condición de la ruta crítica.

**GO para el siguiente corte aislado F0.2b.** **NO-GO de activación** hasta verificar los consumidores de las claves gestionadas, las rutas satélite y el comportamiento ante fallo y concurrencia. OP-05 y la cirugía futura de OP-07 dependen de este corte. Esta entrada documenta trabajo y evidencia sobre la base consolidada, sin modificar el arranque ni el almacenamiento del producto.
