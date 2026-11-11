# GOV-08 · Aislamiento de `/api/view`

**Fecha:** 11/11/2026 · **Rama:** `security/gov08-view-isolation` (apilada sobre S2 `security/gov08-s2-unshare` @ `9c00c81`, que a su vez está apilada sobre S1) · **Estado:** PR Draft, HOLD para merge y Production.

Este corte es independiente de `brand.browser` y de ENT-01: no toca ninguno de los dos.

## 1. Alcance y reglas cumplidas

- Solo cambian tres cosas: la cabecera `Content-Security-Policy` de `api/view.js`, un aviso en la plantilla del documento del cliente (`js/client-share-ui.js`) y las pruebas.
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

| Función | Prueba | Resultado |
|---|---|---|
| Vistas e imágenes: lámina del plano y cada vista preparada | `…browser` «real client document…» | Todas decodifican (`naturalWidth > 0`) |
| «Comentar esta imagen» | ídem | Una por vista, y selecciona la vista |
| Vídeo del recorrido desde el almacén (`media-src`) | ídem (WebM real grabado en el navegador) | Se reproduce, 320 px de ancho |
| Observaciones: estancia, punto del plano, imagen y quitar | ídem | 3 añadidas, 1 quitada |
| Descarga del archivo de observaciones | ídem | `observaciones-<v>.json`, importable con `FloorPlanReviewNotes.read`, revisora y anclas correctas |
| Anclas internas (`#…`) | ídem | Funcionan |
| Documento de obra de Evolución (sin scripts) | `tests/ft3d-8-delivery.browser.test.cjs`, servido con `View.csp` | 6/6 |
| Publicación completa con y sin vídeo, y apertura del enlace | `tests/share-link.browser.test.cjs` | Pasa |
| Retirada, foco y archivo sin conexión | `share-withdraw`, `gov08-s2-focus`, `client-share`, `anchored-comments` | Pasan |
| Sin errores de página ni de consola, y sin red externa | todas las anteriores | `[]` |

## 6. Cambio de comportamiento: observaciones al recargar

Una página aislada no tiene almacenamiento, así que las observaciones **solo duran mientras la página está abierta**. Antes se guardaban en el almacenamiento de la app, que era precisamente el lugar que cualquier otro documento publicado podía leer.

El script del documento ya envolvía el almacenamiento en `try/catch`, así que no hay errores: el formulario funciona igual durante la sesión.

- **Documentos nuevos:** muestran un aviso (`#shareVolatile`, solo cuando el almacenamiento no está disponible): «En esta página las observaciones no se conservan si la recargas o la cierras. Guarda el archivo de observaciones antes de salir.»
- **Archivo descargado y abierto sin conexión** (`file://`): el almacenamiento sí funciona, el aviso no aparece y las notas se conservan (`client-share.browser` lo sigue comprobando).
- **Documentos ya publicados con la plantilla anterior:** funcionan enteros con la nueva cabecera. Está verificado ejecutando las pruebas con la plantilla de `9c00c81` y el `api/view.js` nuevo (`docs/qa/artifacts/gov08-view-isolation/tap-plantilla-anterior-cabecera-nueva.tap`: 3/4; la única que falla es el aviso). **No muestran el aviso**, porque no lo llevan, así que en ellos la pérdida al recargar es silenciosa.
  - **Decisión del propietario:** aceptarlo, o volver a publicar esos enlaces.
  - El texto que ve el cliente («guarda el archivo y envíaselo al profesional») ya indicaba guardar el archivo.

## 7. Enlaces existentes

- **Misma URL:** `/api/view?f=<url del almacén>`, tanto codificada como sin codificar.
- **El mismo archivo, byte a byte:** no se reescribe ningún documento almacenado.
- **Mismas reglas de destino:** solo el almacén propio, la carpeta `rubik-share/` y `.html`.
- Ningún enlace deja de abrir.
- Como `/api/view` responde `no-store` (S2), ningún navegador conserva una copia sin aislar.
  - En el `master` actual, la respuesta correcta lleva `public, max-age=60`. Al desplegarse, una copia anterior sin aislar podría seguir sirviéndose como máximo 60 s.

## 8. Privacidad, caché y retirada (sin cambios)

`no-store`, `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`, `nosniff` y `frame-ancestors 'none'` se mantienen. Un enlace retirado responde 404 con `no-store` y «ya no está disponible». Lo comprueban la prueba unitaria y `gov08-s2-adversarial`.

`/api/view` sigue sin ser un proxy general: rechaza otros almacenes, otras carpetas, extensiones distintas, consultas, fragmentos y métodos distintos de GET.

## 9. Pruebas y evidencias

| Archivo | Antes (`9c00c81`) | Después |
|---|---|---|
| `tests/gov08-view-isolation.browser.test.cjs` (4) | 1/4: fallan los 2 `[defect]` y el `[cambio]` | 4/4 |
| `tests/gov08-view-isolation.test.cjs` (4) | 3/4: falla el `[defect]` | 4/4 |

**Regresión:**

- unitarias de publicación, retirada y notas: 55/55;
- `share-link`, `client-share`, `anchored-comments`, `share-withdraw` y `gov08-s2-focus`: 7/7;
- `ft3d-8-delivery`: 6/6.
- La primera pasada de `share-link` dio 6/7 por el arnés descrito abajo (TAP conservado como `tap-regresion-publicacion-antes-del-ajuste-de-arnes.tap`); tras el ajuste, 1/1.

**Ajuste de arnés (no de aserciones).** `tests/share-link.browser.test.cjs` sembraba el código de render con `addInitScript`, que se ejecuta en **todas** las páginas del contexto. Al leer `localStorage` en la página ya aislada lanzaba una excepción, que la prueba contaba como error del documento.

- La siembra se limita ahora a las páginas de la app (`self.origin !== 'null'`).
- No se ha cambiado ninguna aserción.

**Evidencias** en `docs/qa/artifacts/gov08-view-isolation/`:

- TAP antes y después;
- `probe-antes.json` y `probe-despues.json`;
- capturas del formulario en 390×844, 768×1024, 1280×800 y 1440×900;
- captura del aviso.

Ambas pruebas nuevas se añaden a `.github/workflows/project-first.yml`.

## 10. Riesgos residuales

1. **Navegación propia.** Un documento hostil puede navegar su propia pestaña a otro sitio, por ejemplo una página de phishing. Ni `sandbox` ni la CSP lo impiden en una página de nivel superior. Ahora no lleva datos de la app. Mitigación existente: solo publica quien tiene el código (S1) y la plantilla escapa los textos.
2. **Descargas.** `allow-downloads` permite que un documento hostil inicie descargas. Es necesario para el archivo de observaciones.
3. **Navegadores.** Solo se ha verificado en Chromium (Playwright). Firefox y Safari no están instalados en este entorno, y no se han instalado. **Pendiente de una prueba manual del propietario** en Safari iOS y Firefox: abrir un enlace, añadir una observación y guardar el archivo.
4. **Copias ya descargadas** por cualquiera, y la caché del CDN de Blob (≈60 s tras retirar): como en S2, sin cambios.

## 11. Dictamen

**GOV-08 · AISLAMIENTO DE `/api/view` — TÉCNICAMENTE PREPARADO PARA REVISIÓN HUMANA. HOLD PARA MERGE Y PRODUCTION.**

Decisiones que quedan para el propietario:

- (a) aceptar la pérdida de observaciones al recargar (§6), o pedir la opción C;
- (b) qué hacer con los documentos ya publicados sin aviso: aceptarlo o volver a publicarlos;
- (c) la prueba manual en Safari y Firefox.
