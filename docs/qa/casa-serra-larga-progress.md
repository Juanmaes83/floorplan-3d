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

## Incrementos

| ID | Estado | Alcance concreto | Dependencia | Aceptación observable | SHA probado | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| R0 | verificado localmente | Baseline, fuentes y continuidad | #38 probado | Fuentes y rama verificadas; suites de #38 repetidas con runtime fijado; checkpoint listo | `a1341ee` | Logs externos R0; capturas `docs/qa/artifacts/casa-serra/r0/`; revisión visual arriba |
| R1 | pendiente | CS-1 mínimo; M01–M04, mínimos M05/M06/M19 | R0 | Vista general y una estancia real; controles, ficha, cancelación y retorno intacto en escritorio/móvil | — | — |
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
| M01 | pendiente | Presentación reversible por estancias | R0 | Ejemplo, importado y propio; cerrar sin mutar proyecto, selección ni historial | — | — |
| M02 | pendiente | Fichas y marcadores reales | M01 | Nombre, área y acabados del roomId; texto seguro y foco usable en móvil | — | — |
| M03 | pendiente | Poses y encuadre derivados | M01 | Mismo proyecto/revisión produce poses repetibles; ejes, diagonal y resize correctos | — | — |
| M04 | pendiente | Controles y movimiento reducido | M01 | Teclado/touch/Escape, sin animación obligatoria ni interferencia con inputs | — | — |
| M05 | pendiente | Calidad y fallback por capacidad | M01 | WebGL/asset/context loss recupera 2D sin alterar documento | — | — |
| M06 | pendiente | Carga por etapas cancelable | M01 | Publica escena básica; recursos tardíos no cruzan proyectos; cancelar libera lo propio | — | — |
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
| M19 | pendiente | Créditos y procedencia | transversal | Cada técnica/recurso incorporado tiene origen y permiso registrado | — | — |
| M20 | pendiente | Presentación portable | M11 | Piloto con uso concreto, identidad/revisión y archivo reimportable o diferimiento motivado | — | — |

## Próxima acción ejecutable

Validar y publicar el commit documental R0 con los archivos fuente y este seguimiento. Después escribir aceptación específica de R1 y comenzar la implementación de presentación reversible sobre el proyecto real, sin modificar FloorPlanProjectV1. Comprobar STOP externo antes de cada ejecución larga.
