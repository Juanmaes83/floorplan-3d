# RUBIK SOTA · OP-11/C4 · SOURCE + ISOLATE · 12 símbolos vectoriales 2D

**Estado:** SOURCE VERIFIED + ISOLATED, sin integración, baseline funcional, validación de render, preview, revisión humana, merge ni Production.

- **Donante congelado:** [laanlabs/openPlan3D@771c9e1ad30bd1c3cc7584d6eca74deb2e14943d](https://github.com/laanlabs/openPlan3D/tree/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d); árbol `9d085f30d6107e5d6959c7b5659d93eebd441516`.
- **Destino:** `Juanmaes83/floorplan-3d` → `sculpt/op11-entourage-source-20261120`, base `master@130ba24d420a2f4b26ab261313202e6070904fd8`.
- **Protocolo:** SCULPT-GIT-TRANSFER v1.0 ([PR #292 documental Draft](https://github.com/Juanmaes83/floorplan-3d/pull/292)).
- **Material:** 12 definiciones vectoriales de código — **no son GLB**.
- **Adquisición:** 40 archivos originales, 457775 bytes; SHA Git iguales en los 40; SHA-256 recalculados independientemente en los 40. No existen hashes SHA-256 declarados del donante con los que cotejar.
- **Derechos:** copia literal de [LICENSE MIT](upstream/LICENSE) y su copyright, sin atribuir la misma licencia a paquetes externos.
- **Módulos:** catálogo, geometría/límites, exportación DXF/PDF/PNG/SVG, render Canvas de referencia, tipos, EN/PT, tests y documentos originales de validación.
- **Siguiente fase:** CLASSIFY → SCULPT → NORMALIZE → TEST → PREVIEW solo con autorización específica.

## Expediente
- [SOURCE-MANIFEST.json](SOURCE-MANIFEST.json) — por fichero: origen, destino, tamaño, hash Git y SHA-256 medido.
- [DEPENDENCY-INVENTORY.json](DEPENDENCY-INVENTORY.json) — símbolos, categorías, valores predeterminados de colocación y dependencias directas copiadas/omitidas.
- [HANDOFF.md](HANDOFF.md) — pruebas, riesgos y siguiente gate.
- Código original bajo `upstream/` sin transformaciones.

## Límites técnicos
- El donante tiene 28 módulos internos referenciados directamente por los archivos preservados pero no incluidos en este snapshot. La copia **no constituye aplicación ejecutable**.
- DXF exporta símbolos vectoriales built-in; **no transforma imágenes personalizadas raster en vectores CAD**. SVG/PNG/PDF incluyen rutas de código para casos custom, sin copiar imágenes reales.
- Los anchos de catálogo son valores por defecto del donante y **no mediciones comerciales verificadas**.
- Las evidencias de tests del donante son históricas; esta operación no ejecutó Vitest, Playwright ni pruebas funcionales de RUBIK.
- No se copió editor Svelte, almacén, imágenes personales/privadas, 3D GLB, OP-09 ni paisajismo avanzado. Sin nuevos motores vectoriales; sin cambios en F3, `master` o Production.
