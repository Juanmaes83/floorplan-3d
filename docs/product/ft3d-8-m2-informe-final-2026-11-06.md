# FT3D-8 · Misión M2 / S4 — Informe final: integración comercial profesional

Fecha: 2026-11-06 · Responsable: Claude Code 2 · **Pendiente de revisión y aprobación visual del propietario.**
Sin merge, sin Production, sin publicación de clientes y sin gasto externo.

Rama: `feat/ft3d-8-m2-s4-integracion-2026-11-06`, creada desde `master@0f9c6ea`. El SHA final y su CI se indican en
el mensaje de entrega. Auditoría previa (M2-0): `docs/product/ft3d-8-m2-0-auditoria-integracion-2026-11-06.md`.

## A. Arquitectura real

**Un solo proyecto alimenta toda la experiencia:**

```text
Biblioteca (rubik-sota-project-library-v1)  ── entrada entry.id ── sujeto {project|building, id} ── revisión SHA-256
  ├─ Analizar · Emplazamiento → site.parcel / buildingPlacement / norte (app.setSite)     [autoridad territorial existente]
  ├─ Presupuestar → presupuesto C1–C4 (rubik-budget-v1[project.id]) vía FloorPlanBudgetUI.commit
  │     └─ Precios de referencia (M1 FloorPlanCostCatalog) → mismo presupuesto, con confirmación
  ├─ Presupuestar · Plan de obra → registro M2 (rubik-construction-v1, clave entry.id|type:id)
  │     ├─ planes FT3D-8 0.2.0 (varios, uno seleccionado), tareas ↔ elementos reales + rol, partidas ↔ tareas + %
  │     ├─ revisión declarada (construction-binding 0.1.0 con huellas)
  │     ├─ historial de cambios de precio (por sujeto presupuestario)
  │     └─ historial de entregas (dlv_ + huellas congeladas)
  ├─ Evolución 4D (evolucion/ = Gate D aprobado) ← lee biblioteca + presupuesto + registro del mismo origen
  │     └─ expediente S1 (FloorPlanConstructionDossier.evaluate) → una evaluación por día: escena, Gantt, tarjeta, importes
  └─ Entregar · Evolución de obra → MP4 + HTML locales, marca Mi estudio congelada, sin publicación remota
```

**Autoridades, sin duplicados:**

| Dominio | Autoridad usada en M2 | Nota |
|---|---|---|
| Proyecto, geometría y plantas | Editor y biblioteca (lectura) | M2 nunca escribe geometría |
| Cantidades | Motores 7A/7B vía `FloorPlanBudgetDraft` | Sin cambios |
| Precios, IVA y totales | C1–C4 `FloorPlanBudget` | Ningún motor nuevo; Evolución no edita importes |
| Catálogos | M1 `FloorPlanCostCatalog` | BCCA gestionada bloqueada |
| Consulta oficial | M1 `FloorPlanCatastroWfs`, registrado en el registro territorial existente | Con búsqueda de huso |
| Parcela y colocación | `site.parcel`, `site.buildingPlacement`, norte | Interfaz de Emplazamiento existente |
| Tareas y dependencias | `FloorPlanConstructionSchedule` 0.2.0 | El motor valida; nunca mueve fechas |
| Vínculos y fidelidad | `FloorPlanConstructionProject` y expediente S1 | — |
| Evolución y Gantt | Gate D (`b12b925`), trasladado a `evolucion/` con `git mv` | Sin copias |
| Marca | `FloorPlanBrand` («Firmar con» de Mi estudio) | Sin segundo gestor |
| Entrega | `FloorPlanConstructionDelivery` 0.2.0 y muxer MP4 | Sin nuevo exportador |

**Contratos nuevos (aditivos):**
- `rubik-sota.construction-record` 0.1.0 (`js/construction-record-core.js`):
  - rechaza versiones desconocidas;
  - nunca migra en silencio;
  - límites: 6 planes, 40 entradas de historial de plan, 200 cambios de precio y 40 entregas por sujeto, 4 MiB en total.

**Dependencias entre ramas:**
- M2 incorpora Gate D y M1 (ambas de Claude Code 2, sin conflictos).
- No depende de PR #166, #167 ni #169.

## B. Código

**Commits de la rama:**

| Commit | Contenido |
|---|---|
| `85fa1fb` | Fusión de Gate D |
| `0fe80c7` | Fusión de M1 |
| `9a315de` | M2-0: auditoría |
| `9854166`, `b07e696` | Núcleo del registro (varios planes, selección explícita) y ganchos de `budget-ui` |
| `d33d757` | Plan de obra; precios de referencia; Catastro en el registro territorial; tarjetas de las áreas |
| `0b0ddd3` | Evolución en `evolucion/` alimentada por la biblioteca |
| `0a2dea3`, `912953d`, `525756d` | QA, correcciones, CI y evidencias |
| Commit de este informe | — |

**Archivos nuevos:**
- `js/construction-record-core.js`, `js/construction-context.js`, `js/construction-plan-ui.js`, `js/reference-prices-ui.js`;
- `css/construction.css`;
- `evolucion/library-source.js`;
- `tests/construction-record-core.test.cjs`, `tests/m2-s4.browser.test.cjs`;
- `.github/workflows/ft3d-8-m2-s4.yml`;
- este informe, la auditoría M2-0 y `docs/product/ft3d-8-m2-evidencias/`.

**Trasladados con `git mv`:**
- `labs/ft3d-8/{index.html, fidelity-app, project-scene, gantt-view, illustrative-props, ux-shell, delivery-ui, dossier-ui, *.css}` → `evolucion/`.
- `labs/ft3d-8/` conserva los fixtures y redirige a `evolucion/?lab=1` para QA.

**Archivos compartidos modificados** (todo aditivo; **pendientes de revisión de su responsable**):

| Archivo | Cambio | Motivo |
|---|---|---|
| `index.html` | 9 etiquetas `<script>` | Cargar los módulos M2 en la app real |
| `js/budget-ui.js` | `commit(budget)` y decoración opcional de fila | Escritura única del presupuesto real; partida → tareas |
| `js/professional-workspace-ui.js` | Un gancho de tarjetas; textos de fuentes de precio corregidos | Puntos de entrada; los textos decían que el BC3 y el CSV no estaban disponibles, y sí lo estaban |
| `js/geo-provider.js` (+ su test) | `catastro-inspire-wfs` en el registro por defecto | Activa la sección de referencia que ya existía |
| `js/territory-ui.js` | Mensajes en castellano para la consulta por referencia; colocación ofrecida justo tras guardar la parcela | Antes mostraba «parcel-not-found» y obligaba a reabrir el diálogo |
| `js/economic-dossier-ui.js` | **Corrección de un bloqueo** | Ver más abajo |
| `js/catastro-wfs-provider.js` (M1) | Opción `autoZone` | Prueba los husos oficiales solo mientras la respuesta sea «no encontrada en este huso» |
| `tests/parcel.browser.test.cjs` | El selector de fuente de parcela es visible y GML sigue por defecto | Consecuencia directa: ahora hay dos fuentes (GML y consulta oficial) |
| `tests/professional-workspace.browser.test.cjs` | Nueva frase de fuentes de precio | La frase antigua («todavía no está disponible») ya no es cierta |

La regla de producto que protege `professional-workspace.browser` (sin siglas técnicas BC3/BCCA en la vista principal de Presupuestar) **se respeta**: los textos nuevos de M2 se han reescrito para cumplirla, sin rebajar la prueba.

**Defecto de `master` encontrado y corregido:**
- **Síntoma:** con un presupuesto con precios solo en algunas partidas, abrir Entregar congelaba la pestaña.
- **Causa:** un bucle de mutaciones en el resumen C4. El texto de estado contiene « · » y se reescribía sin fin.
- **Reproducido** en un árbol limpio de `master@0f9c6ea` («BLOCKED»); en M2 responde.
- **Prueba de regresión:** `M2 · Entregar with a partially priced budget answers`.

**Riesgos de integración:**
1. Tocar archivos compartidos requiere la conformidad de sus responsables.
2. `evolucion/` sustituye la dirección del laboratorio de Gate D; las suites se han actualizado.
3. La biblioteca y el registro viven en `localStorage` por origen: una Preview no ve los datos de producción.

## C. Producto

**Recorrido:** Biblioteca → Analizar (Emplazamiento: consulta oficial, asociación, colocación) → Presupuestar (precios
de referencia, presupuesto) → Plan de obra → Evolución 4D → Entregar.

| Paso | Qué ve y hace el profesional |
|---|---|
| Presupuestar · tarjetas | «Plan de obra» (estado real: tareas, fechas, borrador o revisado, desactualizado) y «Precios de referencia» (BC3 propio, BCCA aportada, tarifa; catálogo gestionado no disponible) |
| Plan de obra | Pestaña Tareas: crear, editar, duplicar, eliminar; hitos de un día; dependencias FS/SS/FF/SF con desfase. Las fechas las pone el profesional y una dependencia incumplida se explica |
| | Elementos del proyecto con los papeles permitidos por estado (nuevo, existente, a demoler); medios de obra como ilustración |
| | Partidas con % explícito, sin superar el 100 % |
| | Pestaña Partidas: importe, tareas, elementos, pendiente, sin asignar, precio desconocido |
| | Pestaña Elementos: tareas de cada elemento o «Sin tarea» |
| | Pestaña Comprobaciones: vínculos rotos, dependencias con margen, identidad y revisiones |
| | Revisión **declarada**: nunca «aprobado» |
| | Varios planes: duplicar y «Usar este plan»; exportar e importar JSON con comprobación de identidad |
| Presupuesto (diálogo existente) | Cada partida muestra sus tareas (con %), su número de elementos y lo que queda sin asignar, con «Ver en el plan» |
| Evolución 4D | Composición Gate D intacta. Dentro de RUBIK una sola barra: Volver · proyecto · Plan de obra → Expediente → Evolución 4D → Entregar · revisión · estado · Profesional/Presentación |
| | Partidas de la tarjeta y del panel de elemento 3D → Presupuestar abierto **sobre** la evolución; al cerrar vuelven la misma fecha y tarea (se recarga si cambiaron los datos) |
| | Tarjeta: presupuesto conocido, parcial, partidas sin precio y sin asignar |
| Entregar | Tarjeta «Evolución de obra» con la última entrega «corresponde al estado actual» o «desactualizada: ha cambiado el presupuesto / el plan / la firma…» |
| | Entrega guiada Gate D con la firma de Mi estudio; MP4 y HTML locales |
| | El enlace al cliente se muestra desactivado, con su motivo |

**Comparación con Gate D aprobado:** `docs/product/ft3d-8-m2-evidencias/comparacion-gate-d/{1280x720,1366x768,1440x900,1920x1080}.jpg`.
- Izquierda: Gate D `b12b925` con fixture. Derecha: el proyecto guardado dentro de RUBIK.
- Misma composición; una barra en lugar de dos (más altura para la vivienda).

## D. Pruebas

**Resultados por suite:**

| Suite | Resultado local en Chromium |
|---|---|
| Puras: todas las del repositorio (80 archivos) | **895 de 895** (2 omitidas preexistentes) |
| Núcleo del registro M2 | 7 de 7 (incluidas en la fila anterior) |
| M2 integradas (`m2-s4.browser`) | **14 de 14** |
| Gate D en `evolucion/?lab=1` (ux4d, fit, fidelity, dossier, delivery, lab) | **49 de 49** |
| Regresión de módulos compartidos, M1 y Gate D (21 suites, 123 pruebas) | Primera ejecución: 113 de 123 (8 fallos y 2 omitidas). Tras las correcciones, las suites afectadas pasan: `parcel` y `professional-workspace` 17 de 17 dos veces seguidas |

**M2-QA:**

| ID | Estado | Proyecto sintético · evidencia |
|---|---|---|
| M2-QA-01 Misma vivienda | **PASS** | Vivienda A. Mismo `type:id` y revisión en Presupuestar, Plan y Evolución; sin texto de laboratorio; ninguna petición a `labs/` · `m2-01` |
| M2-QA-02 Catastro persistente | **PASS** (servicio interceptado) | Vivienda para emplazar. Referencia inexistente con mensaje claro; consulta, guardado, colocación explícita, recarga, mismo `site`; otra vivienda intacta · `m2-02` |
| M2-QA-03 Precio único | **PASS** | BC3 sintético de dos columnas → `PAV-ROBLE` 38,50 € con confirmación → recarga → misma partida, precio, fuente y código en Presupuestar y Plan · `m2-03` |
| M2-QA-04 Conexión bidireccional | **PASS** | Partida al 60/40 en dos tareas y cuatro elementos; partida → tarea → partida → elemento → tarea; suma = partida al céntimo · `m2-04` |
| M2-QA-05 Sincronización temporal | **PASS** | Cuatro instantes: tareas activas = motor y cursor del Gantt = fecha; dos simultáneas; tarea sin geometría en la tarjeta; importes sin doble cuenta; andamio dibujado como ilustración; vuelta desde Presupuestar con la misma fecha y tarea · `m2-05-*` |
| M2-QA-06 Dos proyectos | **PASS** | Dos viviendas con **el mismo nombre** y un edificio: A → B (modificar) → A sin contaminación; edificio con presupuestos por planta, sin total · `m2-06` |
| M2-QA-07 Revisión e invalidación | **PASS** | Precio → entrega desactualizada (presupuesto); firma → idem; muro borrado → plan desactualizado y vínculo roto; historial de entregas intacto; plan guardado de nuevo para la revisión actual · `m2-07-*` |
| M2-QA-08 Entrega auténtica | **PASS** en Chromium | HTML con la firma de Mi estudio y el proyecto correcto, sin geometría de la parcela restringida; MP4 grabado e inspeccionado (válido, `video/mp4`) y registrado; publicación desactivada · `m2-08` |
| M2-QA-09 Recorrido completo | **PASS** | Biblioteca → Analizar → Presupuestar → Plan → Evolución → Entregar; ninguna petición a `labs/` ni importación de JSON |
| M2-QA-10 Calidad visual | **PASS técnico** · aprobación visual **pendiente** | 1280×720, 1366×768, 1440×900 y 1920×1080: escena, controles, fecha, tarjeta y Gantt dentro de la ventana, sin scroll de página; móvil 390×844 sin scroll horizontal; teclado en pestañas; movimiento reducido · `m2-10-*` |

**QA-01…24 del Documento Maestro:**
- **PASS:** QA-01, 02, 03 (Gate D C), 05, 06, 07, 08 (simulado), 09, 10, 11, 12, 13, 14 (Chromium), 15, 16, 17, 19, 20, 23 y 24.
- **BLOCKED:**
  - QA-04, por DEC-06;
  - QA-18, por DEC-05 (sin publicación).
- **NOT_RUN:**
  - QA-21 (Safari, Firefox y móvil real), sin dispositivos en este entorno;
  - QA-22 (volumen), medido solo con proyectos de ~150 elementos.

**Catastro en directo:**
- En M2 se hizo una consulta pública de bajo impacto desde la app real (`3662001TF3136S`, 06/11/2026 10:21 UTC).
- El servidor de la DGC no respondió (respuesta vacía; no la bloqueó la red). La app mostró «No se ha podido consultar el Catastro ahora. Tu parcela guardada no cambia…» y no alteró nada.
- La respuesta válida del servicio oficial queda acreditada por la verificación en directo de M1 de ese mismo día.

**Rendimiento medido:**
- Suite M2 completa: 1 min 40 s.
- Apertura de Evolución desde la app: unos 2–3 s con la vivienda de ejemplo (~150 elementos).
- No se han medido proyectos grandes.

**Fallos de la regresión y qué se hizo:**
- `parcel.browser` (×3): esperaba una sola fuente de parcela. Se ajustó la prueba al cambio deseado.
- `professional-workspace.browser` (×4): frase de fuentes de precio. Se ajustó la frase de la prueba y se reescribió el texto de M2 sin siglas.
- Dos fallos intermitentes (pulsación sobre Entregar con 10 s de margen y «human review 2»). Ocurrieron con dos suites de navegador a la vez en esta máquina. En ejecución secuencial no se reproducen: 17 de 17, dos veces.
- La CI del commit `0ab35bc` detectó un conteo de elementos que incluía el andamio ilustrativo. Corregido en el núcleo: una ilustración nunca cuenta como elemento del proyecto.

**Errores conocidos:**
- La selección de elementos en la escena 3D (Gate D) está cubierta por las pruebas de Gate D; los botones nuevos de su panel (partidas, plan) no tienen prueba automatizada propia.
- La vuelta con datos cambiados recarga la evolución en la misma fecha y tarea; solo está probado el camino sin cambios.
- La pestaña «Expediente» dentro de RUBIK muestra el expediente S1 con su terminología técnica (seis comprobaciones), pensada para el profesional.

## E. Estado de los gates

| Gate | Estado | Prueba |
|---|---|---|
| M2-GATE-01 Identidad | **PASS** | QA-01, QA-06 |
| M2-GATE-02 Presupuesto | **PASS** (un motor; S2 escribe el presupuesto real) | QA-03, QA-05 |
| M2-GATE-03 Catastro | **PASS** con servicio interceptado; la respuesta oficial en directo queda acreditada por M1 | QA-02 |
| M2-GATE-04 Navegación bidireccional | **PASS** | QA-04, QA-05 |
| M2-GATE-05 Plan | **PASS** | QA-03…07 |
| M2-GATE-06 Evolución | **PASS** | QA-05, QA-10 |
| M2-GATE-07 Entrega | **PASS** local en Chromium; publicación remota no autorizada | QA-07, QA-08 |
| M2-GATE-08 Sin módulos aislados | **PASS** | QA-09 |
| M2-GATE-09 UX Perla | **PENDIENTE de aprobación visual del propietario** | Capturas y comparación |
| M2-GATE-10 Seguridad y compatibilidad | **PASS técnico**; licencias como antes (BCCA gestionada bloqueada; geometría catastral no exportada) | Pruebas puras completas, regresión, QA-08 |

**Dependencias pendientes:**
- DEC-06: presupuesto de edificio.
- DEC-07: revisión del sujeto en el presupuesto.
- Contrato de mallas de Kimi: FT8-S4-10 **PARCIAL**. La escena es la de Gate D sobre el inventario del proyecto guardado. Requisitos de interfaz: clave de elemento `levelId|project/elementId`, cajas, materiales y visibilidad por rol.
- PR #166 (Entregar): no integrada; solo descarga local.
- DEC-05: acceso de clientes.
- Evidencia legal de la BCCA.

## F. Demo para el propietario

- **Preview:** la del SHA final (mensaje de entrega). Abre `/`, la app de RUBIK.
- **Datos:**
  - Las Previews son de otro dominio: tu biblioteca de producción no aparece.
  - Usa «Ejemplo» o crea una vivienda.
  - Para la parcela, utiliza «Abrir archivo GML» o la consulta oficial cuando el servicio responda.
- **Pasos de revisión visual:**
  1. Presupuestar → «Abrir presupuesto»: pon precios a dos o tres partidas. Deja alguna sin precio.
  2. «Precios de referencia»: carga un BC3, busca, revisa la procedencia y confirma.
  3. «Crear plan de obra»:
     - Una tarea sin elementos (replanteo).
     - Dos tareas que se solapen y compartan una partida al 60/40. Asígnales muros y suelos, y un andamio como ilustración a una de ellas.
     - Un hito.
     - «Guardar plan».
  4. «Ver evolución»: reproduce, pausa, selecciona una tarea en el Gantt y pulsa una partida en la tarjeta (se abre Presupuestar). Ciérralo y comprueba que vuelves a la misma fecha.
  5. «Entregar» en la barra → firma de Mi estudio → generar → descargar MP4 y HTML.
  6. Cambia un precio y vuelve a Entregar: la entrega aparece «desactualizada».
- **Capturas** en `docs/product/ft3d-8-m2-evidencias/`:
  - escritorio, en cuatro tamaños;
  - móvil;
  - Presupuestar, Plan de obra, Emplazamiento, Evolución, Entregar e invalidación.

## G. Reversibilidad

- **Desactivar S4:** quitar las 9 etiquetas `<script>` de M2 en `index.html`. Las tarjetas desaparecen y el editor queda como en `master`.
- **Recuperar Gate D o M1:** sus ramas no se han tocado (`b12b925`, `970ca54`).
- **Revertir la rama:** `git revert` de los commits M2. No hay migraciones.
- **Datos existentes:**
  - Los proyectos y presupuestos guardados siguen siendo los mismos documentos.
  - M2 escribe el presupuesto solo con confirmación profesional y con la misma validación de Presupuestar.
  - El registro `rubik-construction-v1` es una clave nueva: puede borrarse sin afectar a proyectos ni presupuestos.
- **Compatibilidad:**
  - Proyectos 1.x y edificios, presupuestos 1.0/1.1, planes 0.1/0.2, vínculo 0.1 y manifiesto 0.2.
  - Las versiones desconocidas del registro se rechazan sin escribir nada.
