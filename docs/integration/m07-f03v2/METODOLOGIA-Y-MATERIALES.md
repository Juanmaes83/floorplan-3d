# F03 V2 · Metodología transferida y auditoría de materiales y licencias

## 1. Qué explica la calidad de `rough_plaster_03` (M1)

Medido con los derivados HERO publicados en master (`evidence/caracter-v1.json`):

| Material | Relieve medio / p95 | σ rugosidad | Contraste albedo (CV) | `tintLinear` |
|---|---|---|---|---|
| `rough_plaster_03` (aprobado) | 11,0° / 27,1° | 0,048 | 0,46 | 0,84 · 0,90 · 0,96 |
| `white_rough_plaster` | 10,8° / 22,8° | 0,046 | 0,37 | 0,48 · 0,44 · 0,38 |
| `white_stucco` (F03 V1) | 5,9° / 13,9° | 0,007 | 0,04 | 0,35 · 0,33 · 0,28 |

La calidad aprobada tiene dos orígenes distintos, y conviene no confundirlos.

**1. El método (reproducible).** Es lo que se transfiere. Se implementa en `scripts/qa/f03/convert-pbr.py` (V1) y en `tools/convertir-pbr-v2.py` (V2), sin cambios de criterio:
- **Albedo:** perfil ICC convertido a sRGB y reducción Lanczos; WebP q88.
- **Normal OpenGL desde EXR float:** vectores unitarios, píxeles degenerados reparados a +Z, reducción **por área** (preserva la normal media) y renormalización; WebP sin pérdida.
- **Rugosidad lineal:** reducción por área y réplica RGB (Three lee el canal G); WebP sin pérdida.
- **Perfiles:** HERO 1024 y equilibrado 512.
- **En ejecución:**
  - UV métrica en espacio de mundo, para que haya continuidad entre paños colineales;
  - `normalStrength` 0,65 (la calibración aprobada en V1);
  - `MeshStandardMaterial` con `roughness = 1 × mapa` y `metalness = 0`;
  - `tintLinear` para conservar el color asignado;
  - desplazamiento desactivado: la geometría no se toca.

**2. El carácter de la fuente (no transferible).** No se copia:
- `rough_plaster_03` tiene mucho mesorrelieve (p95 27°) y contraste tonal (CV 0,46).
- Además, su `tintLinear` ≈ 0,9 apenas lo altera.

**El contraejemplo de V1.** A `white_stucco` el tinte lo multiplica por ≈ 0,3 para alcanzar el gris del catálogo (`#8e877b`). Eso aplasta su escaso relieve y explica por qué se ve plano y oscuro.

**Conclusión aplicada en V2:**
- Transferir el **método**, no el aspecto rugoso.
- Elegir para cada acabado una fuente **compatible con el color asignado**, es decir, del mismo activo; así `tintLinear` ≈ 1.
- Medir y registrar esa compatibilidad: `tintLogSpread`, en el manifiesto.

## 2. Qué añade V2 al método

| | F03 V1 (master) | Experimento V2 previo (`dd9c26ff`) | **F03 V2 (esta candidata)** |
|---|---|---|---|
| Material por muro | Uno por decisión (`white_stucco`); el resto, experimental | Igual; sube el presupuesto a 17 MB | **El del acabado asignado a cada muro** (catálogo de RUBIK → mismo activo) |
| Materiales | 3 revocos/estucos | 3 | **3 de V1 + 4 nuevos**: revoco pintado, revoco de arcilla, hormigón visto, madera |
| Identidad | Equivalencia por parecido (`white_stucco` ≈ `white-plaster-02`) | Igual | **Mismo activo** que la muestra del catálogo (`sameAsset: true`); V1 se conserva y se declara `sameAsset: false` |
| Escala | 2000 mm fija (`EXPERIMENTAL_NOT_SOURCE_CERTIFIED`) | Igual | **Física de la fuente** (`SOURCE_PHYSICAL_DIMENSIONS`); la del profesional si la cambió |
| Presupuesto | 14 MB, una textura | 17 MB | **Planificador**: el material con más superficie recibe HERO; escritorio 42 MB, móvil 17 MB (estimados); nunca se supera |
| Fallo | Todo o nada | Igual | **Aislado por material**: los demás se aplican y el muro afectado conserva su acabado |
| Interfaz | «Detalle arquitectónico» | — | **«Fachadas ▾»**: interruptor voluntario y elegibilidad explicada muro a muro, en ES/EN/ZH |
| Anisotropía | 4 | 4 | Hasta 8 (las fachadas se miran en rasante) |

## 3. Auditoría de materiales y licencias

Proveedor: **Poly Haven**, licencia **CC0-1.0** (https://polyhaven.com/license).

Se descargaron sólo albedo, normal OpenGL y rugosidad a 2K, mediante la API pública y sin servicios de pago. El MD5 publicado por el proveedor se verificó en cada archivo. Las fuentes **no** entran en el repositorio: su URL, tamaño, MD5 y SHA-256 están en `assets/fuentes-poly-haven.json`.

| Material F03 V2 | Preset del catálogo (mismo activo) | Autoría | Categorías de la fuente | Tamaño físico | Derivados HERO / equilibrado | `tintLinear` |
|---|---|---|---|---|---|---|
| `painted_plaster_wall` | `surface-painted-plaster-wall` | Amal Kumar | wall, plaster-concrete, outdoor | 2000 mm | 2,15 MB / 0,41 MB | 0,993 · 0,999 · 0,993 |
| `patterned_clay_plaster` | `surface-patterned-clay-plaster` | Amal Kumar | wall, outdoor, plaster-concrete | 2000 mm | 1,99 MB / 0,46 MB | 1,000 · 0,997 · 0,990 |
| `brushed_concrete_03` | `surface-brushed-concrete-03` | Amal Kumar | outdoor, concrete | 2000 mm | 2,96 MB / 0,67 MB | 0,985 · 0,982 · 0,980 |
| `wood_planks_grey` | `surface-wood-planks-grey` | Rob Tuytel | wall, wood, outdoor | 1500 mm | 2,17 MB / 0,51 MB | 0,976 · 0,983 · 0,984 |

Los tres materiales de V1 (`white_stucco`, `white_rough_plaster`, `rough_plaster_03`) **no cambian**: sus derivados y su manifiesto son byte a byte los de master (comprobado en F3-01).

**Descartados, y por qué:**
- **Piedra.** Todas las piedras del catálogo (pizarra, granito, «stone floor», monasterio, mosaicos) están categorizadas por su fuente como suelo o pavimento. Promoverlas a fachada sería una equivalencia por parecido. Si un profesional asigna una, el muro conserva su acabado con el motivo «Sin material de fachada fiel».
- **Ladrillo.** No existe en el catálogo de RUBIK.
- **Cerámicas y parqués.** Son de interior o suelo.
- **Resto de revocos del catálogo** (`grey_plaster_02/03`, `yellow_plaster`, `blue_plaster_wall`, `plastered_wall_04`). Son candidatos válidos para una ampliación posterior por el mismo método, pero no se descargaron: la consigna era descargar sólo lo necesario para la vivienda de prueba.
- **Desplazamiento.** No se usa: alteraría la geometría.

**Límite de las fuentes:** son 2K, no 4K. Para HERO 1024 suponen 2× de reducción por área de las normales float, que es el núcleo del método. Se eligió así para descargar sólo lo necesario: unos 13 MB por material en lugar de unos 50.
