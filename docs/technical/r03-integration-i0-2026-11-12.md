# SCULPT-R03 — Corte de integración I0: núcleo puro, sin interfaz
**Fecha de corte:** 12/11/2026 · **Estado:** CANDIDATO EN DRAFT; NO INTEGRADO · **Autoridad:** propietario para aprobar cada merge.

## 0. Trazabilidad y alcance de la autorización
- [Laboratorio #194](https://github.com/Juanmaes83/floorplan-3d/pull/194), HEAD de código de referencia `fc5a4224f2a48be2f18cdb3a701240e21bd2269f`; seis workflows verdes en su SHA.
- El propietario ha aprobado visualmente las tres vistas de puertas, los dos escenarios conflictivos, la carga de la Preview y, **según su declaración**, las pruebas humanas A (cerradas/ocultas/abiertas) y B (M1 dividido y unido sin incidencia). Acta A/B en #194. **No afirmar prueba humana de C**.
- Preview aislada navegada: `/review-r03/index.html` de la rama temporal `review/sculpt-r03-interactive-20261112`. Esta rama de visualización **nunca se fusiona**.
- Decisión actual: **preparar integración real por cortes**. No hay permiso para fusionar todo #194 ni publicar armarios en RUBIK.

## I0 — Qué contiene esta PR y qué NO contiene
**Sí:** una copia trazable del motor puro esculpido como `js/r03-cabinet-core.js`, con únicamente la cabecera de procedencia ajustada; licencia/atribución preservada en `docs/licenses/r03-donor-MIT.txt`, y pruebas puras en `tests/r03-integration-core.test.cjs`, con workflow específico de CI.

**NO:** carga del script en `index.html`, botones visibles en el editor, cambios a `FloorPlanProjectV1`, escritura de proyectos, almacenamiento, JSON Patch, exportación, render 3D productivo, precios ni ventas. El motor no se ejecuta en el producto por existir en `js/`. Este corte es **código real y verificable**, pero no una nueva funcionalidad del usuario hasta I1/I2/I3.

**Prohibido por este corte:** merges de #194, #192 o #195; modificaciones de `master`, Production, configuración global de Vercel, Preview temporal o nuevas piedras/olas. Mantener la exclusión de `labs/`.

## Gate de integración de I0
1. Demostrar en el diff: solo nuevo núcleo puro, pruebas, aviso legal y esta documentación; `index.html`, esquemas, runtime y rutas sin cambios.
2. Exigir CI verde en el **HEAD final de esta PR** para el workflow `R03 I0 - pure core gate`; revisar también checks de regresión que GitHub dispare.
3. Auditar no-mutación, rechazo atómico de operaciones inválidas, estados de puertas, división/unión, límites y datos asumidos. Las pruebas de I0 son complementarias; la paridad profunda con el donante y los 98 tests originales siguen en el expediente #194 y **no se imputan automáticamente** al nuevo corte.
4. Antes de autorizar publicación de este código en `master`, ratificar GOV-05 **para destino de producto**, conservando MIT y avisos. El expediente R03 de laboratorio no es dictamen jurídico general; quedan riesgos residuales de interpretación de la aportación PR #11.
5. Autorización humana **específica del merge I0**; al llegar a `master` puede disparar despliegue automático en Vercel aun sin UI nueva. Comprobar Production y documentar el SHA.

## R03-I1 · Contrato de interiores — propuesta, NO DECIDIDA
**Recomendación técnica a someter a decisión:** extensión canónica opcional y versionada de `objects[]` en `FloorPlanProjectV1`, asociada a cada armario (no duplicar los objetos). Comparar con las alternativas `extensions.x-r03-cabinet` lateral/en el proyecto y `no persistir`. La forma y nombre definitivo, versión minor, compatibilidad en edificios multilevel y persistencia JSON/ZIP requieren aprobación explícita.

Archivos a revisar al decidir I1: `docs/contracts/FloorPlanProjectV1.schema.json` **y** `js/project-schema.js` sincronizados, `js/project-core.js`, `docs/contracts/FloorPlanProjectV1.md`, `docs/contracts/CHANGELOG.md`, tests `tests/project.test.cjs` y `tests/schema.test.py`; incorporar pruebas de round-trip, eliminación, legacy, desconocidos future V1, inválidos NaN/Inf, compatibilidad `building`, alzado y medidas.

**Bloqueo real acreditado:** hoy `$defs.object.additionalProperties=false` y `CabinetEvidenceV1.previewDiff` marca interior bloqueado; no se debe introducir un campo implícitamente.

## R03-I2 · Editor y UX — posterior a I1
Solo después de decidir I1, adaptar el flujo del mueble seleccionado para `wardrobe`, `cabinet`, `shoecab` y los tipos que realmente admita el catálogo. La UI debe mostrar módulos, baldas, barras, cajones, estados de puertas, cotas y errores; aceptar cambios de manera atómica y reversible, y conservar el proyecto existente. Puertas y módulos A/B están aprobados **en laboratorio**, no dentro de la interfaz principal.

**Prueba C humana todavía pendiente:** editar en cada módulo valores válidos de baldas, barra y cajones, comprobar alzado/3D; introducir baldas muy próximas o barra en conflicto, verificar rechazo visible, ausencia de cambios parciales y Restablecer; probar al menos escritorio y móvil.

## R03-I3 · Representación 3D y coherencia geométrica
Decidir reutilizar `cabinet-model.js` del laboratorio (con obligaciones MIT) frente a adaptar el 3D existente. La implementación actual en `index.html` usa geometrías tipo `wardrobe/cabinet/shoecab` con alturas base 2200/850/1000; **cuando `size.heightMm` existe hay reescalado general**, pero ese escalado **no modela** por sí solo baldas, cajones ni alturas interiores reales. Por tanto, comprobar alturas explícitas, `elevationMm`, escalado, orientaciones, puertas abiertas y coherencia planta/alzado/3D. La referencia vertical debe proceder del proyecto/R02-A; no deducir alturas de techo.

**No resuelto:** bisagras reales, apertura mayor que 90°, herrajes, resistencias, tolerancias, colisión con otros niveles, adecuación para fabricación, pedidos y CAT-03. El sector experimental y el cuadrado conservador no son autoridades intercambiables.

## Dependencias y decisiones pendientes
- **GOV-05**: uso en producto, atribución literal y riesgo de derechos residuales.
- **Contrato versionado I1**: elección consciente entre extensión canónica, documento lateral o no persistir; ningún automatismo.
- **3D I3**: donante frente a renderer existente; tratamiento de dimensiones y alturas.
- **Prueba humana C + móvil**: imprescindible antes del GO funcional.
- **Prioridad/ID maestro**: el catálogo 1.10 de #192 todavía en Draft; R03 no es CAT-03.
- **Riesgos de producto**: no generar presupuestos ni instrucciones de fabricación.
- **Control de rama**: I0 desde `master@75615fdc6c96e7c43e52b13a24950b9652706f7d`; #194 sigue Draft. El merge del corte I0 no autoriza I1/I2/I3 ni la fusión del laboratorio completo.

## Criterio de cierre
**I0 GO técnico** = core puro y test CI verde en HEAD final + derechos/alcance ratificados. **I0 GO merge** = decisión expresa del propietario. **R03 GO en RUBIK** = I1/I2/I3 integrados secuencialmente, Prueba C y móvil, sin regresiones y verificación del despliegue. Nunca describir un GO humano visual de laboratorio como integración productiva.
