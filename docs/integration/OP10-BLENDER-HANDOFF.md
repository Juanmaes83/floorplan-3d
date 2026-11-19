# HANDOFF · OP-10 · RUBIK → Blender · candidata final para integración

**Estado:** GO técnico para integración (candidata aislada), **pendiente de aceptación visual del propietario** y de la coordinación con Codex para `index.html`. No es un merge ni una activación.
**Rama:** `claude/compassionate-galileo-mlgigy` · **Base:** `master@02712b5147c15defa12a810b2f346e4b3e0ecb60`, árbol `eac7605fb6b3f176c803255041aa510396db1d69` (comprobado al empezar: el master efectivo coincidía con el del mandato).
**HEAD y árbol:** se comunican en la entrega, porque un archivo no puede contener el SHA de su propio commit (`git log -1 --format='%H %T'`).
**Responsable:** Claude Code. **Integrador:** Codex.

> Mi mensaje de arranque llegó truncado (empezaba en el punto 8 del mandato) y los dos documentos adjuntos (MAESTRO 19/11, HANDOFF 18/11) no estaban en el entorno. Se trabajó con las fuentes del repositorio: HANDOFF y `docs/08` de OP-10 en `611b2f1` y la rama `codex/rubik-blender-candidate`.

## 1. Qué se entrega en una línea

Una persona abre la vista 3D, va a **Entregar › Documentación › Escena para Blender**, pulsa **Preparar escena** y descarga un ZIP con `scene.glb`, `manifest.json` y `LEEME.txt`. En Blender abre `scene.glb` con *Archivo › Importar › glTF 2.0*: obtiene la vivienda que veía, en metros, con cada pieza identificada (`rubik_id`, `rubik_role`) y la cámara del visor. El proyecto no cambia y no sale nada del navegador.

## 2. Cadena única (decisión)

```
FloorPlanProjectV1 (A) ──► View3D (B, visor) ──► View3D.captureScene()  ──► RubikSceneCapture.toGLB ──► scene.glb ─┐
                                                 (solo lectura, estable,     (contenedor = glb.cjs#pack)            ├─► ZIP (project-package#zip)
                                                  cancelable)              RubikSceneDelivery.manifest ► manifest ─┘
                                                                                                             │
Blender: importador glTF NATIVO ──► blender-scene-import.py (colecciones, vidrio, caras traseras, sol/cielo C7) ─► scene.blend ─► render por perfiles
```

* **Una sola captura.** El arnés del laboratorio (`labs/.../capture-browser.cjs`, gancho `__THREE_DEVTOOLS__`) y el piloto roto `scripts/offline-pilot/capture-visual.cjs` (R9) pasan a usar `View3D.captureScene()` (C1).
* **Ningún exportador GLB nuevo del proyecto.** `scripts/interop/export.cjs` sigue siendo el exportador **canónico** del proyecto (geometría durable, sidecar semántico, PR #24). Esta cadena exporta la **observación visual** (lo que se ve, con mobiliario procedimental). Su GLB se escribe con el mismo contenedor que `glb.cjs#pack`; una prueba lo comprueba byte a byte y `glb.cjs#parse` lo valida.
* **Ningún otro motor geométrico.** La geometría es la del visor. A (proyecto) es la autoridad y la referencia de fidelidad.
* `codex/rubik-blender-candidate@86c2075` **ya está en master** (PR #24, squash `67b7f99`). Los 15 scripts de `scripts/interop/` son idénticos salvo `blender-verify.py`, que master corrigió después. No hay nada que recuperar de esa rama.

## 3. Commits por corte (aplicables por separado, en este orden)

| # | Commit (asunto) | Archivos | Depende de |
|---|---|---|---|
| 0 | OP-10 · recuperar el laboratorio (fuente exacta 611b2f1) | `labs/sculpt/op-10/**` (114, sin cambios) | — (opcional para producto; procedencia) |
| 1 | C4 · núcleo de captura 1.0.0 | `js/scene-capture-core.js`, `tests/scene-capture-core.test.mjs` | — |
| 2 | C2 · huecos y luminarias con ID | `index.html` (`buildArch`: 5 líneas, solo `userData`) | — |
| 3 | C3 · sin caras coincidentes visibles | `index.html` (`buildFurniture` 6 líneas, `buildArch` 3 líneas) | — |
| 4 | C4 · `View3D.captureScene()` y arnés | `index.html` (+34 líneas tras `presentationOverviewInfo`), `scripts/interop/scene-{capture,fidelity,roundtrip}.cjs`, `tests/scene-roundtrip.test.cjs`, `tests/fixtures/scene-blender/build.cjs` | 1 (2 y 3 para los contratos C2/C3 del arnés) |
| 5 | C5/C6 · Entregar › Escena para Blender | `index.html` (+4 líneas de carga al final), `js/scene-delivery-core.js`, `js/scene-export-ui.js`, `css/scene-export.css`, `tests/scene-delivery.test.cjs`, `tests/scene-export.browser.test.cjs`, `.github/workflows/op10-blender-scene.yml` | 1, 4 (el arnés de 4 espera `RubikSceneExport`) |
| 6 | C1 · piloto offline sobre la cadena única | `scripts/offline-pilot/capture-visual.cjs` | 1, 4, 5 |
| 7 | C5 · manifiesto determinista y lienzo de referencia | `js/scene-delivery-core.js`, `scripts/interop/scene-capture.cjs`, prueba | 5 |
| 8 | C4/C7 · Blender: importación nativa, reapertura y render | `scripts/interop/blender-scene-{import,reopen,render}.py`, `blender-render-profiles.json`, `measure.py`, `scene-run.cjs` | 1, 4, 5 |
| 9 | Handoff y evidencias | `docs/integration/OP10-BLENDER-HANDOFF.md`, `docs/integration/op10-evidence/**` | — |


## 4. Cirugía exacta por archivo y consumidor

### `index.html` (11 zonas, +54 −15; aplicar con los commits 2–5)

| Zona | Cambio | Consumidores verificados |
|---|---|---|
| `buildArch`: lámpara de techo | `lamp.userData.fixture = 'ceiling-lamp:'+r.id` | `presentationDecor`, `syncCeilingFixtures` (solo leen `isMesh`/visibilidad) |
| `buildArch`: umbral de puerta/corredera | `s.userData.openingId=d.id` | Dibujo Vivo (`presentation-living-drawing.js#identity`, ya leía `openingId`): 8/8 |
| `buildArch`: grupo de ventana | `group.userData.openingId=r.openingId`; vidrio `gh-.08` (entre travesaños) | `windowVisual.register` sin cambios |
| `buildArch`: pivote de puerta | `pivot.userData.openingId=d.id` | `walkDoors`, raycast de puertas (`userData.door` de la hoja intacto) |
| `buildArch`: corredera | destructura `id`; `group.userData.openingId=id`; vidrio y carriles `pl-.04` | — |
| `buildFurniture`: wardrobe, bookshelf, table, desk, shower | geometría C3 (sección 7) | envolventes declaradas iguales (comparador: 0 fallos de contrato) |
| tras `presentationOverviewInfo` | `async function captureScene(...)` + `window.View3D.captureScene=captureScene` (34 líneas) | ninguno (nuevo, solo lectura) |
| antes de `</body>` | `css/scene-export.css`, `js/scene-capture-core.js`, `js/scene-delivery-core.js`, `js/scene-export-ui.js` | `js/project-package.js` (`FloorPlanPackage.zip`) debe cargarse antes: ya lo está |

**Conflictos previsibles (fusión de prueba `git merge-tree` contra cada PR abierta, 19/11 ~21:00):** limpia con #268, #271, #275, #280, #281, #283, #284, #285 y #286. Con **F0.2b #269 y la cadena F0 #273–#279** el único conflicto es **trivial**: ambas ramas añaden líneas justo antes de `</body>`. Se conservan los dos bloques (el de F0 primero). No hay conflicto en las zonas de geometría ni en View3D.

### Archivos nuevos (sin conflictos)
`js/scene-capture-core.js`, `js/scene-delivery-core.js`, `js/scene-export-ui.js`, `css/scene-export.css`, `scripts/interop/scene-{capture,fidelity,roundtrip,run}.cjs`, `scripts/interop/blender-scene-{import,reopen,render}.py`, `scripts/interop/blender-render-profiles.json`, `scripts/interop/measure.py`, `tests/scene-{capture-core.test.mjs,delivery.test.cjs,roundtrip.test.cjs,export.browser.test.cjs}`, `tests/fixtures/scene-blender/build.cjs`, `.github/workflows/op10-blender-scene.yml`.

### Archivos existentes modificados fuera de `index.html`
`scripts/offline-pilot/capture-visual.cjs` (C1, reescrito; mismo CLI y mismo formato de salida, versión 0.2.0). Nada en `project-core`, persistencia, expediente, `FloorPlanProjectV1`, `export.cjs`, `glb.cjs` ni en workflows compartidos.

## 5. Validación de la candidata (todo ejecutado en este entorno sobre el código entregado)

Entorno: contenedor Linux con 4 vCPU, 15 GB de RAM y **sin GPU**; Node 22.23; Chromium 1243 (SwiftShader); Blender `bpy` **5.2.1 LTS** (build `9e2066aef7ef`) con Python 3.13.18.

### 5.1 Cadena completa `scene-run.cjs` (7 escenarios, fixtures sintéticos del laboratorio, bytes idénticos)

| Escenario | Mallas | Vértices | Sin ID (C2) | Coincidentes visibles (C3) | A↔B contratos / fallos | Diferencias visuales declaradas | C↔B desviación máx. | C↔A fallos | Reapertura |
|---|---|---|---|---|---|---|---|---|---|
| F1 rectangular | 20 | 703 | 0 | 0 | 37 / 0 | 0 | 0,000 mm | 0 | PASS |
| F2 girada 30° | 1.589 | 446.541 | 0 | 0 | 641 / 0 | 32 | 0,001 mm | 0 | PASS |
| F3 huecos | 94 | 12.265 | 0 | 0 | 71 / 0 | 0 | 0,000 mm | 0 | PASS |
| F4 planta activa | 61 | 19.071 | 0 | 0 | 58 / 0 + escalera 0 mm | — | 0,000 mm | 0 | PASS |
| F4 edificio apilado | 94 | 47.911 | 0 | 0 | 58+35 / 0 | — | 0,000 mm | 0 | PASS |
| F5 mobiliario (ejemplo) | 1.509 | 446.385 | 0 | 0 | 643 / 0 | 35 | 0,001 mm | 0 | PASS |
| F6 R02/R03 | 1.513 | 437.989 | 0 | 0 | 644 / 0 | 34 | 0,001 mm | 0 | PASS |

Baseline del mismo arnés sobre `master@02712b5` sin la candidata: mismas mallas por escenario, A↔B sin fallos, pero **7–108 mallas sin ID** y **27 defectos C3** en F2/F5/F6 (`op10-evidence/baseline-master-02712b5-summary.json`). Las diferencias visuales (mobiliario procedimental fuera de su caja declarada, alturas por regla) son **las mismas que en el baseline**: no las introduce la candidata.
Tolerancias: las del laboratorio sin cambios (1 mm geometría reexpresada, 2 mm envolventes, 0,5 % de área, **1 µm C↔B inclusivo**). El comparador C↔B tiene una prueba adversaria: detecta 2 µm, el giro invertido, una malla perdida y una identidad cambiada.

### 5.2 Robustez, interfaz y no mutación (`tests/scene-export.browser.test.cjs`, Chromium)

| Caso | Resultado |
|---|---|
| Interfaz C5 de principio a fin (pulsando los botones reales), ZIP con 3 archivos, nombre, manifiesto y huella | PASS |
| GLB retrasado 6 s: espera y produce los **mismos bytes**; dos exportaciones sucesivas: GLB y manifiesto idénticos | PASS |
| Modelo ausente (GLB bloqueado): entrega con la representación genérica y `assetErrors` declarado | PASS |
| Cancelación durante la espera: `CANCELLED`, nada generado, proyecto y almacenamiento intactos | PASS |
| Sin 3D: explica y abre la vista; proyecto vacío: `EMPTY` con causa y salida; Escape cancela; 390 px sin desbordes; foco en la acción principal | PASS |
| OP-02: tras preparar la escena el visor vuelve a reposo (≤ 2 fotogramas en 1,5 s) | PASS |
| Invariantes en todas las ejecuciones del arnés: proyecto y `localStorage` idénticos, 0 peticiones externas, 0 errores de página | PASS |

### 5.3 Regresiones de consumidores

| Prueba | Resultado |
|---|---|
| `tests/scene-capture-core.test.mjs` (13 del laboratorio + 6 del delta) | 19/19 |
| `tests/scene-delivery.test.cjs` · `tests/scene-roundtrip.test.cjs` | 3/3 · 2/2 |
| `tests/op02-render-demand.test.cjs` · `.browser.test.cjs` (con `CHROME`) | 3/3 · 3/3 |
| `tests/presentation-living-drawing.browser.test.cjs` (consumidor de `openingId`; `THREE_LOCAL_DIR`) | 8/8 |
| `tests/presentation-living-drawing-core.test.cjs` | 8/8 |
| `tests/professional-workspace.browser.test.cjs` (Entregar, 4 tamaños, sin primarios en tarjetas) | 17/17 |
| `tests/presentation-light.browser.test.cjs` | 6/6 |
| `tests/interop.test.cjs` (exportador canónico GLB) | 17/17 (1 omitida, ya lo estaba) |
| `tests/browser-test-coverage.test.cjs` (la nueva prueba de navegador tiene workflow) | 1/1 |
| Piloto offline `run.cjs --visual` sobre el proyecto de referencia (C1) | complete; 46/46 muebles reemplazados, desvío de origen 0 m, reapertura PASS, proyecto intacto |

**Firefox y WebKit: no ejecutados.** La política de red de este entorno bloquea la descarga de navegadores (`cdn.playwright.dev`, 403). El arnés y la prueba aceptan `--browser`/`SCENE_BROWSERS`, y el workflow los instala bajo demanda (`browsers: chromium,firefox,webkit`). **Gate externo.**

### 5.4 Rendimiento y memoria (mediciones reales de esta candidata)

**Navegador:** preparar la escena del ejemplo (F5: 1.509 mallas y 446 k vértices) espera 31 fotogramas de estabilidad (520 ms) y bloquea el hilo principal **una sola vez durante 443 ms** en la captura; el GLB se codifica en 105 ms (`op10-evidence/f5-capture-report.json`). El fotograma mediano antes y después es el mismo (16,7 ms): no hay efecto persistente. **Descarga de F5: 12,7 MB**, frente a los 16,5 MB del JSON del laboratorio (R3 mitigado con salida binaria). Límites con rechazo explícito: 20.000 mallas, 1,5 M vértices y caras, 50.000 instancias y 128 MiB.

**Blender (importación y reapertura, `measure.py`):** F1/F3/F4, 0,9–1,2 s y 460–485 MB de pico; F2/F5/F6, 7,2–8,2 s y unos 790 MB; reapertura 0,7–3,6 s.

**Render (Cycles CPU, 4 hilos, denoise, AgX; F5; las vistas interiores incluyen la búsqueda automática de cámara por trazado de rayos):**

| Perfil | Resolución · muestras | Vista del visor | Axonometría | Interiores (salón · cocina · dormitorio) | Total | RSS pico | Uso |
|---|---|---|---|---|---|---|---|
| `preview` | 640×400 · 16 | 6,0 s | 4,7 s | 13,3 · 14,8 · 14,7 s | 76 s / 5 vistas | 0,90 GB | comprobar encuadre y luz |
| `review` | 960×600 · 32 | 23,2 s | 17,3 s | 58,4 · 62,7 · 61,6 s | 247 s / 5 vistas | 1,18 GB | revisión arquitectónica (calidad de la fase 3 del laboratorio) |
| `delivery` | 1600×1000 · 128 | 242,8 s | — | 633,2 s (salón) | 887 s / 2 vistas | 2,05 GB | imagen para el cliente (`op10-evidence/entrega-1600x1000-*.jpg`) |

Referencia histórica: el laboratorio daba unos 35 s por imagen interior a 960×600 y 32 muestras. Aquí el perfil `review` da unos 60 s, porque incluye la búsqueda de cámara (24×24 rayos por candidata) y una escena con más luz (sol, cielo y relleno). Son mediciones de este contenedor, **no una garantía** para otra máquina.

GPU: **no disponible en este entorno; no se declara ningún resultado GPU.** `--device GPU` falla con un mensaje explícito si no hay dispositivo. Extensiones futuras (fuera de esta misión): GPU local u OptiX en servidor, granja de render o vídeo (un recorrido de 20 s a 30 fps son 600 fotogramas; al ritmo del perfil de revisión serían horas en CPU). Necesitarían una decisión de producto y de gasto (STOP_GASTO).

## 6. Demostración y comparativas

* `op10-evidence/rubik-vs-blender-viewer.png`: el lienzo de RUBIK y Blender con la **misma cámara y la misma luz capturadas** (C7). Coinciden encuadre, geometría, huecos, mobiliario y luminarias. Diferencia declarada: los suelos con textura de madera del visor llegan como color plano (las imágenes no se copian; `hasMap` va declarado).
* `op10-evidence/antes-despues-lab-vs-candidata.png`: laboratorio `759d9bb7` frente a la candidata. **Desaparecen las tapas negras de los armarios (C3).** Las cámaras interiores son derivadas (el algoritmo del laboratorio, declarado) y eligen de nuevo con la geometría corregida.
* `op10-evidence/c5-sin-3d.png` y `c5-dialogo-lista.png`: la interfaz real de Entregar en los estados «sin 3D» y «lista» (1509 mallas, 180 elementos, 12,7 MB).
* `op10-evidence/entrega-1600x1000-viewer.jpg` y `entrega-1600x1000-rom_living.jpg`: el perfil de entrega (JPEG 88 a partir del PNG, sin otra transformación de color).
* `.blend` regenerable con `scripts/interop/scene-run.cjs` o con la secuencia de la sección 9. Los `.blend`, GLB y PNG de render grandes no se suben; sus huellas están en los informes JSON.

## 7. C3 en detalle: el detector y los defectos resueltos

`RubikSceneCapture.coincidentFaces(doc)` agrupa triángulos por plano (normal a 0,001 y distancia a 0,1 mm), mide la superposición por recorte de Sutherland–Hodgman y clasifica:

* **defecto**: mismo sentido, materiales distintos y superficie visible ≥ 1 cm²;
* **oculta por contacto**: tapada por una cara enfrentada de una tercera malla;
* **bajo el suelo**: cara hacia abajo a cota 0, que ninguna cámara ve;
* **inocua**: el mismo material.

| Tipo | Causa | Corrección (`index.html`) |
|---|---|---|
| Armario (R1) | cuerpo y tapa con la cara superior a 2,20 m | cuerpo `h - .1` |
| Estantería | el fondo, de lado a lado, coincidía con las caras de los costados | fondo `w - 2*t` |
| Ducha | vidrio y perfiles en el mismo plano | vidrio `w-.04`/`d-.04`, alto `1.935` |
| Mesa | el camino de mesa pisaba los salvamanteles (mismo plano) | profundidad `min(.32, d-.64)`, se omite si no cabe |
| Escritorio | libreta sobre el teclado en escritorios estrechos | `x = min(-w/2+.3, -.33)` |
| Ventana / corredera | vidrio contra travesaños / carriles contra montantes | vidrio `gh-.08`; corredera `pl-.04` |

## 8. Licencias y procedencia

* El donante openPlan3D@771c9e1 (MIT, © 2026 theLodgeStudio) queda en `labs/sculpt/op-10/upstream/` con `MANIFEST.sha256`. El núcleo conserva el aviso y la clasificación KEEP/GENERALISE/REPLACE/REMOVE.
* Blender `bpy` 5.2.1 (GPL) solo se usa fuera del producto, en un entorno virtual temporal; no se redistribuye.
* No se añaden recursos, texturas, modelos ni dependencias de npm. El GLB no lleva imágenes.
* Los fixtures son sintéticos (deterministas, sin datos personales). **No acreditan exactitud frente a una obra real.**

## 9. Reproducir desde una sesión nueva

```bash
node --test tests/scene-capture-core.test.mjs tests/scene-delivery.test.cjs tests/scene-roundtrip.test.cjs
```
```bash
CHROME=/ruta/chromium node --test --test-concurrency=1 tests/scene-export.browser.test.cjs
```
```bash
python3 -m venv /tmp/bpy && /tmp/bpy/bin/pip install bpy==5.2.1
```
```bash
CHROME=/ruta/chromium node scripts/interop/scene-run.cjs /tmp/scene-run-NUEVO --python /tmp/bpy/bin/python
```
```bash
/tmp/bpy/bin/python scripts/interop/blender-scene-render.py -- /tmp/scene-run-NUEVO/blender/f5-furniture /tmp/scene-run-NUEVO/package/f5-furniture /tmp/render-NUEVO --profile review --views viewer,axon,rom_living,rom_kitchen,rom_master
```

Un paquete descargado desde la app se importa igual: descomprimir el ZIP y pasar su carpeta como `PACKAGE-DIR` a `blender-scene-import.py`. Nada sobrescribe: cada salida exige una carpeta nueva.

## 10. Rollback

* **Producto:** revertir los commits 2–5 (o solo el 5 para retirar la entrada de Entregar y conservar la captura). `git revert <sha>` es limpio porque cada corte toca zonas distintas; ensayado aplicando las etapas en orden sobre master y comprobando que la última coincide byte a byte con `index.html`. Ningún dato persistido cambia de formato: no hay migración que deshacer.
* **Piloto:** revertir el commit C1 restaura el `capture-visual.cjs` anterior, que ya estaba roto en master (R9).
* **Datos:** la cadena es de solo lectura (proyecto y almacenamiento verificados en cada ejecución). Un ZIP descargado no afecta a RUBIK.

## 11. Riesgos residuales

| # | Riesgo | Estado |
|---|---|---|
| R1 | Caras coincidentes | **Resuelto** para todos los tipos que aparecen en F1–F6 (0 defectos). Otros tipos de mueble que no salen en los fixtures solo los cubre el detector: conviene pasarlo sobre el catálogo completo al integrar |
| R2 | Huecos y lámparas sin ID | **Resuelto** (0 sin ID) |
| R3 | Escenas grandes | Mitigado: GLB binario 12,7 MB; captura de una sola vez; límites con rechazo |
| R4 | `contentId` sensible a fechas | Evitado: el registro C6 no calcula identidad; solo acepta la confirmada por F0 |
| R6 | Render por CPU | Medido (sección 5.4); sin GPU aquí |
| R7 | Firefox/WebKit | **Gate externo** (red); el workflow los cubre |
| R8 | Derivados del render | Declarados en `RUBIK_derived` y en cada `render-report.json`; la vista «viewer» usa la cámara y la luz capturadas |
| R9 | Piloto roto | **Resuelto** (C1) |
| N1 | Texturas del visor como color plano | Declarado (`hasMap`, `texturesNotCopied`). Copiarlas exigiría revisar derechos y privacidad (fuera de alcance) |
| N2 | Conversión de intensidades visor → Cycles | Constantes declaradas en `blender-scene-import.py` (sol ×1,5 W/m², cielo ×0,35, lámpara ×10 W); calibración visual pendiente de aceptación |
| N3 | Idioma zh | La interfaz C5 cae a inglés |

## 12. Dictamen

| Dictamen | Decisión | Condiciones |
|---|---|---|
| **GO técnico para integración** (C1–C5) | **GO** | Coordinar con Codex el orden respecto a F0 (conflicto trivial en `</body>`). Aceptación visual del propietario |
| C6 (Studio E3 / F0) | **Preparado**: el adaptador `RubikSceneDelivery.record` está probado | **Bloqueado por dependencia:** la revisión F0 confirmada (F0.2b #269 / F0.3) y el selector de Studio E3 (no está en master; no se inicia antes de D4 y F0.2b) |
| C7 (cámara y luz reproducibles) | **GO** para la captura y su reproducción en Blender | La **persistencia** de una cámara guardada en el proyecto es CAM-01 (fuera de alcance: no se toca el esquema) |
| Render de entrega | GO para revisión; la calidad de entrega queda medida | Aceptación visual del propietario; GPU, vídeo y servidor son decisiones de producto |
| Firefox/WebKit | **Pendiente** | Gate externo de red; ejecutar el workflow con `browsers: chromium,firefox,webkit` |
| Producción / activación | **NO** autorizada por este mandato | Merge, Alpha/Demo/Production y activación: decisión del propietario |

## 13. Decisiones externas pendientes

1. Aceptación visual: `op10-evidence/*.png` (¿la vivienda se reconoce y la luz convence?).
2. Orden de integración respecto a F0.2b/F0.3 (afecta solo al bloque final de `index.html`).
3. Firefox/WebKit en CI (lanzar el workflow con los tres navegadores).
4. Si el render de entrega merece GPU o servidor (gasto).
5. CAM-01: si la cámara guardada debe persistir en el proyecto (cambio de esquema; no se hace aquí).

