# FT3D-8 · Entrega al cliente: correcciones de trazabilidad, marca, vídeo y enlace

**Rama:** `feat/ft3d-8v-schedule-core-2026-11-05` · **Base:** `64bb243` · **Ámbito:** solo el laboratorio aislado `/labs/ft3d-8/` y módulos propios de FT3D-8.
**No se ha modificado** `index.html`, el visor, `project-core`, `budget-core`, `quantity-core`, `building-core`, Entregas (PR #166), `api/share.js` ni `api/view.js`.

## A. Correcciones de los seis problemas

| # | Problema | Estado | Cambio | Pruebas |
|---|---|---|---|---|
| A1 | El nivel «Entrega profesional» sugería una verificación completa | **Corregido** | Niveles `internal` → `orientative` → `declared-plan` → `evidenced-plan`; `accredited` está reservado y no se alcanza nunca. Cada nivel exige las huellas SHA-256 vigentes de proyecto, plan y presupuesto. Estados por autoridad: `current`, `obsolete`, `unbound`, `missing-document`, `not-applicable`. El bloqueo `approval-not-authenticated` es permanente. Etiqueta máxima: «Presentación planificada con evidencias registradas (revisión declarada, no acreditada; no certifica obra)» + `scopeNotice` de alcance parcial | `construction-project-adapter.test.cjs`: «A1 …» (5 pruebas): presupuesto no vinculado, plan obsoleto, presupuesto obsoleto, vínculo parcial, revisor declarado, cobertura incompleta |
| A2 | Un plan de otro proyecto dejaba un timeline utilizable | **Corregido** | `planning.status='rejected'`. Sus enlaces no se evalúan, sus costes no se combinan y su huella no se usa. El laboratorio muestra el modelo estático con el error y permite cargar otro plan | «A2 …»: mismos IDs y nombres de tarea con otro `projectRef` → rechazado; mismo `projectRef` con claves de A → `link-unknown-element`; plan de edificio sobre un proyecto → rechazado. Navegador: «plan de otro proyecto» |
| A3 | El presupuesto se leía del `localStorage` del propio origen | **Corregido** | Importación explícita: presupuesto (`FloorPlanBudget.parseBudget`), plan (`Schedule.parse`) y vínculo (`validateBinding`), cada uno con su validador. Un presupuesto de planta en un edificio queda como `level-budget-not-building` y nunca se usa como presupuesto del edificio | «A3 …» |
| A4 | Revisión «declarada» presentada como aprobación | **Corregido** | `assurances.approval`: «declarada en el vínculo por X (fecha); identidad no verificada». Sin sello verde. Contrato futuro en el §G | «A1/A4 …» |
| A5 | Duplicación del montaje de mallas | **Documentado (bloqueo con Kimi)** | Se mantienen la prueba de fidelidad contra el editor real y el contrato propuesto `buildArchitecture`/`archInspect` (ver auditoría §4) | `ft3d-8-fidelity.browser.test.cjs` (6 pruebas, sin cambios) |
| A6 | La cobertura económica se leía como cobertura de toda la obra | **Corregido** | Tres coberturas separadas: **partidas cargadas** (`coverage.budget.allocatedPercentOfKnown`, con la nota «no equivale al % de la obra presupuestada»), **alcance de obra** (`coverage.scope`: categorías modeladas con partida y precio, sin precio, fuera del presupuesto, sin partida C1–C4 —cubierta, forjado— y no modeladas) y **geometría** (`coverage.geometry`) | «A6 …» |

## B. Marca profesional

- **Reutilizado:** `js/brand-core.js` (`FloorPlanBrand.normalizeProfile`, `readProfiles`, `saveProfile`, `setDelivery`, `snapshot`, `contactLine`, `credit`, `logo`). `brand-ui.js` no se carga porque depende de `FloorPlanApp`. Solo se replica el paso de recodificar el logo a PNG, que valida `FloorPlanBrand.logo`.
- **Selección** (paso 3):
  - «Sin marca» (atribución RUBIK);
  - las marcas guardadas **en este navegador para este dominio**, en solo lectura. Una Preview no ve las de producción, y el laboratorio lo dice;
  - una **marca de prueba del laboratorio**, que solo vive en memoria y no escribe en los perfiles del usuario.
- **Contenido:** título, introducción y los datos de contacto que se marquen expresamente (profesional, teléfono, correo, web), con una vista previa en vivo.
- **Instantánea:** sale siempre de `FloorPlanBrand.snapshot` y se vuelve a validar en `brandFor`. Se congela dentro del manifiesto. Si la marca cambia después, se descarta el vídeo o documento de la selección anterior y se genera una entrega nueva. Los archivos ya descargados no cambian (prueba «frozen delivery»).
- **Dónde aparece:** en la apertura y el cierre del vídeo, en la franja superior del desarrollo, en la cabecera y el pie de la presentación y en el modo cliente. Los materiales de la vivienda no cambian.

## C. Vídeo

- **Cómo se genera:**
  - Cada fotograma se dibuja a su tiempo exacto: escena 3D del proyecto seleccionado a 1280×720 y textos sobre un canvas de composición.
  - Se codifica con **WebCodecs `VideoEncoder` H.264** (`avc1.42001f`, 1,4 Mb/s), con un fotograma clave cada segundo.
  - `js/construction-mp4-muxer.js` (propio y puro) escribe un **MP4 indexado** (`ftyp`, `mdat`, `moov` con `stts`, `stss`, `stsz` y `stco`).
  - El grabado en tiempo real queda solo como alternativa (`MediaRecorder` con el formato de `FloorPlanTourRecorder.pickType`), y se avisa de que puede no permitir saltar.
- **Por qué:** el MP4 de `MediaRecorder` es fragmentado y su duración depende de la velocidad de renderizado. En la prueba previa declaraba 17,3 s, el reproductor medía 15,0 s y los saltos mostraban siempre la apertura. Con la codificación por fotogramas, **la duración declarada, la del archivo y la del reproductor son la misma**, y se puede avanzar y retroceder.
- **Formatos:**
  - MP4 H.264 indexado si el navegador tiene WebCodecs H.264 (Chrome, Edge o Safari recientes, en HTTPS o localhost);
  - si no, MP4 o WebM de `MediaRecorder`. Un WebM nunca se renombra a .mp4.
- **Duración y resolución:**
  - apertura 3,5 s + desarrollo 9–16 s (unos 140 ms por día del plan) + cierre 4,5 s;
  - fixture A: **19,64 s** (491 fotogramas, 25 fps, 20 fotogramas clave), 1280×720 y unos 1,8 MB.
- **Contenido del vídeo:**
  - **Apertura:** marca, título, proyecto, fechas del plan y «Simulación planificada… no muestra obra ejecutada».
  - **Desarrollo:** escena 3D, semana y fecha, fase en curso, minicronograma del plan y costes. Se distingue «Fase en curso «X»: importe» de «Total presupuestado asignado al plan» y aparece el aviso de importes presupuestados.
  - **Cierre:** el modelo final, «Plan completado según la planificación», contacto autorizado, crédito, revisiones de proyecto y plan, y «no certifica obra ejecutada, pagada ni terminada».
- **Controles:**
  - Generar vídeo y Cancelar grabación (la cancelación no conserva nada).
  - Vista previa: reproduce el **mismo Blob** que se descarga.
  - Descargar vídeo y Grabar de nuevo.
- **Antes de ofrecer la descarga se comprueba:** que el archivo no está vacío; que mide 1280×720; que la duración del reproductor y la del archivo inspeccionado coinciden con la declarada (tolerancia de un fotograma); y su SHA-256.
- **Pruebas de reproducción** (`tests/ft3d-8-delivery.browser.test.cjs`): el archivo **descargado** se inspecciona en Node (`moov`, duración, fotogramas clave) y después, en otro contexto de Chromium:
  - se carga y se mide la duración real;
  - se navega a 6 puntos, comprobando que cada salto cae donde se pidió;
  - se comprueba que corresponden al menos a 3 fases distintas del plan;
  - se reproduce completo hasta `ended`.

  Se repite con el edificio B, de otra geometría.

## D. Enlace al cliente

- **Contenido** (`FloorPlanConstructionDelivery.clientDocument`):
  - título, marca, proyecto y revisión, plan y fechas;
  - el vídeo; fases (WBS, inicio y fin);
  - presupuesto según la opción elegida (ninguno, resumen o por fase);
  - estado de la información, advertencias (simulación, alcance parcial, aprobación declarada, costes) y pie con crédito, entrega y huella.

  Incluye el manifiesto en JSON no ejecutable. **No** incluye el proyecto editable, planos de origen ni datos catastrales.
- **Preparación:** el paso 5 previsualiza el documento en un iframe aislado. Se puede descargar como .html, con el vídeo incluido como `data:` si ocupa 12 MB o menos, y descargar también su manifiesto .json.
- **Infraestructura existente:** `POST /api/share` (Vercel Blob, código de acceso `RUBIK_RENDER_TOKEN`) y `GET /api/view` (CSP estricto), sin modificarlas. El documento empieza por `<!doctype html>` y cumple el CSP de `api/view`, como se comprueba sirviéndolo con ese CSP.
- **Rutas absolutas:** `/api/share` y `/api/view`, no `/labs/ft3d-8/api/share`.
- **Funciona:** la preparación, la descarga, la publicación con consentimiento y los mensajes de 401, 413, 503, 502, red caída y 404. Todo probado con **respuestas simuladas** y sin ninguna subida real.
- **Depende de la configuración:** que el proyecto Vercel tenga `BLOB_READ_WRITE_TOKEN` y `RUBIK_RENDER_TOKEN`. Sin ellas, la respuesta es 503 y el laboratorio indica qué falta; el vídeo y la presentación siguen descargables.
- **Límite:** 4 MB por archivo (el de `api/share`). Un vídeo de más de 4 MB no se ofrece para publicar: se explica el motivo, se puede descargar y no se divide ni se degrada.
- **Privacidad y consentimiento:**
  - El profesional elige los datos de contacto y el modo de costes, y ve qué se publicará.
  - Debe marcar «Entiendo que cualquiera con el enlace podrá ver este contenido» y escribir el código.
  - Se informa de que no hay contraseña ni caducidad, de que «no indexado» no es una protección y de que se retira desde el panel Vercel Blob (`rubik-share/`).
  - No se publica nada automáticamente.
- **Congelado:** el manifiesto (`dlv_…`) guarda las huellas de proyecto, plan, presupuesto, marca y vídeo. Si cambian el proyecto, el plan, el presupuesto, la marca o la opción de costes, se invalidan el vídeo, el documento y el enlace preparados, y se genera una entrega nueva. Un enlace publicado no se modifica.
- **No implementado:** el visor interactivo remoto (Three.js, Gantt y timelapse controlables por el cliente), la caducidad o contraseña de los enlaces, el borrado desde la interfaz y la publicación real en este corte, que queda sujeta a tu confirmación expresa.

## E. QA

Pruebas puras:

| Archivo | Pruebas |
|---|---|
| Adaptador | 27 |
| Núcleo de entrega y muxer | 9 |
| Laboratorio, calendario y estado visual | anteriores, sin cambios |
| Presupuesto, edificio, Story, marca y compartición | regresiones existentes |

Pruebas en Chromium:

| Suite | Pruebas | Qué cubre |
|---|---|---|
| Demo | 2 | — |
| Fidelidad | 6 | — |
| Entrega | 6 | escritorio, cancelación y congelación, publicación simulada, edificio B, móvil, alternativa sin WebCodecs |

Artefacto de CI `ft3d-8-delivery-evidence`:
- **Capturas de la interfaz:** selector de marca, controles de vídeo, vídeo en reproducción, documento de cliente, descargar o compartir, publicación simulada con vídeo, modo cliente, plan de otro proyecto, publicación 503, publicación correcta simulada, documento publicado, móvil y advertencias económicas.
- **Vídeos y propiedades:** MP4 de A y B y `A-video-properties.json`.
- **Fotogramas navegando por el vídeo:** `A-video-0N-…` y `B-video-0N-…`.

## F. Preview y primer vídeo

1. Abre la URL de la Preview de este SHA, en `/labs/ft3d-8/`.
2. Proyecto de prueba **A**. En el paso 3, elige «Marca de prueba de este laboratorio», rellena el nombre (y si quieres el logo), pulsa «Usar esta marca», escribe un título y marca los contactos que quieras mostrar.
3. En el paso 4, elige «Importe por fase» y pulsa **Generar vídeo**. Con GPU tarda unos segundos; con renderizado por software, varios minutos.
4. Revisa la vista previa: es el mismo archivo. Pulsa **Descargar vídeo** y ábrelo en tu reproductor: dura lo mismo que indica la ficha y se puede avanzar y retroceder.
5. En el paso 5, pulsa **Preparar presentación para el cliente** y revisa el documento. Descárgalo y, si el proyecto Vercel tiene Blob configurado y lo autorizas, publica el enlace con tu código.

## G. Integración pendiente (sin tocar módulos compartidos)

| Destino | Archivos | Qué conectar |
|---|---|---|
| Presupuestar | `js/budget-ui.js` | Pestaña «Plan de obra»; usar el presupuesto activo (`rubik-budget-v1[projectId]`) en lugar de la importación |
| Entregar | Entregas (PR #166), `js/client-share-ui.js`, `js/share-link-ui.js` | Tipo de entrega «Evolución de obra» con `FloorPlanConstructionDelivery` (manifiesto, documento, vídeo); la ruta relativa `api/share` de `share-link-ui` es correcta en el editor (raíz) y no en subrutas |
| Mi estudio | `js/brand-ui.js` | Usar la marca activa del proyecto (`FloorPlanBrandUI.snapshot`) en lugar del selector del laboratorio |
| Visor 3D | `index.html` (`View3D`) | Contrato de mallas por elemento (Kimi) para sustituir `labs/ft3d-8/project-scene.js` |
| Vercel Blob | `api/share.js`, `api/view.js` | Sin cambios; opcionalmente, una ruta de borrado autenticada y caducidad de enlaces |
| Aprobación acreditada | (nuevo) | Contrato propuesto: `approval:{kind:'authenticated', principal:<id de cuenta>, signedAt, signature:<firma del servidor sobre las huellas>}` emitido por un servicio con identidad. Hasta entonces el nivel `accredited` no se alcanza |
