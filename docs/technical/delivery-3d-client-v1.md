# Delivery 3D Client Experience V1

Rama: `feat/delivery-client-3d-experience-v1` (base `master@0f9c6ea`). Estado: **implementado en rama, pendiente de revisión humana**. Sin merge ni despliegue, y sin publicar datos reales.

## 1. Qué resuelve

Desde «Entregar», el profesional comparte una **visita 3D interactiva y de solo lectura** de la vivienda. El cliente la abre en el móvil o en el ordenador y elige entre:

- **Explorar la vivienda**: el modo «Recorrer» de View3D, sin cambios. Mantiene puertas, colisiones, joystick y deslizamiento.
- **Ver la presentación**: la presentación de Rubik con las estancias y el orden que eligió el profesional en «Presentar mi vivienda».

No es otra aplicación ni otro motor. Es la misma app en **modo cliente** (`index.html?entrega=…`), que reutiliza:

- View3D y el modo Recorrer;
- `FloorPlanPresentation` y `FloorPlanPresentationCore` (el sidecar de la decisión);
- `FloorPlanApp.importProjectFile` (proyectos y edificios);
- `FloorPlanProjectPreview` (esquema axonométrico);
- `FloorPlanClientShare` (dossier);
- `/api/share` y `/api/view`.

## 2. Tres cosas distintas (contrato)

| | Qué es | Dónde vive |
|---|---|---|
| A. Proyecto editable | `FloorPlanProjectV1` / `FloorPlanBuildingV1` | Biblioteca local del profesional. **Nunca se publica.** |
| B. Presentación preparada | Sidecar de `FloorPlanPresentationCore`: estancias y orden por planta | Navegador del profesional. Viaja dentro de C, filtrado. |
| C. Entrega al cliente | `rubik-sota.client-delivery` v1 (`js/delivery-core.js`) | Vercel Blob del propietario, `rubik-share/*.delivery.json` |

`buildSnapshot()` aplica una **lista blanca**: se queda con lo que necesita el 3D y descarta todo lo demás. Lo que viaja y lo que no:

- **Se incluye:** `schema`, `schemaVersion`, `id`, `name`, fechas, `units`, `coordinateSystem`, `scale`, `defaults`, `walls`, `openings`, `rooms`, `materials`, `objects`, `roofParapet`. Para edificios, además, plantas (`id`, nombre, orden, cotas) y escaleras.
- **`site`:** solo se conserva `northOffsetDeg`. Se descartan ubicación, parcela, ortofoto, terreno y colocación.
- **`sourceImages`:** se descarta el plano original. Solo queda, si la escala la nombra, una referencia mínima: `id`, tipo y tamaño, con `storage:{kind:'local-browser'}` y `visible:false`. No incluye la imagen, el nombre de archivo, la ruta ni el hash. Hace falta porque una escala «real» exige su calibración y esta nombra la imagen. Sin la referencia, el proyecto dejaría de validar (defecto encontrado y corregido en esta rama).
- **Se descartan:** `measurements`, `app` y `extensions`.
- **Validez:** el resultado pasa `FloorPlanProject.validate` y `FloorPlanBuilding.validate` (tests en `tests/delivery-core.test.cjs`).
- **Metadatos de la entrega:**
  - `deliveryId` (`dlv_` + 16);
  - `createdAt`;
  - `source{kind,id,revision,versionCode}`;
  - título, idioma, estudio (nombre y logo PNG de 120 KB como máximo);
  - `hero`: la vista general real, en JPEG o PNG data-URL de 900 KB como máximo, nunca una URL remota;
  - `capabilities{walk,guided}`, calculadas del modelo y nunca supuestas;
  - `presentation.sidecars`, filtrados a estancias que existen;
  - `provenance`.
- **`validate()`:** es estricta. Rechaza esquema o versión desconocidos, campos fuera de la lista, `site` con algo más que el norte, imágenes remotas o SVG, referencias de imagen con nombre o ruta, y tamaños de más de 4 MB.

**Versionado.** Cada publicación es una instantánea con `versionCode`, el código corto de 8 hex que ya usan el archivo cliente y las observaciones. Si el proyecto cambia, la tarjeta lo indica («La vivienda cambió desde la última entrega»). El enlace anterior sigue mostrando la versión entregada hasta que se retire.

## 3. Flujo

### Profesional

1. «Presentar mi vivienda»: elige las estancias y su orden. Así es hoy y no cambia.
2. «Entregar» → tarjeta **«Tu proyecto, listo para recorrer»**:
   - estado;
   - qué incluye: exploración libre, presentación con N estancias y portada real o esquema;
   - **Revisar como cliente**: abre una pestaña nueva con el snapshot por `postMessage` del mismo origen. No sube nada.
   - **Publicar para tu cliente**: abre el diálogo existente «Enlace para el cliente» con la visita 3D marcada.
3. Al publicar, el orden es: vídeo (opcional), snapshot (`/api/share`, `kind=delivery`, validado en el servidor) y dossier con la sección «Recorre tu vivienda en 3D».
   - Si falla un paso, se borran los archivos ya subidos en ese intento.
4. «Entregas publicadas»: historial de este navegador con **Retirar**. `/api/unshare` borra del almacén la página, el snapshot y el vídeo, y pide el mismo código de acceso.

### Cliente

1. Abre el enlace del dossier (`/api/view`, CSP estricta sin cambios).
2. Pulsa «Entrar en la visita 3D» y llega a `./?entrega=<blob>#desde-documento`.
3. Portada «Descubre tu vivienda en 3D», con el estudio, la imagen, el título, las acciones y los datos de la visita.
4. Barra mínima durante la visita (título, modo, «Salir de la visita») y «Volver al documento».

## 4. Estados cubiertos

| Estado | Dónde |
|---|---|
| No preparado | Tarjeta: chip `warn` «Falta completar la geometría», botones desactivados. Diálogo: «Visita 3D no disponible». |
| Presentación no elegida | Tarjeta: «Presentación: elige y ordena…» (`is-off`). La entrega sale solo con exploración libre. |
| Disponible / listo para revisar | Chip `ready` «Visita 3D disponible» y «Revisar como cliente». |
| Publicando | Diálogo: «Publicando…» con el botón desactivado. |
| Publicado | Chip `live` «Enlace publicado», fecha y versión, «Gestionar el enlace». |
| Desactualizado | Chip `warn` «La vivienda cambió desde la última entrega», con la explicación. |
| Retirado o enlace inexistente | Cliente: «Esta visita ya no está disponible», sin reintento. |
| Error recuperable | Cliente: «No se pudo abrir la visita» con «Reintentar». |
| Sin capacidad 3D | Cliente: estado `no-3d` con el aviso y sin botones que no pueden funcionar. |
| Contexto WebGL perdido | Vuelta a la portada con el aviso «La vista 3D se interrumpió…». |

## 5. Seguridad y privacidad

- **Código de acceso y token del almacén:** `RUBIK_RENDER_TOKEN` es el código de publicación del profesional y no aparece nunca en el HTML, el snapshot, el visor ni las URLs públicas (test F). El token del almacén solo existe en el servidor.
- **`/api/delivery` no es un proxy abierto:**
  - solo acepta `https://<store propio>/rubik-share/<nombre>.delivery.json`, sin query ni hash;
  - valida el snapshot antes de servirlo y responde 422 si no es válido;
  - cabeceras: `no-store`, `nosniff`, `noindex` y `no-referrer`.
- **Sin CSP nueva:** el visor lee el snapshot del mismo origen. La CSP del dossier no se relaja.
- **Almacenamiento del cliente:** en modo cliente, un shim en `<head>` (antes de cualquier script) sustituye `localStorage` y `sessionStorage` por memoria. La visita no lee ni escribe nada del navegador del cliente (test F).
- **Diálogos ocultos:** los diálogos del editor que oculta el modo cliente nunca quedan abiertos como modales. Esto corrige un defecto encontrado en el escenario B que dejaba la página inerte.
- **Sin terceros:** sin servicios externos nuevos, sin cuentas y sin login. Cualquiera con el enlace puede ver la visita; así se dice en el diálogo. El snapshot es inspeccionable, y así se dice también.
- **Retirada real:** se borran los archivos y la API responde 404.

**Residuales documentados:**

- El CDN de Vercel Blob tiene `max-age=60`, que no se puede bajar. Un archivo ya cacheado en el borde puede seguir sirviéndose hasta unos 60 s tras retirarlo.
- `/api/delivery` lee con `no-store`, pero el CDN del Blob es el origen.
- El historial de publicaciones vive en el navegador del profesional. Desde otro navegador hay que retirar en el panel de Vercel Blob.

## 6. Archivo offline

El archivo descargable (B1) **no cambia** y no añade ningún control de visita, que sin red no funcionaría (test G). La sección de visita del dossier solo aparece en la publicación con enlace.

## 7. Límites de V1, honestos

- No viajan las plantillas FT3D-6 ni los capítulos de Story: hoy son de sesión y no se guardan en el sidecar. La presentación del cliente usa paradas y orden, con la luz y la cámara por defecto de la presentación.
- Una sola entrega viva por publicación. No hay contraseña de cliente (requeriría una decisión sobre el modelo de acceso).
- El rendimiento en un móvil real está **pendiente de validación humana**. Las medidas de §8 son de Chromium con SwiftShader (CPU) en contenedor.
- Requiere conexión. El código Three.js se sirve desde el mismo despliegue (`vendor/three`).

## 8. Rendimiento

Ver `docs/qa/delivery-3d-client-v1-qa.md`.

## 9. Gates humanos pendientes

Publicar geometría de un proyecto real, desplegar en producción, merge, decidir el modelo de acceso (contraseña o caducidad) y validar en un móvil real.
