# Integración de marca y presentación de dos plantas — 21-10-2026

Base: `master` después de #65, #66, #67 y #68. Rama: #69.

## Hallazgo y corrección

#65 creó `captureBuildingBatch()` y un lote ZIP de dos plantas. #69, escrita sobre #67, aplicaba la marca sólo a `captureBatch()`, el lote de una planta. Una fusión textual no habría firmado los PNG del edificio. La configuración de marca tampoco aparecía en el diálogo de presentación del edificio.

La reconciliación añade «Entrega al cliente» a la configuración de ambas presentaciones y usa la misma captura PNG validada para sus dos lotes. Cuando hay marca, cada PNG recibe el pie antes de calcular su SHA-256 y de escribir el manifiesto. En el lote de dos plantas, el texto del pie incluye el nombre de la planta para distinguir estancias homónimas. Sin marca se conservan los bytes y formatos de cada flujo. La marca sigue siendo local al navegador; ni `presentation.json` ni el edificio editable contienen perfiles.

## Verificación en este entorno

- `node --check js/presentation-ui.js` y `node --check tests/building-presentation.browser.test.cjs`: PASS.
- Unitarias Node (`tests/*.test.cjs`, excluidas las suites de navegador): 254 PASS, 0 FAIL, 2 SKIP con Node 24.19.0; `TMPDIR` apunta al directorio de trabajo por las restricciones de `/tmp`.
- La prueba nueva de navegador comprueba configuración, tarjeta, introducción, los PNG de ambas plantas, hashes del manifiesto, ZIP editable sin marca y restauración del editor. **No ejecutada aquí:** no hay Chromium local y la descarga de Playwright devuelve un archivo vacío desde este entorno. No se cuenta como PASS.
- CI de este SHA: pendiente de comprobar; los jobs anteriores de GitHub Actions no obtuvieron runner.

No se declara validada la combinación #65 + #69 en navegador hasta ejecutar la prueba nueva y la regresión afectada con un Chromium operativo (preferiblemente el equipo con GPU). Ninguna prueba de teléfono físico se ha realizado aquí.
