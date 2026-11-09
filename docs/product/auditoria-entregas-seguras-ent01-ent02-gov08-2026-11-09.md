# RUBIK SOTA — Auditoría de entregas seguras (ENT-01, ENT-02, GOV-08)

**Fecha:** 09/11/2026 · **Tipo:** diagnóstico y plan. **No implementa nada**: no cambia permisos, endpoints, configuración ni Production. No publica enlaces reales.
**Base:** `master@5fb7a5c` (Production `dpl_5oHsDPdSVG5buSVCnYPrLPmbnbNi`). PR #166 en `cef06ff`.

## 1. Qué existe hoy (master)

| Pieza | Archivo | Qué hace | Controles presentes |
|---|---|---|---|
| Archivo para el cliente (B1) | `js/client-share-ui.js` | HTML autocontenido de solo lectura (dossier, vistas, lámina, firma y formulario de observaciones) que el profesional envía por el canal que quiera | **Sin servidor**: CSP que prohíbe peticiones de red y sin proyecto editable. Es el canal más seguro: no hay nada publicado. |
| Publicar enlace (B4) | `js/share-link-ui.js` → `api/share.js` | Sube ese HTML (y opcionalmente el vídeo) al almacén **Vercel Blob** del propietario, en `rubik-share/<slug>-<aleatorio>.html` | Código de acceso, máximo 4 MB, tipos `html`, `mp4` y `webm`, HTML con `<!doctype html>`, sufijo aleatorio, clave de Blob nunca en el navegador |
| Abrir enlace | `api/view.js` | Lee el HTML del Blob propio y lo sirve como página con CSP estricta | Solo `rubik-share/*.html` del almacén propio (no es un proxy general), `noindex`, `no-referrer`, `nosniff` |
| Retirar | — (texto en la interfaz) | «Se guarda en el almacén Vercel Blob de este proyecto y **se borra desde ese panel**» | **No hay retirada desde RUBIK** en master |

## 2. Hallazgos (con evidencia)

| # | Hallazgo | Evidencia | Severidad | Riesgo |
|---|---|---|---|---|
| H1 | **Publicar depende del mismo código que el Render IA.** El 09/11 se rotó el código de Production para desbloquear el render, así que publicar enlaces de cliente también pasó a depender del código nuevo. | `api/share.js`: `token!==env.RUBIK_RENDER_TOKEN`; `share-link-ui.js` guarda el mismo `rubik-render-token` del navegador | **Alta** | Quien tiene el código del render puede publicar en el almacén del propietario, y al revés. Rotar uno rompe el otro. No se puede dar acceso al render sin dar acceso a publicar. |
| H2 | **No hay revocación desde RUBIK.** Para retirar un enlace hay que borrar el archivo a mano en el panel de Vercel Blob. | Texto de `share-link-ui.js`; no existe `api/unshare` en master | **Alta** | Un enlace enviado por error o a quien no debía no se puede retirar rápido. El profesional no tiene acceso al panel de Vercel del propietario. |
| H3 | **La URL pública del Blob va dentro del enlace.** El enlace es `/api/view?f=<URL de Blob>`, y esa URL se puede abrir directamente sin pasar por `/api/view`. | `api/view.js` `target()`; almacén `*.public.blob.vercel-storage.com` | **Media** | La CSP de `/api/view` se puede saltar descargando el archivo directamente. Solo se retira borrándolo. Un enlace aleatorio es difícil de adivinar, pero **no** es autorización. |
| H4 | **Caché tras borrar.** `/api/view` responde con `Cache-Control: public, max-age=60`. | `api/view.js` | Baja | Hasta unos 60 s (más la CDN) después de borrar, el enlace aún puede servirse |
| H5 | **Sin caducidad.** Los enlaces no caducan. | No hay fecha de caducidad en `api/share.js` ni en `api/view.js` | Media | Las entregas antiguas siguen accesibles indefinidamente |
| H6 | **Sin registro de publicaciones.** No hay registro, ni en el servidor ni en RUBIK, de qué se publicó, cuándo y para qué proyecto o cliente. | `api/share.js` no registra; el registro que propone #166 es local del navegador | Media | No se puede auditar ni retirar «todo lo de este cliente» |
| H7 | **Sin cuotas de almacenamiento.** Hay límite por archivo (4 MB) pero no por día ni en total. | `api/share.js` | Media | Quien tenga el código puede llenar el almacén (coste y abuso) |
| H8 | **Sin aislamiento por cliente o proyecto.** Todo va a la misma carpeta `rubik-share/` con nombres derivados del proyecto. | `pathname` de `api/share.js` | Baja-media | No hay frontera entre clientes; el nombre puede revelar el del proyecto |
| H9 | **Comparación del código no constante** | `api/share.js` usa `!==`; `api/render.js` usa `timingSafeEqual` | Baja | Detalle menor frente a H1 y H2 |
| H10 | **El código se guarda en `localStorage`** del navegador del profesional | `share-link-ui.js` | Media | En equipos compartidos, cualquiera que use ese navegador puede publicar |

## 3. PR #166 (ENT-01) frente a master

| Aspecto | Estado verificado |
|---|---|
| Estado | Abierta, **borrador**, `mergeable_state: dirty` (con conflictos) |
| Base | `0f9c6ea`: **111 commits por detrás de master** y 11 por delante |
| Aporta | Visita 3D de solo lectura para el cliente (`?entrega=`), minimapa en la exploración libre con estancias clicables (`js/delivery-map-core.js`), estados de botón, **`/api/delivery`** (sirve el snapshot 3D validado, `no-store`), **`/api/unshare`** (borrado real en el Blob propio, hasta 8 archivos), contrato `rubik-sota.client-delivery` v1 con lista blanca (sin proyecto editable) y documentación técnica y de QA |
| Ya existe en master por otra vía | Minimapa de la Presentación, `presentationGo`, paradas por estancia y «Entrar en la estancia» (FT3D-1b) |
| Obsoleto o arriesgado | Capturas binarias reescritas en `docs/qa/artifacts/building-presentation/*` y carpetas `output/` y `qa-results/` generadas: **no deben entrar**. Además, `index.html` y `js/building-ui.js` han cambiado mucho en master (FT3D-8, #179), lo que causa conflictos. |
| Seguridad | `/api/unshare` resuelve en parte **H2**, pero **repite H1** (mismo código del render, comparación con `!==`). `/api/delivery` sirve con `no-store`, mejor que el `max-age=60` de `/api/view`. |
| Pruebas | Las de su rama, en `cef06ff`. Hay que volver a pasarlas tras ponerla al día con master. |
| Pendiente de gate humano | Móvil real, calidad adaptativa y modelo de acceso (lo que aquí es GOV-08) |

**Conclusión ENT-01:** #166 aporta valor real (visita 3D del cliente y retirada), pero **no debe fusionarse tal cual**. Se propone recuperarla selectivamente sobre el master actual, sin artefactos, y **después** de definir el permiso de publicación propio (corte S1).

## 4. Plan: seguridad mínima viable (sin cuentas) y seguridad por profesional

### A · Seguridad mínima viable, antes de GOV-06a (sin cuentas de usuario)

| Corte (PR pequeña) | Contenido | Resuelve | Pruebas necesarias |
|---|---|---|---|
| **S1 · Permiso de publicación propio** | Nueva variable `RUBIK_SHARE_TOKEN`, independiente de `RUBIK_RENDER_TOKEN`. Transición: aceptar ambas durante un periodo anunciado y después solo la nueva. Comparación en tiempo constante. | H1, H9 | Negativas: el código del render no publica cuando la transición termina; el de publicación no genera imágenes. |
| **S2 · Retirada desde RUBIK** | `/api/unshare` (recuperado de #166) con el permiso de S1 y un **registro local** de lo publicado en el navegador del profesional («Mis publicaciones» con botón Retirar). `no-store` en `/api/view`. | H2, H4 | Publicar → retirar → `/api/view` responde 404 sin esperar a la caché; no se puede retirar lo que no pertenece a `rubik-share/` |
| **S3 · Caducidad** | Fecha de caducidad en el nombre o los metadatos (7, 30 o 90 días, a elegir) que `/api/view` respeta, más una tarea programada que borre lo caducado | H5 | Enlace caducado → 404; el borrado programado no toca lo vigente |
| **S4 · Cuotas y tamaño** | Límite de publicaciones por día y de bytes totales en `rubik-share/` (comprobando el listado del Blob) | H7 | Superar la cuota → 429 claro, sin subida parcial |
| **S5 · No exponer el Blob directo** | Enlaces con un identificador opaco (`/api/view?id=…`) en vez de la URL del Blob. Valorar un almacén privado si el plan de Vercel lo permite. | H3, H8 | La URL del Blob no aparece en el enlace; los identificadores no válidos dan 404 |
| **S6 · Visita 3D del cliente (ENT-01)** | Recuperar #166 selectivamente sobre master **con S1 y S2 ya hechos**, sin artefactos binarios | ENT-01 | Las del propio #166 y regresión de Presentación, walk y Entregar |

### B · Seguridad por profesional (necesita GOV-06a: cuentas y autenticación)

| Capacidad | Por qué necesita cuentas |
|---|---|
| Publicar y retirar solo lo propio | Hace falta saber quién publicó |
| Registro de publicaciones en el servidor por profesional y cliente | Hace falta una identidad a la que asociarlo |
| Cuotas por profesional | Hoy el código es compartido |
| Revocar el acceso a un profesional sin cambiar el código de todos | Cuentas individuales |
| Enlaces con contraseña o restringidos a un cliente concreto | Gestión de identidades del cliente |

**No** se construye una plataforma multiusuario dentro de ENT-01, ENT-02 ni GOV-08.

## 5. Decisiones que te corresponden

| # | Decisión | Recomendación |
|---|---|---|
| D1 | ¿Separar ya el permiso de publicación del render (S1)? | **Sí, primero.** Es el riesgo más alto y el cambio más pequeño. |
| D2 | Periodo de transición en que se aceptan ambos códigos | 7 días, y avisar a quien publique |
| D3 | Caducidad por defecto de los enlaces | 30 días, ampliable a 90 |
| D4 | Cuota diaria y total de publicaciones | Por ejemplo, 20 al día y 500 MB en total, a ajustar |
| D5 | ¿Recuperar #166 después de S1 y S2? | Sí, de forma selectiva y sin artefactos |
| D6 | ¿Almacén Blob privado? (S5) | Estudiarlo según el plan de Vercel |
| D7 | Mientras tanto | Considerar el código de acceso **confidencial** y no compartirlo con terceros: hoy sirve para publicar y para generar imágenes. Los enlaces erróneos se borran desde el panel de Vercel Blob. |

**Nada de esta auditoría se implementa sin tu autorización por corte.**
