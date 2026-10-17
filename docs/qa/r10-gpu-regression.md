# PR #39: comprobación pendiente en un PC con GPU

Fecha: 17-10-2026. **SHA a probar: `1878f16`, el commit de la prueba M11 corregida** (`1878f1667f7f876ac36cf9d0636792f700617fed`). Su código de producto es idéntico a `9e3ba33a867d995075889641f839c8fa38608acc`: entre ambos sólo cambian documentación, evidencia, un revert y la prueba M11. Los commits posteriores de la rama son sólo documentación.

## Por qué hace falta

En el contenedor en la nube la suite de navegador del SHA probado da **196 casos: 170 pass, 17 fail y 9 sin resultado**. Allí no hay GPU: Chromium usa SwiftShader, a unos 930 ms por fotograma a 1440×900. Los 26 casos que no pasan se reparten en:

| Grupo | Casos | Diagnóstico en el contenedor |
| --- | --- | --- |
| P07 ×4, P13 ×4, M10 ×6 | 14 FAIL | La prueba comprueba un estado *durante* un vuelo o revelado de 650 ms, que termina en el primer fotograma. Fallan igual en `28e0428`. |
| M11 ZIP 1440×900, M20 ZIP | 2 FAIL | La descarga no llega en 30 s. Fallan igual en `28e0428`. |
| M08, M09, M13, M16, M17, P08, P15 | 7 sin resultado | Límite de tiempo de la prueba. Fallan igual en `28e0428`. |
| M11 cancelación | 1 FAIL con la prueba antigua | Era una carrera del clic de la prueba con un lote ya terminado, sin defecto funcional. **Prueba corregida en `1878f16`:** espera al lote activo y retenido antes de cancelar. 5/5 en `28e0428` y 5/5 en `1878f16`; el control con la cancelación desactivada falla. |
| P05 1440×900 | 1 sin resultado | Repetida 4 veces: `28e0428` **0/4**, `9e3ba33` **3/4**, siempre junto al límite de 180 s. No es una regresión. |
| Cámara 3D tras Escape/Atrás | 1 sin resultado | Repetida 4 veces: `28e0428` **0/4**, `9e3ba33` **2/4**, junto al límite de 120 s. No es una regresión. |

Estos casos sólo se pueden confirmar con un renderizador representativo. La GPU sirve para validar el rendimiento y los tiempos de la experiencia web. El producto debe seguir funcionando en móviles sin esa GPU, lo que se comprueba aparte en dispositivos reales.

P05 y Escape/Atrás no se han atribuido a `roomFrame`: sin una reproducción que lo demuestre, son tiempos agotados junto al límite en ambas versiones (P05: base 4 × 180 s; rama 3 pases en 177–179 s. Escape/Atrás: base 4 × 120 s; rama 2 pases en ~118 s).

Medida aparte: la búsqueda de encuadres `roomFrame` cuesta en `9e3ba33` unas 3 veces lo que costaba en `bc1cee7`: 1578 frente a 532 ms para las 13 estancias en Node, mediana caliente, con 83–184 ms por estancia. Se calcula una vez por parada y se guarda en caché. **Es un riesgo de rendimiento en móviles lentos que conviene medir; no es la causa demostrada de ninguno de los síntomas anteriores.**

## Pasos (Windows, PowerShell)

Requisitos: Git, Node 22 y Chrome o Chromium actualizados, con la aceleración por hardware activada. Ejecutar sin otras aplicaciones pesadas abiertas.

```powershell
git -C C:\Users\temp123\work\floorplan-3d-casa-serra fetch origin
git -C C:\Users\temp123\work\floorplan-3d-casa-serra worktree add C:\Users\temp123\work\fp-39-gpu 1878f1667f7f876ac36cf9d0636792f700617fed
cd C:\Users\temp123\work\fp-39-gpu
npm init -y > $null; npm install --no-save playwright@1.62.1
$env:CHROME = "C:\Program Files\Google\Chrome\Application\chrome.exe"   # o la ruta del Chromium de Playwright
```

1. **Comprobar que el navegador de las pruebas usa la GPU** (paso obligatorio):

   ```powershell
   node scripts/qa/presentation/gpu-check.cjs
   ```

   Debe mostrar un `renderer` que **no** contenga SwiftShader y `"representative": true`, es decir, con una mediana de fotograma inferior a 50 ms. Si sale SwiftShader, la ejecución repetiría la limitación del contenedor y no sirve: revisar los controladores, la aceleración por hardware o probar con otro ejecutable en `CHROME`.

2. **Casos afectados**, 3 repeticiones cada uno:

   ```powershell
   1..3 | % { node --test --test-concurrency=1 --test-name-pattern="cancellation produces no partial ZIP" tests/presentation-batch.browser.test.cjs }
   1..3 | % { node --test --test-concurrency=1 --test-name-pattern="P05 own and imported room data and poses follow active IDs 1440x900|3D camera, focus and editor state return after Escape and browser Back" tests/presentation.browser.test.cjs }
   ```

3. **Suite completa**, archivo a archivo y en serie:

   ```powershell
   New-Item -ItemType Directory -Force gpu-regression > $null
   Get-ChildItem tests/*.browser.test.cjs | % { $n=$_.BaseName; node --test --test-concurrency=1 $_.FullName *> "gpu-regression/$n.log"; "$n exit=$LASTEXITCODE " + ((Select-String -Path "gpu-regression/$n.log" -Pattern '^# (tests|pass|fail|cancelled|skipped) ').Line -join ' ') | Add-Content gpu-regression/summary.txt }
   Get-Content gpu-regression/summary.txt
   ```

4. **Comunicar:** la salida de `gpu-check.cjs`, `gpu-regression/summary.txt` y el `not ok` de cada log que falle. En el resultado, `cancelled` significa «sin resultado» (tiempo agotado), no fallo ni aprobado.

## Criterio de decisión

- **0 fail y 0 sin resultado** con un renderizador representativo: regresión limpia del SHA `1878f16` (producto `9e3ba33`) y bloqueo técnico de #39 resuelto. CI sigue «no ejecutada» mientras Actions termine sin pasos.
- **Algún fallo:** comparar con el mismo archivo en `28e0428`, siguiendo el mismo procedimiento con `git worktree add ... 28e0428`, antes de atribuirlo a #39.

`THREE_LOCAL_DIR` sólo es necesario si `cdn.jsdelivr.net` no es accesible; en un PC con red normal no se usa.
