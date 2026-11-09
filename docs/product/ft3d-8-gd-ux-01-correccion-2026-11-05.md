# FT3D-8 · Gate D · Corrección GD-UX-01 — La experiencia 4D cabe en la pantalla

Fecha: 2026-11-05 · Rama `feat/ft3d-8-ux4d-gate-d-2026-11-05` (base `0fe6453`) · **Gate D no aprobado: la aceptación
visual corresponde al propietario.**

Las dos capturas citadas en el encargo no llegaron adjuntas. El defecto se ha reproducido en la Preview con el mismo
escenario (FIXTURE A · Vivienda una planta · final del plan · 14 semanas), en las cuatro resoluciones pedidas. Las
capturas del «antes» son de esa reproducción (`ft3d-8-gd-ux-01/antes/`).

## 1. Causa concreta del problema de altura
1. **Altura del visor calculada con valores supuestos.** La fórmula era
   `clamp(320px, calc(100vh − 56px − 56px − 330px), 900px)`, pero los valores reales son una barra superior de 65 px,
   controles de 58 px y un panel inferior de 353 px. A eso se suma la franja de ayuda, de 54 px. La suma superaba
   siempre la ventana.
2. **Mínimo de 320 px.** Con 720 o 768 px de alto, el mínimo empujaba la tarjeta y el Gantt por debajo del borde.
3. **Tarjeta y Gantt sin altura propia.** La tarjeta podía crecer hasta casi la altura de la ventana
   (`max(300px, 100vh − 132px)`). El Gantt crecía con sus filas, y su leyenda y la ayuda 3D quedaban fuera de pantalla.
4. **Encuadre con multiplicadores fijos.** El encuadre no tenía en cuenta la proporción del visor:
   - abría ×1,35 por los medios de obra aunque ya se hubieran retirados, y por eso la vivienda final se veía pequeña;
   - en AUTO giraba alrededor de un punto desplazado, de modo que la vivienda describía un círculo por la pantalla.
5. **La franja vacía de las capturas** venía de esa misma suma: el visor tenía una altura fija mientras el resto de la
   columna se desbordaba.

Medidas del estado final (página frente a ventana):

| Ventana | Antes: página | Antes: fin de tarjeta y Gantt | Después: fin de la composición |
|---|---|---|---|
| 1280 × 720 | 919 | 796 (fuera) | 720 |
| 1366 × 768 | 925 | 802 (fuera) | 768 |
| 1440 × 900 | 1.057 | 934 (fuera) | 900 |
| 1920 × 1080 | 1.184 | 1.095 (fuera) | 1.080 |

Fuentes: `antes/medidas-antes.json` y `despues/medidas-despues.json`.

## 2. Cambios realizados (solo laboratorio FT3D-8; sin motores, geometría ni cálculos)
- **Composición ajustada a la ventana** (`labs/ft3d-8/ux.css`, escritorio de 761 px o más de ancho y 560 px o más de
  alto). Evolución ocupa exactamente la altura útil (`100dvh` menos la altura real de la barra superior, medida con
  `ResizeObserver`). Se reparte así:
  - el visor es flexible y protagonista;
  - los controles tienen altura fija;
  - la franja inferior tiene una altura proporcional (34 % del alto) y crece hasta el 46 % si el plan lo necesita
    para mostrar todas sus fases.
- **Tarjeta:** la semana, la fecha, el estado y el titular quedan fijos. Los trabajos y los importes se desplazan
  dentro de la tarjeta (`.cardscroll`, accesible por teclado). Muchas tareas simultáneas ya no alargan la página.
- **Gantt (jerarquía):**
  - todas las fases son visibles cuando caben; la altura de fila se calcula con el espacio real, entre 16 y 24 px;
  - la escala temporal queda fija arriba;
  - la leyenda va **debajo** del plan, nunca encima de una fase;
  - con muchas tareas, el plan se desplaza dentro de su recuadro;
  - el cursor se dibuja dentro del recuadro también el último día.
- **Ayuda secundaria:** la leyenda 3D y la indicación «Pulsa una tarea…» pasan a una nota discreta dentro del visor.
  Ocupan una línea por concepto y, en ventanas bajas, solo se muestra la leyenda. Ya no restan altura al plan.
- **Titular compacto en alturas de 860 px o menos:** «LA OBRA, DÍA A DÍA | 14 SEMANAS» va en una sola línea, con
  cuerpo de 24 a 38 px según la altura. La barra de controles es más baja. Barra superior y controles van en una sola
  fila desde 1024 px, y el nombre y el origen se recortan con su texto completo al pasar el ratón.
- **Encuadre ajustado al visor real** (`project-scene.js`, `presentationPose`):
  - se proyecta un cilindro que rodea la vivienda (más 4,3 m si el plan tiene medios de obra: vallado, caseta y base
    de la grúa) con la proporción real del visor;
  - la vivienda se centra en la parte que deja libre el titular, a la izquierda o arriba según cuál la deje más
    grande;
  - el desplazamiento se aplica a la **proyección** (`setViewOffset`), no al mundo, así que en AUTO la vivienda
    permanece en su sitio en todos los ángulos;
  - se reencuadra al cambiar el tamaño, salvo con LIBRE o si el usuario ha movido la cámara;
  - el botón ISO encuadra lo que está en pie en ese momento;
  - en AUTO, al llegar al final del plan (medios retirados), la cámara se acerca a la vivienda terminada, y al
    retroceder vuelve al encuadre del recinto;
  - el modo de captura de las pruebas de fidelidad queda excluido.
- **Lectura de solo consulta `scene.screenBounds()`** para verificar el encuadre en las pruebas.

## 3. Justificación UX de la distribución
- **Una sola composición:** escena → momento (controles y fecha) → explicación (tarjeta y plan). Se lee de arriba
  abajo sin perder ninguna parte.
- **Jerarquía de tamaños:** primero la vivienda, después el plan completo, luego la tarjeta del momento y por último
  el titular compacto. La ayuda ocupa el lugar menos importante.
- **El detalle se consulta dentro de su panel,** así que la fecha y la tarea seleccionadas no se pierden.
- **Adaptación progresiva:** si el alto útil baja de 560 px (zoom del 150 % o más, ventanas muy bajas), se recupera la
  disposición apilada con desplazamiento de página. No se recorta ni se oculta nada. Esa disposición es la del móvil.

## 4. Pruebas de aceptación — `tests/ft3d-8-fit.browser.test.cjs` (9 de 9, Chromium)
Cada comprobación lee la **ventana visible** (`getBoundingClientRect` frente a `innerHeight`, con `scrollY` = 0).
Se comprueba que cada región esencial esté entera dentro de la ventana:
- el titular;
- el visor;
- reproducir;
- la barra temporal;
- la fecha;
- el sello del momento;
- la tarjeta, con su semana y su titular;
- el Gantt, con su escala;
- el cursor;
- la leyenda.

| # | Prueba del encargo | Resultado |
|---|---|---|
| 1 | Portátil 1366 × 768 | Inicio, reproducción, simultáneas y final: todo dentro, sin franjas vacías (las juntas visor/controles/panel miden 0 px), 11 de 11 fases visibles y la leyenda debajo |
| 2 | 1440 × 900 | Ídem, y la vivienda entera en pantalla |
| 3 | 1920 × 1080 | Ídem |
| 4 | 1280 × 720 | Ídem, con 11 de 11 fases |
| 5 | Reproducción | La fecha avanza, el cursor del Gantt se mueve y coincide con el día, y el visor sigue visible |
| 6 | Tareas simultáneas | 4 trabajos; cada uno se alcanza dentro de la tarjeta; la página no crece |
| 7 | Final del plan (escenario de las capturas) | Vivienda final, «FINAL · PLAN COMPLETADO», fecha, controles, tarjeta y Gantt a la vez; la vivienda ocupa la zona libre |
| 8 | Información ampliada | «Ver tareas y partidas» se abre y se cierra sin mover la página ni la fecha; todas las filas del plan son accesibles con la escala fija |
| 9 | Móvil 390 × 844 | Disposición apilada sin cambios: visor arriba, sin desplazamiento horizontal |
| — | Zoom | 125 % (1024 × 576): todo cabe, 11 de 11 fases. 150 % (911 × 512): disposición apilada, sin desplazamiento horizontal, todo visible desplazando la página |
| — | Redimensionar | Reencuadra la vivienda; con LIBRE se respeta la vista del usuario |
| — | Giro AUTO | En 8 ángulos, a 1366 y a 1920 px, la vivienda sigue entera y fuera de la zona del titular |
| 10 | Regresión completa | Véase §6 |

## 5. Evidencias (`docs/product/ft3d-8-gd-ux-01/`)
- `antes/`: base `0fe6453`, ventana visible, en 1280 × 720, 1366 × 768, 1440 × 900 y 1920 × 1080. Para cada una:
  inicial, reproducción, simultáneas y final.
- `despues/`, en las mismas cuatro resoluciones:
  - inicial;
  - reproducción en curso;
  - simultáneas;
  - final;
  - final con ISO.
- `despues/` incluye además:
  - detalle de partidas abierto (1366 × 768);
  - zoom al 125 % y al 150 %;
  - móvil.
- `comparacion/`: antes y después lado a lado en las cuatro resoluciones, para el final, las simultáneas y la
  reproducción.
- Todas las capturas son de la **ventana visible**, no de la página completa.

## 6. Regresiones (local, Chrome completo como en la CI)
| Suite | Resultado |
|---|---|
| Puras (`construction-*` y `ft3d-8-lab`) | 115 de 115 |
| `ft3d-8-fit` (nueva) | 9 de 9 |
| `ft3d-8-ux4d` | 20 de 20 |
| `ft3d-8-fidelity` (frente al editor real; IoU de A, B y C: 0,95 a 0,97) | 6 de 6 |
| `ft3d-8-delivery` (vídeo real, descarga y reproducción) | 6 de 6 |
| `ft3d-8-dossier` | 6 de 6 |
| `ft3d-8-lab` | 2 de 2 |

No ha cambiado nada en expediente, identidad, planificación, presupuestos, vídeo ni entrega. El vídeo usa su propio
encuadre a 1280 × 720 sin desplazamiento de proyección. La suite nueva se añade al workflow con el artefacto
`ft3d-8-fit-evidence`.

## 7. Accesibilidad
- No hay ningún texto esencial por debajo de 10,5 px. La leyenda del Gantt es de 10,5 px y las filas, de 11 a 13 px.
- La lista de trabajos con desplazamiento propio se puede enfocar y tiene nombre accesible.
- Tarea → momento sigue funcionando con teclado en el Gantt.
- No se bloquea el desplazamiento de la página: los créditos técnicos siguen debajo de la composición.
- En ventanas bajas o con zoom grande se recupera la disposición apilada.

## 8. Limitaciones que permanecen
- **Gantt estrecho.** A 1024 px de ancho, las etiquetas de semana del Gantt se recortan («SEM 0…») por falta de
  ancho, y el plan pasa a desplazarse en horizontal dentro de su recuadro.
- **Encuadre del recinto.** Con medios de obra, AUTO encuadra todo el recinto durante la obra, así que la vivienda se
  ve más pequeña que sin ellos. El mástil y la pluma de la grúa pueden salir del encuadre, como en la referencia.
- **Planes largos.** Un plan con muchas más tareas que el de K no muestra todas las fases a la vez: el plan se
  desplaza dentro de su recuadro, con un máximo del 46 % de la altura.
- **Capturas originales.** No se han recibido las capturas del propietario. La comparación usa la reproducción del
  defecto sobre `0fe6453`.
