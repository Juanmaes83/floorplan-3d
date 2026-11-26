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
