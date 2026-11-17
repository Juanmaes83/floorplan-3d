# Traspaso del laboratorio Studio Presentation (17/11/2026)
Rama `lab/studio-presentation-e0e1` (desde master `f31f303`). Sin PR. Regenerar: `cd labs/studio-presentation/tools && npm i --no-save @fontsource/inter@5.1.1 @fontsource/newsreader@5.1.1 @fontsource/source-serif-4@5.1.1`; `node tools/snapshot.cjs <repoRoot> snapshot`; `node tools/compose.cjs snapshot out/v2` (requiere IFC Sheet en /home/user/donors/ifc-sheet y Huashu en /home/user/juanmaes83/huashu-design-3.0-agent-, o variables IFC_FONTS/HUASHU_LINT).
Hecho: baseline (H01–H08), snapshot canónico, clasificación de 49 referencias, ADN por entregable, sistema v0.2, 5 prototipos + direcciones, QA y prueba a una tinta.
Pendiente: ver prompt de continuación en el chat; E1 (motores CSS Print / Paged.js / Typst; tablas 1/50/200/500), ADR, matriz EXISTE/AMPLIAR/FALTA, informes 00/02/06–09, ZIP sanitizado, prueba ZH, GO/NO-GO E2.

## B1 cerrado (sesión del 17/11/2026, continuación)
Hecho: `tools/b1.cjs` (14 documentos / 67 págs. en `out/v3`), QA ampliado en `tools/compose.cjs` (solapes de texto, contenido fuera de su caja, texto SVG recortado; prueba negativa superada), puerta de 3 direcciones por tipo de página, crítica en `reports/B1-DISENOS-POR-ENTREGABLE.md`, decisiones en `reports/DECISIONES-PENDIENTES.md`, evidencias en `evidence/v3/`.
Siguiente: B2 (robustez). Donantes privados clonados en esta sesión: impeccable, open-design, product-editorial-showcase, designer-skills; el resto no fue necesario para B1.
