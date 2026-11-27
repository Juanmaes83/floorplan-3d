# Villa Linde · Auditoría de aceptación de RUBIK

Caso sintético para **Estudio Linde Mediterránea**, firma ficticia. Base probada en Chromium local, a partir del commit exacto de la candidata de [PR #324](https://github.com/Juanmaes83/floorplan-3d/pull/324), `5a061725573c8bf9796f365d3dee1708484c6723`. Revisión del 27 de noviembre de 2026. El caso mide el flujo de un solo navegador con un edificio grande. La prueba interactiva de la Preview y la validación con dispositivos físicos quedan pendientes. Sin cambios de producto.

## Proyecto de control

| Alcance | Baja | Primera | Edificio |
| --- | ---: | ---: | ---: |
| Superficie interior de control | 592,20 m² | 481,32 m² | 1.073,52 m² |
| Estancias interiores | 20 | 16 | 36 |
| Zonas exteriores fuera del cómputo | 3 | 3 | 6 |
| Dormitorios amueblados | 6 | 8 | 14 |
| Baños | 2 | 3 | 5 |
| Salones | 2 | 1 | 3 |
| Muros rectos | 49 | 40 | 89 |
| Huecos | 37 | 31 | 68 |
| Muebles | 16 | 18 | 34 |

Incluye escalera recta, gimnasio, garaje, terrazas, balcones y cuatro pavimentos del catálogo. La piscina es una zona exterior rotulada de 9 × 4,2 m en planta. Pendientes el vaso 3D y la validación de muros curvos. Los 1.073,52 m² son la suma de los polígonos interiores del modelo sintético. RUBIK los muestra como estimados. Se utilizó una referencia pública de Alicante para probar la consulta de Catastro, sin guardar la parcela ni asociarla como solar de Villa Linde.

[Edificio JSON importable](villa-linde-edificio.json) · [Control por estancia](villa-linde-control.json) · [2D](01-villa-plano.png) · [3D](02-villa-3d.png)

## Resultados

| Flujo | Estado y evidencia |
| --- | --- |
| Importación y diseño | Importación correcta de las dos plantas en el editor. Apertura en 2D y 3D. Quedan la edición manual de una variante, los recorridos de visita a pie y la comprobación de la piscina y muros curvos. |
| Analizar | **Fallo reproducido.** Total de 1.073,52 m² y 36 estancias interiores correcto. El resumen lo presenta como «Planta única» y se titula «Villa Linde · Planta baja». [Captura](Analizar.png) |
| Presupuestar | **Alcance de planta activa, con rotulación desigual.** El área indica «Superficie del proyecto» sobre 592,20 m², aunque el texto inferior informa de que solo hay presupuesto por planta. Hay 9 partidas sin precio en la baja. [Captura](Presupuestar.png) |
| BC3 / BCCA | Con BC3 sintético, el filtro ocultó una referencia en kg para una partida en m². «Ver precio» y la vista de decisión conservaron 100 €/m² hasta «Confirmar». Tras confirmar, 38,50 €/m² con código PAV-ROBLE y estado «sin revisar». BCCA gestionada figuraba deshabilitada. [Captura](BC3-precio-confirmado.png) · [Resultado](flujo-bc3.log) |
| D3 · Dossier del proyecto | **Fallo reproducido en la revisión Cliente.** La portada dice «Planta única» y el desglose incluye ambas plantas. Se verificó la vista previa de D3. Queda generar y comprobar el PDF. [Captura](D3-cliente.png) |
| D4 · Dossier económico | **Alta.** En el HTML que usa la impresión Cliente, con el nombre neutro «Villa Linde», aparece «Total con IVA» para una sola planta. Los 415.394,70 € proceden exclusivamente de precios sintéticos de 100 € por unidad, introducidos para comprobar el alcance. El nombre con sufijo «Planta baja» puede enmascarar el problema. Exigir alcance explícito y persistente en pantalla y exportación. [Captura](D4-neutro.png) · [Resultado](flujo-d4-neutro.log) |
| DXF | Descarga real de la planta baja. El DXF declara milímetros. Queda cotejar medidas y repetir para la primera. [DXF](villa-linde-baja.dxf) |
| P2 · Reforma desde foto | En móvil 390 × 844, el caso interiorismo preselecciona «Cambiar suelo · Roble claro». Verificados consentimiento, cancelación y salida rotulada SIMULACIÓN sobre una imagen de prueba. Cero POST/PUT/PATCH y el proveedor real permanece bloqueado. [Captura](P2-fot01-simulacion-movil.png) · [Resultado](flujo-foto.log) |
| Catastro | El WFS oficial respondió HTTP 200 y abrió la ficha de una parcela pública de Alicante, tomada del inventario municipal. La vía de importación GML también preparó la ficha con el fixture sintético del repositorio. Pruebas hasta la vista previa, sin guardar. [Fuente de la referencia pública](https://sedeelectronica.alicante.es/blob_documento.php?ano_expe=12&dep_expe=2&depto=CON&expe=3&orden=2) · [Resultado](flujo-catastro.log) |
| P1 · lote de presentación | Descarga real de cuatro PNG, dos de cada planta, más edificio editable. Las cuatro huellas SHA-256 coinciden con el manifiesto. Ensayado en la variante de Villa Linde. [ZIP](presentacion-edificio.zip) |
| Dibujo vivo / Hybrid | Transición real sobre Villa Linde de grafito a estancias del modelo. Final y paso a primera en el primer clip. Segunda transición ejecutada desde su vista general con dos estancias elegidas. La presentación indica que la escalera queda fuera del recorrido. La prueba cubre cinco estancias seleccionadas, no el recorrido de las 36. [Video de baja y salto a primera](villa-hybrid.webm) · [Comienzo en primera](08-hybrid-superior.png) · [Resultado](flujo-hybrid.log) |
| Blueprint 3D · P8 | Planta, sección y alzado abiertos en el módulo existente. La sección y el alzado requieren cotejo dimensional antes de usarlos como lámina técnica. En la sección se recortan las etiquetas de la barra inferior «Visual limp…» e «Inspecciona…» a 1440 × 900. Impacto visual y de comprensión. [Sección](P8-section.png) |
| Despiece · P9 | Separación y ensamblaje sobre el edificio importado. Las transformaciones vuelven exactamente a la firma inicial, y los proyectos guardados de ambas plantas conservan su contenido. [Vídeo con ambos módulos y Studio](villa-entregables.webm) · [Resultado](flujo-entregables.log) |
| P10 · Historia del cambio | La variante conservó las dos plantas. Desde Diseñar cambié el suelo del garaje (Baldosa 600 → Parqué de roble) y volví a la historia. Guardé la revisión, abrí la vista Cliente y descargué el ZIP. La diferencia se muestra con la fuente y el encuadre de la planta baja. [Captura](P10-variante.png) · [ZIP](villa-historia.zip) |
| Mi estudio · HERO FINAL | Firma de prueba creada y seleccionada, cierre «Villa Linde · Costa Blanca» y estilo Editorial comprobados en Studio. Queda verificar el cierre en el archivo final que recibiría el cliente. [Vista Studio](Studio-HERO.png) |
| Evolución de obra | Plan del edificio guardado en borrador, dos tareas ligadas a muros de la baja. El visor reproduce, pausa y llega al 4 de diciembre conservando el edificio. La comprobación inmediata de vuelta a Entregar devolvió false. Sigue pendiente verificar si es demora o un fallo de navegación. Quedan tareas de primera, dependencias cruzadas y archivo final. [Vídeo](villa-evolucion.webm) |
| Blender | ZIP real descargado con scene.glb, manifiesto y referencia. El inventario del ZIP contiene 23 estancias, que coinciden con la planta baja. Solo acredita esa planta. Queda exportar primera y cotejar geometría o validar una salida combinada. [ZIP](escena-auditada.zip) · [Resultado](flujo-blender.log) |

## Pendientes de aceptación comercial
- Inventariar y ejecutar cada promesa de Home en la candidata revisada, registrando si es demo, simulación o función disponible. De este corte siguen pendientes el PDF de D3, el cotejo del DXF de ambas plantas, el expediente compartible y el vídeo final de HERO en el propio edificio. Corregir el alcance de D4 antes de aprobar su impresión. El informe principal conserva pruebas con otros casos que no acreditan Villa Linde.
- Catastro con la parcela real del encargo cuando la haya, comprobando procedencia, guardado y colocación explícita de la vivienda. BCCA gestionada aparece deshabilitada. Los precios de prueba de este informe son sintéticos.
- Gesture Labs y Película del proyecto requieren pruebas propias en sus ramas exactas. Para gestos queda la cámara frontal real del móvil. Para Película se necesita un clip que permita ver la transición completa y su report asociado. P8 Blueprint 3D y Dibujo vivo son funciones distintas.
- Validar curvas en OP-07, por separado, con medidas, edición, reimportación y compatibilidad en 2D, 3D y exportaciones. El edificio entregado en este corte usa 89 muros rectos.
- Mantener la revisión de alcance en el presupuesto y en la salida de cliente antes de usarlo como oferta de edificio completo.





## Cierre con el anteproyecto aprobado

Los resultados del primer edificio de carga quedan como antecedentes. La prueba sobre las dos láminas aprobadas incluye el edificio editable, orientación compartida y la escalera S1. Reproduce el alcance erróneo de D4 y «Planta única» en Analizar, D3 y P7. [Informe final y evidencias](aceptacion/CIERRE-VILLA-LINDE.md) · [Índice de la presentación conceptual](aceptacion/LEEME-PRESENTACION.md).

