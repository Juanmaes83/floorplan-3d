# FT3D-8 · Gate D — Matriz de equivalencias con la referencia visual del propietario

Fecha: 2026-11-05 · Rama `feat/ft3d-8-ux4d-gate-d-2026-11-05`.

**Referencia:** las tres capturas aportadas por el propietario de la demo «La obra, día a día · 16 semanas»
(`labs/ft3d-8/` modo demo). Se piden su composición y su funcionamiento, adaptados a Perla, sin el naranja, con datos
reales y sin la etiqueta FIXTURE fuera de las demos.

**Evidencias:** `docs/product/ft3d-8-ux4d-gate-d/` (capturas a 2×, vídeo de la interfaz y MP4 de entrega). Pruebas:
`tests/ft3d-8-ux4d.browser.test.cjs` (20 comprobaciones, citadas como P01–P20).

**Leyenda:** **Equivalente** = hace lo mismo con datos reales · **Parcial** = existe con una diferencia declarada ·
**Ausente** = no existe · **No aplicable** = no se debe reproducir (inventaría datos o la paleta se ha sustituido por
decisión del propietario).

## 1. Composición

| Elemento de la referencia | Qué hace | Existe en RUBIK | Funciona equivalente | Qué falta | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Título «La obra, día a día · N semanas» arriba a la izquierda | Dice qué se ve y cuánto dura | Sí, `#heroWeeks` | Sí: las semanas salen de `P.weeks(plan)` y no hay una cifra fija | — | Equivalente | d01, P01 |
| Línea de fechas e importe bajo el título | Inicio, fin y presupuesto | Sí, `#heroMeta` | Sí: fechas del plan e importe asignado «sin IVA» de C1–C4, con «(incompleto)» si falta | — | Equivalente | d03, P07, P18 |
| Visor 3D a todo el ancho como protagonista | La obra ocupa la pantalla | Sí | Sí: el visor empieza en y = 69 (antes en y = 845) y mide 458 px a 1440 × 900 | — | Equivalente | medidas-despues.json, P15 |
| Sello del momento («En obra (según plan)», «Final · plan completado») | Dice en qué fase está la obra | Sí, `#cardStage` | Sí, con tres estados: inicio, en obra y final. Usa la misma función `moment()` que el vídeo | — | Equivalente | d03, d06, P01, P09 |
| Cámaras (vistas) | Cambiar el punto de vista | Sí: AUTO, ISO, ALZADO, PLANTA y LIBRE | Sí, con `aria-pressed` | — | Equivalente | d03 |
| Barra de reproducción (inicio, atrás, reproducir, adelante, fin, velocidades, semana) | Navegar en el tiempo | Sí | Sí: además, la barra se puede arrastrar y la tarjeta y el Gantt siguen al mismo día | — | Equivalente | demo-interfaz-gate-d.mp4, P09 |
| Tarjeta abajo a la izquierda (semana, fecha, fase y tareas) | Explica el momento | Sí, la tarjeta grafito | Sí: semana y fecha, trabajos del día con % del plazo, días, elementos, importe y dependencias | En escritorio la tarjeta se desplaza por dentro cuando hay muchos trabajos a la vez | Equivalente | d03, d05, P03 |
| Gantt abajo a la derecha con cursor | Plan completo y momento actual | Sí | Sí: filas en curso resaltadas, cursor petróleo en el mismo día que la escena y flechas FS; SS, FF y SF aparecen como etiquetas | — | Equivalente | d03, P03 |
| Leyenda del Gantt | Explica colores y símbolos | Sí, `.glegend` | Sí | — | Equivalente | d03 |
| Color naranja de la demo | Acento | — | Se sustituye por el petróleo Perla, por decisión del propietario. Tampoco en el vídeo (antes, cursor `#e8622c`) ni en el distintivo de origen | — | No aplicable | d03, video-entrega-K-fotograma-08s.jpg |
| Etiqueta FIXTURE | Marca los datos de prueba | Sí | Solo aparece con datos de prueba («Datos de prueba · no es un proyecto real de cliente»). Los nombres de los fixtures la conservan porque son de prueba | — | Equivalente | d01 |

## 2. Evolución de la obra

| Elemento de la referencia | Qué hace | Existe en RUBIK | Funciona equivalente | Qué falta | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Estado anterior a la obra | Punto de partida | Sí | Sí: huella de los muros reales, presentación «Antes del comienzo de la obra» con inicio, número de trabajos y semanas, y botón «Reproducir evolución» | — | Equivalente | d01, P01 |
| Vallado perimetral | Implantación de obra | Sí, `illustrative/site-fence` | Sí, **solo** si el plan tiene una tarea que lo vincula (K, tarea 00). Se rotula «ilustración» y no cuenta en la cobertura ni en la evidencia | — | Equivalente | d02, P02, P19 |
| Caseta de obra | Implantación | Sí, `illustrative/site-hut` | Igual que el vallado | — | Equivalente | d02 |
| Grúa torre | Medios de elevación | Sí, `illustrative/crane` | Sí, durante su tarea (08) y con giro lento ilustrativo. Se retira con su tarea | En el vídeo, la punta del mástil queda fuera de encuadre | Parcial | video-entrega-K-fotograma-08s.jpg |
| Andamios | Medios auxiliares en fachada | Sí, `illustrative/scaffold` | Sí, durante su tarea (09) | — | Equivalente | d03 |
| Cargas colgando y movimiento de material con la grúa | Animación de obra | No | — | Sería animación sin respaldo en el plan; no se inventa | No aplicable | — |
| Muros que crecen por fases | Estructura | Sí | Sí: crecen según la fracción de plazo de la tarea que los vincula | — | Equivalente | d02, P02 |
| Varias tareas a la vez | Simultaneidad | Sí | Sí: el mismo día, 4 trabajos en la escena, en el Gantt y en la tarjeta («Hay 4 trabajos previstos a la vez») | — | Equivalente | d03, P03 |
| Cubierta y forjado | Envolvente | Sí | Sí: translúcidos mientras se construyen y opacos al terminar | La cubierta es la «envolvente superior derivada» del editor; no hay cubierta de proyecto | Parcial (motor de cubierta, no del laboratorio) | d03 |
| Carpinterías | Huecos y ventanas | Sí | Sí: los 8 huecos aparecen con la tarea 05 | — | Equivalente | d04, P04 |
| Acabados (tono crudo → pintado) | Revestimientos | Sí | Sí: el tono crudo es ilustrativo y está rotulado en la leyenda | — | Equivalente | d06 |
| Trabajos sin geometría (cimentación) | Tareas sin 3D | Sí | Sí: se dicen («planificado, sin representación 3D») y no se dibujan | — | Equivalente | P05 |
| Retirada de medios y final | Fin del plan | Sí | Sí: la tarea 10 retira los medios ilustrativos y el sello pasa a «Final · plan completado», con «no certificado de fin de obra» | — | Equivalente | d06, P09 |
| Periodo sin trabajos | Hueco en el plan | Sí | Sí: «No hay trabajos programados durante este periodo» y «Ir a la siguiente actividad» | — | Equivalente | P10 |
| Árboles, césped y entorno | Contexto paisajístico | No | — | Sería contexto inventado. El terreno real solo llega del territorio S1 cuando hay datos | No aplicable | — |

## 3. Interacción, importes, vídeo y entrega

| Elemento | Qué hace | Existe en RUBIK | Funciona equivalente | Qué falta | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Del Gantt a la escena | Ver una tarea | Sí | Sí: va al punto medio de la tarea, la pone primera en la tarjeta y resalta sus elementos | — | Equivalente (mejora sobre la referencia) | d07, P08 |
| De la escena al Gantt | Ver las tareas de un elemento | Sí | Sí: al hacer clic en un elemento se ven sus tareas, fechas, estado e importe, con «Ver trabajo» | — | Equivalente (mejora) | P08 |
| Importe del momento | Coste de la fase | Sí | Sí: reparto neto **sin IVA** de C1–C4 por tarea; «desconocido» cuando falta, nunca 0 € | — | Equivalente | d05, P06, P07, P18 |
| Vídeo con la misma composición | Presentar | Sí | Sí: titular, sello, banda grafito y mini-Gantt. En 7 instantes, el vídeo y la pantalla dicen lo mismo | — | Equivalente | video-entrega-K-1280x720.mp4, P14 |
| Vista cliente | Presentar sin ruido técnico | Sí, modo «Presentación» | Sí: sin la pestaña Proyecto ni los detalles profesionales | — | Equivalente | d10, P15 |
| Móvil | Uso en teléfono | Sí | Sí: el visor empieza en y = 95 (antes en y = 2.064) y no hay desplazamiento horizontal | — | Equivalente | d08, P16 |
| Entrega guiada | Preparar para el cliente | Sí | Sí: Previsualizar, Personalizar, Generar y Resultado, sin publicar nada | Publicar un enlace sigue siendo un paso aparte y explícito | Equivalente | d11, P13 |

## 4. Recuento

| Estado | Elementos |
|---|---|
| Equivalente | 28 |
| Parcial | 2 (encuadre del mástil de la grúa en el vídeo; cubierta derivada del motor de cubierta) |
| Ausente | 0 |
| No aplicable | 3 (paleta naranja, cargas animadas de la grúa, árboles y césped) |

## 5. Limitaciones de esta matriz
- El vídeo `AUDITORIA VISUAL .mp4` citado en el encargo no se ha recibido. La matriz se basa en las tres capturas.
- Solo se reproducen medios auxiliares que una tarea del plan vincula expresamente. Con un plan sin esas tareas
  (A–D), no aparecen. Es intencionado: así no se inventa la organización de la obra.
- La aceptación visual es del propietario. Que las pruebas pasen no sustituye esa revisión.
