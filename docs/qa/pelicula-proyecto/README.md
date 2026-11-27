# §11 · Película del proyecto · formato «Del plano a la vivienda»

> **Nombre (decisión del propietario, 27/11):** el módulo audiovisual se llama **«Película del proyecto»**; su primer formato,
> **«Del plano a la vivienda»**. «Blueprint» es solo la referencia al repositorio donante. No confundir con **P8 «Blueprint 3D»**
> de Entregar (visor técnico de planta, cotas, alzados y secciones), que conserva su nombre, ficha y visor. Son módulos distintos
> con entradas y salidas propias; ambos pueden leer la misma revisión de RUBIK. Entrada de este módulo: el ZIP de Entregar
> («Escena para Blender») + el kit Blender existente; salida: un vídeo (primero 720p sin sonido para aprobación; después 1440p).

**Rama:** `claude/rodaje-cierre-1440` (kit de rodaje). Estado: **análisis y propuesta**; sin código ni render todavía (el
render de Blender queda para después, por decisión del propietario).

## Donante fijado
`Juanmaes83/blueprint-A-pen-sketch-a-floor-plan-or-3-references-` en `2d3463e4` · **Licencia MIT** (© 2026 Nyxera0x).
Texturas, música (`sfx/`, `music_plan.json`) y modelos se revisan aparte antes de usar nada: **no se reutilizan**.
| Pieza | Ruta | Qué aporta | Uso en RUBIK |
|---|---|---|---|
| Apartment | `houses/apartment/film.py` (435 l.) | encuadre inicial sobre el plano, piezas que «vuelan» a su sitio, inmersión en el salón y paseo a la altura de los ojos; escribe `timeline.json` | **adaptar** curvas de cámara y la transición plano → volumen → interior |
| Courtyard | `houses/courtyard/film.py` (794 l.) + `timeline.json` | cronología **por sistemas** con tiempos (`hold, descent, orbit_end, wave, lights, dive, inside`) y filas de aparición con color y rótulo | **adaptar** la estructura de la cronología; los grupos salen del ZIP real |
| Villa | `houses/villa/film.py` (429 l.) | transición exterior → interior y cambio de escala | **estudiar**; la trayectoria se diseña con los huecos reales del proyecto |
| Build | `houses/*/build.py`, `kit/bkit.py` | cómo se preparan los grupos del donante | **solo lectura**; sus generadores de viviendas, planos y modelos de demo quedan fuera |

## Enlace con el ZIP y el report de RUBIK
1. **Entrada:** el ZIP de «Escena para Blender» exportado desde la interfaz (`scene.glb` + `manifest.json` con formato
   `rubik-sota.scene-delivery`), importado con `scripts/interop/blender-scene-import.py` (cada malla conserva `rubik_id`,
   `rubik_role` y `rubik_level`). Misma escala, orientación, plantas, huecos, posiciones y Material Tokens.
2. **Grupos de aparición = lo que existe en el ZIP**, por `rubik_role`: suelos → muros → huecos y carpinterías → mobiliario.
   Lo ausente (cubierta, estructura, otras plantas) se omite y se registra. Un material aproximado conserva estado y procedencia.
3. **Derivado de rodaje:** cámara, tiempos, luz editorial y rótulos en `blender-rodaje.py`, dentro de la separación
   `RUBIK_derived` existente; nada se escribe en la escena de entrada.
4. **Report:** anexo a `rodaje-report.json` con proyecto y revisión, SHA del kit, huella del ZIP, fuente de la planta, grupos con
   sus `rubik_id`, fase y rango de fotogramas, cámara, rótulos y su fuente, omisiones y aproximaciones. Comprobación final:
   huella de geometría y posiciones de cierre = escena de entrada.

## Storyboard · Vivienda de ejemplo (3 dormitorios, 2 salas, 2 baños · 87,18 m² útiles, planta única)
| # | Tiempo | Plano | Contenido (todo del proyecto) | Rótulo (fuente) |
|---|---|---|---|---|
| 1 | 0,0–2,0 s | cenital fijo | planta 2D de RUBIK alineada con la escena (generada de la geometría exportada) | nombre del proyecto · 87,18 m² (Ficha de superficies) |
| 2 | 2,0–5,0 s | descenso suave en diagonal | aparecen los **suelos** por estancia sobre su contorno | estancias y m² (geometría) |
| 3 | 5,0–9,0 s | órbita lenta | suben los **muros** (exteriores, luego interiores) a su altura real | «N muros» (conteo del ZIP) |
| 4 | 9,0–12,0 s | órbita | **huecos y carpinterías** en su posición | «N puertas · N ventanas» (ZIP) |
| 5 | 12,0–16,0 s | acercamiento al salón | **mobiliario** del proyecto; genéricos rotulados como tales | — |
| 6 | 16,0–20,0 s | inmersión a altura de ojos por la puerta del salón | luz de día editorial | — |
| 7 | 20,0–24,0 s | giro lento en el salón | vista interior reconocible (sofá aprobado, tapicería v3) | logo de Mi estudio (si el profesional lo elige) |
Primer corte revisable: fotogramas de los planos 1, 3 y 7 + clip a **720p** + report + comandos; después, 1440p.

## Decisiones del propietario
- Confirmar el storyboard y si los rótulos llevan cifras (requieren su fuente en el report) o solo nombres.
- Sonido: el donante sincroniza con `timeline.json`; ¿se incluye sonido? (requiere revisar licencias de `sfx/` o usar uno propio).

## Preparado para el clip 720p (27/11) · cronología y report
`scripts/interop/pelicula-timeline.py` (Python puro, sin bpy) lee el `manifest.json` del ZIP de «Escena para Blender» y escribe
`pelicula-timeline.json`: salida 1280×720, 24 fps, 576 fotogramas (24 s), **sin audio**; los 7 planos con rango de fotogramas,
cámara, grupos que aparecen por `rubik_role` (solo los que existen en el ZIP) y rótulos **con su fuente** (sin fuente no hay cifra;
la superficie solo entra con `--area` y `--area-source`). Las omisiones se registran (p. ej. `ceiling`: techo oculto para ver el
interior; roles ausentes; roles sin regla). Entrada identificada por proyecto, huella observada, huella de `scene.glb` y huella
del ZIP (`--zip`). Comprobado con un ZIP real del rodaje (`pkg3`: 2 estancias · 27 muros · 18 huecos · 43 objetos; omisión del techo).
```bash
python3 scripts/interop/pelicula-timeline.py manifest.json pelicula-timeline.json --zip escena.zip --area "87,18 m²" --area-source "Ficha de superficies"
```
Siguiente paso (necesita CPU libre, tras la regresión y sin render en paralelo): que `blender-rodaje.py` lea esta cronología en
`RUBIK_derived` y renderice el clip 720p del proyecto de ejemplo. Sonido: ninguno (decisión pendiente del propietario).

### Comprobación contra el ZIP real (27/11, noche) — corrección de rótulos
- **Hallazgo:** `manifest.scene.stats.roles` cuenta **mallas**, no entidades (pkg3: 27 mallas de muro para 7 muros). Un rótulo
  «27 muros» habría sido falso. Corregido: los rótulos cuentan **`rubik_id` distintos del `scene.glb`** (`--glb`), con esa fuente
  escrita en cada rótulo; sin GLB no hay cifra.
- **Correspondencia objeto ↔ `rubik_id`:** cada grupo de aparición lista sus `rubikIds`; `reconcile` (con `--project`) concilia
  proyecto ↔ escena por rol. pkg3: estancias 2/2; muros 8 en el proyecto, 7 en la escena (`wal_removed`, retirado);
  huecos 4/3 (`opn_east-void`, vacío sin malla); ninguno en la escena que no esté en el proyecto. Evidencia:
  [`evidencia/pelicula-timeline-pkg3.json`](evidencia/pelicula-timeline-pkg3.json) (ZIP `ab127002abd1…`).
- **Comando reproducible (siguiente ventana, con la CPU libre):**
  1. Cronología: `python3 scripts/interop/pelicula-timeline.py <zip>/manifest.json pelicula-timeline.json --zip escena.zip --glb <zip>/scene.glb --project <zip>/project.json`
  2. Render 720p de 576 fotogramas: **pendiente de implementar** la lectura de `pelicula-timeline.json` en `blender-rodaje.py`
     (planos, cámaras y aparición por `rubikIds` dentro de `RUBIK_derived`). Hasta entonces no existe un comando de render de la
     película; no se presenta uno que no funcione.

## Revisión visual (27/11) · fotogramas de control y clip 720p
**Entrada:** ZIP real de Entregar → «Escena para Blender» de la **vivienda de ejemplo** (`prj_op10-f5-furniture`, 13
estancias · 70 muros · 20 de 22 huecos con malla · 47 muebles), con el kit Blender existente (`blender-rodaje.py
--shot pelicula`). Cronología de 30 s: [`evidencia/pelicula-timeline-f5-vivienda.json`](evidencia/pelicula-timeline-f5-vivienda.json).

| # | Fotograma | Qué acredita | Imagen |
|---|---|---|---|
| 1 | f0060 (2,5 s) | planta **legible y alineada** con el plano de RUBIK (norte del dibujo arriba): suelos del ZIP, huella de los muros y rótulos con el nombre visible de cada estancia (las de menos de 2,5 m², los miradores, no se rotulan) | [`control-720/1-planta-legible-f0060.png`](control-720/1-planta-legible-f0060.png) |
| 2 | f0330 (13,75 s) | **volumen** con los muros crecidos desde su huella y los huecos en su sitio (los muebles aparecen después) | [`control-720/2-volumen-f0330.png`](control-720/2-volumen-f0330.png) |
| 3 | f0700 (29,2 s) | **interior reconocible**: el salón (rotulado en la planta), con sus muebles y los acabados del ZIP; techo y luminarias presentes | [`control-720/3-interior-salon-f0700.png`](control-720/3-interior-salon-f0700.png) |

- **Report:** [`control-720/report-f0060.json`](control-720/report-f0060.json) y
  [`control-720/report-f0330-f0700.json`](control-720/report-f0330-f0700.json). Incluyen cronología, planos, omisiones,
  conciliación, materiales y la comprobación final «posiciones y dimensiones finales = escena de entrada» (0 cambios).
  f0330 y f0700 se renderizaron antes de los dos últimos ajustes de rótulos (miradores y dos líneas), que solo afectan a la
  planta.
- **Coste medido (CPU de 4 núcleos, Cycles 8 muestras + OIDN, 1280×720):** ≈ 10–13 s por fotograma en la planta, ≈ 22–27 s en
  el volumen y ≈ 63–75 s en el interior.
- **Clip 720p sin sonido (720 fotogramas, 24 fps):** render en cola en este contenedor, detrás de las regresiones; se estiman
  4–6 h. Comando:
  `python blender-rodaje.py -- <escena-preparada> <kit> <salida> --shot pelicula --timeline pelicula-timeline.json --res 1280x720 --samples 8`,
  y después
  `ffmpeg -framerate 24 -i frames/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 20 -an pelicula-del-plano-a-la-vivienda-720p.mp4`.
  El MP4 se publicará con su SHA y su report.
- El MP4 pendiente de 2 s a 1440p sigue separado y en pausa; la versión 1440p de la película espera la aprobación del clip.

### Estado del render (27/11, noche)
- **Sin empezar todavía:** el clip 720p está en cola detrás de dos tandas de prueba de la integración (#324), para no
  repartir la CPU. El script espera a que terminen y después renderiza los 720 fotogramas (`--samples 8`, 1280×720) y
  monta el MP4 sin sonido.
- La aprobación visual llegará con el **MP4 continuo de 720p**, publicado con enlace directo, SHA del kit y report.

### Reproducir el clip desde cero (si se pierde el scratchpad)
**Entrada versionada:**
- `entrada/rubik-escena-blender-prj_op10-f5-furniture.zip`: ZIP real de «Escena para Blender» de la vivienda de ejemplo,
  sha256 `04e9fe78d7e2…`.
- `entrada/pel-f5-timeline.json`: la cronología de 30 s.

```bash
W=<carpeta de trabajo>; python3.13 -m venv $W/bpy52 && $W/bpy52/bin/pip install bpy==5.2.1
mkdir -p $W/kit && cd $W/kit && unzip -q <repo>/docs/qa/pelicula-proyecto/entrada/rubik-escena-blender-prj_op10-f5-furniture.zip
$W/bpy52/bin/python rubik_blender_prepare.py -- . escena-preparada
$W/bpy52/bin/python <repo>/scripts/interop/blender-rodaje.py -- escena-preparada . $W/pel-clip --shot pelicula --timeline <repo>/docs/qa/pelicula-proyecto/entrada/pel-f5-timeline.json --res 1280x720 --samples 8 --tex rodaje-texturas --fetch
ffmpeg -framerate 24 -i $W/pel-clip/frames/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 20 -an $W/pel-clip/pelicula-del-plano-a-la-vivienda-720p.mp4
```

- El render es **reanudable**: al relanzar la misma orden se salta los fotogramas ya hechos.
- `--fetch` descarga las texturas declaradas (`rubik_rodaje_recursos.json`).
- Ojo: el kit que viene en el ZIP lleva su propio `rubik_blender_rodaje.py`; el modo película está en
  `scripts/interop/blender-rodaje.py` de esta rama.

**Estado al compactar (27/11, 12:06):** el contenedor se reinició y el render **no llegó a empezar** (0 fotogramas).
