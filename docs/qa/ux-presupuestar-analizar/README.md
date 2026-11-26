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

## Segundo corte · correcciones de la revisión humana de la Preview (26/11/2026, instrucción del propietario en el chat)
1. **Plan con 0 tareas:** tras guardar y pulsar **Cerrar** (arriba a la derecha), sin salir de Presupuestar, la ficha ya dice
   «Borrador · 0 tareas» y el resumen sigue en «Falta». **«Añadir primera tarea»** abre el plan con el formulario «Nueva
   tarea» y el foco en su título. La prueba ya NO vuelve a entrar en Presupuestar antes de comprobar la ficha.
2. **Comprobar el plano:** resultados separados en **Puertas · Alturas libres · Retranqueo** (y «Otras comprobaciones»).
   La puerta se nombra por las estancias a ambos lados («Puerta de Salón»), nunca por su id; «890 mm en el plano ·
   referencia orientativa interna 900 mm · faltan 10 mm», con el origen («pauta interna de RUBIK…, no es una validación
   normativa»). **«Ver en el plano»** cierra el análisis, abre Diseñar en 2D, selecciona la puerta y la centra.
3. **Alturas:** «Falta la altura libre en N espacios» (N calculado del proyecto: 13 en el ejemplo), desplegable con
   «Ver estancia». **Límite declarado:** RUBIK no tiene hoy un campo para escribir la altura libre (llega con las
   referencias de techo importadas, contrato R02-A); se dice así. Crear ese control es una decisión pendiente del
   propietario. **Retranqueo:** se explica qué distancia se compara; sin parcela o colocación aparece primero
   **«Configurar emplazamiento»**; con ellos y sin valor, se pide el retranqueo.
4. **Exterior:** «Fachadas detectadas automáticamente: N muros (no cuenta como revisión)» y «Queda por revisar…». Estado
   «Revisión pendiente» → semáforo «Empezado, sin terminar». **«Marcar revisión completada»** → «Hecho» y el resumen suma
   1 (y se puede desmarcar). La marca se guarda en este navegador por proyecto y caduca si cambian las fachadas detectadas.
   Contrato U10 actualizado por esta decisión: Exterior detectado = `pend`, barra de Analizar 0 % en el ejemplo.
Pruebas locales: `presupuestar-analizar-corte2` 2/2 (escritorio y móvil), `presupuestar-analizar-estandar` 3/3,
`perla-semaforo` 2/2, `professional-workspace` (Point9) 17/17.
