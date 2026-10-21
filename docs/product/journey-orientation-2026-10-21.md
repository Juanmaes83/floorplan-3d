# Orientación del recorrido: qué hacer ahora y qué hacer después (21-10-2026)

> **Estado:** diseño propuesto y primer corte en revisión. Resultados de la auditoría y matriz completa por recorrido y tamaño: [QA](../qa/journey-orientation-2026-10-21.md).

## 0. Punto de partida verificado

| | |
| --- | --- |
| Base | `master` `e796e3d` (21-10-2026, 11:08) |
| Integradas en esa base | #65 (presentación de dos plantas), #66 (paleta «Construir / Amueblar»), #67 («Perla»), #68 (entorno 3D) y #69 («Tu marca profesional») |
| Cambios de Juanma en #69 antes del merge | `1895dcd` (reconciliación con #65) y `9dea5d0` (guardar el texto de entrega antes de presentar) |
| PR abiertas que **no** forman parte de este trabajo | #36, #48, #61 y #64, todas de documentación |
| Rama | `feat/journey-orientation`, con su propio worktree |
| Hallazgo de partida | [Comentario de Juanma en #66](https://github.com/Juanmaes83/floorplan-3d/pull/66#issuecomment-6311137636) |

Las capturas del hallazgo son de la vista previa de #66, anterior a «Perla». Las pantallas de este documento son de `master`, con «Perla» ya integrada.

**Validaciones de este documento:**

- **Emulación:** Chromium 141 con SwiftShader (sin GPU), con teléfono emulado a 390×844 y 844×390.
- **Sin dispositivo físico:** no hay pruebas en un iPhone o Android real.
- **Sin sesión humana:** no hay sesión con el público D-01; el protocolo está en el §8.

## 1. La pregunta de cada pantalla

Para cada estado: «¿qué debe entender y hacer aquí el usuario?». La auditoría ([QA §2](../qa/journey-orientation-2026-10-21.md)) recorrió 16 caminos (A–P) en tres tamaños, de la entrada al resultado, con gestos reales.

De ella salen siete problemas de orientación **reproducidos**. Dependen del estado del proyecto, no del tamaño de pantalla.

| # | Problema reproducido | Dónde se ve | Por qué desorienta |
| --- | --- | --- | --- |
| O1 | La guía declara «✓ Objetivo completado» y propone «Ver resultado y exportar» con el proyecto a medias | Tras **una** estancia en «Crear desde cero» (B, E, F, G, H, N, O). En el ejemplo, tras abrir el 3D (C, K) | El profesional prepara una vivienda completa. Le decimos que ha terminado y le empujamos a exportar |
| O2 | La siguiente acción no corresponde al estado real | Tras presentar y descargar el lote, la guía sigue ofreciendo «Abrir 3D» (L, P). Con 2 conflictos que bloquean la presentación, también ofrece «Abrir 3D» (G, I, P) | La guía ignora lo que la persona acaba de hacer y lo que la bloquea |
| O3 | El botón de la guía no ejecuta la tarea | Tras subir una imagen: «Resolver requisito» abre la lista «Tu recorrido», donde está otra vez «Empezar a ajustar» (D). En «Prepara tu proyecto», el botón es «Volver al inicio» (N) | Un clic más y una salida del trabajo |
| O4 | La posición manual de la guía persiste y se reanuda | «← Paso anterior» hasta «Prepara tu proyecto» sobrevive a la recarga (F5), a una nueva visita y a «Continuar mi proyecto». Muestra **75 %** junto a «Empezar». El 75 % es correcto (3 de 4 tareas); la tarea mostrada no (N y `progress-75.cjs`) | Al volver, la persona ve un paso pasado, sin marcar como hecho y con un botón que la saca del proyecto |
| O5 | «← Paso anterior» desde la primera tarea cierra el editor y abre la bienvenida (N) | — | Atrás dentro de la guía se convierte en «salir» |
| O6 | La paleta abre «Amueblar» en el ejemplo aunque la persona quiera construir. La pestaña inicial sale de «hay estancias», no de la intención (C) | — | Juanma lo encontró sin ayuda: «Construir» queda como secundaria |
| O7 | En modo guiado faltan controles que la propia guía necesita (E, I, K, M) | «Rehacer», el cambio de planta de un dúplex, «Recorrer» en 3D, el menú «Archivo» y la entrada «Presentar mi vivienda» de la cabecera. Esta última es, en «Perla», la acción dominante cuando hay algo que presentar | Hay que salir de la guía («Ver todas las herramientas») para seguirla |

Más problemas reproducidos, en teléfono **emulado**:

| # | Problema | Evidencia |
| --- | --- | --- |
| M1 | A 390×844 la barra de selección se sale por la derecha: «Eliminar» queda fuera de la pantalla aunque no haya aviso | G, K y C a 390×844: `inViewport:false` y `elementFromPoint` fuera; captura `G/03-duplicated` |
| M2 | Al añadir un mueble, el aviso «Añadido…» tapa la barra de selección unos segundos | G y C a 390×844 |
| M3 | Con un modo de colocación activo («Añadir puerta abatible…»), abrir «Crear y amueblar» deja el aviso del modo encima de la paleta. Tapa sus pestañas y el modo sigue activo detrás | O a 390×844 y 844×390; captura `O/02-drawer-closed`. En escritorio el aviso queda sobre el plano y no tapa la paleta |
| M4 | La guía ocupa unos 220 px de los 844 de alto, además de la cabecera | Todas las capturas a 390×844 |

**Observaciones de captura**, no tratadas como defecto reproducido:

- «manual-plan» en la cabecera. Es el nombre del archivo subido sin extensión, no un identificador interno. Con un archivo real se leería, por ejemplo, «plano-vivienda».
- Al presentar con «todas las herramientas» abiertas, la paleta y el panel siguen visibles y atenuados a los lados. Es una decisión de #65.
- Quedan restos crema en el cromo: tarjetas de medidas, caja de escala, tarjeta de presentación y «Ocultar plano». Se tratan en el corte B.

## 2. Principios

1. **La siguiente acción sale del estado real.** Del proyecto, del edificio, de la escala, de lo revisado y de lo entregado; no de una lista de tutorial ni de una posición manual guardada.
2. **Una acción principal por estado, y sólo si es inequívoca.** Si el trabajo está hecho no se destaca ningún botón. Si el plano vacío ya muestra «Crear primera estancia», la guía no lo duplica.
3. **El botón hace la tarea donde ocurre.**
   - Abre la herramienta y la pestaña correctas.
   - Lleva el foco al control.
   - El primer gesto se explica con el aviso que ya existe junto al plano.
4. **Lo ganado se conserva.**
   - El progreso, las tareas completadas y los objetivos siguen igual.
   - «Objetivo completado» pasa a ser un estado de la lista, no la acción siguiente.
5. **Nada se ejecuta solo.** Una sugerencia nunca cambia geometría ni datos; sólo abre la herramienta.
6. **Salir y volver es siempre posible.**
   - Cancelar, deshacer y rehacer están visibles.
   - Cerrar la guía no deja modos ocultos.
   - Volver al proyecto reanuda en el paso pertinente.
7. **Sin promesas falsas.**
   - Con conflictos, la acción es resolverlos y se dice que la presentación está bloqueada.
   - Sin escala confirmada, la acción es calibrar.

## 3. Alternativas comparadas

La comparación se apoya en las capturas reales de la auditoría ([QA](../qa/journey-orientation-2026-10-21.md)). El script `scripts/qa/journey/prototypes.cjs` dibuja las tres alternativas sobre la aplicación en los mismos cuatro estados (vacío tras la primera estancia, ejemplo, imagen sin escala y dúplex con conflictos), a 1440×900 y 390×844. **Sus capturas no se han generado en esta entrega**; quedan para la revisión visual.

| Criterio | A. Guía compacta con «siguiente acción» | B. Tarjeta flotante en el plano | C. «Ahora» dentro de la paleta |
| --- | --- | --- | --- |
| Qué es | La fila de la guía bajo la cabecera muestra la siguiente acción calculada y un botón que la ejecuta. Etapas y progreso pasan a «Ver más» | Una tarjeta sobre el plano, abajo a la izquierda en escritorio y sobre la barra inferior en el teléfono | Una sección «Ahora» encima de las herramientas de la paleta |
| Cercanía a la acción | Media: la fila está sobre el plano y el botón abre la herramienta y señala el control | Alta: está sobre el plano | Muy alta en escritorio (junto a las herramientas). En el teléfono, nula mientras la paleta está cerrada |
| Plano ocupado | El prototipo compacto bajaría de 184 a unos 104 px en escritorio y de ~220 a unos 116 px en el teléfono. **El corte A no cambia la altura**: conserva los controles que usan las pruebas existentes. M4 queda pendiente (§4.4) | Una tarjeta más sobre el plano. En el teléfono compite con la barra inferior, la de selección y los avisos (M1, M2) | Ninguno en escritorio si la paleta ya está abierta. En el teléfono obliga a abrir un cajón que tapa el plano |
| Redundancia | Sustituye la tarea actual de la guía; no añade vía | Si la guía sigue, son dos vías con el mismo mensaje | Obliga a mantener la guía para el teléfono |
| Accesibilidad | Una región con anuncio en vivo y orden de foco simple | Una capa flotante más que gestionar con el foco | Bien en escritorio; peor en el teléfono |
| Coste de integración | Bajo: cambia el contenido de la fila actual | Medio: nueva capa, conflictos de posición con la barra de selección | Medio-alto: la paleta y la guía se acoplan |

**Elegida: A**, con dos piezas de B y C que no añaden vías:

- el botón abre la pestaña de la paleta y lleva el foco al control concreto (de C);
- el primer gesto se explica con los avisos ya existentes sobre el plano (de B).

B se descarta porque añade otra capa al teléfono, donde ya compiten tres (M1–M3). C se descarta porque en el teléfono la paleta es un cajón cerrado.

## 4. Diseño elegido

### 4.1 La siguiente acción (`js/journey-core.js`, puro y probado en Node)

Por orden de prioridad, la primera regla que se cumple decide:

| # | Estado | Título | Botón principal | Secundaria | Qué hace el botón |
| --- | --- | --- | --- | --- | --- |
| 1 | Ejemplo, sin revisar en 3D | Estás viendo un ejemplo | Ver en 3D | Crear mi vivienda desde el ejemplo | Abre 3D / crea la copia propia (sin tocar el ejemplo) |
| 2 | Ejemplo ya revisado en 3D | Estás viendo un ejemplo | Crear mi vivienda desde el ejemplo | — | Crea la copia propia |
| 3 | Imagen sin calibrar | Ajusta la escala del plano | Empezar a calibrar | — | Entra en «Calibrar» (aviso sobre el plano) |
| 4 | Calibrada, sin segunda cota | Comprueba la escala con otra medida | Medir segunda cota | — | Entra en «Segunda cota» |
| 5 | Segunda cota que no concuerda | La segunda medida no coincide | Repetir segunda cota | Volver a calibrar | Entra en el modo elegido |
| 6 | Segunda cota coherente, sin confirmar | Las dos medidas coinciden | Confirmar escala | — | Confirma (acción explícita de la persona) |
| 7 | Sin estancias | Crea la primera estancia | — (el plano ya muestra «Crear primera estancia») | — | — |
| 8 | Conflictos del edificio | Resuelve los conflictos del edificio | Ver conflictos | — | Abre la lista de conflictos |
| 9 | Estancias sin puertas ni ventanas | Añade puertas y ventanas | Añadir puertas y ventanas | Otra estancia | Abre «Construir» y lleva el foco a «Puertas y ventanas» |
| 10 | Sin muebles | Amuebla las estancias | Amueblar | Otra puerta o ventana | Abre «Amueblar» y lleva el foco a la búsqueda |
| 11 | Sin revisar en 3D esta versión | Revisa la vivienda en 3D | Ver en 3D | Seguir amueblando | Abre 3D |
| 12 | Revisada, sin presentar esta versión | Presenta la vivienda | Presentar mi vivienda | — | Abre la configuración de la presentación |
| 13 | Presentada esta versión | Entrega preparada | — | Exportar copia del proyecto | — |

**Reglas de verdad:**

- **Revisión en 3D:** cuenta tanto abrir 3D como iniciar la presentación, que es una vista 3D del mismo plano (corrige O2). Si el plano cambia después, se pide revisar de nuevo esa versión.
- **«Ahora no»:** en las reglas 9 a 11, «Ahora no» salta la sugerencia para ese proyecto. Se guarda en la guía, en el navegador, nunca en el proyecto. Se recupera desde «Tareas y ayuda».
- **Conflictos:** su prioridad es mayor que amueblar o presentar, porque bloquean la presentación (corrige O2).
- **En 3D:** si la regla es «Revisar en 3D» y la escena ya está abierta, no se ofrece «Ver en 3D». Se registra la revisión y se pasa a la regla siguiente (corrige O2).

### 4.2 La guía compacta

- **Fila de la guía:** la tarea actual y su botón se sustituyen por la siguiente acción: título, una frase, botón principal y, si procede, la secundaria como enlace.
- **«Objetivo completado»:** queda en «Tareas y ayuda», con sus botones de exportar. Ya no desplaza a la siguiente acción (corrige O1). El progreso legítimo no cambia.
- **Compacta:** sigue siendo la opción por defecto en el teléfono y en pantallas bajas. En el escritorio se mantiene expandida, con etapas y progreso: hay sitio y es una decisión probada en `welcome-generar`.
- **«Cambiar objetivo»:** también está en «Tareas y ayuda». En el teléfono se mantienen los botones de la fila, porque `guide-navigation` los usa en los tres tamaños.
- **Objetivos elegidos:** se conservan. Mientras el objetivo tiene tareas pendientes, la fila muestra la tarea del objetivo, igual que hoy («Exportar una imagen» genera el PNG). Si un requisito la bloquea, muestra ese requisito y su botón lo ejecuta (corrige O3). La siguiente acción profesional aparece al cumplir el objetivo, en lugar del callejón «Objetivo completado».
- **Recarga y nueva visita:** la posición manual de la guía se conserva, como exige `guide-navigation`. Si esa tarea ya está hecha, la fila lo dice («Ya hecho: …») y su botón es «Seguir con: (lo pendiente)», nunca «Volver al inicio» (corrige O4).
- **«← Paso anterior» en la primera tarea:** no sale del editor (corrige O5). Queda desactivado, con su motivo en el título.

### 4.3 Paleta y controles en modo guiado

- **Pestaña inicial sin preferencia guardada:** «Construir», tenga o no estancias el proyecto (corrige O6). La siguiente acción elige la pestaña al abrirla. La última pestaña elegida se sigue recordando.
- **Controles que vuelven al modo guiado** (corrige O7):
  - «Rehacer», junto a «Deshacer»;
  - el selector de planta, si el edificio tiene dos;
  - «Vista aérea / Recorrer», en 3D;
  - «Presentar mi vivienda», como **secundaria**: sólo va rellena cuando es la siguiente acción, así que nunca hay dos acciones dominantes.

  El menú «Archivo» sigue en «Ver todas las herramientas». Exportar una copia está también en «Tareas y ayuda».

### 4.4 Teléfono

- **M1, pendiente:** la barra de selección sigue siendo más ancha que 390 px y deja «Eliminar» o «Propiedades» fuera de la pantalla. Se probaron dos arreglos: bajar los botones a dos filas, que empujaba el aviso de conflictos sobre cotas y controles (`stair-conflicts`, `opening-contextual`), y compactarlos, que no basta con siete botones. Necesita su propio diseño, por ejemplo agrupar acciones en «Más».
- **M2:** con la barra de selección visible, el aviso temporal se coloca por encima de ella.
- **M3:** abrir la paleta con un hueco a medio colocar cancela ese modo y lo anuncia. No se habrá añadido nada, y elegir otro tipo vuelve a empezarlo. Abrir «Propiedades» no lo cancela, porque la propia barra de selección lo ofrece durante la colocación.
- **M4, pendiente:** la altura de la guía en el teléfono (~220 px) no cambia en este corte. La reducción del prototipo A necesita mover «← Paso anterior» y «Cambiar objetivo», y su reorganización se decidirá con la revisión visual de Juanma.

### 4.5 Texto exacto (es / en / zh)

| Clave | Español | English | 中文 |
| --- | --- | --- | --- |
| example.title | Estás viendo un ejemplo | You are viewing an example | 正在查看示例 |
| example.text | Recórrelo en 3D o crea tu propia vivienda a partir de él. Tus cambios en la copia son tuyos; el ejemplo no cambia. | Walk through it in 3D or create your own home from it. Your copy is yours; the example stays as it is. | 在 3D 中浏览，或以它为基础创建自己的住宅。副本归你所有；示例保持不变。 |
| example.copy | Crear mi vivienda desde el ejemplo | Create my home from the example | 以示例创建我的住宅 |
| view3d | Ver en 3D | View in 3D | 在 3D 中查看 |
| scale.title | Ajusta la escala del plano | Set the plan's scale | 设置平面图比例 |
| scale.text | Marca dos puntos de una medida que conozcas y escribe su distancia en milímetros. | Mark two points of a known measurement and enter its distance in millimetres. | 标记已知尺寸的两个点并输入毫米距离。 |
| scale.cta | Empezar a calibrar | Start calibrating | 开始校准 |
| verify.title | Comprueba la escala con otra medida | Check the scale with another measurement | 用另一个尺寸检查比例 |
| verify.text | Mide una segunda cota distinta: si coincide, la escala es fiable. | Measure a second, different dimension: if it agrees, the scale is reliable. | 测量另一个不同尺寸：若一致，比例可靠。 |
| verify.cta | Medir segunda cota | Measure second dimension | 测量第二尺寸 |
| mismatch.title | La segunda medida no coincide | The second measurement does not agree | 第二个尺寸不一致 |
| mismatch.text | Difieren más del 2 %. Repite la segunda medida o vuelve a calibrar. | They differ by more than 2%. Repeat the second measurement or calibrate again. | 相差超过 2%。请重新测量第二尺寸或重新校准。 |
| mismatch.cta | Repetir segunda cota | Repeat second dimension | 重新测量第二尺寸 |
| mismatch.alt | Volver a calibrar | Calibrate again | 重新校准 |
| confirm.title | Las dos medidas coinciden | Both measurements agree | 两个尺寸一致 |
| confirm.text | Confirma la escala para empezar a dibujar las estancias. | Confirm the scale to start drawing the rooms. | 确认比例后开始绘制房间。 |
| confirm.cta | Confirmar escala | Confirm scale | 确认比例 |
| empty.title | Crea la primera estancia | Create the first room | 创建第一个房间 |
| empty.text | Empieza en el plano: «Crear primera estancia». | Start on the plan: “Create first room”. | 从平面图开始：“创建第一个房间”。 |
| conflicts.title | Resuelve los conflictos del edificio | Resolve the building conflicts | 解决建筑冲突 |
| conflicts.text | {headline}. Mientras sigan, no se puede presentar la vivienda. | {headline}. While they remain, the home cannot be presented. | {headline}。存在冲突时无法展示住宅。 |
| conflicts.cta | Ver conflictos | See conflicts | 查看冲突 |
| openings.title | Añade puertas y ventanas | Add doors and windows | 添加门窗 |
| openings.text | Elige el tipo, toca la estancia y después el muro donde va. | Choose the type, tap the room and then the wall it goes in. | 选择类型，点击房间，再点击所在墙体。 |
| openings.cta | Añadir puertas y ventanas | Add doors and windows | 添加门窗 |
| openings.alt | Otra estancia | Another room | 再加一个房间 |
| furnish.title | Amuebla las estancias | Furnish the rooms | 布置房间 |
| furnish.text | {n} estancias sin muebles. Busca un mueble y púlsalo para colocarlo en la estancia seleccionada. | {n} rooms without furniture. Find an item and press it to place it in the selected room. | {n} 个房间没有家具。搜索家具并点击，放入所选房间。 |
| furnish.cta | Amueblar | Furnish | 布置家具 |
| furnish.alt | Otra puerta o ventana | Another door or window | 再加门窗 |
| review.title | Revisa la vivienda en 3D | Review the home in 3D | 在 3D 中检查住宅 |
| review.text | Comprueba huecos y muebles antes de presentarla. | Check openings and furniture before presenting it. | 展示前检查门窗和家具。 |
| review.alt | Seguir amueblando | Keep furnishing | 继续布置 |
| present.title | Presenta la vivienda | Present the home | 展示住宅 |
| present.text | Prepara el recorrido para tu cliente; puedes firmarlo con tu marca y descargar las vistas. | Prepare the tour for your client; you can sign it with your brand and download the views. | 为客户准备导览；可署上你的品牌并下载视图。 |
| present.cta | Presentar mi vivienda | Present my home | 展示我的住宅 |
| done.title | Entrega preparada | Delivery ready | 交付已准备 |
| done.text | Presentaste esta versión. Si cambias el plano, revísala y preséntala de nuevo. | You presented this version. If you change the plan, review and present it again. | 已展示此版本。如修改平面图，请重新检查并展示。 |
| done.alt | Exportar copia del proyecto | Export a project copy | 导出项目副本 |
| later | Ahora no | Not now | 暂不 |
| drawerCancel | Se canceló «{modo}»: no se añadió nada. | “{mode}” was cancelled: nothing was added. | 已取消“{mode}”：未添加任何内容。 |

## 5. Persona experta y persona que vuelve

- **Experta:**
  - «×» cierra la guía como hoy y «Recuperar guía» la devuelve;
  - «Ver todas las herramientas» sigue dando el editor completo;
  - ninguna sugerencia bloquea el uso libre ni abre diálogos sola.
- **Vuelve otro día:** «Continuar mi proyecto» abre el proyecto, y la guía muestra la siguiente acción calculada de su estado, no la última posición manual.

## 6. Cortes

| Corte | Rama | Contenido | Depende de |
| --- | --- | --- | --- |
| A. Orientación del recorrido | `feat/journey-orientation` | §4.1–4.4, con pruebas que fallan en `master` | `master` |
| B. Restos cromáticos de «Perla» | `feat/perla-residue` (siguiente) | Inventario reproducible del cromo y corrección de los restos crema/naranja | `master`. Independiente de A; si ambos tocan la guía, B va encima de A |

**Fuera de estos cortes:**

- renombrar los proyectos importados;
- el diseño de la presentación con los paneles abiertos (#65);
- portada o cierre del lote;
- nuevas capacidades de construcción, catálogo o presupuesto;
- el estudio LoRA LAB (#48).

## 7. Riesgos

- **Sugerencias equivocadas:** la siguiente acción depende de reglas; un estado no previsto daría una sugerencia poco útil. Mitigación: el orden de reglas está probado con estados reales y hay «Ahora no».
- **Controles de vuelta al modo guiado:** pueden aumentar la cabecera del teléfono. Mitigación: «Rehacer» comparte grupo con «Deshacer»; la planta sólo aparece con dos plantas; los modos 3D, sólo en 3D.

## 8. Prueba de descubrimiento con el público D-01 (preparada; resultado **pendiente**)

**Participante:** inmobiliaria, promotora o estudio de arquitectura; en segundo término, reformas o interiorismo. No ha usado Rubik ni recibe instrucciones de dónde pulsar.

**Material:**

- la vista previa del SHA final;
- un plano propio en imagen o PDF del participante, o el dúplex de prueba.

**Tareas, leídas en voz alta una a una:**

1. «Empieza un proyecto para una vivienda.»
2. «Crea el salón de 4 × 5 m.»
3. «Coloca un sofá en el salón.»
4. «El sistema te avisa de un problema: corrígelo.» (dúplex con conflictos).
5. «Prepara lo que enviarías a tu cliente.»

**Hoja de observación, por tarea:**

- tiempo hasta el primer clic útil;
- tiempo total;
- clics en controles equivocados;
- dudas en voz alta, literales;
- peticiones de ayuda;
- si encontró la siguiente acción sin buscarla;
- resultado: completa, completa con ayuda o no completa.

Además se registran el dispositivo (modelo, físico o no) y el navegador.

**Criterio:** la tarea cuenta como descubierta si se completa sin ayuda y el primer clic útil llega antes de 30 s.

Mientras no haya participante, el resultado es **pendiente**: las pruebas automáticas no demuestran que la experiencia sea intuitiva.
