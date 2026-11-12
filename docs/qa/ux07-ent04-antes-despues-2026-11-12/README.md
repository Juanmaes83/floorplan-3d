# UX-07 + ENT-04 — Antes y después de dos revisiones, y dossier con presupuesto rotulado (ola 2b)

**Fecha:** 12-11-2026 · **Rama:** `lab/ux07-ent04-before-after` · **Origen:** `master@eae8cf6` · **Coordinación:** issue #206.

**Catálogo:**
- `UX-07 | Comparador antes/después con cortina (revisiones, variantes, 2D↔3D)`
- `ENT-04 | Dossier comercial antes/después, con presupuesto rotulado (parcial o completo)`

No se crean IDs ni se cambian olas.

**Alcance (fase 1 de la auditoría `auditoria-oportunidades-ux-servicios-2026-11-09.md` §UX-07):**
- dos revisiones o variantes en 2D, una al lado de otra o con cortina, con el mismo encuadre;
- el 3D sincronizado queda para la fase 2, como dice la auditoría.

Todo vive en un **laboratorio aislado** (`labs/ux07-ent04/`): no se toca ningún archivo de producto existente.

## Qué hace

| Requisito | Cómo |
|---|---|
| Elegir las revisiones «antes» y «después» | Tres orígenes: proyecto de prueba (sintético); **biblioteca de este navegador en solo lectura** (cualquier escritura falla; la prueba comprueba que el almacenamiento no cambia ni un byte); **dos archivos JSON** validados con `FloorPlanCore.validate`. |
| Relación honesta entre revisiones | Mismo identificador de proyecto → «mismo proyecto». Enlace `variantOf` de la biblioteca → «original y variante». Proyectos distintos → **solo si el profesional lo declara** con una casilla, y el dossier lo dice. «Mismo proyecto» no se puede fingir. |
| Misma perspectiva | `FloorPlanVariants.comparisonFrame` (existente): **un único marco y una única escala** para las dos plantas, en la cortina y en la vista «lado a lado». Se comprueba que el `viewBox` es idéntico. |
| Cambios reales frente a ilustrativos | Cada cambio sale de los datos de las dos revisiones (por identificador) y lleva su evidencia. Aparte se listan los **ilustrativos**: muros sin acabado declarado (gris por defecto), colores de resaltado y aspecto de los muebles. |
| Materiales y elementos cambiados **con evidencia** | Solo los que el proyecto declara: el suelo de cada estancia (`floorMaterialId`) y el acabado de cada muro (`surfaceMaterialId`), con nombre y color de **su propia** tabla de materiales. Lo que no está declarado se escribe «sin declarar», nunca se supone. |
| Dossier con presupuesto opcional | Presupuesto C1–C4 existente (`rubik-budget-v1` del proyecto «después», o los de prueba). Rótulo **«Presupuesto completo»** solo si el informe C2 dice que neto e IVA están completos; si no, **«Presupuesto parcial»** con el **importe conocido**, que nunca se presenta como total. Sin presupuesto, el dossier no muestra ningún importe. |
| Coherencia del presupuesto con la revisión | RUBIK no guarda sobre qué revisión se hizo un presupuesto (DEC-07). Se comparan sus cantidades con las del borrador real (`FloorPlanBudgetDraft.lines`) de «después» y se dice si **no coinciden**. Un presupuesto de otro proyecto, o sin partidas, **no se adjunta**. |
| Exportación verificable | HTML autocontenido, **sin scripts ni recursos externos**, con un manifiesto que lleva las huellas SHA-256 del HTML, de las dos revisiones, de la comparación y del presupuesto. **Verificar** comprueba el dossier en memoria o los **archivos descargados**; cualquier alteración se detecta. Es determinista: mismas entradas, misma huella. |
| No publicar | Sin botones de enviar, publicar ni compartir. Ninguna API, ningún enlace y ninguna petición externa (las pruebas fallan si hay alguna). El dossier se titula «Borrador interno · no enviado al cliente». |

## Cambios

| Archivo | Tipo | Nota |
|---|---|---|
| `js/revision-compare-core.js` | Nuevo, puro (UMD) | Comparación y planta SVG. Reutiliza `FloorPlanCore` y `FloorPlanVariants` (`metrics` y `comparisonFrame`). |
| `js/before-after-dossier-core.js` | Nuevo, puro (UMD) | Dossier, rótulo de presupuesto, comprobación de cantidades, HTML, manifiesto y `verify`. Reutiliza `FloorPlanBudgetPresentation.buildReport` y `FloorPlanBudgetDraft.lines`. |
| `labs/ux07-ent04/` | Nuevo, laboratorio | Página, estilos, controlador y fixtures sintéticas. |
| `tests/ux07*`, `.github/workflows/ux07-ent04-before-after.yml` | Pruebas y CI | Gate propio. |

**No se toca:**
- `index.html`;
- `js/professional-workspace-ui.js`;
- `js/delivery-*`;
- las API de compartir, retirar, visitar o renderizar;
- los contratos canónicos;
- Vercel;
- las PR #201–#208.

**Reutilización, sin motor nuevo:** validación, geometría y marco común, métricas, informe C2 y borrador de cantidades.

## Pruebas ejecutadas (local, Chromium 1243)

| Suite | Resultado |
|---|---|
| `ux07-ent04-core` (núcleos) | 16/16 |
| `ux07-ent04-lab.browser` (escritorio, móvil vertical y horizontal) | 7/7 |
| Regresión de las autoridades reutilizadas: `budget-presentation`, `budget-core` | En verde (sin cambios en ellas) |

**Casos adversariales:**
- proyectos distintos sin declarar;
- fingir «mismo proyecto»;
- relación inválida;
- elemento redibujado con otro ID (sale como quitado + añadido, y el límite lo dice);
- material que cambia de definición con el mismo ID;
- material inexistente (lo rechaza el contrato);
- revisiones iguales;
- presupuesto de otro proyecto, vacío o hecho sobre «antes»;
- HTML alterado («parcial» → «completo»);
- script externo inyectado;
- revisión o presupuesto cambiados después de exportar;
- inyección de HTML en el nombre del proyecto;
- archivo JSON no válido;
- biblioteca sin escrituras.

**Defecto encontrado y corregido durante el QA visual:** en móvil se veían a la vez la cortina y la vista «lado a lado» (`display:grid` anulaba `hidden`). Ya está corregido y tiene su propia prueba. El tabique a demoler se marcaba en ámbar («cambiado»); ahora es rojo discontinuo en «después».

## Evidencias

En `evidencias/`, con `manifest.json` y SHA-256. En escritorio 1440×900 y en móvil 390×844:

1. cortina;
2. cambios y materiales;
3. lado a lado;
4. dossier parcial verificado;
5. dossier descargado, abierto solo.

## Derechos y procedencia

- **Datos:** la vivienda de referencia de RUBIK (`js/reference-project.js`, del repositorio) con los nombres traducidos en la fixture, y una reforma sintética.
- **Precios:** **ficticios**, rotulados en el propio dato como «Precio de prueba ficticio (laboratorio)». No son precios de mercado ni de cliente.
- **Ni proyectos reales, ni secretos, ni servicios externos.** No se añaden dependencias.

## Recorrido humano (5 min)

1. Abre la Preview en `/labs/ux07-ent04/` y pulsa **Comparar**. Mueve la cortina: a la izquierda «Antes», a la derecha «Después».
2. Comprueba que la cocina cambia de color (de baldosa a terrazo) y que el tabique de la cocina sale en rojo discontinuo en «Después».
3. Elige «Prueba: partidas sin precio» y pulsa **Preparar dossier**. Debe decir «Presupuesto parcial» y «Importe conocido…», sin ningún total.
4. Pulsa **Descargar HTML** y **Descargar manifiesto**. Después, en «Verificar un dossier descargado», cárgalos: debe salir «Dossier verificado».
5. Con tus propios proyectos: guarda una variante en el editor y elige «Biblioteca de este navegador». Es de solo lectura.

## Pendiente y decisiones para ChatGPT

- **Integración en producto:**
  - un acceso desde «Variantes» del editor o desde Entregar; toca `index.html` o la navegación, que son **reservados**, así que no se hace aquí;
  - punto de conexión: el diálogo de variantes ya calcula `comparisonFrame` en `renderVariants()` (~L2450). Bastaría un botón «Comparar antes/después» que abra este laboratorio con las dos entradas.
- **Fase 2 de UX-07:** 3D sincronizado (dos escenas con la misma pose); 2D↔3D.
- **ENT-04 «comercial» hacia el cliente:** requiere las reglas de publicación de ENT-01 y GOV-08. Aquí solo hay un borrador interno.
- **Catálogo:** marcar UX-07 o ENT-04 es decisión de integración. Lo honesto es **parcial**: fase 1 en laboratorio.
