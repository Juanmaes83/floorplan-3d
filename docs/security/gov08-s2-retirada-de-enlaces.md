# GOV-08 / ENT-02 S2 — Retirada individual de enlaces publicados

**Fecha:** 10/11/2026.
**Rama:** `security/gov08-s2-unshare`, **apilada sobre S1** (`security/gov08-s1-share-token`, PR #187).
**Estado:** borrador. No está fusionada ni activa en Production.
**Secretos:** este documento no contiene ninguno. Las pruebas usan códigos ficticios y un almacén simulado. No se ha borrado ningún objeto real.

## 1. Qué añade

| Pieza | Archivo | Qué hace |
|---|---|---|
| Permiso común | `api/_share-auth.js` (nuevo) | Concentra la regla de S1 para publicar y para retirar: `RUBIK_SHARE_TOKEN` en `x-rubik-share-token`, comparación en tiempo constante, mismo origen, `not-configured`, `misconfigured` y `token`. Vercel no publica como función los archivos con `_`. `api/share.js` lo usa sin cambiar su comportamiento. |
| API de retirada | `api/unshare.js` (nuevo) | `POST /api/unshare` con JSON `{"urls":[…]}`. Borra del Vercel Blob propio la página del cliente y su vídeo. |
| Visor sin caché propia | `api/view.js` | `Cache-Control: no-store` (antes `public, max-age=60`) |
| Registro local | `js/share-registry-core.js` (nuevo) | «Mis publicaciones» en `localStorage` (`rubik-share-publications-v1`), con lista blanca de campos y sin códigos |
| Interfaz | `js/share-link-ui.js`, `css/project-first.css`, `index.html` | Sección «Mis publicaciones (este navegador)» en «Publicar enlace para el cliente»: datos de la publicación, «Abrir», «Retirar» con confirmación, y estado de éxito, error o retirada incompleta |

### Reglas de `/api/unshare`
- **Método:** solo `POST`; un `GET` responde 405. Solo `Content-Type: application/json`; un formulario simple recibe 415.
- **Permiso:** el de S1, sin excepciones. El código del Render IA y la cabecera antigua dan 401. Sin `RUBIK_SHARE_TOKEN`, 503 `not-configured`, sin alternativa. Otro origen, 403.
- **Qué se puede borrar:** solo `https://<almacén propio>/rubik-share/<nombre>.html|.mp4|.webm`. Se rechazan:
  - otro almacén u otra carpeta;
  - subcarpetas, `..`, consultas o fragmentos;
  - usuario o contraseña en la URL, otro puerto u otra extensión.

  Un solo archivo no válido rechaza la petición entera (400 `urls`), sin borrar nada.
- **Límites:** como máximo 8 archivos distintos por petición (400 `too-many`), con duplicados unificados, y un cuerpo de como máximo 8 KB.
- **Resultado por archivo:** 200 si se borran todos, 207 si se borran algunos, 502 si no se borra ninguno. La respuesta incluye `{removed:[…], failed:[{url,error}]}`.
- **Retirar dos veces no da error:** el borrado de Vercel Blob no falla si el archivo ya no existe.
- **Códigos:** nunca se registran ni se devuelven.

### Interfaz «Mis publicaciones»
- **Cada publicación** muestra el proyecto y la versión, la fecha, el tipo («Documento para el cliente» o «… con vídeo»), «Abrir» y «Retirar».
- **«Retirar»** muestra «El cliente dejará de poder abrir este enlace… No se puede deshacer» y pide «Sí, retirar enlace» o «Cancelar».
- **El código** es el de publicación, el mismo campo del diálogo. Se mantiene solo en memoria y **nunca entra en el registro**.
- **Resultados:**
  - **retirado:** el estado pasa a «Retirado el …» y desaparecen las acciones;
  - **retirada incompleta:** se guarda qué archivos faltan y «Retirar» vuelve a intentar solo esos;
  - **error de código o de servidor:** mensaje claro y no se modifica nada.
- **Aviso visible en la sección:** «no es un registro completo… otro equipo o navegador no los ve», y quien descargó el archivo conserva su copia.

## 2. Pruebas

| Suite | Qué cubre |
|---|---|
| `tests/unshare-api.test.cjs` (nueva) | Permiso de S1 (código del render, cabecera antigua, sin código, sin variable, `misconfigured`, origen, GET, `Content-Type`); 15 URL ajenas o inválidas; máximo 8 archivos y duplicados. **Flujo completo:** publicar → abrir (200) → retirar → `/api/view` da **404**; otro enlace sigue en **200**; retirar dos veces no falla. Página y vídeo juntos. Fallo parcial (207) y total (502), detallados por archivo. Los códigos no aparecen en las respuestas. |
| `tests/share-registry-core.test.cjs` (nueva) | Lista blanca (no se guardan códigos ni datos del proyecto), solo URL https, almacenamiento roto, máximo 50 entradas, estados `withdrawn` y `partial`, y que dos publicaciones con URL largas parecidas no se pisen |
| `tests/share-withdraw.browser.test.cjs` (nueva) | Con las funciones reales `share`, `view` y `unshare` sobre un almacén simulado. Se publican dos enlaces y aparecen en la lista. «Cancelar» no borra nada. El código del render recibe 401 y no se borra nada. La retirada confirmada da 200 y deja el estado «Retirado». El enlace retirado da 404 y el otro sigue en 200. Un fallo total del almacén se muestra como retirada incompleta y el reintento termina la retirada. El registro no contiene ningún código, el proyecto no cambia y no hay peticiones externas. |
| Regresión | Suites de S1, publicación, entrega, Render IA, Home y espacio profesional (ver la PR) |

## 3. Límites, que S2 **no** resuelve

| Concepto | Situación tras S2 |
|---|---|
| **Revocar el objeto almacenado** | ✔ El archivo se borra del Vercel Blob propio |
| **Controlar el acceso al enlace** | ✘ El enlace sigue siendo «quien lo tenga lo abre». La URL directa de Blob va dentro del enlace (S5). |
| **Cachés intermedias** | `/api/view` ya no guarda en caché su respuesta (`no-store`). Pero lee el archivo a través de la CDN de Vercel Blob, que lo guarda **hasta 60 s** (`x-cache-control-max-age: 60`, fijado al publicar). Durante esa ventana el enlace, o la URL directa del Blob, aún puede servir la copia. Quien lo descargó o guardó conserva su copia. |
| **Registro local o persistente** | El registro vive solo en el navegador que publicó. No es autoritativo: otro equipo no lo ve y borrar los datos del sitio lo vacía. Lo publicado desde otro sitio se retira desde el panel de Vercel Blob. Un registro en el servidor necesita identidad (GOV-06a). |
| **Permiso compartido o identidad del profesional** | Cualquiera que tenga el código de publicación puede retirar cualquier enlace del almacén **si conoce su URL**. No hay propiedad por profesional (GOV-06a). |
| **Evolución 4D (`evolucion/`)** | Sus publicaciones (solo en modo laboratorio) **no** entran en «Mis publicaciones»: se retiran desde el panel de Vercel Blob. Pendiente de un corte posterior. |
| **Caducidad, cuotas, Blob privado** | Pendientes: S3, S4 y S5 |

## 4. Dependencia de S1 y pasos de integración
1. S2 está apilado sobre S1. **No se fusiona antes que S1** ni sin la variable `RUBIK_SHARE_TOKEN` en Production: sin ella, publicar y retirar responden 503.
2. Cuando S1 esté en master:
   - cambiar la base de la PR de S2 a `master`;
   - incorporar master con un merge;
   - comprobar que el diff contiene solo los archivos de S2;
   - repetir la CI y las pruebas de este documento.
3. Después de publicar S2, para comprobarlo sin borrar nada real:
   - enviar a `/api/unshare` una URL ajena con el código correcto → 400 `urls`;
   - enviarla con el código del render → 401;
   - enviar un `GET` → 405.

   La retirada de un enlace real la decide el propietario desde «Mis publicaciones».
