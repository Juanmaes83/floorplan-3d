# GOV-08 S3 / ENT-02 · Caducidad de los enlaces de cliente

**Corte verificado 17/11/2026:** master `8525025a1470d48d52d8e365070e5a0acf116134`, #243/#244/#245 fusionadas; 11 checks de master correctos. Árbol `5441db02b71407ab03731216054165eee24940c0`, idéntico a #244 `28a01b0`. La evidencia recuperada del Preview aislado acredita 30/30 comprobaciones reales y 7/7 de conservación, sin usar Blob de Production. [Evidencia original](../qa/evidencias-s3-2026-11-17/result.json). Tras autorización expresa del propietario en esta sesión, se promovió `dpl_Bx191sBDRSa2nqhm8bwZhZzryvgA`; el alias público ya apunta a ese deployment. El anterior `dpl_GHMoRKmGrvnST5NmCoALfRuYsvFs` se conserva como recuperación. S4, S5 y GOV-06a siguen pendientes.

**Fecha:** 17/11/2026 · **Base:** `master@40b4ae5`, reconciliada con `master@f31f303` (referencias editoriales del propietario, sin cambios de código). Rama `feat/gov08-s3-caducidad-20261117`, independiente de #243.

**Estado:** integrado mediante #244; evidencia de aceptación aislada recuperada.

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
- **Consistencia comprobada:** al publicar desde la interfaz con vídeo y visita 3D a 90 días, las tres subidas usan la misma publicación. La primera pide el TTL y las otras dos se unen a ella. Los tres nombres llevan el mismo identificador y la misma fecha, y en esa fecha se cierran y se limpian juntos (prueba de navegador y de servidor).
- **Agrupación incoherente:** un cliente autorizado podría reutilizar un identificador con otra fecha válida. Esa publicación se marca como `inconsistent`, aparece en «Almacén de publicaciones» y **la limpieza no toca ninguno de sus archivos**. Además, antes de borrar se comprueba la fecha propia de cada archivo, de modo que un archivo cuyo nombre dice que sigue activo nunca se borra. La primera versión (`8c5ee2a`) tomaba la fecha más temprana del grupo; se corrigió con su prueba.
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
   - **Listado incompleto:** si el listado está truncado, o el almacén dice «hay más» sin dar cursor, la limpieza confirmada se **rechaza** (`409 incomplete-listing`) sin ninguna llamada de borrado. La simulación sigue informando, marcada `truncated`.
5. **Interfaz:** en «Almacén de publicaciones», «Revisar el almacén» muestra los recuentos y los archivos sin fecha. «Borrar los archivos de N enlace(s) caducado(s)» primero simula y después pide una confirmación explícita. Las entradas de este navegador cuyos archivos se borraron pasan a «Retirado».

**Limpieza automática (no activada):**
- Se podría programar con un *Vercel Cron*.
- Exigiría tocar `vercel.json` y añadir un secreto propio del cron.
- Queda como **decisión pendiente** y no se ha tocado la configuración de Vercel.

## 6. Limitaciones que siguen abiertas (GOV-08 S5 y otras)

S3 **no** convierte los enlaces en privados. Sigue pendiente lo siguiente:

1. **Almacén público:** el enlace lleva dentro la URL del archivo en Blob (`?f=https://…public.blob.vercel-storage.com/…`). Quien la copie puede abrir el archivo **directamente**, sin pasar por el visor, hasta que se borre. La caducidad del visor no lo impide.
2. **Vídeo del recorrido:** la página lo reproduce directamente desde Blob (`media-src` del almacén). Tampoco pasa por la comprobación de caducidad, así que se cierra solo al borrarlo.
3. **Entre la fecha y la limpieza:** el archivo sigue en el almacén. La limpieza es **manual** por decisión del propietario: no hay Cron.
4. **Caché de la CDN de Blob:** puede servir un archivo hasta un minuto después de borrado. Las copias descargadas no se pueden retirar.
5. **No es un control de acceso:** cualquiera con el enlace lo abre mientras no caduque. No hay usuarios del cliente, ni contraseña, ni registro de quién lo abrió.
6. **Código compartido:** publicar, retirar y limpiar dependen de un código común del estudio. Los permisos y cuotas por profesional son **GOV-06a**.
7. **Registro de publicaciones:** se deduce de los nombres del almacén. No guarda quién publicó ni para qué cliente; es una decisión deliberada de datos mínimos.

**Qué haría falta para S5:**
- un almacén **privado de Vercel Blob** (la documentación oficial lo ofrece, leído con el token desde el servidor);
- enlaces **opacos**: un identificador que el servidor resuelve, sin la URL del archivo;
- servir el vídeo también a través del servidor.

Supone migrar las publicaciones existentes y no entra en este corte.

## 7. Compatibilidad

| Elemento | Resultado |
|---|---|
| **S1** (código de publicación propio) | Sin cambios: publicar, listar y limpiar exigen `RUBIK_SHARE_TOKEN`. El código del Render IA y otros orígenes se rechazan sin llamar al almacén |
| **S2** (retirada) | Sin cambios: `api/unshare.js` acepta los nombres nuevos y la retirada anticipada funciona antes de la fecha |
| **Aislamiento del visor** | La misma CSP: `sandbox allow-scripts allow-downloads`, sin `allow-same-origin`, comprobada sobre una página con fecha |
| **ENT-01** (visita 3D) | La visita caducada muestra «Esta visita ha caducado… Pide al profesional un enlace nuevo», sin botón de reintentar. Las visitas anteriores a S3 siguen abriéndose |
| **Archivos asociados** | El vídeo y la visita 3D comparten la publicación y la fecha de la página, y se limpian con ella |
| **Publicaciones anteriores a S3** | Siguen abriéndose (página y visita 3D, con cualquier reloj). No se modifican ni se borran: la limpieza nunca toca las *legacy* |
| **Entrega de la Evolución 4D** | Publica con 30 días por defecto. Vídeo y página comparten publicación (`ft3d-8-delivery` 6/6, `construction-delivery-core` 11/11) |

## 8. Defectos encontrados durante la implementación

| Defecto | Corrección | Prueba |
|---|---|---|
| `share-registry-core.js` convertía una fecha vacía en `1970-01-01` (`new Date(null)`). Una entrada *legacy* habría pasado a «caducada» al guardarse de nuevo, y `withdrawnAt` también quedaba en 1970 | `iso()` mantiene vacío lo que está vacío | Unitaria y de navegador |
| En «Mis publicaciones», una variable nueva tapaba el elemento de estado del diálogo, de modo que «Retirar» dejaba de funcionar tras una limpieza | Variable renombrada | Prueba de navegador S3 |
| `api/publications.js` agrupaba por identificador con la fecha más temprana: una agrupación incoherente podía llevar a borrar un archivo cuyo propio nombre seguía activo | Estado `inconsistent`, que nunca se limpia, y comprobación de la fecha propia de cada archivo antes de borrarlo | `gov08-s3-expiry`: «incoherent grouping…» |
| `gov08-s2-focus.browser` comprobaba el foco al llegar la respuesta, antes de redibujar. Era una carrera previa que falló una vez bajo carga | Espera al mensaje que acompaña al cambio de foco, como ya hacían sus otros pasos. Sin relajar ninguna aserción | 3/3 en aislado y verde en la batería |

## 9. Pruebas (todas locales, datos sintéticos)

| Suite | Resultado |
|---|---|
| `tests/gov08-s3-expiry.test.cjs` (servidor con reloj simulado, nueva) | **23/23** |
| `tests/gov08-s3-expiry.browser.test.cjs` (app real con reloj del navegador y del servidor, nueva, partición `blocking`) | **4/4** |
| Ensayo local de `scripts/qa/gov08-s3-preview-validation.cjs` endurecido (funciones reales y almacén simulado) | **30/30**; con un almacén equivocado o no vacío, se detiene sin escribir |
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

**Validación real vigente:** ejecutada sobre `28a01b0` en Preview `dpl_BLpr8QmGMd6mUxn1Wfaf5cCmLkep`, con Blob exclusivo de prueba: [30/30 comprobaciones](../qa/evidencias-s3-2026-11-17/result.json) y [7/7 conservación](../qa/evidencias-s3-2026-11-17/retention-result.json). Se verificó listado real completo, simulación sin borrado, retirada exacta, conservación de vigentes e históricos y limpieza final vacía. Evidencia original recuperada, no ejecución repetida.

**Histórico sustituido:** antes de crear las variables de Preview exclusivas, el protocolo estaba preparado pero bloqueado por compartir Blob con Production. Ese bloqueo fue resuelto para el ensayo aislado. No se ha contado el número de publicaciones históricas en Production ni se ha usado ese almacén para validar borrados.

## 10. Política fijada por el propietario y decisiones pendientes

### Revisión residual de Codex del 17/11/2026

El listado exige un `hasMore` booleano y solo considera completa una respuesta con `hasMore: false`.
Una respuesta sin ese indicador, o con un valor de otro tipo, queda marcada como incompleta.
La limpieza confirmada responde `409 incomplete-listing` y no envía ninguna petición de borrado.
La prueba añadida reproduce el fallo anterior y cubre seis valores ausentes o malformados.
Validación local de esta corrección sobre almacén simulado, sin conexiones a Production,
con 56/56 pruebas de servidor y 4/4 pruebas de navegador S3 correctas.

**Fijado el 17/11/2026:**
- **Caducidad:** opciones de 7, 30 y 90 días; **30 por defecto**.
- **Publicaciones históricas:** **no se modifican ni se borran**. Siguen abriéndose y solo se identifican como «sin fecha de caducidad».
- **Limpieza:** **manual** por ahora; **no se activa Cron**.
- **Production y secretos:** no se tocan.

**Cierres acreditados:** #243 y #244 fusionadas; reconciliación de master y validación aislada terminadas. Los resultados mantienen sus SHA de origen.

**Pendiente real:** S4 cuotas, S5 almacenamiento privado/enlaces opacos y GOV-06a. La limpieza sigue manual. Las dos variables temporales de Preview de la rama S3 siguen configuradas: su retirada requiere autorización expresa y no afecta a Production. Retirar variables no revoca automáticamente credenciales incorporadas en deployments existentes.
