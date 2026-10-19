# LoRA LAB frente a Rubik: evidencia ordenada y un corte recomendado (19-10-2026)

**Estado:** estudio documental de la PR [#48](https://github.com/Juanmaes83/floorplan-3d/pull/48), en borrador.

- **No es una fase aprobada.** No contiene código de producto y no cambia `FloorPlanProjectV1`.
- **La recomendación de la §8 queda pendiente de Juanma.**
- **Sustituye como referencia vigente** a la matriz §2, la recomendación §4 y la recomendación §5.6 del [estudio del 17-10-2026](loralab-study-gate-2026-10-17.md). Esas secciones se conservan como historia.
- **Fuera de este estudio:** el MCP (#57, #64 y `tools/rubik-mcp`). No se usa como fuente ni se modifica.

**Base de Rubik:** `master` `8590349`, incorporado a la rama de #48 por el merge `047f323`. #48 sólo añade documentación, scripts de QA y una prueba de esos scripts, así que el código de producto comparado es el de `8590349`.

## 1. Estado reconstruido (19-10-2026, 20:29 UTC)

Consultado en GitHub y con `git fetch`. Los SHA de documentos anteriores no se dan por válidos.

| PR | Estado | Relevancia para este estudio |
| --- | --- | --- |
| #50–#54 | Fusionadas | Edificio de hasta 2 plantas, escalera recta con hueco, conflicto mueble–escalera (BW5) y recolocación asistida. |
| [#60](https://github.com/Juanmaes83/floorplan-3d/pull/60) | Fusionada el 19-10-2026 a las 19:53 UTC | Seleccionar y editar puertas y ventanas donde están, y añadirlas desde la estancia. |
| [#62](https://github.com/Juanmaes83/floorplan-3d/pull/62) | Fusionada el 19-10-2026 a las 19:54 UTC (merge `7ada526`) | Patrón de paneles con «Volver» arriba, «Generar», castellano sin IDs y paredes descritas con palabras. |
| [#63](https://github.com/Juanmaes83/floorplan-3d/pull/63) | Fusionada (`7cdf866`) | Cierre de roadmap de #60/#62. |
| [#58](https://github.com/Juanmaes83/floorplan-3d/pull/58) | Cerrada sin merge | Fuente secundaria: observación de un vídeo de LoRA LAB de 104 s. Juanma la cierra «por sustitución» y remite a #48. |
| [#59](https://github.com/Juanmaes83/floorplan-3d/pull/59) | Cerrada sin merge | Su alcance se entregó en #60/#62. **No es una función pendiente.** |
| [#57](https://github.com/Juanmaes83/floorplan-3d/pull/57) | Abierta, borrador (MCP) | No se toca. |
| [#64](https://github.com/Juanmaes83/floorplan-3d/pull/64) | Abierta, borrador (documental) | No se toca. Mientras siga abierta, #48 no edita `docs/ROADMAP.md` ni `docs/ROADMAP-2-proposal.md`. |
| #48 | Abierta, borrador | Antes del merge de `master` tenía conflicto en `docs/ROADMAP-2-proposal.md`. |

**Conflicto resuelto en `047f323`:**

- Se conserva la versión de `master` del roadmap.
- El párrafo que #48 añadía allí recomendaba «dos plantas y una escalera recta» como corte futuro, y eso ya está integrado (#50–#54). Se elimina en lugar de reintroducirlo.
- Desde ese merge, el diff de #48 no toca ningún roadmap.

**Público (D-01, [`F0-decisions.md`](../product/F0-decisions.md)), confirmado por Juanma el 17-10-2026:**

- Público prioritario: inmobiliarias, promotoras y estudios de arquitectura.
- Segundo público: reformas e interiorismo.
- Problema: preparar y presentar una vivienda completa a partir de un plano editable, con mobiliario y vistas coherentes, **incluidos proyectos de varias plantas cuando corresponda**.
- La misma decisión deja «por comprobar» la demanda comercial y la necesidad de varias plantas.

## 2. Fuentes de evidencia y sus límites

| Id | Fuente | Quién la revisó y cómo | Límite |
| --- | --- | --- | --- |
| S1 | Grabación de Juanma `PRUEBA PREMIUM…mp4`, 3:24 (SHA-256 `b9ab170d…`) | [Auditoría del 17-10-2026](loralab-video-gap-audit-2026-10-17.md), con tiempos | Fuera del repositorio. Una sola sesión, sobre la plantilla «Villa moderna». |
| S2 | Seis capturas del 17-10-2026 (`image(20261017-18xxxx).png`) | La misma auditoría | Fuera del repositorio. Una captura muestra controles, no su funcionamiento. |
| S3 | Sesión guiada en el PC de Juanma (18-10-2026): Chrome 153.0.8010.53, 1440×900, vídeo `session.webm` de 19:58, capturas A/B/C, `manifest.json` e informe | Capturas y una muestra temporal del vídeo, revisadas en §1.1 del estudio anterior. **No se ha visto el vídeo completo a 1×.** | Fuera del repositorio. El informe de la versión antigua del capturador llama JSON a una descarga PNG (§3). |
| S4 | `download-2-Villa_moderna.json`, 48 182 bytes, SHA-256 `9eec99ab…62a` | Estructura registrada en el commit `2c400bf`, de Juanma | **No está en este entorno ni se ha vuelto a comprobar aquí** (§3). |
| S5 | `villa-original.json`, 896 934 bytes, SHA-256 `f2071c9d…1a1` | Firma PNG registrada por Juanma (comentario en #48, 17-10-2026) | Es una imagen PNG con extensión `.json`. |
| S6 | `download-3-Villa_moderna-3d.png`, 1 118 991 bytes, SHA-256 `2677af4c366f3cd487b74e51cbc3436e8d5dec94fc52df390026277bfb4d2c0d` | Comunicado por Juanma el 19-10-2026 | No revisado aquí: ni su firma ni su contenido. |
| S7 | Vídeo «PRUEBA FUN. LORALAB.TOP .mp4», 104 s, descrito en #58 | **Evidencia secundaria.** No lo he visto. | Tiempos y acciones según #58, sin contrastar. |
| S8 | Prueba directa desde este entorno | Bloqueada. 19-10-2026 20:29 UTC: `curl` a la URL de la herramienta → `CONNECT tunnel failed, response 403`. Antes: 403 los días 17 y 18 y `ERR_TUNNEL_CONNECTION_FAILED` con Playwright. | Un intento por sesión; no se ha buscado otra vía de red. |
| S9 | Carpeta `C:\Users\temp123\loralab-evidence` | No accesible: este entorno es un contenedor Linux sin acceso al PC de Juanma, y la ruta no existe aquí. | Ningún dato de esa carpeta se ha leído en esta sesión. |

**Leyenda de la evidencia sobre LoRA LAB:**

- **Ejecutada:** una fuente muestra la acción y su efecto.
- **Visible:** el control, menú o ayuda aparece, pero no se ve usarlo. *Un botón visible no demuestra que la función funcione.*
- **Inferida:** se deduce de un dato, por ejemplo una clave del JSON, sin ver la función en uso.
- **No comprobada:** no hay evidencia.

## 3. Revisión de la exportación «Villa moderna»

**Descargas de la prueba A (S3):**

| Archivo guardado | Bytes | Tipo por contenido | Explicación |
| --- | --- | --- | --- |
| `villa-original.json` | 896 934 | **PNG** (firma `89 50 4E 47 0D 0A 1A 0A`) | Nombre sugerido por la página: `Villa moderna-3d.png`. El capturador antiguo daba por supuesto que **la primera** descarga era el JSON y la guardó con ese nombre. Es una captura 3D, no un modelo. |
| `download-2-Villa_moderna.json` | 48 182 | JSON válido | Es el único archivo de modelo. |
| `download-3-Villa_moderna-3d.png` | 1 118 991 | PNG según el nombre; firma no comprobada aquí | Segunda captura 3D. |

**Estructura del JSON válido (S4).** Datos registrados por Juanma en `2c400bf`; **no se han vuelto a comprobar contra el archivo en esta sesión**, porque el archivo no está aquí:

- objeto con `v: 2` y `floors` de longitud 3;
- alturas `h` de 3400, 3200 y 3200;
- 23 muros, 17 estancias, 37 huecos, 106 objetos interiores y 35 exteriores;
- dos entradas en `stairs`, una de tipo U en la primera planta y otra de caracol en la segunda;
- `site` con norte, mes, hora, latitud y terreno; `ext` con acabados de fachada y cubierta y luces; `outdoor` con jardín, piscina y otros objetos;
- sin campo de escala global ni imagen por planta.

**Qué permite inferir:**

- el formato de LoRA LAB guarda varias plantas, escaleras de distintos tipos, datos de orientación solar y exterior en un único documento.

**Qué NO permite inferir:**

- que una escalera se pueda **crear o editar**: estaba en la plantilla;
- que conecte físicamente dos plantas ni que se pueda **subir** en el recorrido (S3: el recorrido dio errores de *pointer lock* en el iframe y no se movió);
- que guardar y recargar, o reimportar, conserve el proyecto: no se probó;
- las unidades: la interfaz muestra milímetros, pero el JSON no declara una unidad global;
- nada sobre cortinas, luces por estancia ni altura de ojos.

El JSON **no se reutiliza** como contrato de Rubik ni se copia su contenido.

**Herramientas corregidas en esta actualización:**

- `scripts/qa/loralab/file-type.cjs` identifica PNG, JPEG, WebP, ZIP y JSON por su contenido.
- `analyze-export.cjs` **rechaza** cualquier archivo que no sea JSON, con código de salida 3 y el mensaje «el contenido es png, no JSON; no se analiza». Antes fallaba con `SyntaxError` en `JSON.parse`, comprobado con la versión anterior y un PNG sintético.
- `annex-a-session.cjs` usa la misma función. Su lógica de `1a5f72b` no cambia.
- Lo cubre la prueba `tests/loralab-evidence.test.cjs`, con archivos sintéticos: un PNG llamado `villa-original.json`, un JSON con BOM, un ZIP, un JPEG, un WebP, JSON truncado o escalar y una villa sintética de tres plantas. También comprueba que el informe no copia ningún texto (un correo de prueba aparece sólo contado).

## 4. Estado del anexo A

| Paso | Qué pide | Estado (S3) | Para qué haría falta |
| --- | --- | --- | --- |
| A | Exportar el JSON de «Villa moderna» | **Hecho**, con la nota de las descargas de §3 | — |
| B | Crear una segunda planta | **No probado**: la captura B sigue en la villa | Saber si se crean plantas, no sólo si se ven |
| C | Colocar una escalera entre plantas | **No probado**: la captura C muestra «Solar vacío» en 2D | Saber si la escalera se crea, se coloca y conecta |
| D | Guardar, recargar y reabrir | Saltado | Saber si el proyecto persiste |
| E1–E6 | Recorrido entre plantas, importar el JSON exportado, cortinas, luces, altura de ojos y móvil | Saltados | Saber si esas interacciones funcionan |

**Lo que el anexo A no ha respondido:** si LoRA LAB permite **construir** una vivienda de varias plantas desde cero y **recorrerla** entre plantas. La recomendación de la §8 no depende de esa respuesta, porque se apoya en una brecha comprobada en Rubik, no en una capacidad atribuida a LoRA LAB.

## 5. Matriz función por función

Rubik en `master` `8590349`. Rutas comprobadas en el código. Las medidas de interfaz son de Playwright y Chromium (§10).

| Función | LoRA LAB: evidencia y fuente | Rubik `8590349` | Diferencia para el usuario | Confianza y pendiente |
| --- | --- | --- | --- | --- |
| Plantillas para empezar | **Visible:** «Villa moderna», «Piso clásico» y «Solar vacío» (S1 0:00–0:30, S2). **Ejecutada:** abrir la villa y «Solar vacío» (S1, S3 captura C). | **Parcial:** un único ejemplo, de una planta (`js/reference-project.js`; «Probar el ejemplo», `js/guide-ui.js`), y «Crear desde cero». | Rubik no tiene plantilla de vivienda unifamiliar ni de varias plantas. | Alta para Rubik. Contenido de las plantillas de LoRA LAB sin comparar. |
| Catálogo Construir / Amueblar / Exterior | **Visible:** tres pestañas y catálogos (S1, S2). Amueblar: Juanma declara que puede añadir objetos (**inferida**, no grabado). | **Disponible** para construir y amueblar: catálogo de muebles, 18 GLB de Asset Lab y 50 acabados verificados. **Ausente** para exterior. | Exterior: ver su fila. | Media. |
| Crear estancia | **Ejecutada según #58** (S7 0:12–0:40, secundaria). En S1 y S3, sólo visible. | **Disponible**: «+ Estancia» abre un diálogo rectangular que crea la estancia y sus muros (`js/room-layout.js`, `L.create`). «Plano propio → Estancia» traza sólo el polígono (`js/tracing-core.js`, `T.room`). **Sin dibujo arrastrando** en el plano ni arrastre de vértices. | Interacción directa sobre el plano frente a formulario. Tarea medida: 6 acciones para la estancia (§10). | Reglas de unión de muros y guardado en LoRA LAB: no comprobados. |
| Nombres y tipos de estancia | **Visible/ejecutada según #58** (S7): «Tipo de estancia» y nombres como «Garaje» o «Vestidor». | **Ausente**: nombre libre con «Estancia N» por defecto (`js/room-layout-ui.js`), sin lista de sugerencias. | Escribir el nombre: 1 acción de 22 en la tarea medida. | Que el tipo de LoRA LAB tenga efectos, no comprobado. |
| Puertas y ventanas: añadir y editar | **Ejecutada según #58:** selección. Estilos, marcos y color, **visibles** (S7). | **Disponible (#60):** al tocar un hueco se abre su panel con tipo (4 del contrato), posición, «Centrar», ancho, alto, antepecho, bisagra y «Abre hacia» (`js/opening-ui.js`, `js/opening-edit.js`). Desde la estancia: «Añadir puerta» y «Añadir ventana». | Sólo estilos, familias y marcos, **que no se proponen**. | **Descartada como candidata: ya integrada.** |
| Acabados en contexto | **Visible según #58:** muestras de suelo y pared en el panel (S7). | **Disponible**: muestras de suelo en el panel de estancia; biblioteca de 50 acabados en un diálogo; pared elegida en una lista descrita con palabras (#62, `js/surface-ui.js`). **No** se elige la pared tocándola en el plano. | Suelo y pared: 8 de 22 acciones en la tarea medida (§10). | Persistencia de las muestras en LoRA LAB, no comprobada. |
| Varias plantas | **Ejecutada:** cambio 1F/2F/3F y corte por planta en la villa (S1 0:30–1:05, S3 A). **Inferida:** tres plantas en el JSON (S4). Crear una planta: **no comprobada** (B). | **Disponible hasta 2** (`js/building-core.js`, `LIMITS.levels=2`): selector «Plantas», planta vacía o desde imagen o PDF, 3D apilado. | Tres o más plantas. | Alta para Rubik. |
| Escaleras | **Visible:** catálogo de 6 tipos (S1, S2). **Inferida:** una U y una de caracol en el JSON (S4). Crearlas, editarlas o subirlas: **no comprobado**. | **Parcial:** sólo recta (`building-core.js`: «only straight stairs»), con hueco, aviso BW5 y recolocación. | Escaleras en L, en U y de caracol. | La capacidad de LoRA LAB sólo está inferida. |
| Recorrer entre plantas | **No comprobada:** S3 dio un error de *pointer lock* en el iframe; S1 sólo muestra la ayuda. | **Ausente:** el recorrido mueve la cámara en x/z a 1,6 m fijos (`index.html`, `setMode('walk')`, `stepWalk`) y no cambia de planta. | No se puede recorrer una casa de dos plantas. | Sin dato de LoRA LAB. |
| **Presentar una vivienda de varias plantas** | **Ejecutada:** vista orbital de la villa completa con sus tres plantas (S1). La visita guiada entre plantas: no comprobada. | **Parcial:** el 3D muestra el edificio apilado, pero «Presentar mi vivienda» presenta **una planta**. El aviso dice «Las demás plantas y la escalera no se incluyen; cambia de planta en «Plantas» para presentar otra» (`js/presentation-ui.js:273-274`), y lo comprueba `tests/building.browser.test.cjs:153`. | Una inmobiliaria no puede enseñar un chalé de dos plantas en una sola presentación ni exportar un único lote. | **Alta** para Rubik (código y prueba). |
| Recorrido inmersivo | **Ejecutada:** empieza en la puerta principal, la abre y camina (S1 1:10–2:40). | **Disponible:** empieza en la puerta de entrada, con WASD, ratón, Mayús, joystick táctil, E para puertas y colisión con muros. Visita guiada por estancias (#39). | Equivalente en una planta. | Alta. |
| Instrucciones y controles | **Visible:** WASD, ratón, Mayús, Espacio para saltar, E, L y Esc (S1). | **Disponible:** «WASD para moverse · ratón para mirar · Mayús para correr · E para abrir puertas · Esc para pausar» (`index.html`). | No hay salto, que no aporta en una vivienda. | Alta. |
| Altura de ojos | **Visible:** adulto 1,70 m y niño 1,05 m (S1, S2). Cambiarla: **no comprobado**. | **Ausente como opción:** 1,6 m en el recorrido libre y 1,5 m en la visita guiada (`js/presentation-route.js`). | No se puede ver la casa a la altura de un niño o de una persona en silla. | Utilidad para D-01 no medida. |
| Día y noche | **Ejecutada:** paso a noche, con luces (S1 2:45–3:20). | **Disponible:** botón «Noche» y deslizador «Sol» de 7 a 18 h (`index.html`, `applyLight`). | Equivalente. | Alta. |
| Posición solar (norte, mes, latitud) | **Visible:** controles (S1, S2). **Inferida:** guardados en `site` (S4). Exactitud: no comprobada. | **Ausente:** arco solar sintético con acimut fijo. | La luz no corresponde a la orientación real. | Sería una simulación orientativa, no un estudio solar. |
| Cortinas | **Visible:** botón y «E para cortina» (S1). Uso: **no comprobado**. | **Ausente.** | Requiere una entidad nueva. | Sin evidencia de uso. |
| Luces por estancia | **Visible:** tecla L. Con la noche se ven luces encendidas (S1); control individual **no comprobado**. | **Parcial:** una lámpara por estancia, todas con «Noche», sin control individual. | Encender estancias concretas. | Sin evidencia de uso. |
| Exterior: fachada, cubierta, terreno, jardín y piscina | **Visible:** pestaña y materiales (S1, S2). **Inferida:** `ext` y `outdoor` en el JSON (S4). Crear o editar: **no comprobado**. | **Ausente:** sólo un plano de suelo neutro. | Brecha estructural para viviendas unifamiliares. | Coste L; depende de las plantas. |
| Guardar y exportar | **Ejecutada:** JSON y PNG 3D (S3, S4–S6). Guardar, recargar y reimportar: **no comprobados**. | **Disponible:** IndexedDB, JSON, ZIP, PNG 2D/3D, lámina SVG, lote de presentación (PNG + ZIP) y JSON/ZIP de edificio. GLB/Blender sólo **fuera del navegador** (`scripts/interop/`, #24/#42). | Ninguna demostrada. | — |
| Importar | **Visible:** «Importar diseño (.json)». | **Disponible:** JSON, ZIP, PDF, imagen, SVG, DXF, IFC y RoomPlan (`js/plan-intake-ui.js`). | Rubik acepta más formatos. | — |
| Enlace para compartir | **Visible:** «Copiar enlace». | **Ausente.** | Exige servicio, privacidad y caducidad (decisión 8 de Roadmap 2). | — |
| Móvil | **No comprobado** en ninguna fuente. | Pruebas en emulación a 390×844 y 844×390; **sin teléfono físico**. | — | Pendiente en ambos. |

## 6. Ya integrado: se descarta como candidato

| Propuesta anterior | Estado |
| --- | --- |
| §4 del estudio del 17-10: «Dos plantas y una escalera recta» | Integrada en #50–#54. |
| §5.6 del estudio del 18-10 y #59: «Seleccionar y editar una puerta o ventana donde está» | Integrada en #60. |
| Paredes elegidas por ID con coordenadas (§5.2.3 del estudio anterior) | Corregido en #62: la lista describe cada pared con palabras y pone primero las de la estancia. |
| «Volver» al final de paneles largos; IDs y claves en inglés en la interfaz | Corregido en #62. |

## 7. Brechas restantes y su prioridad

Criterios:

- encaje con D-01;
- que la brecha esté **comprobada en Rubik**;
- tamaño;
- contrato afectado;
- solidez de la referencia de LoRA LAB, que sirve como inspiración y nunca como requisito.

| Brecha | D-01 | Comprobada en Rubik | Tamaño | Contrato | Referencia LoRA LAB | Prioridad |
| --- | --- | --- | --- | --- | --- | --- |
| **Presentar las dos plantas de un edificio en una sola presentación** | **Directo:** el problema D-01 incluye presentar viviendas de varias plantas, y #50–#54 ya permiten editarlas | Sí: código y prueba | S–M | `FloorPlanProjectV1`, no. El manifiesto `presentation.json` del lote, sí (§8). | Ejecutada en órbita; visita entre plantas no comprobada | **1** |
| Acabado de pared eligiendo la pared en el plano | Medio: preparar la vivienda | Sí: 4 de las 8 acciones de acabados | S | No | Secundaria (#58) | 2 |
| Selector de altura de ojos | Bajo o no medido | Sí | S | No (preferencia de vista) | Sólo visible | 3 |
| Norte, fecha y latitud | Medio: la orientación es argumento de venta, pero hay riesgo de presentarlo como estudio solar | Sí | S–M | Datos complementarios de presentación | Visible e inferida | 4 |
| Nombres y tipos de estancia sugeridos | Bajo: ahorra escribir | Sí | S | No, si son sólo sugerencias | Secundaria | 5 |
| Dibujar estancias arrastrando y arrastrar vértices | Medio | Sí | M | No, pero exige decidir la unión de muros | Secundaria | 6 |
| Escaleras en L, U y caracol, 3+ plantas y subir la escalera caminando | Medio | Sí | L | Sí | Inferida o no comprobada | Posterior |
| Exterior y cubierta | Alto para viviendas unifamiliares | Sí | L | Sí | Visible e inferida | Posterior |
| Cortinas y luces por estancia | Bajo | Sí | M | Sí (entidades nuevas) | Sólo visible | Posterior |
| Enlace para compartir | Medio | Sí | M | Servicio aparte | Sólo visible | Requiere la decisión 8 |

**Por qué no la segunda como primera.**

- Elegir la pared en el plano ahorraría 1 o 2 de las 22 acciones medidas, y su beneficio principal (no equivocarse de pared) no se ha medido.
- Además, #62 ya ha resuelto lo peor: la lista de IDs.
- Es una mejora de pulido, no de alcance.

**Por qué no exterior ni escaleras complejas.** Sus requisitos se apoyan en capacidades de LoRA LAB sólo visibles o inferidas, cambian el contrato y su coste es L.

## 8. Recomendación: un solo corte, pendiente de Juanma

### «Presentar las dos plantas de un edificio en una sola presentación»

**Usuario:** agente inmobiliario, promotor o estudio que ha preparado en Rubik un chalé o dúplex de dos plantas (D-01).

**Tarea:**

1. Abrir «Presentar mi vivienda».
2. Ver las estancias de la planta baja y, a continuación, las de la planta superior.
3. Exportar un único lote de imágenes de la vivienda completa.

**Hoy:** presentación y lote de una sola planta (`presentation-ui.js:273-274`); para la otra hay que salir, cambiar de planta y repetir.

**Beneficio esperado:** la inversión de #50–#54 llega a la entrega final que ve el cliente del profesional. *Hipótesis no medida:* que esto reduzca pasos y errores al presentar. Se validaría con la prueba de la §9.

**Alcance:**

1. En un edificio, la configuración de la presentación lista las estancias agrupadas por planta y permite incluir **ambas plantas**. Por defecto se incluyen las dos, en orden de planta.
2. **Transición entre plantas:** una parada de vista general de la planta siguiente, rotulada con su nombre. El 3D muestra hasta esa planta con el corte existente. No hay animación de escalera.
3. El plano de orientación (minimapa) muestra la planta de la parada actual.
4. El lote exporta las vistas de ambas plantas. En `presentation.json`, cada vista lleva su planta; es una ampliación del manifiesto del lote que debe versionarse.
5. Un proyecto de una planta no cambia.

**Exclusiones:**

- subir la escalera caminando y el recorrido libre entre plantas;
- más de dos plantas;
- exterior y cubierta;
- altura de ojos;
- cambios de `FloorPlanProjectV1` o del edificio;
- MCP.

**Dependencias que hay que comprobar antes de implementar:**

- cómo se conmutan en el 3D la planta activa y el corte durante una presentación (`levelContext` y `levelView` en `index.html`);
- la puerta de bloqueo `FloorPlanBuildingUI.gate` con distribución pendiente;
- la ruta interior con holgura de #39, que hoy trabaja sobre una planta;
- coste en teléfono físico y GPU.

**Criterios medibles:**

- Con el edificio sintético de dos plantas (`tests/fixtures/building-fixture.cjs`), una presentación recorre todas las estancias elegidas de ambas plantas, en orden, con una parada de transición rotulada.
- El lote contiene una vista por parada de las dos plantas, cada una con su planta en el manifiesto. El ZIP se vuelve a abrir.
- Un proyecto de una planta produce la misma lista de paradas que en `master`, comparada por su resumen.
- Ningún dato del edificio cambia (hash antes y después).
- Consola y `pageerror` limpios.

**Prueba Playwright y Chromium comparable:** «presentar la vivienda completa de dos plantas», contando acciones desde el editor abierto hasta tener el lote de ambas plantas, con la misma definición de acción que §10.

- **No se ha medido hoy:** la presentación y el lote usan render 3D, y en este contenedor (sin GPU) las suites 3D de presentación cortan por tiempo también en `master`.
- Medir aquí daría un número no fiable. Se medirá antes y después en el PC de Juanma con GPU, o en CI cuando se ejecute.
- **No se fija un objetivo inventado.**

**Si Juanma no confirma la necesidad de presentar viviendas de varias plantas** (D-01 la deja por comprobar), la alternativa es la prioridad 2: acabado de pared eligiendo la pared en el plano, medible con `scripts/qa/openings/room-task.cjs` sin GPU.

## 9. Pruebas que faltan y cómo obtenerlas

1. **Demanda de varias plantas (decide la §8):** Juanma confirma con al menos un caso real o representativo de su público si presentan viviendas de dos plantas.
2. **Anexo A, B–E6 en LoRA LAB** (sólo para la referencia, no bloquea la §8): ejecutar `annex-a-session.cjs` de esta rama en el PC de Juanma. Ya identifica las descargas por su contenido. Aportar `report.md`, `manifest.json` y capturas, y el resumen de `analyze-export.cjs` sobre el JSON válido.
3. **Volver a comprobar S4:** pasar `analyze-export.cjs` al JSON válido y publicar sólo su resumen redactado. Así se confirmarán o corregirán las cifras de la §3.
4. **Firma de S6:** `node -e "console.log(require('./scripts/qa/loralab/file-type.cjs').fileType(require('fs').readFileSync(process.argv[1])))" download-3-Villa_moderna-3d.png`.
5. **Acceso directo:** sólo si el entorno autoriza `fun.loralab.top`. No se intentará otra vía.
6. **Móvil:** sin teléfono físico en ninguno de los dos productos.

## 10. QA de esta actualización

**Entorno:** Node v22.22.0, Playwright 1.56.1, Chromium 141.0.7390.37 headless de `/opt/pw-browsers`, render por software sin GPU.

| Comando | Resultado |
| --- | --- |
| `node --test tests/loralab-evidence.test.cjs` | 2 PASS, 0 FAIL, 0 SKIP |
| Analizador anterior (`HEAD` antes del cambio) con un PNG sintético llamado `villa-original.json` | Reproduce el fallo: `SyntaxError`, salida 1 |
| `node --check` en `scripts/qa/loralab/*.cjs` (4 archivos) | OK |
| `node scripts/qa/openings/room-task.cjs . <salida> contextual` en `047f323` (producto = `master` `8590349`), 1440×900, ratón, 2D | **22 acciones**: estancia 6, huecos 8 (2 cambios de modo), acabados 8 (suelo 4, pared 4). Persistencia tras recargar; sin `pageerror`. [`master-8590349-contextual-task.json`](../qa/artifacts/loralab/rubik-room-task/master-8590349-contextual-task.json). Base histórica en `master` `d9cd11b`: 26 acciones, 12 de huecos y 4 cambios de modo. |
| `git diff --check` y `python3 scripts/check-documents.py` | Ver la descripción de #48 |

**Límites de estas comprobaciones:**

- La tarea medida no se compara con LoRA LAB: no hay una tarea equivalente medida allí.
- Las capturas de esta ejecución no se publican: no se han revisado como evidencia.
- **No ejecutado:** la regresión completa de producto (#48 no cambia código de producto), pruebas en GPU, en teléfono físico y una sesión con personas del público D-01.
- **CI no ejecutada** si los jobs de Actions terminan sin pasos.
