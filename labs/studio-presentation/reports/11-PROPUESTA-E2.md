# 11 · Propuesta E2, alineada con la v1.2 §8.1 (no autoriza nada)

**Estado:** propuesta. E2 requiere el GO explícito del propietario y una base consolidada acordada con Codex (hoy `master@403e6b7`). No se fusiona la rama del laboratorio ni se copian sus binarios, `node_modules`, referencias VIS ni salidas al árbol de Production.

## 1. Correspondencia con el roadmap maestro

La versión anterior de este informe llamaba E2-1…E2-8 a trabajo que abarca E2–E6. Queda así:

| Antes | Corte maestro | Qué cambia |
|---|---|---|
| E2-1 modelo de entrega | **E2** (cimientos ENT-04) y evolución en E3 | No se crea un núcleo `FloorPlanDelivery` paralelo. Modelo **por composición** sobre contratos existentes (§3). |
| E2-2 paginación | E2 solo si el PDF mínimo lo necesita; completa en E3/E5 | CSS Print provisional. `flow.js` con invariante y bloqueo de filas desmesuradas antes de habilitarlo. |
| E2-3 preparar entrega | **E3** (ENT-03) | Después de la activación ENT-04. La interfaz del laboratorio es una simulación; el exportador es un prototipo. |
| E2-4 carpeta offline | **E6** (ENT-02/06) tras E3 | B1 conserva las observaciones. El ZIP local no acredita ENT-06. |
| E2-5 Render IA trazable | **E4** (ENT-05, IMG-12) | Se permite analizar el contrato; sin peticiones pagadas. |
| E2-6 obra | E3/E4 composición y E6 entrega | Solo material y plan elegibles; DEC-05. |
| E2-7 Dibujo vivo | E4/E5 o corte Hybrid/Story | La exportación real está pendiente. |
| E2-8 enlace remoto | **E6** | GOV-08 completo, cuotas, aislamiento y DEC-05. S3 no hace privado un Blob público. |

## 2. Qué hay en `master@403e6b7` (lectura del código)

| Contrato | Estado en `master` | Uso en E2 |
|---|---|---|
| `FloorPlanDossier` (`project-dossier-ui.js`) | Cargado. `contents()`, `render(paper,style,bag)`, `open()`. Estilos `technical`, `client`, `realestate` y `studio`. | Anfitrión: el comparador ENT-04 se abre desde la misma área de «Entregar», sin un dossier nuevo. |
| `FloorPlanBrand` (`brand-core.js`) | Cargado. Perfiles, logo, contacto y snapshot `{profile,title,intro,takenAt}`. Sin colores ni fuentes (H07). | Solo lectura en E2. Los tokens de color y tipografía quedan para E3, con migración compatible. |
| `FloorPlanBeforeAfterDossier` 1.1.0 (`before-after-dossier-core.js`) | **No cargado** en `index.html`; vive en `labs/ux07-ent04`. API: `view`, `budgetBlock`, `html`, `exportDossier`, `verify`, `sha256`. | **Activar en E2**: cargar y llamar desde «Entregar». Compatibilidad con la fixture 1.0.0 y 1.1.0. |
| `FloorPlanRevisionBudget` 1.0.0 (`revision-budget-core.js`) | **No cargado**. `revisionMatch`, `compareBudgets`, `dependsOn`, `quantityDiff`. | Activar con ENT-04. Estados `complete`, `partial`, `incoherent`, `one-sided` y `none` según v1.2 §6.2. DEC-07 intacto. |
| `revision-compare-core.js`, `variants-compare-adapter.js` | Cargados (UX-07) | Fuente de la selección de revisión y variante. |
| `FloorPlanClientShare` (B1) | Cargado. `{build,download,CSP}` | Sin cambios en E2. Contrato con scripts propios y CSP; no se somete a `verify()` de ENT-04. |
| `FloorPlanClientDelivery` (`client-delivery-core.js`) | Cargado. `minimizeProject`, `buildSnapshot`, `validate`… | **No se amplía.** Es el contrato minimizado de la visita ENT-01, no un contenedor documental. |
| `FloorPlanConstructionDelivery` 0.2.0 | Cargado (Evolución) | Lectura en E3/E4, con autoridad del plan. |
| `FloorPlanPresentationStory` | Cargado | E3: reutilizar su resolvedor de capacidades. |

## 3. Modelo documental por composición (adaptadores de solo lectura)

```text
proyecto + revisión (UX-07) ─┐
presupuesto guardado ────────┼─ adaptadores puros, solo lectura ─→ snapshot documental congelado
FloorPlanBrand.snapshot() ───┘   (proyecto, revisión, huella, marca, estado económico, procedencia)
                                   │  invalidación si cambia cualquier fuente (ST01)
                                   ├─ ENT-04: FloorPlanBeforeAfterDossier.exportDossier → HTML estático + manifiesto (verify)
                                   └─ PDF: impresión del navegador (CSS Print), solo si E1 lo acredita para este corte
```

- **Snapshot.** Objeto inmutable con la identidad (`project.id`, revisión, huella) y la de cada pieza. Se rechaza la preparación si una fuente cambia durante un `await`. Esa es la prueba negativa de ST01 y responde a H03.
- **Sin escrituras.** Biblioteca y presupuestos idénticos byte a byte antes y después de preparar, cambiar la estética y descargar (D02).
- **Integridad.** El manifiesto ENT-04 se calcula sobre los bytes definitivos. Nunca se reutiliza el hash de otro artefacto.

## 4. Primer corte E2: activación mínima ENT-04

1. Cargar `before-after-dossier-core.js` y `revision-budget-core.js` en `index.html`, en el orden que exigen sus dependencias.
2. En «Entregar», una tarjeta «Comparar revisiones» que reutiliza la selección UX-07, abre la vista ENT-04 y descarga HTML estático y manifiesto.
3. Plantilla sobria profesional: estilo `technical` del dossier y tokens RUBIK existentes. Sin las tres familias todavía (E3).
4. Marca: solo el snapshot de `FloorPlanBrand`; sin campos nuevos.
5. **Fuera de E2:**
   - el PDF (salvo acreditación E1 para este corte);
   - la publicación, las cuotas y los enlaces;
   - el exportador selectivo del laboratorio;
   - los capítulos multimedia.

## 5. Mapa de impacto y pruebas

| Área | Archivos | Suites que deben seguir verdes |
|---|---|---|
| Entregar | `professional-workspace-ui.js`, `index.html` | `professional-workspace.browser`, `project-dossier.browser`, `brand.browser` |
| ENT-04/UX-07 | `before-after-dossier-core.js`, `revision-budget-core.js`, `revision-compare-core.js`, `variants-compare-adapter.js` | `tests/ux07-*`, fixture `ux07-dossier-1.0.0`, `economic-dossier*`, `budget-presentation` |
| No regresión | B1, ENT-01, FT3D-8 | `client-share.browser`, `delivery-3d-link.browser`, `client-delivery-core`, `ft3d-8-*` |

Pruebas nuevas: D01 (proyecto cruzado), D02 (bytes intactos), D03 (cinco estados económicos), D10 (`verify` y escapes) y ST01 (cambio de fuente durante la preparación).

## 6. Riesgos, rollback y aceptación

- **Riesgos:**
  - orden de carga de scripts;
  - divergencia de cifras entre comparador y C4: mitigada usando solo `FloorPlanRevisionBudget` y el motor canónico;
  - confundir un ENT-04 activo con un ENT-03 completo.
- **Rollback:** revertir el commit del corte. Son dos scripts y una tarjeta, sin migración de datos.
- **Aceptación:** CI verde con las suites de §5, revisión visual humana del dossier comparativo (escritorio y móvil) y GO del propietario para fusionar.

## 7. Después (E3–E6, cada uno con su GO)

| Corte | Contenido |
|---|---|
| E3 | Tres familias sobre los cuatro estilos y las cinco plantillas Story existentes; tokens de marca con contraste (H07); A4 vertical y horizontal; Architecture Book. |
| E4 | Láminas y fichas FF&E; Render IA trazable (vista de origen guardada). |
| E5 | Calidad PDF y tablas extensas. |
| E6 | Carpeta de cliente y publicación con GOV-08/ENT-02. El exportador del laboratorio sirve de especificación de comportamiento (selección física, manifiesto, gates y verificador), no de código a copiar. |
