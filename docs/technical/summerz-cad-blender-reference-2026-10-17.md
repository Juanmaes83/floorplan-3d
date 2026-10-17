# Referencia externa: Summerz3002, CAD y Blender (17-10-2026)

**Estado: observación externa y propuesta de evaluación; no implementación de Rubik ni fase aprobada.** Esta nota conserva la procedencia y las preguntas que deben resolverse antes de usar el trabajo como referencia técnica.

## Fuentes y alcance comprobable

- [Publicación de Summerz3002 del 16-10-2026](https://x.com/Summerz3002/status/2110981167193403432): declara haber añadido importación CAD, modelos de Blender y renderizado sobre la aplicación original, y haberla mostrado a diseñadores de su empresa. El vídeo incrustado muestra una demostración; la valoración de esas personas es un testimonio del autor, no una evaluación reproducible nuestra.
- Los enlaces de código y [demo](https://wy51ai.github.io/floorplan-3d/) compartidos junto al mensaje conducen a [wy51ai/floorplan-3d](https://github.com/wy51ai/floorplan-3d), la base original. Su README describe una aplicación web Three.js en `index.html`, importación/exportación de planes JSON y un plano de ejemplo; el menú visible de la demo ofrece «Import plan», sin opción CAD explícita. **No se ha identificado un fork, commit, licencia de los nuevos assets ni instrucciones de reproducción de la ampliación de Summerz3002.** No atribuir CAD/Blender al HEAD de `wy51ai` ni importar código o modelos del vídeo.

## Encaje en nuestro trabajo

La observación refuerza la hipótesis profesional del [Roadmap 2](../ROADMAP-2-proposal.md): una entrada CAD vectorial puede ahorrar el retrazado y una salida Blender puede producir material visual a partir de geometría editable. No demuestra demanda, exactitud, coste ni prioridad. Rubik ya tiene un paquete determinista Rubik→GLB/Blender acotado ([PR #24](https://github.com/Juanmaes83/floorplan-3d/pull/24)); el [piloto offline de vídeo, PR #42](https://github.com/Juanmaes83/floorplan-3d/pull/42) está separado y pendiente de integración/revisión humana. El piloto CPU de 640×360 no alcanza la calidad Candidate 04 y documenta tomas y materiales defectuosos. La demostración externa no corrige esos límites por sí misma.

| Pregunta | Primera prueba controlada | Criterio antes de implementar |
| --- | --- | --- |
| ¿Qué significa «importar CAD»? | DXF sintético con líneas, polilíneas, capas, unidades y huecos; inspección de entidades no interpretadas. | Vista previa local, selección/corrección humanas, escala y ejes declarados, IDs estables y rechazo explicable; DWG se decide después, con licencia/proveedor y privacidad comprobados. |
| ¿Qué conserva Rubik? | Adaptar sólo entidades elegidas a `FloorPlanProjectV1`; comparar cotas, polígonos, muros y huecos frente al DXF. | Proyecto original intacto, trazabilidad por elemento, validación canónica y sin inferir puertas/muros sólo por la capa. |
| ¿Qué aporta Blender? | Usar el paquete de #24 y un fixture asimétrico; comparar cámaras, iluminación, materiales, tiempos y errores visuales con #42. | Reapertura y hashes, presencia y legibilidad de estancias pequeñas, coste por fotograma y revisión humana a 1×. No sustituir el 3D interactivo del móvil por un render offline. |
| ¿Sirve la GPU del equipo? | Repetir un render fijo en CPU y GPU local con misma escena, resolución y muestras; registrar hardware y versiones. | Comparar tiempo, memoria y resultado. El móvil puede recibir un vídeo/imagen exportado sin ejecutar Blender; el 3D interactivo mantiene sus propias pruebas de rendimiento móvil. |

**Siguiente comprobación externa:** obtener el fork/commit de Summerz3002 y un ejemplo CAD con salida y parámetros, si se publica. Fijar SHA y licencia, reproducir localmente y medir fidelidad, fallos, tiempo y calidad antes de proponer reutilización. Si no aparece el código, la idea sigue siendo referencia de producto, no dependencia de implementación. Las decisiones de prioridad y alcance siguen el Roadmap 2 y sus gates; #39, #42 y las PR apiladas del MCP conservan sus revisiones propias.
