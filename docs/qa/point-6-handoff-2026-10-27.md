# Punto 6 — entrega técnica para revisión humana

Base: `2f6a7583a0f3d65238e1de2903f40fdd20cbe4a2` (master, #104 integrado). Rama: `feat/point-6-orientation-location-solar`. PR en borrador: [#106](https://github.com/Juanmaes83/floorplan-3d/pull/106). Autoridad: #100 y la documentación aprobada del 27-10-2026 en #105 (`5592f6b517000cc0365834aaa433ad36cbe15b65`). El SHA final se registra en la PR para evitar una referencia circular dentro del commit del informe.

## Implementación

- **6A:** norte explícito, lógico, persistente y visible en 2D; no rota geometría ni infiere orientación. Se puede borrar volviendo a sin configurar.
- **6B:** coordenadas manuales e IANA, sin red, sin convertir campos vacíos en 0. Procedencia user-entered. Datos internos: no se añaden a PNG, ficha, overlays de presentación o vídeo; JSON/ZIP editables los conservan y la UI lo explica.
- **6C:** SunCalc 2.1.1 local, independiente de Three.js; conversión IANA con DST; azimut norte-horario en grados y vector X/Y/Z conforme al marco real de la escena. Cambio mínimo sobre la DirectionalLight existente. Noche sin sol directo. Presentación suspende Solar, conserva sus presets y restaura Solar al salir. El modo artístico noche y sus lámparas no falsean la luz directa del solar.
- **6D:** `FloorPlanGeoProvider.Manual`, capacidades explícitas, normalización y procedencia; contrato para adaptadores futuros. No Catastro/IGN/PNOA activos, ni terreno ni Exterior.

Módulos: `js/geo-provider.js`, `js/solar-core.js`, `js/solar-renderer-adapter.js`, `js/solar-ui.js`, `css/solar.css`. Integración pequeña en `index.html`, `project-core`, `building-core` y `building-ui`. Auditoría previa: [point-6-audit](../technical/point-6-audit-2026-10-27.md). Frontera geográfica: [FloorPlanGeoProvider](../contracts/FloorPlanGeoProvider.md).

## Contrato y compatibilidad

`site` opcional: `northOffsetDeg` y/o `location:{latitude,longitude,timeZone,source}`. Proyecto 1.7.0 solo mediante edición explícita; edificio 1.1.0 con autoridad en la raíz compartida por todas las plantas. Las plantas no se reescriben para propagarlo. Crear edificio copia la configuración inicial; exportar una planta incorpora en esa copia el dato compartido. Legacy sin datos abre sin inventarlos ni cambiar su versión. Las futuras propiedades de proyecto V1 se conservan conforme a la política existente. El edificio mantiene su política estricta para versiones desconocidas.

No hay cambios a geometría, familias de estancia, motor de superficies ni privacidad de F2. JSON, ZIP, copias y variantes preservan la configuración mediante los caminos canónicos existentes. Fecha, hora y modo son una selección visual de sesión.

## Dependencias locales y licencias

- SunCalc **2.1.1**, commit `21449f34820c3c80a27a78cdc940747ff19ca1e3`: cierre de dependencias de `getPosition`, fórmulas sin cambios, wrapper UMD, BSD-2-Clause íntegra en `vendor/suncalc/LICENSE`.
- Three.js **0.160.0**, misma versión y bytes que el renderer anterior: núcleo, siete addons existentes y BufferGeometryUtils, más licencia MIT. Diez archivos fuente/licencia, **1.471.840 bytes**. `vendor/three/manifest.json` verifica SHA-256 por archivo; `scripts/vendor-three.cjs` reproduce la copia. El import map ya es local. `.gitattributes` conserva los bytes del vendor y `.gitignore` incluye una excepción estrecha para su módulo `build/three.module.js`.
- No código NREL incorporado. Un fixture contrasta el [ejemplo publicado SPA, apéndice A](https://docs.nlr.gov/docs/fy08osti/34302.pdf), tolerancia de producto 0,5°, indicando la diferencia de entrada de 30 segundos.

## Verificación final acotada

Windows, Chrome/Chromium headless con SwiftShader. No es una medición de rendimiento de móvil físico.

| Comprobación | Resultado |
|---|---|
| `node --test tests/three-vendor.test.cjs tests/solar-core.test.cjs` | **9/9 PASS**, incluye hashes, licencia/version/import map, hemisferios, mañana/mediodía/tarde/noche, estaciones, norte, IANA/DST, inválidos/legacy, proveedor y JSON/ZIP |
| `node --test --test-concurrency=1 tests/solar.browser.test.cjs tests/capture-3d.browser.test.cjs tests/tour-recorder-ci.browser.test.cjs` | **9/9 PASS**, 62,5 s |
| `--test-name-pattern='F2 local.*390x844\|missing 3D runtime' tests/browser.test.cjs tests/presentation.browser.test.cjs` | **2/2 PASS**; F2: 147 GET permitidos, 0 inesperados; ausencia del runtime mantiene 2D usable |
| Schemas independientes Python con UTF-8 | Proyecto **11/11**, edificio **2/2**, site **3/3 PASS** |
| Suite unitaria completa anterior al último test ZIP/vendor | **298 PASS, 2 SKIP, 0 FAIL**; omisiones opcionales de Blender. Los tests nuevos ZIP/vendor pasan en el bloque final de 9 |
| `git diff --check` | PASS al cierre |

Los cinco casos nuevos de navegador arrancan con **todas las peticiones externas bloqueadas** y fallan si se intenta alguna: ninguna petición externa. Verifican 1440×900, 390×844, 844×390, fecha/hora/norte, por debajo del horizonte, modo artístico previo nocturno, restauración, ausencia de acumulación de luces, reload/importación, varias plantas, idiomas y borrado de orientación.

El humo de vídeo produce un **MP4 H.264 640×360**, 224.549 bytes, 3,4337 s, 3 paradas. Se decodifica en navegador y `ffprobe` confirma H.264; retorno de cámara 0 y recorder libre. No amplía las promesas de compatibilidad a canales o dispositivos no probados.

Workflow añadido: `.github/workflows/point-6-solar.yml` para unitarios, solar, PNG y ficha sobre el SHA del candidato. No se lanzan ni relanzan Actions manualmente. Los resultados locales anteriores son la evidencia ejecutada; los estados remotos quedan enlazados en la PR.

## Regresiones previas y batería detenida

Por instrucción del usuario se detuvo la batería extensa y no se corrigen fallos comunes con master. No se declara una suite amplia completamente verde.

En worktree separado sobre el SHA base se reproducen:

1. `M09 restores preexisting 3D camera, day/night and editor lights`: timeout esperando igualdad del conteo de texturas.
2. `M18 returns to the preexisting 3D camera and door state`: aspecto 1,7672131147540984 frente a 1,4491803278688524.
3. `declared wall type ... 390x844`: margen de Inicio inferior al esperado.
4. `3D camera, focus and editor state return after Escape and browser Back`: también falla en base.

Los tests extensos de walk por teclado esperaron un `walkOverlay` no visible en este entorno. La comprobación de base de ese caso se interrumpió al recibir la orden de checkpoint; no se atribuye un origen demostrado ni se modifica el recorrido. Los casos dirigidos existentes de liberación/restauración de pointer lock y recorrido táctil sí pasaron durante la batería previa. Vídeo y casos solares finales están verdes.

La batería anterior completó edificios, PNG, lotes ZIP, varias resoluciones, cámara/recorridos ordinarios, idiomas, importación, almacenamiento, familias y ficha. Cuatro fallos F2 se resolvieron ampliando únicamente su allowlist de GET locales a los recursos estáticos nuevos. Una expectativa previa del test de ficha se alineó con la traducción existente `Master Bedroom`. No se cambió el diccionario del Punto 4.

## Evidencia versionada y revisión

`output/playwright/point-6/`: configuración, mañana y solar para los tres tamaños, retorno multiplanta y `video-smoke/` (MP4 y resultados de decodificación). Revisión visual realizada sobre las capturas finales: sin overflow horizontal del diálogo, acciones y cierre accesibles en horizontal/vertical, vivienda visible, modo y advertencia legibles. Capturas PNG del flujo existente también están versionadas en `docs/qa/artifacts/capture-3d/`.

Revisión humana recomendada: composición de controles sobre la vivienda, posición del indicador de norte, claridad de Presentación frente a Solar y aceptación del comportamiento DST. La aprobación humana y las incidencias previas no se sustituyen por este QA local.

Límites: sombras y recortes del renderer existente; visualización orientativa, sin terreno/obstrucciones reales ni precisión energética/normativa. Horas locales ambiguas/inexistentes se rechazan; fecha entre 1900–2150. Solo proveedor manual operativo. Las fuentes territoriales futuras deben validar licencia/CRS/procedencia antes de activarse. No se necesita escalar a Astra: no hay bloqueo que exija refactor del renderer.

Estado: trabajo funcional y vendorizado publicados en Draft PR para revisión; no merge, producción ni cierre autónomo del Punto 6. No queda código de producto deliberadamente sin commit.
