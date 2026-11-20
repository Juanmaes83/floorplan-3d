# RUBIK SOTA — Mandato ejecutable para Codex: SCULPT OP-05 / OP-11

**Tipo:** HANDOFF + contrato de misión. **Fecha:** 2026-11-20. **Estado:** preparado para ser asignado; no significa que Codex haya ejecutado el trabajo. **Rama documental que porta este mandato:** `sculpt/op05-op11-research-handoff-20261120`. **Base documental auditada:** `floorplan-3d/master@8e917e1a70f499a6b8dc68850c8413b7d06c5682`.

## MISIÓN (copiable a Codex)

Trabaja en **`Juanmaes83/floorplan-3d`**, proyecto **RUBIK SOTA**, con **SCULPT aprobado**. Tu prioridad es **recuperar y validar bibliotecas GLB de vegetación/exterior/interior desde OpenPlan3D** y completar la clasificación de **OP-05** ya esculturada, **sin tocar producto hasta el gate que lo autorice**. No construyas otra app ni otro motor.

**Antes de cualquier cambio:** lee este documento, [investigación](01-INVESTIGACION-OPENPLAN3D-OP05-OP11-2026-11-20.md), [matriz](02-MATRIZ-CORTES-Y-GATES-2026-11-20.md), [metodología RUBIK](../../product/sculpt-metodologia-y-cartera-2026-11-10.md), [método canónico aprobado](https://github.com/Juanmaes83/SUBVENCIONES-PYMES/blob/main/docs/20-SCULPT-METHODOLOGY.md), [inventario anterior](../../product/sculpt-openplan3d-roomgpt-2026-11-18.md), [plan maestro v1.12](../../product/PLAN-MAESTRO-RUBIK-SOTA-v1.12.md), [matriz v1.12](../../product/MATRIZ-TRAZABILIDAD-v1.12.md), [README OP-05 histórico](https://github.com/Juanmaes83/floorplan-3d/blob/a722f9ddaf735d1ef45ffc17c6fbb87c2e8f43a6/labs/sculpt/op-05/README.md) y `AGENTS.md` **solo si existe**. No asumir que el archivo existe en `master`: a 20/11 no se encontró en raíz/ `docs` / `docs/product`.

**Gobierno:** este mandato autoriza lectura, auditoría, extracción controlada y LAB aislado según contratos; **NO autoriza merge, Production, gastos, compras, uso de IA de pago, cambios de prioridades, actualización masiva de dependencias ni activación pública de nuevos GLB**. Conserva trabajos abiertos de Claude y otros agentes; no modifiques ramas ajenas ni elimines worktrees. Si surgiera conflicto o cambio de alcance, documenta y solicita autorización.

### Etapa 0 — Estado real, base y SOURCE EXACT (obligatoria; no reescribir historia)

1. `git status -sb`, `git branch -vv`, `git worktree list`, `git rev-parse HEAD`, `git fetch origin` (sin reset forzado); registra el SHA actual de `master`, PR abiertas y diferencias desde `8e917e1a`.
2. Comprueba que `sculpt/openplan3d-fuente` tiene `labs/sculpt/openplan3d-771c9e1` + `MANIFEST.sha256`/`PROCEDENCIA.md`; usa la copia fiel si es válida. Si algo falta, HOLD y explicar; **no clonar todo el repo por reflejo**.
3. Comprueba el LAB OP-05 en `a722f9ddaf735d1ef45ffc17c6fbb87c2e8f43a6`; conserva 64 rutas y su evidencia (73/73 baseline, 1/1 Chromium, 5/5 admisión históricos). Confirma qué está implementado hoy en `master`, qué está en rama y qué sigue pendiente, sin atribuir pruebas históricas al HEAD actual.
4. Fija los donantes exactos `laanlabs/openPlan3D@771c9e1ad30bd1c3cc7584d6eca74deb2e14943d` y, **como fuente independiente posterior**, `laanlabs/openlandscape3d-cloud@f70ff716d1bf30208046d43d319d2972b2254334`. Evita usar HEAD flotante al seleccionar archivos.
5. Audita Git tree, manifest, licencia de código MIT, licencias Kenney CC0, y `docs/furniture-provenance.json`. Para cada candidato del lote, recalcula SHA-256 y contrasta la procedencia. Verifica que los 204 GLB de catálogo y 1 fixture **no son automáticamente 205 recursos admitidos**.
6. Selecciona **un worktree y rama LAB propios** con base efectiva de `origin/master` (p. ej. `codex/sculpt-op11-source-isolate-20261120` si está libre); esta rama documental sirve para **leer**, no para mezclar a ciegas ni reescribir `master`.
7. Primera salida: mapa de fuente, dependencias, hashes, derechos, baseline que realmente puedes ejecutar, estado de OP-05 y riesgos. Si el alcance del origen no es verificable, **STOP + BLOCKED**, no fabricación de evidencias.

### Etapa 1 — SCULPT OP-11 C1/C2: lote piloto de 12 GLB

1. Crea o reutiliza una zona de laboratorio `labs/sculpt/op-11/` o estructura consistente con los laboratorios actuales; reserva la fuente exacta sin modificar, y separa toda adaptación.
2. Inventaría **64 GLB Nature Kit** y **4 GLB de plantas interiores**, sin admitirlos todavía. Ejecuta `SOURCE → ISOLATE → CLASSIFY` para los **12 modelos piloto** definidos en la matriz: 3 árboles/palmeras/coníferas, 2 arbustos, 1 flor, 1 césped, 1 roca, 1 valla, 1 maceta, 2 plantas interiores.
3. Clasifica dependencias en KEEP / GENERALISE / OPTIONALISE / REPLACE / REMOVE; prueba la baseline original (scripts/pruebas del donante que realmente cubren estas familias) **antes de editar**. Si no se puede ejecutar, NOT_RUN y motivo explícito. No afirmar que 73/73 de OP-05 valida OP-11.
4. Modela solo **adaptadores de laboratorio** hacia `js/asset-loader.mjs`/`js/asset-catalog.js`/`js/asset-ui.js` y F3. Reutiliza `View3D`, `project-core`, historial, catálogo de licencias y presupuesto. No importar Svelte, stores, rutas Firebase ni Three vendorizado.
5. Normaliza dimensiones (donante en cm; RUBIK utiliza mm en contratos de catálogo), ejes, pivote, rotación, unidades glTF, orientación de apertura/altura, materiales y fallback. **No afirmar medidas reales si proceden solo de geometría de malla no calibrada.**
6. Pruebas positivas y negativas para bytes/SHA/licencias, GLB corrupto, archivos sin recursos, materiales/extensiones no admitidas, límites F3 y memoria, decodificación, liberación, duplicación, mover/rotar/escalar, undo/redo y resolución al reabrir. Las pruebas de persistencia solo deben usar mecanismos existentes o laboratorio; NO escribir datos de usuario fuera de la autoridad.
7. Produce demo de laboratorio y evidencia visual antes/después con escenas de 1, 12 y lote instanciado, escritorio y móvil, tiempos/memoria. No publicar preview si revela GLB privados ni datos de cliente. Validación visual humana requerida para calidad.
8. **Salida de etapa:** PR draft **sin merge** o rama lab verificable, `MANIFEST`, licencia/procedencia, CLASSIFY por archivo, resultados test PASS/FAIL/SKIP/NOT_RUN, capturas/preview, decisiones KEEP/ADJUST/REJECT y riesgos.

### Etapa 2 — OP-11 C3/C4: exterior procedural + símbolos vectoriales

1. Compara las 13 fichas `Outdoor Furniture` del donante con los **cinco GLB exteriores conocidos de F3**, sin afirmar que todas las 13 fichas tienen un GLB. Identifica valor diferencial real (sombrilla, vallas, mobiliario, piscina, estructuras) vs duplicados.
2. `furnitureModels3d.ts` es una **fuente de constructores procedurales**. Esculpir únicamente algoritmos necesarios y probados como auxiliares del renderer actual; no copiar un renderer 3D completo ni el catálogo.
3. Recupera, si pasa CLASSIFY, los **12 símbolos 2D** de `entourageCatalog.ts`: 2 personas, 3 vehículos, 6 plantaciones, 1 parasol; preservar escala, rotación, bounds, exportaciones SVG/PNG/PDF/DXF y undo donde corresponda.
4. **NO llamar GLB a los símbolos**. Personas 3D y coches 3D permanecen `HOLD` sin otro donante acreditado y consentimiento/derechos adecuados.
5. Cada mejora tendrá gate independiente, sin activar UX visible antes de Preview + HUMAN REVIEW.

### Etapa 3 — OP-11 C5/C6: investigación separada, no integración implícita

1. Investiga `openlandscape3d-cloud@f70ff716` como **donante nuevo** con su licencia, dependencia y snapshot propios. Contrasta `groups.ts`, `plantModels.ts`, `scene/build.ts`, `io/openplan.ts`, `plants.json` (250 fichas), `materials.json` (36 fichas).
2. Evalúa solo delta incremental de distribución determinista, vegetación procedural, superficies y exportación. No crear otro editor de parcelas ni importar fichas para España sin fuentes botánicas verificadas. `terrain: points` no demuestra topografía 3D; verificar la implementación `buildGround` plana.
3. Separa OP-11/C6 personas/vehículos 3D como `SOURCE DISCOVERY / HOLD`. No buscar ni traer paquetes externos aleatorios sin registrar licencias y consentimiento.
4. **Salida:** informe CLASSIFY y propuesta de siguiente gate; no merge.

### Etapa 4 — OP-05: desbloqueo por F0 sin atajos

1. Usa el lab ya existente `labs/sculpt/op-05/` y su contrato `private-glb-references.md`.
2. Comprueba las PR reales de F0.2c/F0.3 y la autoridad confirmada. **NO fusionar ni acoplar OP-05 a trabajo inestable**. Si F0.2c/F0.3 aún no están acreditadas, mantén `HOLD` para conexión productiva.
3. Cuando haya base autorizada, preparar delta separado para bytes privados por SHA, referencias coherentes, permisos, cuota, recogida, undo/versiones/backup/reapertura, export pública genérica y revocación. Sin datos reales de clientes en pruebas.
4. No asumir que el límite 16 MiB del donante sustituye 8 MiB del perfil técnico F3; analizar antes de elevar un límite y nunca hacerlo en este mandato.
5. **Salida:** análisis de brecha y contrato de integración condicionado; NO desplegar GLB propios.

## Entregables exigidos

- Inventario `SOURCE/PROVENANCE` por fichero, donante, SHA, licencia/pack, hash, dependencia, capacidad original, referencia RUBIK y estado.
- Matriz `CLASSIFY` exhaustiva para archivos utilizados, con decisiones justificadas.
- Diferencial RUBIK-vs-donante (no duplicados), arquitectura de adaptadores y riesgo de ruptura.
- Resultados de baseline original y adaptaciones, **separando HISTORICAL / PASS / FAIL / SKIP / NOT_RUN** por commit.
- 12-modelos piloto con QA de admisión + comparativa visual y negativa (o bloqueos concretos); no prometer versión integrada.
- Mapa de dependencias F0.2c/F0.3 y OP-05; plan de revert.
- Rama/PR draft no fusionada, enlace verificable, estado limpio y gates pendientes.
- Un `HANDOFF` final que diga explícitamente: **(1) integrado en master, (2) desarrollado sin integrar, (3) no desarrollado, (4) HOLD**, y qué decisión le corresponde a Juanma.

## Reglas absolutas de seguridad, calidad y coordinación

- No modificar `master`, ramas/worktrees ajenos, producción, dominios, gastos ni secretos. No ejecutar `git reset --hard`, `push --force`, `npm audit fix --force`, merges sin autorización.
- No sustituir `project-core`, persistencia F0, `View3D`, F3/Asset Lab, historial, catálogo ni exportadores existentes; una única autoridad por dato.
- No producir falsa precisión física, botánica ni de construcción. Nada de caracteres/vehículos 3D no existentes ni de topografía fotorrealista inferida.
- No omitir licencias: código MIT de OpenPlan3D, Kenney Nature/Furniture CC0 por pack con SHA por activo y obligaciones de otros archivos individuales.
- No marcar `PASS` por ver un fichero o citar un informe. Ejecutar o declarar `NOT_RUN`.
- Una aceptación de SCULPT/no licencia no da permiso de fusionar ni publicar a clientes. `MERGE` y `PRODUCTION` exigen decisiones expresas separadas.

**ORDEN DE EJECUCIÓN:** `Etapa 0` primero; si pasa, `Etapa 1` piloto; documentar los demás subcortes como backlog propuesto. **No desviar la prioridad de Codex sobre otros carriles activos sin mandato explícito del propietario.** Un resultado parcial verificable y reversible vale más que forzar fases con evidencia insuficiente.
