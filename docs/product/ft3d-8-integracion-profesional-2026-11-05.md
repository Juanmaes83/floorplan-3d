# FT3D-8 · Fase E — Propuesta de integración profesional (SOLO DOCUMENTO)

**Estado:** propuesta. No se ha implementado ninguna integración. No se ha tocado `index.html`, Entregas, el visor ni `master`.

## 1. Pantallas propuestas

### E1 · Presupuestar → Plan de obra
1. **Selector de plan:** muestra los planes del proyecto activo (biblioteca local y vínculos `bnd_*`). Opciones: «Nuevo plan», «Duplicar» y «Importar».
2. **Tabla de tareas:** WBS, título, inicio, fin, dependencias (con el tipo FS/SS/FF/SF y el desfase) y fuente. La validación en vivo usa `Schedule.validate`, mostrando el error en castellano junto al campo. Las fechas no se mueven solas.
3. **Panel «Elementos»:** el plano 2D del proyecto (reutilizando el 2D existente) con selección de muros, huecos y recintos. Se asigna un rol visual a la tarea, con los roles filtrados por ciclo de vida según `ROLE_RULES`.
4. **Panel «Partidas»:** las partidas del presupuesto C1–C4 del proyecto, con el porcentaje por tarea. La barra de cada partida muestra asignado / pendiente / sin asignar. No se proponen porcentajes automáticos.
5. **Cobertura:** `evaluate().coverage` con las listas de carencias. El botón «Aprobar plan» solo se activa en el nivel `approved-plan`; al aprobar se crea un vínculo `reviewed` con las huellas actuales.
6. **Estado:** «Borrador» o «Aprobado por X el día Y», más los avisos de obsolescencia cuando cambia el proyecto o el presupuesto.

### E2 · Entregar → Evolución de obra
1. Un **snapshot** congela el proyecto, el plan, el presupuesto, la marca y el vínculo (huellas SHA-256).
2. El visor timelapse sobre la geometría del proyecto, idealmente usando el contrato de mallas del visor oficial (ver la dependencia con Kimi).
3. El Gantt sincronizado, con hitos, tareas, fechas y la tarjeta económica con estados (revisado, no verificado, parcial, desconocido).
4. Un pie obligatorio: «Simulación planificada e ilustrativa: no es obra ejecutada ni certificada», el nivel de entrega y las `assurances`.
5. **Exportación:** enlace compartible a través de la infraestructura de Entregas (PR #166) y vídeo con `tour-video-ui.js`, avanzando el cursor día a día de forma determinista.

### E3 · Mi estudio
- Se reutilizan `FloorPlanBrand` y `FloorPlanBrandUI`. El entregable guarda `FloorPlanBrand.snapshot(...)` en el momento de generarse, así que un cambio posterior del perfil **no altera** los entregables ya hechos.
- La atribución «Generado con RUBIK» se mantiene, junto a la del estudio.

### E4 · Sistema Perla
| Elemento | Laboratorio actual | Integración |
|---|---|---|
| Superficies | `lab.css` propio; `fidelity.css` ya usa `#eceeee`, `#1f5a66` y `#2b3034` | Usar `var(--surface-app)`, `--surface-panel` y `--surface-sunken` de `css/design-system.css` |
| Acción / selección | naranja (demo) o teal (fidelidad) | `--action`, `--action-hover` y `--select`; la selección del Gantt pasa a `--select-soft` |
| Tipografía | Inter/Helvetica + monospace del sistema | La jerarquía del sistema de diseño; monospace solo para cotas e IDs |
| Botones y estados | propios | Los componentes `.btn` y `.chip` del editor, con `aria-pressed` |
| Foco | por defecto del navegador | El anillo `--focus` (`:focus-visible`) |
| Contraste | sin auditar | Comprobar AA en la tarjeta oscura y en las etiquetas del Gantt |
| Móvil | sin desplazamiento horizontal (comprobado en la prueba) | Mantener el Gantt con desplazamiento interno |

**Regla:** los colores de la interfaz **nunca** cambian los materiales de la vivienda. Los colores del edificio vienen del proyecto o de los valores por defecto del visor, con su etiqueta.

## 2. Contrato del entregable (E5)

```json
{
  "schema": "rubik-sota.construction-delivery", "schemaVersion": "0.1.0",
  "id": "dlv_…", "generatedAt": "ISO-8601", "generatedBy": {"studio": "<FloorPlanBrand.snapshot>", "person": "…"},
  "project": {"type": "project|building", "id": "prj_…|bld_…", "name": "…", "fingerprint": "<sha256>", "updatedAt": "…",
              "scale": [{"levelId": null, "status": "verified|estimated|pending"}]},
  "plan": {"id": "sch_…", "fingerprint": "<sha256>", "status": "plan-estimated|plan-approved", "reviewedBy": "…", "reviewedAt": "…"},
  "budget": {"id": "bud_…", "fingerprint": "<sha256>", "knownNet": 0, "complete": false, "revisionCheck": "unverifiable|match|mismatch"},
  "binding": {"id": "bnd_…", "status": "draft|reviewed"},
  "coverage": "<evaluate().coverage>",
  "unavailable": "<inventory.notInAuthority + elementos no representables>",
  "sources": ["FloorPlanCore.geometry", "FloorPlanRoof", "FloorPlanBudget C1–C4", "FT3D-8 0.2.0"],
  "warnings": "<evaluate().issues>",
  "delivery": {"level": "internal|orientative|approved-plan|professional", "label": "…", "assurances": {"…": "…"}},
  "simulation": "Simulación planificada e ilustrativa: no es obra ejecutada ni certificada"
}
```

Reglas:
- Un entregable de nivel `professional` solo se genera si `evaluate()` lo permite.
- El documento es inmutable: una revisión nueva da lugar a un entregable nuevo.

## 3. Flujos de usuario

1. **Profesional:** Presupuestar → Plan de obra → asignar elementos y partidas → revisar la cobertura → aprobar (crea el vínculo) → Entregar → Evolución de obra → previsualizar → generar el snapshot y el enlace.
2. **Cambio de proyecto tras aprobar:** el plan y la entrega pasan a «obsoleto», con un aviso. El profesional vuelve a revisar y a aprobar, lo que crea un vínculo nuevo.
3. **Cliente:** abre el enlace y ve el timelapse, el Gantt y los costes con sus estados y advertencias, con la marca del estudio.

## 4. Contratos técnicos y archivos afectados

| Archivo | Cambio futuro | Propietario / coordinación |
|---|---|---|
| `js/construction-*.js` | Ya existen; se cargan en `index.html` | FT3D-8 (esta rama) |
| `index.html` (visor `View3D`) | Exportar un `buildArchitecture`/`archInspect` de solo lectura por elemento | **Kimi** y el propietario del visor |
| `js/budget-ui.js` | Pestaña «Plan de obra» | Claude original / propietario |
| Entregas (PR #166) | Tipo de entrega «Evolución de obra» + snapshot | **Claude original** |
| `js/project-library.js` | Guardar planes y vínculos junto a la entrada (clave aparte, sin tocar el proyecto) | Coordinación |
| `css/design-system.css` | Solo consumo de tokens | — |
| `js/brand-core.js` | Solo consumo de `snapshot` | — |

## 5. Dependencias y riesgos

- **Visor:** sin el contrato de mallas, el timelapse reproduce las reglas del visor y puede desalinearse si el visor cambia. La prueba de fidelidad lo detecta, pero habrá que mantenerla.
- **Presupuesto por planta:** hace falta una decisión de producto para presupuestar edificios: un presupuesto por planta repartido entre tareas, o un presupuesto de edificio. Hasta entonces, un edificio no tiene costes en FT3D-8.
- **Revisión del presupuesto:** sin un campo `subject.revision` en C1–C4, el emparejamiento seguirá siendo declarado y no verificado. Añadirlo requiere modificar `budget-core.js`, cosa que este encargo no autoriza.
- **Escaleras y huecos de forjado:** pendientes.
- **Rendimiento:** los proyectos grandes (cientos de muros) implican miles de mallas. Habrá que fusionar o instanciar por material, como ya hace el visor con `primitiveBatching`.
- **Privacidad:** los proyectos importados solo se procesan en el navegador; las entregas compartidas se rigen por las reglas de Entregas.

## 6. Despliegue

1. Rama de integración propia a partir de `master`, una vez se fusionen Entregas y Kimi.
2. Bandera de función «Plan de obra (beta)», desactivada por defecto.
3. Previews de Vercel por commit, más la prueba de fidelidad contra el editor en la CI.
4. Producción solo con la aprobación expresa del propietario.

## 7. Pruebas futuras

- Fidelidad contra el visor oficial mediante el contrato de mallas, con igualdad de cajas por `elementKey`.
- Proyectos reales anonimizados, con la autorización expresa del propietario.
- Accesibilidad AA y uso solo con teclado.
- Vídeo determinista con la misma huella SHA en dos ejecuciones.
- Regresión de snapshots: si la marca cambia después, el entregable no cambia.

## 8. Condiciones de aprobación

1. El propietario aprueba visualmente el laboratorio en la Preview.
2. ChatGPT acepta la auditoría y la matriz.
3. Kimi acepta el contrato de mallas o su alternativa.
4. Claude original acepta el tipo de entrega en Entregas.
5. La CI está en verde, incluida la fidelidad contra el editor.

## 9. Orden recomendado

1. Contrato de mallas del visor (Kimi), de solo lectura.
2. Persistir planes y vínculos (biblioteca, en una clave aparte).
3. «Plan de obra» en Presupuestar, empezando por la edición y la validación.
4. Paso a FT3D-8 del visor oficial con el contrato del punto 1.
5. «Evolución de obra» en Entregar, con snapshot y enlace.
6. Vídeo y exportación.
7. Decisión sobre presupuestos de edificio y revisión en C1–C4.

## 10. Matriz de cumplimiento (27 aspectos)

| # | Aspecto | Estado | Evidencia o motivo |
|---|---|---|---|
| 1 | Resultado real del módulo | **Parcial** | Laboratorio aislado que representa proyectos RUBIK reales (A–D e importación); todavía no está integrado en el producto |
| 2 | Evidencia geométrica | **Resuelto** | La geometría sale de `Core.geometry`/`FloorPlanRoof`/`FloorPlanBuilding`; la prueba de fidelidad compara con el editor real (puertas ≤ 1 mm, cubierta, plantas, cajas ≤ 2 mm) |
| 3 | Elementos sin datos | **Resuelto** | `NOT_IN_AUTHORITY`, `representable:false` con motivo, contorno «sin tarea»; nunca se dibuja geometría inventada (pruebas «no fictitious elements» y «demo house never used») |
| 4 | Separación geometría / planificación | **Resuelto** | La geometría solo viene del proyecto; los vínculos y las fechas, del plan; el plan no contiene geometría |
| 5 | Coincidencia de la geometría final | **Resuelto** (A, B, C) | `ft3d-8-fidelity.browser.test.cjs`: estado final frente al editor; IoU 0,95–0,97 |
| 6 | Reformas | **Parcial** | Existente, nuevo y demolido sí; RUBIK no distingue «conservado» ni fases, y los recintos no tienen estado |
| 7 | Varias plantas | **Parcial** | Edificio de 2 plantas (B) con elevaciones y forjado comprobados; sin escaleras; límite de RUBIK de 2 plantas |
| 8 | Proyecto activo y snapshot | **Parcial** | Huella SHA del documento y obsolescencia implementadas; la lectura de la biblioteca activa y el snapshot de entrega son de la fase E |
| 9 | Vínculo tarea ↔ elemento | **Resuelto** | `task.elements` con clave `<planta>/<id>`, `ROLE_RULES`, enlaces rotos o incompatibles como error |
| 10 | Identidad de mallas del visor | **Bloqueado** | El visor no expone un contrato de mallas por elemento; se propone `buildArchitecture`/`archInspect` (Kimi) |
| 11 | Representación visual real | **Parcial** | Reglas del visor replicadas sobre la geometría canónica y validadas contra el editor; texturas y entorno no reproducidos |
| 12 | No duplicar motores | **Resuelto con reserva** | No se calcula geometría; solo se replica el montaje de mallas, a la espera del contrato del punto 10 |
| 13 | Invalidación por revisión | **Resuelto** | Huellas en el vínculo; prueba «revision changes invalidate» y la importación modificada en el navegador |
| 14 | Persistencia del plan | **Parcial** | Contrato `construction-binding` implementado y validado; falta el almacenamiento en la biblioteca (fase E) |
| 15 | Presupuesto seleccionado | **Resuelto** | Sujeto = proyecto; presupuesto de `FloorPlanBudgetDraft`; lectura en solo lectura de `rubik-budget-v1` al importar |
| 16 | Revisión proyecto ↔ presupuesto | **Bloqueado (C1–C4)** | El presupuesto no declara la revisión: se muestra como «no verificable»; el emparejamiento solo es declarado (vínculo) |
| 17 | Evidencias económicas | **Resuelto** | Fuente, fecha y revisión de cada precio; cantidades 7A con `ref`; `null` desconocido |
| 18 | Cobertura de presupuesto | **Resuelto** | `coverage.budget` con sin asignar, sin precio, pendientes y % asignado |
| 19 | Ausencia de presupuesto o plan | **Resuelto** | Caso D y edificio B: «PLANIFICACIÓN NO DISPONIBLE O PENDIENTE» y «costes no disponibles», sin nada inventado |
| 20 | Sistema de diseño | **Parcial** | Tokens Perla aplicados a la interfaz del laboratorio de fidelidad; la adopción completa de componentes queda para la integración |
| 21 | Marca profesional | **Pendiente** | Diseñada (snapshot de `FloorPlanBrand`); no implementada |
| 22 | Contrato de entrega | **Parcial** | Niveles de entrega implementados (`delivery`); el documento `construction-delivery` es una propuesta |
| 23 | Simulación frente a realidad | **Resuelto** | Etiquetas en el laboratorio y en el modelo (`simulation`, `assurances`); ejecución y certificación nunca declaradas |
| 24 | Separación de fases y permisos | **Resuelto** | Solo archivos nuevos de FT3D-8 y `labs/`; no se ha tocado `index.html`, el visor, `budget-core`, `quantity-core`, Entregas ni otras ramas |
| 25 | Privacidad de los proyectos de prueba | **Resuelto** | Fixtures sintéticos marcados FIXTURE; importación local sin envío; prueba de «sin peticiones externas» |
| 26 | QA de fidelidad y compatibilidad | **Resuelto** | 152 pruebas puras + 8 de navegador; compatibilidad con 0.1.0; sin mutaciones |
| 27 | Coordinación, CI y Preview | **Parcial** | CI con artefactos; Preview identificada por SHA (`READY` comprobado con el conector); no se ha podido abrir desde el entorno de trabajo (red); revisión humana pendiente |
