# Handoff · Tres efectos de película (Pieza a pieza · Maqueta abierta · Desde el paisaje) · fuera de #324

**Encargo:** [`075f8e53` · PELICULA-PROPUESTA-HOME-ENTREGAR.md](https://github.com/Juanmaes83/floorplan-3d/blob/075f8e538f9d2aa7486be29dbf6d6fb76e3e3f32/docs/qa/auditoria-324-villa-linde/PELICULA-PROPUESTA-HOME-ENTREGAR.md)
**Rama:** `claude/pelicula-efectos` · **base de partida:** `master` `dacb5d395abf32449102d73ffd03200e6c09c019` (comprobada el 27/11, 21:58).
**Incorporación:** después de la regresión final de #324 y del render nocturno v1.1 del piloto (una tanda pesada cada vez).

## Contraste con el código (27/11)
| Pieza | En `master` (`dacb5d39`) | En ramas pendientes |
|---|---|---|
| ZIP «Escena para Blender» (`scene.glb` + `manifest.json`, roles `room/wall/opening/object/ceiling/fixture/roof/exterior/stair`) | **Sí** (Entregar → Documentación; `js/scene-delivery-core.js`, `scene-capture-core.js`) | — |
| Importación/render Blender (`blender-scene-import.py`, `blender-scene-render.py`, `blender-kit/`) | **Sí** | — |
| Kit de rodaje (`blender-rodaje.py`, recetas, tapicería, contacto) y `pelicula-timeline.py` | **No** | `claude/rodaje-cierre-1440` (v1.1 en `230c7316`) |
| Home «Descubre RUBIK en acción» y muestras | **Sí** (`js/home-en-accion.js`; «Dibujo vivo» vía `js/home-demos.js`) | — |
| Entregar · bloque de vídeo («Vídeo del recorrido», Vídeo Blueprint 3D P8, Vídeo Despiece 3D P9) | **Sí** (`js/perla-entregar-ui.js`); «Dibujo vivo» es una opción de P1 | — |
| Terreno/entorno en el ZIP | **No** (`scene-capture` exporta volúmenes exteriores, cubierta y escalera; no terreno ni agua) | — |

## Dependencias
1. Kit de rodaje y cronología: se reutilizan desde `claude/rodaje-cierre-1440` (se traerá solo lo necesario, con su revisión).
2. Corrección del piloto v1.1 (luz, entrada, ritmo, acabado): es la base de **Maqueta abierta**.
3. **Desde el paisaje** necesita un proyecto con entorno representado y un acceso real; hoy el ZIP no exporta terreno.
   Se usará el que exista (volúmenes exteriores, terraza, cubierta); lo que falte se explica en la interfaz y en el informe.
4. Donante MIT `2d3463e4` (`houses/{courtyard,apartment,villa}/film.py`): solo ideas de puesta en escena y cámara;
   sin modelos, materiales, planos, escenarios ni música.

## Evidencia comprometida (por efecto, por separado)
- MP4 continuo **> 20,0 s** medido sobre el archivo publicado + informe JSON (duración, resolución, fps, SHA-256, commit,
  proyecto/huella, plantas, ZIP, perfil, marcas de inicio/transformación/llegada, omisiones y aproximaciones).
- Hoja de contactos con las marcas de tiempo de los cuatro controles del piloto (luz, orientación, ritmo, rótulos/vidrio).
- Grabaciones de producto en escritorio y móvil: Home (tres ejemplos) y Entregar → Vídeo (vista previa, estimación,
  confirmación, MP4 + informe, cancelación, fallo de preparación).
- Casos: una planta, dos plantas, cambio de revisión, requisito ausente; regresión P1, Dibujo vivo, P4, P8, P9, ZIP Blender; ES/EN sin chino.

## Estado
- 27/11 21:58 · rama creada y plan registrado. Sin código todavía.
