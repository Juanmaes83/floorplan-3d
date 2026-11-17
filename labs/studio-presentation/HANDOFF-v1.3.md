# HANDOFF v1.3 · Studio Presentation (laboratorio). Leer ENTERO antes de tocar nada.

**Rama:** `lab/studio-presentation-e0e1` (push solo aquí). **Mandato:** `RUBIK-SOTA-PROMPT-CLAUDE-CIERRE-INTEGRAL-E0E1-v1.3.md` (lo tiene el propietario; pedírselo si no está). Spec: v1.2 revisada.
**Prohibido:** merge, PR, Production, Vercel, secretos, ramas de Codex, IA de pago, editar archivos del producto. E2 = solo diagnóstico + plan.
**Base de lectura del producto:** `master@8525025` (#243 y #244 ya fusionadas). Crear worktree aparte: `git worktree add --detach ../m8525 origin/master`.

## 1. Estado por bloque

| Bloque | Estado | Dónde |
|---|---|---|
| v1.3 P0 (atómico, selección, procedencia, grafo, verificador ZIP, preparar) | **HECHO** commit `ef1dd99` | `tools/exportar.cjs`, `verificar-entrega.cjs`, `catalogo-entrega.cjs`, `preparar.cjs`, `estampar-borrador.py`, `compose.cjs`, `entrega.cjs`, `flow.js`, `inspeccionar-paquete.py` |
| QA P0 | exportar-qa **72/72**, motor-qa **11/11** | `evidence/entrega/qa/exportar-qa.json`, `evidence/motor/motor-qa.json` |
| Diagnóstico E2 producto (solo lectura) | **HECHO**: A25 ×4, A26/H03 ×2, D02, H01/H02 ×4 combinaciones, identidad fixture (rv1 y huella FT3D-8 COINCIDEN) | `diagnostico/*.cjs`, `evidence/e2/*.json` |
| Editorial: Architecture Book | **EN CURSO** (compone, 14 págs, falta 1 lint: texto 10px «Mirador del dormitorio juvenil» en planta de estancia; revisar visualmente) | `tools/architecture-book.cjs`, derivados del producto `snapshot/derivados/ft3d3-seccion.json`, `ft3d4-fachadas.json` (`tools/derivados-producto.cjs`) |
| Editorial pendiente | Módulo 02 Concepto (capítulo `concepto` ya en catálogo, NO en la web); **inglés** de los 5 docs + web (plan: diccionario + reglas regex aplicado al DOM antes de paginar, salida `out/v3/entrega-en/`, `REG.idiomas`; gate: 0 texto español salvo datos del proyecto; cifras idénticas ES/EN); perfiles de marca (sin marca/logo/largo/contraste); ficha de trazabilidad Render IA; pilares (Dibujo vivo export, visita 3D: ausencia explícita) | — |
| QA v1.3 pendiente | consumidor por modalidad ×7 + ES/EN en 1440×900, 820×1180, 390×844, 844×390, 320px; teclado/foco/landmarks; Firefox/WebKit si instalables; postMessage emisor ajeno ignorado; rendimiento p50/p95 (repeticiones); revisión visual página a página de los 5 docs ES/EN | ampliar `tools/paquete-navegador-qa.cjs` |
| Paquetes / receta / licencias | pendiente: `package.sh` usar ZIP de reparto del exportador (ya incluye LEEME; quitar el «reparto» que añadía LEEME tras verificar); lab ZIP con saneado de rutas absolutas en copia + `SANEAMIENTO.json`; quitar creation_time de webm; receta portable (versiones Node 22, Playwright 1.63, poppler 24.02, ffmpeg, Python+Pillow+pypdf 6.17) y comando único de reconstrucción desde ZIP limpio ×2; inventario licencias (vendor/PROCEDENCIA.md ya hecho) | `tools/package.sh`, `tools/inspeccionar-paquete.py` |
| Informes / registro vivo / cierre | pendiente: registro vivo H01–H08, A01–A29, D01–D18, ST01–ST09 (columnas del mandato §1.3); actualizar `reports/00`, `07`, `09`, `10`, `11` (CORREGIR: el comparador ENT-04 YA está en `comparar/`; E2 = integrar acceso desde Entregar + A25 rótulos + A26 invalidación + H01/H02 aparte), `12`, `HANDOFF.md` (sección vigente sin rutas absolutas) | `reports/` |

## 2. Hallazgos nuevos a reflejar en informes
- Preset «primera reunión» llevaba PDF sin capítulo Documentos (corregido). Plural «1 objetos» (corregido).
- compose imprimía documentos con dos tablas paginables en una página (corregido, ahora bloquea).
- La lámina A3 decía «RUBIK no tiene motor de alzados ni secciones»: FALSO en master (FT3D-3/FT3D-4). Texto corregido en `b1.cjs` (sin commit aún).
- H06 del informe 00: revision-budget-core SÍ se carga, en `comparar/index.html` (no en `index.html`).
- A25: nota de revisión contradictoria e importes individuales visibles en estado `incoherent`; antes-sin-después descartado en silencio. A26: verify() usa estado retenido; sin aviso de obsolescencia.

## 3. Comandos
```bash
cd labs/studio-presentation
node tools/compose.cjs snapshot out/v3            # exit 2 si bloquea; no publica entrega
node tools/exportar-qa.cjs /tmp/qa                # 72 casos
node tools/motor-qa.cjs /tmp/motor                # 11 casos (~3 min)
node tools/preparar.cjs seleccion.json /tmp/prep  # flujo real de revisión
node diagnostico/e2-diagnostico.cjs ../../../m8525
node diagnostico/h01-h02.cjs ../../../m8525
node diagnostico/identidad-fixture.cjs ../../../m8525
node tools/derivados-producto.cjs ../../../m8525
bash tools/package.sh                             # (pendiente de actualizar)
```
Selección: `{"tipo","modo":"cliente|borrador","idioma":"es|en","base":{"proyecto","revision","snapshotSha256"},"capitulos"?,"documentos"?,"omitir"?:["imagenes-ia","videos"],"reconocidos"?}` (base = `out/v3/entrega/entrega.json` → project/snapshot).

## 4. Orden recomendado
1) Cerrar Architecture Book (lint + revisión visual) y recomponer; reejecutar exportar-qa. 2) Concepto. 3) Inglés. 4) QA consumidor/visual/rendimiento. 5) Paquetes+receta+reconstrucción ×2. 6) Informes, registro vivo, cierre con GO/NO-GO graduado (sin autoaprobar). Commit y push tras cada paso.
