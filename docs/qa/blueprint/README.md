# §11 · Blueprint · del plano real de RUBIK a una película de la vivienda — análisis y storyboard

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
`scripts/interop/blueprint-timeline.py` (Python puro, sin bpy) lee el `manifest.json` del ZIP de «Escena para Blender» y escribe
`blueprint-timeline.json`: salida 1280×720, 24 fps, 576 fotogramas (24 s), **sin audio**; los 7 planos con rango de fotogramas,
cámara, grupos que aparecen por `rubik_role` (solo los que existen en el ZIP) y rótulos **con su fuente** (sin fuente no hay cifra;
la superficie solo entra con `--area` y `--area-source`). Las omisiones se registran (p. ej. `ceiling`: techo oculto para ver el
interior; roles ausentes; roles sin regla). Entrada identificada por proyecto, huella observada, huella de `scene.glb` y huella
del ZIP (`--zip`). Comprobado con un ZIP real del rodaje (`pkg3`: 2 estancias · 27 muros · 18 huecos · 43 objetos; omisión del techo).
```bash
python3 scripts/interop/blueprint-timeline.py manifest.json blueprint-timeline.json --zip escena.zip --area "87,18 m²" --area-source "Ficha de superficies"
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
  [`evidencia/blueprint-timeline-pkg3.json`](evidencia/blueprint-timeline-pkg3.json) (ZIP `ab127002abd1…`).
- **Comando reproducible (siguiente ventana, con la CPU libre):**
  1. Cronología: `python3 scripts/interop/blueprint-timeline.py <zip>/manifest.json blueprint-timeline.json --zip escena.zip --glb <zip>/scene.glb --project <zip>/project.json`
  2. Render 720p de 576 fotogramas: **pendiente de implementar** la lectura de `blueprint-timeline.json` en `blender-rodaje.py`
     (planos, cámaras y aparición por `rubikIds` dentro de `RUBIK_derived`). Hasta entonces no existe un comando de render de la
     película; no se presenta uno que no funcione.
