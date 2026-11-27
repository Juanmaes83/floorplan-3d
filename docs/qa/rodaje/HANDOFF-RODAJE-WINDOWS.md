# Handoff · Rodaje con Blender en el equipo del profesional (Windows, macOS, Linux)

**Kit:** el ZIP de *Entregar → Escena para Blender* (`rubik_blender_rodaje.py` = `scripts/interop/blender-rodaje.py` de
`claude/rodaje-cierre-1440`; ver el SHA del último commit). Ningún paso requiere red salvo la primera descarga de texturas CC0.

## Requisitos
- Windows 10/11 de 64 bits (o macOS / Linux), **Blender 5.2.1 LTS** (blender.org) y, opcional, **FFmpeg** en el PATH para
  montar el MP4 (sin FFmpeg quedan los PNG).
- Primera vez: conexión a `dl.polyhaven.org` (texturas CC0 verificadas por SHA-256). Sin red: colores planos, declarados.
- Si Blender no está en el PATH ni en `Program Files\Blender Foundation`, definir la variable `BLENDER` con la ruta de
  `blender.exe`.

## Comandos
| Qué | Windows (doble clic o terminal en la carpeta del ZIP) | macOS / Linux |
|---|---|---|
| Vídeo de entrega (recomendado) | `RODAR-windows.bat` | `sh rodar.sh entrega1440 interior dia` |
| Revisión rápida 720p | `RODAR-windows.bat revision interior dia` | `sh rodar.sh revision interior dia` |
| Solo unos fotogramas | `RODAR-windows.bat entrega1440 interior dia 0-11` | `sh rodar.sh entrega1440 interior dia 0-11` |
| Tomas | `interior`, `aereo`, `detalle`, `balcon`, `primerplano` | ídem |
| Imágenes fijas (render) | `RENDERIZAR-windows.bat` | `sh renderizar.sh` |

Reanudable: si se interrumpe, se relanza igual y continúa por el primer fotograma que falte; nunca borra nada.
Salida: `resultados\rodaje-<perfil>-<toma>-<luz>\` con `frames\`, `rodaje.mp4` y `rodaje-report.json` (equipo, tiempos,
acabados, aproximaciones y piezas pendientes).

## Tiempos medidos en la máquina de referencia (CPU de 4 núcleos, sin GPU)
| Perfil | Por fotograma | 2 s de vídeo (48 fotogramas) |
|---|---|---|
| `revision` 1280×720, 16 muestras | ≈ 1,5 min | ≈ 1 h 15 min |
| `entrega1440` 2560×1440, 32 muestras | ≈ 10–12 min (estimado; el MP4 completo dará la cifra medida) | ≈ 8–9 h |

Con una GPU NVIDIA o AMD compatible, Cycles la usa si está activada en Blender; el tiempo baja de forma muy notable.

## Estado
- Receta de tapicería v3: **aprobada visualmente por el propietario** (26/11/2026).
- MP4 completo de f2 (2 s, 1440p): en render; se publica en `docs/qa/rodaje/tapiceria-v3/`.
- Límites: sin costuras ni vivos en los modelos de mobiliario (ver `tapiceria-v3/README.md`).

## Entrega 27/11/2026 · Película del proyecto · clip 720p «Del plano a la vivienda» (primera entrega de rodaje para revisión)
- **MP4:** `docs/qa/pelicula-proyecto/clip-720/pelicula-del-plano-a-la-vivienda-720p.mp4`.
  - SHA-256 `f4e7538638845dd9ca07a064fb902b0f33fb8ad303b6ec68d37efab068f66d01`.
  - 1280×720, 24 fps, 720 fotogramas, 30 s, h264, sin sonido; decodifica sin errores.
- **Proyecto:** `prj_op10-f5-furniture` (vivienda de ejemplo).
  - Revisión identificada por la huella observada `20c1a79b…f849`: el ZIP no trae número de revisión.
  - ZIP de entrada `04e9fe78…`, kit en `90d38d54`.
- **Informe:** `clip-720/INFORME-CLIP-720.json`, con la secuencia, las huellas y las observaciones.
- **Técnico:** `rodaje-report.json` y `preflight.json`.
- **Revisión de la secuencia completa:** `clip-720/hoja-contactos.png`, un fotograma por segundo.
- **Observaciones:**
  - Los últimos ~5 s son un plano sostenido.
  - Tras la ventana el fondo es azul oscuro: la escena no trae entorno.
  - Sin texto chino.
- **Pendiente:** revisión humana de la secuencia completa (ritmo, movimiento de cámara y rótulos).

## Decisiones aprobadas 27/11/2026 · tres efectos de película (implementación y aceptación visual pendientes; fuera de #324)
Fuente: `aeeef513` · `docs/qa/auditoria-324-villa-linde/PELICULA-PROPUESTA-HOME-ENTREGAR.md` (rama `codex/auditoria-324-villa-linde`).
- **Pieza a pieza** (referencia: Courtyard house): el croquis o la planta queda de referencia mientras las piezas reales
  encajan por grupos reconocibles.
- **Maqueta abierta** (referencia: Apartment): una planta legible gana volumen; vista desde arriba y descenso a una
  estancia. El clip de esta entrega es su material de partida.
- **Desde el paisaje** (referencia: Cliff villa): la vivienda en su entorno representado, con entrada por un hueco real.
  Si falta el entorno, el profesional lo sabe antes de prepararlo.

Los tres parten de una revisión real del proyecto. Si se usa la planta de RUBIK, se rotula como tal. P8 Blueprint 3D sigue
siendo un entregable aparte.

Dónde viven:
- **Home:** módulo propio junto a Dibujo vivo.
- **Entregar → Vídeo:** elegir efecto → revisión y plantas → vista previa ligera de la transición completa → estimación
  («Estimación no disponible» si faltan datos) → confirmar el render. Si cancela, no se inicia el render completo.

Aceptación:
- un clip continuo por efecto con su revisión, SHA e informe;
- grabación del flujo con un proyecto propio;
- la vista previa y la salida, con el mismo guion y la misma revisión.
