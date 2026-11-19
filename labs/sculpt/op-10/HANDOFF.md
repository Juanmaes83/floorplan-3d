# HANDOFF · SCULPT OP-10 · Escena 3D real de RUBIK → Blender

**Estado:** laboratorio completado y listo para la aceptación humana. **No es integración:** no autoriza cirugía, merge, promoción ni servicios.
**Rama:** `claude/sculpt-op10-blender`. **Base auditada:** `master@dd528119bdfd80733c4faf5bb56a594190fea5ac`, árbol `f62e9492de0ee616c8edd1966703238d57702a63` (verificados en GitHub al empezar). **Responsable:** Claude Code.
**Alcance de escritura:** solo `labs/sculpt/op-10/`. Producto, workflows, `FloorPlanProjectV1`, expediente y ramas de Codex (OP-02 #266, OP-04 #268, F0.2b #269) y laboratorios congelados (OP-07 #267, OP-05, Studio E3 `8c532634`) sin tocar.

## Qué hay

| Entregable | Dónde |
|---|---|
| 1. SOURCE EXACT, hashes, consumidor nativo, forks y propuesta SOURCE DISCOVERY | [docs/01](docs/01-source-exact.md), `upstream/openplan3d-771c9e1/MANIFEST.sha256` |
| 2. Clasificación KEEP/GENERALISE/OPTIONALISE/REPLACE/REMOVE | [docs/02](docs/02-clasificacion.md) |
| 3. Adaptador funcional aislado | `src/scene-capture-core.js`, `src/capture-browser.cjs` |
| 4. Fidelidad geométrica A↔B↔C | [docs/03](docs/03-fidelidad.md), `evidence/run/` |
| 5. Comparativa RUBIK → Blender | `blender/import_scene.py`, `src/roundtrip.cjs`, `evidence/run/*/roundtrip-CB.json` |
| 6. Capturas antes/después de cada pulido | [docs/05](docs/05-pulido.md), `evidence/render/` |
| 7. Métricas y límites | [docs/04](docs/04-metricas.md) |
| 8. Importación y reapertura | `blender/reopen_verify.py`, `evidence/run/*.reopen.json` |
| 9. Riesgos residuales · 10. Plan de cirugía | [docs/08](docs/08-riesgos-y-cirugia.md) |
| Estado de escena y OP-02 · E3 y contratos futuros | [docs/06](docs/06-estado-escena-op02.md), [docs/07](docs/07-e3-contratos-futuros.md) |
| 11. SHA, árbol y diff | Al final de este documento |

## Resultado en una línea por bloque

- **Donante:** openPlan3D@771c9e1 (MIT). Baseline en este entorno: 6/6 unitarias y 4/4 de navegador en Chromium. Firefox/WebKit no ejecutados.
- **Consumidor nativo** (`laanlabs/openplan3d-ios`): **inaccesible** por vía legítima. Orden de preferencia → B (pipeline de RUBIK) + C (importador mínimo en OP-10).
- **Forks Blender:** ninguno aporta código a la cadena. `blender-mcp` queda como opción para pulido interactivo humano.
- **Núcleo:** 13/13 pruebas. Instancias, multi-material, identidad canónica, política de exclusión declarada, unidades obligatorias y no mutación.
- **Captura real** en RUBIK, 7 escenarios con escena estable: proyecto y almacenamiento intactos, 0 peticiones externas y bytes idénticos entre ejecuciones.
- **Fidelidad:** 2.038 comprobaciones contractuales A↔B con **0 fallos**, desviación máxima 0,001 mm; C↔A igual; C↔B **0,000 mm** en 1,4 M vértices. Las diferencias visuales del mobiliario procedimental se miden y se declaran.
- **Blender 5.2.1 LTS:** importación PASS, `.blend` guardado y reapertura en proceso nuevo PASS 8/8 con el mismo hash de geometría.
- **Estado de escena:** transiciones detectadas. Con un GLB retrasado 6 s, la captura espera y da los mismos bytes. OP-02: mismos bytes.
- **Pulido:** 3 fases × 2 ciclos con decisiones registradas; dos REJECT por honestidad (cámara dentro de un mueble y «mar» inventado).

## Dictamen

| Dictamen | Decisión | Fundamento | Condiciones |
|---|---|---|---|
| **Escultura** | **GO** | Adaptador fiel al donante y generalizado a RUBIK; fidelidad contractual completa en 6 fixtures sintéticos y 7 escenarios; determinismo; sin mutaciones; límites con rechazo | Fixtures sintéticos: no acredita exactitud frente a obra real. Firefox/WebKit pendientes |
| **Pulido visual** | **GO para revisión, NO-GO para entrega** | Imágenes de presentación verificables con derivados declarados | Pendiente tu revisión visual. Hallazgo C3 (caras coincidentes) visible. Calidad de revisión (960×600, 32 muestras), no de entrega. Sin vídeo |
| **Futura cirugía** | **GO condicionado** | Plan C1–C7 sobre contratos existentes, sin otro motor ni exportador | Tu aceptación de este laboratorio; C2/C3 en el visor antes de C4; coordinar `index.html` con Codex (OP-02 #266) |

## Checklist de aceptación humana

- [ ] Las hojas `evidence/render/fase{1,2,3}-*.png`: ¿el después mejora al antes y no inventa nada?
- [ ] Las cuatro vistas finales `evidence/render/final/*.png`: ¿se reconoce la vivienda del ejemplo?
- [ ] Abrir `review.blend` regenerándolo (README) y ver los IDs `rubik_id` en el panel de propiedades.
- [ ] Decidir sobre C3 (caras coincidentes) y C2 (etiquetado de huecos) para la cirugía.
- [ ] Decidir si el render local merece GPU, servidor o vídeo (hoy: ~35 s/imagen por CPU).

## SHA, árbol y diff

Se completa al cerrar el laboratorio.
