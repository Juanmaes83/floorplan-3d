# SCULPT-R02-A · Procedencia, licencias y huellas

**Fecha:** 10/11/2026 · **Base RUBIK:** `master@75615fd` · **Rama:** `lab/sculpt-r02-ceiling-layout`
**Estado:** laboratorio. **No integrado en RUBIK. No validado para diseño técnico reglamentario. Fuera de Vercel** (`.vercelignore` excluye `labs/`).
**Licencias:** documentadas para GOV-05, **no resueltas jurídicamente**. Nada de lo que sigue es asesoramiento legal.

## 1. Donante

| Campo | Valor |
|---|---|
| PR upstream | wy51ai/floorplan-3d#17 |
| Repositorio contribuidor | `zhuzhuyumeng/floorplan-3d`, rama `feat/ceiling-layout` |
| Commit R02-A | `324eb64cf9b26f6d4df8323c2dec4591fa4691e3`, árbol `81e330c7ddfd4e8dbbb81c1f04368da2ac6145b6` |
| Padre inmediato | `88323f3cc4ab5960570560192dee3d6163186a94`, árbol `357751dd…` (= `master` de zhuzhuyumeng) |
| Autoría | `olifod <olifod@192.168.100.9>`, 09/11/2026; trailer `Co-authored-by: Cursor <cursoragent@cursor.com>` (asistido por un agente de IA) |
| Licencia del árbol | `LICENSE` MIT, «Copyright (c) 2026 wuyi», copiada sin cambios en `workshop/LICENSE-donor-MIT.txt` |
| `git archive 324eb64 \| sha256sum` | `25f3623ad9b34c3d5c0bc51f04520b6dd73eca1721bc78796858ee58a6a30d4e` |
| Por archivo (41) | `SOURCE-EXACT.sha256` |

## 2. Diferencial real `88323f3 → 324eb64` (8 archivos, comprobados con `git diff`)

| Archivo | Blob padre | Blob R02-A | Líneas | Contenido |
|---|---|---|---|---|
| `index.html` | `0b5ae6e1c400` | `27893e33a0e8` | +98 / −47 | Modo «顶面布置»: selector de tres posiciones, `CEILING_LIB` (6 elementos), filtro de capa en 2D, panel de propiedades (`ceilingDrop`, `curtainLength`), valores por defecto al crear, símbolos 2D, mallas 3D, cota vertical en 3D, comprobación de colocación en `commit`, cancelación de arrastre |
| `js/ai-layout.js` | `b9ddadf674a6` | `a727606430fb` | +3 / −6 | Usa `furniturePlacement`; conserva la capa de techo al aplicar una distribución IA |
| `js/project-model.js` | `595b20ac39c4` | `5532dd994f2f` | +43 / −2 | Validación de `layer`, `ceilingDrop` y `curtainLength`; regla de altura libre; `furniturePlacement` y `resolveFurniturePlacement` |
| `js/project-ui.js` | `83b5eb2cda89` | `7593de7a0ae9` | +2 | Sale del modo techo al cambiar de pestaña |
| `project.css` | `578154c8fa61` | `aa543b1b6cae` | +3 | Estilo del modo techo |
| `tests/ceiling.spec.cjs` | — (nuevo) | `25452d9da9f4` | +16 | E2E de la capa de techo |
| `tests/furniture-placement.spec.cjs` | — (nuevo) | `dde0fd98905d` | +14 | E2E de colocación con muros |
| `tests/model.test.cjs` | `9405db0d02ec` | `50c3023a723f` | +11 | Unitaria de colocación con muros |

**No es diferencial de R02-A** y no se copia: todo lo heredado de `88323f3`. En concreto:
- `ai-client.js`, `ai-config.js` y la conversación de `ai-layout.js`, con proveedores de IA de pago;
- el mobiliario (`furniture-*`);
- el reconocimiento (`recognition-*`). Sus blobs son idénticos a los de R01 (`d635e751…` y demás), así que **no se duplica R01**.

## 3. Qué se ha llevado al taller (extractos literales)
`extract-donor.cjs` genera y verifica cada extracto: comprueba su SHA-256 y que coincide byte a byte con el rango de líneas del donante.

| Extracto | Origen | Uso |
|---|---|---|
| A | `js/project-model.js:185-226` | Ejecutable: `footprint`, `overlap` (heredados de `88323f3`, imprescindibles) + `furniturePlacement`, `resolveFurniturePlacement` (nuevos) |
| B | `index.html:541-545` | Datos: `CEILING_LIB` |
| C, D | `js/project-model.js:114`, `:168` | Referencia: límites por elemento y regla de altura libre |
| E | `index.html:1668` | Referencia: valores por defecto al crear |
| F | `index.html:3173-3185` | Referencia: colocación vertical en 3D |
| G | `tests/model.test.cjs:84-94` | La prueba unitaria del donante, sin cambios, ejecutada contra A (1/1) |

Las reglas C–F se **reexpresan** en el adaptador (no se ejecuta `index.html`). La paridad con el donante se prueba en CI, cargando `js/project-model.js` del snapshot reconstruido.

## 4. Por qué SOURCE EXACT no se sube
El árbol `324eb64` contiene la misma `tests/fixtures/user-floorplan.png` que R01 (SHA-256 `6206fcc8…`): una captura de una vivienda real hecha en una app comercial, sin derechos acreditados. Por eso:
- el snapshot vive solo en local (`/home/user/donors/r02-exact`);
- `fetch-source-exact.sh` lo reconstruye **fuera** del repositorio y lo verifica. Usa el mismo patrón seguro que R01: nunca borra ni sobrescribe, rechaza enlaces simbólicos y rutas internas, construye en un temporal y verifica, y `--verify` es de solo lectura.
- Los tres documentos del donante en `docs/*.md` (en chino) tampoco se copian.

## 5. Dependencias
- **Ninguna instalada en RUBIK.**
- Baseline E2E del donante: `@playwright/test@1.63.0`, instalado con `--ignore-scripts` en un directorio temporal (sin scripts y sin dependencias más allá de `playwright`).
- three.js: el donante lo carga de `cdn.jsdelivr.net` (`three@0.160.0`). El baseline lo sirvió desde `vendor/three` de RUBIK (misma versión, hashes en `vendor/three/manifest.json`) mediante un arnés que **bloqueó y registró** cualquier petición externa. Hubo **0 bloqueadas**.

## 6. GOV-05 (abierto)
1. Base para reutilizar las contribuciones de olifod, que además declaran coautoría de un agente de IA (Cursor).
2. Aviso MIT de wuyi en RUBIK.
3. La imagen del donante no se redistribuye.

Uso actual: **solo laboratorio**, con el aviso MIT conservado.
