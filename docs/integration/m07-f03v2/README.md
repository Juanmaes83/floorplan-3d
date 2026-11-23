# M07 · F03 V2 · Fidelidad arquitectónica de fachadas

**Candidata independiente.** Base: `master@c355bdf8e5716a634a6c9835df4aec3c3b86ba3b`. No depende de M13.
**Origen:**
- laboratorio `Juanmaes83/rubik-sculpt-simulator-lab@ba4b138063f47f4095615a367bf8668cc67356d5`;
- parche `surgery/F03-V2-master-1bc501d.patch`, SHA-256 `fa1906e4…7e5`, que coincide con el del handoff (`HANDOFF-LAB-ba4b138.md`).

## Decisión técnica: conservar la candidata del laboratorio y verificarla sobre el master vigente

- Entre `1bc501d`, la base del laboratorio, y `c355bdf` (70 commits), de los archivos que toca F03 V2 solo ha cambiado `index.html`.
- El parche aplica **sin conflictos**: los tres cambios de `index.html` caen en su sitio, y he comprobado que existen los símbolos que usa (`storyRun`, `requestFrame`, `mountArchitecturalQuality`).
- No se reescribe nada que ya funcione. Sí se añade lo que faltaba para el producto:
  - una prueba de navegador en `tests/`, porque la suite F3 vivía en el laboratorio;
  - jerarquía visual en el panel «Fachadas ▾».

**Reutilizado** (una sola autoridad de proyecto y de geometría):
- el renderer y la escena de RUBIK;
- el catálogo de acabados y su asignación;
- el núcleo y el adaptador F03 V1, que no cambian y se amplían;
- `exterior-core`, F02 y el botón «Detalle arquitectónico»;
- el control «Sol» y la Presentación.

**Nuevo:**
- la receta V2 y el plan de presupuesto GPU, en el núcleo;
- `applyV2` y `previewV2`, en el adaptador;
- el panel «Fachadas ▾»;
- 4 materiales PBR derivados del **mismo** activo Poly Haven CC0 que su entrada de catálogo (24 WebP, 5,3 MB, manifiesto `F03/pbr-derivatives@2`).

## Qué puede hacer ahora una persona

1. Abrir su vivienda y entrar en Escena 3D.
2. Pulsar **«Detalle arquitectónico»** (lo de siempre) y, después, **«Fachadas ▾»**.
3. En el panel, ver los acabados exteriores **realmente asignados**:
   - cada uno con su textura y su número de muros;
   - una etiqueta con la resolución (HERO 1024 o equilibrado 512);
   - los no elegibles, atenuados y con su motivo.
4. Activar **«Materiales de fachada fieles»**: cada muro exterior recibe la versión PBR completa **de su propio acabado**.
5. Recorrer el exterior y compararlo.
6. Desactivarlo: vuelve **exactamente** a la imagen anterior, comprobado píxel a píxel.

La activación es solo de la sesión: no se guarda, no se exporta, no cambia geometría, medidas, revisiones ni asignaciones, y está apagada por defecto.

## Validación sobre `c355bdf` (22/11/2026, Chromium 153 + SwiftShader)

| Prueba | Resultado |
|---|---|
| Suite F3-01…F3-15 del laboratorio (`tools/qa.cjs`), con copia = esta rama y referencia = `c355bdf` sin cambios | **15/15 PASS** (`qa-c355bdf.json`) |
| F3-07 · regresión con V2 apagado | Detalle **idéntico píxel a píxel** a master `c355bdf` |
| F3-02/F3-03 · reversibilidad y fugas | A → B → C → B → A exacto. 3 ciclos 15 → 27 → 15 texturas y 1121 → 1138 → 1121 geometrías |
| F3-04/05/06 · cambio de proyecto, pérdida de contexto, carga fallida | Libera todo. Parcial con motivo (13 muros) y respaldo total |
| F3-08 · datos | Almacenamiento, historial y exportación idénticos. Deshacer y rehacer reales |
| F3-09 · OP-02 | 0 fotogramas en reposo; el material se dibuja sin interacción |
| F3-10/11/12/13 | Convivencia con Presentación · ES/EN sin chino · teclado y foco · móvil 390×844 y 844×390, solo «equilibrado», 16,8 MB |
| F3-15 · `tests/surfaces.browser.test.cjs` | 8/8 |
| **Producto:** `tests/m07-f03v2.browser.test.cjs` (nueva, añadida a `regression-partitions.json` como bloqueante) | **2/2**: recorrido real ON/OFF con retorno exacto, proyecto y almacenamiento intactos; fallo de carga parcial con motivo |
| Unitarias `facade-fidelity` + `surface-fidelity` + `visual-families` | 15/15 |
| Compatibilidad textual con #313 (Codex, `4d2eee78`) y con Claude Code 1 (`997ea720`) | Aplica limpio sobre ambas: 30 archivos, 0 conflictos |

**Láminas** A | B | C con la misma cámara, luz y geometría, regeneradas sobre `c355bdf`, en `laminas/`:
- 4 fachadas completas a 1,6 m;
- una oblicua con luz rasante;
- una esquina;
- 4 detalles de material;
- una vista general;
- móvil en vertical y en horizontal.

## Rendimiento y memoria (medido o estimado, sin redondear a favor)

- **Memoria GPU estimada:** 41,9 MB en escritorio (tope 42 MB: 2 materiales HERO de 16,8 MB y 2 equilibrados de 4,2 MB) y 16,8 MB en móvil.
  - Es la misma fórmula que ya usa `surface-renderer.mjs` de RUBIK: RGBA8 con mipmaps.
  - Es exacta para texturas sin comprimir, pero **no es una medida del driver**: WebGL no la expone.
  - El planificador nunca supera el tope: baja a equilibrado o conserva el acabado base, y lo dice en el panel.
- **Valoración:** adecuado para escritorio. Es una carga voluntaria de una sesión, del mismo orden que la iluminación HDR de Presentación.
- En móvil se limita a equilibrado.
- **Descarga:** 5,3 MB, solo al activar.
- **SwiftShader** (renderizado por software, no es tiempo de GPU real):
  - fotograma p50 de 2.166 ms apagado frente a 2.213 ms activo (+2 %);
  - activación en 5,4 s con la máquina cargada (1,8 s en el laboratorio sin carga).
- **Pendiente:** medir en una GPU física, de escritorio y de móvil. No se afirma ningún rendimiento real.

## Revalidación con #313 y coordinación de `index.html`

- **Con #313** (`codex/simulator-b-post311@7ef72889` + M07): F3-01, 02, 09, **10** (Presentación), 12 y 13 dan **6/6 PASS** (`qa-pr313-7ef72889.json`).
- **`index.html`:** #313 solo añade un bloque de `<script>` hacia la línea 6126. Los cambios de M07 están en las zonas 3210–3240 y 5950–5980; el de M13 es una línea junto a `construction-schedule-core.js`. No se solapan, y aplican en cualquier orden.
- **Cuando #313 se integre:** repetir F3-10 sobre el master resultante:

  ```bash
  QA_SOLO=F3-10 node tools/qa.cjs <copia> <master>
  ```

## Cambio escritorio ↔ móvil, recursos y captura para Blender

- **Defecto corregido** (reproducido antes por la prueba): al cruzar 1100 px con V2 activo se conservaba HERO (41,9 MB) en móvil. Ahora se vuelve a aplicar con el modo nuevo: en móvil todo es equilibrado (≤17 MB), con los mismos muros; al volver a escritorio no se acumula nada; OFF devuelve las texturas y geometrías a la base. Lo cubre la prueba 3 de `tests/m07-f03v2.browser.test.cjs`.
- **Captura «Escena para Blender» (OP-10) con V2 activo:**
  - es una **observación** de lo que se ve: geometría idéntica;
  - los muros V2 se declaran con `hasMap` y `hasNormalMap`; las texturas nunca viajan, igual que en master con los acabados texturizados;
  - la **exportación canónica** (`scripts/interop/export.cjs`, a partir del proyecto) es idéntica;
  - tras OFF, la captura vuelve a ser la de master.

  Lo cubre la prueba 4. No se ha tocado el módulo de captura de Blender.

## Riesgos y pendientes

- **Aprobación visual humana** de los 4 materiales nuevos: estado `VISUAL_PENDING_HUMAN` en el núcleo. Es la decisión que se solicita.
- **Proyecto de prueba:** el ejemplo de RUBIK, un piso de una planta. Sin cubierta, con 8 muros de lectura exterior indeterminada, igual que en master.
- **Superficies compartidas con Presentación** (Codex #313): aplica limpio y F3-10 convive con Presentación en master. Volver a ejecutar F3-10 si #313 se integra antes.
- **Fuera de alcance:** F04 (iluminación) y F05 (encuentros).
- **Reversión:** revertir el commit. Los datos guardados no cambian.
