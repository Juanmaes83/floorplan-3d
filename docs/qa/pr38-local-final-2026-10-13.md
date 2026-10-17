# PR #38 — verificación local final, 13-10-2026

## Alcance y entorno

Se verificó la rama `feat/multiformat-guided-import` a partir del HEAD remoto `3e1e1dd755e2ccae23cce799006eea3fae4bdfe7`, más las correcciones de esta PR. El commit final se identifica en la propia PR. Se trabajó en un worktree aislado; los otros checkouts locales no se modificaron.

Se ejecutaron localmente los comandos de `.github/workflows/multiformat-import.yml` y `.github/workflows/guided-experience.yml` en Windows con **Node 22.13.0**, **Playwright 1.62.1** y Chromium compatible **151.0.7922.34**. `NODE_PATH` apuntó a la instalación aislada de Playwright y `CHROME` a su ejecutable. Se usaron `INTAKE_ARTIFACTS=qa-results/intake`, `NAVIGATION_ARTIFACTS=qa-results/navigation` y `GUIDE_ARTIFACTS=qa-results/guide`. El Python 3.12 local se expuso como `python3` en el PATH temporal para ejecutar, sin modificar, los casos F2 que invocan esa herramienta. `TMPDIR` apuntó a un directorio de trabajo local.

## Resultado local

| Fase de workflow | Resultado | Evidencia |
| --- | --- | --- |
| Sintaxis y fuente | Node `--check` de los módulos de ambos workflows, test de navegador y `git diff --check`: correctos. La fuente partió del SHA remoto indicado arriba. | Este informe y diff de la PR. |
| Unitarias de multiformato | **176 aprobadas, 0 fallos, 1 omitida** (Blender externo). | [Log](artifacts/pr38-local-final/multiformat-unit.log). |
| Unitarias de guía | **165 aprobadas, 0 fallos, 1 omitida** (Blender externo). | [Log](artifacts/pr38-local-final/guided-unit.log). |
| Importación, guía y navegación | **26 aprobadas, 0 fallos, 0 omitidas**. | [Log](artifacts/pr38-local-final/browser-import.log) y [capturas de intake](../../qa-results/intake). |
| Persistencia, calibración, 2D/3D y exportación | **45 aprobadas, 0 fallos, 0 omitidas**. | [Log](artifacts/pr38-local-final/browser-regressions.log), [capturas de guía](../../qa-results/guide) y [navegación](../../qa-results/navigation). |

La suite completa confirma las **nueve regresiones** registradas en [la integración](multiformat-integration-2026-10-13.md#revisión-de-las-nueve-regresiones-de-pr-38): rechazo atómico, conservación de entradas al importar JSON, touch 2D/3D vertical y horizontal, flujo F1b horizontal y los cuatro casos F2. La prueba de calibración guiada y sus dos cotas también pasa. Se verifican importación DXF, PDF, IFC, RoomPlan, imagen, JSON y ZIP; cancelaciones y navegación; guardado y recarga; exportación y reimportación; y escenas 2D/3D en escritorio 1440×900, móvil vertical 390×844 y horizontal 844×390. La importación de imagen también cubre 360×800.

El gesto 3D móvil se ensaya con el botón de rotación de la barra flotante, que es el control visible en móvil. La prueba exige además que el canvas esté completamente dentro del viewport y que sus píxeles cambien tras un gesto táctil con movimientos entre fotogramas. No se omitieron casos de navegador ni se rebajaron umbrales. El editor completo mantiene el requisito de canvas ≥60 % del alto.

## Correcciones tras la reproducción local

- `.gitattributes` fija LF para `js/wall-assist.js`: el test de procedencia compara el SHA de los bytes exactos y un checkout Windows con CRLF lo alteraba. La aserción de hash no cambió.
- El `body` móvil usa `overflow:clip` para impedir desplazamientos programáticos que sacaban la aplicación del viewport al enfocar controles fuera de la vista.
- El botón «Subir plano» reserva 2 px de margen de desplazamiento para quedar completamente visible en móvil; se conserva la comprobación de sus bordes dentro del viewport.
- El recorrido touch usa el control de rotación visible de la barra flotante, cierra la selección antes de orbitado y separa los movimientos por fotogramas. Se mantienen las comprobaciones de rotación, render, orbitado, cambio de orientación, regreso 2D y ausencia de errores.

## Límites de la evidencia

**Estos son resultados locales, no resultados de GitHub Actions.** Actions sigue bloqueado antes de ejecutar pasos por la facturación de la cuenta; los checks fallidos no representan una ejecución de pruebas. La PR permanece en borrador y no se fusiona. Chromium usó SwiftShader y emulación de viewport/touch; no se atribuye rendimiento ni compatibilidad física a teléfonos reales. RoomPlan aún requiere un escaneo real de iPhone y F2 sigue experimental.

La preview del commit publicado se revisa por separado; el estado READY por sí solo no sustituye los recorridos locales ni una ejecución de CI.
