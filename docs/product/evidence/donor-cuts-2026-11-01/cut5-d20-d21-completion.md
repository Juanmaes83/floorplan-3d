# CUT 5 — COMPLETION PASS

**D20 · D21 — complemento del informe anterior**

Se conserva la investigación realizada. Este complemento completa los requisitos del adjunto íntegro y sustituye las clasificaciones y ledgers anteriores donde se indica expresamente.

No se ha implementado, iniciado Sculpture ni reconciliado documentación canónica.

## 1. CONTROL STATE

| Control                                | Resultado                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `master` remoto, comprobado nuevamente | `18848fbf3308ef8c2c8841edf626221f74922d23`                                                             |
| Checkout de análisis                   | `C:\Users\temp123\work\floorplan-3d-donor-gap-analysis-cut2`                                           |
| HEAD del checkout                      | `cc04f67fc0b46c87bc696bf566adb362f43041fd`                                                             |
| Código Rubik actualizado               | Cambios posteriores al baseline inspeccionados mediante objetos Git de `origin/master`                 |
| Reference Atlas                        | `7696fb2c6c30f158001d38ecc53feb2674acaa25`                                                             |
| Lintel source                          | `c6029d9bb0647483709a502daedc24c1dd7bc029`                                                             |
| Lintel live                            | `791612f6f07fdd79bafeedc74ec6c9eee0f9a86a`                                                             |
| Flat-to-3D                             | `d7b9b69753d3af679535ee56695a05c8d955c3c6`                                                             |
| REA                                    | Remoto `aa48d494e9726d469a1b9ed917f021d8a1a4c7ea`; checkout `d54a4661da20382ad8456564a08569fdd24131c5` |
| FT3D-6 consultado                      | Working contract `5db3c1b48972128f2769598141cbe2268b792bfa`                                            |
| Limpieza                               | Checkout de análisis y cuatro repositorios de referencia limpios                                       |

No se trató el código anterior a FT3D-5 como estado actual. El delta productivo se contrastó directamente con el master integrado. No se accedió a trabajo sin commit de Claude.

**Ejecuciones nuevas:** ninguna suite, benchmark, captura de navegador o instrumentación REA. Se hicieron comprobaciones Git y lecturas dirigidas para completar las secciones ausentes.

## 2. ENTREGABLES Y TAXONOMÍA DE EVIDENCIA

| Entregable requerido          | Resultado                                                            |
| ----------------------------- | -------------------------------------------------------------------- |
| Auditoría D20                 | Informe anterior, completado con inventario, diseño y estados de uso |
| Auditoría D21                 | Informe anterior, completado con operación y privacidad              |
| Explicación causal de calidad | Matriz completada abajo                                              |
| Evidence Ledger               | Se conserva E01–E12 y se amplía en §11                               |
| Dos carry-forward ledgers     | **Sustituidos por los dos destinos exclusivos de §14**               |

Clasificaciones utilizadas:

- **SOURCE-CONFIRMED:** implementación inspeccionada.
- **CONTRACT-CONFIRMED:** obligación documental; no demuestra ejecución.
- **VISUALLY-OBSERVED:** artefacto revisado visualmente.
- **RUNTIME-CONFIRMED / TEST-CONFIRMED:** reservados para ejecución acreditada.
- **INFERRED:** conclusión razonada, identificada como tal.
- **UNVERIFIED:** evidencia insuficiente.

En este completion pass no se añaden resultados `RUNTIME-CONFIRMED` ni `TEST-CONFIRMED`.

## 3. D20 — INVENTARIO COMPLETADO

### Inventario antes de clasificación

| Área                     | Fuente verificada                                    | Alcance                                             |
| ------------------------ | ---------------------------------------------------- | --------------------------------------------------- |
| Proyecto de referencia   | Lintel source y copia publicada                      | Landing arquitectónica de una casa diseñada         |
| Versión final declarada  | `001 Lintel/v10/`                                    | Separada de versiones históricas                    |
| Dirección de diseño      | Briefs de materiales, iluminación e iteración 9      | Decisiones por habitación y composición editorial   |
| Diseño 2D                | `theme.css`, `shared/fx-ui.css`, HTML                | Tokens, tipografía, tarjetas, HUD y responsive      |
| Geometría y contenido    | `scene.js`, `staging.js`                             | Casa, mobiliario, vegetación y detalles específicos |
| Materiales e iluminación | `code-materials.js`, `house-looks.js`, `code-sky.js` | Procedural, iluminación local y entorno             |
| Renderizado              | `fx-experience.js`, `fx-core.js`, `fx-post.js`       | Renderer, materiales base y pases                   |
| QA                       | Herramientas de stills, flicker y medición           | Captura, comparación y costes                       |
| Activos externos         | Fotografías, fuentes y dependencias                  | Derechos separados del código                       |

**SOURCE-CONFIRMED.** No se ha inventariado cada activo ni certificado su licencia individual.

### Dirección de diseño, no solo renderer

Existe evidencia de disciplina gráfica:

- Tokens explícitos para fondo, texto, acento y familias tipográficas.
- Papeles diferenciados para display, labels y cuerpo.
- Tratamiento coherente de tarjetas, retículas, navegación y dossier.
- Escalas tipográficas adaptables y media queries.
- Brief que separa la interfaz del contenido geométrico.

Fuentes: [theme.css (line 1)]\(C:/Users/temp123/work/ft3d-reference-workspace/lintel-flat-2d/001 Lintel/v10/theme.css:1) y [brief-iteration-9.md (line 50)]\(C:/Users/temp123/work/ft3d-reference-workspace/lintel-flat-2d/001 Lintel/v10/brief-iteration-9.md:50).

**Conclusión:** parte de la percepción de acabado procede de decisiones de composición y dirección visual. **INFERRED, confianza MEDIUM.** No se acredita un sistema de diseño completo ni una guía universal de espaciado.

### Producción y pulido: qué está probado

| Tramo del ciclo                                        | Evidencia                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Referencia congelada, comparación y defectos concretos | SOURCE-CONFIRMED en briefs                                                           |
| Correcciones acotadas y nueva revisión                 | SOURCE-CONFIRMED en documentación histórica                                          |
| Capturas repetibles y medición                         | SOURCE-CONFIRMED en herramientas                                                     |
| Revisión humana del propietario                        | Documentada por el autor; no observada independientemente aquí                       |
| Desktop/mobile                                         | Herramientas configurables y escenarios descritos; ejecución completa no reproducida |
| Reverse y restore equivalentes a Rubik                 | **UNVERIFIED**                                                                       |
| Loop completo aplicado siempre y sin excepciones       | **UNVERIFIED**                                                                       |

Se confirma un método repetible. No se afirma que todos sus pasos se ejecutaran en cada iteración.

## 4. D20 — CAPAS VISUALES Y FRONTERAS TÉCNICAS

| Capa                   | Evidencia encontrada                                                                   | Límite de la conclusión                                                       |
| ---------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Contenido y modelo     | Casa, mobiliario y paisaje escritos para la referencia                                 | Un contenido más elaborado no prueba un renderer superior                     |
| Geometría              | Miembros, marcos, elementos de puerta y capas específicas en `scene.js`                | No se certifican dimensiones constructivas ni superioridad geométrica general |
| Materiales             | `MeshStandardMaterial`, shaders y modificaciones de shading                            | No se acredita que todas las clases de material posibles estén presentes      |
| Mapas                  | Ruta histórica diffuse/normal/roughness/AO; sustitución procedural según configuración | Código disponible no implica mapas utilizados en la ruta final                |
| Filtrado               | Repetición, anisotropía y filtrado del detalle procedural                              | No garantiza ausencia de aliasing                                             |
| KTX2/Basis             | No acreditado en las rutas inspeccionadas                                              | **Not found**, no ausencia probada en todo el repositorio                     |
| Iluminación            | Luz direccional, hemisférica, luces de escena y entorno local                          | No equivale a cálculo lumínico profesional                                    |
| Sombras                | PCFSoft, configuración de mapa, bias y normalBias; cobertura selectiva                 | Calidad relativa no medida                                                    |
| Cámara                 | Perspectiva, FOV y composición por claves                                              | No es cámara genérica válida para cualquier proyecto                          |
| Contexto               | Suelo, cielo, vegetación y fondos                                                      | Parte del resultado pertenece al contenido de la demo                         |
| PostFX                 | Prepass, AO, bloom, mezcla y acabado                                                   | No copiar la receta como preset universal                                     |
| Representación gráfica | Papel, tinta, hatch, anotaciones y mezcla material                                     | La calidad arquitectónica también depende de lectura gráfica                  |
| UI/3D                  | Tarjetas y controles superpuestos                                                      | Debe evaluarse la región realmente libre                                      |
| Ciclo de vida          | Clonado, caches y liberación de algunos recursos                                       | Robustez de entrada/salida repetida **UNVERIFIED**                            |
| Rendimiento            | Presupuestos de resolución y estrategias de reducción                                  | **PERFORMANCE UNVERIFIED** en este Cut                                        |

### Configuración y versiones

Lintel v10 carga **Three.js 0.160.1** y configura salida sRGB y sombras PCFSoft. Su pipeline usa buffers half-float y acabado propio.

Rubik mantiene su versión vendorizada **0.160.0**, tone mapping ACES y configuración propia de iluminación y superficies. No debe equipararse el acabado final comparando únicamente nombres de propiedades.

Fuente Lintel: [fx-experience.js (line 33)]\(C:/Users/temp123/work/ft3d-reference-workspace/lintel-flat-2d/001 Lintel/v10/shared/fx-experience.js:33).

Los tamaños de shadow map, exposición, DPR y presupuestos de píxeles son decisiones de esas implementaciones. **No son recomendaciones de constantes para Rubik.**

## 5. MATRIZ CAUSAL Y ESTADO RUBIK

### Escalera obligatoria de uso

Para evitar sobreclasificación se distinguen:

1. API/dependencia disponible.
2. Implementación fuente.
3. Configuración.
4. Conexión al runtime.
5. Ejercicio en la ruta relevante.
6. Uso visual efectivo.

| Capacidad Rubik                     | API/fuente  | Configuración y conexión                              | Ejercitada en este Cut | Efectividad visual actual                     |
| ----------------------------------- | ----------- | ----------------------------------------------------- | ---------------------- | --------------------------------------------- |
| Story y axon/exploded               | Confirmadas | Conexiones inspeccionadas en master                   | NO                     | UNVERIFIED                                    |
| Normales y roughness de superficies | Confirmadas | Condicionadas a calidad y mapas disponibles           | NO                     | UNVERIFIED                                    |
| HDR de presentación                 | Confirmado  | Carga verificada y aplicación condicionada por preset | NO                     | UNVERIFIED                                    |
| Sombras                             | Confirmadas | Renderer y luces configurados                         | NO                     | UNVERIFIED                                    |
| Región libre de tarjeta             | Confirmada  | Enlace de UI con narrativa inspeccionado              | NO                     | UNVERIFIED                                    |
| Capturas y manifiestos QA           | Confirmados | Script existente                                      | NO                     | Artefactos del nuevo HEAD no revisados aquí   |
| Dossier y manifiestos de salida     | Confirmados | Ruta de producto existente                            | NO                     | No equivalen al ledger completo de aceptación |

**Corrección del informe anterior:** “ALREADY SOLVED” no debe entenderse como aceptación visual actual. La existencia de implementación reutilizable queda confirmada; su eficacia en un escenario concreto exige evidencia de los niveles 5–6.

### Estados que pueden asignarse honestamente

| Estado solicitado    | Aplicación en este Cut                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| MISSING              | No se asigna por una búsqueda incompleta                                                            |
| AVAILABLE BUT UNUSED | Requiere demostrar disponibilidad y ausencia de uso en una ruta concreta; no acreditado globalmente |
| ACTIVE BUT UNDERUSED | Requiere comparación controlada; no acreditado                                                      |
| EFFECTIVELY USED     | Solo cuando exista evidencia de ejercicio y efecto; no añadido en este pass                         |
| ALREADY SOLVED       | Limitado a responsabilidades cuya evidencia cubra el alcance; no a “calidad premium”                |
| DONOR-SPECIFIC       | Casa, claves, cámaras, paleta y timings de Lintel                                                   |
| DECISION REQUIRED    | Nuevas técnicas, gates estéticos o política de calidad                                              |
| UNVERIFIED           | Eficacia visual y rendimiento de las combinaciones no ejecutadas                                    |

### Diferencia → mecanismo → confianza → impacto

Las imágenes donantes y el producto Rubik no se capturaron aquí con condiciones equivalentes: **NOT DIRECTLY COMPARABLE**.

| Diferencia observada o hipótesis                | Mecanismo verificado                    | Confianza causal                                 | Estado Rubik                                           | Impacto probable                       |
| ----------------------------------------------- | --------------------------------------- | ------------------------------------------------ | ------------------------------------------------------ | -------------------------------------- |
| Lintel presenta composición editorial coherente | Tokens, jerarquía y overlays            | MEDIUM                                           | Composición propia existente; comparación pendiente    | Mejor integración UI/3D                |
| Interior con respuesta material rica            | Iluminación local, rugosidad y normales | MEDIUM                                           | Capacidades existentes; eficacia por escena UNVERIFIED | Diferenciación material                |
| Papel/dibujo con lectura específica             | Shading y representación gráfica        | MEDIUM                                           | Mecanismos de presentación propios                     | Claridad arquitectónica                |
| Detalle que cambia con distancia                | Filtrado por tamaño proyectado          | HIGH sobre el mecanismo; MEDIUM sobre el aspecto | Comparativa pendiente                                  | Menos aliasing potencial               |
| Imagen con altas luces suaves                   | HDR interno, bloom y tone mapping       | MEDIUM                                           | HDR/tone mapping existentes                            | No basta para justificar nuevos postFX |
| Hold oculto parcialmente por UI                 | Encuadre sin descontar tarjeta          | HIGH en el caso documentado FT3D-5               | Corrección integrada                                   | Composición responsive correcta        |
| “Procedural siempre es mejor”                   | No se confirma                          | LOW                                              | Sin conclusión                                         | No cambiar materiales por esa premisa  |

**Respuesta directa:** el acabado percibido resulta de contenido seleccionado, dirección gráfica, iluminación, materiales, cámara y estabilidad trabajando conjuntamente. No se ha demostrado superioridad cuantitativa global ni una causa tecnológica única.

### Categorías mínimas para aproximarse a la referencia

| Categoría         | Necesidad provisional                                                |
| ----------------- | -------------------------------------------------------------------- |
| Semántica         | Preservar datos, autoridades, estados y restauración                 |
| Geometría/gráfica | Volúmenes y separaciones legibles, sin detalles inventados           |
| Material/luz      | Diferenciación coherente usando capacidades realmente ejercitadas    |
| Composición       | Encajar el modelo en la región libre de UI                           |
| Renderer/color    | Controlar exposición, resolución y salida de color                   |
| Proceso de pulido | Comparación reproducible, revisión de movimiento y aprobación humana |

Son categorías de evaluación; no tareas de implementación ni disposición final de candidatos.

## 6. D21 — COMPLEMENTO OPERATIVO Y PRIVACIDAD

### Alcance real de capacidades

| Dimensión                           | Resultado                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| Análisis local JS                   | SOURCE-CONFIRMED; parsing y relaciones estáticas                                           |
| Dependencias/calls                  | Relaciones inferidas según herramienta; no grafo dinámico completo                         |
| Reconstrucción de estado            | Ayuda investigadora; reconstrucción semántica completa UNVERIFIED                          |
| Comportamiento                      | Escenarios y observaciones acotadas; no equivalencia universal                             |
| Otros artefactos/lenguajes          | Declarados por documentación; proveedores no validados en este Cut                         |
| Procedencia                         | Capturas, fuentes retenidas, hashes y limitaciones                                         |
| Determinismo                        | Artefactos comparables bajo condiciones declaradas; runtime no universalmente determinista |
| Instrumentación                     | Operación explícita de cobertura; altera optimización y contadores                         |
| Disponibilidad local de proveedores | UNVERIFIED                                                                                 |

### Ejecución, red y datos privados

La documentación dice que el análisis se realiza localmente y que los resultados llegan al agente, cuyo proveedor tiene su propia política de datos: [README REA (line 387)]\(C:/Users/temp123/work/ft3d-reference-workspace/rea/README.md:387).

| Pregunta                                     | Conclusión                                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| ¿Es local el análisis?                       | Documentado y respaldado por las rutas inspeccionadas                                         |
| ¿Todo permanece necesariamente en el equipo? | **NO puede garantizarse:** los resultados pueden incluir código y llegar al agente/proveedor  |
| ¿Puede contactar servicios externos?         | Sí según operación: navegación, recursos o mapas de fuente solicitados                        |
| ¿Necesita credenciales?                      | Depende del target y operación; no hay requisito universal demostrado                         |
| ¿Persiste datos?                             | Las exportaciones escriben fuentes y manifiestos; otras operaciones tienen su propio contrato |
| ¿Puede exponer código privado?               | Sí, mediante resultados, logs o artefactos compartidos                                        |
| ¿Se auditó todo el tráfico/telemetría?       | NO — UNVERIFIED                                                                               |

**No se recomienda un uso general sobre repositorios privados con garantía de “cero salida”.** Antes haría falta comprobar operación, destino de resultados, red, retención y política del agente.

REA no modifica permisos de acceso ni derechos de reutilización. El piloto sigue siendo **no requerido**: ninguna ambigüedad restante justificó ejecutarlo.

### Especificación independiente futura

Debería describir propósito, entradas, salidas, estados, errores, lifecycle, timing, invariantes y restauración, con referencias de evidencia.

Debe evitar código, comentarios, nombres arbitrarios, constantes y estructuras donantes innecesarias. Este informe no constituye una certificación formal clean-room.

## 7. GENERACIÓN Y REVISIÓN — GATES SEPARADOS

| Gate                | Evidencia necesaria                                                 | No lo sustituye        |
| ------------------- | ------------------------------------------------------------------- | ---------------------- |
| Generación          | Artefacto existente, SHA/configuración, logs y checksum             | Que el script exista   |
| Revisión técnica    | Resultado contrastado con contrato y estado esperado                | Que el proceso termine |
| Revisión visual     | Imágenes/vídeos efectivamente inspeccionados y defectos registrados | Generar contact sheets |
| Aceptación estética | Criterios observables y decisión humana                             | Métrica automática     |
| Aprobación humana   | Aprobador, versión y decisión explícitos                            | CI verde               |
| Integración         | Estado Git y autoridad documental                                   | Preview disponible     |

La captura anterior con loader supera únicamente el gate de existencia del artefacto; **no supera el de imagen final válida**.

## 8. FT3D-5 — CASO DE PROCESO, SIN REAPERTURA

El commit integrado [`bf3e5ca…`](https://github.com/Juanmaes83/floorplan-3d/commit/bf3e5ca5c8df1f6bc2bd61925a0a1456b2d1353d) distingue:

- Región de la parada para los extremos p0/p1.
- Región libre de la tarjeta para el hold axon/exploded.
- Reencuadre de la narrativa al cambiar dimensiones.

**SOURCE-CONFIRMED.** El encargo identifica que el defecto móvil fue detectado por revisión visual tras automatización verde; aquí no se reconstruyó aquella ejecución de CI.

Lecciones:

1. Dimensiones del canvas ≠ región útil.
2. Cobertura de viewport ≠ cobertura de todos los estados de overlays.
3. p0/p1 correctos no acreditan el hold intermedio.
4. La revisión debe mostrar la UI real.
5. Una futura aserción puede comprobar la envolvente proyectada respecto a la región libre; no sustituye la revisión estética.

No se reabrió ni modificó FT3D-5.

## 9. DEFECT DETECTION / QA MATURITY

La valoración corresponde al **método para detectar cada clase**, no a un PASS actual.

| Método                | Strong                                                          | Partial / weak                                    | Unsuitable                    |
| --------------------- | --------------------------------------------------------------- | ------------------------------------------------- | ----------------------------- |
| Unitarias             | Derivación, estados, invariantes, límites                       | Integración gráfica                               | Aceptación estética           |
| Browser automation    | Interacción, visibilidad, resize, restore y lifecycle definidos | Composición no expresada en asertos               | Calidad premium por sí sola   |
| Screenshots revisados | Clipping, encuadre, lectura de planos                           | Movimiento y rendimiento                          | Prueba de FPS                 |
| Vídeos revisados      | Continuidad, interrupciones, reverse, shimmer visible           | Causa técnica y rendimiento físico                | Certificar semántica oculta   |
| Manifiestos/logs      | Procedencia y reproducción                                      | Corrección del contenido                          | Aprobación visual             |
| Source/REA            | Mecanismos, conexiones y límites                                | Causalidad perceptiva                             | Aceptación humana             |
| Revisión humana       | Jerarquía, volumen, materiales e integración                    | Cobertura exhaustiva y detección de drift interno | Garantía determinista aislada |

### Estado de cobertura Rubik

- Unitarias, browser tests, scripts visuales y manifiestos: **SOURCE-CONFIRMED**.
- Casos reduced motion, reverse, restauración, niveles y lifecycle: presentes en código/pruebas inspeccionadas.
- Resultados actuales de esas suites: **UNVERIFIED en este Cut**.
- CI, deployment y preview del SHA actual: **no comprobados**.
- Revisión humana del paquete completo actual: **no acreditada aquí**.
- Checkout de análisis limpio: comprobado.

No se convierte presencia de tests en resultado PASS.

## 10. EVIDENCE PACKAGE Y ACEPTACIÓN VISUAL

Un paquete futuro necesita, como mínimo:

| Identidad/configuración            | Artefactos                      | Revisión                    |
| ---------------------------------- | ------------------------------- | --------------------------- |
| SHA final y revisión del fixture   | Screenshot/vídeo/log/manifiesto | Estado esperado y observado |
| Ruta, capability, variante y fase  | Nombre, ruta y checksum         | Defectos y severidad        |
| Progreso y forward/reverse         | Timestamp y herramienta         | Baseline conocido           |
| Viewport, DPR y resolución interna | Navegador y dispositivo/GPU     | Riesgos no automatizados    |
| UI visible y región libre          | Reduced motion y recursos       | Revisor y decisión          |

El SHA por sí solo no basta: assets, configuración y estado de UI también afectan al resultado.

**Corrección técnica y aceptación estética permanecen separadas.**

Los criterios estéticos observables son jerarquía, legibilidad de volumen, separación de planos, claridad de aristas, diferenciación material, coherencia lumínica, aliasing, composición, integración UI/3D y estabilidad. No se propone un score numérico universal.

## 11. EVIDENCE LEDGER ÚNICO — AMPLIACIÓN

Se conserva el ledger E01–E12 del informe anterior. Las siguientes entradas lo amplían; no crean otro ledger competidor.

| ID  | Conclusión / evidencia                                                    | Clasificación                    | Límite                                |
| --- | ------------------------------------------------------------------------- | -------------------------------- | ------------------------------------- |
| E13 | Tokens y dirección editorial en Lintel `theme.css` y brief de iteración 9 | SOURCE-CONFIRMED                 | Contribución perceptiva MEDIUM        |
| E14 | Configuración sRGB/PCFSoft y resolución interna diferenciada              | SOURCE-CONFIRMED                 | No demuestra superioridad             |
| E15 | Mapas detallados Rubik condicionados por calidad y recursos               | SOURCE-CONFIRMED                 | Ejercicio efectivo UNVERIFIED         |
| E16 | Corrección integrada de región libre FT3D-5, `bf3e5ca…`                   | SOURCE-CONFIRMED                 | Sin rerun visual                      |
| E17 | Análisis REA local, resultados expuestos al agente                        | Documentación confirmada         | Auditoría de egress global UNVERIFIED |
| E18 | Gates distintos de generación/revisión/aceptación                         | INFERRED y apoyado por contratos | No equivale a gate implementado       |
| E19 | Master remoto permanece `18848fb…`                                        | Comprobación Git ejecutada       | No certifica CI/preview               |
| E20 | Worktrees auditados limpios                                               | Comprobación Git ejecutada       | Excluye worktrees ajenos              |

Fuente E15: [surface-renderer.mjs (line 12)]\(C:/Users/temp123/work/floorplan-3d-donor-gap-analysis-cut2/js/surface-renderer.mjs:12). Ese archivo no forma parte del delta posterior al baseline; el enlace de presentación actualizado se contrastó en master.

### Cobertura y negativos

Las lecturas añadidas se limitaron a las secciones ausentes: tokens/CSS, configuración de renderer, superficies Rubik, corrección móvil integrada y documentación operativa REA.

No se acreditan:

- ausencia global de KTX2/Basis;
- uso efectivo de todos los mapas o presets;
- ciclo completo de restauración de Lintel;
- ausencia global de tráfico externo REA;
- mejora estética cuantitativa frente a Rubik.

Se conserva la distinción **not found ≠ proven absent**.

## 12. RELACIÓN CON CUTS 1–4 Y DELTAS ATLAS

| Referencia                              | Estado                          | Implicación                                                   |
| --------------------------------------- | ------------------------------- | ------------------------------------------------------------- |
| Cut 1 — cámara y representación         | REFINED                         | Evidenciar uso efectivo y región libre                        |
| Cut 2 — descomposición/navigation       | REFINED                         | Medir estado intermedio, UI y restauración conjuntamente      |
| Cut 3 — D14 composición                 | REFINED                         | Aislar contenido, cámara y renderer                           |
| Cut 3 — D15 sweep                       | UNCHANGED                       | Un frente shader no acredita desplazamiento de luz            |
| Cut 3 — D19 detalle                     | REFINED                         | Revisar filtrado, distancia y movimiento                      |
| Cut 4 — temporal                        | UNCHANGED                       | Calidad visual no acredita planificación                      |
| Baseline Atlas de FT3D-5                | NEW EVIDENCE                    | Master integrado posterior; actualizar solo en reconciliación |
| Afirmación general “REA no instrumenta” | CONTRADICTED, si se formula así | Captura pasiva y cobertura son operaciones diferentes         |

### Deltas pendientes, sin aplicarlos

- Precisar disponibilidad, conexión y uso efectivo.
- Incorporar el master posterior a FT3D-5.
- Diferenciar región canvas/región libre.
- Acotar el comentario histórico de rebotes a la implementación real.
- Etiquetar la captura con loader como no válida para aceptación final.
- Distinguir manifiestos de entrega, artefactos QA y revisión.
- Mantener los derechos de fuente, activos y dependencias separados.

## 13. FT3D-6 — ESTADOS Y NIVELES DE QA

Cut 5 respalda mantener separados:

**soporte semántico → ejecutabilidad técnica → aceptación visual**

No se cambia el resolver ni se introduce un nuevo estado contractual.

| Nivel conceptual      | Evidencia independiente necesaria            |
| --------------------- | -------------------------------------------- |
| Family                | Objetivo y límites compartidos               |
| Capability            | Soporte semántico, scope y razones           |
| Variant               | Comportamiento y disponibilidad propios      |
| Narrative state/phase | Holds, extremos, transiciones y framing      |
| Adapter               | Inputs, lifecycle, errores y restauración    |
| Story compuesta       | Anchors, orden, interrupciones y contexto UI |

Una capability soportada no valida visualmente todas sus variantes o fases.

## 14. DUAL CARRY-FORWARD LEDGER — SUSTITUCIÓN

Estos son los **dos destinos exclusivos** requeridos. Sustituyen la separación anterior por “implementación/documentación”.

### Ledger A — futura reconciliación global de Cuts 1–5

| ID  | Hallazgo                                     | Implicación provisional                                 |
| --- | -------------------------------------------- | ------------------------------------------------------- |
| G1  | Master posterior a FT3D-5                    | Actualizar baseline y afirmaciones históricas           |
| G2  | Calidad multicausal                          | Evitar disposición de candidatos por tecnología aislada |
| G3  | Disponible ≠ efectivo                        | Refinar clasificaciones con evidencia de ruta           |
| G4  | Lintel reference-only                        | Método útil; copia no autorizada                        |
| G5  | Captura ≠ ejecución; cobertura perturbadora  | Precisar metodología REA                                |
| G6  | Artefacto generado ≠ revisado                | Separar gates y responsables                            |
| G7  | Región libre distinta del canvas             | Evidencia de composición por fase/UI                    |
| G8  | Restauración prevalece sobre efecto          | Conservar invariantes de Cuts anteriores                |
| G9  | Licencias de terceros independientes         | Mantener trazabilidad por recurso                       |
| G10 | Paquetes Cuts 3/4 no verificados en archivos | No declarar reconciliación preparada sin comprobarlos   |

Son implicaciones provisionales: no finalizan REUSE/ADAPT/REIMPLEMENT.

### Ledger B — futura reconciliación FT3D-6 / P1–P11

| Gate | Implicación de evidencia                                    |
| ---- | ----------------------------------------------------------- |
| P1   | Disponibilidad y reason independientes de aceptación visual |
| P2   | Adapter real identificado y efectivamente invocado          |
| P3   | Scope/coverage con niveles incluidos y excluidos            |
| P4   | QA independiente de cada variante                           |
| P5   | Anchors y transición contrastados en extremos e intermedios |
| P6   | Repetición y ocurrencias sin drift                          |
| P7   | Holds reduced motion revisados                              |
| P8   | levelView/site-context, región UI y restauración            |
| P9   | Parcialidad/unsupported visibles y coherentes               |
| P10  | Duración narrativa separada de rendimiento y exportación    |
| P11  | Overview/ejecución sin rooms acreditados por autoridad real |

**Ningún P1–P11 queda cerrado en este Cut.**

### Ámbitos afectados

- **Calidad de implementación:** estados absolutos, ownership, regiones y restore.
- **Calidad de evidencia:** readiness, configuración, hashes y cobertura.
- **Separación clean-room:** especificación independiente y exclusión de contenido donante.
- **Aceptación visual:** revisión de artefactos completos, por variante y fase.

## 15. ACCEPTANCE GATES Y DISPONIBILIDAD FINAL

| Gate de auditoría                          | Estado                                     |
| ------------------------------------------ | ------------------------------------------ |
| D20/D21 identificados                      | Cumplido                                   |
| Revisiones y fronteras de fuente           | Cumplido                                   |
| Inventario, proceso y diseño D20           | Cumplido con cobertura declarada           |
| Causalidad y seis niveles de uso           | Completados                                |
| REA: capacidades, privacidad y trigger     | Completados; límites UNVERIFIED explícitos |
| Generación/revisión y madurez QA           | Completadas                                |
| Ledger único de evidencia                  | Ampliado                                   |
| Relación Cuts anteriores y deltas          | Registrada sin reconciliación              |
| Dos ledgers por destino                    | Corregidos                                 |
| FT3D-6/P1–P11                              | Implicaciones registradas; sin cierre      |
| Implementación/Sculpture/cambios canónicos | Ninguno                                    |

### Paquetes para la posterior reconciliación

| Cut   | Disponibilidad                                                                  |
| ----- | ------------------------------------------------------------------------------- |
| Cut 1 | YES — documento versionado                                                      |
| Cut 2 | YES — documento versionado                                                      |
| Cut 3 | UNVERIFIED — paquete completo en archivos no acreditado                         |
| Cut 4 | UNVERIFIED — informe conversacional; paquete completo en archivos no acreditado |
| Cut 5 | Informe base + este completion pass disponibles en conversación                 |

**Cuts 1–5 ready for global reconciliation: UNVERIFIED.**

No se han seleccionado candidatos finales, creado tareas ni iniciado la reconciliación. READY FOR HUMAN REVIEW no significa aprobación humana.

CUT 5 AUDIT STATUS: READY FOR HUMAN REVIEW

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