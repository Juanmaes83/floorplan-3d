# M13 · Exportación del plan de obra a Microsoft Project y GanttProject (MSPDI)

**Candidata independiente.** Base: `master@c355bdf8e5716a634a6c9835df4aec3c3b86ba3b`. No depende de M07.

## Qué puede hacer ahora una persona

En **Presupuestar → Plan de obra**, con un plan guardado, aparece el botón **«Exportar a Microsoft Project / GanttProject (XML)»**. Al pulsarlo:
- descarga `plan-de-obra-<proyecto>.mspdi.xml`;
- muestra un informe con lo que se ha exportado, cómo se ha hecho y qué no viaja.

El archivo se abre en Microsoft Project (Archivo › Abrir, XML) y en GanttProject (Proyecto › Importar › Microsoft Project).

## Reutilización (una sola autoridad de planificación)

- **Modelo:** `js/construction-schedule-core.js`, sin cambios. El exportador valida el plan con su `canonical()` y trabaja sobre una copia.
- **Exportador:** `js/construction-schedule-mspdi.js`, nuevo. Es UMD puro, sin DOM ni red, y no es un motor CPM: no recalcula fechas.
- **Interfaz:** `js/construction-plan-ui.js`, junto al botón «Exportar plan (JSON)», que sigue igual. Reutiliza `download`, `explain` y `R.correspondence` del propio diálogo.
- **Carga:** una línea en `index.html`, justo tras `construction-schedule-core.js`.

## Equivalencias (declaradas en el código y en el informe)

| RUBIK | MSPDI | Por qué |
|---|---|---|
| Días naturales UTC; tarea = días completos de inicio a fin, ambos incluidos | Calendario base propio de 7 días laborables de 8 h (08:00–12:00, 13:00–17:00). `Start` = inicio 08:00, `Finish` = fin 17:00 | Con un calendario laboral estándar, la aplicación desplazaría las tareas que cruzan fines de semana |
| Fechas declaradas por el profesional, nunca reprogramadas | `ConstraintType=4` («No comenzar antes de») en la fecha de inicio | Sin ancla, la aplicación adelantaría las tareas con holgura: cambio silencioso de fechas |
| Hito = un día y sin elementos ni partidas (mismo criterio que `construction-context`) | `Milestone=1`, duración 0, en el inicio del día | Un día con elementos es obra de 1 día, no un hito |
| `FS/SS/FF/SF` + desfase en días (puede ser negativo) | `PredecessorLink.Type` 1/3/0/2, `LinkLag` en décimas de minuto (1 día = 4800), `LagFormat=7` | Misma semántica: RUBIK exige succ.X ≥ pred.Y + desfase sobre días completos |
| `id` y `wbs` | `WBS` + campos personalizados Texto1 «RUBIK id» y Texto2 «RUBIK WBS» | Identidad trazable de ida y vuelta |
| Revisión (borrador o revisado) | `Subject` + Texto3 = `plan-estimated` / `plan-approved` | **Nunca** ejecución ni certificación: `PercentComplete=0`, sin fechas reales ni costes |
| Elementos 3D, repartos de partidas, procedencia | Notas de cada tarea | Sin equivalente en MSPDI. Se declara en el informe («No viaja: …») |

**No se inventa nada:**
- no hay importes, recursos, trabajo, avance ni fechas reales;
- sin `CreationDate` salvo que se pida;
- la moneda (EUR) es solo la que exige el esquema y no lleva importes.

## Validación

| Prueba | Tipo | Resultado |
|---|---|---|
| `tests/construction-schedule-mspdi.test.cjs` (10 + 1 de interoperabilidad) | Unitaria (Node) | **11/11**: fechas, anclaje, hitos, 4 tipos de dependencia con desfases ±, identidad, no invención, no mutación, determinismo, JSON intacto, plan inválido rechazado igual que la autoridad, texto especial, 29/02, vacío, 120 tareas |
| `tests/m13-mspdi-export.browser.test.cjs` | Interfaz real (Chromium), escritorio 1440×900 y móvil 390×844 | **2/2**: plan creado con el editor del producto, guardado, exportado; archivo, informe visible, plan guardado intacto, JSON igual, con cambios sin guardar se pide guardar |
| `scripts/interop/mspdi/verify.cjs` → `verify-report.json` | Esquema oficial + lector independiente | **9/9 planes** válidos con `mspdi_pj12.xsd` (Microsoft Office Project 2007 XML Data Interchange Schema) y releídos **idénticos campo a campo** con MPXJ 13.12.0 |
| Archivos descargados desde la interfaz (`muestras/interfaz-escritorio.mspdi.xml`) | Esquema + MPXJ | Válidos e idénticos |
| Regresión: `tests/construction-*.test.cjs` | Unitaria | 126/126 (master: 116 + 10 nuevas) |
| Guardas: manifiestos R02a/R03, cobertura de pruebas de navegador | Unitaria | Verdes |

**Herramientas usadas** (no se distribuyen con RUBIK):
- **Esquema:** `mspdi_pj12.xsd`, SHA-256 `a3e9138f…8c7b4`, copia publicada en `nasa/CertWare`. El esquema usa el espacio de nombres versionado, y Microsoft Project lee y escribe el no versionado: se valida con el espacio de nombres normalizado.
- **MPXJ 13.12.0:** SHA-256 `ee464fb0…6c135`, LGPL. Es **la misma versión** que integra GanttProject 3.4.3398 en su importador de Microsoft Project (`plugins/base/biz.ganttproject.impex.msproject2/lib/mpxj-13.12.0.jar`).

## Pendiente de validación externa (no se afirma que funcione)

**Hoja de comprobación lista:** `COMPROBACION-APLICACIONES.md`, generada con `scripts/interop/mspdi/checklist.cjs` desde los XML de `muestras/`. Recoge, fila a fila, inicio, fin, duración, hito y predecesoras (FC/CC/FF/CF con su desfase) tal como deben verse en Microsoft Project y en GanttProject, con casillas para el resultado.

La lectura con MPXJ 13.12.0 queda acreditada como **prueba del lector**, no de la aplicación. Codex incorporará la prueba unitaria al gate cuando se prepare el corte.


- **Microsoft Project:** no ejecutable en este entorno.
- **GanttProject 3.4.3398 como aplicación:** descargado de su servidor oficial (SHA-256 `aaed2498…df95a5`), pero en este entorno no se pudo ejecutar el binario. Solo se ha probado su lector (MPXJ 13.12.0).

**Recorrido de aceptación:**
1. Abrir cada archivo de `muestras/` en Microsoft Project y en GanttProject.
2. Comprobar, para `interfaz-escritorio.mspdi.xml`:
   - las 4 filas;
   - las fechas del 01/03 al 22/03/2027;
   - el hito «Entrega de llaves»;
   - la dependencia SS +4 d de «Instalaciones»;
   - que nada se mueve al abrir;
   - en Microsoft Project, la columna «Texto1» con los ids de RUBIK.

## Riesgos y límites

- Un plan aprobado cuya revisión de proyecto ha cambiado se exporta tal como se guardó, con aviso en el informe.
- Las horas 08:00–17:00 son convencionales: RUBIK no planifica por horas.
- **CI:** la prueba de navegador está en `tests/regression-partitions.json` (bloqueante). La unitaria no la ejecuta todavía ningún workflow, porque no se han tocado workflows. Para incluirla, añadir `tests/construction-schedule-mspdi.test.cjs` a la lista de `.github/workflows/ft3d-8v-schedule-core.yml`; se deja a Codex por coordinación de CI.
- **Reversión:** revertir el commit. Ningún dato guardado cambia, porque la exportación no escribe.
