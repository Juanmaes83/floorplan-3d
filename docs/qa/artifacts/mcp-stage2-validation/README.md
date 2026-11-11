# Evidencias — validación empírica del MCP Etapa 2

**Informe:** [`docs/technical/local-mcp-stage2-empirical-validation.md`](../../../technical/local-mcp-stage2-empirical-validation.md).

**Todos los proyectos son sintéticos o ficticios.** No hay datos de clientes: no existe en el entorno ningún proyecto real autorizado. **La validación con un proyecto real sigue pendiente.**

## Dos generaciones de evidencias

| Carpeta | Código del motor | Qué es |
|---|---|---|
| Raíz: `results/`, `logs/`, `fixtures/`, `screenshots/`, `videos/` | **`77ca0842a0028dbe87f19462db0d2606aba0d3ec`** (corrección F1, F2 y F3 de #196; `316487c` solo cambia un comentario) | **Evidencia del motor corregido.** |
| `before-fix/369c5b7/` | `369c5b7d516afb55ded16054851504696dca3440` | **ANTES DE LA CORRECCIÓN.** Evidencia histórica de los defectos F1 y F2. No es prueba del motor corregido. |

`before-fix/369c5b7/` contiene, movido con `git mv` y sin duplicar:

- todos los resultados, logs y fixtures de `369c5b7`;
- los vídeos 2 y 3, que muestran F1 y F2;
- las 14 capturas de F1 y F2.

El resto de lo generado con `369c5b7` (vídeo 1 y otras 52 capturas) sigue en el historial de la rama, en el commit `6c816c2`.

**Generadas:** 11-11-2026, Node 22.23.4, Linux, Chromium 1243 (Playwright 1.63.0).

## Cómo reproducirlas

```bash
cd tools/rubik-mcp && npm ci
cd ../..
CODE_SHA=$(git rev-parse HEAD) node tools/rubik-mcp/validation/run-stdio.mjs     # servidor MCP real por stdio
CODE_SHA=$(git rev-parse HEAD) node tools/rubik-mcp/validation/record-lab.mjs    # Playwright + Chromium (CODE_SHA obligatorio)
cd tools/rubik-mcp && npm test                                                    # 128 pruebas (108 de #196 + 20 de validación)
```

## Contenido de la raíz (motor corregido)

| Carpeta | Qué contiene |
|---|---|
| `fixtures/` | Los 14 proyectos sintéticos usados, tal como se escribieron en disco para el servidor. |
| `results/<fixture>.json` | Por grupo (15): comando, `serverInfo`, herramientas y anotaciones, resumen, revisión, cada `propose_layout` (enviado **dos veces**), integridad antes y después, y transcripción. |
| `results/summary.json` | Las 38 propuestas: estado, código, código esperado, posición, búsqueda y repetibilidad. **9 `candidate-reviewable`, 13 `no-change-needed`, 11 `pending` y 5 `blocked`.** |
| `results/search-audit.json` | Enumerador independiente para los escenarios de F2. |
| `results/playwright-checks.json` | 101 comprobaciones visuales y de fidelidad. |
| `logs/<fixture>.stdout.jsonl` | stdout **completo** del servidor: solo líneas JSON-RPC (181 en total). |
| `logs/<fixture>.stderr.log` | stderr por separado: una sola línea de inicio. |
| `logs/playwright-runs.json` | Errores de consola y de página y peticiones de red de cada ejecución (76; 0 errores y 0 peticiones externas). Datos de los vídeos. |
| `screenshots/` | 78 PNG: 18 escenarios del laboratorio × 4 tamaños (1440×900, 1280×800, 390×844, 844×390) y el editor RUBIK con 3 fixtures importados (1440×900 y 390×844). |
| `videos/` | Tres grabaciones reales de Chromium (WebM, 1440×900). |

## Vídeos (motor corregido)

| Archivo | Duración | Contenido | SHA-256 (16) |
|---|---|---|---|
| `video-1-conflicto-y-propuesta.webm` | 17,1 s | El editor RUBIK importa el JSON. Después, en el laboratorio, los pasos 1–7 de dos mesas solapadas y de una mesa girada. | `3b817a6cfb2c7e6c` |
| `video-2-puerta-y-barrido.webm` | 32,8 s | Silla en el barrido de la puerta; D3; D1; **F1 corregido** (solo barrido supuesto: `pending`); caso mixto (conflicto real resuelto, supuesto como incertidumbre). | `58f2432e0dc6acd1` |
| `video-3-casos-adversariales.webm` | 36,4 s | Hash obsoleto; estancia ambigua; presupuesto agotado; **F2 corregido** (nº 363 rechazada y nº 443 aceptada; nº 10 y nº 15); presupuesto 442 (`pending`); límite de 250 verificaciones; mueble fuera de toda estancia. | `6d87f9984e022fc1` |

## Vídeos anteriores (`before-fix/369c5b7/videos/`, ANTES DE LA CORRECCIÓN)

| Archivo | Duración | SHA-256 (16) |
|---|---|---|
| `video-2-puerta-y-barrido.webm` | 27,0 s | `fb5e68162b523f9f` |
| `video-3-casos-adversariales.webm` | 29,4 s | `eb825e88e0dc6058` |

El vídeo 1 de `369c5b7` (`c6e217d0db170c48`) está en el historial.

## Trazas de Playwright (no publicadas)

Las trazas (`.zip`, con capturas y snapshots DOM) no se suben al repositorio por tamaño. Se conservan en la ruta local de la sesión de validación y se regeneran con `record-lab.mjs`.

| Traza (motor `77ca084`) | Bytes | SHA-256 |
|---|---|---|
| `video-1-conflicto-y-propuesta.zip` | 4 976 833 | `269b8f8b84c8dd74e40286ba7ea07f948bd1aec0ca9b5c79a692c61dda4b1c60` |
| `video-2-puerta-y-barrido.zip` | 2 856 681 | `3cf2b68394248918dcdc4c14b03f1d495091f05715b4016414865c1cf98f0c9b` |
| `video-3-casos-adversariales.zip` | 4 398 696 | `977ad1a55ff5d470f44f6dd1a6855750b28c97a9809bc213a9d345de37aee0d8` |

| Traza (`369c5b7`, ANTES DE LA CORRECCIÓN) | Bytes | SHA-256 |
|---|---|---|
| `video-1-conflicto-y-propuesta.zip` | 6 129 302 | `ba9b7b4f78b9dcf8cf856e7a1cb8e7851f46d8757c2d169ada702c1e82be68c3` |
| `video-2-puerta-y-barrido.zip` | 2 178 478 | `caefcfa684c357184bed54c3b48e55bdb48038f930ed1893c215437d5677f32e` |
| `video-3-casos-adversariales.zip` | 3 170 043 | `e8d8821a2460be7c1ae50367d79038216bafacfb7f1be6c9301c69f61642bdb3` |

El laboratorio visual (`tools/rubik-mcp/validation/lab/`) **no es parte del producto**. Dibuja una propuesta que no se ha aplicado y nunca guarda nada.
