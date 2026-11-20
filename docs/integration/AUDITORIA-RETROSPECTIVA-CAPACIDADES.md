# Auditoría retrospectiva de capacidades · RUBIK SOTA

**Estado.** Inventario inicial contrastado. La validación de cada recorrido y de sus entregables sigue abierta. Base observada `adb86034d76e7ddd2033fcadf571a4358c5d25e0`, árbol `1393aef8c7f09491f52130d60ae0838b0d2421b3`. Este registro enlaza las autoridades y sus evidencias. El catálogo y la matriz conservan los identificadores y estados canónicos.

## Cobertura inicial

- Catálogo y matriz v1.12. Las secciones canónicas contienen exactamente los mismos 98 IDs. Conservar los descartes, anexos y capacidades con seguimiento separado en sus secciones actuales.
- K9/GOV-03. El registro del árbol comprobado devuelve 24 entradas. Sus declaraciones son 14 en Production, cuatro piloto, dos simulación, dos planificadas, una integrada y una desarrollada. Son niveles declarados en código pendientes de contrastar con acceso, permisos y entorno efectivo.
- Alcance retrospectivo. Cruzar las capacidades base de las primeras versiones con consumidores actuales, 23 piedras SCULPT y módulos todavía experimentales. El registro K9 cubre solo una parte de este universo.

## Primeros contrastes

| Capacidad y fuente | Home | Plataforma | Entregables | Estado de la comprobación |
| --- | --- | --- | --- | --- |
| Importación RoomPlan | La tarjeta «Subir un plano» enumera RoomPlan como formato y explica la revisión posterior. | El editor distingue la importación de la unión. El diálogo de unión identifica el escaneo, la vista previa y la planta de destino. | Auditar los resultados derivados del proyecto canónico y el alcance de su calibración. | Inspección de `js/guide-ui.js` e `index.html` en la base. Ejecución de los recorridos de importación y unión pendiente en esta auditoría. |
| Exportación visual OP‑10 | Evaluar su valor para arquitectura e interiorismo una vez revisadas las tarjetas existentes. | Escena 3D → Entregar → Documentación → Escena para Blender → Preparar escena → Descargar ZIP. | ZIP para colaboración visual en Blender. El manifiesto identifica una escena observada y registra sus huellas. | Descarga verificada en Production con un proyecto sintético. [PR #290](https://github.com/Juanmaes83/floorplan-3d/pull/290) |
| Simulator E | No aplica. Es una herramienta interna de QA. | Consumidor de QA de trayectorias, con geometría canónica como entrada. | Evidencia interna de contactos o cobertura incompleta. | HEAD preparado con autorización de publicación e integración pendiente. |

## Continuación

1. Partir del catálogo, sus pendientes históricos, la matriz, K9 y los recorridos base. Enlazar cada módulo, consumidor y prueba existente. Registrar las correspondencias múltiples por ID.
2. Auditar HOM-01–04 por profesión. Contrastar beneficios y llamadas a la acción con recorridos y permisos reales en desktop y móvil.
3. Contrastar los recorridos prioritarios por familias con Entregar y Studio. Verificar revisión, privacidad, marca, licencias y trazabilidad. Documentar por qué una superficie queda fuera cuando corresponda.
4. Priorizar déficits con el protocolo de #289. Mantener la auditoría en lectura y las propuestas de corrección en cortes independientes. Reutilizar evidencia vigente vinculada al SHA y comprobar los deltas posteriores.

[Mandato y protocolo](https://github.com/Juanmaes83/floorplan-3d/pull/289)
