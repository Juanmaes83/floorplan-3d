# OP-10 · 01 · SOURCE EXACT, SOURCE DISCOVERY y auditoría de partida

Clases de evidencia (protocolo multiagente §4): [I] código inspeccionado, [E] prueba ejecutada, [T] prueba localizada, [V] pendiente.

## 1. Donante

| Campo | Valor |
|---|---|
| Repositorio | https://github.com/Juanmaes83/openPlan3D (fork de `laanlabs/openPlan3D`) |
| Commit | `771c9e1ad30bd1c3cc7584d6eca74deb2e14943d` [E] (obtenido por `git fetch --depth 1` del SHA exacto) |
| Licencia | MIT, © 2026 theLodgeStudio (`LICENSE`) [I] |
| Dependencias pertinentes | `three` 0.182.0 en el lockfile del donante; `vitest` 5.0.5; `@playwright/test` 1.63.0 [I]. RUBIK usa `three` r160 (`vendor/three`) |
| Copia inmutable | `upstream/openplan3d-771c9e1/` con `MANIFEST.sha256` (10 archivos). Comprobar: `cd upstream/openplan3d-771c9e1 && sha256sum -c MANIFEST.sha256` |

### Inventario de la familia (SHA-256 del contenido)

| Archivo | Papel | SHA-256 |
|---|---|---|
| `src/lib/utils/portableRenderScene.ts` | Algoritmo de captura | `2a16c147…` |
| `docs/portable-render-scene.md` | Contrato `openplan3d-render-scene` v1 y evidencias del donante | `6f7d1213…` |
| `tests/portable-render-scene.test.ts` | 6 pruebas unitarias | `09465913…` |
| `tests/browser/portable-render-scene.spec.ts` | Recorrido de navegador (exportar, repetir, apilado, copia intacta) | `8dfd3c5f…` |
| `src/lib/components/viewer3d/ThreeViewer.svelte` | Integración real: `exportBlenderScene()`, marcas `renderExclude`/`renderMaterial` | `10c7f793…` |
| `src/lib/utils/slopedWallGeometry.ts`, `wallProfiles.ts` | Dependencias de las pruebas (muros inclinados) | `0c129402…`, `25aa597c…` |
| `tests/fixtures/sloped-walls.openplan.json` | Fixture del recorrido | `ab7b8153…` |
| `LICENSE`, `package.json` | Licencia y versiones | `30228141…`, `7b675136…` |

Contraste con la copia fiel anterior (`sculpt/openplan3d-fuente`, `labs/sculpt/openplan3d-771c9e1/`): esa copia NO contiene esta familia (84 archivos de DXF y persistencia). Sus blobs de `LICENSE` (`e1984771…`) y `package.json` (`f1921daf…`) son idénticos a los del upstream [E].

### Baseline del donante en este entorno

| Suite | Resultado |
|---|---|
| Unitarias (Vitest 5.0.5, `tests/portable-render-scene.test.ts`) | **6/6** [E] |
| Navegador (Playwright 1.63, Chromium, build de producción) | **4/4** (en/pt × 1440/390) [E] |
| Firefox y WebKit del donante | **No ejecutadas**: no hay esos navegadores en el contenedor [V] |
| Render nativo del donante (Blender 5.2.1 desde el repo iOS) | **Bloqueado**: el consumidor no es accesible (ver §2) |

## 2. Consumidor nativo Blender (SOURCE DISCOVERY acotada)

El doc del donante remite a `laanlabs/openplan3d-ios` (`tooling/rendering/render_jobs.py`, Blender 5.2.1 LTS).

| Vía | Resultado |
|---|---|
| `git ls-remote https://github.com/laanlabs/openplan3d-ios` | Pide credenciales: privado o inexistente para esta sesión [E] |
| API de GitHub `repos/laanlabs/openplan3d-ios` | Sin acceso para la sesión [E] |
| Solicitud de acceso legítima (`add_repo`) | Rechazada: «you don't have access» [E] |
| Búsqueda pública de código (`render_jobs.py`, `openplan3d-render-scene`, `arkit-metres-y-up`) | Solo el lado web (`laanlabs/openPlan3D`) y copias de terceros del mismo web. Ningún worker nativo [E] |

**Conclusión:** bloqueo registrado. No hay versión, contrato completo ni licencia verificables del consumidor; no se trata como disponible ni como redistribuible. Se aplica el orden de preferencia: **A** (recuperar el original) bloqueada → **B** (pipeline Blender de RUBIK) + **C** (importador mínimo dentro de OP-10). Herramienta usada: la API de GitHub; ninguna de las herramientas de scraping hizo falta (fuentes Git, sin documentación web adicional).

## 3. Forks Blender del propietario (auditoría de valor)

| Fork | SHA | Licencia | Qué es | Decisión para OP-10 |
|---|---|---|---|---|
| `threejs-blendertools` | `dbd7b752` | MIT (módulo) | Sincronización en vivo Blender → Three.js por socket | **REJECT**: sentido inverso, no exporta la escena |
| `blender-to-web` | `b591a0ab` | Sin licencia declarada | Skill «de Blender a la web» | **REJECT**: no reutilizable sin licencia; dirección inversa |
| `blender-tools` | `bf049c63` | GPL-3.0 | Georreferencia OSM, escalado | **REJECT**: sin valor y riesgo de contaminación GPL |
| `blender-mcp` | `61fb53eb` | MIT | Control interactivo de Blender por MCP | **OPTIONALISE**: útil para pulido interactivo humano; no sustituye la cadena headless verificable |
| `blender-control` | `d2db1deb` | Sin licencia declarada | Skill de buenas prácticas | **Solo conocimiento**: API de datos antes que `bpy.ops`, `--python-exit-code`, sin viewport en background |
| `mcp-for-blender`, `blender-skills`, `blender-skills-94-…` | — | — | Misma categoría (agentes y guías) | No clonados: sin aporte a una cadena determinista |

Ningún código de los forks se ha copiado al laboratorio.

## 4. Pipeline Blender existente en RUBIK (B)

| Pieza | Estado | Evidencia |
|---|---|---|
| `scripts/interop/export.cjs` (PR #24): paquete canónico GLB + `semantic.json` desde el **proyecto** | Vigente; NO se duplica | [I] |
| `scripts/interop/blender-verify.py` | **PASS** en Blender 5.2.1 LTS: 17 entidades, 0,77 s, 485 MB | [E] |
| `scripts/offline-pilot/*` (piloto 16/10/2026) | Capturaba solo los **muebles** procedimentales con `GLTFExporter`; usa `FloorPlanApp.importProject`, que **ya no existe** en master | [I] |
| Marco común | Visor: `x=(x−OX)/1000`, `y` arriba, `z=(y−OY)/1000`, `OX/OY = Core.geometry(p).center`, **igual que export.cjs** | [I] |

OP-10 no crea otro exportador geométrico ni otro motor: añade la **captura verificable de la escena VISIBLE** (todas las mallas, con su procedencia) y su apertura en Blender.

## 5. Propuesta reutilizable · SOURCE DISCOVERY para próximas piedras

1. **Inventario por referencia:** extraer del donante cada repositorio, paquete o herramienta que nombre (docs, imports, scripts).
2. **Vía legítima por orden:** API de GitHub (repo, releases, búsqueda de código) → solicitud de acceso con `add_repo` → registros de paquetes (npm/PyPI) → documentación pública. Nunca credenciales ajenas ni elusión de permisos.
3. **Herramienta mínima:** si la fuente es Git, la API basta. Solo documentación web justifica un rastreador (`crawl4ai` o `Scrapling` por su ligereza), instalado en un entorno temporal y nunca como plataforma.
4. **Registro:** tabla vía → resultado → evidencia; un bloqueo es un resultado, no un fallo.
5. **Presupuesto:** máximo una hora o diez consultas por dependencia; si no aparece, A bloqueada → B/C.
