# LoRA LAB frente a Rubik: matriz visual de 4 capturas y un vídeo de 27,8 s (20-10-2026)

Anexo del [estudio vigente de #48](loralab-study-evidence-2026-10-19.md). Sirve para priorizar **cortes futuros, por separado**, de producto y de UI/UX.

- **No aprueba nada.**
- **No amplía [#65](https://github.com/Juanmaes83/floorplan-3d/pull/65).** Esa PR sigue limitada a presentar dos plantas en un lote.
- **Necesitan una decisión y una PR propias:** tercera planta, tipos avanzados de escalera, exterior y rediseño general del editor.
- **Rubik se compara en `master` `bd153c76e493eb5dea1b2908c768f66935f5a192`.** Las rutas se comprobaron en el código; no se ejecutó la interfaz para esta matriz.

## 0. Fuentes

| Id | Fuente | Cómo se revisó | Límite |
| --- | --- | --- | --- |
| C1 | Captura de Juanma: 2D de la planta 1F de «Villa moderna», con «Coche» seleccionado y la columna izquierda «Construir» arriba. SHA-256 `4688386f…7d8e`. | Vista completa | Imagen fija: muestra controles y un estado, no su efecto. |
| C2 | Captura: el mismo 2D; columna izquierda hasta «Escaleras» y columna derecha con «Fachada», «Cubierta», «Marcos», «Terreno», «1F planta actual» y «Estadísticas». SHA-256 `2ce853df…6d93b`. | Vista completa | Igual |
| C3 | Captura: columna derecha «Proyecto», «Sol y orientación», «Luces interiores» y «Exterior». SHA-256 `892a89c0…a048`. | Vista completa | Igual |
| C4 | Captura: 2D ampliado de la planta 1F, con escala de 2 m. SHA-256 `5ab1ff13…87b8`. | Vista completa | Igual |
| V2 | Vídeo de Juanma, 27,8 s, 2558×1360, 30 fps. SHA-256 `b28ae972eaefa797a384219c65d175babe361d4aba95f652326aa43033d39def`. | **Revisado por fotogramas cada 0,5 s y con recortes ampliados.** No se ha escuchado el audio. | Una sola sesión, sobre la plantilla de ejemplo. |

Los originales siguen fuera del repositorio. Del vídeo se registran **acciones con efecto visible**, que aquí cuentan como «ejecutada»:

| Tiempo | Acción |
| --- | --- |
| 0–3 s | Desplazar la columna «Construir» hasta «Escaleras» y el consejo final |
| 4 s | Pulsar la pestaña «Amueblar» |
| 5–13 s | Recorrer su catálogo |
| 14 s | Pulsar «Exterior» |
| 14–19 s | Recorrer su catálogo, con el cursor sobre «Parterre» |
| 19–20 s | Pasar de 2D a 3D, en modo «Órbita» |
| 25 s | Activar «Muros cortados» |
| 26 s | Cortar por planta, de «Cubierta» a «3F» |
| 27 s | Pulsar «Vista superior», que pasa a una vista cenital |

**No se ve en el vídeo:** colocar o editar ningún objeto, usar «Recorrido», mover la hora, «Cortinas», «Abrir todo», «Captura», «Calidad», cambiar materiales ni guardar.

**Leyenda.**

- Estado en LoRA LAB:
  - **E** ejecutada: acción con efecto visible;
  - **V** visible: control en pantalla sin uso;
  - **I** inferida: deducida de un dato, como un rótulo o una cifra;
  - **N** no comprobada.
- Rubik:
  - **Sí** disponible;
  - **Parcial**;
  - **No** ausente.
- Decisión:
  - **Integrado**: ya está en `master`;
  - **Aprobado**: con PR;
  - **Propuesto**: candidato sin aprobar;
  - **Fuera de alcance**: necesita decisión y PR propias.

## 1. Respuesta corta: qué tenemos y qué no

**Lo que ya tenemos (en `master`):**

- **Navegación del plano:**
  - plantas 1F/2F (máximo 2) y 2D/3D;
  - 3D con «Vista aérea» y «Recorrer»;
  - «Superior» e «Isométrica»;
  - muros completos o seccionados a 1,2 m;
  - deshacer y rehacer;
  - idiomas ES, EN y 中文;
  - barra de escala, zoom y «Ajustar»;
  - coordenadas y escala en la barra inferior.
- **Construir:**
  - «Seleccionar», «Medir» y «Modificar muros»;
  - dibujar muros y estancias en «Plano propio»;
  - «+ Estancia» rectangular, que crea sus muros;
  - 4 tipos de hueco (puerta abatible, corredera, ventana, hueco de paso) editables en contexto;
  - escalera recta entre dos plantas.
- **Amueblar:**
  - catálogo genérico de **60 muebles en 6 grupos**, con medidas, buscador y filtros;
  - **21 modelos GLB** autorizados;
  - panel de mueble con medidas, rotación, «Girar 90°», color, «Duplicar» y «Eliminar».
- **Columna derecha:**
  - vista general con superficies y estimación de pavimentos en m²;
  - planta: nombre, elevación, forjado, desplazamiento y planta inferior atenuada;
  - superficie por planta y total;
  - proyectos: plantilla de referencia, renombrar, duplicar y variantes.
- **Presentación:**
  - «Presentar mi vivienda» y su lote ZIP, con dos plantas en #65;
  - «Noche» con lámparas;
  - sol de 7 a 18 h;
  - captura PNG 3D con tamaño y proporción.

**Lo que no tenemos:**

- **Organización de la columna izquierda:** no hay pestañas «Construir / Amueblar / Exterior». Tampoco hay paletas con icono de:
  - tipos de estancia (LoRA LAB muestra 20);
  - tipos de puerta (7) y de ventana (7);
  - tipos de escalera (6).
- **Estructura:** no se puede elegir muro de carga o tabique al dibujar.
- **Catálogos:**
  - el interior es menor: 60 muebles y 6 grupos, frente a unos 10 grupos en LoRA LAB, con niños, iluminación, decoración y ocio;
  - **no hay catálogo exterior.**
- **Lienzo:** no hay brújula ni norte.
- **Columna derecha:**
  - las muestras de color del objeto son un selector de color estándar;
  - sin sol con norte, mes ni latitud;
  - sin luces Auto/Encendido/Apagado;
  - sin fachada, cubierta, acabado de cubierta, marcos ni terreno;
  - sin altura de planta;
  - sin presupuesto en español: los precios sólo salen en EN/ZH;
  - sin límite de superficie.
- **3D:**
  - sin barra de horas 0–24 h con reproducción;
  - sin «Cortinas» ni «Abrir todo»;
  - sin selector de calidad;
  - sin corte «hasta planta N» de 3 plantas más cubierta.
- **Edificio:** sin tercera planta.

## 2. Matriz por zona

### A. Barra superior

| Elemento | Qué se ve | LoRA LAB | Rubik `bd153c7` | Brecha concreta | Decisión |
| --- | --- | --- | --- | --- | --- |
| Selector de planta 1F/2F/3F | C1–C4; V2 | V en 2D; en 3D, corte por planta **E** (V2, 26 s) | **Parcial:** `#levelBar` con un chip por planta (`js/building-ui.js:40-48`), máximo 2 (`building-core.js:12`) | Tercera planta | Fuera de alcance |
| 2D / 3D | V2 | **E** (19–20 s) | **Sí:** `#viewSeg` «Plano 2D / Escena 3D», tecla T (`index.html:405-409`) | — | Integrado |
| Órbita / Recorrido | V2, en 3D | «Órbita» activa: V. «Recorrido»: N en este vídeo | **Sí:** `#modes3d` «Vista aérea» / «Recorrer» (`index.html:422-425`) | Sólo el nombre | Integrado |
| Deshacer / rehacer | C1–C4 | V | **Sí:** `#undo` / `#redo`, Ctrl+Z, pila de 150 pasos (`index.html:431-432`, 978) | — | Integrado |
| Idioma | C1–C4 («Español ▾») | V | **Sí:** `#langBtn`, que alterna ES → EN → 中文 (`index.html:457`, 2098) | Rubik usa un botón de ciclo y LoRA LAB un desplegable; además, hay textos ES pendientes de traducir | Propuesto (UI) |
| Menú «Proyecto» | C1–C4 («··· Proyecto») | V; contenido N | **Sí:** «Archivo ▾» (exportar imagen, captura 3D, lámina, JSON, subir plano, vaciar, restablecer) y el diálogo «Proyectos» (`index.html:459-487`, 562-569) | No comparable sin abrir el menú de LoRA LAB | — |

### B. Columna izquierda: organización

| Elemento | Qué se ve | LoRA LAB | Rubik | Brecha | Decisión |
| --- | --- | --- | --- | --- | --- |
| Pestañas «Construir / Amueblar / Exterior» | C1–C4; V2 | **E:** cambio de pestaña (4 s y 14 s) | **No:** `aside.lib` sólo tiene buscador y resultados por estancia; en 3D, la lista de estancias (`index.html:492-498`) | Construir está repartido entre la barra superior («Seleccionar», «Medir», «Modificar muros»), «+ Estancia», «Plano propio» y el panel de estancia | **Propuesto** (UI/UX, primer candidato §4) |
| Consejo al pie | C2; V2 («dibuja primero las estancias; los muros se crean solos…») | V | **Parcial:** `#tip` con `TIPS()` (`index.html:1975`) | Texto equivalente; ubicación distinta | — |

### C. Columna izquierda «Construir»

| Elemento | Qué se ve | LoRA LAB | Rubik | Brecha | Decisión |
| --- | --- | --- | --- | --- | --- |
| Seleccionar | C1 (activo) | **E:** «Coche» seleccionado (C1) | **Sí** (`index.html:411`) | — | Integrado |
| Muro | C1 | V | **Parcial:** «Plano propio → Muro» (`tracing-ui.js:115`) | No está en la paleta principal | Propuesto (UI) |
| Muro de carga / Tabique | C1 | V | **Parcial:** el contrato tiene `structure` (load-bearing, partition…) (`project-schema.js:201`), pero los muros nuevos se guardan como `unknown` (`tracing-core.js:92`) y no se puede elegir | Elegir el tipo de muro al dibujarlo y al editarlo | Propuesto (producto: afecta a «Modificar muros» y a la lámina) |
| Medir | C1 | V | **Sí:** «Medir» (`index.html:412`) | — | Integrado |
| Estancias: 20 tipos con icono (Salón, Comedor, Cocina, Dormitorio, Dormitorio principal, Habitación infantil, Baño, Estudio, Pasillo, Recibidor, Lavadero, Trastero, Garaje, Gimnasio, Cine en casa, Terraza, Balcón, Vestidor, Habitación de invitados, Estancia) | C1, C2 | V. Que el tipo cree la estancia con nombre: **I** (consejo). En la plantilla los nombres coinciden. | **Parcial:** «+ Estancia» con nombre libre y «Estancia N» por defecto (`room-layout-ui.js:53-54`) | Sin paleta de tipos ni nombres sugeridos. Dibujar arrastrando, N en LoRA LAB | **Propuesto** (UI/UX; ver §4) |
| Puertas: 7 tipos (abatible, doble, corredera de vidrio, corredera empotrada, pivotante de entrada, de garaje, paso abierto) | C1, C2 | V | **Parcial:** 4 tipos del contrato (`opening-edit.js:10-11`), editables en contexto (#60) | Puerta doble, pivotante, de garaje y corredera empotrada: cada una necesita geometría y 3D propios | Propuesto (producto, necesita contrato) |
| Ventanas: 7 tipos (abatible, ventanal de suelo a techo, media altura hasta el techo, panorámica, alta corrida, mirador, ojo de buey) | C2 | V | **Parcial:** una «Ventana» con ancho, alto y antepecho | Varios tipos podrían ser **preajustes de medidas** de la ventana actual sin cambiar el contrato; el mirador y el ojo de buey no | Propuesto: preajustes (UI); formas especiales (producto) |
| Escaleras: 6 tipos (recta, en L, en U, doble en V, de caracol, volada flotante) | C2; V2 | V. En el JSON de la villa hay una U y una de caracol: **I** | **Parcial:** sólo recta, en «Plantas…» (`building-ui.js:277-298`; `building-core.js:155`) | Tipos avanzados | **Fuera de alcance** |

### D. Columna izquierda «Amueblar» y «Exterior» (sólo en V2)

| Elemento | Qué se ve | LoRA LAB | Rubik | Brecha | Decisión |
| --- | --- | --- | --- | --- | --- |
| Catálogo «Amueblar» por categorías con miniatura y medidas: Salón, Dormitorio, Cocina y comedor, Baño, Estudio y trabajo, Niños y mascotas, Electrodomésticos, Iluminación, Decoración, Ocio y fitness | V2, 5–13 s | Recorrer el catálogo: **E**. Colocar objetos: **N** | **Sí, menor:** 60 genéricos en 6 grupos (Dormitorio, Salón, Cocina y comedor, Baño, Electrodomésticos, Estudio y ocio) con medidas, buscador, filtros «Estancia» y «Familia / tipo», y 21 GLB autorizados (`generic-catalog.js:3-30`, `index.html:1855-1873`) | Faltan los grupos Niños y mascotas, Iluminación, Decoración y Ocio y fitness. Las tarjetas de Rubik muestran texto y medidas; las de LoRA LAB, una miniatura en planta | Propuesto (catálogo F3, por lotes) |
| Buscador del catálogo | V2 | V | **Sí:** «Buscar muebles» | — | Integrado |
| Catálogo «Exterior»: Exterior y jardín, con piscina, jacuzzi, césped, tarima, acceso de vehículos, camino de pasaderas, árboles, palmera, arbusto, seto, parterre, vallas, puerta corredera, barandilla de vidrio, pérgola, sombrilla, tumbona, sofá exterior, barbacoa, fogata, columpio, fuente, farolas, coche, bicicleta, buzón, cama elástica y parque infantil | V2, 14–19 s | Recorrer: **E**. Colocar: **N** (en la plantilla ya están colocados) | **No:** sólo hay unos pocos GLB de jardín de IKEA mezclados en grupos interiores | Catálogo y entidades de exterior | **Fuera de alcance** |

### E. Lienzo 2D

| Elemento | Qué se ve | LoRA LAB | Rubik | Brecha | Decisión |
| --- | --- | --- | --- | --- | --- |
| Rótulos de estancia con m² y símbolos de muebles en planta | C1, C4 | V | **Sí:** nombres y m² en el plano; muebles en planta | Estilo gráfico distinto | — |
| Escalera dibujada en planta | C1, C4 | V | **Sí:** peldaños y «Sube» / «Hueco de escalera» (`building-ui.js`, `render2D`) | — | Integrado |
| Selección con tiradores y cotas del objeto | C1 (coche 1,57 × 3,68 m) | **E** | **Sí:** tiradores de mueble y barra flotante ↺ ↻ | — | Integrado |
| Brújula / norte | C1–C4; V2 | V | **No** | Norte de la parcela | Propuesto, junto a sol y orientación |
| Barra de escala | C1, C4 (5 m y 2 m) | V | **Sí:** `#scalebar` | — | Integrado |
| Zoom +/−/ajustar | C1–C4 | V | **Sí:** en la barra superior, más 1:60 y 1:100 | Ubicación | — |
| Barra inferior: coordenadas y «Superficie construida» 472 / 2000 m² | C1–C3 | V | **Parcial:** X/Y en mm y escala 1:N (`index.html:539-540`); superficie útil en la cabecera | No hay límite de 2000 m², que es propio del plan de LoRA LAB | No procede |
| Ayuda de interacción sobre el lienzo | C1–C4 | V | **Sí:** `#tip`, `#modehint` | — | Integrado |

### F. Columna derecha

| Elemento | Qué se ve | LoRA LAB | Rubik | Brecha | Decisión |
| --- | --- | --- | --- | --- | --- |
| Objeto seleccionado: ancho, fondo, altura, rotación, «↻ 90°», 13 muestras de color, «Duplicar», «Eliminar» | C1 | Panel **E** (selección); editar valores **N** | **Sí:** nombre, ancho, fondo, altura, modelo 3D, centro, rotación, «Girar 90°», color, «Duplicar», «Eliminar», orden (`index.html:1506-1525`) | En Rubik el color es `input type=color`, sin muestras | **Propuesto** (UI, pequeño) |
| Proyecto: nombre y «Empezar desde una plantilla…» | C3 | V | **Sí:** diálogo «Proyectos» con nombre, «Crear plantilla de referencia» y variantes; «Probar el ejemplo» | Una plantilla en Rubik frente a «Villa moderna», «Piso clásico» y «Solar vacío» en LoRA LAB | Propuesto (plantillas) |
| Sol y orientación: norte (0°), hora (16:00), mes (jun), latitud (31°) | C3 | V. En el JSON: **I** | **Parcial:** sólo «Luz solar» de 7 a 18 h (`index.html:453`, `applyLight`) | Norte, mes y latitud, como simulación orientativa y no estudio solar | Propuesto (producto: datos de presentación) |
| Luces interiores: Auto / Encendido / Apagado | C3; V2 («Luces: Auto» en 3D) | V | **Parcial:** «Noche» enciende una lámpara por estancia (`index.html:451`, 3394) | Modo automático según la hora | Propuesto (pequeño) |
| Fachada: 8 materiales | C2, C3 | V | **No** | Envolvente | **Fuera de alcance** (exterior) |
| Cubierta: plana, plana con peto, a cuatro aguas, a dos aguas, a un agua | C2, C3 | V | **No** | Cubierta | **Fuera de alcance** |
| Acabado de cubierta: 5 | C2, C3 | V | **No** | — | **Fuera de alcance** |
| Marcos de ventana: 6 colores | C2, C3 | V | **No** | Color de carpintería | Propuesto (producto: material del hueco) |
| Terreno: césped, grava, pavimento de piedra, arena | C2, C3 | V | **No:** plano de suelo neutro | — | **Fuera de alcance** |
| Planta actual: nombre, altura de planta (3400), mostrar planta inferior (encendido/apagado), «Eliminar esta planta» | C2 | V | **Parcial:** diálogo «Plantas…» con nombre, elevación, forjado, desplazamiento, «Mostrar atenuada la planta inferior en 2D» y «Eliminar planta» (`building-ui.js:250-271`) | Altura de planta como campo propio. Las propiedades de planta van en un diálogo, no en la columna | Propuesto (UI) |
| Estadísticas: m² por planta, total y «Presupuesto de acabados (est.)» | C2 | V. Exactitud del presupuesto: **N** | **Parcial:** superficie por planta y total (`#levelAreas`); estimación de pavimentos en m². Los precios sólo salen en EN/ZH, en ¥ (`index.html:1359`) | Presupuesto en € con fuente y alcance declarados | Propuesto (producto, necesita decisión D-05) |

### G. Vista 3D (sólo en V2, 19–27 s)

| Elemento | Qué se ve | LoRA LAB | Rubik | Brecha | Decisión |
| --- | --- | --- | --- | --- | --- |
| Corte por planta: Cubierta / 3F / 2F / 1F | V2 | **E** (26 s) | **Parcial:** «Ver todas» o hasta la planta activa (`#levelViewAll`) | Elegir cualquier nivel y la cubierta | Fuera de alcance (depende de la tercera planta y de la cubierta) |
| Vista general | V2 | V | **Sí:** «Isométrica» y la presentación | — | Integrado |
| Vista superior | V2 | **E** (27 s) | **Sí:** «Superior» (`#vTop`) | — | Integrado |
| Muros cortados | V2 | **E** (25 s) | **Sí:** «Muros seccionados», a 1,2 m (`index.html:445-446`) | — | Integrado |
| Luces: Auto | V2 | V | **Parcial:** «Noche» | Ver la columna derecha | Propuesto |
| Cortinas | V2 | V | **No** | Entidad nueva | Fuera de alcance |
| Abrir todo | V2 | V | **No:** las puertas se abren una a una, con clic o con E | Abrirlas todas | Propuesto (pequeño) |
| Captura | V2 | V | **Sí:** «Captura 3D», con tamaño y proporción | — | Integrado |
| Calidad: Alta | V2 | V | **Parcial:** «Material: detalle/básico» y «Sombras» sólo en «Presentar mi vivienda» | Selector general de calidad | Propuesto |
| Barra de horas 00–24 con reproducción (16:00) | V2 | V | **Parcial:** deslizador de 7 a 18 h, sin reproducción | Ciclo completo y animación | Propuesto, junto a sol y orientación |
| Panel 3D superpuesto, ordenado, en una esquina | V2 | V | **Parcial:** los controles 3D van en la barra superior | Agrupación junto a la escena | Propuesto (UI) |

## 3. Lectura de UI/UX: dónde tiene razón la observación y dónde hay que medir

**De acuerdo, por lo que se ve en las capturas:**

1. **La columna izquierda de LoRA LAB es una paleta de creación.** Agrupa por intención (construir, amueblar, exterior), muestra cada tipo con icono y nombre, y lleva un consejo al pie. En Rubik las mismas acciones de construir están repartidas entre la barra superior, «+ Estancia», «Plano propio» y el panel de estancia. Hoy la columna izquierda sólo amuebla.
2. **Los tipos con nombre aceleran:** «Dormitorio principal», «Puerta de garaje» o «Ventanal de suelo a techo» dicen qué se crea. Rubik pide un nombre libre y sólo tiene 4 huecos genéricos.
3. **La columna derecha de LoRA LAB es contextual y visual.** Usa muestras de color y material en lugar de selectores de color, y muestra en el mismo panel las estadísticas por planta y las propiedades de la planta actual.

**Con cuidado:**

- **Una interfaz más visual no prueba menos errores ni menos tiempo.** No hay medición con personas de D-01. La tarea medida de Rubik (22 acciones, en `8590349`) no tiene equivalente medido en LoRA LAB.
- **Riesgo de prometer de más:** muchos controles de LoRA LAB son sólo visibles (cortinas, cubierta, calidad, presupuesto). Copiar la paleta sin respaldo en el modelo prometería funciones que Rubik no tiene. Por ejemplo, una «Escalera en U» sin geometría propia.
- **Coste en teléfono:** con dos columnas densas se perdería el plano. Rubik ya usa cajones y «Ver en el plano» (#62); cualquier paleta nueva debe pasar la QA a 390×844 y 844×390.

## 4. Candidatos para priorizar (propuestos, sin aprobar)

Se separan en UI/UX y en producto. Ninguno entra en #65.

**UI/UX (sin cambio de contrato):**

1. **Paleta «Construir» en la columna izquierda.** Pestañas «Construir / Amueblar» y, en «Construir», grupos con icono:
   - **Estructura:** Seleccionar, Muro, Medir, Modificar muros;
   - **Estancias:** tipos que dan nombre a «+ Estancia» rectangular. No guardan un tipo nuevo: sólo sugieren el nombre;
   - **Huecos:** los 4 tipos actuales, más preajustes de ventana sólo por medidas, como suelo a techo, alta corrida o panorámica;
   - **Escalera recta:** abre «Plantas…».

   Reutiliza funciones existentes. Criterio: menos acciones en la tarea medida y QA en tres tamaños.
2. **Columna derecha contextual con muestras.** Color del mueble y acabados con muestras; propiedades y estadísticas de la planta actual en la vista general, en lugar de sólo en el diálogo «Plantas…».
3. **Panel 3D agrupado** junto a la escena: vistas, cortes, «Noche» y captura.

**Producto (requieren decisión y, a veces, contrato):**

4. Elegir el tipo de muro (carga o tabique) al dibujarlo y al editarlo. El campo ya existe en el contrato.
5. Sol y orientación: norte, mes, latitud y una barra de horas de 0 a 24 h, como datos de presentación orientativos.
6. Ampliar el catálogo interior con iluminación, decoración, infantil y ocio.
7. Tipos de puerta y ventana con geometría propia, y color de marcos.
8. Presupuesto de acabados en €, condicionado a la decisión D-05 de precios.

**Fuera de alcance hasta que haya una decisión y una PR propias:**

- tercera planta y corte con cubierta;
- escaleras en L, en U, en V, de caracol y voladas;
- fachada, cubierta, terreno y catálogo exterior;
- cortinas;
- rediseño general del editor.

## 5. Límites

- Las capturas y el vídeo son de una sola sesión sobre la plantilla «Villa moderna». La mayoría de los controles son **visibles**, no ejecutados.
- No hubo acceso directo a LoRA LAB desde este entorno (403 del proxy).
- La columna Rubik se comprobó en el código de `bd153c7`, no ejecutando cada control en el navegador. Queda sin comprobar en ejecución el número de GLB aceptados.
