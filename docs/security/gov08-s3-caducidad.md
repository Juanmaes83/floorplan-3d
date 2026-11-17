# GOV-08 S3 / ENT-02 · Caducidad de los enlaces de cliente

**Fecha:** 17/11/2026 · **Base:** `master@40b4ae5` (rama `feat/gov08-s3-caducidad-20261117`, independiente de #243).

**Estado:** implementación local con pruebas. **Pendiente de la aprobación del propietario.**

**No autoriza:** merge, despliegue, Production, cambios de variables de entorno ni borrado de ninguna publicación real. Todas las pruebas usan datos sintéticos, códigos ficticios y un almacén Blob simulado en memoria.

**Presupuesto de IA:** 0 €.

**No resuelve:**
- **GOV-08 S5:** enlaces opacos o Blob privado.
- **GOV-06a:** identidad y cuotas por profesional.

## 1. Política propuesta

| Regla | Implementación |
|---|---|
| 30 días por defecto | `x-rubik-share-ttl` ausente → 30 (`js/share-expiry-core.js`, `DEFAULT_TTL`) |
| Opciones de 7, 30 y 90 días | El diálogo «Enlace para el cliente» ofrece solo esas tres opciones; el servidor rechaza cualquier otro valor con `400 ttl` antes de tocar el almacén |
| Revocación anticipada | «Retirar» (S2, `api/unshare.js`) funciona igual sobre los nombres nuevos |
| Sin enlaces nuevos de duración ilimitada | No existe la opción. Tampoco se puede forzar desde un cliente: una cabecera de publicación que caduque en el pasado o más allá de 90 días (+10 min de holgura de reloj) se rechaza con `400 publication`. Si el servidor no devuelve fecha, el navegador no publica (`expiry`) y retira lo subido |
| Enlaces históricos sin fecha | Se **identifican** («sin fecha de caducidad (publicado antes de la caducidad de enlaces)») y **siguen abriéndose**. No se hacen caducar ni se borran retroactivamente |

La entrega de la Evolución 4D (`evolucion/delivery-ui.js`) también publica con `api/share`. No envía TTL, así que recibe los 30 días por defecto. Su página y su vídeo comparten la misma fecha y el mensaje final indica cuándo caduca. Añadirle un selector queda como mejora posterior.

## 2. Dónde vive la fecha

El servidor es el único que da nombre a lo que guarda en Blob, y escribe la caducidad en el nombre de cada archivo:

```
rubik-share/<slug>--<publicación: 24 hex aleatorios>--x<AAAAMMDDHHMM UTC>[-<sufijo del proveedor>].<html|mp4|webm|delivery.json>
```

- **Ventajas:**
  - no hace falta ninguna base de datos ni ningún índice adicional;
  - la fecha no se puede alterar desde fuera, porque el nombre lo fija el servidor;
  - el formato del enlace (`/api/view?f=…`) y la validación de S2 no cambian.
- **Agrupación:** la página, su vídeo y su visita 3D comparten el identificador de publicación y la fecha. La primera subida recibe `{publication:{header,expiresAt}}` y las siguientes envían `x-rubik-share-publication`.
- **Comprobación al subir:** si el almacén devolviera un nombre sin esa publicación y esa fecha, `api/share.js` responde `502`, porque ese archivo nunca podría caducar.
- **Archivos antiguos:** cualquier archivo de `rubik-share/` que no siga el patrón se publicó antes de S3 y se considera *legacy*.

## 3. Caducidad del visor, acceso directo a Blob y borrado efectivo

Son tres cosas distintas y la interfaz no las confunde:

| Mecanismo | Qué hace | Cuándo actúa | Qué **no** impide |
|---|---|---|---|
| **Caducidad del visor** (`api/view.js`, `api/delivery.js`) | Responde `410 «Este enlace ha caducado»` (página) o `410 {error:'expired'}` (visita 3D) | Desde el minuto exacto de caducidad. Comprueba el nombre **antes** de leer el almacén y responde con `no-store` | El acceso directo a la URL pública de Blob, que va dentro del propio enlace (`?f=`), y el vídeo, que la página carga directamente desde Blob |
| **Acceso directo a Blob público** | El almacén es público: quien tenga la URL `…public.blob.vercel-storage.com/rubik-share/…` la abre | Mientras el archivo exista | — (es la limitación de fondo, objeto de S5) |
| **Borrado efectivo** | Elimina el objeto del almacén: `api/unshare.js` (retirar uno) o `api/publications.js` (limpiar los caducados) | Al retirar o al limpiar. La CDN de Blob puede servir una copia hasta **un minuto** después de borrar (documentación oficial de `del()`) | Las copias que alguien ya descargó |

**Conclusión:**
- La caducidad del visor cierra el enlace que se compartió.
- Solo el **borrado** cierra el acceso directo.
- Por eso S3 incluye una limpieza controlada y lo explica en el diálogo: «desde ese momento deja de abrirse, y sus archivos se borran del almacén al retirarlo o al limpiar los caducados».

## 4. Registro de publicaciones con el mínimo de datos

`POST /api/publications {"action":"list"}`:
- **Qué hace:** lista `rubik-share/` del almacén propio y agrupa los archivos por publicación usando solo lo que dicen sus nombres.
- **Qué devuelve:** por publicación, `id`, `state` (active, expired o legacy), `expiresAt` y `files[]` con `url`, `size` y `uploadedAt`.
- **Qué no guarda:** ningún índice adicional, ningún dato del proyecto o del cliente y ningún código.
- **Autorización:** la misma que publicar (S1), con origen propio, JSON y un cuerpo de 1 KB como máximo.

«Mis publicaciones», el registro local de cada navegador, guarda además `expiresAt` y `ttlDays`. Si una entrada no tiene fecha, se muestra como *legacy*.

## 5. Limpieza controlada de archivos caducados

`POST /api/publications {"action":"purge-expired"}`:

1. **Simulación por defecto:** sin `confirm:true` no borra nada. Devuelve `wouldRemove`, los recuentos y `legacyUntouched`.
2. **Alcance:** con `confirm:true` borra **solo** archivos cuyo nombre indica que han caducado. Nunca toca los activos ni los *legacy*.
3. **Orden de borrado:** primero la página, de modo que el enlace queda cerrado aunque falle lo demás; después la visita 3D y por último el vídeo.
4. **Reintentos:**
   - cada archivo se reintenta una vez;
   - la respuesta es `200` (todo borrado), `207` (parcial) o `502` (nada);
   - repetir la limpieza termina lo pendiente, porque borrar un archivo inexistente cuenta como éxito;
   - como máximo se borran 200 archivos por llamada (`more` avisa si quedan más), y el listado se detiene tras 20 páginas de 1000 (`truncated`).
5. **Interfaz:** en «Almacén de publicaciones», «Revisar el almacén» muestra los recuentos y los archivos sin fecha. «Borrar los archivos de N enlace(s) caducado(s)» primero simula y después pide una confirmación explícita. Las entradas de este navegador cuyos archivos se borraron pasan a «Retirado».

**Limpieza automática (no activada):**
- Se podría programar con un *Vercel Cron*.
- Exigiría tocar `vercel.json` y añadir un secreto propio del cron.
- Queda como **decisión pendiente** y no se ha tocado la configuración de Vercel.

## 6. Compatibilidad

| Elemento | Resultado |
|---|---|
| **S1** (código de publicación propio) | Sin cambios: publicar, listar y limpiar exigen `RUBIK_SHARE_TOKEN`. El código del Render IA y otros orígenes se rechazan sin llamar al almacén |
| **S2** (retirada) | Sin cambios: `api/unshare.js` acepta los nombres nuevos y la retirada anticipada funciona antes de la fecha |
| **Aislamiento del visor** | La misma CSP: `sandbox allow-scripts allow-downloads`, sin `allow-same-origin`, comprobada sobre una página con fecha |
| **ENT-01** (visita 3D) | La visita caducada muestra «Esta visita ha caducado… Pide al profesional un enlace nuevo», sin botón de reintentar. Las visitas anteriores a S3 siguen abriéndose |
| **Archivos asociados** | El vídeo y la visita 3D comparten la publicación y la fecha de la página, y se limpian con ella |

## 7. Defectos encontrados durante la implementación

| Defecto | Corrección | Prueba |
|---|---|---|
| `share-registry-core.js` convertía una fecha vacía en `1970-01-01` (`new Date(null)`). Una entrada *legacy* habría pasado a «caducada» al guardarse de nuevo, y `withdrawnAt` también quedaba en 1970 | `iso()` mantiene vacío lo que está vacío | Unitaria y de navegador |
| En «Mis publicaciones», una variable nueva tapaba el elemento de estado del diálogo, de modo que «Retirar» dejaba de funcionar tras una limpieza | Variable renombrada | Prueba de navegador S3 |
| `gov08-s2-focus.browser` comprobaba el foco al llegar la respuesta, antes de redibujar. Era una carrera previa que falló una vez bajo carga | Espera al mensaje que acompaña al cambio de foco, como ya hacían sus otros pasos. Sin relajar ninguna aserción | 3/3 en aislado y verde en la batería |

## 8. Pruebas (todas locales, datos sintéticos)

| Suite | Resultado |
|---|---|
| `tests/gov08-s3-expiry.test.cjs` (servidor con reloj simulado, nueva) | **21/21** |
| `tests/gov08-s3-expiry.browser.test.cjs` (app real con reloj del navegador y del servidor, nueva, partición `blocking`) | **3/3** |
| Suite pura completa (`tests/*.test.cjs` sin navegador) | **1392/0** |
| `share-withdraw` 2/2 · `share-link` 1/1 · `client-share` 2/2 · `delivery-3d-link` 1/1 · `gov08-s2-focus` 1/1 · `gov08-view-isolation` 8/8 · `ft3d-8-delivery` 6/6 | verde |

**Qué cubren:**
- **Reloj:** un minuto antes, en el minuto exacto y después de la caducidad, tanto en el visor como en la visita 3D.
- **Ciclo de vida:** revocación antes de la fecha; publicaciones antiguas; archivos asociados.
- **Almacén:** fallos transitorios y persistentes, listado que falla y paginación.
- **Seguridad:** accesos no autorizados; nada sensible en las respuestas; aislamiento.
- **Visual:** pantallas de 1440×900 y 390×844, sin desbordamiento horizontal y con objetivos táctiles ≥ 32 px.

**Ajustes en tests existentes, sin relajar aserciones:**
- Los almacenes simulados de `share-api`, `gov08-s1-adversarial` y `construction-delivery-core` devolvían una URL fija. Ahora devuelven el nombre pedido más un sufijo, como hace Blob.
- Las expresiones de nombre de `share-api`, `ent01-delivery-api` y `construction-delivery-core` exigen ahora la publicación y la fecha.
- La de `share-link` exige además la fecha de caducidad.

**No verificado:**
- La forma exacta de la respuesta del listado de Blob se tomó de la documentación oficial (`{blobs:[{url,pathname,size,uploadedAt}],cursor,hasMore}`). **No se ha probado contra un almacén real.** Hay que confirmarlo en Preview con un almacén de prueba.
- Tampoco se ha contado cuántas publicaciones *legacy* hay en Production: exige listar el almacén real.

## 9. Decisiones pendientes del propietario

1. **Política:** aprobar 7, 30 o 90 días con 30 por defecto, o cambiarla.
2. **Publicaciones *legacy*:** decidir qué hacer con ellas. Opciones:
   - (a) mantenerlas indefinidamente;
   - (b) fijarles una fecha anunciada y retirarlas después;
   - (c) retirarlas ya.

   Sin esa decisión, no se toca ninguna.
3. **Limpieza automática:** decidir si se activa con Vercel Cron, lo que exige cambiar `vercel.json` y añadir un secreto, o si se mantiene manual.
4. **Validación en Preview** con un almacén Blob de prueba, sin datos de clientes, antes de cualquier merge.
5. **Reconciliación con #243:** esta rama parte de `40b4ae5`. Cuando se fusione #243, se incorpora `master` y se actualizan las filas GOV-08 y ENT-02 del Estado Maestro, que hoy no se tocan aquí para no mezclar cortes.
