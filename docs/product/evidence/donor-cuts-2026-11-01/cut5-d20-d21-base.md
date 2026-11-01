# CUT 5 — QUALITY, EVIDENCE & REVERSE-ENGINEERING BOUNDARIES

D20 · D21

## CONTROL STATE

| Referencia                | Revisión verificada                                          |
| ------------------------- | ------------------------------------------------------------ |
| Product `origin/master`   | **`18848fbf3308ef8c2c8841edf626221f74922d23`**               |
| Reference Atlas           | `7696fb2c6c30f158001d38ecc53feb2674acaa25`                   |
| Flat-to-3D                | `d7b9b69753d3af679535ee56695a05c8d955c3c6`                   |
| Lintel source             | `c6029d9bb0647483709a502daedc24c1dd7bc029`                   |
| Lintel live               | `791612f6f07fdd79bafeedc74ec6c9eee0f9a86a`                   |
| REA remoto                | `aa48d494e9726d469a1b9ed917f021d8a1a4c7ea`                   |
| REA checkout              | `d54a4661da20382ad8456564a08569fdd24131c5`                   |
| FT3D-6 working contract   | `5db3c1b48972128f2769598141cbe2268b792bfa`                   |
| Metodología de referencia | `6e933168ff49f48c6de9d24dd7b51ff8dbec4e28`                   |
| Analysis checkout         | `C:\Users\temp123\work\floorplan-3d-donor-gap-analysis-cut2` |
| Analysis HEAD             | `cc04f67fc0b46c87bc696bf566adb362f43041fd`                   |

Se actualizaron referencias remotas mediante `fetch`, sin cambiar de rama ni checkout. El `master` actual incorpora axon/exploded, ausentes del baseline utilizado en Cuts anteriores. Se inspeccionaron esos cambios **sin acceder al WIP de Claude**.

Los archivos REA utilizados para las conclusiones siguientes no presentan diferencias entre el checkout y el remoto fijado.

**Límite del encargo recibido:** el adjunto es un fragmento y omite algunas estructuras anunciadas. Este informe cubre los requisitos explícitos disponibles; no reconstruye instrucciones ausentes.

## EXECUTIVE SUMMARY

**D20 es un proceso de mejora visual y comprobación**, apoyado en capturas repetibles, comparaciones controladas, revisión humana, análisis temporal y medición de costes. Sus herramientas y contenido Lintel permanecen **REFERENCE ONLY — DO NOT COPY**.

**D21 es infraestructura externa de investigación.** Puede conservar fuentes, capturas y procedencia; dispone además de operaciones específicas de observación de ejecución. Ninguna de esas capacidades acredita automáticamente causalidad visual, derechos de reutilización o aceptación del producto.

Las conclusiones principales son:

1. Calidad visual, estabilidad temporal, rendimiento y corrección semántica necesitan evidencias separadas.
2. Bloom, HDR y tratamiento material sí aparecen en Lintel; no puede atribuirse su acabado a un único efecto.
3. Una captura existente contiene el loader sobre la escena: es evidencia de observación, pero no una imagen final válida.
4. Obtener un script no demuestra ejecución. La cobertura V8 es una operación distinta y altera las condiciones de medición.
5. Rubik ya tiene herramientas de evidencia y manifiestos. El trabajo futuro debe ampliarlos donde exista una carencia demostrada.

No se ha seleccionado ningún candidato final ni realizado reconciliación documental.

## TARGET IDENTITY MAP

Identidades verificadas en el [Atlas, D20–D21 (line 547)]\(C:/Users/temp123/work/floorplan-3d-donor-gap-analysis-cut2/docs/product/ft3d-reference-atlas-2026-11-01.md:547).

| Target | Identidad                                   | Fuentes principales                                                         | Responsabilidad                                  |
| ------ | ------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| D20    | Polish loop, método y comparación de Lintel | `brief-code-house.md`; `review_stills.py`; `flicker.mjs`; `look_numbers.py` | Mejorar y evaluar una experiencia visual         |
| D21    | Captura y procedencia de scripts con REA    | `CdpBrowserProvider.ts`; `PublishWebScripts.ts`; módulos de ejecución       | Investigar comportamientos y conservar evidencia |

## LEGAL / SOURCE BOUNDARIES

| Fuente                                | Estado observado                                                 | Frontera de esta auditoría                                                              |
| ------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Flat-to-3D                            | MIT, ©2026 Samnang Aing                                          | Código potencialmente reutilizable conservando avisos; terceros se revisan por separado |
| REA                                   | MIT, ©2026 morluto                                               | Herramienta externa; conservar avisos en cualquier distribución derivada                |
| Lintel source/live                    | Sin licencia explícita localizada en los inventarios consultados | **REFERENCE ONLY — DO NOT COPY**                                                        |
| Fotografías, fuentes y otros recursos | Permisos no acreditados individualmente en este Cut              | **ASSET LICENSE REVIEW REQUIRED**                                                       |
| Bibliotecas externas                  | Condiciones por dependencia y versión                            | **DEPENDENCY LICENSE REVIEW REQUIRED**                                                  |

Las licencias MIT de [Flat-to-3D](https://raw.githubusercontent.com/Sam1983Aing/flat-to-3d/d7b9b69753d3af679535ee56695a05c8d955c3c6/LICENSE) y [REA](https://raw.githubusercontent.com/morluto/rea/aa48d494e9726d469a1b9ed917f021d8a1a4c7ea/LICENSE) se contrastaron con sus textos publicados. Exigen conservar los avisos correspondientes.

La disponibilidad pública de Lintel no se utiliza como autorización de copia. Su implementación procedural tampoco acredita automáticamente que cada recurso o material esté libre de obligaciones independientes.

## D20 — MECHANISM / PROCESS AUDIT

### Proceso verificado

El [brief de Lintel (line 1)]\(C:/Users/temp123/work/ft3d-reference-workspace/lintel-flat-2d/001 Lintel/v10/brief-code-house.md:1) describe este ciclo:

1. Congelar una referencia.
2. Comparar materiales bajo iluminación equivalente.
3. Revisar imágenes y defectos concretos.
4. Comprobar estabilidad durante el movimiento.
5. Medir coste de carga y renderizado.
6. Presentar un reel para revisión humana.
7. Registrar decisiones y congelar la versión.

El brief distingue las puntuaciones del revisor de la decisión del propietario. Sus cifras históricas son **resultados reportados por el autor**, no mediciones reproducidas aquí.

### Herramientas y límites

| Herramienta                                                                                                          | Qué verifica su implementación                                                  | Qué no acredita                                                                              |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [review_stills.py (line 1)]\(C:/Users/temp123/work/ft3d-reference-workspace/lintel-flat-2d/tools/review_stills.py:1) | 35 posiciones vinculadas a claves de cámara; tamaño y DPR configurables         | Cobertura completa de movimiento, móvil o accesibilidad                                      |
| [flicker.mjs (line 1)]\(C:/Users/temp123/work/ft3d-reference-workspace/lintel-flat-2d/tools/flicker.mjs:1)           | Capturas sucesivas; diferencias temporales sobre un recorte; muestreo repetible | Un score universal de calidad o una separación perfecta entre movimiento, efectos y defectos |
| [look_numbers.py (line 1)]\(C:/Users/temp123/work/ft3d-reference-workspace/lintel-flat-2d/tools/look_numbers.py:1)   | Intervalos RAF, recursos, arranque y dimensiones internas                       | Tiempo GPU aislado ni rendimiento garantizado en teléfonos físicos                           |

Los umbrales de flicker del autor son heurísticos. Además:

- El recorte central puede omitir defectos periféricos.
- El HUD se oculta: esas capturas no verifican la UI completa.
- Agua, grano u otros efectos animados pueden cambiar una imagen con cámara quieta.
- Los intervalos RAF incluyen efectos del navegador y de la máquina.
- Las versiones deben intercalarse para reducir el sesgo de carga y calentamiento.
- Esperar un tiempo fijo no garantiza que la escena esté lista.

### Estado actual en Rubik

Rubik ya dispone de métricas de composición, herramientas de reproducción y capturas de Story.

El nuevo [render-presentation-axon.cjs](https://github.com/Juanmaes83/floorplan-3d/blob/18848fbf3308ef8c2c8841edf626221f74922d23/scripts/qa/render-presentation-axon.cjs) genera imágenes y secuencias con manifiesto de SHA, Chromium, escenario, viewport y progreso. El reverse recorre realmente la narrativa en sentido inverso.

El [contrato FT3D-5, §38](https://github.com/Juanmaes83/floorplan-3d/blob/18848fbf3308ef8c2c8841edf626221f74922d23/docs/product/ft3d-5-axon-exploded-building-contract-2026-11-01.md) ya exige evidencia reproducible y revisión humana.

**Gap:** completar y revisar evidencia comparable, sin crear otra infraestructura paralela ni convertir una métrica parcial en aprobación visual.

## VISUAL CAUSALITY MATRIX

Las relaciones siguientes están respaldadas por código. Su contribución relativa a la percepción no se ha aislado mediante nuevos experimentos A/B.

| Factor                 | Mecanismo verificado                                           | Conclusión permitida                                         | Límite                                                                       |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Iluminación interior   | Cubemaps por estancia, PMREM, reflexión proyectada sobre cajas | La iluminación local modifica reflexión y respuesta material | No es simulación física validada del proyecto                                |
| Rebotes                | Captura y asignación de mapas; `maxPass = 1`                   | La implementación actual ejecuta una pasada en ese bucle     | El comentario histórico sobre dos rebotes no describe literalmente ese bucle |
| Materiales             | Color, rugosidad, normales y detalle procedural multiescala    | El acabado no depende solo del color base                    | Procedural no implica mejor aspecto ni menor coste                           |
| Filtrado               | Atenuación del detalle según tamaño proyectado                 | Existe una estrategia contra aliasing de detalle             | No garantiza ausencia de shimmer                                             |
| Contacto y profundidad | AO de pantalla y oclusión aproximada de estancia               | Contribuyen a la lectura de uniones y volumen                | Pueden producir halos o exceso de oscurecimiento                             |
| HDR                    | Render targets `HalfFloatType` y entorno de iluminación        | Existe un pipeline de rango alto interno                     | No implica salida HDR de pantalla                                            |
| Bloom/halation         | Extracción de brillos, blur y mezcla                           | **Bloom sí está implementado**                               | No demuestra que sea la causa principal del acabado                          |
| Tone mapping           | Curva ACES y exposición                                        | Afecta contraste y altas luces                               | No copiar valores como preset universal                                      |
| Resolución             | Presupuesto interno variable según fase                        | El detalle visible depende de resolución efectiva            | DPR del dispositivo no equivale a resolución interna                         |
| Cámara                 | Lente, encuadre y transiciones escritos para la casa           | La composición participa en la percepción                    | No generalizable a geometrías arbitrarias                                    |
| UI y tipografía        | Jerarquía, tarjetas, anotaciones y navegación                  | El acabado incluye composición editorial                     | Una imagen sin HUD no valida esos controles                                  |
| Movimiento             | Interpolación, revelado y efectos animados                     | Debe revisarse además de los stills                          | Un frame atractivo no demuestra continuidad                                  |

Fuentes: [house-looks.js (line 425)]\(C:/Users/temp123/work/ft3d-reference-workspace/lintel-flat-2d/001 Lintel/v10/house-looks.js:425), [code-materials.js (line 27)]\(C:/Users/temp123/work/ft3d-reference-workspace/lintel-flat-2d/001 Lintel/v10/code-materials.js:27), [fx-post.js (line 533)]\(C:/Users/temp123/work/ft3d-reference-workspace/lintel-flat-2d/001 Lintel/v10/shared/fx-post.js:533) y [scene.js (line 4149)]\(C:/Users/temp123/work/ft3d-reference-workspace/lintel-flat-2d/001 Lintel/v10/scene.js:4149).

### Premium-quality synthesis

El patrón transferible es **coherencia entre representación, iluminación, detalle, cámara, estabilidad y legibilidad**.

Para Rubik, una experiencia de calidad debe además:

- representar el proyecto real;
- conservar unidades, identidades y autoridades;
- restaurar el editor;
- seguir siendo entendible con movimiento reducido;
- mantener lectura útil en móvil;
- mostrar honestamente estados parciales o no disponibles.

Un acabado más fotográfico no compensa información falsa ni una interacción inaccesible.

## CLASSIFICATION — DIMENSIONES SEPARADAS

Clasificación de mecanismos, **sin decidir su incorporación**:

| Mecanismo                                               | Técnica                                                      | Fuente / licencia             | Recursos o dependencias                             | Riesgo     |
| ------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------- | --------------------------------------------------- | ---------- |
| Capturas repetibles por estados reales                  | ALREADY SOLVED parcialmente en Rubik                         | Implementación propia         | Usar recursos autorizados                           | LOW        |
| Comparación de una variable bajo condiciones constantes | PRINCIPLE ONLY                                               | Lintel: REFERENCE ONLY        | Sin recursos donantes necesarios                    | LOW        |
| Herramientas Lintel de QA                               | DONOR-SPECIFIC                                               | REFERENCE ONLY                | Dependencias del entorno del autor                  | MEDIUM     |
| Ratio de flicker como gate universal                    | DECISION REQUIRED                                            | Heurística de referencia      | Calibración propia necesaria                        | HIGH       |
| Normales procedurales y filtrado                        | PRINCIPLE ONLY                                               | Código Lintel: REFERENCE ONLY | ASSET LICENSE REVIEW REQUIRED si deriva de recursos | HIGH       |
| Cubemaps y oclusión por estancia                        | PRINCIPLE ONLY                                               | Código Lintel: REFERENCE ONLY | DEPENDENCY LICENSE REVIEW REQUIRED                  | HIGH       |
| Pipeline postFX concreto de Lintel                      | DONOR-SPECIFIC                                               | REFERENCE ONLY                | DEPENDENCY LICENSE REVIEW REQUIRED                  | HIGH       |
| Exportación REA de fuentes retenidas                    | DIRECT como herramienta externa                              | REUSABLE WITH ATTRIBUTION     | Revisar dependencias si se distribuye               | LOW        |
| Cobertura de ejecución REA                              | DIRECT como operación de investigación                       | REUSABLE WITH ATTRIBUTION     | Entorno y operación explícitos                      | MEDIUM     |
| REA dentro del runtime Rubik                            | DONOR-SPECIFIC para este propósito; sin necesidad acreditada | MIT no justifica introducirlo | DEPENDENCY LICENSE REVIEW REQUIRED                  | HIGH       |
| Reutilización de fotos, vídeos o capturas donantes      | DECISION REQUIRED                                            | REFERENCE ONLY                | ASSET LICENSE REVIEW REQUIRED                       | HIGH       |
| Mejora visual efectiva en Rubik mediante estas técnicas | UNVERIFIED                                                   | Según implementación futura   | Según recursos elegidos                             | UNVERIFIED |

## D21 — CAPABILITIES AUDIT

### Capacidades verificadas por fuente

| Capacidad                              | Evidencia                   | Frontera                                                           |
| -------------------------------------- | --------------------------- | ------------------------------------------------------------------ |
| Descubrir e inspeccionar un target CDP | `CdpBrowserProvider`        | Target/origen admitido; cobertura limitada                         |
| Obtener texto de scripts               | `Debugger.getScriptSource`  | Fuente expuesta por el navegador, no prueba de ejecución           |
| Escenarios declarativos                | `PlaywrightScenarioActions` | Acciones explícitas; no demuestra causalidad por mera coincidencia |
| Exportar scripts retenidos             | `PublishWebScripts`         | Bytes, hashes, manifiesto y limitaciones                           |
| Comparar capturas                      | Provider de comparación     | Detectar diferencias no explica su causa                           |
| Observar ejecución                     | `CdpExecutionCapture`       | Cobertura V8 en una ventana instrumentada                          |

[PublishWebScripts.ts (line 32)]\(C:/Users/temp123/work/ft3d-reference-workspace/rea/src/browser/assets/PublishWebScripts.ts:32) declara que no vuelve a descargar ni ejecuta las fuentes exportadas. Conserva limitaciones sobre mapas de fuente, imports, variantes de URL y procedencia.

### Distinción crítica: fuente frente a ejecución

[La captura pasiva (line 16)]\(C:/Users/temp123/work/ft3d-reference-workspace/rea/src/browser/CdpScriptSourceCapture.ts:16) obtiene código mediante Debugger.

[La observación de ejecución (line 18)]\(C:/Users/temp123/work/ft3d-reference-workspace/rea/src/browser/execution/CdpExecutionCapture.ts:18) activa `Profiler.startPreciseCoverage`, toma una muestra y registra efectos de instrumentación:

- reinicia contadores;
- impide ejecución optimizada mientras está activa;
- devuelve rangos y conteos, no una traza cronológica;
- la ausencia de cobertura no significa ejecución cero;
- excluye determinados contextos y tipos de código.

Por tanto, **no debe afirmarse que REA carece de instrumentación runtime**. Tampoco debe atribuirse esa capacidad a una captura pasiva.

### Límite de procedencia de respuestas

REA conserva una advertencia específica: `Response.body()` de Playwright puede obtener bytes mediante una carga posterior cuando CDP no conserva el cuerpo. El vínculo con un evento no prueba que los bytes pertenezcan a la transacción original.

Fuente: [browserNetworkEvidence.ts (line 4)]\(C:/Users/temp123/work/ft3d-reference-workspace/rea/src/domain/browserNetworkEvidence.ts:4).

### Estado de ejecución en este Cut

Se auditó el código y su correspondencia de revisiones. **No se lanzó REA, no se instrumentó un navegador y no se ejecutaron sus suites.** La disponibilidad operativa de esos proveedores en este equipo queda **UNVERIFIED**.

## REA TRIGGER MODEL

| Pregunta pendiente                                        | Primera opción                               | Escalado justificado                                |
| --------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------- |
| ¿Cómo está implementado un mecanismo con fuente completa? | Código y tests                               | REA innecesario                                     |
| ¿El deployment corresponde al código disponible?          | Comparar recursos y hashes                   | Captura acotada si faltan bytes o procedencia       |
| ¿Qué ocurre al realizar una interacción?                  | Escenario de navegador reproducible          | REA si se necesita evidencia estructurada adicional |
| ¿Se ejecutó una función durante una acción?               | No inferirlo de su descarga                  | Operación explícita de cobertura                    |
| ¿Por qué un frame cuesta más?                             | Medición normal sin instrumentación invasiva | Perfilado específico separado                       |
| ¿Un bundle inaccesible oculta el mecanismo?               | Inventario y fuentes disponibles             | Análisis del artefacto autorizado                   |
| ¿Sigue sin poder demostrarse?                             | Registrar límite                             | **UNVERIFIED**, sin prolongar indefinidamente       |

Regla de parada: detener la investigación cuando una nueva observación no vaya a cambiar materialmente la clasificación.

En este Cut, código, documentación y evidencias existentes bastan para las decisiones metodológicas. No quedó una pregunta que justificase ejecutar REA.

## REVERSE-ENGINEERING / CLEAN-ROOM BOUNDARY

La investigación puede producir una descripción independiente de:

- entradas y salidas;
- invariantes;
- mecanismo general;
- restricciones;
- pruebas necesarias.

No autoriza trasladar código, shaders, cámaras, activos ni detalles expresivos de Lintel.

Además, haber leído la implementación **no permite certificar una separación clean-room formal**. Si posteriormente se exige ese proceso, deberán definirse responsables, materiales permitidos y trazabilidad independiente.

La especificación futura debe apoyarse en autoridades Rubik y pruebas propias. Ningún código capturado por REA cambia de licencia por haber sido exportado.

## EVIDENCE LEDGER

**S:** fuente inspeccionada. **V:** evidencia visual anterior revisada ahora. **P:** expectativa propuesta, no ejecutada.

| ID  | Evidencia                                     | Estado y alcance                                                                  |
| --- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| E01 | Atlas D20/D21, checkpoint fijado              | S: identidad confirmada                                                           |
| E02 | Brief y herramientas Lintel                   | S: proceso y fórmulas inspeccionados                                              |
| E03 | Lintel v10: materiales, iluminación y postFX  | S: mecanismos presentes; contribución perceptiva relativa no aislada              |
| E04 | `lintel-local-hero.jpg`                       | V: composición de entrada; sin medición causal                                    |
| E05 | `lintel-local-living.jpg`                     | V: loader «100%» visible; **rechazada como imagen final limpia**                  |
| E06 | `lintel-live-0.5.jpg`                         | V: escena y dossier publicados; sin identidad binaria completa acreditada         |
| E07 | `lintel-local.cjs`                            | S: esperaba `__rig.jump` y un tiempo fijo; no garantizaba desaparición del loader |
| E08 | Provider/exportación REA                      | S: procedencia y límites verificados                                              |
| E09 | Cobertura V8 REA                              | S: operación y perturbaciones verificadas; ejecución local UNVERIFIED             |
| E10 | Master actual axon/Story/QA                   | S: capacidad y generación de manifiestos presentes; no suite ejecutada            |
| E11 | FT3D-6 §47 y §50                              | S: expectativas y P1–P11 consultados; sin resolución ni modificación              |
| E12 | Nuevas comparativas controladas Rubik/donante | P: no generadas; requieren autorización posterior                                 |

Las imágenes anteriores son evidencia histórica, no un nuevo paquete de aceptación.

### Hipótesis contrastadas sin respaldo

- **«El acabado procede solo de materiales procedurales».** No respaldada: intervienen luz, entorno, AO, exposición, cámara y postFX.
- **«Lintel no usa bloom».** Refutada por código.
- **«No hay HDR».** Refutada para los buffers internos; salida HDR de pantalla no acreditada.
- **«El bucle actual realiza dos pasadas de captura».** Refutada: `maxPass = 1`.
- **«Menos descargas implica necesariamente menos coste de frame».** No respaldada.
- **«Un screenshot generado acredita escena lista».** Refutada por E05.
- **«REA exporta scripts, por tanto demuestra ejecución».** Refutada.
- **«REA solo observa pasivamente».** Refutada por su operación de cobertura.
- **«Ya existe un ledger QA persistente completo en producto».** No acreditada: existen manifiestos de salida/QA, con alcances diferentes.

### Cobertura y exclusiones

Se inspeccionaron fuentes directas de D20/D21, Lintel v10, licencias, herramientas QA Rubik, cambios del master y documentación FT3D-6. Se revisaron tres imágenes existentes.

No se reprodujeron los benchmarks del autor, no se midió GPU física, no se ejecutaron tests ni escenarios nuevos y no se hizo una nueva auditoría de las 14 variantes.

## EVIDENCE EXPECTATIONS FOR FUTURE SCULPTURE

Un paquete futuro debería identificar:

- SHA exacto, limpieza del checkout y revisión de fixture.
- Estado/escena, progreso, sentido y condiciones de entrada.
- Cámara, viewport, DPR y resolución interna efectiva.
- Renderer, iluminación, calidad material y recursos autorizados.
- Readiness comprobada: sin loader, errores o recursos pendientes relevantes.
- Comparación con condiciones equivalentes.
- Forward, reverse real, seek, cancelación, salida y restauración.
- Reduced motion y formatos móviles.
- Mediciones normales separadas de las instrumentadas.
- Hashes de artefactos y revisión humana identificada.

Las secuencias de frames permiten revisar estados y continuidad. **No demuestran rendimiento en tiempo real**, especialmente bajo SwiftShader.

Proceso posterior posible:

**candidato → análisis → REA si hace falta → especificación independiente → autorización explícita de Sculpture → implementación → QA → evidencia → revisión → aprobación humana**

Este Cut no inicia ese proceso.

## RELATION TO CUTS 1–4

| Cut                 | Dependencia metodológica de D20/D21                                                      |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Cut 1 — D01–D08     | Separar encuadre, shaders y composición; aislar variables y preservar restauración       |
| Cut 2 — D09–D13     | Probar identidades y geometrías reales; no fijar tests a la casa donante                 |
| Cut 3 — D14/D15/D19 | Distinguir cámara, escala, luz y detalle; no deducir causalidad desde un still           |
| Cut 4 — D16–D18     | Separar tiempo visual de datos constructivos; un Gantt atractivo no valida planificación |

No se reabren esos mecanismos ni se decide su disposición final.

## ATLAS DELTAS — REGISTRADOS, NO APLICADOS

| Delta                                                | Implicación para una reconciliación futura                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Master avanzó e incorpora axon/exploded              | Revisar las afirmaciones históricas de ausencia/WIP usando código integrado y evidencia correspondiente |
| REA tiene cobertura explícita de ejecución           | Conservar la advertencia sobre captura pasiva y añadir el alcance de la operación instrumentada         |
| Comentario de dos rebotes frente a una pasada actual | Priorizar implementación y versión sobre comentarios históricos                                         |
| Captura local con loader                             | No usar ese artefacto como referencia final limpia                                                      |
| Manifiestos Rubik ya existentes                      | Precisar cobertura antes de proponer otro ledger                                                        |
| Bloom y HDR verificados en Lintel                    | Evitar explicaciones monocausales del acabado                                                           |

No se modificó el Atlas ni se hizo reconciliación global.

## FT3D-6 — P1–P11 IMPACT

Se registran necesidades de evidencia para una revisión posterior. **No se resuelve ni modifica §50.**

| Pendiente                       | Impacto de Cut 5                                                         |
| ------------------------------- | ------------------------------------------------------------------------ |
| P1 availability/reason          | Evidencia de estados soportados, parciales y no disponibles              |
| P2 adapterId                    | Identificar el adapter ejecutado, sin inferirlo de una etiqueta          |
| P3 scope/coverage               | Registrar niveles incluidos/excluidos; la apariencia no prueba cobertura |
| P4 variantes                    | Paquetes distinguibles para compacta y separación por niveles            |
| P5 anchors                      | Comparar entrada/salida con el anchor efectivo                           |
| P6 repetibilidad                | Ciclos y repetición real, sin acumulación ni drift                       |
| P7 reduced holds                | Mostrar targets y estados reducidos reales                               |
| P8 levelView/site-context       | Evidencia de ownership, visibilidad y restauración                       |
| P9 partial/unsupported          | Conservar razón y elementos omitidos                                     |
| P10 timing                      | Separar duración narrativa, frames generados y tiempo de ejecución       |
| P11 overview building/sin rooms | Exigir autoridad ejecutable; un encuadre global no la acredita           |

El nuevo master aporta evidencia fuente relevante. Su incorporación a FT3D-6 sigue perteneciendo a la reconciliación autorizada correspondiente.

## DUAL CARRY-FORWARD LEDGER

### A. Calidad y futura implementación

| Hallazgo                            | Destino posterior            | Efecto                              |
| ----------------------------------- | ---------------------------- | ----------------------------------- |
| Readiness basada en estado          | Harness QA propio            | Evitar capturas incompletas         |
| Variables visuales separadas        | Comparativas controladas     | Mejorar atribución causal           |
| Estabilidad y rendimiento separados | Mediciones propias           | Evitar scores engañosos             |
| Reverse real y restauración         | Story/runtime existentes     | Proteger comportamiento             |
| REA bajo pregunta concreta          | Workspace de investigación   | Evitar dependencia de producto      |
| Recursos y código con trazabilidad  | Especificación independiente | Preservar frontera de reutilización |

### B. Documentación y revisión

| Hallazgo                                     | Destino posterior       | Efecto                                         |
| -------------------------------------------- | ----------------------- | ---------------------------------------------- |
| Master y capacidades avanzados               | Reconciliación global   | Actualizar baseline                            |
| Captura E05 inválida como final              | Índice de evidencias    | Etiquetar o sustituir posteriormente           |
| Captura pasiva/cobertura diferenciadas       | Metodología REA         | Corregir alcance de afirmaciones               |
| Fuente, activos y dependencias separados     | Registro de procedencia | No ocultar licencia tras clasificación técnica |
| P1–P11 requieren evidencia propia            | Revisión FT3D-6         | No promover por semejanza visual               |
| Paquetes Cuts 3/4 no acreditados en archivos | Inventario de cierre    | Evitar inventar disponibilidad documental      |

Ambos ledgers son resultados de auditoría. No constituyen tareas de implementación creadas ni selección de candidatos.

## ELEMENTS NOT TO PORT

- Código y activos Lintel sin permiso acreditado.
- Identificadores, coordenadas, cámaras y timings de la casa.
- Paletas y branding de la demo.
- DPR o presupuestos de píxeles como constantes universales.
- Presets de renderer sin validación en Rubik.
- Shaders y recetas postFX del donante.
- Tests dependientes de habitaciones o claves Lintel.
- REA como dependencia runtime de producto.
- Screenshots o vídeos donantes como activos de producto.
- Recursos de terceros sin revisión independiente.
- Ratios o puntuaciones como sustitutos de aprobación humana.

## AUDIT ACCEPTANCE / PACKAGE AVAILABILITY

| Requisito Cut 5                             | Resultado                        |
| ------------------------------------------- | -------------------------------- |
| D20/D21 identificados y revisiones fijadas  | Cumplido                         |
| Proceso D20 y causalidad visual auditados   | Cumplido, con límites explícitos |
| Capacidades y triggers REA delimitados      | Cumplido por inspección fuente   |
| Fronteras de reutilización registradas      | Cumplido                         |
| Evidence Ledger y Dual Carry-Forward Ledger | Incluidos                        |
| Relación Cuts 1–4 y deltas Atlas            | Registrada, sin reconciliación   |
| Impacto P1–P11                              | Registrado, sin resolver         |
| Implementación o cambios canónicos          | Ninguno                          |

### Disponibilidad para futura reconciliación global

| Cut   | Paquete verificable disponible                                                 | Estado                     |
| ----- | ------------------------------------------------------------------------------ | -------------------------- |
| Cut 1 | Documento versionado, checkpoint `6a573f1955fd70dd52bb10450c9b9df9b4833aa0`    | YES                        |
| Cut 2 | Documento versionado, checkpoint `cc04f67fc0b46c87bc696bf566adb362f43041fd`    | YES                        |
| Cut 3 | Resultado referido en conversación; paquete completo en archivos no acreditado | UNVERIFIED                 |
| Cut 4 | Informe en conversación; paquete completo en archivos no acreditado            | UNVERIFIED                 |
| Cut 5 | Este informe; sin archivo persistido por diseño                                | Disponible en conversación |

**La disponibilidad documental completa de Cuts 1–5 para una reconciliación global queda UNVERIFIED.** No se ha realizado esa reconciliación.

READY FOR HUMAN REVIEW no significa aprobación humana.

## CONTROL RESULT

**CUT 5 AUDIT STATUS: READY FOR HUMAN REVIEW**

```
Product modified: NO
Contracts modified: NO
Claude branch touched: NO
Implementation performed: NO
Sculpture performed: NO
FT3D-6 modified: NO
Canonical docs reconciled: NO
Commit/push/PR/merge: NO
Worktrees clean: YES
Cuts 1–5 ready for global reconciliation: UNVERIFIED
```

Limpieza verificada en el checkout de análisis y los cuatro repositorios de referencia. Los worktrees ajenos quedan excluidos de esa afirmación.