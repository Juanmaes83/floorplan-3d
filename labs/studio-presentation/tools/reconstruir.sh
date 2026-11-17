#!/usr/bin/env bash
# Reconstruye desde dos extracciones independientes del ZIP y coteja con los artefactos empaquetados.
set -euo pipefail
if [ "$#" -ne 2 ]; then
  echo "Uso: bash tools/reconstruir.sh <lab.zip> <dirTrabajo>" >&2
  exit 1
fi
TOOLS="$(cd "$(dirname "$0")" && pwd)"
ZIP="$(realpath "$1")"
mkdir -p "$2"
W="$(cd "$2" && pwd)"
RUN="$(mktemp -d "$W/reconstruccion.XXXXXX")"
DIGEST="$(sha256sum "$ZIP" | cut -d ' ' -f 1)"
export TZ=UTC
for r in a b; do
  mkdir "$RUN/$r"
  unzip -q "$ZIP" -d "$RUN/$r"
  (
    cd "$RUN/$r"
    (cd tools && npm ci --no-audit --no-fund --silent)
    node tools/compose.cjs snapshot "$RUN/out-$r"
  ) > "$W/compose-$r.log" 2>&1 || { tail -10 "$W/compose-$r.log"; exit 1; }
done
printf '%s  %s\n' "$DIGEST" "$ZIP" | sha256sum -c --status
# La primera extracción conserva intactos los PDF ya incluidos bajo out/v3.
python3 -I "$TOOLS/reconstruccion-qa.py" "$RUN" "$W/RECONSTRUCCION.json" "$DIGEST"
