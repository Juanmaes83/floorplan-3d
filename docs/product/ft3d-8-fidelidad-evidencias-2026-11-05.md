# FT3D-8 · Fases C y D — Adaptador, laboratorio de fidelidad y evidencias

## 1. Qué hay

| Pieza | Archivo | Tipo |
|---|---|---|
| Adaptador puro proyecto ↔ plan ↔ presupuesto | `js/construction-project-adapter.js` (`FloorPlanConstructionProject`) | Código puro, UMD, sin DOM ni red |
| Proyectos de prueba A–D | `labs/ft3d-8/fidelity-fixtures.js` | FIXTURE: `FloorPlanProjectV1`/`BuildingV1` válidos + presupuestos de `FloorPlanBudgetDraft` + planes 0.2.0 |
| Laboratorio de fidelidad | `labs/ft3d-8/index.html`, `fidelity-app.js`, `project-scene.js`, `gantt-view.js`, `fidelity.css` | Página aislada |
| Demo ilustrativa anterior | `labs/ft3d-8/demo.html` (+ `app.js`, `scene.js`, `lab-fixture.js`) | Casa ficticia, marcada como DEMO |
| Pruebas | `tests/construction-project-adapter.test.cjs` (18), `tests/ft3d-8-fidelity.browser.test.cjs` (6), además de las anteriores | Node + Chromium |

## 2. Casos de prueba (todos FIXTURE, sin datos de clientes)

| Caso | Documento | Geometría | Escala | Plan | Presupuesto | Resultado esperado |
|---|---|---|---|---|---|---|
| **A** vivienda de una planta | `prj_fx-house-a` 11,0 × 8,0 m, 6 muros, 8 huecos, 3 recintos | rectángulo, corredera, entrada | **real** (calibrada y verificada) | revisado, 7 tareas, con una «cimentación» sin elementos | 8 partidas revisadas | nivel `professional` |
| **B** edificio en L de 2 plantas | `bld_fx-house-b`: planta baja en L de 9 × 9 m y planta alta de 5 × 5 m (+2,90 m, forjado de 300 mm) | otra forma, otras alturas (2,60 y 2,50 m), otros huecos, cubierta expuesta de 15 polígonos | estimada (1:50) | borrador | **ninguno común** (RUBIK: un presupuesto por planta) | `orientative`, costes no disponibles |
| **C** reforma de piso | `prj_fx-reform-c`: 4 muros existentes, 1 demolido, 2 tabiques nuevos | arranca con el piso existente | estimada (plantilla) | revisado | con partida sin precio, partida sin asignar y reparto del 50 % pendiente | `approved-plan`, con bloqueos de cobertura |
| **D** datos insuficientes | `prj_fx-partial-d`: fachada abierta, orígenes ausentes o sin revisar | sin cubierta derivable | pendiente | **ninguno** | presupuesto sin precios | `internal`, «PLANIFICACIÓN NO DISPONIBLE O PENDIENTE» |

## 3. Método de comparación (D1)

1. **Referencia auténtica.** Es el editor real (`index.html` sin modificar):
   - el proyecto se importa con la vía pública `FloorPlanApp.importProjectFile(File)`;
   - se cambia a la vista 3D;
   - en un edificio se pulsa «Ver todas»;
   - se fijan la cámara y la cubierta con `View3D.presentationRestoreView`;
   - se ocultan solo, por CSS de la prueba, las capas de interfaz superpuestas al canvas.
2. **Candidato.** Es el laboratorio en el estado **final** del plan, con el **mismo** encuadre (`frameEnvelope('iso')` aplicado en ambos) y el mismo tamaño de canvas, medido en el editor.
3. **Comprobaciones, de la más fuerte a la más débil:**
   - **Estructural frente a las API de solo lectura del editor.**
     - `View3D.doorLeaves`: bisagra x/z de cada hoja con tolerancia **≤ 1 mm** y ángulo de apertura ≤ 0,001 rad.
     - `View3D.roofInfo`: mismo número y tipo de superficies, y misma área total con tolerancia **≤ 1 mm²**.
     - `View3D.levelInspect`: elevación de las plantas no activas, exacta.
     - Pose de cámara idéntica (≤ 1e-6).
   - **Estructural frente a la geometría canónica**, calculada en Node a partir de `FloorPlanCore.geometry`: el conjunto de elementos dibujados (muros, suelos, cubierta, forjado y aberturas) es **igual** al inventario representable, sin elementos de más. La caja de cada elemento en el mundo coincide con tolerancia **≤ 2 mm**. Los muros demolidos no aparecen al final, igual que en el editor.
   - **Imagen (secundaria).** Silueta frente al fondo de cada imagen: **IoU ≥ 0,80**. Bordes de silueta a menos de 3 px en ambos sentidos: **≥ 0,55**.

**Por qué esas tolerancias de imagen:** la iluminación, el sol, el entorno, la paleta de suelo y fondo, las sombras y el antialiasing son distintos por diseño. Las sombras proyectadas cambian la silueta, así que la imagen **no** sirve por sí sola para declarar fidelidad. Las comprobaciones estructurales son las que fijan las dimensiones.

## 4. Resultados (ejecución local en Chromium/SwiftShader; la CI vuelve a generarlos en cada push)

| Caso | Puertas (bisagra/ángulo) | Cubierta (superficies/área) | Plantas | Elementos con caja comprobada | IoU silueta | Bordes ref→FT3D-8 / FT3D-8→ref |
|---|---|---|---|---|---|---|
| A | 3/3 exactas | 1 / igual | — | 10 | **0,948** | 0,80 / 0,93 |
| B | 2/2 exactas | 15 / igual | lvl_fx-b1 a 2900 mm | 17 | **0,962** | 0,91 / 0,90 |
| C | 2/2 exactas | 1 / igual (cubierta oculta en la comparación) | — | 9 | **0,967** | 0,78 / 0,87 |

**Diferencias que se detectaron y se corrigieron durante la validación:**
- Faltaba el **forjado** entre plantas en B. Se añadió desde `slabThicknessMm`, y los bordes de B pasaron de 0,47 a 0,91.
- Faltaba el remate superior oscuro de los muros sin material (`capMat`) en C. Se añadió, y los bordes pasaron de 0,57 a 0,87.
- El canvas del editor con edificio mide 884 × 586 (por la barra de plantas). La prueba mide ese tamaño en lugar de suponerlo.

**Diferencias que quedan** (visibles, no estructurales): tono de color e iluminación, sombras, textura de los pavimentos (el editor usa los presets de textura; FT3D-8 usa el color del material) y el entorno del editor (horizonte).

## 5. Evidencias generadas (artefacto de CI `ft3d-8-fidelity-evidence`)

- `A|B|C-reference-editor.png`: representación de referencia en el editor real.
- `A|B|C-ft3d8-final-compare.png`: FT3D-8 en estado final con la misma cámara.
- `A|B|C-overlay-reference-red-ft3d8-blue.png`: superposición de siluetas y bordes (rojo = editor, azul = FT3D-8, verde = coinciden).
- `A|B|C-ft3d8-01-start.png`, `-02-mid.png`, `-03-final.png`: inicio, desarrollo y final.
- `A|B|C-metrics.json`: métricas y tolerancias.
- `1440x900-*` y `390x844-*`: inicio, desarrollo con Gantt y tarjeta económica, final, reforma C y datos insuficientes D, en escritorio y móvil.
- `ft3d8-fidelity-review.webm`: vídeo del recorrido (inicio → reproducción → pausa → retroceso → cambio de tareas con el Gantt sincronizado → final → retroceso → cambio de proyecto → datos insuficientes → importación).

## 6. Qué demuestran las evidencias y qué no (D5)

| Afirmación | Estado | Evidencia |
|---|---|---|
| Tests superados | sí | CI: 152 pruebas puras y 8 de navegador |
| Coincidencia geométrica con el editor | comprobada para A, B y C | puertas, cubierta, plantas y cajas, dentro de las tolerancias del §3 |
| Datos económicos trazables | sí | `budgetReport` sobre el presupuesto de `FloorPlanBudgetDraft` (cantidades 7A con `ref`) |
| Calidad visual | parcial | parecido de silueta y bordes; los materiales con textura no se reproducen |
| Validación humana | **pendiente** | revisión del propietario |
| Certificación profesional de obra | **no forma parte** de FT3D-8 | — |

Una captura no certifica dimensiones, presupuesto ni ejecución.

## 7. Limitaciones

1. El montaje de mallas replica reglas del visor del editor (`wallBox`, vidrio, hojas, correderas, suelos, cubierta y forjado). Si el visor cambia, la prueba de fidelidad fallará y habrá que actualizar `project-scene.js`, o mejor, adoptar el contrato de mallas propuesto en la auditoría (§4).
2. No se representan escaleras ni huecos de escalera en el forjado.
3. Los pavimentos con preset de textura se muestran con su color base.
4. La importación local solo valida y lee el archivo en el navegador. El presupuesto se toma, en solo lectura, de `localStorage['rubik-budget-v1']` del mismo navegador, si existe.
5. La Preview de Vercel no se ha podido abrir desde este entorno de trabajo (la red bloquea `*.vercel.app`). Su estado `READY` se comprueba con el conector de Vercel, pero la prueba funcional se ha hecho en el servidor local de la CI.

## 8. Instrucciones para la revisión humana

1. Abre la URL de la Preview que se entrega con este corte, en `/labs/ft3d-8/`.
2. **Proyecto A:** pulsa ▶ y comprueba que la obra pasa por cimentación (sin geometría, la tarjeta lo indica), muros, tabiques, cubierta, carpinterías, pintura (del tono crudo al color de la cal) y suelos. Comprueba también que el cursor del Gantt acompaña a la escena.
3. Usa ‹ › « » y el selector de semana; vuelve atrás desde el final y comprueba que la escena se deshace en orden.
4. **Proyecto B:** debe verse un edificio en L con planta alta y forjado. Los costes deben aparecer como «no disponibles», con su explicación.
5. **Proyecto C:** el piso existente está en pie desde el inicio. El tabique demolido se ve en rojo mientras se demuele y después desaparece; los tabiques nuevos aparecen después.
6. **Proyecto D:** debe aparecer «PLANIFICACIÓN NO DISPONIBLE O PENDIENTE», con la reproducción desactivada.
7. Importa un proyecto exportado como JSON desde el editor de RUBIK. Opcionalmente, añade un plan FT3D-8. Comprueba que se muestra tu geometría y que, sin plan, no se inventan fechas.
8. Compara en el artefacto de CI las capturas `*-reference-editor.png` con `*-ft3d8-final-compare.png`.
