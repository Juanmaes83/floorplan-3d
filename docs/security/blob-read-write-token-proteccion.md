# Protección de `BLOB_READ_WRITE_TOKEN` · procedimiento para el propietario

**Fecha:** 17/11/2026. Es un procedimiento **separado** de S3: no forma parte de su código ni lo cambia.

**Lo ejecuta el propietario en el panel de Vercel.** Claude no ha leído, mostrado, copiado, eliminado ni rotado el valor del token, y este documento no lo pide.

## 1. Situación comprobada

Comprobación del 17/11/2026, solo sobre metadatos: listado de variables del proyecto **sin descifrar**.

| Dato | Valor |
|---|---|
| Variable | `BLOB_READ_WRITE_TOKEN` |
| Tipo | `encrypted`: cifrada, pero **legible** en el panel por quien tenga acceso al proyecto |
| Entornos | Production, Preview y Development |
| Origen | Conexión del almacén Vercel Blob al proyecto (`contentHint: blob-read-write-token`) |
| Aviso de Vercel | `securityIssues: ["readable-secret"]` |

**Riesgo:**
- Quien pueda ver el proyecto en Vercel puede leer el token.
- Ese token permite **leer, escribir y borrar** cualquier archivo del almacén: las publicaciones de clientes de S1/S2/S3.
- Además está disponible en Development, de modo que puede acabar en el `.env.local` de un equipo.

**Objetivo:**
- Que el valor deje de ser legible: tipo *sensitive*. Según la documentación oficial, el valor de una variable *sensitive* no se puede volver a leer una vez creada.
- Limitar los entornos a los que lo necesitan.

## 2. Antes de empezar

1. **Momento de poco uso:** las funciones que usan el token (`api/share`, `api/view`, `api/delivery`, `api/unshare` y `api/publications`) pueden fallar unos minutos durante el cambio.
2. **Despliegue de vuelta:** anotar el despliegue de Production actual, para poder volver a él.
3. **Enlaces de control:** preparar un enlace de prueba ya publicado, solo con datos sintéticos, para comprobar después que sigue abriéndose. Si no hay ninguno, publicar uno en Preview.

## 3. Procedimiento recomendado

Hay dos caminos. Comprueba en el panel cuál ofrece Vercel hoy para una variable creada por la conexión de un almacén.

**Opción A · el panel permite marcar la variable como *sensitive*:**

1. Project → Settings → Environment Variables → `BLOB_READ_WRITE_TOKEN` → **Edit**.
2. Marcar **Sensitive** y limitar los entornos a **Production** y **Preview**. Quitar **Development**, salvo que alguien trabaje en local con Blob.
3. Guardar y **volver a desplegar**: las variables se aplican en el siguiente despliegue.

**Opción B · el panel no permite cambiar el tipo:**

1. Storage → el almacén Blob → **Projects**. Desconectar el proyecto y volver a conectarlo eligiendo solo Production y Preview.

   O bien: eliminar la variable y crearla de nuevo como *sensitive* con el **mismo valor**. Ese valor lo ve y lo pega **el propietario**; no se envía por chat ni se guarda en ningún archivo.
2. Si Vercel ofrece **regenerar** el token del almacén, valorar hacerlo en ese momento. El token anterior dejaría de valer, cosa recomendable si pudo verse.

   Tras regenerarlo:
   - siguen funcionando los enlaces ya publicados, porque la URL pública de cada archivo no depende del token;
   - siguen funcionando la publicación nueva, la retirada y la limpieza, porque usan el token nuevo después del despliegue.
3. Volver a desplegar Production.

**Lo que no se toca:**
- `RUBIK_SHARE_TOKEN`, `RUBIK_RENDER_TOKEN` ni los proveedores de IA;
- el contenido del almacén;
- ninguna publicación.

## 4. Verificación posterior de las entregas existentes

Con datos sintéticos, sobre Production o Preview según dónde se haya cambiado:

| Comprobación | Resultado esperado |
|---|---|
| Abrir un enlace publicado antes del cambio (`/api/view?f=…`) | Se abre (200) |
| Abrir una visita 3D publicada antes del cambio (`?entrega=…`) | Se abre |
| Publicar un enlace nuevo de prueba (sintético, 7 días) | 200 y enlace abierto |
| Retirarlo desde «Mis publicaciones» | Retirado; el enlace responde «ya no está disponible» |
| Revisar el almacén (S3, cuando esté integrado) | Recuentos correctos |
| Panel de Vercel → variable | Tipo *sensitive*; el valor no se puede mostrar; aviso `readable-secret` desaparecido |

## 5. Reversión

- **Si algo falla después del cambio, por ejemplo `503 not-configured` al publicar:**
  1. **Promote** del despliegue anotado en el paso 2.2, para recuperar el servicio sin tocar variables.
  2. Restaurar la variable: reconectar el almacén con sus entornos anteriores o volver a crearla con el valor vigente.
  3. Volver a desplegar y repetir la verificación de la sección 4.
- **Si se regeneró el token**, el anterior no se puede recuperar. La reversión consiste en usar el **nuevo** en la variable, nunca en volver al viejo.

## 6. Relación con S3 y S5

- S3 no cambia el uso del token: el servidor sigue siendo el único que lo usa y nunca llega al navegador.
- Proteger la variable reduce quién puede leerla. **No** convierte el almacén en privado: eso es GOV-08 S5.
