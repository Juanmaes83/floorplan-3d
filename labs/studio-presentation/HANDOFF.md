# Traspaso del laboratorio Studio Presentation

## Vigente · v1.4 auditoría ampliada (en curso)

Mandato: `mandatos/RUBIK-SOTA-CIERRE-INTEGRAL-PROFESIONAL-v1.4-AUDITORIA-AMPLIADA.md`. Base: el candidato v1.4 de la sección siguiente sigue siendo válido y no se repite.

**Hecho en este bloque:** auditoría §3 con oráculo independiente sobre los PDF finales: `node tools/auditoria-recetas.cjs` → `reports/16-AUDITORIA-RECETAS-v1.4.md` y `evidence/recetas/auditoria-completitud.json`.
Resultado: **2/12 recetas L completas documentalmente** (RP05, RP07). Incompletas: RP01 (alcance de servicios, validez), RP02, RP04 (precio, impuestos de compra), RP06 (concepto, moodboard), RP08 (plan de obra, oferta técnica, exclusiones, vínculo), RP09, RP10, RP11 (catálogo, precios verificados), RP12 (presupuesto revisado); RP03 sin documento propio. La fase P no tiene ninguna receta L en los seis perfiles (6/18 combinaciones).
Nota de alcance: `revisionAnterior`, `variantesGuardadas`, `dimensionesHuecos` y `fotosAportadas` dependen de E2/E4; marcarlos «corte» y no implementarlos. El resto (RP01, RP04, RP06, RP08, RP10, RP11, RP12) es el trabajo §4 con fixtures sintéticas rotuladas.

**§4 HECHO (ejecución definitiva, 17/11):** `tools/bloques-receta.cjs` compone bloques RP01 (alcance, servicios, honorarios separados del coste, exclusiones, validez), RP04 (compra, impuestos y reforma por autoridad, sin sumar), RP06 (concepto y referencias de vistas propias atribuidas), RP08 (oferta técnica, exclusiones, plan disponible; vínculo plan–presupuesto declarado ausente), RP10 (memoria descriptiva con finalidad), RP11 (fichas de catálogo: genérico/referencia/elegido/instalado, precio solo verificado), RP12 (estado de revisión y condiciones) desde `snapshot/aportaciones.json` (fixture rotulada; solo campos válidos y de la misma revisión). `entrega.json → aportaciones` registra campos compuestos y huella; el resolvedor cuenta solo lo compuesto. ES/EN con gate a cero. Oráculo corregido (valores exactos ES/EN, documentos heredados de RP03, corte E2/E4 declarado): **12/12 L completas documentalmente**. QA: bloques 8/8, recetas 117/117, exportador 72/72.

**Siguiente (tras §4):** §5 en adelante del orden de abajo.

**Siguiente, en orden:** (1) §4 bloques documentales RP01/RP04/RP06/RP08/RP10/RP11/RP12 en `tools/b1.cjs`/`compose.cjs` alimentados por aportaciones rotuladas (el resolvedor `tools/recetas.cjs` ya las recibe y hoy las ignora), con casos presente/ausente/parcial/incompatible/obsoleto, y reejecutar `auditoria-recetas.cjs` hasta que cada L represente sus campos o declare su corte; (2) §5 seis escenarios económicos por el recorrido real del exportador + ZIP/digest; (3) §6 recibo de receta; (4) §7 FF&E y QA tipográfico de todas las láminas; (5) §8 localización del selector; (6) §9 inventario de Skills for Architects (pin a9c4355) y donantes; (7) §10 RP13–RP21; (8) §11 negativos N08; (9) §12 registro F01–F16, paquetes, dossier y hoja de aceptación; dictamen.

## Anterior · traspaso del candidato v1.4

Rama exclusiva `lab/studio-presentation-e0e1`. Candidato empaquetado `26297e7b67b7c3c497ce3761b5bbf3f72f0b61da`. El commit posterior de la rama contiene este handoff y el acta de distribución. Base de lectura de producto `master@8525025a1470d48d52d8e365070e5a0acf116134`.

### Estado comprobado

- Mandato v1.2 recuperado byte a byte. Índice acumulativo en `mandatos/INDICE-MANDATOS.md`. Registro de H/A/D/ST anterior preservado en los informes 12 y 13. El informe 15 registra N01–N08, V13-01–09, CONT-01–03 y RP-Q01–12.
- Recetas 117/117, exportador 72/72, motor 11/11 y estados 23/23. Chromium, Firefox y WebKit: 14 paquetes y 70 aperturas por navegador. ZIP de cliente exactos ES/EN probados sin red en seis configuraciones cada uno. Escala de dispositivo al 200 % emulada.
- Architecture Book ES/EN: 11 destinos internos, 9,63 pt de escala y 9,49 pt de rótulos del plano general. FF&E: 46 instancias en 40 fichas y ensayos de 1/50/200/500 fichas. 114 páginas ES/EN revisadas por el agente.
- N04: seis escenarios con salida canónica, 12 pares HTML/PDF de fixture ES. Propuesta e inmobiliaria conservan importes y avisos. El núcleo se ejecuta desde el pin de producto de solo lectura. Su licencia de redistribución no consta.
- Tres ZIP verificados. Dos reconstrucciones limpias del ZIP de laboratorio pasaron, con 42 rutas PDF, 20 medios, QA, snapshot e idiomas comprobados. La fecha interna de PDF es la única variación binaria aceptada.
- El repositorio contiene código, composición, informes y evidencias. Los ZIP y digest de distribución son archivos locales de `dist/`. `evidence/paquetes/distribucion-v1.4.json` identifica tamaños, huellas y candidato. La comparativa de páginas está en `evidence/revision-visual/v1.4/`.

### Pendientes y siguiente paso

1. Revisar con el propietario los ZIP ES/EN y aceptar visualmente las páginas (D08). Las pruebas de dispositivos y de impresión a escala física siguen pendientes.
2. Si se requiere completar RP-Q06, añadir QA de ZIP por cada escenario económico a partir de fixtures rotuladas, preservando el exportador y la identidad. La licencia del núcleo debe acreditarse antes de redistribuirlo. Hoy puede comprobarse con `node tools/economia-qa.cjs <checkout-con-el-pin-de-producto> <evidencia.json>`.
3. H08 queda en manos del propietario. Hay 68 archivos VIS en Git público en el pin examinado. Las exclusiones de deploy y la licencia deben decidirse por separado. El banco VIS está fuera de los paquetes.
4. `reports/11-PROPUESTA-E2.md` conserva diagnóstico, gates y rollback E2–E7. E2 requiere GO separado y una base acordada. No modificar producto, ramas de Codex, producción o Vercel desde este laboratorio.

Para comprobar la entrega desde el laboratorio, en Linux con `RECETA.md`: `bash tools/reconstruir.sh dist/rubik-studio-presentation-lab.zip /tmp/reconstruccion`. Si no están disponibles los ZIP locales, usar el candidato empaquetado y preparar el entorno de la receta antes de ejecutar `bash tools/package.sh`. Verificar siempre la huella nueva. Conservar la carpeta de trabajo si falla un caso.

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
