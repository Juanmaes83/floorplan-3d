# QA — «Seleccionar y editar una puerta o ventana donde está» (19-10-2026)

Rama `feat/contextual-openings` desde `master` `d9cd11ba587d8c68bfa9d3a598958be28a0e0206`.

- **Especificación de trabajo:** [`docs/product/contextual-openings-first-cut-2026-10-19.md`](https://github.com/Juanmaes83/floorplan-3d/blob/docs/opening-contextual-ux-gate/docs/product/contextual-openings-first-cut-2026-10-19.md), en la rama `docs/opening-contextual-ux-gate`, sin integrar. Esta PR no se apila sobre ella.
- **Medición de partida:** [#48](https://github.com/Juanmaes83/floorplan-3d/pull/48).
- **Observaciones del vídeo de LoRA LAB:** [#58](https://github.com/Juanmaes83/floorplan-3d/pull/58). Son evidencia de segunda mano: no se vio ese vídeo y no se atribuye a LoRA LAB ninguna función ni un número de acciones.

## 1. Qué cambia

| Superficie | Cambio |
| --- | --- |
| Plano 2D, «Seleccionar» | Cada puerta, corredera, ventana o hueco de paso tiene un objetivo de pulsación de 44 px CSS a través del muro, a cualquier zoom (`vector-effect: non-scaling-stroke`). Pulsarlo selecciona el hueco. Un arrastre sigue desplazando el plano. |
| Panel de propiedades del hueco | Muestra el tipo, la distancia desde el inicio del muro, «Centrar en el muro», el ancho, el alto y el antepecho (en ventana y hueco de paso). En una puerta abatible añade dos controles: «Bisagra», con Extremo A/B rotulados en el plano, y «Abre hacia». La vista previa se dibuja en verde discontinuo y la lista de cambios aparece antes de pulsar «Aplicar cambios». Incluye «Descartar», «Confirmar revisión de este hueco», «Eliminar hueco» y «← Estancia «X»». |
| Móvil | El panel es un cajón que tapa el plano. «Ver en el plano» lo cierra, conserva la propuesta y deja en la barra inferior «Aplicar / Editar / Descartar». |
| Panel de estancia | Añade la lista de sus huecos como botones (selección por teclado) y «Añadir puerta» / «Añadir ventana». Tras pulsarlos se tocan los muros resaltados de esa estancia, se ve la vista previa y se pulsa «Aplicar y añadir». `Esc`, cambiar de herramienta o pasar a 3D cancelan la selección de muro. |
| Datos heredados | Los solapes de un JSON o ZIP antiguo se abren intactos. El resumen y el panel avisan «Huecos solapados en los datos», el plano los marca en rojo y se pueden corregir. |
| «Plano propio» | Añadir puerta o ventana y «Guardar geometría» de un hueco pasan por la misma guarda. Invertir un muro conserva la posición y la hoja de sus huecos. «Cerrar herramientas» ya no deja un modo de trazado activo. |
| 3D | Lectura de pruebas `View3D.doorLeaves`, sin efectos en la escena. |

**Ficheros:**

- nuevos: `js/opening-edit.js` (funciones puras) y `js/opening-ui.js` (interfaz);
- enganches en `index.html` y `js/tracing-ui.js`;
- pruebas: `tests/opening-edit.test.cjs` y `tests/opening-contextual.browser.test.cjs`;
- medición: `scripts/qa/openings/room-task.cjs`.

`FloorPlanProjectV1` y el validador canónico no cambian.

## 2. Reconciliación con la especificación y decisiones de datos

| Regla de la especificación | Implementación |
| --- | --- |
| «Abre hacia» con nombre sólo si es inequívoco | Tres sondas a «grosor/2 + 5 mm» del paramento, en el 25 %, 50 % y 75 % del hueco, deben caer estrictamente dentro de la misma y única estancia, y su nombre no puede repetirse. Si no, el panel muestra «Lado 1» / «Lado 2» y el plano rotula «1»/«2» junto a cada flecha. Equivalencia comprobada con la relación espacial MCP de #40 en la vivienda de referencia: 8 o más huecos compartidos coinciden. |
| Persistir `swing.side` relativo a `start`→`end` | Se guarda sólo `hinge` y `side`, con la misma normal que `project-core.geometry`: `left` = (u.y, −u.x). Comprobado en muros dibujados en ambos sentidos y en giros de 30°, 135° y −60°: la hoja 2D, el 3D y la revisión abren hacia la estancia rotulada. |
| Invertir el eje o editar un muro | Si una edición en «Plano propio» invierte el muro, cada hueco pasa a `offset' = L − offset − ancho`, se invierten bisagra y lado, y queda sin revisar. Comprobado: la bisagra, la dirección de la hoja y la ventana quedan en el mismo sitio (< 1 mm). Si el muro cambia de longitud sin invertirse, el validador existente sigue rechazando un hueco fuera del muro. |
| Revisión | Toda edición deja `source.review:'unreviewed'`. «Confirmar revisión de este hueco» usa el campo existente para el hueco completo; el texto lo dice. No hay estado nuevo. |
| Guarda geométrica común | `FloorPlanOpenings.guard` rechaza un hueco fuera del muro o un solape nuevo o mayor en el mismo muro; tocarse está permitido. La usan el panel, «Añadir» desde la estancia y las dos rutas de «Plano propio». El mensaje dice cuánto se solaparía y con qué hueco, y nada se guarda. La importación (`plan-intake`) no cambia y los solapes heredados se avisan. |
| Cambio de tipo | Pasar a ventana elimina `swing` y aplica 1200 / 900 mm de alto y antepecho (los valores de `T.opening`). Volver a puerta crea `{hinge:'start', side:'left'}` sin revisar y 2100 / 0 mm. Los campos que la persona cambia se respetan. El ID no cambia. |
| Historial y guardado | Se guarda primero y luego se publica un único paso de deshacer. Si el guardado falla, el estado y el historial no cambian. |
| Planta activa | En un edificio sólo cambia el proyecto de la planta activa; la otra planta queda idéntica. |

**Desviaciones nombradas:**

1. Los lados son «Lado 1/2» en vez de «A/B», porque A/B ya rotulan los extremos de la bisagra.
2. La visita guiada lee la hoja de `FloorPlanApp.geometry.doors` (`presentation-route.js:85`). Se verifica esa geometría, no una animación completa de la visita.
3. Teclado: los huecos se seleccionan desde la lista del panel de estancia. Dentro del SVG no hay foco por tabulación.

## 3. Tarea medida

**Definición:** igual que #48 (`scripts/qa/openings/room-task.cjs`).

- Chromium 141.0.7390.37 con render por software, 1440×900, ratón, 2D.
- **Acción:** un clic, toque, campo rellenado u opción elegida.
- **Cambio de modo:** un control que cambia lo que hace el siguiente toque en el plano.
- Se cuenta desde «+ Estancia» en un proyecto vacío ya abierto.

| Flujo | Commit | Acciones totales | Huecos | Cambios de modo | Resultado tras recargar |
| --- | --- | --- | --- | --- | --- |
| Base («Plano propio») | `master` `d9cd11b` | 26 | 12 | 4 | Puerta de 900 mm, ventana, suelo y pared; persistido |
| Base, en esta rama | HEAD | 26 | 12 | 4 | Igual: la ruta antigua sigue funcionando |
| Contextual, en esta rama | HEAD | **22** | **8** | **2** | Igual, persistido |

Los 8 pasos del flujo contextual para los huecos:

1. Añadir puerta.
2. Tocar el muro.
3. Escribir el ancho (900).
4. Aplicar y añadir.
5. «← Estancia».
6. Añadir ventana.
7. Tocar el muro.
8. Aplicar y añadir.

**No se compara con LoRA LAB.** Con el flujo contextual, el sentido de la puerta abre hacia la estancia desde la que se añade. En el flujo base queda en el valor por defecto `start/left`.

## 4. Pruebas

Los resultados de cada suite en el SHA final, con versiones, comandos y consola, se registran en la descripción de la PR.

**Pruebas unitarias** (`tests/opening-edit.test.cjs`, 9 casos):

- muro compartido en ambos sentidos;
- muros oblicuos;
- borde exterior;
- estancias solapadas;
- nombres repetidos;
- equivalencia con #40;
- huecos que se tocan, se solapan, no caben o heredan un solape;
- cambios de tipo y de sentido;
- efecto en la revisión de puertas (el aparador sólo choca si la puerta abre hacia el salón);
- añadir desde la estancia;
- muro invertido.

**Navegador** (`tests/opening-contextual.browser.test.cjs`). Seis pruebas en 1440×900, 390×844 y 844×390, con ratón o toque según el tamaño:

- aviso heredado;
- selección directa;
- objetivo de 44 px;
- controles del panel alcanzables;
- vista previa sin tocar el proyecto;
- aplicar en un paso, deshacer y rehacer;
- hoja 2D hacia la estancia elegida;
- error de ancho con «Aplicar» desactivado;
- solape heredado: empeorarlo se rechaza, resolverlo se acepta;
- puerta → ventana → puerta;
- añadir una ventana desde la estancia, rechazando el muro de otra;
- recarga y ZIP con huecos idénticos;
- ángulo de la hoja 3D igual al sentido guardado;
- fallo de guardado sin efectos;
- guarda en «Plano propio»;
- al cerrar las herramientas, el siguiente toque selecciona;
- sin desplazamiento horizontal ni errores de consola;
- edificio de dos plantas: sólo cambia la planta activa.

**Capturas revisadas una a una** (`docs/qa/artifacts/contextual-openings/`): aviso heredado, selección, panel, vista previa, aplicado, error geométrico, alta de ventana, 3D y edificio, en cada tamaño.

**Revisión visual de las capturas:**

- **Leído:** los controles se alcanzan, los textos se entienden, el mensaje de error es concreto y la barra de móvil no tapa el hueco.
- **Corregido en el ciclo:**
  - el botón desactivado parecía activo;
  - el nombre junto a la flecha duplicaba el rótulo de la estancia;
  - la flecha tapaba parte de «Salón» a 390 px;
  - en móvil, la vista previa quedaba bajo el cajón.

## 5. Defectos encontrados y corregidos durante el trabajo

1. **Clic perdido.** Escribir una medida y pulsar «Aplicar» podía perder el clic porque el panel se reconstruía al perder el foco. Ahora la vista previa se actualiza al escribir y el formulario sólo se reconstruye al cambiar de tipo.
2. **Valores del tipo nuevo.** El cambio de tipo enviaba el alto sin tocar e impedía aplicar los valores del nuevo tipo; la consecuencia era «Alto más antepecho supera la altura del muro». Ahora sólo se envían los campos cambiados, y los campos muestran los valores del nuevo tipo.
3. **Modo oculto.** «Cerrar herramientas» en «Plano propio» dejaba activo el modo de trazado, y el siguiente toque no seleccionaba. Este defecto se midió en #48.
4. **Nombres sin traducir.** Las estancias aparecían con su nombre interno; ahora usan la traducción visible.

## 6. Límites

- **Sin validar:**
  - CI, si no ejecuta pasos;
  - GPU real (todo el 3D es SwiftShader);
  - teléfonos físicos;
  - una sesión con una persona del público D-01.
- La hoja de puerta se representa como hasta ahora. No hay estilos, marcos, cortinas ni familias nuevas.
- La atribución por sondas no resuelve estancias solapadas, nombres repetidos ni lados exteriores: en esos casos se muestran lados numerados.
- La edición de muro en «Plano propio» conserva los huecos sólo si se invierte el eje; un cambio de longitud sigue sujeto al validador.
- Los solapes heredados no se corrigen solos ni bloquean la apertura.
