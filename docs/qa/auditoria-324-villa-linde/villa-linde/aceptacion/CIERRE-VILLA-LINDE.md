# Villa Linde · cierre de la prueba de aceptación

Prueba sobre los dos planos aprobados, convertidos a un edificio editable de RUBIK. Se ejecutó en Chromium local con el árbol exacto de la candidata [PR #324](https://github.com/Juanmaes83/floorplan-3d/pull/324), SHA `5a061725573c8bf9796f365d3dee1708484c6723`. La CI de esa PR presenta cinco checks fallidos y `full-regression` omitida. Esta prueba funcional no certifica el resto de la regresión ni da autorización para fusionar.

## Modelo aprobado llevado a RUBIK

| Control | Baja | Primera |
|---|---:|---:|
| Dormitorios | 6 | 8 |
| Baños | 2 | 3 |
| Salones | 2 | 1 |
| Muebles y equipamiento representado | 70 | 56 |
| Huecos | 31 | 27 |
| Solapes y contactos detectados por la revisión de mobiliario | 0 | 0 |
| Conflictos detectados con S1 | 0 | 0 |

RUBIK informa **784,46 m² estimados** para el edificio. El JSON contiene el mismo norte y la misma ubicación aproximada de Alicante para ambas plantas. S1 tiene una huella coincidente en las dos plantas, con escalera y hueco separados por planta. Se movieron 25 cm los armarios que solapaban con mesillas en la representación aprobada y se añadieron placa, fregadero y nevera a la cocina. Coches y gimnasio son volúmenes de prueba. Se mantiene la huella de piscina plana. El porche curvo sigue en la lámina conceptual y requiere su propia validación geométrica.

La escala física figura pendiente. RUBIK marca 19 de 50 muros altos sin correspondencia de muro debajo. Este aviso requiere comprobar con qué elementos se salva la luz y cómo se resuelve la estructura. El cálculo solar informa sobre el escenario de Alicante, sin validar vistas, sombras de entorno, linderos ni viabilidad en una parcela. [Modelo editable](villa-linde-aprobada.json) · [Control](control-modelo.json) · [Baja](01-plano-baja.png) · [Primera](01-plano-primera.png) · [Orientación](02-orientacion.png).

## Defectos y límites, en orden de prioridad

| Prioridad | Hallazgo | Criterio de cierre | Evidencia |
|---|---|---|---|
| Alta | **D4. Alcance económico.** Con el título «Villa Linde» sin sufijo de planta, el documento Cliente imprime «Total con IVA» de la sola planta baja. 326.729,34 € con precios sintéticos de 100 € por unidad. La pantalla de Presupuestar sí informa en otra sección de que el presupuesto es por planta. | Incluir «Total con IVA · Planta baja» en pantalla, impresión y exportaciones, vinculado a la planta real y con nombre neutro. Si se calcula el edificio completo, exigir las dos plantas y explicitar faltantes. | [Impresión](D4-neutro.png) · [Resultado](d4.log) |
| Alta | **Analizar, D3 y P7.** La portada afirma «Planta única» aunque suma y enumera dos plantas. Reproducido en el PDF D3 y en el HTML P7 descargado. | Usar el alcance de edificio y nombrar las plantas en portada, conservar el desglose. Si la imagen corresponde a una planta, indicarlo junto a la imagen. | [Analizar y totales](hybrid.log) · [PDF D3](villa-linde-dossier-D3.pdf) · [HTML P7](archivo-cliente.html) |
| Media | **P3 Visita interactiva.** La ficha dirige al ejemplo cuando se abre un edificio de dos plantas. La visita de cliente no cubre Villa Linde. P1 permite presentar ambas plantas mediante cambio de vista y avisa que no recorre la escalera. | Aclarar el alcance en la tarjeta y vincular una alternativa válida del edificio o implementar la navegación real entre plantas. | [Ficha](P3-limite-edificio.png) · [Resultado](d3-dxf-completo.log) |
| Media | **Exterior.** La clasificación incompleta impide generar cubierta. La revisión de datos localizó dos segmentos: un ajuste de 10 mm en el paso de baños y un tramo frente a la transición de terraza y paso de piscina. | Revisar encuentros y familias de estancias exteriores antes de aceptar cubierta y huella. Mostrar qué segmento impide derivarlas. | [Informe de orientación](02-orientacion.png) |
| Baja | En P8, dos etiquetas de la barra inferior se truncan en escritorio. | Mostrar sus nombres completos o un control accesible que permita leerlos. | [Sección P8](P8-section.png) |

## Entregables probados sobre Villa Linde

| Módulo | Resultado comprobado |
|---|---|
| Diseño / 3D | Modelo creado a partir de las láminas aprobadas, importado y probado en ambas plantas, con escalera y hueco verificados. En Recorrer, 9,18 m de movimiento acumulado con teclado desde Acceso hasta la estancia Escalera S1, en baja. [Vídeo del modelo](01-modelo-orientacion.webm) · [Recorrido a pie](08-recorrido-editor.webm). |
| Catastro / Sol | Catastro WFS HTTP 200 para una referencia pública de Alicante. Importación de GML sintético hasta la ficha de revisión. La parcela de prueba no se guardó ni se asocia a la vivienda. [Prueba](catastro.log). La orientación queda guardada como escenario en el edificio. |
| BC3 / BCCA | BC3 sintético: filtro evitó mezclar kg y m². Ver precio y preparar decisión no alteraron la partida. Se aplicó 38,50 €/m² solo tras confirmar, procedencia PAV-ROBLE. BCCA gestionada figuraba deshabilitada. [Prueba](bc3.log). |
| Hybrid / Dibujo vivo | Secuencia completa en las dos plantas, tres estancias elegidas en baja y dos en primera. [Vídeo](04-dibujo-vivo.webm). |
| P1 Cinematográfico | Vídeo real H.264, 1280×720, 30 fps, 48,67 s, siete paradas. ZIP con cuatro PNG de baja y tres de primera, con las siete huellas verificadas y el edificio editable con S1. [MP4](P1-rubik-sota-recorrido-villa-linde-planta-baja.mp4) · [ZIP](presentacion-edificio.zip). |
| P2 Vistas y FOT-01 | Cuatro vistas preparadas. FOT-01 desde interiorismo preseleccionó roble claro con un fotograma 3D de Villa Linde. Se comprobó consentimiento, cancelación y salida SIMULACIÓN sin proveedor ni tráfico POST/PUT/PATCH. [Vistas](P2-vistas-preparadas.png) · [Simulación](P2-fot01-simulacion-movil.png). |
| P4 Evolución de obra | Dos tareas enlazadas, cada una ligada a un muro de distinta planta. Plan marcado como «Revisado (declarado)» para QA. Reproducción, pausa, fecha final y retorno a Entregar verificados. Archivos locales sin importes. [MP4](evolucion-producto.mp4) · [HTML](evolucion-cliente.html) · [Manifiesto](evolucion-manifiesto.json). |
| P5 Material board | PNG descargado en planta baja. [Lámina](material-board.png). |
| P6 Studio / HERO FINAL | Firma de Estudio Linde Mediterránea, estilo Editorial y cierre Villa Linde · Costa Blanca. Epílogo confirmado al final de Dibujo vivo con firma visible. El MP4 cinematográfico de P1 termina en la vista 3D. [Studio](Studio-HERO.png) · [HERO de Dibujo vivo](07-HERO-dibujo-vivo.webm). |
| P8 Blueprint 3D / P9 Despiece | Abiertas planta, sección y alzado; Despiece volvió exactamente a sus transformaciones iniciales. Modelo intacto. Se descargaron las dos láminas en el alcance de la vista. [Blueprint](blueprint-lamina.png) · [Despiece](despiece-lamina.png). |
| P10 Historia del cambio | Variante de dos plantas, suelo del salón principal cambiado de mármol a roble por la interfaz, revisión guardada y ZIP de cliente descargado. [ZIP](villa-historia.zip). |
| DXF | Descargas desde las dos plantas, en milímetros. [Baja](villa-linde-baja.dxf) · [Primera](villa-linde-primera.dxf). |
| Blender | ZIP, importación local y verificación en proceso nuevo con 9/9 checks independientes por exportación. Renders de un interior de cada planta con Cycles, perfil preview. [ZIP de baja](escena-auditada.zip) · [ZIP con primera activa](escena-primera.zip) · [Salón en baja](blender-baja/previsualizacion/rom_linde-b-12.png) · [Dormitorio en primera](blender-primera/previsualizacion/rom_linde-p-11.png). |

## Pendiente antes de una entrega comercial completa

- Resolver y volver a verificar alcance multizona en presupuesto y en documentos de cliente. Los PDF y HTML de prueba quedan como evidencias.
- Elegir solar real, comprobar acceso, vistas, privacidad, sombras, piscina, porche curvo y estructura. Completar la modalidad de visita a pie multaplanta. La firma utilizada es ficticia.
- Gesture Labs necesita validación en su rama y con la cámara frontal real. La Película del proyecto §11 requiere su propio artefacto audiovisual. El cinematográfico P1 anterior es una función distinta que sí está en la candidata.
- Implementar, en su propio corte de producto, la ficha de decisión por estancia y el enlace Diseñar ↔ Analizar. [Requisitos y criterios de aceptación](../DECISIONES-DE-DISENO-Y-ORIENTACION.md).


