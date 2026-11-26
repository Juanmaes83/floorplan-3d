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
