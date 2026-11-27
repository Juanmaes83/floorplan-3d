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

Esta actualización recoge el estado comprobado y la meta audiovisual de Blueprint. El segundo corte de §5.3 conserva su alcance actual. [Encargo general actualizado](https://github.com/Juanmaes83/floorplan-3d/blob/83d9641a89ef8b407793a9030f3f5f5be784dbaa/docs/integration/ENCARGO-REUTILIZACION-CINCO-REPOS-BLENDER-STORYLAYERS.md).

## Estado y próximos cierres · 26/11/2026

### Aprobado por el propietario
- **Muros (§7.1):** control Recto/Curvo, asa, Enderezar y cota corregida. [Aprobación](https://github.com/Juanmaes83/floorplan-3d/blob/94f5b981/docs/qa/geometria-composicion/README.md).
- **StoryLayersV1 (§§7.2, 7.3 y 8.3):** primera plantilla comercial completa. Aprobados P10, la propuesta y la asistencia demostrada. Su extensión al resto de Entregar sigue siendo otra tarea. [Aprobación](https://github.com/Juanmaes83/floorplan-3d/blob/cd694e88/docs/qa/storylayers-v1/README.md).
- **Tapicería v3 (§7.4):** sofá aprobado. La escena distinta f4 y el handoff de Windows están publicados. [Evidencia](https://github.com/Juanmaes83/floorplan-3d/tree/bb78fca0/docs/qa/rodaje).
- **Visita 3D (§5.1):** Preview aprobada. Queda por registrar el resultado de la regresión completa del corte corregido. [Handoff](https://github.com/Juanmaes83/floorplan-3d/blob/1505fbc1/docs/qa/ux-visita-3d/README.md).

### Falta por cerrar
- **BC3 (§5.2):** correcciones de revisión humana publicadas en `cb51c9a1`, pruebas locales 2/2 nuevas y 2/2 anteriores según el handoff. Vercel reporta despliegue correcto para ese SHA. Falta facilitar la Preview de ese corte y cerrar la revisión humana de la navegación, las unidades, el desglose y el guardado. [Handoff](https://github.com/Juanmaes83/floorplan-3d/blob/cb51c9a1/docs/qa/ux-bc3/README.md).
- **Presupuestar y Analizar (§5.3):** primer corte publicado en `49e1cf37`. Terminar segundo corte con imágenes útiles, estados e inventario de entradas. Resolver la actualización del plan vacío al cerrar, el recorrido guiado de «Comprobar el plano» y el estado de Exterior. Publicar contraste de Point9 con la base, regresión del corte y Preview para revisión humana.
- **Rodaje:** terminar, verificar y entregar el MP4 de 2 s a 1440p con enlace directo. Completar la carta de diez materiales después. La aprobación del sofá ya está dada.

### Falta por analizar e implementar
- **§9 Cabecera y proyectos.** Retomar el corte en cola y comprobar el destino de cada acción, el nombre del proyecto y la vuelta contextual.
- **§§8.1–8.2 Resto de Entregar.** Inventariar plantillas y ordenar la extensión de asistencia contextual, identidad de Mi estudio y reutilización de datos y medios del proyecto y del cliente.
- **§10 Render AI / FOT-01.** Mejorar la presentación y la entrada al flujo existente con ejemplos de antes y después. Inmobiliaria: «Muestra cómo se vería el salón despejado». Interiorismo y reformas: «Enseña una alternativa sobre la foto real». Rotular la simulación cuando corresponda.
- **§6 Gesture Labs y §11 Blueprint audiovisual.** Evaluar cada alcance con su propia prueba. Blueprint usa el kit de rodaje y los datos de RUBIK. Empezar después del rodaje en curso.
- **Examen grabado de cinco proyectos.** Hito final sobre la candidata común.

Registrar por separado la revisión humana, las pruebas locales, CI, commit publicado y Preview. La aprobación visual documenta el alcance revisado. Las decisiones de integración se toman por separado.

## 11. Blueprint · Del plano real de RUBIK a una película de la vivienda

**Meta de producto.** Desde **Entregar → Escena para Blender**, el profesional puede preparar un vídeo corto que muestre a su cliente cómo se convierte **el plano guardado de su proyecto** en la vivienda propuesta. El vídeo empieza con ese plano, hace aparecer los elementos modelados en su posición y termina en una vista interior reconocible. La secuencia sirve para explicar la distribución y los acabados que el profesional ha definido. La aparición de piezas es una animación de presentación. Si existe un plan de obra, su calendario y sus fases solo se muestran a partir de datos guardados y vinculados expresamente.

### Qué reutilizar del repositorio Blueprint

Fijar [Blueprint en `2d3463e4`](https://github.com/Juanmaes83/blueprint-A-pen-sketch-a-floor-plan-or-3-references-/tree/2d3463e42de902bef64157fdfb0dc1d09790b740) y registrar en el handoff cada pieza adaptada, su ruta, licencia y prueba en RUBIK.

- **Apartment, `houses/apartment/film.py`.** Estudiar el encuadre inicial sobre el plano, las curvas de cámara hacia el volumen y el paso de la vista de conjunto al interior.
- **Courtyard, `houses/courtyard/film.py` y `timeline.json`.** Adaptar la cronología por sistemas y los eventos de aparición. Si se usa contador, calcularlo con los grupos y elementos reales que se muestran. Los eventos pueden servir después para sincronizar sonido opcional.
- **Villa, `houses/villa/film.py`.** Estudiar la transición exterior–interior y el cambio de escala narrativa. Diseñar la trayectoria para los huecos y espacios del proyecto de RUBIK.
- **Límite de reutilización.** Usar `build.py` para comprender cómo se preparan los grupos del donante. Los generadores de viviendas de Blueprint, sus planos y sus modelos de demostración quedan fuera. El código tiene licencia MIT. Comprobar por separado cualquier textura, música o recurso antes de usarlo.

### Fuente de verdad y aplicación al kit RUBIK

1. Exportar el ZIP desde la interfaz normal. Importar con el kit existente y leer su `manifest.json`, el marco de coordenadas y los `rubik_id` de la escena. Usar la planta y la geometría exportadas del mismo proyecto y revisión. Mantener escala, orientación, plantas, dimensiones, huecos, posiciones y Material Tokens.
2. Formar los grupos de aparición con los objetos que existen en el ZIP: por ejemplo, suelos, muros, huecos o carpinterías y mobiliario. Adaptar el orden a lo que realmente esté modelado. Las plantas, cubiertas o estructuras ausentes se omiten y se registran. Un material aproximado conserva su estado y procedencia. Cualquier plano de apoyo debe salir de los datos de RUBIK y quedar alineado con la escena.
3. Añadir cámara, temporización, iluminación editorial y, si aporta valor, rótulos y sonido en el derivado de rodaje. Trabajar sobre `scripts/interop/blender-scene-import.py` y `scripts/interop/blender-rodaje.py`, con la separación existente `RUBIK_derived`. Los datos visibles se toman del proyecto o de un cómputo reproducible. Si falta un dato se omite o se indica como ausente. La escena importada y el proyecto guardado conservan su geometría y estado.

### Cómo acreditar el resultado con el report

- **Antes de rodar:** leer el manifiesto y el `rodaje-report.json` de referencia para identificar procedencia, materiales declarados y aproximados, objetos genéricos y limitaciones. Elegir qué se puede mostrar fielmente. Si un dato no está en el report, verificarlo en el ZIP o en la escena y registrar la fuente.
- **Con el vídeo:** guardar un anexo al `rodaje-report.json` con proyecto y revisión, SHA del kit y huella del ZIP, archivo de plano o fuente de la planta, grupos y `rubik_id`, fase y rango de fotogramas, cámara, rótulos y fuente, omisiones y aproximaciones. Comprobar la huella de geometría y las posiciones finales contra la escena de entrada. Vincular cada escena o rótulo a la evidencia correspondiente. Registrar resolución, duración, fotogramas y tiempo de render.
- **Primer corte revisable:** una vivienda de RUBIK, entrada desde Entregar, storyboard con fotogramas de plano, aparición y vista interior, y clip corto a 720p. Revisar alineación, legibilidad, continuidad de cámara, ausencia de colisiones visibles y fidelidad del estado final. Entregar clip, report y comandos para reproducirlo. Tras validar el montaje, preparar la versión a 1440p, verificar con FFprobe y decodificación completa con FFmpeg y entregar enlace directo. Si el kit actual carece de una entrada o referencia necesaria, documentar el hueco y proponer el menor cambio comprobable en el mismo kit.

Este corte se planifica después del rodaje actual. Su relación con los gestos está en el [encargo de Gesture Labs](https://github.com/Juanmaes83/floorplan-3d/blob/83d9641a89ef8b407793a9030f3f5f5be784dbaa/docs/integration/ENCARGO-SCULPT-GESTURE-LABS-FLOOR-PLAN-RUBIK.md).
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


## Aprobación humana · 27/11/2026

El propietario revisó y aprobó la Preview de §5.3 con las correcciones publicadas del segundo corte. Siguen pendientes las imágenes de fichas, los estados e inventario del segundo corte, su regresión completa y el contraste de Point9 contra la base. La edición manual de altura libre sigue como decisión separada.

[Preview revisada](https://floorplan-3d-54812ljcx-juanma-espinosas-projects.vercel.app/) · SHA de la aplicación: `7a5db569b39bbc339f4dbefaf090fdca65934435`. Esta aprobación corresponde a la revisión humana del corte y no equivale a CI, fusión ni activación.

## Regresión completa del corte 2 (`852e0f44`; vídeo en `a901452e`)
Local, Chromium (Playwright), 23 archivos (perla*, professional-workspace/Point9, no-chinese, m2-s4, qa-m2*, ux07*, obr02/03,
bpdp, m13, welcome y las tres pruebas de §5.3): **153 / 153 superadas · 0 fallos · 0 omitidas** (27/11/2026).
CI de GitHub: no se ejecuta en ramas `claude/…`. Vercel: Preview de `852e0f44` en verde.
Vídeo del recorrido (plan vacío → borrador → revisado sin recargar; imágenes de Cantidades y Exterior): `corte2/video/`.
Altura libre: «Ver estancia» se mantiene; la edición manual es otro corte. Pendiente: revisión humana del corte 2.
