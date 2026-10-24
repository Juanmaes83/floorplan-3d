# Patrón de paneles y navegación del editor, y revisión de «Generar» (19-10-2026)

Entrega separada de la PR de huecos [#60](https://github.com/Juanmaes83/floorplan-3d/pull/60) y apilada sobre ella mientras #60 siga abierta. No cambia `FloorPlanProjectV1`, el validador, las reglas geométricas ni los datos importados. Evidencia y resultados: [`docs/qa/editor-ux-2026-10-19.md`](../qa/editor-ux-2026-10-19.md).

## 1. Objetivo

El editor debe dejar claro dónde está la persona, qué puede hacer y cuál es el siguiente paso. Antes de este cambio:

- los controles generales estaban repartidos en cuatro filas a 1440 px;
- los paneles tenían jerarquía débil y «Volver» aparecía al final o en sitios distintos;
- algunas propiedades exigían un clic extra en «Propiedades».

## 2. Inventario de pantallas compartidas

| Recorrido | Pantallas y piezas | Antes (base de la PR) | Después |
| --- | --- | --- | --- |
| 1. Inicio y «Generar» | Bienvenida: título, buscador, tres entradas, nota de almacenamiento | El buscador era lo primero y tenía el foco; en un teléfono abre el teclado sobre las opciones. No se decía qué se obtiene. | Tres entradas primero; línea «Obtendrás…» con sus límites; buscador como vía secundaria; foco en el título. |
| | Barra de guía (modo guiado) | Ocupaba unos 300 px a 390×844 y unos 170 px a 844×390 | «Ver menos/Ver más»; compacta por defecto en teléfonos y pantallas bajas. |
| 2. Estancia | Panel de estancia, diálogo de dimensiones, diálogo de acabados | «Volver a la vista general» al final de un panel largo. Nombres de ejemplo sin traducir y claves internas («El lado left…»). La lista de paredes mostraba IDs y coordenadas. | Cabecera con «← Vista general»; grupos plegables; textos en castellano; paredes descritas por posición y estancias. |
| 3. Puerta o ventana (seleccionar y editar) | Panel del hueco | Cerrado por #60 | Misma cabecera; «Ver en el plano» en la cabecera, como en todos los paneles. |
| 4. Añadir puerta o ventana | Banner sobre el plano y panel de propuesta | Cerrado por #60 | Sin cambios funcionales. |
| 5. Calibrar y cotas en «Plano propio» | Panel de herramientas, edición de elemento, diálogo de distancia | Lista plana de botones. Avisos con IDs. Al confirmar sin segunda cota decía «no concuerda». | Herramientas agrupadas por tarea, «← Cerrar herramientas» arriba, avisos y edición sin IDs. Mensajes de calibración con cifras y cómo corregir. |
| Común | Barra superior (editor completo) | Cuatro filas a 1440 px; «Vaciar» junto a «Deshacer» | Tres filas por tarea; «Vaciar» en «Archivo»; capas en «Mostrar ▾». |

## 3. Patrón compartido de paneles

1. **Cabecera fija.** Lo primero de cada panel es «Volver», en la misma posición, con la misma forma y el mismo color. Debajo van el nombre de lo que se ve y su contexto (tipo, medidas, planta).
   - En pantallas estrechas, «Ver en el plano» está en la cabecera: cierra el cajón y conserva la selección.
2. **«Volver» sube un nivel.** La cadena es:
   - mueble → estancia que lo contiene (o vista general);
   - hueco → estancia;
   - estancia → vista general;
   - edición de «Plano propio» → sus herramientas.

   La vista general es el nivel superior y no tiene «Volver». Las herramientas de «Plano propio» se cierran con «← Cerrar herramientas».
3. **Jerarquía vertical:** contexto y estado, tarea, contenido, ayuda breve y acción principal.
4. **Grupos plegables (`details`) por familia de propiedades.** Empiezan abiertos los que contienen la tarea habitual. Las ayudas largas, como los atajos de teclado o «Cómo moverlo en el plano», empiezan plegadas. Ninguna acción principal queda dentro de un grupo plegado.
5. **Acciones al pie, fijas, cuando hay un formulario** (hueco, mueble y edición de «Plano propio»). En pantallas de 500 px de alto o menos dejan de ser fijas para no tapar el contenido, y siguen dentro del área desplazable.
6. **Plano como contexto.**
   - **Decisión de Juanma (confirmada el 23-10-2026): en el editor de escritorio (más de 1100 px de ancho) las dos columnas están abiertas por defecto**, también en el modo guiado y al entrar en el ejemplo. Sustituye a «el modo guiado empieza plegado», que describía el comportamiento de #62 y no era una decisión de producto.
     - Cerrar una columna («Crear y amueblar» o «Propiedades») es una preferencia de la persona: se guarda en este navegador (`huxing-panes`) y se respeta al recargar y al volver. La guía no vuelve a cerrarlas.
     - En escritorio, la columna de propiedades se abre al seleccionar una estancia, un mueble o un hueco, aunque estuviera plegada. No tapa el plano.
     - La presentación al cliente no muestra controles de edición: las columnas y los cajones salen de la pantalla mientras se presenta y vuelven como estaban al terminar.
     - Pruebas: `tests/panel-pattern.browser.test.cjs` («columns open by default on desktop and keep the person's choice», a 1440×900, 1280×800, 390×844 y 844×390) y `tests/presentation-framing.browser.test.cjs` («R10 presentation hides the edit columns 1440x900»). Las dos fallan en `master` `e796e3d`.
   - En teléfono, sólo los huecos abren el cajón automáticamente: es la decisión de producto de #60. Estancias y muebles ofrecen «Propiedades» en la barra inferior, porque el cajón taparía el plano en el que se arrastran.
7. **Barra superior agrupada por tarea** (escritorio). Fila 1: identidad y proyecto. Fila 2: cómo editar (vista, herramienta, historial, zoom, «Mostrar ▾», «Plano propio», paneles). Fila 3: estado, archivo y ajustes. Las acciones destructivas («Vaciar», «Restablecer») quedan juntas en «Archivo».

No cambia ninguna función: los mismos botones y los mismos IDs, con otra posición o agrupados.

## 4. «Generar»: alcance revisado

En el código no existe una pantalla llamada «Generar». Se interpreta como el recorrido de creación desde la bienvenida: «Subir un plano», «Crear desde cero» y «Probar el ejemplo», hasta el editor con el resultado.

- **Qué se crea y qué hay que aportar.** «Obtendrás un plano 2D editable y su vista 3D, guardados en este navegador. Las medidas son orientativas: no sustituyen a una medición profesional.» Cada entrada dice qué se necesita: un plano, ancho y fondo, o nada.
- **Jerarquía.** Las tres entradas van antes del buscador. «Subir un plano» va primero y destacado, «si ya tienes un plano». El buscador es una vía secundaria.
- **Formatos, calibración y límites, en lenguaje de usuario.** Formatos: PDF, imagen, DXF, IFC, RoomPlan o proyecto JSON/ZIP. Las imágenes se calibran con una medida conocida y el resultado se revisa antes de usarlo. No se añade ninguna capacidad: el detector de muros sigue siendo «asistencia experimental» y no se menciona en la entrada.
- **Estados.** Error de archivo no reconocido: el mensaje existente se mantiene y el proyecto no cambia. El progreso de la importación es el existente. El resultado es el editor con la guía: en el modo compacto se ve la tarea actual y su botón.

## 5. Castellano y contenido de ejemplo

- **Textos del producto:** sin claves internas (`left`, `offset`, `IDs`) ni IDs (`wal_…`, `opn_…`, `obj_…`, `prj_…`, `img_…`). Una prueba de navegador (`tests/ui-language.browser.test.cjs`) falla si reaparecen en los recorridos revisados.
- **Contenido de ejemplo.** Los nombres de la vivienda de ejemplo están guardados en chino (`三室两厅两卫`, `子女房`…). Se muestran con su traducción visible (`nm()`) en todos los diálogos, en la barra de estado y en la lista de proyectos. El dato guardado no cambia.
- **Contenido de la persona.** Un nombre escrito por la persona se muestra tal cual, nunca se traduce. La prueba crea «我的书房» y comprueba que aparece igual.

## 6. Calibración

La protección no cambia:

- margen provisional de ±2 %;
- la escala no se confirma con una segunda cota contradictoria;
- una segunda cota contradictoria retira una confirmación anterior;
- la proporción y la geometría no se tocan.

Los mensajes dicen qué ocurre y cómo corregirlo:

- sin calibrar;
- falta la segunda cota;
- no concuerda, con «mide X mm y has indicado Y mm (error ±Z %; margen ±2 %)». Se pide repetir la medida con más zoom o recalibrar con la medida conocida más larga.

## 7. Pendiente, fuera de esta entrega

- Hoja inferior en teléfono vertical que deje ver el plano a la vez que las propiedades (hoy, cajón lateral con «Ver en el plano»).
- Teclado dentro del plano SVG: hoy la selección por teclado se hace desde las listas de los paneles.
- Unificar «Plano propio» con el panel de estancia: dibujo de estancias, nombres sugeridos y acabados con jerarquía visual. Es el siguiente candidato de §3.5 de Roadmap 2.
- Medición con personas del público D-01: ninguna afirmación de esta entrega procede de una sesión con usuarios.
- Pantalla de progreso propia para la importación de planos grandes: hoy, estado en la barra inferior.
