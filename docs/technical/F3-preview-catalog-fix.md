# F3 — corrección de catálogo en preview protegida (01-10-2026)

## Estado y reproducción

Rama conservada `feat/f3-textured-external-catalog`, HEAD inicial local/remoto
`6b37a6c444c5e1ee3077584296e6c155d3c15f39`, checkout limpio. La [PR #17](https://github.com/Juanmaes83/floorplan-3d/pull/17)
ya existe hacia master; se actualiza publicando en su misma rama, sin rebase,
reset, force push, merge ni despliegue manual. Se preservan los commits publicados.

Juanma reproduce que `cómoda`/`puf` solo muestran genéricos y el aviso opaco en
<https://floorplan-3d-gy3ven37i-juanma-espinosas-projects.vercel.app/>.
La descripción pública de PR #17 identifica esa URL con el SHA anterior y declara
Vercel Authentication. No se publica el enlace temporal de acceso ni credenciales.

**Defecto demostrado:** `asset-ui.js` solicitaba ambos manifests con
`credentials: 'omit'`; `asset-loader.mjs` hacía lo mismo con permisos y GLB.
Los script tags cargan normalmente con la sesión del mismo origen, pero esos fetch
omitían la cookie. En un servidor que exige sesión, la página/módulos funcionan y
ambos manifests dan 401: desaparecen todos los modelos y quedan los 60 genéricos.
La UI sustituía esos errores por un único mensaje sin recurso/HTTP/causa.

La nueva prueba de navegador reproduce exactamente ese mecanismo con un **servidor
fixture protegido por una cookie HttpOnly**, no un bypass de Vercel. Antes del fix,
**0/3** recorridos: ambos manifests HTTP 401 y cero modelos externos, incluido el
mensaje observado por Juanma. Después: **3/3** en 1440×900, 390×844 y 844×390;
ambos manifests, permisos y dos GLB responden 200 con sesión y se renderizan.

Esta causa está demostrada localmente bajo protección de sesión y es coherente con
la preview protegida. **No se afirma haber medido un 401 en el servidor Vercel real:**
curl recibió `CONNECT tunnel failed, response 403`, antes de contactar al origen;
Playwright `page.goto` falló con `net::ERR_TUNNEL_CONNECTION_FAILED`. Son bloqueos
del entorno, distintos del HTTP 401 observado en el servidor fixture.

## Recursos, orden y rutas comprobados

| Recurso | Comprobación |
| --- | --- |
| `assets/f3/catalog.manifest.json` | Tracked, 1630 bytes; JSON/adaptación con revisión SHA calculada, un banco aceptado |
| `assets/f3/external.manifest.json` | Tracked, 5141 bytes; JSON/revisión/evidencia de origen, dos IKEA aceptados |
| `assets/f3/ASSET-LAB-PROVENANCE.txt` | Permiso leído con sesión y SHA obligatorio, sin modificar contenido |
| `assets/f3/songesand-90366839.glb` | Ruta tracked existente, hash/bytes/dimensiones/texturas validados al cargar |
| `assets/f3/stockholm-pouf-80586139.glb` | Ruta tracked existente, hash/bytes/dimensiones/texturas validados al cargar |

No se renombra, modifica ni añade ningún asset o manifest. No hay base tag ni
configuración Vercel de rutas nueva. `generic-catalog`, `furniture-search` y
`asset-catalog` se cargan antes del script de aplicación; `asset-ui` después. Las
pruebas confirman View3D y el adaptador disponibles; no se atribuye a orden de módulos
el fallo de autenticación. Los recursos relativos siguen bajo `assets/f3/` del
mismo origen; no URLs remotas de IKEA/Asset Lab ni cambios de red/permisos.

## Corrección y diagnóstico visible

Los fetch cambian a **`credentials: 'same-origin'`**: usan la sesión que ya permite
abrir la preview, exclusivamente en el origen validado. Siguen rechazando redirects,
URLs ajenas, query/hash, formatos/extensiones no admitidos, permisos/hashes erróneos,
exceso de bytes/memoria y diferencias dimensionales. No se añade token, cabecera
Authorization, cookie de producción, decoder ni autenticación nueva.

`FloorPlanAssetUI.diagnostics` expone por manifest ruta, fase, estado, HTTP,
Content-Type, bytes y aceptación/exclusión. Biblioteca y consola QA muestran el
motivo concreto, por ejemplo:

- `assets/f3/external.manifest.json [network]: HTTP 401 — sesión de preview requerida`.
- HTTP 404 para un recurso inexistente.
- JSON inválido y Content-Type si se recibe HTML de login en vez de un manifest.
- Adaptación fallida o ID/motivo de cada entrada excluida; catálogo vacío se advierte.

Se conserva el catálogo que sí funciona y siempre el genérico. La prueba de
exclusiones garantiza que no quedan solo genéricos **sin un aviso explícito**.
La consola no imprime cuerpos de respuesta, cookies ni credenciales. El estado de
3D conserva la razón del cargador; si falla un GLB muestra ruta + HTTP o el error
real de validación, además de fallback. Los mensajes largos se ajustan al drawer.

## Criterios funcionales comprobados localmente

En escritorio y ambas orientaciones móviles, con sesión de fixture protegida:

1. `cómoda` conserva Tocador genérico **y** SONGESAND autorizado. Buscar SONGESAND
   identifica la cómoda con «Modelo 3D autorizado».
2. `puf` conserva Puf genérico **y** STOCKHOLM autorizado. Buscar STOCKHOLM identifica
   el puf con su etiqueta, sin confundir ambos resultados.
3. Insertar cada ficha crea el objeto y su assetRef. Cómoda: **820 × 500 × 810 mm**;
   puf: **690 × 650 × 400 mm**, aquí ancho × fondo × alto. El contrato usa campos
   widthMm/depthMm/heightMm y no cambia. 3D verifica estado ready, JPEG y atribución IKEA.
4. El fallback por recurso fallido mantiene objeto, medidas y 2D. No se altera el
   guardado/recarga/importación/exportación ni el contrato 1.3.0.
5. La suite de diagnósticos fuerza 401, 404, HTML/JSON inválido, identidad de manifest
   inválida y dos entradas QA excluidas. HTTP/causa/ruta son visibles y no hay errores
   JS de página; un fallo del catálogo propio no oculta los dos externos sanos.

**SwiftShader es renderizado por software**; no acredita rendimiento de móvil físico.
Los recorridos protegidos son fixtures locales, no validación visual de Vercel.

## Publicación y revisión pendiente

Commit de código: `b17187d8f7a66d2b6c2cd90116a363d645e09594`.
`git push origin HEAD` actualiza la PR #17 sin force. La página pública de la PR
muestra deployment Preview completado para ese SHA, URL
<https://floorplan-3d-ixpecvaqy-juanma-espinosas-projects.vercel.app>, y el bot Vercel
marca Ready, inspector
<https://vercel.com/juanma-espinosas-projects/floorplan-3d/H56RtMzX6KL45yZH2hR1DmiSnRhW>.
Es evidencia de deployment, **no prueba funcional de la preview**. La página checks
solo expone Vercel Preview Comments; ese check no sustituye la batería local ni la
navegación de aplicación. El acceso a la URL/inspector está bloqueado desde este
entorno. Se conserva la protección; no se generan enlaces de bypass.

Los resultados de regresiones constan debajo. El deployment del HEAD documental
final se comprueba tras publicarlo y se entrega en el chat; la PR conserva el registro
automático del deployment vigente. Juanma debe revisar de nuevo la preview final: buscar ambos productos,
insertarlos, comprobar medidas/texturas/atribución y fallback, en escritorio/móvil.
**Corrección pendiente de esa revisión y aprobación; F3 sigue abierta.** Sin merge.

## Resultados finales ejecutados

| Comando | Resultado |
| --- | --- |
| `node --test --test-name-pattern='protected preview session' tests/assets.browser.test.cjs` antes del fix | 0/3; ambos manifests 401 y externos ausentes, regresión reproducida |
| Mismo comando después del fix | 3/3, desktop/vertical/horizontal; 45339.253631 ms |
| `node --test --test-name-pattern='catalog failures and exclusions' tests/assets.browser.test.cjs` | 1/1; 3597.908559 ms |
| `node --test --test-concurrency=1 tests/*.test.cjs` | **138/138**, 0 fallos/cancelados/skips; 521364.263231 ms |
| `python3 tests/schema.test.py` | 10/10 |
| `python3 tests/f2_readiness.test.py` | 12/12 |
| `python3 tests/f2_wall_evaluation.test.py` | 16/16 |
| `python3 tests/f2_raw_export.test.py` | 3/3 |
| `python3 scripts/generate-f3-bench.py --check` | PASS, sin cambios de bytes |
| `python3 scripts/prepare-f3-pouf.py --check` | PASS, sin cambios de bytes |
| `node --check js/asset-ui.js`, `node --check js/asset-loader.mjs`, `node --check tests/assets.browser.test.cjs` | PASS |
| `node --check /tmp/catalog-fix-inline-14.mjs` y `/tmp/catalog-fix-inline-17.mjs` | PASS; scripts extraídos de index, importmap como JSON |
| Validación stdlib de enlaces relativos y fences Markdown | PASS |
| `git diff --check` y `git diff --cached --check` | PASS |

[Log completo Node](../qa/artifacts/f3-preview-auth/node-regressions.txt),
[fallo anterior](../qa/artifacts/f3-preview-auth/regression-before.txt),
[sesión protegida corregida](../qa/artifacts/f3-preview-auth/protected-after.txt),
[diagnóstico](../qa/artifacts/f3-preview-auth/diagnostics-tests.txt),
[Python](../qa/artifacts/f3-preview-auth/python-results.json).
Trazas HTTP y adaptación de cada viewport:
[desktop](../qa/artifacts/f3-preview-auth/1440x900.json),
[vertical](../qa/artifacts/f3-preview-auth/390x844.json),
[horizontal](../qa/artifacts/f3-preview-auth/844x390.json).
Identifican código `b17187d8f7a66d2b6c2cd90116a363d645e09594`; el commit documental
posterior conserva ese código y los mismos assets. Se restauran las capturas
históricas regeneradas por la suite para no atribuirles una nueva ejecución.

El primer diff-check de los artefactos detectó espacios finales en líneas vacías del
log de fallo de Node. Se eliminan solo esos espacios al publicar la transcripción;
se conservan errores, respuestas y conteos. El diff-check final pasa tras normalizarlo.


## Cierre y revisión humana — PR #17 (01-10-2026)

Tras publicar esta corrección, Juanma revisó la preview y aprobó la entrega. [PR #17](https://github.com/Juanmaes83/floorplan-3d/pull/17) quedó fusionada por squash en `master`.

- Rama: `feat/f3-textured-external-catalog`.
- SHA de cabeza revisado: `772e24c26d10cec4349f28558ffc87ee18748317`.
- Merge SHA: `24534b5544ffa37840bf4fe77c4ad12afda0c38b`.
- Preview exacta confirmada por Vercel como READY: https://floorplan-3d-rgf0u4thu-juanma-espinosas-projects.vercel.app/ (Vercel Authentication).
- El estado remoto de Vercel para el SHA revisado fue correcto.
- Codex reportó 138/138 Node/navegador y 41/41 Python antes de la revisión; no se repitieron para este registro documental.
- La revisión humana aprobó el piloto. SwiftShader sigue siendo QA por software, no medición de rendimiento en teléfono físico.

La causa del catálogo ausente en la preview quedó corregida para el flujo probado: se mantienen solicitudes con sesión del mismo origen y diagnósticos por recurso. F3 se cierra para el piloto acotado, no para un catálogo comercial exhaustivo ni para admitir extensiones arbitrarias. Las secciones anteriores registran el estado y los límites durante la investigación, no el estado posterior al merge.
