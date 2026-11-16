# Registro de evidencias reproducibles

**Captura remota:** 16/11/2026 10:02:54 UTC. **HEAD:** `46174d6918e336119a79f5bda9fd2733aa5464c4`. Clon independiente: `<clon-local-de-auditoria>`; carpeta de resultados: la que contiene este archivo. `pr-forensics.json` conserva la descripción completa, comentarios, reviews, commits, archivos, SHA, checks, merge-base, rev-list, cherry, blobs y merge-tree de cada PR. No contiene secretos. Las pruebas locales son de este agente y las de GitHub se distinguen abajo.

## Comandos/fuentes remotas de solo lectura

| Comando o consulta | Resultado observado |
|---|---|
| `gh api repos/Juanmaes83/floorplan-3d/commits/master` | `46174d6918e336119a79f5bda9fd2733aa5464c4`, merge #237, 07:24:51 UTC. No avanzó respecto del informe anterior. |
| `gh pr list --state open --limit 500 --json ...` | 29 PR exactas. Autores, fechas, bases y heads en matriz/JSON. |
| `gh pr view N --json body,comments,reviews,commits,files,statusCheckRollup,...` para cada N | 29 cuerpos y comentarios leídos; PR #197/#169 tenían más de 100 archivos. |
| `gh api .../pulls/197/files --paginate` y `.../169/files --paginate` | 197 y 174 archivos respectivamente, frente a los 100 truncados por GraphQL. `pr-forensics.json` se amplió. |
| `gh api .../pulls/N/comments --paginate` para cada N | 0 comentarios inline en las 29 PR; comentarios de conversación sí se guardaron. |
| `git fetch --unshallow origin master`; `git fetch origin +refs/pull/N/head:refs/remotes/pr/N` | Historial y 29 heads cargados solo en clon de auditoría; rama de trabajo no se movió. |
| `git merge-base`, `git rev-list --left-right --count`, `git cherry -v`, `git diff`, hashes de blob por archivo y `git merge-tree --write-tree master pr/N` | 18 merges directos limpios, 11 con conflictos; #217 ancestro de master. Resultados PR por PR en JSON y matriz. Merge-tree solo escribió objetos en clon de auditoría, ninguna rama. |
| `gh api .../branches/master/protection`; `gh api .../rules/branches/master` | 404 `Branch not protected`; reglas efectivas `[]`. No se cambiaron reglas. |
| `gh api .../commits/46174d6918e336119a79f5bda9fd2733aa5464c4/check-runs` | 4/4 success exactos: `ent01-preview`, `import-and-regressions`, `goals-and-editor`, `project-first`. No son todos los workflows del repositorio. |
| `gh run view 43745021965 --log-failed` | #238 remoto `5e3a2e9`, job `browser` rojo: dos subtests `assets.browser` «Loading aborted». No se demostró que fueran preexistentes. |
| `gh api .../deployments?per_page=10`, `.../deployments/7818009528/statuses` | Production deployment SHA `46174d6918e336119a79f5bda9fd2733aa5464c4` success, URL `floorplan-3d-vlmcjx5rc-juanma-espinosas-projects.vercel.app`. |
| `vercel inspect https://floorplan-3d-alpha.vercel.app --non-interactive` | Alias público apunta a `dpl_5abs4NFfcFdGeMapKgzzwKqxPxcV` del 9/11, no al deployment HEAD. |
| GET público del alias, sin credenciales | HTTP 200; HTML no carga `js/cat04-ui.js`, `js/assistant-ui.js`, `js/r02a-ceiling-editor.js`, `js/r03-cabinet-rubik-ui.js` ni `js/nav3d-ui.js`. |
| `git cat-file -e 'eb6cc57^{commit}'` y `16a7d13` en clon independiente | Ambos objetos no disponibles. No se inspeccionó la sesión activa de Claude; su trabajo local es una comunicación, no evidencia remota. |

## Pruebas ejecutadas por Codex en el HEAD exacto

| Clase | Fecha UTC, comando y entorno | Resultado y causa | Artefacto |
|---|---|---|---|
| Puras/API simulada | 2026-11-16T10:11:07.526795+00:00–2026-11-16T10:11:07.860438+00:00; `node --test` con los 13 archivos de `pure-tests-46174d6.json`; Windows/Node local sin proveedor externo. | 130/131 pasadas, 1 fallida, 0 omitidas. El fallo `AG-0` compara bytes de seis schemas: `core.autocrlf=true` creó CRLF en worktree; tras normalizar CRLF, los seis blobs coinciden con Git. No se corrigió artificialmente ni se cambió el repositorio. | `pure-tests-46174d6.json`, `pure-tests-46174d6.tap.txt` |
| Navegador | 35/38 pasadas, 3 fallidas, 0 omitidas, 404880.7797 ms; 2026-11-16T10:12:43.138345+00:00–2026-11-16T10:19:28.067933+00:00; `node --test --test-concurrency=1` con los ocho archivos de `browser-tests-46174d6.json`; Chromium local, THREE local, sin llamadas pagadas. | Fallos: `build-palette` 390×844 y 844×390 porque `#nav3dToggle` intercepta `#paletteTabBuild`; `wall-structure` 390×844 por margen de Inicio. El resto cubre R02, R03, CAT04, V2, ENT preview y Home. | `browser-tests-46174d6.json`, `browser-tests-46174d6.txt` |

La auditoría anterior de este mismo SHA había comunicado 32/32 y 38/41 en otras tandas de navegador; no se suman con las tandas actuales ni se usan para inflar cobertura. Las pruebas actuales documentan command line, entorno, hora y resultado completos. El checkout de auditoría permaneció limpio después de ejecutarlas.

### Reproducción exacta de las tandas locales

Ejecutadas desde `<clon-local-de-auditoria>`, con Node local. Los JSON adjuntos guardan los argumentos como array, variables de entorno, salida y hora exacta.

```text
node --test tests/budget-core.test.cjs tests/catalog-budget-core.test.cjs tests/cat04-xr.test.cjs tests/cat04-f1f2.test.cjs tests/cat04-cross-review.test.cjs tests/cat04-assistant.test.cjs tests/assistant-ai-v2.test.cjs tests/client-delivery-core.test.cjs tests/ent01-delivery-api.test.cjs tests/share-api.test.cjs tests/unshare-api.test.cjs tests/r02a-activation.test.cjs tests/r03-integration-core.test.cjs

node --test --test-concurrency=1 tests/build-palette.browser.test.cjs tests/wall-structure.browser.test.cjs tests/r02a-editor.browser.test.cjs tests/r03-editor-in-rubik.browser.test.cjs tests/cat04.browser.test.cjs tests/assistant-ai-v2.browser.test.cjs tests/ent01-preview.browser.test.cjs tests/welcome-capabilities.browser.test.cjs
```

Para navegador se usaron `NODE_PATH=audit_rubik` y `THREE_LOCAL_DIR=vendor/three`; Chromium fue local. Los scripts de prueba no realizaron llamadas a proveedores de pago.

## CI consultado por PR, en su propio HEAD

Los recuentos siguientes son `statusCheckRollup`; incluyen estados Vercel y no deben confundirse con número de workflows Actions. La descripción de #238 habla de 24/25 jobs, mientras el rollup contiene 25 success y 1 failure al incluir Vercel.

| PR/SHA | Estados consultados | Archivos |
|---|---|---|
| #238 `5e3a2e987f` | FAILURE:1, SUCCESS:25 | 25 archivos GraphQL |
| #236 `732cdfb77a` | SUCCESS:12 | 36 archivos GraphQL |
| #227 `fbf1730003` | SUCCESS:66 | 14 archivos GraphQL |
| #226 `0ac6b4a020` | SUCCESS:64 | 19 archivos GraphQL |
| #225 `9118152e1b` | SUCCESS:67 | 17 archivos GraphQL |
| #217 `a258e1136b` | SUCCESS:7 | 4 archivos GraphQL |
| #215 `adce8f936c` | FAILURE:1, SUCCESS:13 | 18 archivos GraphQL |
| #205 `2dca1c547f` | SUCCESS:8 | 10 archivos GraphQL |
| #204 `3e17a07b50` | SUCCESS:4 | 8 archivos GraphQL |
| #197 `0ce3c44b89` | SUCCESS:4 | 100 archivos GraphQL (ampliado REST a 197) |
| #196 `316487cd73` | SUCCESS:4 | 11 archivos GraphQL |
| #194 `fc5a4224f2` | SUCCESS:15 | 39 archivos GraphQL |
| #193 `7d8a626904` | FAILURE:1, SUCCESS:13 | 27 archivos GraphQL |
| #191 `2158fd1920` | SUCCESS:13 | 18 archivos GraphQL |
| #169 `ce70f85941` | SUCCESS:11 | 100 archivos GraphQL (ampliado REST a 174) |
| #167 `fe876c1c20` | CANCELLED:1, SUCCESS:10 | 65 archivos GraphQL |
| #166 `cef06ff78a` | SUCCESS:11 | 78 archivos GraphQL |
| #165 `894607b38f` | SUCCESS:12 | 26 archivos GraphQL |
| #164 `4091b921bb` | SUCCESS:3 | 3 archivos GraphQL |
| #162 `eb888c1c9b` | SUCCESS:3 | 1 archivos GraphQL |
| #161 `8d591bb8e6` | SUCCESS:3 | 1 archivos GraphQL |
| #160 `91bb8d3b75` | SUCCESS:3 | 60 archivos GraphQL |
| #89 `a9fb141713` | SUCCESS:2 | 1 archivos GraphQL |
| #86 `01fc51f836` | SUCCESS:2 | 6 archivos GraphQL |
| #77 `aa01f7964f` | SUCCESS:2 | 1 archivos GraphQL |
| #71 `aba44e387d` | SUCCESS:2 | 96 archivos GraphQL |
| #64 `9e27dd1b06` | SUCCESS:2 | 3 archivos GraphQL |
| #61 `53e5c9831f` | SUCCESS:2 | 1 archivos GraphQL |
| #48 `a260abdaf5` | FAILURE:2, SUCCESS:2 | 19 archivos GraphQL |

## Límites y fuentes históricas

`RUBIK-SOTA-INVENTARIO-REAL-Y-PLAN-CIERRE-MVP-2026-11-16.md` se encontró fuera del repositorio y se cotejó; su clasificación de #217 como parcial queda corregida aquí por ancestralidad directa. `RUBIK_SOTA_REVISION_CRUZADA_237_PLAN_238_2026-11-15(1).md` no apareció en la búsqueda local; no se utilizó como prueba. No se ejecutaron las 29 PR en navegador, 285 ramas por separado, todos los modos FT3D, hardware físico, servicio de IA real, Redis, Blob remoto con publicación, BC3 en software tercero ni una visita de cliente desde otro navegador. No se probó el trabajo activo de Claude. Las descripciones/actas históricas se conservaron como declaraciones; código, Git y tests prevalecen. No se realizó operación remota de escritura.
