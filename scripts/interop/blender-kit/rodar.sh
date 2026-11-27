#!/bin/sh
# RUBIK SOTA · Rodaje local con Blender Cycles (macOS / Linux) · §4
# Uso, desde esta carpeta:  sh rodar.sh [revision|entrega1440|entrega4k] [interior|aereo|detalle|balcon] [dia|tarde] [fotogramas, p. ej. 0-11]
#   Película elegida en RUBIK › Entregar › Vídeo («Tu proyecto cobra vida»):  sh rodar.sh pelicula
#   (lee rubik-pelicula-guion.json: efecto, guion y perfil; deja resultados/pelicula/pelicula.mp4 y rodaje-report.json)
#   revision = 1280×720 rápido · entrega1440 = 2560×1440 nativo (recomendado) · entrega4k = 3840×2160 nativo (opcional)
# 1) prepara la escena (si falta), 2) descarga y verifica los recursos CC0 (una vez), 3) renderiza los fotogramas
# (reanudable), 4) monta el MP4 con FFmpeg si está instalado. Nunca borra nada. Tu proyecto de RUBIK no cambia.
set -u
cd "$(dirname "$0")" || exit 1
PERFIL="${1:-revision}"; TOMA="${2:-interior}"; LUZ="${3:-dia}"; FR="${4:-}"
PELI=""; if [ "$PERFIL" = "pelicula" ]; then
  [ -f rubik-pelicula-guion.json ] || { echo "Falta rubik-pelicula-guion.json: prepara la película desde RUBIK › Entregar › Vídeo"; exit 2; }
  PELI="--con-guion"; PERFIL="$(sed -n 's/.*"profile": *"\([a-z0-9]*\)".*/\1/p' rubik-pelicula-guion.json | head -1)"; PERFIL="${PERFIL:-revision}"; TOMA="pelicula"
fi
case "$PERFIL" in revision|entrega1440|entrega4k) ;; *) echo "Perfil desconocido / unknown profile: $PERFIL"; exit 2;; esac
BL="${BLENDER:-}"
if [ -z "$BL" ]; then
  for c in blender /Applications/Blender.app/Contents/MacOS/Blender "$HOME/Applications/Blender.app/Contents/MacOS/Blender" /snap/bin/blender /usr/local/bin/blender /usr/bin/blender; do
    if command -v "$c" >/dev/null 2>&1; then BL="$(command -v "$c")"; break; fi
    if [ -x "$c" ]; then BL="$c"; break; fi
  done
fi
[ -z "$BL" ] && { echo "No se encuentra Blender / Blender not found: BLENDER=/ruta/a/blender sh rodar.sh"; exit 2; }
ejecutar() { s="$1"; shift; "$BL" --background --factory-startup --python-exit-code 1 --python "$s" -- "$@"; }
if [ ! -f escena-preparada/scene.blend ]; then
  echo "1/4 · Preparando la escena…"; ejecutar rubik_blender_prepare.py . escena-preparada || { echo "✗ La preparación falló"; exit 1; }
fi
SALIDA="resultados/rodaje-$PERFIL-$TOMA-$LUZ"; [ -n "$PELI" ] && SALIDA="resultados/pelicula"; mkdir -p resultados
echo "2–3/4 · Recursos y rodaje ($PERFIL, $TOMA, $LUZ)…"
ejecutar rubik_blender_rodaje.py escena-preparada . "$SALIDA" --profile "$PERFIL" --shot "$TOMA" --light "$LUZ" --tex rodaje-texturas --fetch $PELI ${FR:+--frames "$FR"} \
  || { echo "✗ El rodaje se detuvo. Vuelve a lanzarlo: continúa por el primer fotograma que falte."; exit 1; }
if command -v ffmpeg >/dev/null 2>&1; then
  echo "4/4 · Montando el MP4…"
  ffmpeg -y -loglevel error -framerate 24 -i "$SALIDA/frames/f%04d.png" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart "$SALIDA/$( [ -n "$PELI" ] && echo pelicula || echo rodaje ).mp4" && echo "✓ MP4 en $SALIDA"
else
  echo "4/4 · FFmpeg no está instalado: los fotogramas están en $SALIDA/frames (móntalos con cualquier editor a 24 fps)."
fi
echo "Informe: $SALIDA/rodaje-report.json (equipo, tiempos, acabados y aproximaciones). Ábrelo en RUBIK › Entregar."
