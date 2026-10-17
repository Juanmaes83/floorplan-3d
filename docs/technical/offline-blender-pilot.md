# Piloto offline Floorplan → Blender → vídeo de revisión

Fecha: 16-10-2026. Estado: **piloto acotado, verificado localmente sólo en lo que se indica; pendiente de revisión humana**. No es F4, no aprueba Roadmap 2, no sustituye la presentación 3D interactiva (PR #39) ni es un servicio de render. No añade ningún botón ni cambia `FloorPlanProjectV1`, JSON/ZIP o la interfaz.

## Base y aislamiento

- Rama `claude/bold-allen-ug56ci`, creada en `master` `3fdbc0f` (sin commits propios antes del piloto). El exportador de PR #24 (`scripts/interop/export.cjs`, paquete `rubik-blender-package` 1.0.0) y su verificador ya están en `master` y bastan; el piloto no depende del código de #38/#39 ni lo copia.
- Astra LAB sólo se leyó como referencia humana (LAB #5, squash `b5cc40a`, Candidate 04): altura de cámara 1,35 m, lente de 22 mm, mirada final de 13,6°, rampas de velocidad de 0,7 s con tramo central constante, toma de 8 s. Aquí la altura y las rampas se toman como punto de partida; la posición, la lente (16–24 mm) y la mirada (5–18°) se derivan de cada estancia. No se copian coordenadas ni escenas, y LAB no se modificó.
- Runtime: `bpy` 5.2.1 LTS de PyPI (la versión de Blender que verificó PR #24) en un entorno virtual; Cycles por CPU. En este contenedor no hay binario de Blender instalable (proxy).

## Criterios de aceptación, escritos antes del código

A. Origen y fidelidad
1. Entrada: un JSON `FloorPlanProjectV1`. El paquete conserva ID, revisión, unidades, ejes y `roomId`/`wallId`/`objectId`, verificados en Blender por `rubik_id`/`rubik_role`.
2. Dos casos: el ejemplo (13 estancias, 46 objetos, puertas, ventanas, baños pequeños) y una variante **sintética** girada 30° (ningún muro alineado con los ejes; conserva el comedor y el pasillo cóncavos). No es un plano real evaluado.
3. Superficies, límites y orientación se comparan con el plano 2D (áreas, bounds y yaw por ID). Los recursos no soportados usan el fallback declarado del exportador. No se inventan muebles ni medidas.

B. Escena Blender
4. Se reutiliza `export.cjs` sin cambiar el contrato canónico. Lo que el vídeo necesite y el paquete no contenga va en un sidecar opcional con hash y lista de IDs.
5. La escena se guarda y se reabre en un proceso nuevo; IDs, conteos, hashes de entrada y claves de cámara se comparan.
6. Se registran materiales, recursos, tamaño, tiempo y memoria. El proyecto original queda intacto (hash antes/después).
7. El Baño en suite tiene una toma propia reconocible y el dormitorio contiguo no domina la toma etiquetada como baño (presencia medida por ID de entidad sobre la escena renderizada).

C. Cámara y vídeo
8. Tomas derivadas de la geometría: cámara a altura humana, mirada ligeramente hacia abajo, movimiento corto con arranque y frenado deliberados y anclas inicial/central/final. Corte seco entre estancias; nunca se atraviesa un muro.
9. Colisión y legibilidad comprobadas sobre la trayectoria interpolada completa, no sólo en los extremos.
10. Vídeo de revisión a 30 fps con resolución y muestras económicas y anclas PNG comparables. Coste medido antes de cualquier render mayor. Carpetas nuevas, nunca sobrescritas. Cancelable.
11. El vídeo se revisa a 1× con hojas de contacto densas. Las métricas no sustituyen la revisión humana.

D. Entrega
12. Fuente, manifiestos, escena, vídeo, anclas y comandos reproducibles, separados de la presentación interactiva.
13. `FloorPlanProjectV1`, JSON/ZIP e interfaz sin cambios.

## Diseño

| Paso | Archivo | Qué hace |
| --- | --- | --- |
| Paquete canónico | `scripts/interop/export.cjs` (PR #24, sin cambios) | GLB + `semantic.json` + `source-project.json`, hashes en `package.json`. |
| Verificación e importación | `scripts/interop/blender-verify.py` (PR #24) | Importa en Blender, compara cada entidad con el plano 2D y guarda `verified.blend`. **Corrección del piloto:** sólo exige los materiales que algún suelo o muro usa; ver hallazgos. |
| Sidecar visual opcional | `scripts/offline-pilot/capture-visual.cjs` | Exporta con `GLTFExporter` los muebles procedurales del navegador de esta revisión, un nodo raíz por `objectId`, en el mismo marco métrico. Manifiesto con hash del GLB, del proyecto, de `index.html` y SHA de la app. Representación visual declarada, no geometría canónica. |
| Tomas | `scripts/offline-pilot/shots.cjs` | Compositor propio del piloto (ver abajo). Salida `shots.json` con muestras por fotograma en plano (mm) y en Blender (m). |
| Render | `scripts/offline-pilot/render.py` | Abre `verified.blend`, comprueba hashes de paquete y tomas, añade cielo, sol y cámara (declarados), mide presencia por ID con `scene.ray_cast` en las anclas, guarda `pilot.blend` y renderiza con Cycles. |
| Reapertura | `scripts/offline-pilot/reopen.py` | Proceso nuevo: hash de `pilot.blend`, IDs, conteos por rol, hashes de entrada, unidades, rango, cámara clave a clave e interpolación constante. |
| Orquestación | `scripts/offline-pilot/run.cjs` | Encadena los pasos en una carpeta nueva, registra comandos, tiempos y hash del proyecto antes/después; Ctrl+C cancela el paso en curso. |

**Compositor de tomas.** Para cada estancia (≥ 1,5 m²) se generan posiciones de pie: dentro de la estancia a ≥ 280 mm del contorno y ≥ 150 mm de los muebles; en la estancia vecina hasta 1,6 m de cada puerta; y en el umbral de cada puerta (el paquete modela las puertas como hueco, sin hoja), a ≥ 200 mm de las jambas. Desde cada posición, un modelo 2,5D (muros con antepechos y dinteles, muebles como cajas con su altura, suelo por estancia, sin techo como el paquete) lanza una rejilla de rayos y mide la presencia de cada estancia, el suelo visible de la objetivo, los muebles vistos y la fracción de superficies cercanas (< 35 % de la diagonal de la estancia, entre 0,6 y 1,2 m). La puntuación premia presencia, contenido y suelo y penaliza vecinas por encima del 15 %, superficies cercanas por encima del 10 % y vacío. Búsqueda en dos fases (gruesa a 20 columnas, fina a 32 columnas con lentes de 24/20/18/16 mm).

El movimiento termina siempre en la composición elegida: travelling lateral, acercamiento o retroceso de 0,22–0,70 m, o, si ninguno cabe, paneo lento de 3–8° que también aterriza en ella. Cada candidato se comprueba en 4 submuestras por fotograma sobre la curva completa: sólo puede pisar el espacio libre de la estancia, el umbral o la vecina, y por tanto cruza puertas, nunca muros. Además, el inicio, el centro y el final deben conservar el 85 % de la presencia y no superar el límite de superficies cercanas. Altura 1,35 m; mirada hacia el centro de la estancia a 0,9 m de altura, limitada a 5–18°. Perfil de velocidad: rampas de coseno alzado de 0,7 s y tramo central constante en tomas de 3,6 s (108 fotogramas). Corte seco entre estancias.

## Resultados

Todo se ejecutó en este contenedor (4 vCPU, sin GPU) con `bpy` 5.2.1 LTS. La evidencia está en `docs/qa/artifacts/offline-pilot/`. Los `.blend` y el GLB de muebles (15,6 MB) no se suben; se identifican por hash en los informes.

**Cadena completa (ejemplo, seis estancias con muebles):** `run.cjs` → export 0,1 s → verificación PR #24 **PASS** (151 entidades) → sidecar visual 143 s (46/46 objetos sustituidos por ID, origen ≤ 2 cm de su caja) → tomas 10,5 s → render 4904 s → reapertura en proceso nuevo **PASS** (13 comprobaciones) → MP4 y hojas de contacto. Hash del proyecto igual antes y después. `review-30fps.mp4`: 648 fotogramas, 21,6 s a 30 fps, 640×360, Cycles CPU con 16 muestras y OIDN.

**Coste medido:** 7,4 s por fotograma de media (5,4–10,6 s), pico de 0,9–1,1 GB de RSS y 82 min de render para 21,6 s de vídeo. Un render mayor (1080p, 128 muestras) no está justificado sin decisión de Juanma: con esta CPU serían varias horas por toma.

**Presencia por ID sobre la escena renderizada** (rayos de `scene.ray_cast` desde la cámara real, 96×54, en las anclas inicial/central/final):

| Toma | Estancia objetivo | Vecina mayor | Muebles de la estancia vistos |
| --- | --- | --- | --- |
| Salón | 99–100 % | — | 4/7 |
| Cocina | 100 % | — | 4/4 |
| Comedor | 84–87 % | Cocina 13–16 % | 6/7 |
| Dormitorio principal | 93–94 % | Baño en suite / Pasillo ≤ 2,5 % | 3/4 |
| **Baño en suite** | **100 %** | — (el dormitorio no aparece) | 2/3 al inicio, **3/3** en el centro y el final |
| Baño de invitados | 100 % | — | 2/3 → 3/3 |

**Segundo caso, sintético girado 30°** (anclas de 10 estancias, sin vídeo completo): verificación y reapertura PASS; 46/46 muebles; Baño en suite 100 % con 3/3 aparatos en las tres anclas; mismas tomas legibles que en el ejemplo. Coste de 8,1 s por fotograma.

**Pruebas:** `tests/offline-pilot.test.cjs`, **7/7** con `BPY_PYTHON` (holgura de muros ≥ 200 mm sobre la curva densa e independiente de `Core.geometry`; altura, mirada de 5–18°, rampas, giro ≤ 12°/s, cortes, determinismo, marco Blender, baño en suite, caso girado y cadena completa en Blender con rechazo de sobrescritura). `tests/interop.test.cjs` 17/17 más 1 omitida (necesita binario de Blender). El fixture de PR #24 sigue pasando el verificador corregido (17 entidades).

### Iteraciones y hallazgos

1. **Cajas dimensionales dentro del baño:** la primera toma daba «100 % baño» en la métrica y era ilegible, a 0,3 m de una ducha exportada como caja opaca de 2,1 m (`probes/01-…`). Se añadieron legibilidad (superficies cercanas, suelo visible), puntos de vista desde el umbral y la estancia vecina, y el sidecar de muebles.
2. **Muros contados como estancia:** con muebles reales, el baño en suite seguía mostrando sobre todo muro (`probes/02-…`). La puntuación premia ahora los muebles de la estancia, y las estancias sin muebles (el pasillo) no reciben toma, de forma declarada.
3. **Verticales convergentes:** mirar 18° hacia abajo con 24 mm inclinaba los muros. La cámara se mantiene nivelada y la mirada se baja con desplazamiento de lente (`shift_y`), práctica habitual en fotografía de interiores. En estancias de menos de 6 m² se permiten 16–18 mm (`probes/03-…`).
4. **Corrección de PR #24:** el importador glTF de Blender no crea materiales sin uso y el verificador exigía todos los del proyecto. El ejemplo tiene dos (`mat_terrazzo`, `mat_carpet`) y fallaba. Ahora exige los que usan suelos y muros y lista los demás en `unusedProjectMaterials`.
5. **Reinicio del contenedor** durante un render (520/648 fotogramas): se descartó y se repitió en una carpeta nueva, sin mezclar ejecuciones ni sobrescribir.

### Límites declarados

- **No es calidad Candidate 04.** La iluminación es un cielo y un sol, sin techo (el paquete no lo infiere) y sin luces de estancia; los materiales usan el color declarado (8 superficies procedurales sin hornear); 640×360 con 16 muestras.
- **Baño en suite:** a lo largo de **toda** la toma predominan el muro y la mampara; el inodoro se ve desde el inicio y el lavabo sólo desde ~60 %. Es reconocible como baño pero no es una buena presentación. Baño de invitados: dominan mampara y muro, el lavabo y el inodoro entran en el último tercio. Comedor: una franja de muro cercano ocupa ~1/3 derecho de la imagen durante toda la toma. Pasillo sin toma (sin muebles).
- **Artefacto visual:** los lavabos y los platos del comedor muestran elipses negras (material o normales del mueble exportado desde el navegador). Pendiente de diagnóstico.
- El sidecar visual es una representación del navegador en esta revisión (`appRevision`, hash de `index.html`), no geometría canónica.
- Sin Pillow en este entorno, las texturas CC0 del exportador usan su fallback declarado. El ejemplo no tiene ninguna, así que no le afecta.
- **Revisión del MP4 publicado** (`review-30fps.mp4`, sha256 `2e385788…`, idéntico al render): h264 640×360, 30/1 fps, 648 fotogramas decodificados, 21,6 s. Detección de cambio de escena fotograma a fotograma: exactamente 5 cortes, en 108/216/324/432/540 (límites de toma); cambio máximo dentro de una toma 0,0027 (mediana 0,0003), sin saltos, parpadeos ni fotogramas perdidos. Inspeccioné los **648 fotogramas** (todas las muestras a 30 fps, en hojas por toma). No puedo reproducir vídeo en tiempo real: la percepción del movimiento a 1× queda para Juanma.

### Reproducir

```
node scripts/offline-pilot/run.cjs PROJECT.json NEW-OUT --python PY-CON-BPY [--visual] [--rooms a,b] [--frames all|anchors] [--samples 16] [--resolution 640x360]
# --visual requiere CHROME y THREE_DIR (copia local de three@0.160.0)
node scripts/offline-pilot/irregular-fixture.cjs NEW.json 30    # segundo caso sintético
BPY_PYTHON=PY-CON-BPY node --test tests/offline-pilot.test.cjs
```
