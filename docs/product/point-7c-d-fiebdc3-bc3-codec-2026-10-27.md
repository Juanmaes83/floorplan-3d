# Punto 7C-D — codec FIEBDC-3/BC3 — candidato en revisión

## Objetivo y base

Base exacta `origin/master` `59ca05e1c47aa2a7d020bbb3e44fa49fa2bbf94e`, squash de PR #116. Esta rama añade la capa técnica BC3 antes de 7C-E. No incorpora datos BCCA reales.

## Arquitectura

`BC3 bytes → decode → parse → modelo BC3 → [7C-E futuro] BCCA_ES CostProvider → CostQuote → bridge 7C-C → Budget`. El flujo inverso `modelo → serialize → encodeModel → BC3 bytes` está implementado y probado. El codec es puro, sin UI, red, DOM, storage, BCCA ni dependencia de Budget.

## Cobertura

La autoridad técnica es la [especificación oficial FIEBDC-3/2024](https://www.fiebdc.es/web2/datos/uploads/Formato-FIEBDC-3-2024.pdf). El subconjunto proyecta `~V` (metadatos y rótulos), `~K` (decimales/coeficientes), `~C` (conceptos y precios), `~D` (descomposiciones), `~T` (texto) y `~W` (ámbitos de pliegos). Otros tipos quedan en el ledger ordenado con warning; no se anuncian como interpretados. El contrato exacto está en `docs/contracts/FloorPlanFIEBDC3.md`.

Las variantes de precio se conservan por índice y rótulo de `~V`, con fecha y marcas de repetición del último valor explícito cuando corresponde. El codec no selecciona precio. Ausente es `null`/lista vacía, distinto de `0`. Unidad, moneda, factor y rendimiento se conservan sin convertir, recalcular o expandir jerarquías. `~W` no se usa como selector de precio.

## Encoding, escritura y fixtures

`~V` admite 850, 437 y ANSI, con 850 por defecto si está vacío. Para ANSI se usa Windows-1252 como interpretación acotada y explícita. Bytes indefinidos y caracteres no representables producen error. El escritor usa CRLF y EOF ASCII 26, y valida el modelo contra el ledger antes de emitirlo.

`tests/fixtures/fiebdc3/synthetic.cjs` construye archivos BC3 pequeños con terminador real mediante escapes visibles. Incluye archivo mínimo y uno con todos los registros soportados más un `~X` no interpretado. `tests/fiebdc3-codec.test.cjs` prueba esos fixtures, variantes, cero/ausencia, juegos de caracteres, sintaxis inválida, round-trip de bytes y semántico, estabilidad de escritura, discrepancias ledger/modelo y ausencia de dependencias de red/DOM/CostProvider/Budget.

La revisión de PR #117 añadió la equivalencia de códigos con `#` / `##` terminales para resolver `~D` y `~T`, con detección de duplicados y alias por identidad, sin reescribir los códigos originales. También se ignoran los blancos especificados inmediatamente delante de separadores de subcampo `\`; se conservan los blancos significativos en otras posiciones. Los tests nuevos cubren referencias marcadas/no marcadas, `#` interno y espacios, tabuladores y CRLF delante de `~`, `|` y `\`.

## Verificación

Tras los cambios de revisión, la suite dirigida con regresiones 7C-A/B/C suma **139 PASS, 0 FAIL, 0 SKIP**. La suite amplia sin browser suma **467 tests: 465 PASS, 0 FAIL, 2 SKIP**. Los dos SKIP corresponden a pruebas opcionales de Blender sin `BPY_PYTHON` y `BLENDER_EXE` configurados. `tests/browser.test.cjs` requiere `playwright` en este checkout y queda fuera de la suite no-browser. La primera selección amplia del PR lo incluyó por su nombre y falló por `MODULE_NOT_FOUND: playwright`; se corrigió la selección y la suite no-browser completa terminó verde. Sintaxis de los tres JS nuevos y `git diff --check` pasan. CI/Vercel se informan por separado de los tests locales.

## Límites y siguiente paso

El soporte es parcial. No fusiona actualizaciones sucesivas del mismo código `~C` ni interpreta todos los tipos del estándar. No resuelve licencias ni procedencia externa. No se añadieron BCCA, DDC, bases comerciales, descargas ni datos reales. 7C-E debe construir el adapter `BCCA_ES` sobre este modelo, fijar su selección de variantes y aplicar su gate legal/técnico; queda fuera de esta PR.
