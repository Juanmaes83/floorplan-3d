#!/usr/bin/env bash
# v1.2 · A05/ST09 · Empaqueta por LISTA DE PERMITIDOS (allowlist), no por exclusión, e inspecciona cada ZIP archivo a archivo.
# (1) Cliente: la entrega integral exportada por tools/exportar.cjs (solo lo elegido, manifiesto dentro, resumen fuera).
# (2) Laboratorio: código, sistema, informes, snapshot, evidencias y PDF de out/v3; sin node_modules ni salidas regenerables.
# Salida en dist/ (no versionada): ZIP, resumen externo, SHA256SUMS, INDICE.json e informes de inspección. Si la inspección
# encuentra algo que bloquea, el script termina con error y no da el paquete por bueno.
set -euo pipefail
LAB="$(cd "$(dirname "$0")/.." && pwd)";DIST="$LAB/dist";rm -rf "$DIST";mkdir -p "$DIST"
cd "$LAB"
ACK='["Identidad del estudio","Presupuesto revisado","Imágenes IA","Plan de obra"]'
printf '{"tipo":"integral","modo":"cliente","reconocidos":%s}' "$ACK" > "$DIST/seleccion-integral.json"
node tools/exportar.cjs "$DIST/seleccion-integral.json" "$DIST/entrega-vivienda-de-ejemplo"
node tools/verificar-entrega.cjs "$DIST/entrega-vivienda-de-ejemplo"
# README para abrir sin conexión (fuera del manifiesto: se añade al ZIP de reparto, no a la carpeta verificada)
cat > "$DIST/LEEME-entrega.txt" <<'TXT'
Entrega de cliente (laboratorio RUBIK Studio Presentation, datos sintéticos).
Abrir sin conexión: descomprimir y abrir index.html en un navegador. No necesita internet ni instalar nada.
Contenido y huellas: MANIFIESTO.json (dentro). Verificación: el SHA-256 de MANIFIESTO.json y del ZIP están en
entrega-vivienda-de-ejemplo.digest.json, que se entrega por separado.
No contiene el proyecto editable ni la visita 3D interactiva (necesita un enlace publicado).
TXT
# Laboratorio: allowlist explícita
LIST="$DIST/allowlist-laboratorio.txt"
{ ls HANDOFF.md PROMPT-CONTINUACION.md
  find reports system snapshot prototypes engines -type f 2>/dev/null
  find tools -maxdepth 2 -type f \( -name '*.cjs' -o -name '*.js' -o -name '*.mjs' -o -name '*.py' -o -name '*.sh' -o -name 'package.json' -o -name 'package-lock.json' \) -not -path '*/node_modules/*'
  find evidence -type f
  find out/v3 -maxdepth 1 -type f \( -name '*.pdf' -o -name 'qa.json' \)
  find out/v3/b2 out/v3/b3 -type f -name '*.json' 2>/dev/null
  find out/v3/entrega out/v3/profesional -type f
} | sort -u > "$LIST"
zip -qX -@ "$DIST/rubik-studio-presentation-lab.zip" < "$LIST"
cp "$DIST/entrega-vivienda-de-ejemplo.zip" "$DIST/entrega-vivienda-de-ejemplo-reparto.zip"
( cd "$DIST" && zip -qX entrega-vivienda-de-ejemplo-reparto.zip LEEME-entrega.txt )
status=0
python3 -I tools/inspeccionar-paquete.py "$DIST/entrega-vivienda-de-ejemplo-reparto.zip" cliente "$DIST/inspeccion-cliente.json" || status=$?
python3 -I tools/inspeccionar-paquete.py "$DIST/rubik-studio-presentation-lab.zip" laboratorio "$DIST/inspeccion-laboratorio.json" || status=$?
( cd "$DIST" && sha256sum *.zip *.digest.json > SHA256SUMS && ls -la *.zip SHA256SUMS )
node -e "const fs=require('fs'),d='$DIST';const z=fs.readdirSync(d).filter(f=>/\.zip$/.test(f)).map(f=>({zip:f,bytes:fs.statSync(d+'/'+f).size}));fs.writeFileSync(d+'/INDICE.json',JSON.stringify({generated:new Date().toISOString(),node:process.version,zips:z,sha256:fs.readFileSync(d+'/SHA256SUMS','utf8').trim().split('\n')},null,1));"
exit $status
