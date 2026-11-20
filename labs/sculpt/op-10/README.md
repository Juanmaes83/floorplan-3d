# SCULPT OP-10 · Escena 3D real de RUBIK → Blender (laboratorio)

**Laboratorio aislado.** No modifica el producto (`index.html`, `js/`), `FloorPlanProjectV1`, el expediente, workflows ni ramas de otros agentes. No es una integración: la cirugía posterior está en [docs/08](docs/08-riesgos-y-cirugia.md).

Objetivo: capturar fielmente la vivienda que se ve y edita en RUBIK, abrirla en Blender, verificarla contra el proyecto y obtener imágenes de revisión, sin otro motor geométrico ni otro exportador.

## Estructura

| Ruta | Contenido |
|---|---|
| `upstream/openplan3d-771c9e1/` | Copia **inmutable** del donante (MIT) con `MANIFEST.sha256` |
| `src/scene-capture-core.js` | Núcleo puro de captura (escultura de `portableRenderScene.ts`) |
| `src/capture-browser.cjs` | Arnés: carga el fixture en RUBIK real, espera escena estable, captura y escribe el manifiesto |
| `src/compare.cjs` | Fidelidad A (proyecto) ↔ B (visor) ↔ C (Blender); comprobaciones contractuales y visuales |
| `src/roundtrip.cjs` | C ↔ B vértice a vértice |
| `blender/import_scene.py` | Importa en Blender (Y-up → Z-up una vez), guarda `.blend` y devuelve la geometría |
| `blender/reopen_verify.py` | Reapertura en proceso nuevo y verificación por hash |
| `blender/render.py` | Render de revisión en 3 fases (Cycles por CPU) con derivados declarados |
| `fixtures/build.cjs` | Seis fixtures sintéticos deterministas |
| `tests/core.test.mjs` | 13 pruebas del núcleo (6 portadas del donante + 7 de RUBIK) |
| `tests/stability.browser.cjs` | Transiciones reales de escena |
| `tools/measure.py`, `tools/contact-sheet.cjs` | Tiempo/memoria de procesos y hojas comparativas |
| `run.cjs` | Ejecución completa reproducible (sin render) |
| `docs/`, `evidence/`, `HANDOFF.md` | Informes, evidencias y traspaso |

## Reproducir

Requisitos: Node 22, Chromium (`CHROME`), y para Blender un entorno temporal con `bpy` 5.2.1 LTS (`python3 -m venv V && V/bin/pip install bpy==5.2.1`, 402 MB, fuera del repositorio).

```sh
node --test labs/sculpt/op-10/tests/core.test.mjs
CHROME=/ruta/chrome node labs/sculpt/op-10/run.cjs /tmp/op10-NUEVO --python V/bin/python
# render (por fases): importar con materiales neutros u observados y renderizar
V/bin/python labs/sculpt/op-10/blender/import_scene.py -- /tmp/op10-NUEVO/capture/f5-furniture /tmp/op10-obs --materials observed
V/bin/python labs/sculpt/op-10/blender/render.py -- /tmp/op10-obs /tmp/op10-NUEVO/capture/f5-furniture /tmp/op10-p3 --phase 3 --res 960x600 --samples 32
```

Nada se sobrescribe: cada salida exige una carpeta nueva. Los `.blend`, GLB y escenas grandes no se suben; sus huellas están en `evidence/`.
