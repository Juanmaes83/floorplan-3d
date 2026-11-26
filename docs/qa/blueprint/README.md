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
