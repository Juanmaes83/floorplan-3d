# GOV-07 — Pruebas de hardware, DPR adaptativo y contexto WebGL (ola 1)

**Fecha:** 12-11-2026 · **Rama:** `lab/gov07-webgl-resilience` (PR #208, Draft) · **Origen:** `master@eae8cf6` · **Coordinación:** issue #206.

**Catálogo:** `GOV-07 | Pruebas en hardware real (iOS, Android, GPU de escritorio), DPR adaptativo y contexto WebGL`. No se crean IDs ni se cambian olas.

> **Nada de esta acta declara superada una prueba en iPhone, Android ni GPU real.** Lo automático se ha ejecutado en Chromium con SwiftShader (CPU) y, como humo, en Firefox y WebKit de Playwright en el runner de CI (sin GPU). La parte física está en [`protocolo-dispositivos.md`](protocolo-dispositivos.md), sin marcar. **Estado honesto: parcial** hasta completar la matriz física.

## 1. El fallo de CI «geometrías 53→116» (auditoría de ChatGPT, run 43280403339)

### Qué medía la prueba

`renderer.info.memory.geometries` de Three **no cuenta las geometrías que existen, sino las que se han dibujado al menos una vez desde que se crearon**: Three sube cada geometría a la GPU la primera vez que la pinta. Por eso el número depende de **qué fechas del plan se han llegado a pintar** en cada ciclo, no de si se libera la memoria.

| Momento medido (fixture A) | Geometrías contadas por Three |
|---|---|
| Día 0 (base de la prueba original) | **53** |
| Día 56 (final de la prueba original tras 20 ciclos, `140 mód. 84`) | **116** |
| Final del plan, si en ese ciclo se pintaron antes las otras fechas | 119 |
| Final del plan, si no, o justo después de recuperar el contexto | **67** |

La prueba comparaba el día 0 con el día 56: **53→116 sin fuga**. La corrección de `a07306e` (medir siempre al final del plan) **seguía dependiendo del historial de pintado**: en una tanda de 60 ciclos salió 67 en 6 de 61 medidas; con una base de 67 y un final de 119 habría vuelto a fallar.

### Qué se midió para saberlo (`tests/gov07/resource-probe.cjs`, `cycle-profile.cjs`, `heap-diff.cjs`)

En **cada ciclo**, no solo al principio y al final:

- **GPU real:** llamadas GL `createBuffer`/`deleteBuffer`, texturas, programas, VAOs, framebuffers.
- **Cada geometría y cada material** creados, con referencia débil: liberados (`dispose`), vivos tras un GC forzado y **vivos fuera de la escena** (la definición de fuga).
- **Escena:** objetos, mallas, líneas, contornos fantasma, contornos de selección, recursos ilustrativos, cargas.
- **Escuchadores reales** (CDP) en `#gantt` y `window`; memoria JS e instantáneas del heap.

Resultados completos por ciclo, antes y después: [`evidencias/perfil-recursos-por-ciclo.json`](evidencias/perfil-recursos-por-ciclo.json).

| En `a07306e` (antes) | Ciclo 0 | Ciclo 10 | Ciclo 20 | Lectura |
|---|---|---|---|---|
| Geometrías Three, mismo momento | 119 | 119 | 119 | Estable |
| Búferes / VAOs GL reales | 264 / 102 | 264 / 102 | 264 / 102 | **Sin fuga de GPU** |
| Geometrías creadas / liberadas | 184 / 0 | 2024 / 1840 | 3864 / 3680 | 184 por carga, **todas liberadas** |
| Geometrías vivas fuera de escena | 0 | 0 | 0 | Sin fuga |
| Alternando los proyectos A y B | — | — | — | Vuelve exactamente a 119/264 y 155/410 |
| **Escuchadores de `#gantt`** (por tipo) | 2 | 12 | **22** | **Fuga: +1 por reapertura** |
| Materiales creados / liberados | 129 / 0 | 1339 / 0 | 2549 / 0 | Nunca `dispose()`, pero el GC los recoge (vivos: 129 siempre); programas acotados (ver §4) |

Instantáneas del heap entre los ciclos 10 y 30:

| | `a07306e` (antes) | Después |
|---|---|---|
| Total | +0,52 MB | +0,41 MB |
| `Array` / `Object` / `string` | +1014 / +334 / +737 | +42 / +16 / 0 |
| Closures / contextos | **+80 / +60** | 0 / 0 |
| Código V8 (calentamiento del motor, no es de la app) | ~+470 kB | ~+430 kB |

Entre los ciclos 20 y 50 (después) el heap real **baja 0,44 MB**. `performance.memory` sigue subiendo algo porque incluye el código compilado y basura aún no recogida: no sirve para detectar fugas finas.

## 2. Defectos reales encontrados y corregidos

| # | Defecto (medido) | Corrección | Prueba (falla en `a07306e`, pasa aquí) |
|---|---|---|---|
| G1 | `createGanttView` añadía 4 escuchadores al `#gantt` compartido en **cada** reapertura y nunca los quitaba: 2→22 en 20 ciclos, cada uno retenía el plan anterior (+80 closures), y **un clic seleccionaba la tarea 4 veces** tras 3 reaperturas | Escuchadores con `AbortController`; `destroy()`; `show()` retira el Gantt anterior **solo cuando el nuevo proyecto ya se ha evaluado** (una importación rechazada no deja el plan sin Gantt) | «reabrir no duplica callbacks» (4 selecciones → 1) y el gate de 20 ciclos (escuchadores) |
| G2 | Cambio de proyecto durante una reconstrucción: si la evaluación anterior terminaba después, **se quedaba en pantalla el proyecto antiguo** | `show()` numera las selecciones; una que termina después de otra más reciente se descarta sin tocar la escena | «cambio de proyecto durante una reconstrucción» (B → A) |
| G3 | `gl-guard` `dispose()` no retiraba sus escuchadores (`webglcontextlost/restored`, `visibilitychange`) | `AbortController` | Revisión de código; sin efecto visible hoy (la guarda no se reengancha) |
| G4 | El **banco** del dispositivo usaba el mismo contador entre dos fechas y decía «crecimientos grandes = posible fuga»: en un teléfono habría dado el mismo falso positivo | Mide en el mismo momento y el invariante «geometrías en GPU ≤ en escena»; fuente de cada dato; resultado general; JSON con SHA-256 | `gov07-bench` |
| G5 | En el móvil, el aviso «Calidad 3D reducida…» **tapaba la etiqueta del proyecto** («FIXTURE A») y parte de la barra de vistas (visto en las capturas) | El aviso prueba varias posiciones y usa la primera que no se cruza con ningún texto o control del visor; en pantallas estrechas muestra «Calidad 3D reducida» (la frase completa sigue para lectores de pantalla); se recoloca al cambiar el tamaño | «degradado 1440×900 / 390×844 / 844×390: el aviso no tapa…» (falla en 390×844 antes) |

`project-scene.js` **no se toca** (lo modifica #207).

## 3. La prueba de 20 ciclos, rehecha (sin subir umbrales)

Se conserva el ciclo exacto (reabrir, Proyecto, Evolución, ▶, Entrega, pausa, Evolución, fecha `i·7`), los 20 ciclos y el nombre. Se sustituye la comparación del contador por lo que **sí** delata una fuga, comprobado **en cada ciclo**:

- geometrías en GPU **≤** geometrías en escena; **ninguna** viva fuera de la escena;
- las geometrías vivas son **las mismas** en todos los ciclos;
- búferes y VAOs GL reales acotados por las geometrías de Three;
- **un** juego de escuchadores del Gantt y los de `window`, constantes; una carga por apertura;
- texturas iguales; programas que no crecen desde que las fechas se repiten (ciclo 12) y con tope 16;
- memoria JS con un tope grosero (6 MB), justificado por las instantáneas.

## 4. Lo que no es un defecto (y por qué)

- **Materiales sin `dispose()`**: se crean de nuevo en cada carga (uno por tramo de muro, suelo, losa, cubierta y línea fantasma) y no se liberan explícitamente, pero el GC los recoge (vivos tras GC: constantes) y Three comparte el programa por variante: **sin crecimiento medido**, tampoco alternando proyectos. Liberarlos explícitamente sería higiene, pero exige tocar `clear()` en `project-scene.js`, junto a las líneas que cambia #207: se propone **después** de integrar #207 (ver §8).
- **Una geometría interna de Three por contexto**: al recuperar el contexto, `WebGLShadowMap` crea su triángulo de pantalla completa; la del contexto anterior se libera. Siempre una (medido en 5 pérdidas seguidas).
- **Programas compilados al aparecer** variantes de material (3 en el día 7, 9 tras recorrer el plan): caché acotada.

## 5. Continuidad y calidad (D1–D5 del primer corte, ampliado)

| # | Situación | Comportamiento |
|---|---|---|
| D1 | Se pierde el contexto WebGL | Velo con aviso accesible; el plan sigue funcionando; al volver el contexto, la escena vuelve idéntica (mismos píxeles). |
| D2 | El navegador no lo devuelve | «No se ha podido recuperar…» con **Recargar la vista** (44 px). Si vuelve después, el aviso y el botón se retiran solos. Sin bucle de reconstrucciones. |
| D3 | Pérdidas repetidas | Degradación controlada y dicha (DPR 1, sin sombras), **una sola vez** aunque haya 5 pérdidas. La selección de tareas sigue marcando sus elementos. |
| D4 | Sin WebGL | Escena nula con aviso; plan, ficha, importes y reproducción funcionan. Errores de WebGL distinguidos de los de validación del proyecto (estos van a «Importación rechazada»). |
| D5 | DPR alto | 2 → 1,5 → 1 por escalones, nunca por debajo de 1; sube solo con margen (sin oscilar); cede y recupera el tamaño en la grabación. Una pestaña congelada o sin foco no provoca bajadas falsas. |

## 6. Pruebas (resultados reales)

| Suite | Resultado |
|---|---|
| `gov07-quality-core` (núcleo puro) | 10/10 |
| `gov07-evolution-resilience` (Chromium) | 23/23 |
| `gov07-bench` (1440×900 y 390×844 a DPR 3) | 2/2 |
| `gov07-cross-browser` | Chromium local 1/1; Firefox y WebKit en CI (§7) |
| Regresión de la Evolución | ver §6.1 |
| Antes/después (`GOV07_ROOT` sobre `a07306e`) | Las 3 pruebas nuevas de defectos fallan en `a07306e` y pasan aquí |

Casos adversariales cubiertos en navegador: pérdida durante la reproducción (el plan avanza y sigue reproduciendo), cambio de proyecto con el contexto perdido (se dibuja el nuevo), restauración tardía tras `failed`, 5 pérdidas (una degradación), salir de la vista con la recuperación pendiente, cambio de proyecto durante una reconstrucción, pestaña congelada, 5 giros rápidos, sin WebGL, grabación con la guarda degradada, presupuesto de cuadro inalcanzable.

### 6.1 Regresión (local, cada suite aislada)

| Suite | Resultado | Nota |
|---|---|---|
| `ft3d-8-fidelity` | 6/6 | |
| `ft3d-8-fit` | 9/9 | |
| `ft3d-8-lab` (navegador) / `ft3d-8-lab` (Node) | 2/2 · 10/10 | |
| INT-R1 (`THREE_LOCAL_DIR=vendor/three`) | 1/1 | |
| `ft3d-8-ux4d` | 19/20 | La 14 («MP4 = pantalla») falla **igual en `a07306e`**: el Chromium de este entorno no codifica H.264 y graba WebM |
| `ft3d-8-delivery` | 4/6 | Las 2 de vídeo MP4 fallan **igual en `a07306e`** (misma causa) |
| `ft3d-8-dossier` | 5/6 | La de vídeo falla **igual en `a07306e`** (WebM sin duración navegable) |

Los 4 fallos son del códec de este entorno, no de GOV-07: se reproducen idénticos en el árbol sin estos cambios. En CI esas suites usan su propio Chromium.

## 7. Navegadores y hardware

| Motor / dispositivo | Estado |
|---|---|
| Chromium + SwiftShader | Automatizado (todas las suites). |
| Firefox y WebKit de Playwright | **Humo en CI** (`cross-browser`): carga, dibujo o aviso de «sin WebGL», pérdida y recuperación si el motor la permite, un clic = una selección. En este entorno de desarrollo no se pueden instalar (la red bloquea su descarga). |
| Safari en iPhone/iPad, Chrome en Android, GPU real de escritorio | **No probado.** Matriz física del protocolo, sin marcar. |

## 8. Integración

- **Archivos:** `evolucion/gantt-view.js`, `evolucion/fidelity-app.js`, `evolucion/gl-guard.js`, `js/gl-quality-core.js`, `labs/gov07/`, `tests/gov07*`, el workflow propio y esta documentación.
- **Árbol combinado #208 + #207 + #209 + #201** (worktree temporal, sin subir): fusiones limpias, ningún archivo común. Resultados: `gov07-evolution-resilience` 20/20, OBR-01 `ex05` 4/4, `ex11` 4/4, `qa22` 2/2, `ex09` 3/3, `ux07-ent04-core` 16/16, `brand.browser` 3/3 (con el arreglo de #201).
- **#207 (OBR-01):** orden indiferente. Si se quiere liberar los materiales explícitamente, hacerlo **después** de #207 en `clear()` de `project-scene.js`.
- **#209 (UX-07/ENT-04)** y **#201 (ENT-01):** sin archivos comunes.
- **FT3D-8 `real-3d` / `brand.browser` (marca profesional 1440×900):** el clic de «Vistas + proyecto ZIP» puede agotar los 30 s implícitos con CPU cargada. La corrección existe en #201 (`12b0cca`, presupuesto de 120 s para el clic, con todas las comprobaciones del ZIP) y **no está en `master`**. #208 no toca ese test reservado: hasta que #201 llegue a `master`, `real-3d` de #208 puede fallar de forma intermitente por esa causa (pasó en `a07306e`, falló en `d69b798`).
- **Cirugía del editor:** [`ficha-cirugia-editor.md`](ficha-cirugia-editor.md).

## 9. Evidencias

En `evidencias/`, con `manifest.json` (SHA-256 por archivo), generadas con `tests/gov07/capture-evidence.cjs`: estados **normal, contexto perdido, recuperado, sin respuesta, degradado y sin WebGL** en escritorio 1440×900, móvil vertical 390×844 y móvil horizontal 844×390, y el **banco** con su resultado.

## 10. Recorrido humano (5 min)

1. Abre la Preview en `/evolucion/index.html?lab=1&case=A`, pulsa «Ver evolución» y luego ▶.
2. Ve a otra pestaña pesada o a otra app en el móvil y vuelve. Si el sistema liberó la GPU, verás «Vista 3D interrumpida» y la casa volverá sola.
3. Abre `/labs/gov07/` en tu teléfono y pulsa «Ejecutar banco» en vertical y en horizontal. Mira «Resultado general» y guarda los JSON.
4. Rellena la matriz de [`protocolo-dispositivos.md`](protocolo-dispositivos.md) (B1–B11).

## 11. Riesgos y pendientes

- **Hardware real:** sin probar; es el núcleo del contrato GOV-07.
- **`performance.memory`** es impreciso; las fugas finas se vigilan por estructura (escuchadores, geometrías vivas fuera de escena), no por megas.
- **Dossier:** `dossier-ui.js` asigna su estado antes de llamar a `show()`; si dos dossiers se cargan a la vez, la escena muestra el último pero el estado del dossier podría ser el del penúltimo. No reproducido en la interfaz (las cargas de dossier se esperan una a una); anotado para la integración.
- **Defecto previo observado, fuera de GOV-07:** en móvil horizontal (844×390) la etiqueta del título tapa los botones AUTO/ISO/ALZADO/PLANTA de la vista (maquetación de FT3D-8). No se toca aquí; anotado para UX.
- **Derechos:** código propio; Three.js r160 (MIT, ya en `vendor/`). Sin dependencias nuevas.
- **Datos:** solo fixtures sintéticas; sin datos de clientes, sin escrituras en el proyecto, sin peticiones externas (comprobado en cada prueba).
