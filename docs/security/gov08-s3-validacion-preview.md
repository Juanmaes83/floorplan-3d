# GOV-08 S3 · Protocolo de validación en Preview con un almacén Blob aislado

**Estado:** preparado. **No ejecutado.** Necesita la autorización expresa del propietario antes de usar cualquier almacenamiento real.

**Datos:** solo sintéticos («Proyecto de ejemplo»). Ningún dato de clientes. Presupuesto de IA: 0 €.

## 1. Por qué hace falta un almacén aparte

Comprobación de metadatos del 17/11/2026, sin leer ningún valor:
- **`BLOB_READ_WRITE_TOKEN` es una sola variable** para Production, Preview y Development. Un Preview usa **el mismo almacén que los enlaces reales de los clientes**: probar ahí no estaría aislado.
- **`RUBIK_SHARE_TOKEN` existe solo en Production.** En Preview, publicar responde `503 not-configured`.

## 2. Preparación (la hace el propietario en Vercel)

1. **Crear un almacén Blob nuevo, de acceso público** como el de Production, por ejemplo `rubik-s3-pruebas`.

   Conectarlo **solo a Preview** y, si el panel lo permite, solo a la rama `feat/gov08-s3-caducidad-20261117`. Vercel crea entonces una variable `BLOB_READ_WRITE_TOKEN` propia de esa conexión.

   **Antes de seguir, hay que comprobar en el panel** que para Preview de esa rama manda esa variable, y no la general compartida con Production. Si no se puede limitar por rama, no se ejecuta la prueba.
2. **Crear `RUBIK_SHARE_TOKEN` de prueba** con estas condiciones:
   - limitada a Preview y a esa rama;
   - tipo *sensitive*;
   - 32 caracteres como mínimo;
   - distinta del código del Render IA y del código real de Production.

   El valor lo introduce el propietario. Claude no lo lee: lo recibe solo para el guion de prueba, por variable de entorno, y nunca lo muestra.
3. **Volver a desplegar el Preview** de la rama.

**No se toca:**
- Production, sus variables ni sus secretos;
- el almacén de Production;
- ninguna publicación histórica.

## 3. Pruebas (guion `scripts/qa/gov08-s3-preview-validation.cjs`)

En el servidor real no se puede adelantar el reloj. La caducidad se prueba con una publicación cuya fecha queda a **3 minutos**, algo que el contrato permite: cualquier fecha entre «ahora» y 90 días.

| # | Prueba | Esperado |
|---|---|---|
| 1 | Publicar una página sintética con 7 días | `200`; nombre con `--<id>--x<fecha>`; `publication.expiresAt` igual a ahora + 7 días |
| 2 | Abrirla por `/api/view` | `200` con la CSP aislada (`sandbox` sin `allow-same-origin`) |
| 3 | Revocación anticipada: retirarla con `/api/unshare` | `200`; `/api/view` responde `404` |
| 4 | Publicar página y visita 3D con una fecha a 3 minutos (misma publicación) | `200` las dos, con el mismo identificador y la misma fecha |
| 5 | Antes de esa fecha | página `200` y visita 3D `200` |
| 6 | Después de esa fecha | página `410` y visita 3D `410 {error:'expired'}` |
| 7 | Revisar el almacén (`list`) | La publicación caducada aparece como `expired`; ninguna `inconsistent` |
| 8 | Limpieza simulada (`purge-expired` sin confirmar) | `wouldRemove` = los 2 archivos; el almacén no cambia |
| 9 | Limpieza confirmada | `200`, `removed` = los 2; un nuevo `list` ya no los incluye |
| 10 | Accesos no autorizados (sin código, código erróneo, otro origen) | `401`/`403`; nada cambia |
| 11 | Fallos parciales | **No se fuerzan contra el almacén real.** Están cubiertos con el almacén simulado: un reintento por archivo; `207` y repetición; `502` |
| 12 | Interfaz real en el navegador (1440×900 y 390×844) | Selector 7/30/90 con 30 marcado; «Mis publicaciones» con fecha; «Almacén de publicaciones» con recuentos. Capturas |

El guion termina limpiando lo que haya creado, incluso si una prueba falla. Al acabar, el almacén de prueba queda vacío.

## 4. Después de la prueba

- **Recomendado:** desconectar el almacén de prueba del Preview y borrarlo.
- Borrar la variable de prueba `RUBIK_SHARE_TOKEN` de esa rama.
- Adjuntar los resultados (sin códigos ni tokens) y las capturas en la PR de S3.
