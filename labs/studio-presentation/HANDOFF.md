# Traspaso del laboratorio Studio Presentation

## Vigente · Studio E4 / K11 (rama `lab/studio-e4-k11`, 20/11/2026)

**Base:** `78a43dc` (cierre E3, sin modificar). Contrastado con la candidata de Codex `64f8837` (`takeId`, `get` sin creación) y con master `4ea7cb3`.

**Informe:** `reports/24-E4-K11-RESULTADO-VISUAL.md`.

**Delta:**

| Archivo | Qué es |
|---|---|
| `k11/k11-core.js` | Contrato `rubik-lab-visual-result/1`, clave con `takeId`, verificación de bytes y vigencia, adaptador AISLADO de conservación, generador cancelable, textos ES/EN/ZH |
| `k11/k11-lab-ui.js` | Demostración en la copia aislada (proveedor SIMULADO, base propia `rubik-lab-k11-v1`) |
| `tools/k11-copia.cjs`, `tools/k11-qa.cjs`, `tools/k11-ui-qa.cjs` | Copia aislada y QA |
| `evidence/k11/` | JSON y capturas |

**Comandos (pin: `git archive <sha> | tar -x -C <pin>`):**

| Comando | Resultado |
|---|---|
| `node tools/k11-qa.cjs <pin-64f8837> 64f8837…` | **26/26** (también 26/26 con el pin de master `4ea7cb3`) |
| `node tools/k11-copia.cjs <pin-64f8837> <copia>` y después `node tools/k11-ui-qa.cjs <copia>` | Chromium **9/9**. Firefox/WebKit: NOT_RUN |

**Siguiente:**
1. Auditoría de ChatGPT sobre K11.
2. Codex: contrato K11-C.
3. Después, K12, Architecture Book y FF&E (no empezados).

**No tocar:** E3 cerrado (`78a43dc`) ni la candidata de Codex.

## Anterior · E3 CERRADO EN LABORATORIO y transferido a Codex (20/11/2026)

**Partida:** `e9bd6bf`. Se cierra el único residual de la auditoría: la identidad real de las tomas de vistas (`takenAt` es un `Date` y `canon()` lo colapsaba en `{}`).

**Corrección (delta mínimo):**
- `E3.vistasDesde()` normaliza la toma desde `FloorPlanProjectViews` (fecha ISO UTC con ms);
- una toma sin identidad válida no se acredita;
- `canon()` rechaza los valores no planos.

Informe: complemento §7 de `reports/23-E3-CIERRE-TECNICO.md`.

**Pruebas:**

| Suite | Resultado |
|---|---|
| `node tools/e3-tomas-qa.cjs <pin> 130ba24… --antes <e9bd6bf>` | **8/8**; antes 2/2 reproducidos |
| `node tools/e3-tomas-antes-navegador.cjs <copia> <e9bd6bf>` | Antes: misma huella con dos tomas reales. Ahora: huellas distintas |
| `node tools/e3-ui-qa.cjs <copia>` | Chromium **24/24** (UI-21: adaptador real del editor, repetir la captura caduca RP07 y no RP10) |
| Núcleo y cierre | Núcleo 23/23, cierre 46/46 (antes 8/8), F0 11/11. Firefox/WebKit: NOT_RUN |

**Transferencia:** [`HANDOFF-INTEGRACION-CODEX-E3.md`](HANDOFF-INTEGRACION-CODEX-E3.md), con archivos, destinos, parche, contratos, pruebas, gates y reversión.

**Se detiene el desarrollo de E3 en el laboratorio.** NO-GO de fusión, despliegue o activación sin Codex y D4.

## Anterior · E3 / K10 / ENT-03: cierre técnico de los hallazgos de auditoría (20/11/2026)

**Partida:** `448b3ef` (remoto comprobado). Master de contraste `130ba24` (sin commits posteriores al cerrar).

**Informe:** `reports/23-E3-CIERRE-TECNICO.md` (complementa el 22).

| Hallazgo | Estado | Corrección |
|---|---|---|
| E3-A | Reproducido y corregido | `contentId` con los bytes efectivos de las imágenes y equivalencia con `pack`/`read`/`contentIdOf`; adaptador de imágenes que no crea el almacén |
| E3-B | Reproducido y corregido | Huella canónica completa + coherencia de todas las derivaciones |
| E3-C | Reproducido y corregido | `controlador()` puro: épocas y secuencias; la interfaz solo dibuja |
| E3-D | Reproducido y corregido | Vigencia por fuente usada (vistas, marca, obra, variantes); «no comprobable» nunca es vigente |
| §8 | Reproducido y corregido | Presupuesto con tipo, validación canónica y estado «parcial»; documentos corruptos; motores por su resultado; sin rechazos sin capturar; diagnóstico solo con `RUBIK_E3_QA` |

**Comandos (pin: `git archive 130ba24 | tar -x -C <pin>`):**

| Comando | Resultado |
|---|---|
| `node tools/e3-catalogo.cjs --check` | Idéntico |
| `node tools/e3-qa.cjs <pin> 130ba24d420a2f4b26ab261313202e6070904fd8` | **23/23** (incluye F0 11/11) |
| `node tools/e3-cierre-qa.cjs <pin> 130ba24… --antes <dir>` | **46/46**, y **8/8 defectos reproducidos** en `448b3ef` |
| `node tools/e3-copia.cjs <pin> <copia> 130ba24…` y después `node tools/e3-ui-qa.cjs <copia>` | Chromium 157: **23/23**. Firefox/WebKit: NOT_RUN |

Para `--antes`, extrae el núcleo anterior con `git show 448b3ef:labs/studio-presentation/e3/{e3-core,recetas-catalogo}.js > <dir>/…`. Los pasos para Firefox/WebKit reproducibles por Codex están en la §3 del informe 23.

**Parche para Codex:** sin cambios (`e3/rubik-130ba24-e3.patch`). **Dependencias de Codex:** §4 del informe 23.

**Residual global (Codex):** el botón «Asistente» se superpone al diálogo.

**No repetir:** las suites históricas ni los D08.

**Siguiente actor:** ChatGPT, luego Codex y después el propietario. NO-GO de integración o activación.

## Anterior · E3 / K10 / ENT-03: preparación funcional en laboratorio (20/11/2026)

**Bases:** laboratorio `8c53263` (sin rebase; worktree independiente) y master `130ba24d420a2f4b26ab261313202e6070904fd8` (incluye #289).

**Informe:** `reports/22-E3-K10-ENT03-CONTRATOS-SELECTOR.md` (C1–C4, dependencias, selector, N05, Blender/Simulator, UX, §4.1 y GO/NO-GO). **Matriz de las 43 fuentes:** `reports/22b-MATRIZ-43-FUENTES.md`.

**Delta (solo `labs/studio-presentation/`):**

| Archivo | Qué es |
|---|---|
| `e3/recetas-catalogo.js` | Generado desde `tools/recetas.cjs` |
| `e3/e3-core.js` | Núcleo puro |
| `e3/e3-ui.js`, `e3/e3.css` | Tarjeta y diálogo de Entregar |
| `e3/rubik-130ba24-e3.patch` | Enganche propuesto a Codex. **No aplicado** |
| `tools/e3-catalogo.cjs`, `tools/e3-copia.cjs`, `tools/e3-matriz.cjs` | Herramientas |
| `tools/e3-qa.cjs`, `tools/e3-ui-qa.cjs` | QA |
| `evidence/e3/` | JSON y capturas |

**Comandos (pin de master fuera del repositorio: `git archive 130ba24 | tar -x -C <pin>`):**
1. `node tools/e3-catalogo.cjs --check` → idéntico.
2. `node tools/e3-qa.cjs <pin> 130ba24d420a2f4b26ab261313202e6070904fd8` → **23/23 PASS** (Node 22). Incluye el adaptador F0 11/11 sobre `130ba24`.
3. `node tools/e3-copia.cjs <pin> <copia> 130ba24…` → copia aislada (enlaces duros; el pin no cambia) y parche.
4. `node tools/e3-ui-qa.cjs <copia>` → Chromium 157 (ver `evidence/e3/e3-ui-qa.json`). Firefox y WebKit: **NOT_RUN** (no instalados en este contenedor; no se descargan).
5. `node tools/e3-matriz.cjs 130ba24…` → regenera el 22b.

**Hallazgos de master que Codex debe confirmar:**
- el proyecto abierto vive en la **entrada activa de la biblioteca confirmada**;
- `js/expediente-core.js` **no se carga** en `index.html`;
- el ejemplo recién abierto no tiene proyecto confirmado hasta «Crear mi copia»;
- `norte` ya tiene fuente (`site.northOffsetDeg`).

**Límites:**
- sin emisión, firma ni aceptación;
- la vista previa es de **composición**, no un PDF;
- emulación táctil, no dispositivos físicos;
- sin Safari real.

**No repetir:** E0/E1, D08 y las suites históricas (recetas 117/117, exportador 72/72, economía 24/24, estados 23/23, F0 11/11). Esas cifras no se atribuyen a este árbol, salvo F0 11/11, reejecutado como E3-05.

**Siguiente actor:**
1. Auditoría independiente (ChatGPT).
2. Codex: revisión de C1–C4 y del parche.
3. Propietario: D4.

## Anterior · continuidad E3 (19/11/2026)

**Base:** `0cf7c2e`, recuperada sin pérdidas. Contraste con master `dd528119`.
- **Residual N01–N08 y RP-Q01–12:** todo cerrado y acreditado. RP07 incluido. No repetir.
- **Delta nuevo:** adaptador de laboratorio hacia F0 (`tools/f0-adaptador.cjs`) y su QA, 11/11 contra el pin de master:
  `git archive dd528119 js | tar -x -C <pin>`; `node tools/f0-adaptador-qa.cjs <pin> dd528119`.
- **Informe:** `reports/21-E3-CONTINUIDAD-F0.md`. Recoge recuperación, mapa de las 43 fuentes, dependencias y peticiones a F0 (para Codex), riesgos y GO/NO-GO.
- **E3 de producción:** NO-GO hasta D4, F0.2b integrada y coordinación de contratos con Codex.

## Anterior · v1.4 ampliada (§3–§12)

**CIERRE E0/E1 (17/11/2026):** el propietario ha aceptado visualmente los entregables del candidato `ca9fcc1` (D08). Acta y huellas: informe 19 y `evidence/paquetes/distribucion-v1.4-ampliada.json`. No regenerar ni modificar los entregables aprobados. **El desarrollo autorizado de E0/E1 está terminado.** Siguen pendientes, fuera de la aceptación: escala física, Safari real y dispositivos; H08; derechos del núcleo económico. No empezar ningún corte de integración (E2–E7) sin el mandato y el GO específicos. La base estable de integración la fija la comprobación del cierre de Codex.

Mandato: `mandatos/RUBIK-SOTA-CIERRE-INTEGRAL-PROFESIONAL-v1.4-AUDITORIA-AMPLIADA.md`. Todo el trabajo autorizado está implementado; no repetir §3–§11.
Registro y dictamen: `reports/19-CIERRE-v1.4-AMPLIADA.md` (F01–F16, dossier, hoja de aceptación). Matriz: informe 16. Donantes: informe 17. Roadmap RP13–RP21: informe 18.
Pruebas (comando → resultado): `auditoria-recetas` 12/12 L · `bloques-qa [--compose]` 10/10 · `recetas-qa` 117/117 · `exportar-qa` 72/72 · `economia-zip-qa <repo>` 24/24 · `recibo-qa` 6/6 · `selector-ui-qa` 7/7 · `laminas-qa.py` ok · `impacto-qa` 5/5 · `verificar-impacto` vigente.
Paquetes (no versionados, `dist/`): `bash tools/package.sh` (cliente ES/EN + laboratorio) y `dist/economia/` (12 ZIP + digest + SHA256SUMS; regenerar con `node tools/economia-zip-qa.cjs <worktree master>`, que necesita el pin 8525025). Reconstrucción: `bash tools/reconstruir.sh dist/rubik-studio-presentation-lab.zip <carpeta>`.
Pendiente humano: hoja de aceptación del informe 19; escala física, Safari real, dispositivos; H08; licencia del núcleo económico. E2–E7 requieren GO aparte.

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
