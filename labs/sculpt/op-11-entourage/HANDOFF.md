# RUBIK SOTA · OP-11/C4 · Handoff SOURCE + ISOLATE

**Operación:** SCULPT-OP11-C4-ENTOURAGE-20261120  
**Fuente:** `laanlabs/openPlan3D@771c9e1ad30bd1c3cc7584d6eca74deb2e14943d`, árbol `9d085f30d6107e5d6959c7b5659d93eebd441516` (no truncado).  
**Destino:** `Juanmaes83/floorplan-3d`, rama `sculpt/op11-entourage-source-20261120`.  
**Base exacta:** `130ba24d420a2f4b26ab261313202e6070904fd8`, árbol `3c26d25b229a6b908158a52b3aaa77ddab02af58`.  
**Commit publicado:** consultar la referencia de rama tras publicar; no auto-incluir el propio SHA dentro del commit.

## Inventario y valor
- **12/12 símbolos vectoriales 2D de catálogo**, no GLB: `person`, `people-pair`, `car-sedan`, `car-suv`, `car-pickup`, `tree-deciduous`, `tree-conifer`, `shrub`, `hedge`, `potted-plant`, `grass-tuft`, `patio-umbrella`.
- **40 archivos exactos**, total **457775 bytes**: 3 licencia/config, 4 catálogo/bounds, 10 exportación, 1 tipos, 4 localización, 12 pruebas/fixtures, 6 documentos de validación.
- **40/40 blobs Git** del destino idénticos al donante; **40/40 SHA-256 medidos** desde los bytes recibidos.
- **MIT** original conservada; derechos de dependencias externas a revisar por separado.

## Evidencia y estados
- [E] Donante con commit fijo, árbol completo; licencia y rutas verificadas.
- [E] Bytes fuente en base64, tamaños cotejados con árbol, blobs destino creados nuevamente y SHA Git comparados.
- [E] SHA-256 medidos, método comprobado frente al vector de prueba SHA-256 de `abc`.
- [I] Fuente de geometría/colocación, exportación, capas, localización original EN/PT, test unitario y E2E.
- [H] Documentación del donante de DXF/PDF/PNG/SVG y opacidad. No atribuida a ejecución actual.
- [V] Compilación, tests de ejecución, baseline, paridad con RUBIK, previews y validación humana = **NOT_RUN**.

## Dependencias, exclusiones y riesgo
- Inventario de imports directos incluido en `DEPENDENCY-INVENTORY.json`; 28 módulos internos referenciados no copiados.
- No copiar automáticamente editor Svelte ni almacén para cerrar esas dependencias; en CLASSIFY decidir adaptación mínima a contratos existentes.
- Código de imágenes custom incluido para explicar el flujo; **cero imágenes personalizadas** incorporadas.
- DXF no dispone de raster-to-vector de imágenes custom. No fabricar equivalencias ni prometer fidelidad física de símbolos.
- No se han incluido OP-09, GLB, paisajismo avanzado, cambios en F3, cambios de producto, ni Production.
- Algunos exporters del donante dependen de su propia aplicación y stores: snapshot no ejecutable de forma autónoma.

## Próximo agente
Retomar desde `SOURCE-MANIFEST.json` y `DEPENDENCY-INVENTORY.json`, sin repetir SOURCE/ISOLATE. Confrontar frente a motores vectoriales/exportadores actuales de RUBIK y hacer CLASSIFY por archivo; luego SCULPT/NORMALIZE/TEST/PREVIEW con autorizaciones separadas. Preservar fuentes inmutables. **NO MERGE / NO PRODUCTION.**
