# MCP local — qué falta después de la auditoría de #57

**Estado al 18-10-2026:** #40 → #41 → #43 están fusionadas. [#57](https://github.com/Juanmaes83/floorplan-3d/pull/57), cuarto corte `check_route_2d`, está en borrador sobre `master` `d9cd11b`, HEAD auditado `e9129bd`. La auditoría de Codex revisó el código, repitió los 46 tests MCP y `npm run check` en ese SHA, y no encontró un defecto bloqueante. Es una auditoría técnica acotada: no constituye aprobación de merge ni validación física del proyecto.

## Qué demuestra #57 en el modelo

Con `start`, `end` y `widthMm` explícitos, la herramienta busca una trayectoria para un **disco 2D**. Un positivo aporta polilínea y anchura mínima sobre esa trayectoria; un bloqueo se deriva de la separación geométrica modelada. Lo incierto y los límites de cálculo tienen estados distintos. La puerta utiliza el ancho nominal del hueco. [Contrato y casos en la rama de #57](https://github.com/Juanmaes83/floorplan-3d/blob/feat/rubik-mcp-route-2d/docs/technical/local-mcp-route-2d.md) hasta su merge.

La prueba local de Codex pasó 46/46 con Node 24 y versiones instaladas del SDK 1.32.1 y Zod 4.5.4 coincidentes con el lock. Dos fallos iniciales de pruebas temporales se debían a que este entorno no permite escribir en `/tmp`; al repetir con `TMPDIR` dentro del worktree pasaron 21/21 pruebas de ruta y 46/46 en total. Una comprobación adicional con dos habitaciones separadas por 1 mm devolvió bloqueo; con borde compartido devolvió recorrido. La CI de #57 tuvo un job fallido **sin pasos ejecutados** (run `39169075462`): no es una CI verde. No se ejecutaron pruebas de navegador porque el producto web no cambia en #57.

## Puertas de revisión pendientes

| Gate | Evidencia necesaria | Resultado posible |
| --- | --- | --- |
| Integración de #57 | Incorporar al informe QA el contraste independiente positivo dormitorio principal → salón de 600 mm con comando, puntos y resultado reproducible; revisar HEAD tras ese cambio y decisión de merge por separado. | Cuarto corte integrado, **sin cerrar automáticamente la Etapa 1**. |
| Escala física | Uno o más JSON de proyectos reales autorizados con `scale.confidence = real`, cotejados con medidas conocidas; puntos y ancho elegidos explícitamente; hashes, incertidumbre y casos positivos/negativos revisables. Proteger los datos y no subir planos privados. | Evidencia de que las unidades del modelo son aplicables a esos casos; no certificación general. |
| Modelo de paso | Decidir si el propósito de la Etapa 1 termina en disco 2D nominal o requiere hoja abierta/cerrada, marco, altura libre, giro de un objeto no circular y paso por escalera. Priorizar cada ampliación con geometría y datos realmente disponibles. | Contrato ampliado en corte distinto o límites expresamente aceptados. Nunca convertir un resultado 2D en «transitable en la vivienda» por el nombre del estado. |
| Producto y comunicación | Revisar cómo un agente presenta `recorrido_demostrado_en_modelo_2d`, `bloqueado`, `no_evaluable`, `evidencia_insuficiente` y `límite_de_cálculo` sin omitir escala, hash ni límites. | Mensajes fieles al modelo; ningún dictamen de accesibilidad, evacuación o normativa. |

No hay que reimplementar relaciones, diagnóstico, medidas o #43. Las Etapas 2–4 son propuestas separadas; este documento no autoriza escritura en el JSON, simulación ni variantes. La revisión de LoRA LAB y de la interfaz de creación de estancias tiene documentación y responsable propios.
