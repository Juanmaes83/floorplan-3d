# OP-05 · P3/P4 — diagnóstico en solo lectura (20/11/2026)

> **Estado:** diagnóstico, no implementación.
> - P3 y P4 se implementan juntos y solo cuando se confirmen el cierre P0 de OP-07 y la revisión de P1/P2.
> - C1 sigue en NO-GO: sin persistencia GLB.
> - Base leída: master `130ba24d420a2f4b26ab261313202e6070904fd8`.
> - Se reutiliza P1/P2 tal cual: `claude/op05-lab-p1p2@56c9f203`.
> - Nombre propuesto para el corte, pendiente de coordinación: `claude/op05-lab-p3p4`, desde `56c9f203`.

## 1. P3 · Resolución privada en el visor (código real)

| Pieza | Dónde | Qué ofrece | Qué falta |
|---|---|---|---|
| Construcción del mueble genérico | `index.html:3130` `buildFurniture(f)` | Volumen genérico con las cotas canónicas | Nada: sigue siendo la representación por defecto |
| Cola de cargas | :3986-4002 (`assetQueue`, `MAX_ACTIVE_ASSET_LOADS=2`, `pumpFurnitureAssets`) | Cola única con plazo por carga | Reutilizar sin cambios |
| Generación y cancelación | :3988 `assetGeneration`, :3990 `cancelFurnitureAssets()` (aborta todos los `AbortController`) | El cambio de proyecto, planta o variante pasa por `buildFurn()` (:4041), que cancela, libera (`AssetLoader.dispose` de los grupos autorizados) y reconstruye | Reutilizar. Solo hay que marcar también los grupos privados para que se liberen |
| Carga y colocación | :4005 `loadFurnitureAsset(g,f,generation)` | Escala a `f.w`, `size.heightMm` y `f.d`; descarta la carga tardía si cambió la generación o el grupo; publica el estado | Una rama nueva **antes** de `assetRef`: `PrivateModels.resolve(project,f.id,{available})` → `loadPrivateModel(bytes,…)` (P1) → la misma colocación. Si no: genérico con su razón (`publishAsset`) |
| Render bajo demanda (OP-02) | :4632 `requestFrame()` | Solo se pinta cuando algo cambia | Se conserva: la carga privada llama a `requestFrame()` igual que la de catálogo |

**Bytes en P3:** solo un **proveedor en memoria del laboratorio**, por ejemplo un `Map` sha256→ArrayBuffer cargado desde activos sintéticos autorizados de `labs/`. No usa IndexedDB, `FloorPlanImages` ni la red.

**Sin autoridades nuevas:** no hay otro GLTFLoader (se usa `parseVerified` de P1), ni otro renderer, catálogo o almacén.

**Pruebas P3** (las del mandato):
- carga válida;
- rechazo de hash o longitud incorrectos;
- aislamiento entre proyectos;
- cancelación;
- cambio de proyecto, planta o variante durante una carga;
- liberación de geometrías y texturas;
- ninguna carga tardía sobre una escena ajena;
- colocar, mover y rotar;
- ninguna mutación del proyecto;
- OP-02 en reposo, sin fotogramas.

**Escala física:** no certificada.

## 2. P4 · Privacidad efectiva: mapa real de consumidores

Todas las salidas visuales salen del **mismo renderer y la misma escena** (`furnG`):

| Consumidor | Camino real | Riesgo con un modelo privado cargado |
|---|---|---|
| Blender | `scene-export-ui.js` / `scene-delivery-core.js` → `View3D.captureScene()` (`index.html:5698`) | Las mallas del visor entran en el GLB entregado (hoy incluye `catalogModel`, :5726) |
| Vistas 3D | `project-views-ui.js` → `View3D.deliveryShot()` (:4802), `presentationCapture()` (:4853) | Píxeles del modelo privado |
| Presentaciones | `presentation-ui.js` → `View3D.shot()` (:4769), `presentationGo`; agrupa recursos (`resources`, :360) | Píxeles; capturas agrupadas por lote |
| Vídeo | `tour-recorder.js:36` `canvas.captureStream()` del renderer | **Cada fotograma** del canvas en vivo |
| Cliente | `client-share-ui.js:19` (`toDataURL` de capturas) + `delivery-client.js`, que reimporta el proyecto minimizado con `client-delivery-core` (descarta `extensions`) | Las imágenes adjuntas; el visor del cliente ya ve el genérico |
| Exportación | `exportProjectJson` (`index.html:2477`), `project-package.js` y `expediente-core.js` | La extensión `x-op05-private-model` (id, huella, derechos) |
| DXF, láminas y presupuesto | Núcleos que leen el objeto canónico | No leen extensiones; confirmar con una prueba de que la salida no contiene nada de OP-05 |

**Diseño propuesto, que falla cerrado y tiene un único punto de control:**
1. **Modo de visualización privada explícito y exclusivo del laboratorio** (`View3D.privatePreview`). Solo en este modo se cargan representaciones privadas. Por defecto está desactivado.
2. **Toda API de salida** (`shot`, `deliveryShot`, `presentationCapture`, `captureScene`, y el inicio de una grabación en `tour-recorder`) pasa por una única guarda, `withGenericRepresentation(fn)`. La guarda cambia cada grupo privado por su genérico y lo restaura después. Durante una grabación, el modo privado queda **bloqueado**. Como la guarda está en la capa de API del visor, no se puede olvidar en un consumidor concreto.
3. **Invalidación:** cambiar de proyecto, planta, variante o modo privado incrementa `assetGeneration` y vacía las capturas en memoria de presentación y vistas.
4. **Documentos:** `PrivateModels.minimize(project, destination)` (P2) en cada salida de proyecto. Un destino sin declarar es un error y `private-expediente` sigue rechazado.
5. **Prueba sobre el artefacto real:** un modelo sintético inconfundible (forma y color únicos) frente a su genérico. Se comprueba:
   - el GLB de Blender: ningún vértice del modelo privado;
   - el PNG/JPEG: ningún píxel del color testigo;
   - el vídeo: fotogramas muestreados;
   - el ZIP/JSON: ninguna cadena de id, huella, título ni derechos.
   - Además: el proyecto no cambia y no se escribe nada.

## 3. Calidad F3 en P3

- Perfil sin cambios: 8 MiB, 4 JPEG, 4 texturas, 8 materiales, 2048 px y 16/24 MiB.
- Se añade un **fixture sintético con JPEG** (el banco F3 no tiene texturas) para ejercitar la decodificación de imágenes por el camino privado, con cancelación y liberación de bitmaps.

## 4. Coordinación con otros frentes

- **Simulator A** (`codex/simulator-a-evolucion@1ba63cd0`) e **Industria E3/CC1:** solo consumen la representación genérica. Contrato mínimo: «un consumidor que no esté en el modo privado del visor nunca recibe geometría privada». No toco sus ramas.
- **OP-11:** los modelos privados nunca se convierten en recursos del catálogo público. F3 es la arquitectura común, con ámbitos separados.

## 5. Complejidad y riesgo

| Corte | Complejidad | Riesgo |
|---|---|---|
| P3 | Media | Medio: memoria/GPU y cargas tardías, cubiertos por la generación existente |
| P4 | Media | **Alto si falta una salida.** Mitigación: guarda única en la API del visor y pruebas sobre artefactos reales |

## 6. GO/NO-GO

- **GO de laboratorio:** cuando todas las pruebas de P3 y P4 pasen sobre artefactos reales.
- **NO-GO de producto** hasta P5 (interfaz), P6/P7 (F0.2c/F0.3), A0 y P8 (activación), cada uno con su autorización.
