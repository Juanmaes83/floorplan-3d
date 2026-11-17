#!/usr/bin/env bash
# Empaqueta (1) la carpeta de entrega del cliente y (2) el laboratorio completo, saneado. Salida: dist/ (no versionada).
# Saneado: sin node_modules, sin salidas regenerables de variantes, sin claves ni datos personales (escaneo que bloquea).
set -euo pipefail
LAB="$(cd "$(dirname "$0")/.." && pwd)";DIST="$LAB/dist";rm -rf "$DIST";mkdir -p "$DIST"
cd "$LAB"
# escaneo: texto (claves y tokens) y nombres reales del entorno; los PNG se excluyen (bytes comprimidos dan falsos positivos)
if grep -rIlE "ghp_[A-Za-z0-9]{20}|github_pat_|sk-[A-Za-z0-9]{20}|AKIA[0-9A-Z]{16}|xox[bp]-|BEGIN (RSA|OPENSSH|EC) PRIVATE|@gmail\.com" --exclude-dir=node_modules --exclude-dir=dist . ; then echo "BLOQUEADO: posible secreto o dato personal"; exit 1; fi
( cd out/v3 && zip -qr -X "$DIST/entrega-vivienda-de-ejemplo.zip" entrega -x '*.DS_Store' )
zip -qr -X "$DIST/rubik-studio-presentation-lab.zip" . -x 'tools/node_modules/*' 'dist/*' 'out/v3/b2/*/*.pdf' 'out/v3/b2/*/*.html' '*.DS_Store'
( cd "$DIST" && sha256sum *.zip > SHA256SUMS && ls -la )
