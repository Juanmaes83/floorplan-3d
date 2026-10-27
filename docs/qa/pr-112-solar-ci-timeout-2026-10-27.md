# PR #112 — estabilidad del test solar desktop (2026-10-27)

Estado: **7C-A CANDIDATO EN REVISIÓN**. Sin merge ni trabajo de 7C-B.

## Diagnóstico

Base inspeccionada: master bdfd1394e84df7adf856273ec9058516887f2697; candidato inicial 4108598892635c0b3f536f169c3094a0832be1ba.
El diff inicial tiene cinco archivos: CostProvider, sus tests y tres documentos. No cambia index.html, renderer, Solar, Three.js, Playwright ni helpers. cost-provider.js no se carga en index.html.

Categoría: **F (presupuesto único de un test monolítico), con coste gráfico B**. No se ha demostrado un bloqueo, race o fuga. El loop WebGL renderiza continuamente; desktop usa shadow map 4096 frente a 2048 con puntero coarse. Además, solo desktop entra en 3D y activa Noche ANTES de rellenar los seis campos. En móvil ese formulario se rellena todavía en 2D.

### Evidencia reproducible

- [Run fallido 40550923632, job 122366655778](https://github.com/Juanmaes83/floorplan-3d/actions/runs/40550923632/job/122366655778): desktop agota 180203.7 ms. PNG desktop 109421 ms; Solar móvil 72246 / 65729 ms. La captura morning del artifact se escribió a las 17:58:10Z; solar conserva su timestamp de checkout (17:52:02Z). Se agotó el presupuesto entre ambas capturas, durante los ajustes interactivos; **el log original no permite atribuirlo a una llamada individual**.
- [Run verde anterior a 7C-A, 40545962580](https://github.com/Juanmaes83/floorplan-3d/actions/runs/40545962580/job/122336533062): desktop 178406.6 ms, ya al 99.1% del límite; móvil 58521 / 52654 ms. No fue introducido por CostProvider.
- [Diagnóstico temporal 240761d, run 40558830157](https://github.com/Juanmaes83/floorplan-3d/actions/runs/40558830157/job/122382036451): 14/14 PASS sin modificar comportamiento ni timeout. Con marcas de fase y DEBUG=pw:api, desktop 108312.9 ms. Las APIs avanzan y completan sus acciones; no queda una promesa esperando 180 s. Esta variación confirma que el presupuesto agregado dependía del rendimiento del runner.
- En ese diagnóstico: setup 1.2 s; entrada 3D/Noche 12.5 s; formulario con 3D activo 23.4 s; configuración hasta morning 56.4 s; ajustes/PNG/restauración 49.8 s; persistencia 2.0 s. Guardar norte consume 9.8 s y la secuencia nocturna 14.2 s. Incluso la consulta de overflow tarda 3.5 s entre frames. El readback PNG tarda 0.65 s, reload/import ~1 s y cierre ~0.2 s: no eran el cuello principal.
- Local original: 5/5 PASS, desktop 6.3 s con Chrome; Node 22.13.0 + Playwright 1.62.1 + Chromium 151.0.7922.34 también 5/5, desktop 8.0 s. Con SwiftShader forzado, desktop 15.9 s. No se reprodujo el timeout localmente.

## Corrección y cobertura

Solo cambia tests/solar.browser.test.cjs: tres subtests secuenciales por viewport, cada uno limitado a 120 s (configuración/morning; ajustes/PNG/restauración; persistencia/import/borrado). El contexto se crea una vez por viewport y t.after del padre lo cierra al terminar el recorrido completo. No hay repetición de setup ni aumento global de timeouts. El recorrido completo puede legítimamente sumar más de 180 s; cada contrato queda acotado y los fallos identifican su fase.

Se conservan las 37 assertions originales, las 45 acciones locator, las cuatro llamadas screenshot, reload e import, PNG real, geometría legacy, todos los cambios de fecha/hora/norte, lámparas apagadas y restauración exacta de la luz artística. Se añade una assertion de errores antes de persistencia. No se omiten tests. La instrumentación temporal y DEBUG se retiran; el workflow final queda idéntico al inicial. No cambia ningún archivo de producto ni CostProvider.

## Verificación local posterior

- Node 22.13.0, Playwright 1.62.1, su Chromium, Three.js local 0.160.0.
- node --test --test-concurrency=1 tests/solar.browser.test.cjs: **14 PASS / 0 FAIL / 0 SKIP**, 25.85 s (5 casos originales + 9 subtests).
- node --test --test-concurrency=1 tests/solar.browser.test.cjs tests/capture-3d.browser.test.cjs tests/surface-sheet.browser.test.cjs: **23 PASS / 0 FAIL / 0 SKIP**, 56.20 s (14 casos originales + 9 subtests). Repetición completa: **23 PASS / 0 FAIL / 0 SKIP**, 55.54 s.
- node --test tests/cost-provider.test.cjs: **34 PASS / 0 FAIL / 0 SKIP** en Node 22.13.0.
- Todos los tests unitarios de tests/*.test.cjs excluyendo *browser*, ordenados, con Node 24.14.1: **394 PASS / 0 FAIL / 2 SKIP** (dos integraciones Blender sin BPY_PYTHON). Los dos skips ya existían.
- En Node 22.13.0 Windows: **393 PASS / 1 FAIL / 2 SKIP**. building.test.cjs compara una excepción de validación con una identidad stat/lstat distinta en el temporal Windows. Mismo resultado fuera del sandbox. No se modifica: los **394 PASS / 2 SKIP de Node 22 Ubuntu** están verificados en el run de diagnóstico. El incidente no pertenece a Solar ni a 7C-A.
- git diff --check: PASS.
- Revisión visual: captura solar desktop 1440x900 y formulario 390x844 renderizados correctamente, sin overflow horizontal en el diálogo.

Las capturas de pruebas se generan localmente; no se añaden PNG ajenos a la corrección. Los artifacts de Actions son la evidencia del runner. Los screenshots ya versionados del Punto 6 no se presentan como regenerados por CI.

## Validación remota

Pendiente del nuevo HEAD con la corrección sin instrumentación. El verde del diagnóstico no se considera validación del fix final. 7C-A continúa candidato hasta CI completo y revisión/merge humano.
