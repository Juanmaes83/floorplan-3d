# GOV-08 · Aislamiento de `/api/view`

**Fecha:** 11/11/2026 (corte de cierre: aviso universal, §6) · **Rama:** `security/gov08-view-isolation` (apilada sobre S2 `security/gov08-s2-unshare` @ `9c00c81`, que a su vez está apilada sobre S1) · **Estado:** PR Draft, HOLD para merge y Production.

Este corte es independiente de `brand.browser` y de ENT-01: no toca ninguno de los dos.

## 1. Alcance y reglas cumplidas

- Solo cambian cuatro cosas:
  - la cabecera `Content-Security-Policy` de `api/view.js`;
  - el aviso de observaciones en la plantilla del documento del cliente (`js/client-share-ui.js`);
  - el mismo aviso, añadido por `/api/view` a los documentos publicados antes de #195 (corte de cierre, §6);
  - las pruebas.
- No se han usado secretos reales, publicaciones reales, Vercel Blob real ni APIs de pago:
  - Todas las pruebas usan los manejadores reales sobre un almacén Blob simulado en memoria.
  - Los códigos y los datos son ficticios.
  - Cualquier petición que salga de la app o del almacén simulado se registra y se corta.
- No se han leído ni cambiado variables de entorno. No hay merge, ni Promote, ni Production.

## 2. El riesgo (reproducido antes del cambio)

`/api/view` sirve el documento publicado **con la dirección (origen) de la propia app**, y con scripts en línea permitidos (`script-src 'unsafe-inline'`), que necesita el formulario de observaciones. Ese origen es el mismo en el que RUBIK guarda en el navegador:

- el código del Render IA (`rubik-render-token`);
- el proyecto y la biblioteca (`rubik-sota-floorplan-project-v1`, `rubik-sota-project-library-v1`);
- el registro «Mis publicaciones» (`rubik-share-publications-v1`);
- los perfiles de marca;
- las observaciones de otros documentos (`rubik-share-notes:*`);
- la base de imágenes (IndexedDB `rubik-sota-images-v1`).

Quien más se expone es **el propio profesional**, que abre su enlace («Ábrelo para comprobarlo») en el navegador donde RUBIK lo guarda todo.

Hace falta un documento hostil publicado. Puede llegar de dos formas: con un código de publicación filtrado, o con texto inyectado en un documento real si algún día falla el escapado. Prueba `tests/gov08-view-isolation.browser.test.cjs`, ejecutada contra `9c00c81` (evidencia: `docs/qa/artifacts/gov08-view-isolation/probe-antes.json`):

| Lo que intenta el documento | Antes (`9c00c81`) | Después |
|---|---|---|
| Su origen | `http://127.0.0.1:…` (el de la app) | `null` (opaco) |
| Leer `localStorage` | **Código del Render IA, proyecto, publicaciones y notas de otra clienta** | `SecurityError` |
| Escribir o borrar en `localStorage` | **Plantó un código falso y borró el proyecto** | `SecurityError`; la app queda intacta |
| Leer IndexedDB (imágenes) | **Leyó la imagen privada** | `SecurityError` |
| Leer `document.cookie` | **Leyó la cookie** | `SecurityError` |
| Abrir una ventana de la app y leerla | **Leyó el código desde la ventana abierta** | `window.open` devuelve `null` |
| `fetch` a la app | Bloqueado por `default-src 'none'` (ya lo estaba) | Bloqueado |
| Llevárselo navegando a otro sitio (la CSP no gobierna la navegación) | **Navegó a `attacker.invalid` con el valor en la URL** | Navega, pero solo lleva `blocked:SecurityError` |

`sessionStorage` sale vacío en ambos casos, porque es por pestaña y el documento se abre en una pestaña nueva.

## 3. Opciones comparadas

| Criterio | **A. CSP `sandbox` sin `allow-same-origin`** (implementada) | **B. Servir el documento desde otro origen** (dominio o proyecto aparte) | C. A + B |
|---|---|---|---|
| Aísla el almacenamiento de la app | Sí (origen opaco) | Sí (otro origen) | Sí |
| Aísla **cada documento de los demás** | Sí (cada carga tiene su origen opaco) | **No**: todos los documentos comparten el origen de visualización y uno podría leer las notas de otro | Sí |
| Conserva las observaciones al recargar | **No** (ver §6) | Sí | Según los permisos elegidos |
| Enlaces existentes | Misma URL y mismo archivo, sin redirección | Necesita redirigir `/api/view` al nuevo origen: **decisión expresa** | Igual que B |
| Infraestructura | Ninguna (una cabecera) | Dominio o subdominio, DNS, un segundo despliegue con su propio `BLOB_READ_WRITE_TOKEN`: **cambia entorno real, no autorizado aquí** | Igual que B |
| Coste | 0 | Dominio y operación | Igual que B |
| Reversibilidad | Inmediata (quitar la directiva) | Media | Media |
| Riesgo de romper | Bajo; verificado con el documento real y con documentos ya publicados con la plantilla anterior | Medio (redirecciones, configuración) | Medio |

**Recomendación: A ahora.**

- A cierra el riesgo sin infraestructura y sin tocar URLs.
- B, por sí sola, sería **peor** en un punto: no aísla los documentos entre sí.
- Si el propietario decide que conservar las observaciones al recargar es imprescindible, el camino es C:
  - otro origen dedicado, con `sandbox allow-scripts allow-same-origin allow-downloads`;
  - eso exige dominio y variables reales, así que queda como decisión futura.

**Alternativa descartada: envoltorio con `<iframe sandbox srcdoc>`.** Da el mismo aislamiento que A, pero añade una página intermedia, dobles barras de desplazamiento en el móvil y más código. No aporta nada frente a la cabecera.

## 4. La directiva implementada

```
… frame-ancestors 'none'; sandbox allow-scripts allow-downloads
```

| Permiso | Por qué |
|---|---|
| `allow-scripts` | Lo necesita el formulario de observaciones (script en línea del propio documento). |
| `allow-downloads` | «Guardar archivo de observaciones» descarga `observaciones-<versión>.json`. |
| sin `allow-same-origin` | Es el aislamiento: el documento no es de la app. |
| sin `allow-popups`, `allow-top-navigation*`, `allow-forms`, `allow-modals` | El documento no abre ventanas ni envía formularios (además `form-action 'none'`). Tampoco llama a `alert`, `confirm` ni `print`. Imprimir desde el menú del navegador no depende de este permiso. |

Las demás directivas se conservan **literalmente**, lo que comprueba `tests/gov08-view-isolation.test.cjs`: `default-src 'none'`, `img-src data:`, `media-src https://<almacén>`, `style-src`/`script-src 'unsafe-inline'`, `form-action 'none'`, `base-uri 'none'` y `frame-ancestors 'none'`.


## 5. Lo que sigue funcionando (verificado en Chromium)

Cada fila se comprueba con **dos documentos reales** que genera la propia app: uno con la plantilla actual y otro con la plantilla que llevan todos los enlaces publicados antes de #195 (§6).

| Función | Prueba (`tests/gov08-view-isolation.browser.test.cjs`) | Documento nuevo | Documento anterior a #195 |
|---|---|---|---|
| Origen opaco (aislamiento intacto) | pruebas 1–4 | `null` | `null` |
| Aviso antes de comentar, texto del contrato, `role="note"`, fuera del orden de tabulación, contraste ≥ 4,5:1 | 3, 4 | Sí | Sí (añadido por `/api/view`) |
| Lámina del plano y todas las vistas preparadas (`naturalWidth > 0`) | 3, 4 | Sí | Sí |
| «Comentar esta imagen», una por vista | 3, 4 | Sí | Sí |
| Vídeo del recorrido desde el almacén (WebM real, 320 px) | 3, 4 | Se reproduce | Se reproduce |
| Observación sobre estancia, sobre punto del plano y sobre imagen; quitar una | 3, 4 | Sí | Sí |
| Teclado: Tab del nombre a «Sobre»; «Guardar» con Enter | 3, 4, 8 | Sí | Sí |
| Descarga `observaciones-<versión>.json`, importable con `FloorPlanReviewNotes.read`, con revisora, versión, anclas y textos | 3, 4 | Sí | Sí |
| Mensaje tras guardar («Archivo guardado. Envíaselo al profesional…») | 3, 4, 8 | Sí | Sí |
| Ningún envío automático: solo se pide la página y el vídeo | 3, 4 | Sí | Sí |
| Recarga y «cerrar y volver a abrir» | 5, 6 | Sin notas y con aviso | Sin notas y con aviso |
| Enlace retirado: 404, `no-store`, «ya no está disponible» | 7 | Sí | Sí |
| Sin errores de página ni de consola, y sin red externa | todas | `[]` | `[]` |

**Otras comprobaciones:**

- Documento de obra de Evolución (sin scripts ni formulario): `tests/ft3d-8-delivery.browser.test.cjs`. Se sirve **sin ningún cambio**, porque no lleva formulario.
- Publicación completa, archivo sin conexión, retirada y foco: `share-link`, `client-share`, `anchored-comments`, `share-withdraw` y `gov08-s2-focus` (§9).

## 6. Observaciones del cliente y documentos anteriores a #195

### 6.1 Comportamiento

Una página aislada no tiene almacenamiento, así que las observaciones **solo duran mientras la página está abierta**. Antes se guardaban en el almacenamiento de la app, que era precisamente el lugar que cualquier otro documento publicado podía leer.

El script del documento ya envolvía el almacenamiento en `try/catch`, así que no hay errores: durante la sesión, el formulario funciona igual.

**No se recupera la persistencia:**

- no se usa el `localStorage` de RUBIK;
- no se vuelve a `allow-same-origin`;
- no hay base de datos remota.

### 6.2 Contrato de experiencia del cliente

Toda página publicada con observaciones muestra, **antes del formulario**:

> «Las observaciones de esta página no se guardan automáticamente. Antes de cerrar o recargar, descarga el archivo de observaciones y envíalo al profesional.»

- En inglés: «Observations on this page are not saved automatically. Before closing or reloading, download the observations file and send it to the professional.»
- En chino: «本页面的意见不会自动保存。关闭或刷新前，请下载意见文件并发送给专业人员。»

### 6.3 Alcance de los documentos históricos

- **Número de documentos históricos publicados: NO VERIFICADO.** Contarlos exige listar el almacén Blob de Production con `BLOB_READ_WRITE_TOKEN`, y no hay acceso autorizado de solo lectura. No se ha leído ningún secreto ni descargado ningún archivo de clientes.
- **Plantillas que pueden estar publicadas.** `/api/view` existe desde B4 (`77fa761`, 30/10/2026). Todas las plantillas desde entonces llevan:
  - `id="shareReview"`;
  - `<div class="share-form">`;
  - ningún aviso propio.
- La plantilla de `master` (`75615fd`) es **idéntica byte a byte** a la de `9c00c81`: sha256 `97e68c5e…`.
  - Se conserva literal en `tests/fixtures/gov08-view-isolation/client-share-ui-9c00c81.js`.
  - Las pruebas la usan para generar documentos históricos auténticos.

### 6.4 Alternativas comparadas

| Criterio | **A. Aviso añadido por `/api/view` al servir** (elegida) | B. Capa de presentación aislada (página envolvente con `iframe sandbox`) | C. Volver a publicar los documentos antiguos |
|---|---|---|---|
| Seguridad | Sin cambios en el aislamiento. El texto es fijo y no copia nada del documento | Igual aislamiento, pero añade una segunda página y su política | Sin cambios |
| Compatibilidad | Todos los documentos, también los ya publicados | Todos, pero con desplazamiento dentro de un marco | Solo los que se vuelvan a publicar |
| HTML servido | Inserta **un** `<p>` antes de `<div class="share-form">`. Quitarlo devuelve los bytes almacenados exactos | No toca el HTML; lo envuelve | Sustituye el archivo |
| Riesgo para los scripts | Ninguno: id propio (`rubikViewNotice`) y sin scripts | Medio: altura del marco, foco y pantalla completa del vídeo | Ninguno |
| Vídeo y descargas | Sin cambios (probado) | Requiere `allow="fullscreen"` y `allow-downloads` en el marco | Sin cambios |
| Enlaces existentes | Misma URL | Misma URL | **URL nueva**: el cliente necesita el enlace nuevo |
| Caché | `no-store`: se aplica en la siguiente apertura | Igual | No aplica |
| Complejidad | ~10 líneas, con pruebas | Alta | Manual; necesita publicaciones reales y el código real |
| Reversibilidad | Inmediata | Media | Irreversible para los enlaces ya enviados |

- **A cumple todas las pruebas.**
- **B se descarta:** añade complejidad y riesgos sin aportar nada.
- **C no se impone:** queda como opción del propietario para quien quiera documentos con el aviso «de origen».

### 6.5 Reglas de la inserción

En `api/view.js`, `withNotice`:

- Solo actúa si el documento tiene formulario (`id="shareReview"`) y **no** tiene aviso propio (`id="shareVolatile"`).
  - Los documentos nuevos se sirven tal cual.
  - El documento de obra de Evolución se sirve tal cual.
- Inserta un único párrafo, justo antes del primer `<div class="share-form">`. En las plantillas esa marca solo aparece en el formulario: el JSON de configuración escapa `<`.
- Elige el idioma por `<html lang>`: `es`, `en` o `zh`; cualquier otro valor usa `es`. No copia nada del documento.
- **La copia almacenada nunca cambia.**
- La prueba unitaria comprueba que, al quitar el párrafo, se recuperan los bytes almacenados exactos.

### 6.6 Matriz de documentos

| | Documento nuevo (desde #195) | Documento anterior a #195 | Archivo descargado, abierto sin conexión | Documento de obra (Evolución) |
|---|---|---|---|---|
| Se abre por el mismo enlace | Sí | Sí | No aplica | Sí |
| Aislado (origen `null`) | Sí | Sí | No aplica (`file://`) | Sí |
| Aviso | Propio (`#shareVolatile`) | Añadido por `/api/view` (`#rubikViewNotice`) | No aparece: allí las notas sí se conservan | No aplica: no tiene formulario |
| Observaciones tras recargar o cerrar | Se pierden; el aviso lo dice | Se pierden; el aviso lo dice | Se conservan | No aplica |
| Descarga del JSON importable | Sí | Sí | Sí | No aplica |
| Bytes servidos frente a almacenados | Idénticos | Almacenados + 1 párrafo | No aplica | Idénticos |

## 7. Enlaces existentes

- **Misma URL:** `/api/view?f=<url del almacén>`, tanto codificada como sin codificar.
- **Mismo archivo almacenado:** no se reescribe ningún documento.
  - Se sirven byte a byte, salvo el párrafo de aviso en los documentos anteriores a #195.
- **Mismas reglas de destino:** solo el almacén propio, la carpeta `rubik-share/` y `.html`.
- Ningún enlace deja de abrir.
- Como `/api/view` responde `no-store` (S2), ningún navegador conserva una copia sin aislar ni sin aviso.
  - En el `master` actual, la respuesta correcta lleva `public, max-age=60`. Al desplegarse, una copia anterior podría seguir sirviéndose como máximo 60 s.

## 8. Privacidad, caché y retirada (sin cambios)

`no-store`, `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`, `nosniff` y `frame-ancestors 'none'` se mantienen.

Un enlace retirado responde 404 con `no-store` y «ya no está disponible», tanto si el documento es nuevo como si es antiguo. Lo comprueban la prueba unitaria, la prueba 7 de navegador y `gov08-s2-adversarial`.

`/api/view` sigue sin ser un proxy general: rechaza otros almacenes, otras carpetas, extensiones distintas, consultas, fragmentos y métodos distintos de GET.

## 9. Pruebas y evidencias

### 9.1 Antes y después

Las pruebas se escribieron **antes** de cada cambio y se ejecutaron contra el SHA anterior, en una copia aislada.

| Archivo | Primer corte: antes `9c00c81` → después `d4a5709` | Corte de cierre: antes `d4a5709` → después `04f7b57` |
|---|---|---|
| `tests/gov08-view-isolation.test.cjs` | 3/4 → 4/4 | 5/8 → **8/8** |
| `tests/gov08-view-isolation.browser.test.cjs` | 1/4 → 4/4 | 3/7 → **8/8** (incluye la QA visual de 4 tamaños añadida en este corte) |

**Fallos «antes» en el corte de cierre:**

- **Documentos anteriores a #195:** sin aviso. Fallaban las pruebas 4 y 6 (`[defect]`) y las unitarias 5 y 7.
- **Documentos nuevos:** llevaban el texto anterior, no el del contrato. Fallaban las pruebas 3 y 5 y la unitaria 8.
- Las pruebas de seguridad 1, 2 y 7 ya pasaban.

**Seguridad: la sonda hostil da el mismo resultado que en el primer corte.** Todo `SecurityError`, `window.open` devuelve `null` y el origen es `null`. Están en `probe-despues.json` (primer corte) y en `probe-cierre.json` (este corte).

### 9.2 Regresión

_Pendiente: se completa con el resultado de la ejecución en curso._

### 9.3 Ajustes de arnés

No se ha cambiado ninguna aserción en ninguno de los dos cortes.

- **`tests/share-link.browser.test.cjs` (primer corte).**
  - Sembraba el código de render con `addInitScript`, que se ejecuta en todas las páginas del contexto. Al leer `localStorage` en la página ya aislada lanzaba una excepción.
  - La siembra se limita ahora a las páginas de la app.
- **Primeras pruebas de navegador de `gov08-view-isolation` (este corte).**
  - Usaban el texto anterior del aviso y generaban el documento en cada prueba.
  - Ahora generan una sola vez los documentos nuevo y antiguo, y comprueban el texto del contrato.
  - Las aserciones de seguridad no se han tocado.

### 9.4 Evidencias

En `docs/qa/artifacts/gov08-view-isolation/`:

- TAP antes y después de los dos cortes;
- `probe-antes.json`, `probe-despues.json` y `probe-cierre.json`;
- capturas de documentos **nuevos** y **antiguos** en 390×844, 768×1024, 1280×800 y 1440×900:
  - `view-iso-{nuevo|antiguo}-<ancho>-aviso-formulario.png`;
  - `view-iso-{nuevo|antiguo}-<ancho>-guardado.png`;
- `view-iso-1280-aviso-{nuevo|antiguo}.png`, tras cerrar y volver a abrir.

Las capturas del primer corte, con el texto anterior, se han retirado del árbol y siguen en el historial.

**La QA visual comprueba, en los 4 tamaños y con los dos documentos:**

- sin desplazamiento horizontal;
- aviso, plano, campo, «Añadir», «Guardar» y vídeo dentro del ancho;
- foco de teclado visible en «Guardar»;
- descarga y mensaje posterior.

## 10. Navegadores

| Navegador | Estado |
|---|---|
| Chromium (Playwright 1.63, en local) | **Verificado**: pruebas 1–8 y regresión |
| Chromium en GitHub Actions | Ver §11 |
| Firefox | **NO VERIFICADO.** No está instalado en este entorno (ni el de Playwright ni el del sistema), y no se ha instalado para no alterar el entorno. |
| Safari iOS | **NO VERIFICADO. Pendiente de validación humana** en un iPhone real. Un viewport de 390 px en Chromium **no** equivale a Safari. |

**Prueba manual propuesta (Safari iOS y Firefox):**

1. Abrir un enlace de prueba.
2. Comprobar que el aviso aparece antes del formulario.
3. Añadir una observación.
4. Pulsar «Guardar archivo de observaciones» y comprobar que se descarga el `.json`.
5. Recargar y comprobar que la lista queda vacía y el aviso sigue visible.
6. Reproducir el vídeo.

Para Safari es especialmente relevante la descarga desde una página con `sandbox`.

## 11. CI

_Pendiente: se completa con la CI del SHA final._

## 12. Riesgos residuales

1. **Navegación propia.** Un documento hostil puede navegar su propia pestaña a otro sitio, por ejemplo una página de phishing. Ni `sandbox` ni la CSP lo impiden en una página de nivel superior. Ahora no lleva datos de la app. Mitigación existente: solo publica quien tiene el código (S1) y la plantilla escapa los textos.
2. **Descargas.** `allow-downloads` permite que un documento hostil inicie descargas. Es necesario para el archivo de observaciones.
3. **Navegadores sin verificar:** Firefox y Safari iOS (§10).
4. **Pérdida de observaciones.** Si el cliente ignora el aviso y cierra sin guardar, pierde las observaciones. El aviso lo dice, pero no lo impide.
   - Un aviso al salir (`beforeunload`) necesitaría `allow-modals`, y no se ha añadido.
5. **Navegadores sin soporte de `sandbox` en CSP** (muy antiguos). La página no quedaría aislada y el aviso diría algo más estricto de lo real. No es un riesgo nuevo.
6. **Copias ya descargadas** por cualquiera, y la caché del CDN de Blob (≈60 s tras retirar): como en S2, sin cambios.

## 13. Dictamen y decisiones humanas

**Seguridad comprobada no significa aceptación comercial.**

**Comprobado técnicamente:**

- el aislamiento;
- el aviso universal en documentos nuevos y antiguos;
- la descarga del JSON importable;
- los enlaces existentes;
- la retirada;
- la QA visual en Chromium.

**No concedido:**

- la aceptación de la pérdida de observaciones al recargar;
- la validación en Safari y Firefox;
- el merge;
- Production.

**Decisiones pendientes del propietario:**

1. Aceptar que las observaciones no se conservan al recargar o cerrar (§6.1), o pedir la opción C del §3: otro origen dedicado, que necesita dominio y variables reales.
2. Aceptar el aviso universal para los documentos anteriores a #195 (§6.4 A), o además volver a publicar algunos (C).
3. Hacer la prueba manual en Safari iOS y Firefox (§10).
4. Decidir cuándo fusionar la cadena S1 → S2 → #195. Antes debe crearse `RUBIK_SHARE_TOKEN` en Production (S1).

_Dictamen pendiente de la CI del SHA final._
