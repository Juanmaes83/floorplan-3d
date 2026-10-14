# Casa Serra y Casa Larga — seguimiento de desarrollo

Fecha de apertura: 14-10-2026. Rama: `feat/casa-serra-larga-improvements`. Base: `a1341eeef82c651914da08ff78328e668091ea78` (#38, aún draft). Este documento registra trabajo nuevo; las auditorías y los roadmaps anteriores son snapshots históricos.

## Convenciones y límites

Estados: pendiente, en curso, verificado localmente, bloqueado, diferido con motivo. El SHA probado y la evidencia se completan solo tras ejecutar las comprobaciones. Revisión humana, CI y merge se registran aparte. Los requisitos P01–P16 se encuentran en `casa-serra-integration-plan.md`.

La autorización de Juanma permite desarrollar y pasar al siguiente incremento tras aceptación automatizada y revisión visual del agente. No autoriza merges ni promoción manual a producción. La autorización de Casa Serra consta en la especificación; para Casa Larga se adaptan conceptos mediante implementación propia, sin copiar literalmente código mientras no conste licencia. M19 registra los recursos realmente usados. No se atribuye rendimiento de teléfono físico a SwiftShader.

## Baseline R0

- Worktree único escritor: `C:\Users\temp123\work\floorplan-3d-casa-serra`; HEAD inicial `a1341eeef82c651914da08ff78328e668091ea78`. `origin/feat/multiformat-guided-import` sigue en ese SHA y PR #38 abierta draft. PR #36 abierta draft en `d7f0972149b5605f6092290c5f7c4adcbc5f9029`; sus fuentes están copiadas sin seguimiento. No se fusiona su rama.
- Fuente documental: auditoría Markdown y Word, especificación CS-1/CS-2/CS-3, protocolo P01–P16, workflow, contrato FloorPlanProjectV1, roadmap canónico, Roadmap 2 e informe de #38 leídos. Word y Markdown contienen la misma matriz M01–M20. No se encontró `AGENTS.md` aplicable.
- Runtime local: Node `22.13.0`, Playwright `1.62.1`, Chromium en `C:\Users\temp123\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe` comprobados. Resultado histórico de #38: unitarias 176/0/1 y 165/0/1; navegador 26/26 y 45/45. Repetido sobre el mismo código en esta rama.
- Repetición local sobre `a1341ee`: sintaxis de los siete módulos de ambos workflows correcta; unitarias de multiformato **176 pass, 0 fail, 1 skip** y de guía **165 pass, 0 fail, 1 skip**; navegador de importación/guía **26/26** y regresiones de persistencia/3D/exportación **45/45**. Logs `r0-multiformat-unit.log`, `r0-guided-unit.log`, `r0-browser-import.log` y `r0-browser-regressions.log` en el directorio externo del supervisor. Capturas completas locales en `qa-results/serra-r0/{guide,intake,navigation}`; selección publicada en `docs/qa/artifacts/casa-serra/r0/`.
- Revisión visual real: se abrieron `guide/{1440x900,390x844,844x390}-3d.png`, `guide/{390x844,844x390}-full-editor.png`, `intake/390x844-guided-image.png` y `navigation/390x844-editor.png`. El 3D y el plano son visibles en los tres tamaños; imagen importada y navegación móvil son legibles. Riesgo preexistente del baseline: la barra superior horizontal aparece recortada en 390×844 y parte de la barra contextual de muebles queda fuera de la captura 3D vertical. R1 debe ubicar sus controles de presentación dentro del viewport y revisar este límite; no se atribuye el recorte a cambios de esta rama. Chromium utilizó SwiftShader; sin afirmación de rendimiento físico.
- Continuidad: supervisor local externo ya configurado y probado por su dueño; fixtures PASS y primera tarea real de esta sesión completada. Checkpoint externo: `C:\Users\temp123\work\floorplan-serra-supervisor\checkpoint.json`, sesión `01a13936-121c-7932-8a00-bb66e7baa6f7`. STOP externo: `C:\Users\temp123\work\floorplan-serra-supervisor\STOP`; comprobar antes de cada tarea larga. Un solo worker escritor.
- CI: los runs históricos de #38 no ejecutaron pasos por bloqueo de facturación; no equivalen a pruebas aprobadas. Revisión humana: pendiente. Merge: pendiente. Preview nueva: pendiente.
- PR de esta misión: [#39](https://github.com/Juanmaes83/floorplan-3d/pull/39), abierta en borrador contra `feat/multiformat-guided-import` con HEAD inicial `5c24490d04f561f34d07d9e82261b9711c7c015c`. El código probado en R0 sigue siendo `a1341ee`; el commit `5c24490` solo añade documentos y capturas.

## Incrementos

| ID | Estado | Alcance concreto | Dependencia | Aceptación observable | SHA probado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| R0 | verificado localmente | Baseline, fuentes y continuidad | #38 probado | Fuentes y rama verificadas; suites de #38 repetidas con runtime fijado; checkpoint listo | `a1341ee` | Logs externos R0; capturas `docs/qa/artifacts/casa-serra/r0/`; revisión visual arriba |
| R1 | verificado localmente | CS-1 mínimo; M01–M04, mínimos M05/M06/M19 | R0 | Vista general y una estancia real; controles, ficha, cancelación y retorno intacto en escritorio/móvil | `68b2f4ee96f2c1ec049c83ba68d25550a9affcfd` | 17/17 unitarias, 29/29 navegador final, 45/45 regresión editor, capturas `artifacts/casa-serra/r1/` |
| R2 | pendiente | CS-1 completo; M01–M06/M19 | R1 | Configuración de orden, poses derivadas, accesibilidad, carga cancelable y P01–P16 | — | — |
| R3 | pendiente | M07/M11/M13 | R2 | Lámina, capturas por estancia y minimapa exportan bytes válidos y restauran el estado | — | — |
| R4 | pendiente | CS-2; M08/M09 y control M05/M06 | R2 | Piloto PBR/UV/color y luz reversibles; comparación visual y presupuesto medido | — | — |
| R5 | pendiente | CS-3 visual; M10/M15 | R4 | Revelado por IDs y efectos acotados reversibles con geometría irregular y fallback | — | — |
| R6 | pendiente | CS-3 recorrido; M18 | R2 | Ruta interior completa libre de obstáculos o alternativa aérea declarada | — | — |
| R7 | pendiente | M12/M16 | R2 | Variantes con cámara común; agrupar solo si medición justifica y conserva IDs | — | — |
| R8 | pendiente | M14/M17/M20 | R2 | Pilotos independientes con caso de uso, presupuesto y reversibilidad; diferir con motivo si no justifican valor | — | — |
| R9 | pendiente | Cierre de M01–M20 | R1–R8 | Regresiones, capturas inspeccionadas, preview SHA exacto, matriz final y PR draft | — | — |

## Capacidades de la auditoría

| ID | Estado | Alcance concreto | Dependencia | Aceptación observable | SHA probado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| M01 | en curso | Presentación reversible por estancias | R0 | Ejemplo, importado y propio; cerrar sin mutar proyecto, selección ni historial | — | — |
| M02 | en curso | Fichas y marcadores reales | M01 | Nombre, área y acabados del roomId; texto seguro y foco usable en móvil | — | — |
| M03 | en curso | Poses y encuadre derivados | M01 | Mismo proyecto/revisión produce poses repetibles; ejes, diagonal y resize correctos | — | — |
| M04 | en curso | Controles y movimiento reducido | M01 | Teclado/touch/Escape, sin animación obligatoria ni interferencia con inputs | — | — |
| M05 | en curso | Calidad y fallback por capacidad | M01 | WebGL/asset/context loss recupera 2D sin alterar documento | — | — |
| M06 | en curso | Carga por etapas cancelable | M01 | Publica escena básica; recursos tardíos no cruzan proyectos; cancelar libera lo propio | — | — |
| M07 | pendiente | Lámina y anotaciones | M03 | Exportación real y legible con cotas/escala declaradas y geometría intacta | — | — |
| M08 | pendiente | PBR selectivo | M05/M06 | Mapas/color/normal/UV/escala alineados; fallback y presupuesto medido | — | — |
| M09 | pendiente | Luz/HDRI y presets | M08 | Comparación con cámara común; ajuste reversible y degradación por capacidad | — | — |
| M10 | pendiente | Revelado dibujo/material por IDs | M08 | Entidades correctas en suelos cóncavos/muros compartidos; restauración sin mutar | — | — |
| M11 | pendiente | Capturas por estancias | M03 | PNG por vista con bytes/dimensiones válidos; cámara y buffer restaurados | — | — |
| M12 | pendiente | Comparación de variantes | M03 | Misma referencia visual; variantes e IDs permanecen aislados | — | — |
| M13 | pendiente | Minimapa de orientación | M03 | RoomId y dirección correctos incluso en plano girado/irregular; plegable en móvil | — | — |
| M14 | pendiente | Reflejo selectivo | M08 | Recurso identificado, coste medido y fallback; sin reflejos globales falsos | — | — |
| M15 | pendiente | Sombras/efectos acotados | M08 | Beneficio visual revisado, coste medido y renderer base tras fallo | — | — |
| M16 | pendiente | Agrupación de geometría | M05 | Mejora medida y selección/exportación/asignaciones conservan IDs | — | — |
| M17 | pendiente | Detalles procedurales genéricos | M05 | Piloto identificable, coste medido y geometría/selección intactas | — | — |
| M18 | pendiente | Recorrido interior seguro | M03 | Trayectoria interpolada evita muros/puertas/muebles o usa alternativa aérea | — | — |
| M19 | en curso | Créditos y procedencia | transversal | Cada técnica/recurso incorporado tiene origen y permiso registrado | — | — |
| M20 | pendiente | Presentación portable | M11 | Piloto con uso concreto, identidad/revisión y archivo reimportable o diferimiento motivado | — | — |

## Próxima acción ejecutable

Continuar R2 con P11: fallo de asset/corrupción y pérdida de contexto WebGL, aviso y recuperación del documento 2D. Después abordar P14/P15/P16 y cerrar el resto del protocolo P01–P16. Comprobar STOP externo y actualizar checkpoint antes de una tarea larga.

## R2 — P06/P12, aceptación previa

1. El recorrido manual conserva Anterior, Siguiente y salto directo. En la primera y última parada se deshabilita el control imposible; título, indicador y parada resaltada coinciden con la cámara solicitada. No se ofrece reproducción automática, así que la pausa de P06 no tiene acción aplicable en este corte.
2. El recorrido muestra un contador propio de paradas visitadas, incluida la vista general. Solo cuenta una parada cuando su movimiento 3D termina correctamente; revisitas y saltos no duplican el conteo. El contador se reinicia en cada inicio y nunca se guarda en el proyecto ni en el sidecar de selección.
3. Recorrer todas las paradas, volver atrás y cerrar deja iguales el JSON, objetivo, evidencia de guía, historial, selección y vista. Error, cancelación o cambio de proyecto no atribuyen una parada tardía al recorrido nuevo.
4. Probar límites, saltos, revisitas, progreso y separación de la guía en Chromium; revisar visualmente indicador y controles en 1440×900, 390×844, 844×390 y 360×800, más resize. Abrir las capturas con la herramienta de imagen. Consola/pageerror vacíos.

### Corte R2 P06/P12 — verificado localmente

- El indicador «Recorrido: n de N vistas visitadas» cuenta solo vistas cuyo movimiento 3D terminó, sin duplicar revisitas. Se reinicia en cada inicio, queda fuera del proyecto y del sidecar, y se invalida al cerrar/cambiar de proyecto. El tour sigue siendo manual; la pausa no aplica porque no hay reproducción automática.
- Presentación navegador **14/14**; prueba dirigida con escucha de consola **1/1** y cero errores de consola/pageerror; regresiones de guía y navegación **9/9**. El caso P06/P12 recorre vista general y dos estancias con salto, Anterior, límites, revisita y reinicio, y compara JSON, objetivo, evidencia de guía, selección, historial y vista antes/después. Logs externos `r2-p06-p12-browser-initial.log`, `r2-p06-p12-console-targeted.log` y `r2-p06-p12-guide-regression.log`.
- Se abrieron capturas nuevas de las vistas en 1440×900, 390×844, 844×390 y 360×800, de la configuración horizontal y del resize 360×800→844×390. Contador y controles legibles dentro de cada viewport; diez PNG seleccionados en `docs/qa/artifacts/casa-serra/r2-p06-p12/`. El editor conserva el recorte móvil preexistente. M19: lógica y UI propias, sin copiar código Casa Larga.

## R2 — corte P04/P09/P10, aceptación previa

1. La configuración presenta todas las estancias válidas del proyecto activo. Cada una se puede incluir o excluir y mover arriba/abajo; la vista general permanece primero y no se permite iniciar sin alguna estancia. Cancelar no escribe metadata ni cambia proyecto, biblioteca, historial, selección o vista.
2. Confirmar inicio guarda únicamente un sidecar local `PresentationPlanV1` con `entryId`, `projectId`, revisión y `roomId` ordenados. Recargar recupera la selección y orden para esa entrada. Duplicados y variantes tienen otro `entryId`/`projectId` y no heredan el sidecar. JSON/ZIP exportados conservan su contrato anterior.
3. Al abrir un sidecar con revisión distinta o `roomId` eliminado, la UI explica la reconciliación, omite IDs ausentes y vuelve a derivar datos/poses de la geometría actual. Si no queda ninguna estancia válida, propone una selección nueva. Un sidecar corrupto se ignora con aviso recuperable.
4. Cambiar de proyecto o editar la geometría durante una presentación la detiene; ninguna operación tardía abre la presentación anterior ni usa una pose de otra entrada. Se conserva el retorno al editor aplicable y se mantienen `pageerror`/consola vacíos.
5. Pruebas unitarias del plan/sidecar y navegador en 1440×900, 390×844, 844×390; abrir visualmente configuración y paradas. Revisar además 360×800 para resize. La aceptación de P01–P16 completa de R2 se cerrará con los cortes restantes.

### Corte R2 P04/P09/P10 — verificado localmente

- Código probado `e5dd7c5617450e345b6a2fb1c07196849b0c3c87`. El sidecar local guarda `entryId`, `projectId`, revisión y `roomId` ordenados; no entra en `FloorPlanProjectV1` ni en la descarga JSON. Cancelar no escribe. Al recargar se recupera la configuración; una revisión distinta regenera las vistas y un ID ausente se omite con aviso. Cambiar de proyecto durante la presentación o su carga invalida el plan anterior. Cambiar geometría activa el retorno al editor. El resize vuelve a encuadrar la parada sin animación.
- Pruebas: núcleo del plan **3/3**; presentación y núcleo finales **14/14**; suite afectada de guía, navegación, importación y captura **50/50** antes del último guard de sidecar (las pruebas dirigidas finales cubren ese guard); regresión completa del editor y F2 **45/45**. Importación del workflow: **21/21** en tres suites; las otras **5/5** de guía figuran en la suite afectada, para un total equivalente **26/26**. Descarga JSON real comparada como objeto completo con el proyecto previo; el sidecar permanece aparte. `pageerror` vacío en los casos nuevos. La variante aislada pasó **1/1**. Logs externos `r2-presentation-final.log`, `r2-browser-affected.log`, `r2-browser-editor-regressions.log`, `r2-browser-import-regressions.log`, `r2-order-final-targeted.log`, `r2-switch-during-load.log` y `r2-variant-targeted.log`.
- Capturas finales abiertas con la herramienta de imagen en 1440×900, 390×844, 844×390 y 360×800, más orden modificado y resize 360×800→844×390. El primer intento horizontal recortaba el botón de inicio; se corrigió la altura y el scroll del diálogo y se repitió la captura. Selección, botones y salida quedan dentro del viewport. Evidencia versionada en `docs/qa/artifacts/casa-serra/r2-p04-p10/`. El recorte preexistente de la barra superior móvil del editor sigue siendo un riesgo aparte.
- R2 continúa en curso: este corte cierra P04/P09/P10, no acredita aún P01–P16 completo. M19: implementación propia; no se copió código ni recurso Casa Larga. CI remota no sustituye la evidencia local mientras los jobs sigan sin ejecutar pasos.
- Preview exacta del SHA de evidencia `1dbc9a3ca3dbdd3db681038eba98b8c3646743ab`: [despliegue Vercel](https://floorplan-3d-lkn8xiame-juanma-espinosas-projects.vercel.app/), deployment `7067406754` en estado `success`. Revisión real en Chrome autenticado: configuración con trece estancias, selección y reordenación de Baño en suite antes de Dormitorio principal, vista general 3D, parada 2/3 con cámara en Baño en suite y retorno visible al editor 2D. La preview está protegida por SSO; no se acredita acceso anónimo. Actions del mismo SHA: runs `38576295738` y `38576295869`, ambos `failure` con `steps: 0`; no ejecutaron pruebas y mantienen el bloqueo de facturación histórico. La aceptación indicada arriba es local, no CI aprobada.

## R1 — aceptación escrita antes de implementar

1. «Presentar mi vivienda» aparece en la búsqueda de acciones, en «Revisar y guardar» y en el editor completo. Buscar «tour» o «presentación en 3D» resuelve esa acción sin cambiar el objetivo elegido de la guía.
2. El diálogo de configuración muestra la vista general y al menos una estancia con `roomId` del proyecto activo; cancelar mantiene JSON canónico, entrada local, historial, selección, vista y foco. Si no hay geometría útil, explica el requisito y lleva a Distribuir.
3. Al iniciar, la escena muestra una vista general y una parada de estancia calculadas con el origen de `Core.geometry`, sin cámaras fijas de las demos. La ficha muestra nombre y área del polígono real. Anterior, Siguiente, salto directo y Volver a editar funcionan con teclado y tacto; controles visibles en 1440×900, 390×844 y 844×390.
4. Cerrar, Escape o Atrás durante carga o transición impide reapertura tardía. Desde 2D retorna a 2D; desde 3D restaura cámara, target, FOV, corte, luz, puertas visuales y modo. No se modifica el proyecto ni se marca una tarea de guía por visitar paradas. El estado de pointer lock solo se recupera por gesto.
5. WebGL no disponible o asset fallido deja el editor 2D y un aviso, sin cambiar JSON ni asignaciones. Revisar `pageerror`/consola, canvas en viewport y la selección/historial antes y después. El tour no añade dependencias ni copia código Casa Larga.

### Checkpoint de trabajo R1, previo a regresiones completas

- Cambios propios sin commit después de `5c24490`: `js/presentation-core.js`, `js/presentation-ui.js`, `css/presentation.css`, integración en `index.html`, acciones en `js/guide-core.js`/`js/guide-ui.js` y pruebas `tests/presentation-core.test.cjs`/`tests/presentation.browser.test.cjs`. `qa-results/serra-r0` y `qa-results/serra-r1` son evidencias locales sin seguimiento; las capturas históricas versionadas que regeneró R0 ya se restauraron.
- Pruebas dirigidas realizadas: core 2/2; guía unitaria 15/15; presentación navegador 7/7 (cuatro viewports, 3D→3D, Escape, Atrás, cancelación durante carga y falta de runtime); proyecto vacío 1/1; inspección de estado 3D ampliada 1/1. Esas ejecuciones corresponden a un diff anterior al último ajuste de diagnóstico y deben repetirse con el código final.
- Capturas `qa-results/serra-r1/{1440x900,390x844,844x390,360x800}-{config,overview,room}.png` abiertas visualmente en los tamaños relevantes. Correcciones aplicadas durante la revisión: panel de controles en horizontal, escena a pantalla completa, nombres localizados, encuadre adaptado a relación de aspecto y espera de pose final antes de capturar. El ejemplo se ve y los controles quedan dentro del viewport; repetir capturas tras el ajuste final.
- M19 en este corte: la implementación de lógica, cámara e interfaz es propia en los módulos actuales; se adaptan patrones descritos en la auditoría, sin trasladar código literal de Casa Larga ni incorporar recursos de sus demos. La autorización de Casa Serra figura en la especificación; este corte no importa recursos de esa demo.

### Cierre local R1 — 14-10-2026

- Código probado: `68b2f4ee96f2c1ec049c83ba68d25550a9affcfd`. Unitarias finales presentación y guía **17/17**; suite amplia de unidades anterior al último cambio visual **178 pass, 0 fail, 1 skip**. Navegador final presentación, guía, navegación, captura e importación guiada **29/29**; suite del editor, persistencia, reimportación, exportación real, F2 y 3D **45/45**. La suite específica de importación/guía de #38 pasó **26/26** antes de integrar CSS; después, el caso F2 local 360×800 y el navegador final confirman que la nueva presentación no añade solicitudes inesperadas. Logs externos `r1-unit-final.log`, `r1-browser-final.log`, `r1-browser-editor-regressions-final.log`, `r1-browser-import-regressions.log` y `r1-f2-targeted.log`.
- Se abrió visualmente la configuración, vista general y estancia de las capturas finales de 1440×900, 390×844, 844×390 y 360×800. Controles, ficha y estancia visible dentro de cada viewport; doce PNG publicados en `docs/qa/artifacts/casa-serra/r1/`. El encuadre en 390×844 y 844×390 prioriza la estancia, por lo que parte del resto de la vivienda queda fuera; el retorno al editor y la cámara original se comprobaron en navegador. El recorte de la barra superior del editor móvil es anterior a R1.
- Se corrigió un fallo de regresión detectado durante la ejecución completa: la hoja CSS adicional producía peticiones inesperadas para el flujo F2 local. Los estilos ahora se cargan con el HTML existente; el caso dirigido acabó con `unexpected: 0` y después la suite completa 45/45. Los artefactos históricos regenerados por los tests se restauraron antes del commit.
- M01–M06 son cortes parciales: el plan persistente, orden configurable, casos P09–P16, degradación avanzada y carga por etapas pertenecen a R2. M19: lógica y estilos originales de esta rama; ninguna copia literal del código Casa Larga ni recurso nuevo de sus demos. CI remota sigue sin prueba aprobada por el bloqueo de facturación histórico; la evidencia anterior es local. Revisión humana y merge pendientes.
- Preview del SHA de R1 `12500daf5c828c033ed78100470eb4fe657753c9`: [despliegue Vercel](https://floorplan-3d-3vj7qewda-juanma-espinosas-projects.vercel.app/), asociado a ese SHA por GitHub Deployments y marcado `success`. Se abrió en Chrome con sesión autorizada: inicio, ejemplo, configuración con estancias reales, vista general 3D, dormitorio principal y retorno a `#editor` visibles. La petición anónima responde 302 a SSO; el acceso público sin sesión no está acreditado. Los dos jobs de Actions del mismo SHA terminaron `failure` con `steps: []`; no ejecutaron las pruebas, conforme al bloqueo histórico de facturación. No se cuentan como CI aprobada.
