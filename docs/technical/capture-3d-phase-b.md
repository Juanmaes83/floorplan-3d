# Fase B (propuesta Pascal→Rubik): captura 3D configurable

**Estado: implementación en rama aislada `claude/phase-b-3d-capture`, pendiente de revisión humana.**

- No es una fase canónica.
- La autorización de Juanma cubre solo esta Fase B. Las fases C–G y la [propuesta](../proposals/PASCAL-RUBIK-INTEGRATION-ROADMAP.md) en conjunto siguen sin aprobar.
- **Base:** `master` `5b93339601998d750918e01cb4431073b75cf5a0`, tras el merge de la PR #27.
- **Independiente de la PR #28**, que es un cierre documental abierto: esta rama no la usa como base ni repite sus cambios.

## Punto de partida

| Elemento | Antes de esta entrega |
| --- | --- |
| Botón | «Archivo» → `#exportPng`. En 3D llama a `View3D.shot()`; en 2D, a la exportación SVG→PNG de 3200 px. |
| Captura 3D | `renderer.domElement.toDataURL('image/png')`. `WebGLRenderer` usa `preserveDrawingBuffer: true`, ACES y la conversión de color de salida de Three 0.160. |
| Tamaño | El del buffer del canvas: escenario × `devicePixelRatio`, con un máximo de 2. Sin opciones. |
| Cámara | `PerspectiveCamera` con FOV vertical de 45°. Su aspecto lo mantiene un `ResizeObserver` sobre `#stage`. |
| Pruebas | Solo había prueba de la exportación PNG 2D (`tests/browser.test.cjs`). La descarga 3D no tenía prueba automática. |

## Qué cambia

**Controles.** En «Archivo», un bloque solo visible en 3D (`#shot3dOptions`), traducido con el mecanismo existente de `data-en`/`data-es`:

- **Tamaño** (`#shot3dSize`):
  - «Vista actual (tamaño de pantalla)», **predeterminado**, idéntico al comportamiento anterior;
  - lado mayor de 1280, 1920 o 2560 px.
- **Proporción** (`#shot3dAspect`): «Igual que la vista», 16:9, 4:3, 1:1 o 9:16. Se desactiva con «Vista actual».
- **`#shot3dDims`:** muestra las dimensiones exactas que tendrá el PNG.

Las opciones viven solo en la página. No se guardan en el proyecto, el historial ni `localStorage`.

**Captura con tamaño explícito** (`shot(opts)` en el módulo 3D). Reutiliza el mismo renderer, la escena y una **copia** (`clone()`) de la cámara de trabajo:

1. Ajusta el aspecto de la copia. Si la salida es más estrecha que la vista, amplía el FOV vertical para conservar el horizontal. El resultado es un encuadre **«contain»**: todo lo visible en la vista de trabajo sigue visible, el otro eje gana margen y nunca se estira.
2. `setPixelRatio(1)` y `setSize(w, h, false)`: el buffer cambia, pero el CSS del canvas no.
3. Si el navegador no concede exactamente `w × h` (`drawingBufferWidth`/`Height`), aborta con un mensaje y restaura.
4. `render(scene, copia)` y `toDataURL` **síncrono**.
5. En `finally` restaura el pixel ratio y el tamaño, y vuelve a renderizar con la cámara de trabajo.

Todo ocurre en la misma tarea de JavaScript, así que el navegador no llega a pintar el estado intermedio. Al renderizar al framebuffer del canvas, la imagen conserva el mismo tono y espacio de color que la vista. Un `WebGLRenderTarget` en Three 0.160 no aplica tone mapping ni conversión de salida y habría dado colores distintos.

**Lo que no cambia:**

- `FloorPlanProjectV1`, el schema, las unidades, los ejes y la persistencia.
- La escena, la cámara de trabajo, los controles de órbita y recorrido, y la exportación 2D.
- Las dependencias: no se añade ninguna.

## Límites de tamaño

- **Lado mayor:** como máximo 2560 px.
- **Presupuesto de píxeles:** `SHOT_MAX_PIXELS = 2560 × 1920`, unos 4,9 MP.
  - Buffer de color RGBA: unos 19,7 MB.
  - Con el MSAA del canvas (`antialias: true`, en la práctica 4 muestras), más profundidad, la estimación es de unos 100 MB transitorios en el peor caso.
  - Es una **estimación de cálculo, no una medición**.
- **Límites de la GPU:** además, se limita al mínimo de `MAX_RENDERBUFFER_SIZE`, `MAX_TEXTURE_SIZE` y `MAX_VIEWPORT_DIMS`.
- **Si una combinación supera el presupuesto** (por ejemplo, 2560 en 1:1 o en «igual que la vista»), se reduce de forma proporcional, redondeando hacia abajo para no pasarse, y se indica «reducida al límite». 2560 en 1:1 da 2217 × 2217.
- **Comprobación final:** si el buffer real no coincide con lo pedido, la captura falla con un aviso y restaura la vista. No entrega una imagen de otro tamaño.

Sin teléfono físico no se ha medido la memoria ni el tiempo en móvil. El presupuesto es conservador frente a la mayoría de los límites de las GPU (normalmente 4096–16384 px por lado), pero no se declara validado en dispositivos reales.

## Qué no incluye

- Etiquetas CSS2D en la imagen: no aparecían antes y siguen sin aparecer.
- Recorte manual, supermuestreo, fondo transparente, vídeo, cámaras nuevas, nube, MCP, IA, modelos o superficies.
- Recordar las opciones entre sesiones.

## Pruebas

`tests/capture-3d.browser.test.cjs` (nuevo) pulsa el botón real «Exportar imagen» en 3D y lee la **descarga real**. Comprueba:

- firma PNG e `IHDR`;
- ancho y alto;
- que la imagen tenga contenido (más de 40 colores distintos en una muestra de 64×64);
- que no cambien el proyecto, deshacer/rehacer, `localStorage`, la cámara de trabajo (posición, cuaternión, FOV y aspecto) ni el canvas de trabajo (buffer, estilo y pixel ratio).

| Viewport | Casos |
| --- | --- |
| 1440×900 | predeterminado (= buffer del canvas); 1920 16:9 → 1920×1080; 1280 1:1 → 1280×1280; 2560 4:3 → 2560×1920 |
| 390×844 (móvil emulado) | predeterminado; 1280 9:16 → 720×1280; 1280 «igual que la vista» → lado mayor 1280 con la proporción de la vista |
| Límites | Las 15 combinaciones respetan el presupuesto y el máximo de 2560; 2560 1:1 queda reducida; una opción no válida se rechaza |
| 2D | La exportación 2D sigue en 3200 px de ancho, con el mismo nombre de archivo, sin mutaciones; las opciones 3D están ocultas en 2D |

**Batería ejecutada en secuencia** sobre un clon aislado de esta rama. Como base sirven los resultados de la misma sesión sobre un árbol idéntico al de `master` `5b93339`: `git rev-parse` da `9397a8a` para `5b93339^{tree}` y para `d8ff504^{tree}`.

| Suite | `master` | Fase B |
| --- | --- | --- |
| `tests/capture-3d.browser.test.cjs` (nuevo) | — | 3/3 |
| `tests/layout-review*.test.cjs` (Fase A) | 18/18 | 18/18 |
| Unitarias Node existentes | 124 pasan, 1 omitida (Blender) | 124 pasan, 1 omitida (Blender) |
| `tests/browser.test.cjs` (incluye el PNG 2D de 3200 px) | 36 pasan, 1 omitida (chequeo de CDN propio) | 36 pasan, 1 omitida (chequeo de CDN propio) |
| `tests/assets.browser.test.cjs` (F3) | 21 pasan, 4 fallan (2, 15, 16, 17) | 21 pasan, 4 fallan (los mismos; mismo error `replaceChildren … blur` y mismo número de ocurrencias: 18, 11, 11 y 11) |
| `tests/surfaces.browser.test.cjs` | 7/7 | 7/7 |
| `tests/room-layout.browser.test.cjs` | 5/5 | 5/5 |

`node --check` de los dos scripts en línea de `index.html` y del test nuevo, `git diff --check` y `scripts/check-documents.py`: correctos.

La revisión visual de las salidas reales se hizo en 16:9, 1:1, 9:16 y «igual que la vista» en móvil: sin estiramiento, con el plano completo, y con los colores y la luz de la vista de trabajo. También se revisaron los controles del menú a 1440×900 y 390×844.

**Condición del entorno:** jsDelivr devuelve 403 en el proxy de esta sesión. La prueba usa el mismo patrón que las demás suites 3D (`curl` del CDN oficial); aquí ese `curl` se sirvió con un *shim* local a partir del tarball npm de Three 0.160.0. SwiftShader no acredita GPU real ni teléfono físico.

## Archivos

- `index.html`:
  - controles en el menú «Archivo» y estilos;
  - `shot3dOptions`/`updateShot3dDims` y el cableado de `exportPNG`;
  - `shotSize`/`shot` en el módulo 3D;
  - `View3D.shotSize`, `cameraState` y `canvasState`, de solo lectura;
  - textos en `ES_TEXT`.
- `tests/capture-3d.browser.test.cjs` (nuevo).
- `docs/technical/capture-3d-phase-b.md` (este informe).
- `docs/qa/artifacts/capture-3d/`: salidas reales de la prueba usadas en la revisión visual.
