# FT3D-8 · S1-E — Plan de integración futura (ruta directa con RUBIK, S4)

**Estado:** propuesta. Nada de esto está implementado ni autorizado. S1 solo trabaja con documentos locales.

## 1. Productores y consumidores

```
Editor (index.html)                     Presupuestar (budget-ui)        Contexto territorial (territory-ui)
  FloorPlanLibrary ── entrada activa       rubik-budget-v1[project.id]      site / building.site
        │  proyecto o edificio                  │ presupuesto(s) C1–C4            │ parcela, colocación, capas
        ▼                                       ▼                                 ▼
                 ┌──────────── FloorPlanConstructionDossier.evaluate ────────────┐
Plan FT3D-8 ───▶ │ identidad · huellas · correspondencias · conflictos · usable  │ ◀── Mi estudio (FloorPlanBrand)
Vínculo ───────▶ └──────────────────────────────┬────────────────────────────────┘
                                                ▼  evaluation.model (una sola evaluación)
                            Gantt · timelapse · vídeo MP4 · manifiesto 0.2.0 · HTML de cliente · (enlace futuro)
```

## 2. Archivos compartidos que habría que tocar después (no se tocan en S1)

| Archivo | Cambio mínimo | Responsable | Riesgo |
|---|---|---|---|
| `index.html` | Exponer de solo lectura `{project o building, activeLevelId, savedAt}` del proyecto abierto (por ejemplo `FloorPlanApp.dossierSources()`) | Claude original / propietario | Medio: editor principal |
| `js/budget-ui.js` | Exponer `all()` con los presupuestos de cada planta (hoy solo `current()` de la planta abierta) | Claude original | Bajo |
| `js/budget-core.js` | Opcional: `subject.revision` (huella del proyecto) para pasar de «emparejamiento declarado» a «verificado por el motor»; necesita la versión 1.2.0 con lectura de 1.0/1.1 | Propietario (decisión D-S1-2) | Medio: contrato canónico |
| Presupuestar | Opción 3, presupuesto de edificio (`subject.type:'building'`) con partidas comunes y reglas antiduplicación | Propietario + Claude original | Alto: requiere diseño aprobado |
| `js/brand-ui.js` | Leer la marca activa de Mi estudio para la entrega (`FloorPlanBrandUI.snapshot()` ya existe) | Claude original | Bajo |
| Entregar (PR Juanmaes83/floorplan-3d#166) | Nuevo tipo de entrega «evolución de obra» que use el manifiesto 0.2.0 y su vídeo | Claude original | Medio: coordinar con su `api/share.js` (`delivery`) |
| `api/share.js` | Sin cambios: el HTML y el MP4 ya están admitidos. Revisar el límite de 4 MB si el vídeo va en la página | Claude original | Bajo |
| Visor 3D compartido | Contrato de mallas por elemento para eliminar la réplica de montaje de `labs/ft3d-8/project-scene.js` | Kimi | Medio |

## 3. Compatibilidad y migración

- El expediente 0.1.0 es un documento **aparte**: no cambia ningún esquema canónico. Una versión futura (0.2.0)
  añadiría `route:'library'` y la marca temporal de guardado del editor. Una versión desconocida se rechaza.
- Manifiesto: 0.2.0 sigue leyendo 0.1.0 (sin expediente).
- Si `budget-core` añade `subject.revision`, el expediente lo leerá como `match` u `obsolete` en lugar de
  `unverifiable`, sin tocar los presupuestos antiguos.
- Ninguna migración reescribe documentos del profesional: todas se aplican en memoria al leer.

## 4. Dependencias con otros agentes

- **Claude original (Entregas, PR Juanmaes83/floorplan-3d#166):** el tipo de entrega «evolución» debe usar
  `FloorPlanConstructionDelivery` y no crear otro grabador.
- **Kimi (fidelidad visual, PR Juanmaes83/floorplan-3d#167 y Juanmaes83/floorplan-3d#169):** si cambian los
  materiales de fachada, hay que volver a medir la fidelidad del laboratorio; el contrato de mallas por elemento
  eliminaría la réplica.
- **ChatGPT (supervisión):** el documento de continuidad debe registrar que BC3, BCCA y Catastro GML se **consumen**
  y no se reimplementan.

## 5. Reversión

Todo S1 está en archivos propios: `js/construction-dossier-core.js`, `labs/ft3d-8/dossier-*.js`, la sección del
expediente en `labs/ft3d-8/index.html` y `fidelity.css`, y los cambios acotados en `fidelity-app.js` y
`delivery-ui.js`. Revertir los commits de S1 devuelve el laboratorio a `f78b5e3`. El manifiesto 0.2.0 sigue leyendo
0.1.0, y el cambio del adaptador (presupuesto de edificio) es independiente y tiene su propia prueba.

## 6. Riesgos pendientes

1. La ruta S1 no demuestra que un archivo sea la última versión guardada en el editor.
2. El presupuesto no guarda la revisión del proyecto: el emparejamiento sigue siendo declarado.
3. La aprobación (`review.by`) no está autenticada; `accredited` sigue sin alcanzarse.
4. La geometría de la parcela de Catastro no puede ir en entregas: si un cliente la necesita, hará falta una geometría
   propia del profesional (`user-entered`) con su licencia.
5. Ortofoto y terreno son solo de ejecución: no forman parte del expediente ni de las entregas.
6. La publicación real (Vercel Blob) sigue sin probarse con datos reales.

## 7. Decisiones del propietario

| # | Decisión | Recomendación |
|---|---|---|
| D-S1-1 | Presupuesto de edificio (opción 3) | Aprobar el diseño antes de implementarlo; mientras tanto, opciones 1 y 2 |
| D-S1-2 | `subject.revision` en C1–C4 | Sí, como campo opcional en 1.2.0 |
| D-S1-3 | BCCA gestionada (S2) | Registrar el ámbito de los permisos declarados antes de cambiar el gate |
| D-S1-4 | Territorio en entregas | Solo texto (referencia y atribución) hasta disponer de una geometría con licencia |
| D-S1-5 | Ruta directa (S4) | Autorizar el punto de lectura en `index.html` y la exposición de los presupuestos por planta |
