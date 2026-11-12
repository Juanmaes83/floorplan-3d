# GOV-07 — Pruebas de hardware, DPR adaptativo y contexto WebGL (ola 1)

**Fecha:** 12-11-2026 · **Rama:** `lab/gov07-webgl-resilience` · **Origen:** `master@eae8cf6` · **Coordinación:** issue #206.

**Catálogo:** `GOV-07 | Pruebas en hardware real (iOS, Android, GPU de escritorio), DPR adaptativo y contexto WebGL`. No se crean IDs ni se cambian olas.

> **Nada de esta acta declara superada una prueba en iPhone, Android ni GPU real.** Todo lo automático se ha ejecutado en Chromium con SwiftShader (CPU). La parte física está en [`protocolo-dispositivos.md`](protocolo-dispositivos.md), sin marcar.

## Qué se ha encontrado (antes, en `master`)

| # | Situación | Antes | Ahora |
|---|---|---|---|
| D1 | Se pierde el contexto WebGL (otra app, memoria, reposo) | La vista 3D **desaparece sin aviso**; el usuario ve un hueco. | Velo con aviso accesible (`role=status`, `aria-describedby` en el lienzo). El plan sigue funcionando. Si el navegador devuelve el contexto, el aviso se retira y la escena vuelve **idéntica**: mismos píxeles y mismas piezas. |
| D2 | El navegador no devuelve el contexto | No hay salida. | A los 6 s: «No se ha podido recuperar la vista 3D…» con **Recargar la vista** (44 px, accesible con teclado). El proyecto está guardado; recargar no pierde nada. |
| D3 | Pérdidas repetidas | Nada. | A la 2.ª pérdida en 2 min se aplica la **degradación controlada y dicha**: DPR 1, sin sombras y el aviso «Calidad 3D reducida para mantener la vista estable». |
| D4 | Navegador **sin WebGL** (política, bloqueo, dispositivo) | La Evolución se queda en **«Cargando…» para siempre**: ni plan, ni Gantt, ni entrega. | Escena nula con la misma API y un aviso. Plan, fechas, ficha, importes y reproducción funcionan. |
| D5 | DPR alto en un dispositivo lento | DPR fijo `min(DPR,2)`. | **DPR adaptativo** por escalones (2 → 1,5 → 1) según la mediana de cuadros; nunca baja de 1. Sube solo si cabe con margen (coste ∝ ratio²). Con DPR 1 no hace nada. Cede el tamaño a la grabación de vídeo y lo recupera después. |

**Lo que ya estaba bien y ahora queda medido:**
- **Tope de DPR:** 1 → 1; 2 → 2; 3 → 2.
- **Giro de pantalla:** vertical ↔ horizontal sin scroll horizontal.
- **Uso prolongado sin fugas:**
  - 30 recargas más 10 s de reproducción: geometrías 164 → 164, texturas 1 → 1, heap estable;
  - 20 ciclos de reabrir, cambiar de pestaña, reproducir y cancelar: dentro de los umbrales de la prueba.

## Cambios

| Archivo | Tipo | Nota |
|---|---|---|
| `js/gl-quality-core.js` | Nuevo, puro (UMD) | Gobernador de DPR y monitor de contexto, con el tiempo como argumento. Reutilizable por el editor (ver ficha). |
| `evolucion/gl-guard.js` | Nuevo, FT3D-8 | Adaptador DOM: avisos, recuperación, degradación, medición y escena nula. Se engancha a la escena existente **sin modificar `project-scene.js`**, así que no entra en conflicto con #207. |
| `evolucion/fidelity-app.js` | FT3D-8 | Conexión. Los parámetros `glRestoreMs` y `glBudgetMs` solo funcionan en `?lab=1`, para CI. |
| `labs/gov07/index.html` | Nuevo, laboratorio | Banco para dispositivos físicos sobre la Evolución real con fixtures sintéticas. Mide carga, fluidez girando y reproduciendo, pérdida y recuperación, memoria en 5 ciclos y DPR. Devuelve un JSON. No envía nada. |
| `tests/gov07*`, `.github/workflows/gov07-webgl-resilience.yml` | Pruebas y CI | Gate propio. |
| `docs/qa/gov07-webgl-dispositivos-2026-11-12/` | Documentación | Acta, protocolo físico, ficha de cirugía y evidencias. |

**No se toca:**
- `index.html`;
- `js/professional-workspace-ui.js`;
- `js/delivery-*`;
- las API;
- los contratos;
- Vercel;
- la navegación de ENT-01;
- las PR #201–#205.

El editor (`index.html`) ya cae a 2D de forma segura. Lo que le falta (reabrir el 3D tras la recuperación, degradar y DPR adaptativo) queda en [`ficha-cirugia-editor.md`](ficha-cirugia-editor.md), reutilizando el mismo núcleo.

## Pruebas ejecutadas (local, Chromium 1243 + SwiftShader)

| Suite | Resultado |
|---|---|
| `gov07-quality-core` (núcleo puro) | 10/10 |
| `gov07-evolution-resilience` (navegador) | 11/11 |
| `gov07-bench` (banco completo, 1440×900 y 390×844 a DPR 3) | 2/2 |
| Regresión: `ft3d-8-fidelity` 6/6 · `ux4d` 20/20 · `delivery` 6/6 · `dossier` 6/6 · `fit` 9/9 · `lab` 2/2 · INT-R1 1/1 · `ft3d-8-lab` (Node) | Todo en verde |
| **Antes/después** (`GOV07_ROOT` sobre `master@eae8cf6`) | 0/11 en master |

En master, las pruebas 1–4, 8 y 9 fallan por los defectos D1–D5. Las 5–7, 10 y 11 fallan solo porque consultan la API nueva; el comportamiento de fondo ya era correcto.

**Casos adversariales cubiertos:**
- pérdida durante la reproducción;
- mover el plan con el contexto perdido;
- restauración tardía después de `failed`;
- doble evento de pérdida;
- grabación de vídeo con la guarda degradada (al soltar no vuelve a DPR 2);
- giro con el aviso visible;
- cuadros con pestaña oculta o pausados (> 500 ms) ignorados;
- presupuesto inalcanzable sin bajar de 1;
- opciones inválidas del núcleo.

## Evidencias

En `evidencias/`, con `manifest.json` y SHA-256. Cuatro estados en escritorio 1440×900 y en móvil 390×844:

1. pérdida con aviso;
2. sin respuesta, con «Recargar la vista»;
3. degradado;
4. sin WebGL.

## Navegadores

- **Chromium:** automatizado.
- **Firefox y WebKit:** no hay motores en este entorno, así que no se declaran. Quedan en la matriz física (Safari iOS/macOS y Firefox de escritorio).

## Recorrido humano (5 min)

1. Abre la Preview en `/evolucion/index.html?lab=1&case=A`, pulsa «Ver evolución» y luego ▶.
2. Ve a otra pestaña pesada o a otra app en el móvil y vuelve. Si el sistema liberó la GPU, verás «Vista 3D interrumpida» y la casa volverá sola.
3. Abre `/labs/gov07/` en tu teléfono y pulsa «Ejecutar banco» en vertical y en horizontal. Guarda los JSON.
4. Rellena la matriz de [`protocolo-dispositivos.md`](protocolo-dispositivos.md).

## Pendiente y decisiones para ChatGPT

- **Integración:** archivos nuevos más 6 líneas en `fidelity-app.js`. Es independiente de #207: los dos tocan `evolucion/`, pero no el mismo archivo.
- **Humano:** la matriz física completa, que es el núcleo de GOV-07 y no puede hacerse aquí.
- **Cirugía del editor:** ver la ficha.
- **Observación de #207:** el coste de los contornos «sin tarea» en escenas grandes solo puede juzgarse con el banco en GPU real.
- **Catálogo:** marcar GOV-07 es decisión de integración. Con la matriz física sin rellenar, el estado honesto es **parcial**.
