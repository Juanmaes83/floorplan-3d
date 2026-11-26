# §5.3 · Presupuestar y Analizar con el estándar de Entregar (primer corte)

**Rama:** `claude/ux-presupuestar-analizar` · **base:** `master` `dacb5d39`.

| Hallazgo | Corrección |
|---|---|
| Presupuestar: el resumen decía **«Plan de obra · Listo»** con la ficha en **«0 tareas · borrador»** | La ficha dice **«Borrador · 0 tareas»** y su acción es **«Añadir primera tarea»**. El resumen marca «Falta · Plan de obra (borrador · 0 tareas)». Un plan con tareas en borrador se marca «Borrador», nunca «Listo» |
| «25 % completado» sin decir de qué | El porcentaje dice su base: «1 de 4 piezas del presupuesto listas», «N de 4 comprobaciones hechas» y «N de M entregables listos» |
| Analizar: semáforo solo por color (banda lateral) | Cada ficha lleva su etiqueta **Hecho / Empezado, sin terminar / Sin hacer** |
| Analizar con un lenguaje distinto: sin tarjeta, texto pegado al borde y cuatro botones con el mismo peso | Tarjetas de Presupuestar/Entregar: fondo, márgenes, una acción principal como enlace con flecha y las demás secundarias. **Todas las acciones se conservan** (la prueba comprueba las 10) |

**Prueba:** `tests/presupuestar-analizar-estandar.browser.test.cjs` 3/3. Recorre Presupuestar sin plan y con un plan creado y
guardado sin tareas, y Analizar en 1440×900 y 390×844, sin desplazamiento horizontal ni chino visible.

**Pendiente de este apartado (siguiente corte):**
- Imágenes del proyecto en las fichas donde ayuden a reconocer una vista o estancia.
- Estados parcial y completado con datos sintéticos de presupuesto y plan.
- Inventario completo de entradas antes/después y comparativa visual con Entregar en móvil.

Capturas: `1-presupuestar-plan-vacio.png`, `2-analizar-1440.png`, `2-analizar-390.png`.

## Regresión (21 archivos: perla*, professional-workspace, no-chinese, m2-s4, qa-m2*, ux07*, obr02/03, bpdp, m13, welcome)
- Primera tanda: 147/149. Los 2 fallos (`Point9 human review 2` 1440×900 y 1280×800, «desktop useful width 1328») los causaba
  **este corte**: Analizar heredaba el margen de Presupuestar y la cuadrícula pasaba de ~1100 a 1328 px.
- Corregido: Analizar conserva su anchura útil (1100 px) con las tarjetas de Entregar. Tras la corrección: Point9 4/4 y la
  prueba del corte 3/3. Pendiente de revisión humana.


## Ampliación de la cola acordada con el propietario · 26/11/2026

- **StoryLayersV1.** Aprobado por el propietario como primera plantilla comercial completa. La aprobación cubre el recorrido P10, la propuesta personalizable y la asistencia demostrada. [Handoff de aprobación](https://github.com/Juanmaes83/floorplan-3d/blob/cd694e88/docs/qa/storylayers-v1/README.md).
- **Resto de Entregar (§§8.1–8.2).** Pendiente extender el patrón de StoryLayers a las demás plantillas. Ofrecer asistencia contextual para preparar, redactar y revisar. Reutilizar datos y medios de la revisión correcta, identidad de Mi estudio y datos opcionales del cliente, con control de qué aparece en la entrega.
- **Render AI / Reforma desde fotografía (FOT-01).** En inmobiliaria, «Muestra cómo se vería el salón despejado» para que el comprador aprecie el espacio. En interiorismo y reformas, «Enseña una alternativa sobre la foto real» para que el cliente pueda valorar la propuesta antes de decidir. Mostrar ejemplos propios de antes y después, identificar la alternativa como ilustrativa e indicar el estado de simulación cuando corresponda. Enlazar cada caso con el flujo existente de RUBIK.
- **Blueprint / rodaje Blender.** Adaptar la secuencia plano → volumen → interior con el ZIP de Entregar de RUBIK. Tomar de Apartment el orden, de Courtyard el montaje por sistemas y de Villa la transición interior. Ensayar una vivienda en un clip corto a 720p y pasar a 1440p tras revisar el montaje. Esta mejora va después del rodaje en curso. [Repositorio y ejemplos](https://github.com/Juanmaes83/blueprint-A-pen-sketch-a-floor-plan-or-3-references-/tree/2d3463e42de902bef64157fdfb0dc1d09790b740).

Estos puntos amplían la cola general. El segundo corte de §5.3 conserva su alcance actual. [Encargo completo, §§8, 10 y 11](https://github.com/Juanmaes83/floorplan-3d/blob/a9d6221de0885711a669b1d4680995d00dd1641a/docs/integration/ENCARGO-REUTILIZACION-CINCO-REPOS-BLENDER-STORYLAYERS.md).
