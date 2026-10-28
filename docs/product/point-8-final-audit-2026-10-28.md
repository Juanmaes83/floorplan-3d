# Punto 8 — auditoría final y cierre canónico

Estado: **CERRADO** el 28-10-2026 tras la integración de 8A, 8B y 8C-A…E. El cierre funcional de 8C-E corresponde a PR #132, HEAD revisado `482a2b8a8bef15f33c16de5580713a45b9941a30` y squash en `master` `012fb1409f1e73f4ca3c088aea0bb8682bec3197`.

Este documento sustituye como fuente de cierre a `point-8-final-audit-candidate-2026-10-28.md`.

## Resultado

Punto 8 queda cerrado con una arquitectura conservadora y trazable:

- 8A: fachada/exterior básico derivado de geometría demostrable;
- 8B: huella, cubierta plana, retranqueos, petos declarados y volúmenes exteriores simples; cubiertas inclinadas simples quedan diferidas sin bloquear el cierre;
- 8C-A: `FloorPlanGeoProvider` y contratos territoriales agnósticos de proveedor;
- 8C-B: parcela fuente, CRS y `parcel.frame`, separados de la geometría editable;
- 8C-C: ortofoto PNOA contextual, raster sólo runtime y metadata durable;
- 8C-D: MDT05 contextual, grid/superficie sólo runtime y metadata durable;
- 8C-E: colocación territorial explícita del edificio, una sola cadena espacial, integración en escena/Presentación y política de exportación por licencia/atribución.

La regla de producto se mantiene: **más contexto, no más falsa certeza**.

## Cadena espacial cerrada

```text
CRS territorial fuente
→ site.parcel.frame
→ coordenadas parcel-local
→ site.buildingPlacement
+ site.northOffsetDeg
→ marco Project/Building existente
→ renderer existente
```

`northOffsetDeg` sigue siendo la única autoridad de orientación. El edificio no se rota ni traslada para adaptarse al territorio; se transforma el contexto hacia el marco histórico del modelo. Los offsets/elevaciones de Building se aplican una sola vez. `exportLevel` rebasa placement para conservar la misma posición física.

La relación vertical con el terreno nunca se infiere: `modelZeroElevationM` es una decisión explícita, manual o derivada mediante acción expresa sobre un TerrainGrid cargado. Actualizar el terrain no mueve automáticamente el edificio.

## Matriz de persistencia y exportación

«Metadata» significa snapshot/contrato, nunca blob, URL de sesión, raster, grid o mesh.

| Salida | Edificio / placement | Parcela | Ortofoto | Terreno | Política |
|---|---|---|---|---|---|
| JSON | Modelo + placement metadata | geometría fuente + snapshot | metadata | metadata | sin runtime ni red |
| ZIP Project/Building | modelo/assets existentes + placement metadata | metadata | metadata | metadata | sin raster/grid territorial |
| PNG / captura | escena visible | sólo si exportable | runtime si exportable | runtime+cota si exportable | `verified` exige atribución; `restricted/unknown` se omiten |
| Share image | pipeline delivery existente | mismo filtro | mismo filtro | mismo filtro | hereda créditos/filtro |
| Delivery image | escena soportada | visual exportable | visual exportable | visual exportable | framing sólo con capas exportables + pie de créditos |
| Presentation | edificio + contexto exterior + stops existentes | visible para uso interno | visible si runtime | visible si runtime+cota | las capturas vuelven a pasar política de salida |
| GLB | perfil geométrico local existente | omitida | omitida | omitido | no se fuerza contexto territorial |
| Blender | paquete GLB local existente | omitida | omitida | omitido | no se amplía el importador |
| Vídeo TourRecorder | recorrido existente | omitida | omitida | omitido | omisión conservadora porque el contrato de vídeo no incorpora créditos territoriales |

No se inicia red para exportar. Si el runtime no está cargado, la capa se omite. No existe una lista privilegiada de proveedores: la decisión usa el snapshot de licencia/atribución.

## Independencia de capas 8C-E

La revisión final detectó y corrigió una incoherencia de visibilidad entre terreno y ortofoto drapeada:

- mesh visual de terrain: `territoryLayers = ['terrain']`;
- mesh visual de ortofoto: `territoryLayers = ['orthophoto']`;
- el mesh drapeado conserva las policies/licencias de **orthophoto + terrain**, porque utiliza geometría derivada del terreno aunque su visibilidad pertenezca a la capa ortofoto.

La regresión browser demuestra las dos combinaciones:

- Ortofoto ON / Terreno OFF → ortofoto visible, terrain oculto, créditos de ortofoto + terrain conservados;
- Ortofoto OFF / Terreno ON → ortofoto oculta, terrain visible, crédito terrain.

## Presentación, Solar y Recorrer

- Solar conserva su matemática y `northOffsetDeg` como única autoridad; el caso norte 37° + placement no cero no introduce doble rotación.
- Presentación conserva framing de habitaciones y restaura cámara, target, quaternion, opciones, capas, reveal/sección y Solar/luz. La vista contextual amplía temporalmente límites de OrbitControls/far plane y los restaura al volver.
- El contexto territorial no participa en picking ni en colliders de Walk.
- La comparación nueva de Walk con/sin contexto conserva origen de modelo, altura de cámara, puertas y movimiento real.

## Offline, provider ausente y recursos runtime

JSON/ZIP pueden abrirse sin red y sin providers registrados. Los snapshots permanecen; `Blob`, object URL, TerrainGrid, mesh, materiales y texturas no se persisten. No existe auto-fetch al abrir, entrar en 3D, Presentación, Walk ni exportar.

Cambio de proyecto/parcela/snapshot invalida runtime incompatible. Las object URLs se revocan y geometrías/materiales/texturas se disponen al reemplazar o destruir el contexto.

## Evidencia final de PR #132

HEAD final validado antes del merge: `482a2b8a8bef15f33c16de5580713a45b9941a30`.

Checks naturales finales en ese HEAD, todos `success`, sin reruns manuales:

- Guided experience;
- Rubik local MCP;
- Point 8C-C orthophoto context;
- Point 8C-D terrain context / integración territorial;
- Integrated browser regressions;
- Point 6 solar and compatibility;
- Multiformat guided import.

Validación local documentada:

- Node no-browser: 567 PASS, 0 FAIL, 2 SKIP;
- schemas Python: 25 PASS;
- browser específico 8C-E: 3 PASS;
- terrain browser: 2 PASS;
- privacidad F2: 4 PASS;
- `node --check`: PASS;
- `git diff --check`: PASS.

Detalles y comandos: `docs/qa/point-8c-e-local-validation-2026-10-28.md`.

## Baselines preexistentes que NO se convierten en PASS

El cierre no oculta deuda previa:

1. Los 10 casos originales de `walk.browser` / `walk-controls.browser` fallan exactamente igual en el `master` base limpio y en la rama 8C-E: 10/10 nombres, mensajes y ubicaciones coinciden; 0 fallos nuevos. Cinco son timeouts sobre `#walkOverlay` oculto y cinco aserciones del panel oculto.
2. `3D camera, focus and editor state return after Escape and browser Back` mantiene una aserción de aspect ratio que también falla en el `master` base limpio.

Estos fallos son deuda técnica previa, no regresiones de Punto 8. No se modificaron Walk ni esas pruebas para forzar verde.

## Límites del cierre

Punto 8 NO afirma:

- geolocalización automática del edificio;
- lindero catastral legal certificado;
- levantamiento topográfico certificado;
- precisión geotécnica, cimentación, drenaje o movimiento de tierras;
- raster/grid territorial persistido;
- contexto territorial en GLB/Blender/vídeo cuando el contrato de salida no lo soporta;
- cubiertas inclinadas 8B-C, que permanecen diferidas por alcance.

## Conclusión

**Punto 8 queda CERRADO.**

La plataforma dispone de exterior demostrable, cubierta/volúmenes conservadores y contexto territorial trazable —parcela, ortofoto y terrain— integrado mediante una única cadena espacial explícita, sin modificar la geometría editable ni atribuir a las fuentes una certeza que no demuestran.

Siguiente corte funcional del roadmap: **Punto 9 — instalaciones ligeras**, sujeto a su propio alcance y gate.