# Evidencias — validación empírica del MCP Etapa 2

**Código auditado:** PR #196, `lab/rubik-mcp-stage2-proposals` @ `369c5b7d516afb55ded16054851504696dca3440`. No se ha modificado.

**Generadas:** 11-11-2026, Node 22.23.4, Linux, Chromium 1243 (Playwright 1.63.0).

**Informe:** [`docs/technical/local-mcp-stage2-empirical-validation.md`](../../../technical/local-mcp-stage2-empirical-validation.md).

**Todos los proyectos son sintéticos o ficticios.** No hay datos de clientes: no existe en el entorno ningún proyecto real autorizado.

## Cómo reproducirlas

```bash
cd tools/rubik-mcp && npm ci
cd ../..
CODE_SHA=$(git rev-parse HEAD) node tools/rubik-mcp/validation/run-stdio.mjs     # servidor MCP real por stdio
CODE_SHA=$(git rev-parse HEAD) node tools/rubik-mcp/validation/record-lab.mjs    # Playwright + Chromium
cd tools/rubik-mcp && npm test                                                    # 100 pruebas (86 de #196 + 14 de validación)
```

## Contenido

| Carpeta | Qué contiene |
|---|---|
| `fixtures/` | Los 12 proyectos sintéticos usados, tal como se escribieron en disco para el servidor. |
| `results/<fixture>.json` | Por grupo: comando, `serverInfo`, herramientas y anotaciones descubiertas, resumen, revisión, cada `propose_layout` (enviado **dos veces**), integridad antes/después y transcripción. |
| `results/summary.json` | Las 30 propuestas: estado, código, posición y repetibilidad. |
| `results/search-audit.json` | Auditoría de la búsqueda (Corte 5). |
| `results/playwright-checks.json` | 84 comprobaciones visuales y de fidelidad. |
| `logs/<fixture>.stdout.jsonl` | stdout **completo** del servidor: solo líneas JSON-RPC. |
| `logs/<fixture>.stderr.log` | stderr por separado: una sola línea de inicio. |
| `logs/playwright-runs.json` | Errores de consola y de página y peticiones de red de cada ejecución. Datos de los vídeos. |
| `screenshots/` | 15 escenarios del laboratorio × 4 tamaños (1440×900, 1280×800, 390×844, 844×390) y el editor RUBIK con 3 fixtures importados (1440×900 y 390×844). En total, 66 PNG. |
| `videos/` | Tres grabaciones reales de Chromium (WebM, 1440×900). |

## Vídeos

| Archivo | Duración | Contenido | SHA-256 (16) |
|---|---|---|---|
| `video-1-conflicto-y-propuesta.webm` | 16,9 s | El editor RUBIK importa el JSON. Después, en el laboratorio, los pasos 1–7 de dos mesas solapadas y de una mesa girada: proyecto, mueble, conflicto, respuesta MCP, candidata, verificación y `applied:false`. | `c6e217d0db170c48` |
| `video-2-puerta-y-barrido.webm` | 27,0 s | Silla en el barrido de la puerta (candidata). D3: dentro del cuadrado, fuera de la hoja. D1: puerta sin `swing` (`pending`). F1: conflicto debido a un barrido supuesto. | `fb5e68162b523f9f` |
| `video-3-casos-adversariales.webm` | 29,4 s | Hash obsoleto, estancia ambigua, presupuesto agotado, dos candidatas rechazadas con la segunda candidata que existía (F2), mueble fuera de toda estancia, y el SHA-256 del JSON antes y después. | `eb825e88e0dc6058` |

## Trazas de Playwright (no publicadas)

Las trazas (`.zip`, con capturas y snapshots DOM) no se suben al repositorio por tamaño: 11,5 MB en total. Se conservan en la ruta local de la sesión de validación y se regeneran con `record-lab.mjs`.

| Traza | Bytes | SHA-256 |
|---|---|---|
| `video-1-conflicto-y-propuesta.zip` | 6 129 302 | `ba9b7b4f78b9dcf8cf856e7a1cb8e7851f46d8757c2d169ada702c1e82be68c3` |
| `video-2-puerta-y-barrido.zip` | 2 178 478 | `caefcfa684c357184bed54c3b48e55bdb48038f930ed1893c215437d5677f32e` |
| `video-3-casos-adversariales.zip` | 3 170 043 | `e8d8821a2460be7c1ae50367d79038216bafacfb7f1be6c9301c69f61642bdb3` |

El laboratorio visual (`tools/rubik-mcp/validation/lab/`) **no es parte del producto**. Dibuja una propuesta que no se ha aplicado y nunca guarda nada.
