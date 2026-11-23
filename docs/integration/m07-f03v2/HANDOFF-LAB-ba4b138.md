# F03 V2 · Fidelidad arquitectónica profesional de fachadas · handoff para Codex

**Estado:** **GO-LAB** propuesto (§9): candidata completa, suite **15/15 PASS** sobre la copia final. La aprobación visual humana del conjunto F03 V2 **sigue pendiente**. Nada está fusionado, desplegado ni activado; F03 V2 queda OFF por defecto.

| | |
|---|---|
| Repositorio | `Juanmaes83/rubik-sculpt-simulator-lab` |
| Rama | `claude/f03-v2-fidelidad-profesional` (independiente de Simulator B, HERO y E3) |
| Producto base | `floorplan-3d` master **`1bc501d64ab091a8fac25669bf8843f8f5076a3d`** (confirmado el 21/11/2026 como HEAD de master), sin modificar |
| Parche | `surgery/F03-V2-master-1bc501d.patch` (`git apply --binary`, 30 archivos) · sha256 `fa1906e4a5123fff53b876af7ebfc8cdd6e6da092ecd9097a426bd1eaffbc7e5` |

## 0. Encaje en el maestro de 14 módulos

| | |
|---|---|
| Módulo | **M07 · Fidelidad arquitectónica**: la capacidad autorizada es F03 V2, fachadas y materiales de la vivienda real |
| Recorrido M07 exigido | Abrir la vivienda completa → material elegible → ON/OFF reversible → recorrer la fachada a altura humana → comparar y demostrar. Se cubre en §1 y se acredita en §5–§7 |
| IDs históricos (anexo, director M07) | **IMG-06** «Paredes y techos»: acabados exteriores PBR. **BIB-01** «Biblioteca propia con licencias»: procedencia CC0, hashes y fuentes |
| Consumidores sin modificar su autoridad | **OP-02**, render bajo demanda (V2 corrige la petición de fotograma tras la carga). **UX-21**, panel de sol (se usa en las evidencias; sin cambios) |
| Fuera de alcance, declarado | **LUZ-01** iluminación (F04) y encuentros constructivos (F05). No se han abierto |
| Estado propuesto | **GO-LAB** del constructor. GO-REVISIÓN, GO-MERGE, Production y activación corresponden a la auditoría, a Codex y al propietario |

## 1. Qué consigue la persona

**Recorrido real** (todo existe ya en RUBIK salvo «Fachadas ▾»):
1. Abre su proyecto. Las fachadas tienen acabados asignados con la «Biblioteca de acabados · pared».
2. Entra en **Escena 3D** y pulsa **«Detalle arquitectónico»**, el botón de siempre: F02 + F03 V1, exactamente como en master.
3. Aparece **«Fachadas ▾»**. El panel muestra el interruptor **«Materiales de fachada fieles · experimental»** y la lista de acabados:
   - los elegibles, con su número de muros y su resolución (HERO 1024 o equilibrado 512);
   - los no elegibles, con el motivo: «Sin acabado asignado», «Sin material de fachada fiel: se conserva», «Fuera del presupuesto de memoria», «fallo de carga».
4. Activa el interruptor. Cada muro exterior recibe la **versión PBR completa del mismo material que tiene asignado**: revoco pintado, revoco de arcilla, hormigón visto, madera, y además los estucos de V1.
5. Recorre el exterior (vista aérea, «Recorrer», el control «Sol»), se acerca a ventanas y esquinas, y compara ON/OFF en la misma vista.
6. Lo desactiva: vuelve **exactamente** al estado anterior, comprobado píxel a píxel. El proyecto, sus materiales, la cámara, el historial y las herramientas no cambian.

**Garantías:**
- Es sólo de la sesión: nunca se guarda ni se exporta.
- Es `VISUAL_ONLY`: no hay geometría nueva, desplazamiento ni cambio de medidas, huecos, cubierta o asignaciones.
- Está OFF por defecto.

## 2. Qué se reutiliza y qué es nuevo

**Se reutiliza** (sin duplicar):
- el renderer, la escena y `MeshStandardMaterial` de RUBIK;
- el catálogo de acabados (`assets/materials/catalog.json`) y su asignación;
- el adaptador y núcleo F03 de master, ampliados;
- la clasificación exterior (`exterior-core`), F02 (`WindowVisualAdapter`) y el botón «Detalle arquitectónico»;
- el control «Sol», la presentación y el grabador «Por paradas», para el vídeo.

**Es nuevo:**
- en el núcleo: `resolveFacadeV2`, `facadeEligibilityV2`, `planFacadeBudget` y la receta V2;
- en el adaptador: `applyV2`, `previewV2` y `metricFacadeGeometryScaled`;
- el panel «Fachadas ▾» en `architectural-quality.mjs`;
- cuatro materiales PBR derivados (24 WebP) y su manifiesto `F03/pbr-derivatives@2`;
- la conexión en `index.html` (unas 30 líneas).

Metodología, diferencias con V1 y con el experimento anterior, y auditoría de licencias: **[METODOLOGIA-Y-MATERIALES.md](METODOLOGIA-Y-MATERIALES.md)**.

## 3. Integración

**Parche único:** `surgery/F03-V2-master-1bc501d.patch`, con su lista de archivos y SHA-256 en `surgery/F03-V2-master-1bc501d.archivos.json`.
- **Modificados:**
  - `index.html`: conexión mínima;
  - `js/facade-fidelity-core.mjs` y `js/facade-fidelity-adapter.mjs`: V1 intacta, V2 añadida;
  - `js/architectural-quality.mjs`;
  - `tests/facade-fidelity.test.cjs`: las 4 pruebas V1 sin cambios y 5 nuevas.
- **Nuevos:** `assets/materials/f03/v2-manifest.json` y 24 derivados en `assets/materials/f03/v2/`.
- **Diff de código legible** (sin binarios): `surgery/f03-v2-cirugia-codigo.patch`.
- **Reversión:** `git apply -R --binary`.

**Reproducir** (ver `tools/cierre.sh`):
1. `node tools/copia.cjs <master> <copia>`
2. `node tools/parche-unico.cjs <master> <copia> <salida.patch>`
3. `(cd <copia> && node --test tests/facade-fidelity.test.cjs)`
4. `node tools/qa.cjs <copia> <master>`: suite F3-01…F3-15.
5. `node tools/evidencia.cjs <copia>`, `python3 tools/laminas.py evidence/visual evidence/laminas` y `node tools/video.cjs <copia>`.

**Derivados** (no hace falta repetirlo para integrar):
1. `python tools/descargar-fuentes.py <dir> assets/fuentes-poly-haven.json`
2. `python tools/convertir-pbr-v2.py <dir> assets/fuentes-poly-haven.json <master>/assets/materials assets/producto`

Ambos con OpenEXR 3.5.3 y Pillow 12.3.0, las mismas versiones que V1.

**Proyecto de prueba (declarado)** en `assets/proyecto-prueba/`. Se construyó **por la ruta real**, no editando JSON (`tools/construir-proyecto.cjs`):
1. el ejemplo de RUBIK;
2. «Crear mi copia»;
3. 18 asignaciones con la «Biblioteca de acabados · pared»;
4. «Exportar proyecto JSON».

Es el ejemplo de RUBIK: un **piso de una planta**. No hay cubierta (`ROOF: NOT_APPLICABLE`) y la lectura exterior es parcial (8 muros indeterminados, igual que en master). `regresion-v1.json` asigna los presets de V1 y se construyó sobre master sin cambios.

## 4. Defectos de master encontrados (y corregidos dentro del alcance)

1. **Material F03 sin dibujar tras cargar** (render bajo demanda, OP-02). Nadie pide un fotograma cuando el adaptador termina, así que el material aparecía en la siguiente interacción. Medido en master: la imagen tras cargar difiere de la del fotograma siguiente. Corrección: `facade-fidelity-status` → `requestFrame()`. Lo acredita F3-09.
2. **«Detalle arquitectónico» en español en una sesión en chino.** RUBIK marca `lang="zh-CN"` y el control buscaba `zh`. Corrección: usar el prefijo del idioma. Lo acredita F3-11.

## 5. Pruebas (`tools/qa.cjs`)

| Caso | Acredita |
|---|---|
| F3-01 | Pruebas puras: F03 (V1 + V2), superficies y familias visuales. Derivados íntegros contra el manifiesto. Procedencia CC0. Manifiesto V1 idéntico a master |
| F3-02 | Ruta real completa A → B → «Fachadas ▾» → C → B → A, con retorno **exacto** píxel a píxel. Proyecto y cámara intactos |
| F3-03 | 3 ciclos ON/OFF sin fugas (`renderer.info.memory`). Reconstrucción en 3D con V2 activo (muros seccionados/completos): se reaplica sin acumular. Salir de 3D lo apaga |
| F3-04 | Cambio de proyecto con V2 activo: se apaga y libera todo |
| F3-05 | Pérdida de contexto WebGL: libera sin error y se recupera al reabrir |
| F3-06 | Carga fallida: parcial (un material), respaldo total (sin manifiesto) y recuperación |
| F3-07 | **Regresión contra master sin cambios**: con V2 apagado, el detalle es idéntico **píxel a píxel**. Con V2, los presets de V1 conservan su material |
| F3-08 | Almacenamiento, historial y exportación intactos con V2. Deshacer/rehacer reales |
| F3-09 | Render bajo demanda: 0 fotogramas en reposo y material dibujado sin interacción |
| F3-10 | Convivencia con «Presentar mi vivienda» |
| F3-11 | ES/EN/ZH sin chino en ES/EN |
| F3-12 | Teclado y foco: `aria-expanded`, `role=switch`, Espacio, Escape devuelve el foco, región viva |
| F3-13 | Móvil 390×844 y 844×390: menú dentro de la pantalla, controles ≥ 40 px, sólo equilibrado y ≤ 17 MB |
| F3-14 | Rendimiento y recursos: activación, p50/p95, bytes y memoria estimada, sin fugas |
| F3-15 | Regresión del producto: `tests/surfaces.browser.test.cjs` |

## 6. Resultados

**Ejecución final** (`tools/cierre.sh`):
- **Copia:** nueva, construida desde master `1bc501d`. Al aplicar el parche sobre master se obtiene esa misma copia.
- **Unitarias:** `evidence/unitarias.txt`, **9/9**: las 4 de V1, sin cambios, y las 5 de V2.
- **Navegador:** `evidence/qa.json`, 2026-11-21T12:11Z, **15/15 PASS**, Chromium con SwiftShader.

| Caso | Resultado | Datos |
|---|---|---|
| F3-01 | PASS | `facade-fidelity` 9/9 · `surface-fidelity` 3/3 · `visual-families` 3/3. 24 derivados verificados por SHA-256. Manifiesto V1 idéntico a master |
| F3-02 | PASS | La lista muestra Revoco pintado 8 · Madera 4 · Arcilla 3 · Hormigón 2 · Sin acabado 11 · Pizarra «se conserva». Activo en **17 muros** con 4 materiales. **B y A se recuperan píxel a píxel** |
| F3-03 | PASS | 3 ciclos con el renderizador en 15→27→15 texturas y 1121→1138→1121 geometrías. Al reconstruir dentro de 3D, 12 texturas, 4 materiales y 17 muros, sin acumular |
| F3-04 | PASS | Cambio de proyecto: V2 apagado y 0 texturas |
| F3-05 | PASS | Pérdida de contexto: V2 apagado y 0 texturas, sin errores. Se recupera al reabrir |
| F3-06 | PASS | Parcial: 13 muros (falla la madera, con su motivo). Respaldo total sin manifiesto. Se recupera |
| F3-07 | PASS | Estado B **idéntico píxel a píxel a master** (2 muros de estuco, 12 carpinterías). En C: `white_stucco` ×2, `rough_plaster_03` ×1 y revoco pintado |
| F3-08 | PASS | Almacenamiento, historial y exportación idénticos con V2. Deshacer real: hormigón → revoco |
| F3-09 | PASS | 0 fotogramas en reposo y bucle inactivo; el material queda dibujado sin interacción |
| F3-10 | PASS | Presentación: V2 activo durante (17 muros) y después |
| F3-11 | PASS | ES y EN sin CJK; ZH traducido |
| F3-12 | PASS | `aria-expanded`, `role=switch` etiquetado, Espacio, Escape con foco de vuelta y región viva |
| F3-13 | PASS | 390×844 y 844×390: menú dentro de la pantalla, controles de 77 y 44 px, sólo equilibrado, 16,8 MB estimados |
| F3-14 | PASS | Activación en 1,84 s. RAF p50/p95 de 730/886 ms con V2 apagado y 874/1227 ms con V2 activo, en SwiftShader. 5,31 MB descargados. 41,9 MB de GPU **estimados** (tope 42 MB). Sin fugas |
| F3-15 | PASS | `tests/surfaces.browser.test.cjs` del producto: 8/8 |

**Compatibilidad** (`evidence/qa-combinada-hero-simulatorb-f03.json`):
- Sobre master `1bc501d`, F03 V2 aplica limpio junto a HERO FINAL (`a8c1e379`) y Simulator B (`4bab4bd`), **en cualquier orden**.
- Sobre la copia con los tres parches: F3-01, F3-02, F3-09, F3-10 y F3-12 dan **5/5 PASS**.
- Esa copia contiene exactamente el mismo F03 V2 que la final (`diff -r` vacío).

## 7. Evidencia visual y vídeos

**Láminas de revisión** (`evidence/laminas/`, JPEG): A | B | C con la misma cámara, luz, exposición, geometría y proyecto, capturadas de los píxeles del lienzo 3D (1768×996, DPR 2). La hora de sol se fija con el control «Sol» de RUBIK.
- **Fachadas completas a 1,6 m:** `e1-fachada-este-completa`, `e2-fachada-sur-completa`, `e3-fachada-oeste-completa`, `e4-fachada-norte-completa`.
- **Oblicua con luz rasante:** `e5-oblicua-sur-rasante`.
- **Esquina con carpintería F02:** `e6-esquina-mirador`.
- **Detalles:** `e7`…`e10` y la lámina `detalles-b-c` (arcilla, revoco, hormigón y madera).
- **Exterior general a 2,6 m:** `e11-exterior-general`.
- **Móvil:** `movil-390x844` y `movil-844x390` (interfaz real, emulación Chromium).
- Los PNG originales y las cámaras de cada vista están en `evidence/visual/` (`registro.json`). Hay capturas de la interfaz en ES/EN/ZH, menú y móvil en `evidence/qa/`.

**Vídeos auténticos** (`evidence/video/`, medidos con ffprobe):

| Archivo | Qué es | Formato | Duración y fotogramas | sha256 |
|---|---|---|---|---|
| `f03-v2-video-de-pantalla.mp4` | **Vídeo de pantalla**: grabación del navegador con RUBIK en ejecución, **no** una exportación de RUBIK. Recorre importación, «Detalle arquitectónico», «Fachadas ▾» y la activación; un recorrido exterior a 1,6 m; V2 OFF/ON en la misma vista; y la arcilla con luz de tarde. Marcas de tiempo en `registro.json` | H.264 High, 1280×720, 25 fps | 55,64 s · 1391 | `0c31a01889bf7252a12692c298fb6d54a1fe0a9dfbacdacc7012c829240b2d20` |
| `f03-v2-rubik-por-paradas.mp4` | **MP4 exportado por RUBIK** con su grabador existente («Grabar vídeo · Por paradas»), con F03 V2 activo durante toda la grabación (17 muros antes y después). Recorre las paradas de la presentación: las fachadas sólo aparecen en la vista general | H.264 Constrained Baseline, 1280×720 | 11,26 s · 164 | `8666abc4ba4ff0d43ed553f097a11ce8057b28ce2e6abe438b978f093812431a` |

Fotogramas extraídos: `pantalla-fotograma-*.png` y `rubik-mp4-fotograma-1s.png`. En SwiftShader la fluidez depende de la velocidad de render por software de este entorno.

## 8. Límites y riesgos

- **Plataformas.** Probado sólo en Chromium con SwiftShader (render por software). **Sin probar:** Firefox, Safari/WebKit y dispositivos físicos (`MOBILE_PHYSICAL_PENDING`). El móvil es emulación de Chromium.
- **Memoria y rendimiento.** La memoria GPU es **estimada** (RGBA8 con mipmaps), no medida del driver. Los tiempos son RAF en SwiftShader, no tiempo de GPU real.
- **Presupuesto.** V2 usa hasta 42 MB estimados en escritorio (2 materiales HERO + 2 equilibrados), frente a los 14 MB de V1, y 17 MB en móvil. Es una decisión de producto a revisar.
- **Iluminación (dependencia F04).** Con la luz por defecto, las fachadas a contraluz se ven oscuras. Las comparativas usan el control «Sol» existente para que la luz alcance cada fachada, con la misma hora en A/B/C. Una iluminación de presentación de fachadas pertenece a F04 y no se ha abierto.
- **Encuentros.** No se han tocado esquinas, remates ni alféizares propios (F05). En las esquinas, la UV métrica cambia de eje: no hay continuidad de textura de un plano a otro perpendicular.
- **Repetición.** Con 2 m de repetición física, en una fachada de 8 m se perciben motivos repetidos (revoco pintado). No se ha añadido variación anti-repetición.
- **Dos caras por muro.** RUBIK asigna un acabado a todo el muro (ambas caras). La mejora aplica el material a las dos caras del muro exterior, como ya hacía V1.
- **Datos del catálogo.** Sólo tienen nombre en español: en ZH, un acabado no elegible se muestra con su nombre español.
- **Herencia de V1.** `white_stucco` (preset `surface-white-plaster-02`) y `rough_plaster_03` (`surface-plastered-wall-03`) siguen siendo equivalencias por parecido. V1 está protegida, así que **no se han cambiado**. Para `white-plaster-02` se recomienda derivar en el futuro `white_plaster_02`, el mismo activo, con aprobación humana: el tinte actual (≈ 0,3) aplana el estuco.
- **Proyecto de prueba.** Es un piso del ejemplo, no una vivienda unifamiliar: no permite evaluar cubierta ni varias plantas.
- **Contexto WebGL.** Tras perderlo, RUBIK no reconstruye el renderizador en la misma sesión (comportamiento de master): hay que reabrir.

## 9. Propuesta GO / NO-GO

**GO-LAB.** La candidata está completa para revisión e integración por Codex:
- se recorre de principio a fin desde la interfaz real;
- la mejora se ve y es reversible píxel a píxel;
- los materiales son del mismo activo que el acabado asignado;
- las regresiones contra master son idénticas, también con HERO y Simulator B;
- hay vídeo real y licencias con hashes.

**No es GO-MERGE.** Siguen pendientes:
- la **aceptación visual humana** del conjunto F03 V2;
- la CI y la Preview del producto;
- la decisión sobre el presupuesto de 42 MB;
- la autorización del propietario por SHA.

Production y activación son decisiones aparte. Los límites de §8 (Safari/Firefox/dispositivos, memoria estimada, dependencia de F04 en la luz) no se presentan como validados.

| Exigencia de la regla de cierre | Evidencia |
|---|---|
| Código completo y conectado a la ruta real | Parche de 30 archivos; «Detalle arquitectónico» → «Fachadas ▾» (F3-02) |
| Mejora visible y reversible | Láminas A/B/C; retorno píxel a píxel (F3-02) |
| Materiales semánticamente correctos | Mismo activo que el preset; descartes justificados (METODOLOGIA-Y-MATERIALES.md) |
| Comparativas de fachada completa y móvil útil | `e1`–`e4`, `e11`, `movil-*` |
| Vídeo auténtico reproducible | Dos MP4 con ffprobe y sha256, cada uno rotulado con lo que es |
| Pruebas puras, de navegador, regresiones y errores | 9/9 + 15/15; F3-04/05/06/07/08/15 |
| Conservación del proyecto y restauración | F3-02, F3-04 y F3-08 |
| Recursos, licencias y rendimiento | F3-01, F3-14 y `assets/fuentes-poly-haven.json` |
| Compatibilidad con master, HERO FINAL y consumidores | Parche sobre `1bc501d`; copia combinada 5/5; consumidores de F03: editor y pruebas |
| Handoff con GO/NO-GO y límites | Este documento |

## 10. Siguiente acción (Codex)

1. Revisar el parche y sus contratos: decisión V2, elegibilidad, presupuesto y manifiesto `@2`.
2. Reconciliar con el master vigente, ejecutar CI y Preview, y pedir la aceptación visual humana de F03 V2 con las láminas y el vídeo.
3. Pedir la autorización de integración por SHA.

Codex **no** debe terminar nada de F03 V2. Si algo esencial no se sostiene, procede devolverlo con NO-GO.
