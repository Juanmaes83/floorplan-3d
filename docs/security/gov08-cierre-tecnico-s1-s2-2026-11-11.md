# GOV-08 S1 + S2 — Cierre técnico: auditoría adversarial, correcciones, QA y preparación para revisión humana

**Fecha:** 11/11/2026. **Alcance:**
- PR #187 (S1), rama `security/gov08-s1-share-token`;
- PR #188 (S2), rama `security/gov08-s2-unshare`, apilada sobre S1;
- consulta de la PR #189 (ENT-01).

**No autoriza** merge, Promote, Production, rotación de secretos ni cambios en las variables reales. Todas las pruebas usan códigos ficticios y un almacén Blob **simulado**: no se ha publicado ni borrado nada real.

## A. Corte 0 — arqueología

| Rama | SHA de partida | SHA tras la auditoría |
|---|---|---|
| `master` | `75615fd` (sin cambios; desde la base de S1 solo hay 2 PDF subidos por el propietario, sin solape con S1/S2) | sin cambios |
| S1 (#187) | `54e6fc3` | `2e18161`: solo pruebas y documentación |
| S2 (#188) | `fdf7fc4` (base de la PR: rama S1) | merge no destructivo de `2e18161` y después el commit de correcciones (ver la PR) |

- Sin commits concurrentes en ninguna rama.
- Sin reescritura de historia ni push forzado.
- La base de #188 sigue siendo la rama S1.
- Tras el merge, el diff de #188 respecto a S1 contiene solo S2 y este corte.

**Baseline antes de tocar nada:**
- S1: 30/30 pruebas unitarias.
- S2: 41/41 pruebas unitarias y 3/3 de navegador (`share-link`, `share-withdraw` ×2).

**Hallazgo del Corte 0:** las suites de S2 (`unshare-api`, `share-registry-core` y `share-withdraw.browser`) **no estaban en ningún workflow**. El verde de la CI de #188 no las ejecutaba.

## B. Matriz antes / después

Distinguimos entre:
- **D** = defecto reproducido;
- **P** = protección adicional;
- **C** = comportamiento ya correcto;
- **R** = riesgo no resuelto.

| Comportamiento | SHA anterior | Antes | SHA corregido | Después | Tipo |
|---|---|---|---|---|---|
| S1: 12 variantes de credencial (ausente, vacía, errónea, código del render, cabecera antigua, ambas cabeceras, más de 200 caracteres, prefijo, espacios, cabecera duplicada, número, token del Blob) | `54e6fc3` | 401, sin llamar al almacén | `2e18161` | igual | C |
| S1: 7 configuraciones (sin Blob, sin código, solo el código del render, 31 o 201 caracteres, mismo valor que el render, vacío) | `54e6fc3` | 503, **sin *fallback*** | `2e18161` | igual | C |
| S1: 7 orígenes ajenos o ambiguos | `54e6fc3` | 403 | `2e18161` | igual | C |
| S1: el código de publicación no autoriza el Render IA y el del render no publica | `54e6fc3` | correcto | `2e18161` | igual | C |
| S1: ningún código, token del Blob ni clave del proveedor en respuestas o consola; `no-store` | `54e6fc3` | correcto | `2e18161` | igual | C |
| S2: variante con `?` o `#` final de la URL del archivo | `fdf7fc4` | **`removed:["…html?"]` y el objeto real sigue publicado** (proveedor simulado estricto) | S2 corregido | borra la URL canónica | **D** |
| S2: varias variantes del mismo archivo | `fdf7fc4` | varias llamadas, cada una con un resultado | S2 corregido | 1 llamada, 1 resultado | **D** |
| S2: `urls:[["…html"]]` (array anidado) | `fdf7fc4` | aceptado y borrado | S2 corregido | 400 `urls` | **D** |
| S2: URL de más de 2048 caracteres | `fdf7fc4` | aceptada | S2 corregido | 400 `urls` | P |
| S2: `:443`, host en mayúsculas, `.`, `..` dentro de la carpeta, barras invertidas | `fdf7fc4` | ya se normalizaban | — | igual | C |
| S2: `%2e%2e`, `%2F`, `%00`, punto final en el host, homógrafo, `@`, otro protocolo, `//host`, extensiones no admitidas, consulta, mayúsculas en la ruta | `fdf7fc4` | 400 antes de llamar al almacén | — | igual | C |
| S2: autorización (código del render, cabecera antigua, origen ajeno o `null`) | `fdf7fc4` | 401/403, nada borrado | — | igual | C |
| S2: límites (8 archivos, 8 KB en todas las formas, solo JSON, cuerpos mal formados) | `fdf7fc4` | correcto | — | igual | C |
| S2: fallos parciales y totales del almacén; reintento de lo pendiente | `fdf7fc4` | 207/502 por archivo; el reintento completa | — | igual | C |
| S2: registro local (sin códigos ni datos del proyecto; estado parcial; borrar historial sin borrar archivos) | `fdf7fc4` | correcto | — | igual | C |
| S2: `/api/view` tras retirar: 404 y `no-store` | `fdf7fc4` | correcto | — | igual | C |
| S2 interfaz: foco tras Cancelar, retirada, código erróneo, retirada parcial o historial | `fdf7fc4` | **foco en `<body>`, fuera del diálogo modal, y desplazamiento a 0** (de 653 px a 0 en 390×844) | S2 corregido | foco en la entrada o en el campo del código, a la vista | **D** |
| CI: las suites de S2 en algún workflow | `fdf7fc4` | **en ninguno** | S2 corregido | en `project-first.yml`, más las nuevas baterías | **D** |

**Evidencias:**

| Prueba | Antes | Después |
|---|---|---|
| `tests/gov08-s1-adversarial.test.cjs` | 5/5 (sobre `54e6fc3`) | igual |
| `tests/gov08-s2-adversarial.test.cjs` | 11/17 (sobre `fdf7fc4`): fallan los 4 casos D, el de la CI y la protección P | 17/17 |
| `tests/gov08-s2-focus.browser.test.cjs` | falla en «focus left the dialog after Cancelar» | 1/1 |

**Regresiones tras corregir:**
- API (`share-api`, `unshare-api`, `share-registry-core`, `ai-render-api`, `construction-delivery-core` y las dos baterías adversariales): 46/46.
- Navegador: `share-link`, `share-withdraw` ×2, foco, `client-share` ×2 y `ai-render`: 7/7.
- Evolución de obra: `ft3d-8-delivery`, 6/6, y su núcleo y `delivery-image`, 16/16.

No hay cambios en el Render IA (`api/render.js`, `js/ai-render-ui.js`).

## C. QA visual y funcional

Script: `scripts/qa/gov08-share-visual-qa.cjs`, con las funciones reales y el almacén simulado. Se ejecutó en 1440×900, 1280×800, 390×844 y 844×390.

**Flujos recorridos:**
- campo del código de publicación (tipo `password`, distinto del Render IA, solo en memoria);
- API sin configurar, código erróneo (el campo se vacía y no se guarda nada);
- dos publicaciones y «Mis publicaciones» (presentada como no completa);
- confirmar o cancelar, y retirada **con teclado**;
- el enlace retirado da 404 y el otro sigue en 200;
- retirada parcial, almacén inaccesible (queda parcial) y reintento;
- Escape.

**En todos los viewports:**
- sin scroll horizontal;
- el diálogo cabe en el viewport;
- foco visible al usar el teclado;
- ningún código guardado;
- el proyecto no cambia;
- sin peticiones externas ni errores.

En Evolución de obra solo se comprueban el campo y la cabecera de publicación: la publicación remota está desactivada en el producto (DEC-05).

**Capturas** en `docs/qa/artifacts/gov08-s1-s2/`:
- 7 estados por viewport;
- antes y después de la retirada en móvil: `before-fdf7fc4-gov08-6-withdrawn-390x844.png` frente a `gov08-6-withdrawn-390x844.png`.

**Nota:** con un **clic de ratón** Chromium no aplica `:focus-visible`. Es lo correcto, así que el foco se comprueba con teclado.

## D. Deuda residual: qué resuelven S1/S2 y qué no

S1 separa **quién puede publicar**. S2 permite **retirar el objeto almacenado** desde este navegador. **Ninguno hace privadas las entregas ni constituye seguridad comercial completa.**

| Deuda | Riesgo | Dependencia | Dificultad | Evidencia | Próximo corte | Decide el propietario |
|---|---|---|---|---|---|---|
| **S3 · caducidad** | Un enlace vive hasta que se retira a mano | S2 | Media: metadatos de caducidad y comprobación en `/api/view` | `api/view.js` no conoce fechas | S3 tras S2 | Plazo por defecto y si es obligatorio |
| **S4 · cuotas persistentes** | Sin límite de publicaciones ni de bytes por profesional; sin freno a intentos fallidos de código en share/unshare (render sí lo tiene) | Almacén persistente | Media | `api/share.js` no tiene medidor | S4 | Límites y almacén (KV / Edge Config) |
| **S5 · enlaces opacos / Blob privado** | La URL del Blob va en el enlace y se abre directamente; retirar no impide copias ya descargadas ni cachés (CDN hasta unos 60 s) | Blob privado o identificador opaco | Alta | `?f=<url del blob>` en `/api/view` | S5 | Blob privado y coste |
| **Documento en el origen de la app** | `/api/view` sirve HTML con `script-src 'unsafe-inline'` en el origen de RUBIK, y en ese origen el Render IA guarda su código en `localStorage`. Un HTML publicado con scripts propios (requiere el código de publicación) podría leerlo | S5 / ENT-01 | Baja-media: CSP `sandbox` sin `allow-same-origin`, u origen separado; hay que probar el formulario de observaciones | `csp()` en `api/view.js`; `TOKEN_KEY` en `js/ai-render-ui.js` | Con S5 o antes de ENT-01 | Aceptar `sandbox`; decidir el almacenamiento del código del render |
| **GOV-06a · identidad y permisos por profesional** | Un único código compartido: cualquiera que lo tenga puede retirar cualquier enlace cuya URL conozca | Cuentas | Alta | `_share-auth.js` | GOV-06a | Modelo de cuentas |
| **Registro en servidor y revocación global** | «Mis publicaciones» es local; otro equipo no ve nada y borrar los datos del sitio lo vacía | GOV-06a | Alta | `share-registry-core.js` | Tras GOV-06a | — |
| **ENT-01 · visita 3D segura** | Sin integrar; requiere S1+S2 en master | S1, S2 | Alta | #189 (contrato 9/9) | ENT-01 A/B | Orden e hitos |
| **Protección de datos y conservación** | Sin política de plazos de conservación ni de información al cliente | Decisión legal | — | — | — | Política y textos |
| **Render IA** (fuera de alcance) | Compara longitudes antes de `timingSafeEqual` (la longitud del código puede filtrarse por tiempos); su código en `localStorage`; rotación pendiente (§6 de S1) | — | Baja | `api/render.js`; `js/ai-render-ui.js` | Corte propio | Rotación del código |
| **Evolución de obra** | Sus publicaciones (modo laboratorio) no entran en «Mis publicaciones» | DEC-05 | Baja | `evolucion/delivery-ui.js` | Con ENT-01 | — |

No se han implementado S3, S4, S5, GOV-06a ni ENT-01.

## E. Preparación de ENT-01 (#189, sin integrar)

- #189 (`67243d4`) contiene solo el contrato puro (`js/client-delivery-core.js`, 9/9) y su documento. No se ha modificado.
- Su plan de integración **no reintroduce** los fallos que S1/S2 eliminan:
  - publica y retira con el permiso de S1;
  - el único parche en S2 admite exactamente `[\w-]+\.delivery\.json`;
  - sin endpoint nuevo de publicación;
  - modo cliente con almacenamiento en memoria;
  - `postMessage` con origen comprobado.
- Al aplicar el parche de `.delivery.json` hay que conservar la **canonicalización** añadida hoy en `ownFile`.
- Antes de servir la visita, conviene resolver el riesgo «documento en el origen de la app» (D).

| Capacidad | Ya existe | Contrato disponible | Dependencia S1/S2 | Prueba | Pendiente |
|---|---|---|---|---|---|
| Instantánea mínima de la vivienda | — | `buildSnapshot` / `validate` (#189) | No | 9/9 | Integración A |
| Publicar la instantánea | `/api/share` (HTML y vídeo) | Tipo `delivery` (§3 de #189) | S1 (permiso) | Pendiente | Parche en `api/share.js` |
| Leer la instantánea | `/api/view` (solo HTML) | `/api/delivery` (§3) | S1 | Pendiente | `api/delivery.js` |
| Retirar | `/api/unshare` (S2) | `.delivery.json` (§3) | S2 | S2: 17 + 5 + 6 + 3 | Ampliar la expresión, con la canonicalización |
| Registro de 3 archivos | «Mis publicaciones» (S2, hasta 8) | Sí | S2 | S2 | Integración B |
| Visita libre y guiada | Recorrido y Presentación (master) | Modo cliente (#166, a adaptar) | — | — | Integración B; sin una segunda navegación 3D |
| Minimapa y estancias | `presentation-core` y `review-anchors` | — | — | — | Reutilizar; no recuperar `delivery-map-core` |

## F. Plan de integración para el propietario

Este plan **no autoriza a ejecutarlo**:
1. Revisar y aceptar S1 (#187).
2. En un entorno autorizado:
   - crear `RUBIK_SHARE_TOKEN` (32 o más caracteres, distinto del render);
   - rotar el código del Render IA;
   - verificar 503/401/403 sin publicar nada real.
3. Revisar y aceptar S2 (#188):
   - cambiar su base a `master` tras S1;
   - merge de master;
   - CI completa.
4. Verificar la retirada de forma controlada con un enlace de prueba propio: `GET` → 405, URL ajena → 400, código del render → 401.
5. ENT-01 en otro corte (integración A y B).
6. S3–S5, el documento en el origen de la app y GOV-06a, según prioridades y decisiones.

## G. Dictamen

Pendiente de la CI del SHA final de cada PR. El resultado se registra en las PR y en el informe de entrega.
