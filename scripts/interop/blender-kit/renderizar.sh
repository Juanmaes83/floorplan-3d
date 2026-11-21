#!/bin/sh
# RUBIK SOTA · Render con Blender (macOS / Linux) · M03
# Uso, desde esta carpeta:   sh renderizar.sh [review|preview|delivery]
#   Usage, from this folder: sh renderizar.sh [review|preview|delivery]
# 1) prepara la escena, 2) renderiza con Cycles, 3) verifica que la escena se reabre igual.
# Si se interrumpe, vuelve a lanzarlo: continúa donde se quedó. Nunca borra nada.
# Blender: variable BLENDER=/ruta/a/blender, o el instalado en el sistema / Applications.
set -u
cd "$(dirname "$0")" || exit 1
PERFIL="${1:-review}"
case "$PERFIL" in preview|review|delivery) ;; *) echo "Perfil desconocido / unknown profile: $PERFIL (preview, review, delivery)"; exit 2;; esac

BL="${BLENDER:-}"
if [ -z "$BL" ]; then
  for c in blender /Applications/Blender.app/Contents/MacOS/Blender "$HOME/Applications/Blender.app/Contents/MacOS/Blender" /snap/bin/blender /usr/local/bin/blender /usr/bin/blender; do
    if command -v "$c" >/dev/null 2>&1; then BL="$(command -v "$c")"; break; fi
    if [ -x "$c" ]; then BL="$c"; break; fi
  done
fi
if [ -z "$BL" ]; then
  echo "No se encuentra Blender. Instálalo (blender.org, gratuito) o indica su ruta:  BLENDER=/ruta/a/blender sh renderizar.sh"
  echo "Blender not found. Install it (blender.org, free) or give its path:  BLENDER=/path/to/blender sh renderizar.sh"
  exit 2
fi
echo "Blender: $BL"

ejecutar() { # script y argumentos tras «--»
  s="$1"; shift
  "$BL" --background --factory-startup --python-exit-code 1 --python "$s" -- "$@"
}
fallo() {
  echo ""
  echo "✗ $1"
  echo "  Tu proyecto de RUBIK no ha cambiado. Corrige lo indicado y vuelve a lanzar: continuará donde se quedó."
  echo "  Your RUBIK project is unchanged. Fix the above and run again: it resumes where it stopped."
  exit 1
}

# 1 · Preparación (una vez). Una preparación interrumpida se aparta, nunca se borra.
if [ ! -f escena-preparada/scene.blend ] || [ ! -f escena-preparada/import-report.json ]; then
  if [ -d escena-preparada ]; then
    aparte="escena-preparada.incompleta-$(date +%Y%m%d-%H%M%S)"
    mv escena-preparada "$aparte" && echo "Preparación incompleta apartada en / incomplete preparation moved to: $aparte"
  fi
  echo "1/3 · Preparando la escena / preparing the scene…"
  ejecutar rubik_blender_prepare.py . escena-preparada || fallo "La preparación falló (paquete alterado o incompleto: descárgalo de nuevo desde RUBIK)."
else
  echo "1/3 · Escena ya preparada / scene already prepared: escena-preparada/scene.blend"
fi

# 2 · Render (reanudable: las vistas terminadas se conservan).
SALIDA="resultados/$PERFIL"
mkdir -p resultados
echo "2/3 · Renderizando con Cycles (perfil $PERFIL) / rendering with Cycles…"
ejecutar rubik_blender_render.py escena-preparada . "$SALIDA" --profile "$PERFIL" || fallo "El render se detuvo. Vuelve a lanzarlo para continuar / render stopped: run again to resume."

# 3 · Verificación de reapertura en un proceso nuevo (una vez por escena preparada).
if [ ! -f escena-preparada/verificacion-reapertura.json ]; then
  echo "3/3 · Verificando que la escena se reabre igual / verifying the scene reopens identically…"
  ejecutar rubik_blender_verify.py escena-preparada escena-preparada/verificacion-reapertura.json || fallo "La escena guardada no se reabre igual (revisa el aviso anterior)."
fi
cp escena-preparada/verificacion-reapertura.json "$SALIDA/verificacion-reapertura.json" 2>/dev/null || true

echo ""
echo "✓ Listo / Done: $SALIDA"
echo "  Imágenes PNG, escena editable review.blend e informe render-report.json."
echo "  Siguiente paso: en RUBIK › Entregar › Escena para Blender › «Revisar render…», elige manifest.json del ZIP original y luego la carpeta $SALIDA."
echo "  Next step: in RUBIK › Deliver › Scene for Blender › “Review render…”, choose manifest.json from the original ZIP, then the folder $SALIDA."
