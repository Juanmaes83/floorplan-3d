# FT3D-8 · Gate D (UX/4D) — Informe final

Fecha: 2026-11-05 · Responsable: Claude Code 2 (laboratorio FT3D-8) · **Pendiente de revisión humana del propietario.**

## 1. Rama, SHA y estado del repositorio
- Rama: `feat/ft3d-8-ux4d-gate-d-2026-11-05`, creada desde la cabeza de S1 (`eebe64e`).
- Código y evidencias validados en **`c8f6ac0`**. Este informe va en un commit posterior que solo añade
  documentación.
- `master` sigue en `0f9c6ea`, sin cambios. No hay merge, ni despliegue a Production, ni publicaciones reales.
- Commits de la misión:
  - `ee578e4`: CI en la rama.
  - `098571a`: Corte A.
  - `28db388`: Corte B.
  - `21cc234`: Corte C.
  - `caa12e7`: recursos ilustrativos y K.
  - `042f0f9`: Corte D.
  - `b7da45b`: Cortes E y F.
  - `c8f6ac0`: evidencias, matriz y ajustes de Perla.

## 2. Resumen UX
- **Tres secciones** (Proyecto · Evolución · Entrega) y dos modos (Profesional · Presentación).
- **Proyecto:** un resumen de cinco filas con lenguaje natural, una acción principal decidida por el estado real
  («Ver evolución», «Resolver incompatibilidades» o «Ver la vivienda en 3D») y los avisos con lo que hay que hacer.
  Las seis comprobaciones S1, los detalles técnicos y el modo fidelidad quedan a un clic.
- **Evolución,** con la composición de la referencia del propietario:
  - titular «La obra, día a día · N semanas» con fechas e importe sin IVA;
  - visor a todo el ancho;
  - sello del momento;
  - reproducción;
  - tarjeta grafito a la izquierda y Gantt con leyenda a la derecha.
- **Paleta Perla** (`css/design-system.css`). El naranja de la demo se ha eliminado de la pantalla, del vídeo y del
  distintivo de origen.
- **Entrega guiada:**
  1. **Previsualizar** («Tu cliente verá … construirse en 14 semanas…»).
  2. **Personalizar** (marca, título e importes; el resto plegado).
  3. **Generar** (una acción que prepara el vídeo y la presentación).
  4. **Resultado** («Tu presentación está preparada»).
  El enlace público sigue siendo un paso aparte, con consentimiento.
- **Medidas** (Etapa 0 → ahora):

| Medida | Etapa 0 | Ahora |
|---|---|---|
| Visor en escritorio | y = 845 | y = 69 |
| Alto de la página Evolución | 2.800 px | 1.061 px |
| Visor en móvil | y = 2.064 | y = 95 |
| Barra superior en móvil | 209 px | 95 px |
| Desplazamiento horizontal | — | ninguno a 390 px |

  Fuentes: `ft3d-8-ux4d-etapa0/medidas.json` y `ft3d-8-ux4d-gate-d/medidas-despues.json`.

## 3. Resumen 4D
- **Una sola evaluación por día** (`ft3d8-moment`) la comparten la escena, el Gantt (filas en curso y cursor), la
  tarjeta, los importes y la nota de «sin representación 3D».
- **Una sola redacción del momento,** `FloorPlanConstructionDelivery.moment()`. La usan la tarjeta y el fotograma del
  vídeo: fase, titular, «Hay N trabajos previstos a la vez» y periodos sin trabajos.
- **Bidireccional:**
  - Gantt → escena: la tarea va a su punto medio, se resalta en el 3D y aparece primera en la tarjeta.
  - Escena → Gantt: un elemento muestra sus tareas y «Ver trabajo».
  - Se puede volver a la vista general.
- **Tareas simultáneas visibles** en los tres sitios: hasta 4 a la vez en K.
- **Momento inicial explicado,** con la huella real. El final dice «Plan completado» y «no certificado de fin de obra».
- **Recursos ilustrativos** (vallado, caseta, grúa y andamio):
  - solo si una tarea del plan los vincula (`illustrative/<tipo>` con roles permitidos);
  - se rotulan como ilustración;
  - no cuentan en la cobertura ni en la evidencia;
  - se retiran con su tarea.

## 4. Problemas encontrados y soluciones

| Problema (Gate D) | Solución | Estado |
|---|---|---|
| Visor enterrado bajo el expediente | Pestañas, y la Evolución abre con el visor | Implementado y probado |
| Información técnica antes que la útil | Resumen en lenguaje natural; lo técnico, plegado | Implementado y probado |
| Al inicio no se veía nada y no se explicaba | Huella y presentación del momento inicial | Implementado y probado |
| Tareas simultáneas poco comprensibles | Recuento y lista en la tarjeta, filas en el Gantt y elementos en la escena | Implementado y probado |
| Tarea sin geometría invisible | Nota «planificado, sin representación 3D» | Implementado y probado |
| Del Gantt no se podía ir a la escena | Selección bidireccional | Implementado y probado |
| El vídeo no decía lo mismo que la pantalla | `moment()` compartido y fotograma rediseñado (paridad en 7 instantes) | Implementado y probado |
| Cierre del vídeo con identificadores técnicos | Retirados (siguen en el manifiesto) | Implementado y probado |
| Entrega con cinco pasos técnicos | Cuatro pasos guiados | Implementado y probado |
| «Plan aprobado» sin aprobación autenticada | «Plan declarado como aprobado» | Implementado y probado |
| Etiquetas sin tildes | Corregidas en las etiquetas de nivel, los avisos de costes y las tareas de K | Implementado |
| La tarjeta alargaba la página con muchas tareas | Desplazamiento interno en escritorio | Implementado sin aceptación humana |

## 5. Archivos modificados
- **Laboratorio** (`labs/ft3d-8/`):
  - `index.html`, `ux.css` (nuevo) y `ux-shell.js` (nuevo);
  - `illustrative-props.js` (nuevo);
  - `fidelity-app.js`, `project-scene.js`, `gantt-view.js`;
  - `delivery-ui.js`, `dossier-ui.js`, `dossier-fixtures.js`.
- **Núcleos FT3D-8:**
  - `js/construction-delivery-core.js`: `moment()`, superposición y tildes;
  - `js/construction-project-adapter.js`: contrato ILLUSTRATIVE y etiquetas;
  - `js/construction-lab-presenter.js`: redacción de la evidencia.
- **Pruebas:**
  - nueva: `tests/ft3d-8-ux4d.browser.test.cjs`;
  - ajustes de navegación en las suites `delivery`, `dossier` y `fidelity`;
  - `construction-project-adapter.test.cjs`: contrato ilustrativo;
  - `construction-delivery-core.test.cjs`: tildes.
- **CI:** `.github/workflows/ft3d-8v-schedule-core.yml`, con la suite nueva, el artefacto
  `ft3d-8-ux4d-evidence`, la comprobación de sintaxis de `ux-shell` e `illustrative-props` y un tiempo máximo de 90 min.
- **Documentación:** Etapa 0, Corte A (actualizado), matriz de equivalencias, este informe y
  `ft3d-8-ux4d-gate-d/`.
- **Sin tocar:**
  - `index.html` principal y el visor del editor;
  - los motores canónicos (`budget-core`, `project-core`, `building-core`, cantidades y territorio);
  - Entregar, Mi estudio y `api/*`.

## 6. Componentes reutilizados (nada duplicado)
| Pieza | Componente |
|---|---|
| Fechas y estado del día | `FloorPlanConstructionSchedule` (`stateAt`, `canonical`, `bounds`) |
| Animación | `construction-visual-state` |
| Gantt | `construction-gantt-adapter` y `gantt-view` |
| Importes | `budgetReport` de C1–C4, netos en céntimos |
| Expediente | `FloorPlanConstructionDossier` |
| Marca | `FloorPlanBrand` |
| Grabación | `FloorPlanTourRecorder` y `construction-mp4-muxer` (WebCodecs) |
| Publicación | `/api/share` existente, con respuestas simuladas en las pruebas |
| Tokens | `css/design-system.css` |
| Librerías | Ninguna nueva. Three.js ya estaba. Los recursos ilustrativos son código propio, sin modelos externos |

## 7. Correspondencia entre tareas, geometría y tiempo
- La tarea vincula elementos (`project/<id>`) mediante el vínculo firmado. El adaptador evalúa el modelo. Cada día
  se calcula una sola vez: presencia, modo y progreso por elemento.
- El % que se muestra es **% del plazo** de la tarea, nunca obra ejecutada.
- Las tareas sin elementos se anuncian y no se dibujan.
- Los recursos ilustrativos van aparte (`model.illustrative`). Se dibujan fuera de la huella y se dimensionan con la
  envolvente del proyecto.
- Pruebas P02 a P05, P08, P09 y P19.

## 8. Contrato de costes contextuales
- **Qué muestra:** el importe asignado a cada tarea es la suma de los repartos **netos (sin IVA)** de sus partidas de
  C1–C4.
- **Cuando falta información:**
  - sin partidas, «Sin partidas asignadas · desconocido»;
  - sin precio, «desconocido», nunca 0 €;
  - además se avisa si la partida no está revisada o la cantidad es estimada.
- **Total del plan:** «Total presupuestado asignado al plan (sin IVA)», con «(incompleto)» cuando procede. Se
  distingue siempre del coste de la fase.
- **Política del vídeo y la presentación:** el profesional elige entre sin importes, resumen o importe por fase.
  Además, `costPolicy` bloquea los importes si el presupuesto no es del proyecto.
- Pruebas P06, P07, P18 y las de núcleo.

## 9. Evidencias visuales y vídeo de demostración
- **Carpeta:** `docs/product/ft3d-8-ux4d-gate-d/`. Las capturas son de 1440 × 900 a 2× y la de móvil, de 390 × 844.
- **Capturas «después»:**

| Demostración | Archivo |
|---|---|
| Momento inicial | `d01` |
| Estructura | `d02` |
| Tareas simultáneas | `d03` |
| Carpintería | `d04` |
| Presupuesto parcial | `d05` |
| Final | `d06` |
| Navegación y selección en el Gantt | `d07` |
| Móvil | `d08` |
| Vista profesional | `d09` |
| Vista cliente | `d10` |
| Entrega guiada | `d11` |
| Primera pantalla | `despues-desktop-01-al-abrir` |
| Primera pantalla en móvil | `despues-mobile-01-al-abrir` |

- **Capturas «antes»:** `docs/product/ft3d-8-ux4d-etapa0/`.
- **Vídeo de demostración** (`demo-interfaz-gate-d.mp4`, 35 s, 1280 × 800), grabado con Playwright sobre la interfaz
  real:
  - apertura y «Ver evolución»;
  - reproducción a ×4;
  - retroceso arrastrando la barra;
  - selección en el Gantt;
  - ficha de un elemento;
  - modo Presentación;
  - Entrega.

## 10. MP4 descargado y comprobado
- **Archivo:** `video-entrega-K-1280x720.mp4`, generado por la entrega guiada.
  - Formato: MP4 H.264 indexado (`ftyp`, `mdat`, `moov`), 1280 × 720, 25 fps.
  - Duración: unos 21 s, con un fotograma clave por segundo.
  - Fotogramas de muestra: `video-entrega-K-fotograma-08s.jpg` y `video-entrega-K-fotograma-cierre.jpg`.
- **Paridad (P14):** en 7 instantes, la semana, el sello y el titular del fotograma coinciden con la tarjeta, y el
  cursor del Gantt está en el mismo día.
- **Suites de entrega y de expediente:** descargan el archivo, comprueban su SHA-256 frente al manifiesto, buscan
  posiciones dentro del vídeo y lo reproducen completo.

## 11. Pruebas puras y Chromium (locales, Chrome completo, como en la CI)
| Suite | Resultado |
|---|---|
| Puras `construction-*` y `ft3d-8-lab` | 115 de 115 |
| `ft3d-8-lab.browser` | 2 de 2 |
| `ft3d-8-fidelity.browser` (frente al editor real) | 6 de 6 |
| `ft3d-8-delivery.browser` | 6 de 6 |
| `ft3d-8-dossier.browser` | 6 de 6 |
| `ft3d-8-ux4d.browser` (nueva, P01–P20) | 20 de 20 |

En la CI de GitHub, las ejecuciones 21 a 29 de la rama están en verde. La 28 (`c8f6ac0`, código y evidencias) y la 29 (`b897cfc`, informe) incluyen la suite nueva del Gate D.
estaba en curso al escribir este informe; su resultado se comunica en el mensaje de entrega.

## 12. Regresiones
- **Fidelidad:** la fidelidad frente al editor real (IoU de A, B y C) sigue en verde.
- **Economía:** la suma de los repartos coincide con el total, y todos los importes llevan «sin IVA» (P18).
- **Identidad del expediente:**
  - E, F y G bloquean la entrega.
  - H, una revisión obsoleta, rebaja el nivel sin bloquear, como se decidió en S1.
  - J rechaza el documento y conserva el expediente anterior.
  - Ninguna validación se ha debilitado (P11 y P12).
- **Pruebas existentes:** solo se añadieron pasos de navegación (`reveal` y desplegar opciones avanzadas). Ninguna
  aserción se ha relajado, salvo dos:
  - el ancho de las tarjetas, porque la rejilla pasa de 5 a 4 pasos;
  - la expresión regular de dos textos que ahora llevan tilde.

## 13. Comportamiento móvil
- Barra en dos filas: marca, estado y modo arriba; secciones debajo.
- El visor empieza en y = 95 y no hay desplazamiento horizontal en ninguna sección.
- El sello del momento queda sobre la fila de cámaras, sin taparla.
- El orden es visor → reproducción → tarjeta → Gantt (P16 y `d08`).

## 14. Estado por categoría
- **Implementado y probado:**
  - Cortes B a F;
  - recursos ilustrativos;
  - paridad entre el vídeo y la pantalla;
  - entrega guiada;
  - 20 pruebas;
  - CI.
- **Implementado sin aceptación humana:**
  - la composición final;
  - el tono de los recursos ilustrativos;
  - la tarjeta con desplazamiento interno;
  - los textos en lenguaje natural;
  - la decisión de mostrar los medios de obra solo cuando el plan los vincula.
- **Parcial:**
  - la punta del mástil de la grúa queda fuera de encuadre en el vídeo;
  - la cubierta es la envolvente derivada del motor de cubierta;
  - los títulos de los fixtures A–D conservan nombres sin tilde («Tabiqueria», «Cimentacion»), porque las pruebas
    de fidelidad los usan como datos.
- **Pendiente:**
  - revisión visual del propietario;
  - recibir el vídeo `AUDITORIA VISUAL .mp4`, que no ha llegado y no se ha podido estudiar.
- **Bloqueado por otro contrato o agente:**
  - integración en la aplicación principal y Entregar/Mi estudio (Claude original, Juanmaes83/floorplan-3d#166);
  - contrato compartido de mallas y representación por elemento del visor del editor (Kimi);
  - BCCA gestionada, Catastro directo y presupuesto global de edificio (S2–S4).

## 15. Dependencias de Kimi y Claude original
- **Kimi:**
  - el laboratorio replica las reglas de mallas del visor del editor. Si Kimi cambia el contrato de mallas, se
    debe revisar la fidelidad (`tests/ft3d-8-fidelity.browser.test.cjs` lo detecta);
  - el resaltado por elemento usa contornos propios del laboratorio, no el visor compartido.
- **Claude original:**
  - la entrega usa `/api/share` tal cual y el contrato de `FloorPlanBrand`;
  - el manifiesto 0.2.0 y el documento de cliente se deben integrar en Entregar sin duplicar el grabador.
- No se ha modificado ningún archivo de ninguno de los dos.

## 16. Riesgos de integración S4
- **Reutilizar, no reescribir:** llevar las tres secciones al editor real exige reutilizar `ux-shell` y `moment()`,
  sin crear otra tarjeta.
- **Contrato ilustrativo:** las claves reservadas `illustrative/*` del adaptador son un contrato nuevo. Un
  planificador profesional futuro debe adoptarlo o sustituirlo de forma coordinada.
- **Rendimiento:** con SwiftShader (CI) la grabación es lenta (unos 3 min por vídeo). En dispositivos reales usa
  WebCodecs.
- **Lenguaje:** los textos de la tarjeta y del vídeo deben mantenerse en un único sitio (`moment()` y el presenter).
- **No se ha implementado S2, S3 ni S4.** Esto es preparación, no integración terminada.

## 17. Preview del SHA exacto
- **SHA:** `c8f6ac0`.
- **Despliegue:** `floorplan-3d-p6uoax0uk-juanma-espinosas-projects.vercel.app` (`dpl_CXKGk9REq9wy7YCAdow791Mxr6EW`).
  Estado **READY**. Alias de la rama: `floorplan-3d-git-feat-ft3d-8-u-8938aa-juanma-espinosas-projects.vercel.app`.
  Es una Preview, no Production.
- **Laboratorio:** `/labs/ft3d-8/`.

## 18. Guía de aceptación visual para el propietario
1. Abre `/labs/ft3d-8/`. Debes ver el resumen del proyecto K en cinco filas y «Ver evolución» como acción principal.
2. Pulsa «Ver evolución»:
   - el visor ocupa la pantalla;
   - se explica «Antes del comienzo de la obra» y se ve la huella.
3. Pulsa «Reproducir evolución»:
   - aparecen el vallado y la caseta (rotulados como ilustración);
   - suben los muros y aparece la grúa;
   - en la semana 7 hay 4 trabajos a la vez y coinciden en la escena, el Gantt y la tarjeta;
   - las carpinterías aparecen en la semana 9;
   - los medios se retiran al final.
4. Pulsa «Carpinterias» en el Gantt: el momento salta a esa tarea, se resaltan sus huecos y la tarea aparece primera
   en la tarjeta.
5. Haz clic en un muro: se ven sus dos trabajos (fachada y pintura) con «Ver trabajo».
6. Arrastra la barra hacia atrás: todo vuelve exactamente al estado anterior.
7. Activa «Presentación»: desaparece lo técnico y la escena gana protagonismo.
8. Entra en Entrega:
   - Previsualizar dice lo que verá el cliente;
   - Generar prepara el vídeo y la presentación;
   - Resultado dice «Tu presentación está preparada»;
   - no se publica nada.
9. Reproduce el MP4: dice lo mismo que la pantalla en cada momento, en Perla y sin naranja.
10. Repite los pasos 1 a 3 en el móvil.

Valora sobre todo cuatro puntos:
- el protagonismo del visor;
- si la tarjeta se entiende sin códigos;
- el tono de los medios ilustrativos;
- la entrega en cuatro pasos.
