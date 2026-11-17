# Traspaso del laboratorio Studio Presentation

## Vigente · continuidad v1.4

Rama exclusiva `lab/studio-presentation-e0e1`. Base de continuidad `101fe167bd920c94c7e27938dfd3c22526dd9728`. Producto de solo lectura `master@8525025a1470d48d52d8e365070e5a0acf116134`.

- Mandatos acumulativos y huellas en `mandatos/INDICE-MANDATOS.md`, con v1.2 recuperada.
- Trabajo activo, evidencias y bloqueos en `reports/15-REGISTRO-v1.4.md`. Se han recibido V13-01–V13-09 y CONT-01–CONT-03.
- Primer gate: en un único entorno Linux, desde la raíz del lab, ejecutar `node tools/compose.cjs snapshot out/v3` y luego `RECETAS_SOLO=RP07 node tools/recetas-qa.cjs /tmp/rq exportar,ui`. Conservar la composición durante toda la comparación.
- La receta de reconstrucción y dependencias está en `RECETA.md`.
- Pendientes del candidato: cierre N01, reejecución N05, N02–N04/N06–N08, RP-Q, comparación con baseline, inspección y distribución de ZIP y revisión de propietario.

## Histórico

Los handoffs `HANDOFF-v1.3.md` y `HANDOFF-v1.4.md` conservan el estado de sus sesiones. Para continuar se usa la sección vigente.

### Cierre v1.3 (17/11/2026)

Rama `lab/studio-presentation-e0e1`. Sin PR, sin merge, sin cambios en el producto.

- **Reconstruir y comprobar:** `RECETA.md`. Un solo comando desde el ZIP del laboratorio, en una carpeta limpia fuera del repositorio:
  `bash tools/reconstruir.sh rubik-studio-presentation-lab.zip <carpeta>`. Instala las fuentes con `npm ci` (lockfile en `tools/`), compone dos veces y compara.
- **Componer dentro del laboratorio:** `node tools/compose.cjs snapshot out/v3`. Las fuentes y la sonda de lint están en `vendor/`. No hace falta ninguna ruta de donantes.
- **Empaquetar:** `bash tools/package.sh` → `dist/` (no versionado): ZIP del cliente en ES y EN y ZIP del laboratorio, con `SHA256SUMS`.
- **Estado y pendientes:** `HANDOFF-v1.3.md` y `reports/13-REGISTRO-VIVO-v1.3.md`. Mandatos vigentes y sus huellas: `mandatos/INDICE-MANDATOS.md`.

### Inicio (E0)
Rama `lab/studio-presentation-e0e1` (desde master `f31f303`). Sin PR. Regenerar: `cd labs/studio-presentation/tools && npm i --no-save @fontsource/inter@5.1.1 @fontsource/newsreader@5.1.1 @fontsource/source-serif-4@5.1.1`; `node tools/snapshot.cjs <repoRoot> snapshot`; `node tools/compose.cjs snapshot out/v2` (requiere IFC Sheet en /home/user/donors/ifc-sheet y Huashu en /home/user/juanmaes83/huashu-design-3.0-agent-, o variables IFC_FONTS/HUASHU_LINT).
Hecho: baseline (H01–H08), snapshot canónico, clasificación de 49 referencias, ADN por entregable, sistema v0.2, 5 prototipos + direcciones, QA y prueba a una tinta.
Pendiente: ver prompt de continuación en el chat; E1 (motores CSS Print / Paged.js / Typst; tablas 1/50/200/500), ADR, matriz EXISTE/AMPLIAR/FALTA, informes 00/02/06–09, ZIP sanitizado, prueba ZH, GO/NO-GO E2.

### B1 cerrado (sesión del 17/11/2026, continuación)
Hecho: `tools/b1.cjs` (14 documentos / 67 págs. en `out/v3`), QA ampliado en `tools/compose.cjs` (solapes de texto, contenido fuera de su caja, texto SVG recortado; prueba negativa superada), puerta de 3 direcciones por tipo de página, crítica en `reports/B1-DISENOS-POR-ENTREGABLE.md`, decisiones en `reports/DECISIONES-PENDIENTES.md`, evidencias en `evidence/v3/`.
Siguiente: B2 (robustez). Donantes privados clonados en esta sesión: impeccable, open-design, product-editorial-showcase, designer-skills; el resto no fue necesario para B1.

### B2 cerrado
Variantes (`tools/variants.cjs`): vacío, sin presupuesto/vistas/marca, nombres largos, logotipo. Las 4 + el canónico con QA a cero. Detalle y límites: `reports/B2-ROBUSTEZ.md`. Siguiente: B3 (motores de PDF y ADR).

### B3 cerrado
Banco CSS Print / Paged.js / Typst (`tools/engines/bench.mjs`), ADR 06 (`reports/06-ADR-MOTOR.md`): CSS Print + paginación medida (`tools/flow.js`) con invariante de filas en el QA; Paged.js descartado (pierde texto y no repite cabecera); Typst reservado para E2. Nueva variante `long-budget`.

### Ampliación: entrega integral (cerrada en esta sesión)
- Activos reales del producto: `tools/delivery-assets.cjs <repoRoot> <labDir> [ft3d8|living|drawing|all]` → `assets/` (logs con SHA-256). FT3D-8 por el camino real de biblioteca; plan de la demo ajustado (`assets/ft3d8-plan-ajuste.json`).
- Correspondencia proyecto ↔ demo: `tools/correspondence.cjs` → `evidence/correspondencia/`. Trazabilidad Render IA: `evidence/render-ia/trazabilidad.json`.
- Entrega: `tools/entrega.cjs` (llamado por compose) → `out/v3/entrega/` (web cliente, 7 tipos), `out/v3/entrega-integral.pdf`, `out/v3/profesional/preparar-entrega.html`.
- QA: `tools/entrega-qa.cjs`, `tools/preparar-qa.cjs`, `tools/minimap-probe.cjs`. Empaquetado: `tools/package.sh` → `dist/` (no versionado).
- Informes: 07 (matriz), 09 (riesgos y notas), 10 (entrega integral), 11 (propuesta E2), 00 (resumen y GO/NO-GO).

### Cierre v1.2 (17/11/2026, Claude Code)
Especificación vigente: v1.2 (sustituye a la v1.1). Informes: `reports/00-RESUMEN-EJECUTIVO.md` (cierre, H01–H08, A01–A06, pilares, paquetes, recomendación), `reports/11-PROPUESTA-E2.md` (alineado con §8.1), `reports/12-MATRIZ-QA-v1.2.md` (D01–D18, ST01–ST09).
Nuevas herramientas: `tools/exportar.cjs` (exportación selectiva real con gates), `tools/verificar-entrega.cjs`, `tools/exportar-qa.cjs` (16 casos), `tools/inspeccionar-paquete.py`, `tools/paquete-navegador-qa.cjs`; `tools/package.sh` reescrito con allowlist; `tools/flow.js` con invariante final y bloqueo de filas desmesuradas; `compose.cjs` verifica celda a celda en el PDF.
Pendiente y delimitado: Architecture Book (ausente), muestras en inglés, H03/ST01 (E2), D02/D03 (E2), revisión humana D08, navegadores Firefox/WebKit y dispositivos físicos.
