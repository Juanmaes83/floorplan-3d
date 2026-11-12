# ENT-01 — Visita 3D del cliente: auditoría de #166, contrato e integración con S1/S2

**Fecha de investigación:** 10/11/2026. **Fecha de reconciliación:** 12/11/2026.
**Base histórica:** `master@75615fd`. **Base actual de la PR #189:** `master@e5ae75386cece7c8432e0221de4e11c6f6becee4`, que incluye #192, R03-I0 y **ECO-01 #190 integrado**. La rama se reconcilió mediante merges normales, sin reescribir los commits de ENT-01.
**Estado:** el contrato puro está implementado en la rama Draft #189; **no se ha fusionado, cargado en `index.html` ni publicado**. Las visitas del prototipo #166 no están integradas en el editor.

PR comprobadas al empezar:

| PR | Commit | Base | Estado |
|---|---|---|---|
| #166 | `cef06ff` | `master@0f9c6ea` | Borrador, con conflictos (`dirty`) |
| #187 (S1) | `54e6fc3` | — | Borrador, 11/11 checks |
| #188 (S2) | `fdf7fc4` | Apilada sobre S1 | Borrador, 5/5 checks |

#166 no se ha modificado ni cerrado.

## 0. Estado técnico de integración — 12/11/2026

**Candidato aislado ENT-01-I0: contrato puro de entrega, sin modo cliente.** Se conservaron los SHA de blob originales:
- `js/client-delivery-core.js` — `61eb45ed0d90bc62c21003fc37b49d53bfc09966`. No hay cambios en el código del motor respecto al HEAD original `67243d4`.
- `tests/client-delivery-core.test.cjs` — `17df3cec53a633d063999af6964bd286bd4d1f94`; nueve pruebas de schema, privacidad, atomicidad, campos prohibidos, referencias válidas y normalización.
- Este documento se actualiza para el `master` nuevo, y se añade `.github/workflows/ent01-core.yml` como cuarto fichero para ejecutar **explícitamente** `node --test tests/client-delivery-core.test.cjs` con Node 22.13.0. Los workflows genéricos Project-First no incluyen esa suite en `UNIT_TESTS`.

### Qué está validado y qué queda fuera

- El contrato puro **no** contiene red, almacenamiento, interfaz, controles del cliente ni APIs; tampoco toca `api/share.js`, `api/unshare.js`, `api/delivery.js`, `index.html` o configuración Vercel. No se publica ninguna visita.
- La instantánea proyecta datos de proyectos/edificios existentes y descarta datos del plano fuente, ubicación/parcelas, mediciones de trabajo, notas de procedencia y `extensions`. La privacidad es **minimización**, no confidencialidad: un cliente puede inspeccionar todos los datos que sí reciba. La suite con fixtures sintéticos **no equivale a una auditoría de fuga de datos con proyectos reales**.
- **Dependencias de publicación: GOV-08 S1 #187 → S2 #188**; además, antes de activar `/api/view` y el modo cliente hay que resolver el [aislamiento de origen #195](https://github.com/Juanmaes83/floorplan-3d/pull/195), pruebas de almacenamiento simulado, aislamiento de permisos, retirada y cachés. #187 mantiene la excepción de CI del `real-3d` sin autorizar saltarse los checks; S1/S2/#195 siguen Draft.
- **Prueba humana histórica:** se aprobó navegación/mini-mapa del prototipo [#166](https://github.com/Juanmaes83/floorplan-3d/pull/166), **no** la funcionalidad de #189 ni el futuro modo cliente. El prototipo #166 no debe fusionarse: solo sirve de referencia de UX. No extrapolar fps SwiftShader a dispositivo real.
- **Pruebas humanas futuras:** Preview real y aislada con entrada a Recorrer, minimapa y salto a estancias; teclado y móvil; bloqueo del editor y acceso únicamente autorizado; retirada/cachés; pruebas en hardware real. La URL se proporciona **cuando exista un deployment de la integración**, nunca se inventa la Preview.
- **Gates antes del merge I0:** diff limitado a los cuatro ficheros, compatibilidad exacta con `master`, CI del HEAD final (workflows generales + `ENT-01 - client delivery core gate`) y autorización humana de merge **específica**, incluido posible despliegue automático de Production; la autorización de preparar esta rama **no es autorización de fusionar**.
- **ECO-01 #190 ya fusionado**: reconciliación ejecutada sobre `master@e5ae75386cece7c8432e0221de4e11c6f6becee4`, preservando el core y tests originales de ENT-01; **CI del nuevo HEAD debe volver a pasar**. Ante cualquier cambio posterior de `master`, auditar compatibilidad y revalidar el diff antes del merge.

**Lectura histórica:** el inventario original que sigue está basado en la investigación del 10/11/2026 y cita SHA de PR anteriores; para estado actual de integración prevalece esta sección y el HEAD de GitHub.

---

## 1. Inventario de #166 frente a master y S1/S2

#166 tiene 11 commits sobre `0f9c6ea` y 78 archivos, de los cuales **57 son artefactos generados** (capturas en `docs/qa/artifacts/…` y `output/playwright/…`, y métricas JSON).

| Archivo de #166 | Función | Equivalente en master/S1/S2 | Estado | Riesgo | Propuesta |
|---|---|---|---|---|---|
| `js/delivery-core.js` | Contrato `rubik-sota.client-delivery` v1: construir y validar la instantánea | — | **REESCRIBIR**: hecho en `js/client-delivery-core.js` | Solo validaba el primer nivel: dentro de muros, estancias, objetos y materiales pasaba cualquier cosa | Reescrito con minimización campo a campo y validación **estricta con `FloorPlanCore.validate` y `FloorPlanBuilding.validate` de master** |
| `js/delivery-map-core.js` | `roomAt` (punto en polígono) y `marker` (cono de visión del minimapa) | `FloorPlanPresentationCore.minimap()` ya calcula el minimapa y la orientación de la cámara; `FloorPlanReviewAnchors.roomAt` y `insidePoly` de `presentation-core` ya localizan estancias | **YA EXISTE** en lo esencial | Duplicar geometría | No recuperar. Si el minimapa del recorrido libre lo necesita, añadir solo «la estancia más pequeña que contiene el punto» a `presentation-core`. |
| `js/delivery-client.js` | Modo cliente (`?entrega=`): portada, recorrido libre, presentación guiada, minimapa, carga y errores | Recorrido (View3D), Presentación (FT3D-1b) | **ADAPTAR** | Depende de `index.html`, de `View3D.walkPose/walkToRoom` (no existen en master) y del modo de presentación actual | Reconstruir sobre master después de S1/S2, validando con el contrato nuevo |
| `js/delivery-ui.js` | Lado del profesional: estado, vista previa (postMessage), registro de publicaciones y retirada | Registro «Mis publicaciones» de S2 | **REESCRIBIR** | Usa `rubik-render-token` en `localStorage` y `x-rubik-render-token`; registro propio paralelo al de S2 | Vista previa: reutilizable (comprueba origen y `source`). Publicación y retirada: usar S1/S2. |
| `api/delivery.js` | `GET /api/delivery?f=` sirve la instantánea validada, `no-store` | `api/view.js` (mismo patrón para HTML) | **ADAPTAR** | Lectura sin código (modelo «quien tiene el enlace»); la URL del Blob va en el enlace | Recuperar con el contrato nuevo (§3) |
| `api/share.js` (cambios) | Tipo `delivery` (`.delivery.json`) | S1: permiso propio; S2: `_share-auth.js` | **ADAPTAR** | Su versión usa el código del render | Parche posterior a S2 (§3) |
| `api/unshare.js` | Retirada | **S2** (`api/unshare.js` nuevo) | **DESCARTAR** | Código del render, `!==`, sin informe por archivo | No recuperar. Ampliar S2 solo con `.delivery.json` (§3). |
| `js/share-link-ui.js` (cambios) | Casilla «Incluir la visita 3D», orden de subida, limpieza si falla | S1/S2 en este archivo | **ADAPTAR** | Conflicto directo con S1/S2 | Rehacer sobre S2 (§3) |
| `js/client-share-ui.js` | Sección «Recorre tu vivienda en 3D» en el documento publicado | Documento del cliente B1/B4 | **REUTILIZABLE** (11 líneas) | Bajo | Recuperar con la integración |
| `js/professional-workspace-ui.js` | Tarjeta en el grupo «La vivienda, para tu cliente» | El grupo `experience` existe en master | **REUTILIZABLE** (2 líneas) | Bajo | Recuperar con la integración |
| `js/building-ui.js` | Getter `building` (copia) | — | **REUTILIZABLE** (1 línea) | Bajo | Recuperar con la integración |
| `index.html` | Script de arranque del modo cliente (almacenamiento en memoria), `View3D.walkPose/walkToRoom`, CSS y scripts | `walkStart` y `presentationGo` existen | **ADAPTAR** | `index.html` cambió mucho después (FT3D-8, #179, HOM); `walkToRoom` duplica parte de `walkStart` | Rehacer el parche a mano, compartiendo con `walkStart` la búsqueda de punto libre |
| `css/delivery-client.css` | Aspecto del modo cliente | Sistema visual actual | **ADAPTAR** | Revisar tokens del sistema de diseño | Revisión visual humana |
| `tests/delivery-core.test.cjs` | Pruebas del contrato | — | **REESCRIBIR**: hecho en `tests/client-delivery-core.test.cjs` | — | — |
| `tests/delivery-map-core.test.cjs` | Pruebas del minimapa | — | **DESCARTAR** con su módulo | — | — |
| `tests/delivery-api.test.cjs` | Pruebas de `api/delivery` | — | **ADAPTAR** al permiso S1 | — | — |
| `tests/delivery-3d.browser.test.cjs`, `tests/helpers/*` | Escenarios A–G de navegador y medida de rendimiento | — | **ADAPTAR** sobre master | Escritos para `0f9c6ea` | Repetir sobre el código actual. **No valen como sustituto.** |
| `docs/technical/…` y `docs/qa/delivery-3d-client-v1-qa.md` | Diseño y QA de V1 | — | Referencia | Describen un estado antiguo | Solo consulta |
| 57 artefactos binarios o generados | Capturas y métricas | — | **DESCARTAR** | Ruido y conflictos | No recuperar |

**Aporte real de #166 que no existe en master:**
- el modo cliente de solo lectura (`?entrega=`);
- `/api/delivery`;
- la idea de un contrato de instantánea separado del proyecto editable;
- el posicionamiento del visitante en una estancia (`walkToRoom`);
- las pruebas de escenarios.

Todo lo demás está ya en master o lo cubren S1/S2.

## 2. Qué implementa esta rama (independiente de S1/S2)

`js/client-delivery-core.js` (UMD `FloorPlanClientDelivery`) es puro: sin DOM, red ni almacenamiento.

- **`buildSnapshot(input)`** minimiza el proyecto o el edificio campo a campo:
  - de `site` solo conserva `northOffsetDeg`;
  - quita `measurements`, `app`, `extensions`, `scale.note`, `source` de muros, huecos y estancias, y `structureSource`;
  - de `sourceImages` deja solo la referencia mínima que exige una escala calibrada: id, tipo, tamaño en píxeles, `local-browser`, invisible. Nunca la imagen, el nombre, los bytes, el hash ni la colocación.

  Después **valida el resultado en modo estricto con los validadores de master**. Las salas de la presentación se filtran a las que existen, y nunca se inventa una selección. No modifica el proyecto de origen.
- **`validate(snapshot, {bytes})`** para lo que llegue por la red. Rechaza:
  - otro esquema, otra versión o más de 4 MB;
  - **cualquier campo no autorizado en cualquier nivel del sobre**: `content`, `presentation`, `presentation.levels`, las salas de presentación, `provenance`, `capabilities`, `studio` y `source`, incluidos números y objetos anidados;
  - contenido que no pase el validador estricto;
  - **cualquier campo que la minimización quitaría**, aunque el esquema canónico lo permita;
  - identidad de origen incoherente;
  - salas de la presentación que no existen;
  - URL y esquemas **en cualquier posición del texto**, no solo al principio: `esquema://…`, `//host` a principio de texto o tras un espacio, `www.…`, y `javascript:`, `vbscript:`, `file:`, `blob:` y `data:` (salvo en la portada y el logo, que se comprueban aparte).

  **No se detectan** un dominio sin esquema ni `www` (`ejemplo.com/x`) ni un correo electrónico. El visor muestra los textos como texto, nunca como enlaces ni recursos, así que no se descargan; aun así, el profesional no debe escribir datos personales en los nombres.
  - valores con forma de credencial.
- **Comparación estructural**: no depende del orden de los campos. Dos instantáneas válidas con los mismos campos en distinto orden son iguales.
- **`excluded(project)`** devuelve lo que queda fuera, para explicárselo al profesional.

## 3. Contrato de integración con S1/S2 (se aplica **después** de integrar S1 y S2)

| # | Punto | Contrato |
|---|---|---|
| 1 | Publicar la instantánea | `POST /api/share` con `x-rubik-share-kind: delivery`, con el **mismo permiso que S1** (`_share-auth.js`: solo `RUBIK_SHARE_TOKEN`). No hay endpoint nuevo de publicación. |
| 2 | Tipo y extensión | `application/json; charset=utf-8` y extensión **`.delivery.json`**, en `rubik-share/<slug>-<aleatorio>.delivery.json` |
| 3 | Validación en el servidor | `FloorPlanClientDelivery.validate(JSON.parse(body), {bytes})` antes de guardar. Un error da 400 `file` y no se guarda nada. |
| 4 | Lectura | `GET /api/delivery?f=<url>`: solo el almacén propio y `rubik-share/[\w-]+\.delivery\.json`, sin consulta ni fragmento. Lee con `cache: 'no-store'`, valida otra vez y responde con `no-store`, `nosniff` y `noindex`. Si no existe, 404 «no disponible»; si no es válida, 422. Para leer no hace falta código, igual que `/api/view`. |
| 5 | Permiso | Publicar y retirar exigen `RUBIK_SHARE_TOKEN`. **Nunca** `RUBIK_RENDER_TOKEN`. |
| 6 | Asociación | El documento HTML enlaza a la visita (`/?entrega=<url de la instantánea>`) y al vídeo. El registro de S2 guarda los 3 archivos de cada publicación. Caben: S2 admite hasta 8 por petición. |
| 7 | Retirar | `POST /api/unshare` con los 3 archivos. **Único parche en S2:** la expresión de `ownFile` admite **exactamente** `[\w-]+\.delivery\.json` además de `html`, `mp4` y `webm`, nada más. No se relaja el borrado. |
| 8 | Retirada parcial | S2 ya responde archivo a archivo (207). El registro marca «Retirada incompleta» con los archivos pendientes y «Retirar» reintenta solo esos. |
| 9 | Fallo de la 2.ª o 3.ª subida | Orden de subida: vídeo, instantánea y, al final, el HTML. Se aplica a los tres archivos el patrón de S2 para el vídeo huérfano: si algo falla, se borran **solo las URL subidas en ese intento**. Si no se pueden borrar, se registran como pendientes y, si tampoco se puede guardar el registro, se muestran sus URL. |
| 10 | Enlace ya retirado | `/api/delivery` responde 404 y el cliente ve «Esta visita ya no está disponible». Volver a retirar no da error, porque el borrado de Blob no falla si el archivo ya no existe. |
| 11 | Reintento de limpieza | Se apoya en el registro de S2 (`pending` con las URL exactas), que nunca guarda códigos |
| 12 | Aislamiento | Solo se nombran URL que vienen de la respuesta de `/api/share` en ese intento o del registro. Cada archivo lleva un sufijo aleatorio. El validador del servidor rechaza otras carpetas, otros almacenes, consultas y `..`. Habrá pruebas con dos publicaciones (como S2 hace hoy para `.html`). |

**Caché:** igual que en S2, la CDN de Vercel Blob y otras cachés pueden servir una copia durante un tiempo, y lo descargado no se recupera. **No se promete un borrado inmediato.**

**Bloqueo:** sin S1 y S2 en master, ENT-01 **no puede publicarse ni declararse integrada**. Solo avanza este núcleo independiente.

## 4. Seguridad y privacidad de la instantánea

| Aspecto | Situación |
|---|---|
| Qué viaja al navegador del cliente | La geometría que necesita el visor: muros, huecos, estancias (nombre y polígono), materiales (nombre y aspecto), objetos (tipo, nombre, posición, tamaño, color, `assetRef` del catálogo), defaults, escala, norte, nivel y escaleras. Además, el título, el nombre del estudio y, si las hay, la portada y el logo en `data:`. |
| Excluido | Ubicación, parcela, ortofoto, terreno y emplazamiento; imagen y nombre del plano original, su hash y sus bytes; medidas de trabajo; notas libres de la escala; procedencia de cada elemento; datos de la aplicación; extensiones |
| **Inspeccionable** | Todo lo que viaja **puede inspeccionarse**: la entrega **no es confidencial**. Nombres de estancias y objetos, y el nombre del proyecto, viajan tal cual, así que el profesional no debe escribir datos personales en ellos. |
| URL y recursos externos | La instantánea no lleva URL reconocibles con los patrones anteriores (limitación: dominios sin esquema ni `www`). `assetRef` solo identifica un catálogo autorizado. **Pendiente de la integración:** comprobar en el navegador si la visita pide recursos de catálogo a un servidor externo y declararlo. |
| Credenciales | La entrada de `buildSnapshot` no tiene campos de código. El validador rechaza valores con forma de credencial. El modo cliente de #166 sustituye `localStorage` y `sessionStorage` por memoria antes de cargar nada; la integración debe conservarlo y probarlo. |
| `postMessage` (vista previa) | #166 comprueba `origin === location.origin`, `source === opener` y el tipo, y valida la instantánea. **Hay que conservarlo.** |
| Acceso | Por enlace, sin autenticación adicional. La URL del Blob de la instantánea va dentro del enlace de la visita y se puede descargar directamente. Pendiente de S5 y GOV-06a. |
| Edición | El modo cliente oculta el editor. La integración debe probar que ningún control oculto modifica nada y que el proyecto del profesional no cambia. |

## 5. Pruebas

| Ámbito | Estado |
|---|---|
| Contrato (esta rama): esquema y versión, tamaño, campos fuera del contrato (también anidados), validador estricto, geometría conservada, datos excluidos ausentes, proyecto de origen intacto, identidad de revisión, salas inexistentes, edificio de varias plantas, URL, esquemas y credenciales, determinismo del contenido, proyecto sin estancias | ✅ 9 pruebas en `tests/client-delivery-core.test.cjs` (incluye sobre estricto en todos los niveles, orden de campos y URL dentro del texto), con fixtures sintéticos de `docs/contracts/examples` |
| API `/api/delivery`, publicación y retirada de `.delivery.json` | **Pendiente de la integración** (después de S1 y S2), con almacén simulado |
| Navegador: visita libre y guiada, cambio de estancia, móvil vertical y horizontal, teclado y foco, sin scroll horizontal, sin WebGL, pérdida de contexto WebGL, fallo de red, ida y vuelta al documento, archivo offline intacto, Presentación profesional sin regresiones | **Pendiente de la integración**. Las pruebas de #166 no sirven como sustituto. |

**Matriz de hardware real (GOV-07), pendiente de revisión humana:**

| Dispositivo | Visita libre | Guiada | Fluidez | Pérdida de contexto | Memoria (5 ciclos) |
|---|---|---|---|---|---|
| iPhone reciente (Safari) | ☐ | ☐ | ☐ | ☐ | ☐ |
| iPhone de hace 4 años o más | ☐ | ☐ | ☐ | ☐ | ☐ |
| Android de gama media (Chrome) | ☐ | ☐ | ☐ | ☐ | ☐ |
| Portátil con GPU integrada | ☐ | ☐ | ☐ | ☐ | ☐ |
| Escritorio con GPU dedicada | ☐ | ☐ | ☐ | ☐ | ☐ |

Los fps medidos con SwiftShader en CI **no** sirven como prueba de rendimiento en móviles.

## 6. Orden de integración propuesto (cada paso con su propia autorización)
1. S1 activa y fusionada; rotación del código del Render IA; S2 fusionada.
2. **ENT-01 integración A**:
   - esta rama, si no está ya fusionada;
   - parche de `api/share.js` (tipo `delivery`) y de `api/unshare.js` (`.delivery.json`, y solo eso);
   - `api/delivery.js`;
   - pruebas de API con almacén simulado.
3. **ENT-01 integración B**:
   - modo cliente: `delivery-client`, arranque con almacenamiento en memoria y CSS;
   - `walkPose` y `walkToRoom`, compartiendo código con `walkStart`;
   - tarjeta en Entregar, casilla en el diálogo y registro de S2 con 3 archivos;
   - pruebas de navegador.
4. Revisión visual humana y prueba en dispositivos reales (matriz anterior).
