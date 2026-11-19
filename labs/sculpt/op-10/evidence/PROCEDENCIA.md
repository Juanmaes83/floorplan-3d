# Evidencias OP-10 · procedencia exacta

Todas las evidencias de ejecución proceden del código **tal como está en el commit `759d9bb7`** (núcleo, arnés, comparador, importador, reapertura y `render.py`). No se atribuyen a `a9895f8c` ni a commits posteriores, que solo añaden documentación y el bloque `identity` de `run.cjs`.

| Carpeta o archivo | Producido por | Ejecución | Notas |
|---|---|---|---|
| `run-759d9bb7/summary.json`, `run-metrics.json` | `run.cjs` @ `759d9bb7` | Ejecución final, 7 escenarios, 392 s, RSS pico 878 MB | Sin bloque `identity` (no existía en ese commit) |
| `run-759d9bb7/<escenario>/manifest.json`, `fidelity-AB.json` | `src/capture-browser.cjs` + `src/compare.cjs` @ `759d9bb7` | Misma | A↔B: 2.038 comprobaciones contractuales, 0 fallos |
| `run-759d9bb7/<escenario>/import-report.json`, `roundtrip-CB.json`, `fidelity-CA.json`, `import-metrics.json` | `blender/import_scene.py` + `src/roundtrip.cjs` @ `759d9bb7`, bpy 5.2.1 | Misma | C↔B 0,000 mm |
| `run-759d9bb7/<escenario>/reopen.json`, `reopen-metrics.json` | `blender/reopen_verify.py` @ `759d9bb7`, proceso nuevo | Misma | 8/8 en los 7 escenarios |
| `run-759d9bb7/f1-rect/scene.json` | Captura @ `759d9bb7` | Misma | Muestra; las escenas grandes (hasta 16,5 MB) no se versionan y se regeneran con `run.cjs` |
| `identity.json` | `tools/identity.cjs` (añadido después), **leyendo** los archivos de la ejecución `759d9bb7` | Sin repetir captura, comparación ni Blender | Verificación dirigida del delta de `run.cjs` (+7 líneas, solo metadatos) |
| `render/render-report-p3.json`, `render/final/*.png` | `blender/render.py` @ `759d9bb7` (SHA-256 `47d4bed0…`, igual en HEAD) | Fase 3 | Imágenes finales de revisión |
| `render/render-report-p1-759.json`, `render-report-p2-759.json` | `render.py` @ `759d9bb7` | Re-render de las fases 1 y 2 | Píxel a píxel idénticos a los intermedios (`render/equivalencia-pixel.json`, diferencia máxima 0 en 8/8) |
| `render/render-report-p{1,2,3}-v1.json` | `render.py` de trabajo anterior a `759d9bb7` | Ciclo 1 de cada fase («antes») | Se conservan como el «antes» rechazado o ajustado; no se presentan como resultado |
| `render/fase{1,2,3}-*.png` | `tools/contact-sheet.cjs` | Montaje: antes = v1, después = p1-759 / p2-759 / p3 | Solo composición; no re-renderiza |
| `estado-escena/transiciones.json` | `tests/stability.browser.cjs` | Árbol de trabajo previo a `759d9bb7` con las mismas reglas de estabilidad | Transiciones de carga y puertas detectadas |
| `estado-escena/carga-asincrona-y-op02.json` | Capturas con GLB retrasado 6 s y en `codex/sculpt-op02-render-demand@edfbf66b` (worktree temporal ya borrado) | Ídem | Mismos bytes de escena que la referencia |
| `baseline/rubik-blender-verify-*.json` | Pipeline Blender existente de RUBIK, sin cambios | Auditoría inicial | Solo lectura |

## Lo que NO acreditan estas evidencias

- **El proyecto observado** (`manifest.source`, `identity.observedProject`) es el proyecto cargado en el visor al capturar. **No es una revisión transaccional F0 confirmada.**
- **`fixtureContentId`** (`identity.json`) es `contentId()` sobre fixtures sintéticos con documentos vacíos y sin bytes de imagen verificados, llamado fuera del camino `pack`/`read` del expediente. Solo acredita el alcance de estos fixtures.
- Las rutas absolutas dentro de los JSON y de los metadatos PNG apuntan al directorio temporal de la sesión y no son reproducibles; los hashes sí.
