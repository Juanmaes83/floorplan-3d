# RUBIK SOTA · Guía de auditoría, laboratorios e integración

**Corte de referencia: 27/11/2026.** Documento de continuidad para Claude Code, Codex y el propietario. Úsalo para retomar la auditoría, identificar mejoras recuperables y preparar candidatas comprobables.

## Identidad del producto y orden de lectura

| Identidad | Referencia |
|---|---|
| Repositorio madre | [Juanmaes83/floorplan-3d](https://github.com/Juanmaes83/floorplan-3d), rama `master` |
| Base de esta auditoría | [`dacb5d395abf32449102d73ffd03200e6c09c019`](https://github.com/Juanmaes83/floorplan-3d/commit/dacb5d395abf32449102d73ffd03200e6c09c019). Comprueba el remoto al retomar. |
| Vercel de producto | Equipo `juanma-espinosas-projects`, proyecto `floorplan-3d`, ID `prj_x19F1PyprdHvDRbAv3lJW5GXlL0k`. [Producción comprobada en el corte](https://vercel.com/juanma-espinosas-projects/floorplan-3d/AtRK5FP79yQSdQjRNWbXxtt13eYd). |
| Laboratorio separado | [Juanmaes83/rubik-sculpt-simulator-lab](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab), privado. Fuente de ensayos, evidencias y piezas candidatas. |
| Laboratorios del repositorio madre | [`labs/` en la base](https://github.com/Juanmaes83/floorplan-3d/tree/dacb5d39/labs). Su presencia en Git no garantiza disponibilidad en Preview. Comprueba [`.vercelignore`](https://github.com/Juanmaes83/floorplan-3d/blob/dacb5d39/.vercelignore) y los recursos servidos en el SHA de prueba. |

Antes de usar la evidencia de una Preview, comprueba repositorio, rama, SHA, ID de Vercel y destino del despliegue. Si la evidencia procede de otro proyecto, úsala como referencia del donante y repite la comprobación en el destino real de RUBIK. El inventario distingue el entorno de ensayo del lugar donde vivirá la mejora.

Lee el [protocolo de coordinación](../agents/PROTOCOLO-COORDINACION-MULTIAGENTE.md), la [continuidad operativa](CONTINUIDAD-OPERATIVA-VIGENTE.md), el [encargo de reutilización](ENCARGO-REUTILIZACION-CINCO-REPOS-BLENDER-STORYLAYERS.md) y el [checkpoint de Claude](https://github.com/Juanmaes83/floorplan-3d/blob/b2caa2521589afd0f1a5f5afb883e69c052828aa/docs/qa/cabecera-proyectos/CHECKPOINT-REANUDACION.md). Empieza por las aprobaciones ya registradas y por los ensayos con una hipótesis concreta de valor.

Objetivo: determinar el beneficio de cada mejora frente a master y preparar únicamente candidatas comprobables. Este documento define auditoría, evidencia y decisión. El propietario autoriza la fusión del SHA exacto tras la revisión de Claude, Codex y el propietario.

**Continuidad del 27/11.** La base remota sigue en `dacb5d39` (árbol `0ba3d186b70e965c4dd2ec1ec4f4c79ba5efaefd`). La [PR #324](https://github.com/Juanmaes83/floorplan-3d/pull/324) reúne Cabecera, D3, P2, cuadrícula P8–P10 y la muestra de estilos, con las aprobaciones visuales de las Previews originales. Consulta el [dictamen y los pasos de reanudación](HANDOFF-GESTURE-LABS-Y-CANDIDATAS.md#estado-de-integración) para la dependencia de StoryLayers y la validación conjunta. Gesture Labs queda en su rama, con cámara física pendiente. Su objetivo, donantes y aceptación están en el [handoff ampliado de Gesture Labs](HANDOFF-GESTURE-LABS-Y-CANDIDATAS.md).

## A. Ramas publicadas y qué comparar

### 1. BC3 §5.2
Rama: claude/ux-bc3 · a9bac71854272b88d23bcdbde337ced5c4ba37a4.
Handoff: docs/qa/ux-bc3/README.md. Preview aprobada: cb51c9a1.
Compara Presupuestar → Precios de referencia con el mismo BC3 sintético. Busca ROBLE en Zona B, comprueba el filtro y el bloqueo de ROBLE-UD, cancela, revisa el desglose de cantidad y merma, aplica y recarga. La candidata debe conservar la persistencia de precios que ya entró en master por #323. Graba qué mejora al elegir y aplicar el precio y comprueba fuente, historial y estado «sin revisar».

### 2. Analizar y Presupuestar §5.3
Rama: claude/ux-presupuestar-analizar · 32de044cd9cd6a6ec2c58d0f63fb97049d693ddb.
Handoff: docs/qa/ux-presupuestar-analizar/README.md. Preview aprobada: 852e0f44. Regresión local publicada: e31a9264, 153/153.
Compara el plan vacío, el borrador con una tarea y el plan revisado. Demuestra el cambio de estado al cerrar sin recargar. En Analizar comprueba «Comprobar el plano», el acceso a la puerta y a la estancia, las imágenes de Cantidades y Exterior y el contador de revisión. La detección de fachadas por sí sola no debe contar como revisión. Conserva «Ver estancia» para alturas ausentes. La edición manual de altura libre queda fuera de este corte.

### 3. StoryLayersV1 / P10
Rama: claude/storylayers-v1 · cd694e88bbf1d6d2ea08883cea58aa8b096637d0.
Handoff: docs/qa/storylayers-v1/README.md. Aprobados el flujo desde la variante, la propuesta comercial y la asistencia demostrada.
Compara con una variante que tenga un cambio guardado. Graba P10 → editar variante → volver al mismo capítulo → previsualizar → descargar. Comprueba identidad de Mi estudio, datos de cliente, notas internas excluidas y correspondencia entre vista previa y archivo. Audita este corte por separado: Cabecera, D3/FOT-01 y Gesture Labs nacen de StoryLayers, pero sus cambios adicionales tienen otra revisión.

### 4. Visita 3D §5.1
Rama: claude/ux-visita-3d · e20644b9b23341b0d27424cf3e0380ca8c6f6f94.
Handoff: docs/qa/ux-visita-3d/README.md. Preview aprobada: 8136afe0.
Compara entrada, captura del ratón, Esc, controles en pausa, reanudación desde el mismo encuadre y salida. Revisa también el encuadre y el menú de Fachadas. La evidencia local publicada es 439 correctas, 21 omitidas y un fallo P16 reproducido en su base. Comprueba qué ocurre con P16 en la base efectiva y en la candidata de integración.

### 5. Muros §7.1, A0 y OP-07
Ramas:
- claude/muros-forma-descubrible · 94f5b981b466033a5ef966a6a3e2dadcb193edee.
- claude/geometria-composicion · eb5723d4e9cd186a236a658835c77d69ea298d4b.
- claude/a0-resizeobserver-causa · 7d07c34ef4d8e7635a5015a8403647e5281308af.
- claude/preview-muros-op07-activo · d4e2a733987a229cb86d5ddb41cdf345da621627, referencia de la prueba humana.
Handoff: docs/qa/geometria-composicion/README.md. A0: https://github.com/Juanmaes83/floorplan-3d/pull/310

La UX de Muros está aprobada. Comprueba qué necesita para funcionar sobre master, y qué pertenece a la composición con A0 y OP-07. Demuestra Recto/Curvo, asa, cota legible, Enderezar, coherencia 2D/3D y guardar/reabrir. Para A0, revisa por separado concurrencia, protección de escritores y resultados en los navegadores exigidos sobre la composición exacta. La CI cruzada histórica sirve como evidencia de su SHA. La Preview con OP-07 activo sirve como evidencia visual. F0.2c/F0.3 y la migración conservan sus gates y autorizaciones propios.

### 6. Cabecera §9
Rama: claude/cabecera-proyectos · fccda24bfe164af69320ff7babcf89f9f7cfa6f5 (código de descarga). Checkpoint posterior: b2caa2521589afd0f1a5f5afb883e69c052828aa.
Handoff: docs/qa/cabecera-proyectos/README.md. El SHA incluye la retirada del JSON editable de «Exportar diseño».
Compara la cabecera y los destinos de abrir, importar, copiar, crear variante y descargar. Graba Proyecto ▾ → Descargar proyecto JSON → confirmación → paso «Hecho» → reimportar. Comprueba «Guardado local», «Escena 3D» frente a «Revisar en 3D», vuelta única al mismo capítulo P10 y «Distancia conocida» a 360×800 y 390×844. Vincula la regresión al código final. G-02 y P16 eran fallos de base en el contraste anterior; acredita su estado en la comparación actual.

### 7. D3, P2/FOT-01 y P8–P10
Rama: claude/entregar-asistencia · 70b7206af571c0192296e739fde73b63198b5388 (D3/P2/P8–P10). El sucesor 7b2e01ab13a5b3b1be65ec8a80cb6b4cf42f4eac añade el rotulado editorial de estilos en Home y la propuesta comercial todavía en borrador.
Handoffs: docs/qa/entregar-asistencia/README.md y docs/qa/render-ai/README.md.
El corte publica D3 en tres pasos, una acción real de P2 y tarjetas P8 → P9 → P10 con plantilla común. Compara:
- D3: preparar cliente y contacto, redactar, revisar y guardar PDF. Verifica qué ve el cliente, qué datos quedan reservados y cómo se vuelve desde «Preparar imágenes».
- P2: «Vistas preparadas» como estado, acción que abre el panel, contenido accesible hasta el final y ambos casos de fotografía con la intención correcta. Comprueba que el ejemplo 3D y la simulación se distinguen.
- P8–P10: orden visual y por teclado, tamaños y alineación, miniatura de P10 y guía completa accesible en su detalle.
Comprueba las regresiones de Entregar y photo-project sobre la candidata conjunta.

### 8. Gesture Labs / Presentación con gestos
Rama: `claude/gesture-labs` · `9238429cae294ee6f88fbaa95d11fd0e52873650` (handoff), código de Preview `e72f34ddf9e24c4e2afdb78500e41dd26c99fdc2`.
Consulta el [handoff de Claude](https://github.com/Juanmaes83/floorplan-3d/blob/9238429c/docs/qa/gesture-labs/README.md) y el [handoff ampliado](HANDOFF-GESTURE-LABS-Y-CANDIDATAS.md). El objetivo de P11 es que el profesional pueda ensayar y el cliente completar el recorrido sin ayuda, con una viñeta por paso y un botón equivalente. La ruta principal usa una revisión para pasar de plano enrollado a plano abierto y al 3D de la misma estancia. «Antes y después» es opcional y requiere una variante. Home y P1 dan acceso a la experiencia.

El siguiente ensayo recomendado es el giro de la maqueta a partir de Bola de Imagen. El pulgar arriba, la distancia entre manos, el marco de dedos y los recorridos inmobiliarios tienen fuentes verificadas y alcances propios en el handoff ampliado. La prueba de aceptación es una grabación continua con cámara frontal física desde P11 hasta salir. En su futura candidata, conserva la cuadrícula P8–P10 aprobada y valida P11 dentro de la misma maquetación.

### 9. Rodaje: tapicería v3 y Película del proyecto
Rama: claude/rodaje-cierre-1440 · 6e59b6a397fab78ba917ad6c820dca0910ba71ac (cronología y modo de rodaje). El sucesor 67e147e9eb45946acacb51a2368be6f3d64f6e22 publica tres fotogramas de control, con el clip aún en cola.
Corte de aprobación visual del sofá: 7cc3529a7deab23f29ec2eb6d4ec24c3acdc5313.
Handoffs y evidencia: docs/qa/rodaje/ y docs/qa/pelicula-proyecto/.
Evalúa si el acabado de tapicería aprobado puede recuperarse como un delta aislado sobre el kit vigente. Compara misma escena, encuadre, luz y movimiento, con el report del material y coste de render. «Película del proyecto» es un módulo distinto de P8 Blueprint 3D. Su aprobación requiere un clip 720p sin sonido con la transición completa de plano a volumen e interior, trazado al ZIP y al report de la misma revisión. Mantén diferenciados la aprobación del sofá, el MP4 de 2 s a 1440p y la película nueva.

## B. Trabajo local y repositorio de laboratorio

Ubicación en el equipo de Codex. `RUBIK_WORKSPACE` es la raíz local que contiene las copias de trabajo de floorplan-3d.
`RUBIK_WORKSPACE\rubik-ci-activacion`

Es una ruta de Windows. Desde tu sesión remota necesitarás acceso al repositorio correspondiente o una copia con SHA y base que te entregue Codex. Un enlace al handoff no sustituye al código. Si no puedes abrir una fuente, marca esa fila «Pendiente de recibir el delta» y sigue con el resto.

- `codex/bpdp-home-demos` · f32ea585a5d6a0221c775e941e19371bde788df8. Padre 6418659e82bc0090d4b2d9ce8fd092e948707bc4. Añade dos MP4 de ejemplo y portadas, el reproductor de demostraciones en `js/guide-ui.js` y pruebas. Compara Home → demos actuales de Blueprint 3D y Despiece. Decide si aportan valor como vídeo, cómo conviven con la demo interactiva y cómo se integran en la Home actual con carga, móvil, teclado y regreso comprobados.

- `codex/bpdp-cancel-webgl-norte` · c124fe4575695a0b78d5bce12d34135cbbf88e0d, con 9d62a01b417cfcd69e58cbeb3cf1c8447aff3b2c y 4aaf320fa6d7803035fb7587c161f08c3be7d5e7. Los commits están también en el repo privado https://github.com/Juanmaes83/rubik-sculpt-simulator-lab. Su código antiguo está en `BP-DP/premium/runtime/`. Compara con `bpdp/` de master: norte declarado, identidad del proyecto activo, regreso a Entregar tras un fallo de WebGL y cancelación de una lámina sin generar una salida. Dictamina cada comportamiento por separado. La evidencia de composición anterior está en el mismo repo de laboratorio, commit 37567394aeff9cabd7de9ccf4ce3c94546d2a94a.

- `codex/op11-lote02-local` · 3694501f30b51098d343832caf2536347ace6288. Padre c20a2ac575b367502c4dc17af1d9b5d364b91dab. Seis GLB Kenney, manifiesto `assets/f3/op11-lote-02.manifest.json`, catálogo, búsqueda y pruebas. La variante local de composición es `codex/op11-lote02-post294-effective` · 0dd1ee9526ac75ebc3d1ca002736dfe2734ca47a. Compara los seis modelos con el catálogo F3 actual: duplicados, procedencia por archivo, escala, inserción, guardado y exportación. Da una decisión por modelo.

- A0 local: en el mismo checkout, `codex/a0-fence-post314` · d45e579a, `codex/a0-fence-post305` · 163e1f7e y `codex/a0-validacion-post300` · 573013db. Son composiciones alternativas para contrastar con #310 y la corrección de ResizeObserver, no tres mejoras independientes. Identifica qué evidencia sigue siendo útil y qué delta falta en la composición actual.

- PERLA y QA local: en el mismo checkout, `codex/integracion-perla-5835` · deb02e24 ajusta la visibilidad de la vigencia de Evolución en Entregar. `codex/ux312-auditoria-e01-e08` · f04aa79f y `codex/ux312-audit-f3b-f4a` · 59d0dd90 son evidencias de auditoría. Contrasta con PERLA ya integrado por #322. Conserva solo cambios funcionales o pruebas que cubran un hueco vigente.

- Studio local: `RUBIK_WORKSPACE\studio-presentation-lab` · HEAD 101fe167bd920c94c7e27938dfd3c22526dd9728, con un árbol de trabajo muy modificado. Referencia local de continuidad: `RUBIK_WORKSPACE\studio-presentation-continuidad` · c0b4a7d967e0cfed37a37f94b2229ee08a5f1658. Úsalo como material de recuperación. Codex identificará y aislará cualquier delta concreto antes de que lo evalúes. Las eliminaciones y archivos generados del árbol de trabajo no constituyen una candidata.

## C. Inventario de laboratorios y criterios de recuperación

### C.1. Fuentes que hay que revisar

1. En `floorplan-3d`, inventaría los ensayos de `labs/` en la base efectiva y las ramas de laboratorio. Revisa por separado los grupos `asesor-rubik`, `ft3d-8`, `gov07`, `m1-s2-s3`, `sculpt` y `ux07-ent04`, y los archivos de captura de plano y territorio. Identifica demos, pruebas, módulos parciales y el consumidor real de cada uno.
2. En el repositorio privado, empieza por el [handoff general de Simulator](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/99b0720a913478bea7dcbf0e3d58bd1b97806a6f/COMPONENTES/HANDOFF-SIMULATOR.md), rama `claude/sculpt-simulator-components`. Cruza cada componente con las PR de producto y los handoffs posteriores. `SOURCE_EXACT` es una referencia del donante. Conserva sus límites de licencia y acceso.
3. Contrasta las ramas y los commits aislados de Windows de la sección B. Si no tienes acceso, indica qué SHA, archivo o delta necesitas. Codex facilitará una copia verificada por un canal autorizado. El acceso a una copia privada y el permiso para publicar sus recursos son decisiones distintas.

### C.2. Primeros hallazgos que requieren dictamen

| Bloque y fuente | Qué quedó demostrado | Qué comparar ahora y cómo decidir |
|---|---|---|
| **Simulator D** · `codex/simulator-d-qa`, [`eae7d5f3`, `scripts/capture/simulator-d/HANDOFF.md`](https://github.com/Juanmaes83/floorplan-3d/blob/eae7d5f3/scripts/capture/simulator-d/HANDOFF.md) | Captura con reloj virtual y comparación de fotogramas, acreditadas en una base anterior. El delta de QA seguía fuera de `master` en el corte. | Evalúalo primero como **herramienta interna de QA**. Repite una captura de un recorrido vigente con el mismo proyecto y estado. Mide si mejora la reproducibilidad frente a la captura actual. Acredita que la prueba conserva el proyecto y sus datos. Dictamina qué parte conviene recuperar y si merece entrar en una suite interna. |
| **OP-05 GLB privados P1–P4** · [`claude/op05-lab-p1p2` · `56c9f203`](https://github.com/Juanmaes83/floorplan-3d/tree/56c9f203) y [`claude/op05-lab-p3p4` · `968fcec5`](https://github.com/Juanmaes83/floorplan-3d/tree/968fcec5) | P1/P2 estudian carga privada y referencias. P3/P4 amplían visor en memoria, grabación y salidas. Los handoffs mantienen **C1 en NO-GO**. | Separa carga, visor y salida. Compara con los activos y exportaciones actuales en el editor. Con datos sintéticos, acredita qué queda en memoria, qué persiste y qué sale a un enlace, ZIP, Blender o grabación. Identifica piezas aislables, condiciones de persistencia y privacidad y motivos para mantener en cola el flujo completo. OP-11 lote 2 es un corte de catálogo separado de este flujo privado. |
| **Blueprint 3D y Despiece** · `bpdp/` ya presente en master. [Correcciones del laboratorio en `c124fe45`](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/tree/c124fe45) y [evidencia de composición `37567394`](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/commit/37567394) | En el laboratorio se trabajaron norte declarado, identidad activa, cancelación y recuperación ante fallo de WebGL. Hay otras piezas como las demos de Home, descritas en B. | Prueba cada comportamiento por separado desde P8/P9 en Entregar y desde las demos de Home cuando corresponda. Verifica nombre y revisión activos, norte con y sin dato, cancelación sin descarga y vuelta con el contexto conservado si falla WebGL. Mantén el estilo vigente. Recomienda solo las correcciones ausentes. La película de §11 conserva su identidad audiovisual. |
| **Studio E3 y Simulator E** · [#299](https://github.com/Juanmaes83/floorplan-3d/pull/299) y [#291](https://github.com/Juanmaes83/floorplan-3d/pull/291) | El producto ya contiene los alcances fusionados. | Contrasta los handoffs de laboratorio con esos alcances y busca únicamente diferencias útiles no absorbidas. Studio local muy modificado se trata como recuperación por pieza. |
| **Simulator A, B, C y HERO** · [Handoff de componentes](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/99b0720a/COMPONENTES/HANDOFF-SIMULATOR.md), [#295](https://github.com/Juanmaes83/floorplan-3d/pull/295), [#313](https://github.com/Juanmaes83/floorplan-3d/pull/313), [#293](https://github.com/Juanmaes83/floorplan-3d/pull/293) y [#311](https://github.com/Juanmaes83/floorplan-3d/pull/311) | Ya hay PR fusionadas en esos ámbitos. Un merge acredita código incorporado, con el alcance y estado de activación que se verificaron para ese corte. | Revisa los residuales por capacidad y confirma qué está accesible desde el recorrido real. Marca experimentos históricos, funciones incorporadas y diferencias recuperables. |
| **Simulator F** · [handoff de sonido](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/99b0720a/COMPONENTES/F-sonido/HANDOFF.md) | Ensayo opcional, fuera del producto en el corte. | Aplazar o descartar salvo un caso con beneficio observable y coste proporcionado. Mantén la primera película a 720p sin sonido según su encargo. |

Por cada ensayo adicional registra origen, SHA, ruta, estado (fuente, ensayo parcial, probado, ya incorporado o pendiente de contraste), qué problema resolvería, destino propuesto (producto, QA interno o referencia), evidencia, condiciones y responsable. Una carpeta o un vídeo no basta para acreditar una capacidad de producción.

## D. Cómo acreditar cada dictamen

- Compara la base y la candidata con el mismo proyecto sintético, datos, tamaño de pantalla y navegador. Usa Playwright o Playwright CLI con Chromium, y añade los navegadores exigidos por el bloque cuando afecte a persistencia, cámara, WebGL u otros comportamientos de navegador.
- Captura antes y después en escritorio y móvil cuando cambie la interfaz. Graba desde la entrada real de RUBIK hasta la acción, el resultado y la vuelta. Para una función sin cambio visual, acredita el comportamiento con una prueba reproducible y su evidencia. Enlaza cada foto, vídeo o resultado al SHA exacto.
- Contrasta con la UI/UX aprobada de la plataforma: jerarquía de acciones, primario en vino donde corresponda, secundarias, tarjetas y paneles, maquetación, navegación de vuelta, foco, contexto del proyecto, idioma y convivencia con el Asistente. Una capacidad útil de una rama antigua debe demostrarse con la experiencia de RUBIK actual.
- Distingue pruebas locales, CI, Preview Vercel y aprobación humana. Un desplegado READY permite revisar la interfaz. La recomendación de integrar exige evidencia de las regresiones aplicables sobre la composición exacta. Separa cualquier fallo reproducido en la base; un fallo nuevo queda pendiente de resolver.

## E. Entrega y decisión entre los tres

Entrega una tabla por mejora con: ubicación y SHA, qué hace master, beneficio comprobado, diferencias de UI/UX, enlaces a evidencia, pruebas, dependencias y decisión motivada: «Preparar candidata», «Extraer solo este delta», «Ya incorporado», «Aplazar» o «Descartar». Si hay un bloqueo, indica exactamente qué falta para emitir el dictamen.

Claude entrega la recomendación técnica y la evidencia. Codex revisa el delta y valida de forma independiente el recorrido en la misma candidata. El propietario y Codex validamos visualmente si merece entrar. Cuando los tres estemos conformes, el propietario autoriza la fusión del SHA exacto. Si cambia la base o el código, identifica qué evidencia requiere repetir antes de pedir esa autorización.


## F. Checkpoint para que otro agente retome

Actualiza el handoff de tu rama o el registro de la candidata después de cada bloque. Deja una fila por mejora con: ID, repo y SHA de origen, base de producto, SHA y árbol de la candidata, entrada en RUBIK, proyecto de Vercel si aplica, evidencia, resultado por navegador, decisión y siguiente acción. Registra la fecha, quién comprobó cada cosa y dónde están los informes completos.

Conserva las aprobaciones ya dadas como evidencia histórica del corte exacto. Antes de proponer la fusión, registra la conformidad técnica de Claude y Codex, la revisión visual de Codex y del propietario, y la autorización final del propietario para el SHA. El examen grabado de cinco proyectos va al final sobre la candidata común.

Si se compacta la sesión o cambia el agente, el checkpoint debe permitir retomar sin reconstruir decisiones de memoria. Empieza por leerlo, comprobar los SHA remotos y ejecutar el primer paso pendiente registrado.
