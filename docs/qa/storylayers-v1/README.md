# StoryLayersV1 · «Explicar el cambio al cliente» (Entregar › P10) · handoff

> **APROBADO por el propietario (revisión humana 26/11/2026)** en la Preview revisada: StoryLayersV1, incluido el recorrido
> desde P10 y la entrega comercial (§7.2, §7.3, §8.3; rama `claude/storylayers-v1`, `3d0f27b9`). La integración y sus
> comprobaciones siguen su proceso normal (no implica PR, fusión ni activación).

**Rama:** `claude/storylayers-v1` · **base:** master `dacb5d39` · **encargo:** §8 de
[`ENCARGO-…-BLENDER-STORYLAYERS.md` @ `121ad35a`/`94f5596a`] y aclaraciones del propietario. El documento externo
«Auditoría de referencias» **no estaba disponible** en el repositorio ni en la sesión: no se ha usado y queda registrado.

## Qué hace

1. **Entregar › P10 «Explicar el cambio»** abre un diálogo con dos revisiones guardadas del mismo proyecto (biblioteca:
   original y variante) dibujadas con **la misma planta, el mismo encuadre y la misma escala** (`FloorPlanRevisionCompare`,
   `viewBox` común).
2. **Capítulos** deterministas: qué cambia (superficie útil, estancias), superficie de cada estancia que cambia,
   distribución (muros añadidos o quitados), acabado de suelo, puertas y ventanas.
3. **Datos trazables**: cada dato lleva valor, unidad, fuente (campo del proyecto), revisión (lado + huella SHA-256) y
   estado; lo que falta se muestra **«Ausente»**, nunca 0. Rótulos numerados **anclados** al elemento visible (estancia,
   muro, abertura).
4. **Revisión profesional**: reordenar capítulos (↑ ↓), reescribir textos; editar no cambia los datos.
5. **Preparación** (modelo adaptado en limpio de `escaparates-pro/readiness.js`): imágenes listas ≠ historia guardada ≠
   historia **vigente**. Si cambia una revisión guardada, la historia queda **OBSOLETA**: no se guarda, no genera imágenes
   y no se descarga como vigente; ofrece «Rehacer con las revisiones actuales».
6. **Exportación**: PNG 1600×1000 por capítulo + `historia/manifiesto.json` (referencias durables a las entradas y sus
   huellas, cada dato con su fuente y revisión, huella SHA-256 de cada imagen), en un ZIP.
7. **Vuelta a Entregar** con Escape o Cerrar: misma ficha, misma posición y foco en «Explicar el cambio».

Fuera de alcance (posterior, según el encargo): vídeo y narración.

## Ejemplo exportado (datos sintéticos UX-07/ENT-04)

- [`ejemplo-exportado/rubik-historia-del-cambio.zip`](ejemplo-exportado/rubik-historia-del-cambio.zip): ZIP tal como lo
  descarga la interfaz en la prueba de navegador (`SL_EXPORT=<dir>`); 5 capítulos.
- [`ejemplo-exportado/manifiesto.json`](ejemplo-exportado/manifiesto.json): el manifiesto del ZIP, sin cambios, para leerlo
  en GitHub. Comprobación cruzada: el salón pasa de 21,53 a 23,11 m² y la superficie útil total de 87,18 a 88,76 m²
  (+1,58 m² en ambos); las cifras de superficie coinciden con una ficha independiente (fórmula del lazo escrita en la prueba).
- Capturas: [`capturas/`](capturas/) (escritorio ES, EN 1440, teléfono 390×844, historia obsoleta). Revisadas: sin texto
  en chino.

## Correcciones de este corte tras revisar las capturas

| Defecto visto | Causa | Corrección | Prueba que lo detecta (falla sin la corrección) |
|---|---|---|---|
| El botón **Asistente** tapaba «Descargar historia vigente» | El Asistente inserta su acceso como último elemento de todo modal, fijo abajo; la barra de acciones también lo está | Acceso en flujo tras las acciones (misma convención que `css/scene-export.css`) | «el acceso del Asistente no tapa acciones» |
| Con la historia obsoleta, «Descargar» **parecía** activa (estaba deshabilitada) | La acción principal conservaba su color | Acciones deshabilitadas con aspecto deshabilitado | «“Descargar” se ve deshabilitada» |
| En 390 px la tabla partía palabras letra a letra («Revisió n») | Seis columnas en un teléfono | Cada fila es una ficha «columna · valor» (`data-label`) | «en el teléfono cada valor lleva su columna» |
| Point9 (`professional-workspace`) falló una vez | Interferencia de otra batería en paralelo; en ejecución limpia pasa 23/23 con `perla-return` y `story-layers` | — | — |

## Pruebas

| Suite | Resultado |
|---|---|
| `tests/story-layers-core.test.cjs` | 5/5 (cifras contra ficha independiente, ausentes, revisión profesional, obsolescencia, manifiesto) |
| `tests/story-layers.browser.test.cjs` | 4/4 (recorrido completo, obsolescencia y cancelar, ES 390×844, EN 1440×900) |
| Regresión de Entregar y PERLA (`perla-return`, `professional-workspace`, `e2-comparativas`, `no-chinese-display`) | 40/40 en Chromium sobre `9aa99a40` y de nuevo **40/40 sobre `c805dc2f`** (plantilla §7.3 incluida; [TAP](regresion-entregar-perla-c805dc2f.tap)), ejecuciones limpias sin baterías en paralelo |

## Límites declarados

- Comparación por identificador: un elemento redibujado con otro identificador aparece como quitado y añadido (el
  manifiesto lo declara en `limits`).
- Escala no confirmada en una revisión → medidas orientativas (declarado en `limits`).
- Solo Chromium en esta rama; el recorrido no usa WebGL.

## §7 del encargo (`c14bd07a`) · decisiones del propietario y plantilla comercial

**Decisiones registradas (prueba humana sobre `0e7aff2d`):**
- Aceptado: detección del cambio y descarga.
- Rechazado: la calidad de la entrega para el cliente.
  - Relato en términos internos.
  - Huellas de revisión en la lámina.
  - Texto truncado a 120 caracteres en una línea («…la misma esca»).
- Pendiente: la entrega comercial requiere aprobación. Codex audita con el propietario antes de extender la personalización al
  resto de Entregar.

### §7.3 · Primera plantilla comercial (hecho en este corte)

«Mi estudio define la identidad. Cada entrega define la propuesta.»

| Pregunta del cliente | Cómo responde la plantilla |
|---|---|
| ¿Quién propone? | Instantánea de **Mi estudio** (`FloorPlanBrand.snapshot`): nombre, lema y logo, más solo el contacto que el profesional marca para esta entrega (persona, teléfono, correo, web). Sin identidad, la propuesta sale sin nombre ni logo y la interfaz lo avisa. |
| ¿Qué y dónde? | Título y resumen editables. El resumen por defecto sale de lo comprobado. Plantas **Estado actual / Propuesta** con el mismo encuadre, la zona señalada y «Qué cambia / Qué se conserva» en lenguaje natural. |
| ¿Por qué? · ¿Cómo? | Los escribe el profesional. Si faltan, la lámina dice «Pendiente de definir por el estudio». |
| ¿Cuánto cuesta? | Solo importes **trazables** de los presupuestos guardados de esas dos revisiones (`FloorPlanRevisionBudget.compareBudgets`), con IVA, la condición parcial y lo pendiente. Sin presupuesto, o si no corresponde a la revisión, no hay cifras: «Pendiente de valorar». |
| ¿Qué decidir? | Cierre editable. |
| Notas | Generales o de un capítulo, editables, reordenables y con visibilidad explícita **Para el cliente / Interna**. Una nota nueva es interna hasta que se elige lo contrario. Las internas no entran en ningún archivo del cliente, tampoco en su manifiesto. |

- **Previsualizar como cliente:** dibuja con la misma función las páginas que luego se descargan. La prueba compara los bytes
  de la vista previa y del ZIP. Si se edita algo después de previsualizar, la descarga se bloquea y se explica el motivo.
- **Ajuste de texto:** el texto se ajusta al ancho y continúa en otra página, sin truncar. Los títulos no quedan solos al pie.
- **ZIP del cliente:** `propuesta/NN-portada|pagina.png` en A4 apaisado a 150 ppp, más `propuesta/manifiesto.json` en
  lenguaje natural. No lleva identificadores, rutas de campos ni huellas de revisión.
- **Trazabilidad técnica:** la historia con identificadores, rutas y huellas, la propuesta completa y la huella de cada página.
  Se descarga aparte como archivo **INTERNO** y nunca entra en el ZIP del cliente.

**Muestra descargable (caso de control Baldosa → Moqueta):**
- [`plantilla-7-3/propuesta-baldosa-moqueta.zip`](plantilla-7-3/propuesta-baldosa-moqueta.zip): el ZIP tal como lo descarga
  la interfaz.
- [`plantilla-7-3/manifiesto-cliente.json`](plantilla-7-3/manifiesto-cliente.json).
- Páginas: [`muestra-pagina-1.png`](plantilla-7-3/capturas/muestra-pagina-1.png) y
  [`muestra-pagina-2.png`](plantilla-7-3/capturas/muestra-pagina-2.png).
- Editor: [`p10-propuesta-editor.png`](plantilla-7-3/capturas/p10-propuesta-editor.png).
- Vista previa: [`p10-vista-previa-cliente.png`](plantilla-7-3/capturas/p10-vista-previa-cliente.png).
- Móvil sin identidad: [`p10-propuesta-movil.png`](plantilla-7-3/capturas/p10-propuesta-movil.png).
- Texto largo en varias páginas: [`texto-largo-pagina-*.png`](plantilla-7-3/capturas/).

**Discrepancia registrada:** la prueba humana describe «Baldosa 800 → Moqueta», pero RUBIK muestra ese material
(`mat_tile800`) como **«Baldosa 80×80»**, que es el nombre visible del embudo `FloorPlanDisplayName`. La plantilla usa siempre
el nombre visible del producto.

**Pruebas:**

| Suite | Resultado |
|---|---|
| `tests/story-proposal-core.test.cjs` | 6/6 (incluye §7.2: mueble y otros ajustes) |
| `tests/story-proposal.browser.test.cjs` | 3/3 |
| `tests/story-layers-core.test.cjs` | 5/5 |
| `tests/story-layers.browser.test.cjs` | 4/4 |
| `tests/story-flow.browser.test.cjs` (§7.2, nueva) | 2/2 |
| `tests/story-assist.browser.test.cjs` (§8.3, nueva) | 1/1 |
| Regresión de Entregar, PERLA y vídeo del recorrido (`perla-return`, `professional-workspace`, `e2-comparativas`, `no-chinese-display`, `tour-video`) | Ver el informe del corte (TAP adjunto) |

Las pruebas `story-proposal` cubren:
- el caso de control, la identidad con los campos elegidos y la vista previa igual al archivo;
- la edición tras previsualizar, el texto largo en varias páginas y la visibilidad de notas;
- la ausencia de presupuesto, de identidad y de notas internas en el ZIP, y el móvil a 390 px.

**Límites:**
- El documento del cliente sale en español o inglés.
- Los textos que escribe el profesional no se traducen.
- No se ha probado con un presupuesto completo guardado de las dos revisiones: el núcleo lo cubre con datos sintéticos, pero
  falta el recorrido de navegador.
- **Preview humana identificada por SHA:** requiere el despliegue de Preview de Codex o del propietario; desde esta sesión no
  despliego.

### §7.2 · Guiar de la variante a la descarga (hecho en este corte)

**Obstáculo eliminado.** En `0e7aff2d` la persona tenía que salir de P10, buscar «Proyectos → Crear variante», volver a
Entregar sin saber cuál de los dos proyectos editaba y adivinar por qué «Descargar» no se activaba. Ahora el recorrido entero
empieza y acaba en P10, sin instrucciones externas.

| Estado | Ficha P10 «Historia del cambio» (pasos 1 → 2 → 3) | Acción principal |
|---|---|---|
| Sin variante | «Primer paso: crear una variante», con el original nombrado | **Crear variante**: el mismo paso que «Proyectos → Crear variante del proyecto abierto». Abre la variante en Diseñar con el original intacto |
| Variante idéntica | «Variante creada. Edita algo para mostrar el primer cambio.» | **Editar variante** (también desde el comparador) |
| Cambio guardado | «Cambios guardados en «variante» frente a «original»» | **Revisar el cambio** |
| Revisión guardada | «Revisión guardada: falta previsualizar y descargar» | **Continuar la historia** |
| Sin biblioteca o selección no comparable | Explicación | **Abrir proyectos** |

**Vuelta contextual**
- **En Diseñar:** barra «Editando la variante «…» · el original «…» se conserva» con **Volver a la historia**. Va bajo los
  controles del lienzo y no tapa ninguna acción pulsable, tanto en escritorio como a 390 px (lo comprueba la prueba).
- **Al volver:** RUBIK guarda primero y reabre la historia con el **mismo par y el mismo capítulo**, con el texto escrito.
- **Al cerrar la historia:** Entregar recupera la ficha P10 y el foco.
- **Desde la historia:** «Editar variante» guarda antes lo escrito, para no perderlo.
- **Cabecera:** con una variante abierta muestra su nombre. Antes decía «Proyecto de ejemplo» también en la variante.

**Comparador (`comparar/`):**
- Con el mismo par, ofrece **Editar variante** si la variante es idéntica.
- Si hay diferencias guardadas, ofrece **Preparar historia para el cliente**.
- Abre RUBIK en Entregar con esa historia y limpia la dirección. El comparador sigue sin escribir nada, y la holgura y sus
  comprobaciones técnicas no cambian.

**Revisión**
- Progreso **«Revisión sin guardar · 0 de 2 imágenes listas» → «Revisión guardada · 2 de 2 imágenes listas»**. El total se
  calcula antes de dibujar, con el mismo reparto en páginas que el archivo.
- Motivo de cada bloqueo y qué incluye el archivo.
- Una revisión obsoleta explica que **«Rehacer»** vuelve a comprobar el cambio y **conserva la propuesta**: título, textos y
  notas. Antes se perdía.

**Fallo encontrado y corregido en este corte:** quitar un mueble (el primer cambio típico de una persona) producía una
historia que decía «No hay cambios entre las dos revisiones». El núcleo solo explicaba superficies, muros, suelos y huecos.
Cambios:
- Nuevo capítulo **Mobiliario** (nuevos, quitados, movidos o cambiados), anclado al mueble.
- Capítulo **Otros cambios**, que cuenta lo que ningún capítulo detalla. Ningún cambio guardado se calla.

**Pruebas §7.2**
- **Nueva prueba bloqueante:** `tests/story-flow.browser.test.cjs`, 2/2, con perfil nuevo y el proyecto inicial. Recorre:
  - sin variante, crear, idéntica y editar;
  - un cambio real hecho como la persona (seleccionar un mueble y pulsar Suprimir);
  - la vuelta al mismo capítulo con su texto, y la cancelación sin escrituras;
  - guardar, previsualizar, descargar y abrir;
  - la obsoleta, rehecha con la propuesta conservada;
  - el comparador en sus dos estados.

  Todo en escritorio 1440×900 y móvil 390×844.
- **Núcleo:** `story-proposal-core` 6/6 (caso nuevo de mueble y otros ajustes).

Capturas en [`flujo-7-2/`](flujo-7-2/).

### §8.3 · Primera aceptación de la asistencia en StoryLayers (hecho en este corte)

**«Anounce».** En el repositorio no existe ningún módulo, ruta ni adaptador con ese nombre. Lo más parecido es **Nuance**:
- `labs/asesor-rubik/nuance-adapter.js`, `api/advisor-session.js` y `docs/qa/asistente-unificado/PREVIEW-NUANCE.md`.
- Es un asesor de **voz y avatar** para el cliente, con salida real **apagada**. Solo la activa el propietario en una Preview
  privada, con código de operador.
- No redacta textos para el profesional. Por eso no lo conecto ni lo anuncio en StoryLayers.

Como permite el encargo, la primera prueba usa un **adaptador de texto local**:
- Es `js/story-assist-core.js`, sin red ni modelo de lenguaje.
- Cada frase sale de un dato de la historia o del cliente, y la ayuda dice cuáles usó.
- Un adaptador autorizado futuro, como el Asistente IA con redacción, recibiría **exactamente** el contexto de
  `FloorPlanStoryAssist.context()`.

**Qué se ahorra el profesional**
- No reescribe en una nota los hechos ya comprobados, como el cambio de suelo o lo que se conserva.
- No busca imágenes ni vídeo fuera de RUBIK: las vistas preparadas y el vídeo del recorrido se eligen en la historia, con su
  estado.
- No vuelve a teclear los datos del cliente: carga una ficha JSON.
- No repite la identidad: sale de Mi estudio.

| Requisito §8.3 | Cómo se cumple (prueba `tests/story-assist.browser.test.cjs`, 1/1, desde P10 con original y variante guardados) |
|---|---|
| Dato comprobable | «Suelo de Salón: Baldosa 80×80 → Moqueta» sale de la historia comprobada |
| Imagen de la revisión correcta | Las **vistas preparadas** se preparan desde la propia historia con la variante abierta. Una elegida entra como página «Vistas de la propuesta» |
| Vídeo existente | El vídeo del recorrido se graba con **Presentación 3D → Grabar vídeo** y viaja como adjunto `propuesta/video-recorrido.mp4\|webm`, con su huella. La vista previa reproduce los mismos bytes |
| Cliente sintético | Ficha JSON cargada (los campos desconocidos se nombran y se ignoran), con dos casillas por campo: **Usar para redactar** y **Mostrar en la entrega**. En la entrega solo aparece lo marcado («Para: Sra. …», «Lo que nos indicó») |
| Identidad | La de «Mi estudio» (§7.3), con los campos elegidos |
| Asistente en una nota de capítulo | «Ayuda para redactar una nota» muestra la fuente («sin conexión»), **qué datos usa**, un borrador **editable** y las preguntas que solo el profesional responde: motivo, método, decisión, y que beneficios, plazos y costes los valida él. Se puede **aceptar** (elige la visibilidad), **descartar** o **cerrar**. Al cerrar, el borrador, la posición en pantalla y el foco se conservan, sin perder otros textos |
| Contexto limitado | La ayuda recibe solo el capítulo, lo que se conserva, si ya hay motivo/método/decisión (sí o no) y los campos del cliente marcados «usar». La prueba comprueba que no recibe ni el nombre ni los requisitos no marcados |
| Nota interna excluida | Ninguna nota interna aparece en ningún archivo del ZIP (`INTERNA-ZX9`). Las preferencias del cliente no salen como dato del cliente, solo dentro de la nota que el profesional aceptó |
| Medios ausentes u obsoletos | Ausente: «Ausente · grábalo en…» o «Preparar vistas». Un cambio posterior en la variante marca vista y vídeo como **obsoletos** y bloquea la descarga con su motivo |
| Archivo = vista previa | Las huellas de las páginas y el vídeo del ZIP coinciden con las de la vista previa |

**Muestra descargable (datos sintéticos):**
- [`asistencia-8-3/propuesta-asistida-8-3.zip`](asistencia-8-3/propuesta-asistida-8-3.zip): 3 páginas y el vídeo.
- [`manifiesto-8-3.json`](asistencia-8-3/manifiesto-8-3.json).
- Páginas: [`8-3-pagina-1.png`](asistencia-8-3/8-3-pagina-1.png), [`8-3-pagina-2.png`](asistencia-8-3/8-3-pagina-2.png) y
  [`8-3-pagina-3.png`](asistencia-8-3/8-3-pagina-3.png).
- Capturas de la ayuda: [`8-3-ayuda-borrador.png`](asistencia-8-3/8-3-ayuda-borrador.png) y
  [`8-3-historia-lista.png`](asistencia-8-3/8-3-historia-lista.png).

**Preparado para extender a las demás plantillas:**
- Los núcleos son puros y reutilizables: `normClient`/`clientFromFile`/`clientForAssist`, `mediaState`, `context()` y el
  adaptador.
- La regla es común: solo lo **vigente** entra, lo elegido que deja de serlo **bloquea** la entrega con su motivo, y la vista
  previa da los mismos bytes que el archivo.

**Límites de §8.3:**
- Las vistas preparadas viven en la sesión del editor. Tras recargar, la historia las da por ausentes y ofrece prepararlas.
- El vídeo solo se puede elegir si se grabó con la variante abierta y en su revisión actual.
- El adaptador local no reformula estilo libre, solo convierte hechos. Un modelo de lenguaje requiere su activación
  autorizada.
- La ficha de cliente se guarda con la propuesta, en este navegador.

La prueba humana sobre una Preview identificada por SHA requiere el despliegue de Codex o del propietario.
