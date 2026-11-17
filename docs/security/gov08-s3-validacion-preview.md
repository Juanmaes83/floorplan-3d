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

**Variables de entorno:**
- `PREVIEW_SHARE_URL`: el enlace compartido del Preview.
- `RUBIK_S3_TEST_CODE`: el código de prueba. Nunca se imprime.
- `TEST_STORE_HOST`: el host público del almacén de prueba.
- `PRODUCTION_STORE_HOST`: el host público del almacén de Production, tomado de los metadatos de Vercel, nunca de su token.

**Protecciones.** Cualquier fallo de estas se cuenta como FAIL y el guion termina con código 1:
1. **Aislamiento probado antes de escribir:** `/api/publications` debe nombrar exactamente `TEST_STORE_HOST`, distinto de Production, con un listado completo (sin truncar). Si no, se detiene **sin escribir nada**.
2. **Almacén exclusivo y vacío:** ninguna publicación activa, caducada, histórica ni incoherente antes de empezar. Si no, se detiene sin escribir y **no borra nada que no sea suyo**.
3. **Cada archivo creado debe estar en el almacén de prueba.** Si no, se detiene y retira lo creado.
4. **Listado truncado o limpieza con `more`:** el guion se detiene.
5. **La simulación no borra:** el conjunto de archivos del almacén es idéntico antes y después.
6. **Coincidencia exacta:**
   - lo previsto (`wouldRemove`) son exactamente la página, la visita 3D y el vídeo caducados;
   - lo borrado (`removed`) es exactamente lo previsto, sin fallos;
   - después, el almacén queda vacío.
7. **Limpieza final verificada:** retira lo que quede del propio guion y exige que el almacén esté vacío. Si no lo está, FAIL.

En el servidor real no se puede adelantar el reloj. La caducidad se prueba con una publicación cuya fecha queda a **3 minutos**, algo que el contrato permite: cualquier fecha entre «ahora» y 90 días.

| # | Prueba | Esperado |
|---|---|---|
| 0 | Comprobación previa sin escritura | Almacén de prueba, completo y vacío |
| 1–3 | Publicar a 7 días, abrir y retirar antes de la fecha | Fecha correcta, CSP aislada, retirada exacta; `404` y fuera del almacén |
| 4 | Vídeo, visita 3D y página con fecha a 3 minutos | Los tres en el almacén de prueba, con **un** identificador y **una** fecha |
| 5 | Antes de la fecha | Página `200`, visita 3D `200`, vídeo `200` |
| 6 | Después de la fecha | Página `410` y visita 3D `410`. **Límite S5:** el vídeo sigue accesible directamente hasta que se borra |
| 7 | Registro | La publicación caducada aparece con exactamente sus 3 archivos y sin incoherencias |
| 8 | Limpieza simulada | Prevé exactamente esos 3 y no borra nada |
| 9 | Limpieza confirmada | Borra exactamente lo previsto; el almacén queda vacío; el vídeo deja de responder directamente (tolerancia de caché ≈1 min) |
| 10 | Accesos no autorizados | `401`/`401`/`403` |
| 11 | Fallos parciales | **No se fuerzan contra el almacén real.** Cubiertos con el almacén simulado: un reintento por archivo; `207` y repetición; `502` |
| 12 | Interfaz real (1440×900 y 390×844) | Selector 7/30/90 con 30 marcado; capturas |

**Ensayo local del guion** (17/11/2026), contra las funciones reales sobre un almacén simulado y sin ningún almacén real:
- recorrido completo: **30/30 PASS**;
- almacén que no es el de prueba: **se detiene en el paso 0, sin escribir**;
- almacén no vacío: **se detiene en el paso 0, sin escribir ni borrar nada ajeno**.

La variable `REHEARSAL_BLOB_BASE` existe solo para ese ensayo: tiene que apuntar a `127.0.0.1` y una ejecución real no la define.

## 4. Después de la prueba

- **Recomendado:** desconectar el almacén de prueba del Preview y borrarlo.
- Borrar la variable de prueba `RUBIK_SHARE_TOKEN` de esa rama.
- Adjuntar los resultados (sin códigos ni tokens) y las capturas en la PR de S3.
