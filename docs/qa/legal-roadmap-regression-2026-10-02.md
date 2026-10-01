# Regresión de reconciliación, Legal y uso — 02-10-2026

## Base, entorno y alcance

- Repositorio: `Juanmaes83/floorplan-3d`; rama `codex/legal-roadmap-qa-20261002` desde `origin/master` `15004221da8a6f2e5c22fe45392680a934b6d277`, comprobado dos veces con `git fetch origin master` y checkout inicial limpio. **SHA de producto probado y publicado: `6115d3e607ec27eb9e6e4bfcbeb7844f3455e4ca`.** La suite completa se ejecutó sobre los archivos de ese commit inmediatamente antes de crearlo; el commit posterior de este informe solo documenta los resultados.
- Windows, Node 24.14.1, Python 3.11/3.12, Chromium local `chromium-1243` y Playwright de caché `_npx/31e32ef8478fbf80/node_modules` mediante `NODE_PATH`; `CHROME` apunta al ejecutable local. Playwright CLI de esa misma caché. Sin planos ni datos reales.
- Vista escritorio 1440×900, emulación móvil vertical 390×844 y horizontal 844×390. Chromium con SwiftShader en los tests 3D. La emulación no mide rendimiento en teléfono físico.

## Fallos iniciales y corrección de entorno

1. `node --test --test-concurrency=1 tests/*.test.cjs` falló inicialmente: el checkout no tenía `playwright` resoluble; se reutilizó la copia en caché mediante `NODE_PATH`, sin añadir dependencia al repo.
2. Tres pruebas de hash de `assets/f3/LICENSE.txt`, `assets/f3/ASSET-LAB-PROVENANCE.txt` y `js/wall-assist.js` fallaron porque `core.autocrlf=true` había materializado CRLF en archivos cuyos SHA se fijaron para LF. Se normalizaron sus finales de línea **solo en el checkout**; `git diff --numstat` quedó vacío para ellos y la repetición dirigida pasó 13/13. También se normalizó `ASSET-LAB-PIPELINE-PROVENANCE.txt`, usado por el catálogo. No se alteraron hashes ni código versionado.
3. `python tests/schema.test.py` no pudo importar `jsonschema`; la prueba de readiness que invoca `python3` falló porque Windows solo tenía `python.exe`. Se instaló `jsonschema` 4.26.0 con `pip --target %TEMP%\rubik-qa-python`, se copió allí `python.exe` como `python3.exe` y se fijaron `PATH`, `PYTHONPATH` y `PYTHONUTF8=1` para esta ejecución. Sin UTF-8, el encoding cp1252 de Windows causaba cinco fallos/errores al leer el schema; la repetición pasó 42/42. No se cambiaron dependencias versionadas ni servicios.
4. La primera suite Node con Playwright disponible dio 160/178. Cinco fallos de dimensiones y siete de materiales se debían a rutas `/usr/bin/chromium` fijas en dos tests; se hicieron portables mediante `process.env.CHROME || '/usr/bin/chromium'`. Cuatro fallos de exportación F2 se debían al alias `python3` ausente. Las 12 pruebas dirigidas de dimensiones/materiales y las cuatro F2 pasaron después.
5. En `1440×900`, el botón «Cargar imagen de plano» quedaba en x=-36,625 tras una importación ZIP: el menú «Archivo» se anclaba por la derecha cuando la cabecera había envuelto su fila. Se corrigió el anclaje del menú entre 1101 y 1500 px; la repetición afectada pasó 1/1. La aserción ahora registra caja/viewport cuando falla.
6. Una prueba de sesión protegida agotó 40 s esperando el catálogo en la primera suite; una repetición dirigida con el mismo fixture y la suite completa final pasaron. No se reprodujo un defecto de producto.

## Regresión funcional y resultados

| Recorrido | Resultado | Evidencia / límite |
| --- | --- | --- |
| Carga inicial y consola | PASS con incidencia menor | Playwright CLI abrió `http://127.0.0.1:8765/`, catálogo 75 resultados y 15 modelos autorizados. Primera navegación: 404 de `favicon.ico` en servidor estático; después de abrir 3D, `console` mostró 0 errores/avisos. No se atribuye a la app un favicon no solicitado por esta entrega. |
| Idioma y persistencia | PASS | CLI: español → inglés → chino; `localStorage` conservó `en` y luego `zh`. Recargas conservaron «Legal & use» y «法律与使用» respectivamente; selector operativo. |
| Proyectos locales independientes | PASS | CLI creó «QA synthetic second»: selector pasó de 1 a 2 proyectos y el nuevo proyecto quedó activo. Suite Node: apertura, aislamiento, recarga, renombrado, duplicado y exportación. |
| Imagen sintética, calibración, trazado, dimensiones y geometría | PASS | Fixtures `tests/fixtures`; suite Node: F1b completo 1440×900, 390×844 y 844×390, segunda cota, trazado, protección de geometría, dimensiones y rechazo atómico de entradas inválidas. |
| Búsqueda, colocación y modelos integrados | PASS | Suite Node: 14 modelos externos, búsquedas, inserción, fallback, carga texturizada, escena mixta y persistencia, en escritorio y móvil emulado. |
| Biblioteca de materiales y suelos/paredes | PASS | Suite Node: 50 mapas, aplicación/persistencia, comparación, fallback, cancelación, red y decodificación, 1440×900, 390×844 y 844×390. |
| JSON/ZIP | PASS | Suite Node: importación/exportación JSON, ZIP con imagen sintética, identidad de assets y preservación del contrato. |
| Legal y uso: enlace, texto, teclado y URL | PASS | CLI: enlace visible `#legal-y-uso`; diálogo contiene autor, teléfono, restricción y separación de recursos terceros; Escape cierra. Recarga de la URL con hash abre el diálogo. |
| Legal y uso en móvil emulado | PASS | A 390×844, enlace dentro del viewport, diálogo x=16–374 y sin desbordamiento horizontal. A 844×390, diálogo x=112–732, scroll interior disponible, enlace visible y botón Cerrar accionable. El editor volvió a quedar visible al cerrar. |
| Escena 3D y red CDN directa | PASS en esta ejecución | CLI: botón 3D creó canvas y `View3D.rendererMemory` informó geometría/texturas. Módulos Three.js 0.160.0 de jsDelivr respondieron HTTP 200; catálogo/materiales locales HTTP 200; consola posterior 0 errores. En 390×844 y 844×390, canvas presente sin desbordamiento horizontal. SwiftShader no valida rendimiento físico. |

## Comandos ejecutados

```powershell
$env:NODE_PATH='C:\Users\temp123\AppData\Local\npm-cache\_npx\31e32ef8478fbf80\node_modules'
$env:CHROME='C:\Users\temp123\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe'
node --test --test-concurrency=1 tests/*.test.cjs
node --test tests\assets.test.cjs tests\raw_wall_export.test.cjs
node --test --test-concurrency=1 tests\room-layout.browser.test.cjs tests\surfaces.browser.test.cjs
node --test --test-name-pattern "image import clarity and complete WebP workflow 1440x900" tests\browser.test.cjs
python tests\schema.test.py
python tests\f2_readiness.test.py
python tests\f2_wall_evaluation.test.py
python tests\f2_raw_export.test.py
python scripts\check-documents.py docs\ROADMAP.md docs\ROADMAP-2-proposal.md docs\product\ecosystem-integration-audit.md README.md
git diff --check
python -m http.server 8765 --bind 127.0.0.1
python -m pip install --target "$env:TEMP\rubik-qa-python" jsonschema
```

Playwright CLI: `open`, `find`, `click`, `snapshot`, `eval`, `press Escape`, `resize 390 844`, `resize 844 390`, `reload`, `fill`; la copia reutilizada se invocó como `...\node_modules\.bin\playwright-cli.cmd`.

## Resultados finales y publicación

- Node, primera ejecución con entorno incompleto: **160/178**, 18 fallos explicados arriba. Repetición completa con correcciones y entorno preparado: **178/178 PASS**, 0 fallos, 0 omitidos, 0 cancelados; duración informada por Node `332964.0912 ms`. Los 12 tests dirigidos de dimensiones/materiales pasaron 12/12; la importación de imagen de escritorio repetida pasó 1/1.
- Python: cuatro suites **42/42 PASS** con `PYTHONUTF8=1`; el validador documental pasó en README, ambos roadmaps, auditoría y este informe. `git diff --check` pasó.
- Límites: Chromium/SwiftShader y emulación táctil no prueban GPU ni rendimiento en teléfono físico. La escala física de algunos modelos #20, cinco sesiones y veinte planos de validación F2 siguen pendientes. El 404 inicial del favicon del servidor local no afecta flujos. No hubo evaluación con planos reales.
- Primera preview de esta rama: [deployment `dpl_FPcDVRg4kyDmWBMRQmB8gJf2xskS`](https://floorplan-3d-pl7yo5mur-juanma-espinosas-projects.vercel.app/), proyecto `juanma-espinosas-projects/floorplan-3d`, target **preview**, estado **READY** según `vercel inspect --format=json`. GitHub devuelve estado Vercel `success` para el SHA `6115d3e` con ese mismo ID de deployment. `curl -I` sin sesión recibió **302 a Vercel SSO**: la preview está protegida, no es pública. La URL final de la PR puede cambiar al publicar este informe; se verificará por separado y se incluirá en la descripción de la PR.
- PR pendiente de creación en el momento de registrar este informe. No hubo merge ni despliegue a producción.
