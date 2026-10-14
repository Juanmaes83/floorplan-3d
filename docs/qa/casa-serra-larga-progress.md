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

Comenzar R2 con el plan configurable y persistido de estancias: definir aceptación de P04/P09/P10 y metadata aislada por entrada y revisión, implementar selección y orden, y probar `roomId` obsoletos. Comprobar STOP externo y actualizar checkpoint antes de una tarea larga.

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
