# 8C-E — validación local y contraste de baseline

Estado: candidato en revisión. Base `51a3a07b16da8876ab32189b8db9db18eb182c12`.

## Entorno y comandos

Windows, Node test runner, Python3.12/jsonschema4.26, Playwright/Chrome con SwiftShader. `CHROME` apunta al Chrome instalado; `NODE_PATH` al runtime Playwright local; `THREE_LOCAL_DIR=vendor/three`. Schemas: `PYTHONUTF8=1`, `PYTHONIOENCODING=utf-8`. No se descargó contexto territorial real. No es una medición de rendimiento móvil físico.

| Grupo | Comando / archivos | Resultado |
|---|---|---|
| Integración + Project/Building | `node --test tests/territory-integration.test.cjs tests/building.test.cjs tests/project.test.cjs tests/building-project-1-6.test.cjs` | 66 PASS |
| Dependencias core territoriales/exterior/Solar | `geo-provider`, `parcel-core`, `orthophoto-core`, `terrain-core`, `terrain-provider`, `exterior-core`, `roof-core`, `exterior-volumes`, `solar-core` `.test.cjs` | 66 PASS |
| Amplia Node no-browser | Todos `tests/*.test.cjs` excepto `*.browser.*` y `browser.test.cjs`, concurrencia1 | 569 casos: 567 PASS, 0 FAIL, 2 SKIP |
| Python schemas | Cada `tests/*schema.test.py`, incluido `schema.test.py` | 25 PASS |
| Browser 8C-E final | `node --test tests/territory-integration.browser.test.cjs` | 3 PASS |
| Terrain browser | `node --test tests/terrain.browser.test.cjs` | 2 PASS |
| Walk/Journey/Building Presentation | `walk.browser`, `walk-controls.browser`, `journey-orientation.browser`, `building-presentation.browser` | 34 casos: 24 PASS, 10 FAIL Walk; contraste completo abajo |
| Browser amplio afectado | `parcel.browser`, `orthophoto.browser`, `solar.browser`, `exterior-volumes.browser`, `presentation.browser`, `capture-3d.browser`, `delivery-image.browser`, `share-image.browser`, `guide-navigation.browser`, `tour-recorder-ci.browser` | 105 casos: 104 PASS, 1 FAIL previo de aspecto de cámara |
| Privacidad F2 | `node --test --test-name-pattern='F2 local wall assistance privacy/review' tests/browser.test.cjs` | 4 PASS, 0 requests inesperados |
| ZIP por lotes afectado | `node --test --test-name-pattern='batch ZIP contains ordered real views and restores 1440x900' tests/presentation-batch.browser.test.cjs` | 1 PASS |
| Syntax | `node --check` de JS nuevos/modificados y parseo de scripts inline de index excluyendo importmap | PASS |
| Diff | `git diff --check` | PASS |

Estos grupos contienen solapamientos y no se suman como casos únicos. Los 2 SKIP amplios son verificaciones Blender que requieren `BLENDER_EXE`/`BPY_PYTHON` configurados; no se presenta ejecución real de Blender como probada. El vídeo sí se reprodujo y ffprobe confirmó H264 640×360. Los diez ciclos de Presentation mantuvieron memoria del renderer estable en el test existente.

La prueba 8C-E usa CTA real acotado al diálogo; prueba exterior, habitación, restauración de estado y retorno de vista exterior tras visitar otro stop. Compara framing con/sin contexto a **igual región visible**, para no confundir cambios de tamaño de tarjeta con efectos del contexto. Captura y delivery reales devuelven los dos créditos verificados sin duplicados; parcela restricted queda fuera. Reabrir conserva metadata, pierde runtime y no inicia red. Walk comparativo mantiene origen/altura/puertas y movimiento W real con norte37, placement no cero y terrain visible.

## Baseline: diez casos Walk

El usuario autoriza publicar únicamente si los diez casos y causas coinciden con master limpio y no hay fallos nuevos. No se modifica Walk ni sus pruebas.

Contraste con pruebas originales, en ambos worktrees:

```text
node --test --test-concurrency=2 tests/walk-controls.browser.test.cjs tests/walk.browser.test.cjs
```

Master: `C:/Users/temp123/repos/floorplan-3d`, SHA base exacto; `git status --porcelain` vacío antes de ejecutar. Rama: `feat/point-8c-e-territorial-integration`. Mismos ejecutable Chrome, runtime Playwright y Three vendorizado. Los archivos de test son byte a byte iguales:

```text
walk.browser.test.cjs
9bbb698a39e3832c95b3aad39cd2444fa2003b841a49f189a930d9db3ecf838c
walk-controls.browser.test.cjs
a54f6991a4ff00e58a1e66c372ae1712f14d2e44116081197efea6301a2f5054
```

Resultado del contraste completo: **10/10 casos, mensajes de error y ubicaciones de aserción coinciden exactamente; 0 fallos nuevos**. Cada ejecución original termina con 10 casos, 0 PASS y 10 FAIL. Master conserva `git status --porcelain` vacío después de ejecutar, en el mismo SHA exacto. No son diez timeouts: cinco son timeouts y cinco aserciones del panel oculto, iguales en ambos worktrees.

| Caso original | Master | Rama | Causa idéntica |
|---|---|---|---|
| desktop controls 1440×900 | FAIL | FAIL | click de `#walkOverlay` oculto, timeout120000 |
| desktop E 1440×900 | FAIL | FAIL | click de `#walkOverlay` oculto, timeout120000 |
| phone joystick/drag/door/exit 390×844 | FAIL | FAIL | tap de `#walkOverlay` oculto, timeout120000 |
| entry panel / pointer refusal 1440×900 | FAIL | FAIL | panel sin control primario visible (`primary:[]`) |
| entry panel / pointer refusal 390×844 | FAIL | FAIL | panel sin control primario visible (`primary:[]`) |
| entry panel / pointer refusal 844×390 | FAIL | FAIL | panel sin control primario visible (`primary:[]`) |
| instructions with mouse 844×390 | FAIL | FAIL | instrucciones del panel no visibles (`shown:[]`) |
| instructions with touch 844×390 | FAIL | FAIL | instrucciones del panel no visibles (`shown:[]`) |
| walk example entrance → other room | FAIL | FAIL | click de `#walkOverlay` oculto, timeout120000 |
| walk contract entrance → other room | FAIL | FAIL | click de `#walkOverlay` oculto, timeout120000 |

El cotejo automático verifica nombres, mensajes completos (incluido el JSON diagnóstico de las cinco aserciones), archivo/línea de fallo y causas, no sólo el número total. Registros locales: `output/master-walk-8c-e.log` y `output/branch-walk-8c-e.log` (no se añaden como temporales al commit). El usuario autorizó expresamente publicar con estos fallos previos únicamente tras este contraste y sin modificar Walk. Las regresiones afectadas que pasan en master permanecen verdes; el fallo adicional de aspecto descrito debajo también se reproduce en master y se declara separado.

## Otro fallo previo de Presentation

`3D camera, focus and editor state return after Escape and browser Back` falla en `tests/presentation.browser.test.cjs:303`, comparando el aspect ratio posterior contra el previo. Se reprodujo aislado tanto en rama como en master limpio con:

```text
node --test --test-name-pattern='3D camera, focus' tests/presentation.browser.test.cjs
```

Ambos esperan `1.556338028169014`. El valor posterior cambia con el ancho real del stage al cerrar paneles (master observado `2.007042253521127`; rama observada `2.2693661971830985`, y `2.1338028169014085` en la suite). Es la misma aserción de aspecto, no un fallo de posición/target ni de la transformación territorial. No se altera el test ni se afirma PASS. La prueba nueva 8C-E verifica cámara/target/quaternion/sección/capas/Solar/luz por separado.

## Alcance de entrega

Ocho capturas sintéticas deliberadas, revisadas visualmente, en `output/playwright/point-8c-e/`. Scripts diagnósticos, caches y capturas históricas regeneradas se excluyen. Sin cierre canónico, merge, rebase ni force push. La PR sólo se abre tras verificar la condición de publicación; después no se espera CI/Vercel ni se ejecutan reruns.
