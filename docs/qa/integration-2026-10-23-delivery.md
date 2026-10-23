# Integración temporal 2026-10-23: #79, #80, #78, #81, #82 y #83 sobre `master`

**Rama:** `integration/2026-10-23-delivery`. Es temporal y solo sirve para auditar. **No se fusiona**, no tiene PR y no
cambia `master`. Se construye desde `master` `e796e3d` fusionando las ramas en este orden, con `--no-ff`:
#79 → #80 → #78 → #81 → #82 → #83. **Sin conflictos.**

**SHA de código probado: `2f4015f`.** El HEAD de esta rama añade a ese código los últimos commits de documentación de
#79 y #80 y este informe. La comprobación `git diff 2f4015f HEAD -- index.html js css tests vendor` está vacía (ver
§6).

## 1. PR #78–#83
| PR | Base | HEAD | Tipo | Depende de | Estado | Autorizada por Juanma |
|---|---|---|---|---|---|---|
| #78 «Compartir imagen» | `master` `e796e3d` | `494f14d` | código: 3 archivos, +75 líneas | — | Draft | **no** |
| #79 Defectos de `master` | `master` `e796e3d` | `97c8578` | código (`index.html`, `js/sheet-ui.js`, CSS y pruebas) + QA | — | Draft | sí |
| #80 Programa de entrega | `master` `e796e3d` | `08228f7` | solo docs | — | Draft | sí |
| #81 Imagen de entrega | **`feat/share-image` (#78)** | `2ae9811` (código `17e286a`) | código: `js/delivery-image.js`, `presentation-ui`, `index.html` y pruebas + QA | **#78** | Draft | sí, pero no puede llegar a `master` sin #78 |
| #82 Puntos de interés | `master` `e796e3d` | `baec518` | solo docs (estudio) | — | Draft | sí |
| #83 Vídeo del recorrido | `master` `e796e3d` | `84e6abd` | solo docs (estudio) | — | Draft | sí |

#80, #82 y #83 son **propuestas documentales**. Fusionarlas no aprueba ningún contrato (puntos de interés A/B/C),
formato de vídeo, funcionalidad ni decisión (D-05, D-06/D-08/D-09, mapas).

## 2. La dependencia #78 → #81
- **El diff propio de #81 respecto a #78** son 56 archivos, +560/−14. Toca **código de #78**:
  - el flujo de compartir de `js/presentation-ui.js`;
  - el nombre de archivo que espera `tests/share-image.browser.test.cjs`.
  Por tanto, #81 no funciona sin #78.
- **Si se fusiona #81 hoy, con su base actual:** sus commits entran en `feat/share-image`, no en `master`, y `master`
  no cambia. A partir de ahí la PR #78 mostraría #78 y #81 juntos (+635 líneas). Quien fusionara «#78» estaría
  metiendo también #81 bajo la revisión de #78.
- **Si se cambia la base de #81 a `master` sin fusionar #78:** el diff de #81 pasaría a contener todo #78. #78 entraría
  de forma implícita, sin aprobación propia. **No se ha hecho, y no se recomienda.**

### Decisión que falta (Juanma)
| Opción | Qué ocurre | Consecuencias |
|---|---|---|
| **A (recomendada)** Autorizar #78 por separado | Orden: #79 → #80 → #82 → #83 → **#78** (actualizada con `master` tras #79) → cambiar la base de #81 a `master` → **#81** | Cada PR conserva su alcance y su diff. #78 se revisa sola (+75 líneas). Tras fusionar #78, el diff de #81 queda solo con lo suyo. Su CI queda en verde solo si incluye #79 (F1b y F2), así que hay que actualizar #78 y #81 con `master` |
| B Aplazar #78 y #81 | Se fusionan ahora #79, #80, #82 y #83; #78 y #81 esperan | No entra código no autorizado. La imagen de entrega no llega a `master` |
| C (no recomendada) Fusionar #81 en `feat/share-image` y después #78 | #81 entra bajo la PR #78 | Mezcla alcances y #81 queda sin revisión propia en `master` |
| D (no recomendada) Cambiar la base de #81 a `master` | #78 entra oculta en #81 | Introduce código no autorizado de forma implícita |

## 3. Pruebas sobre la integración `2f4015f`
Entorno:
- Chromium 141.0.7390.37 con SwiftShader (sin GPU), Playwright, Node 22.
- Three.js 0.160.0 del paquete npm oficial local (`THREE_LOCAL_DIR`).
- El proxy del entorno rechaza `cdn.jsdelivr.net` (HTTP 403). Las pruebas que descargan Three.js con `curl` reciben
  esos mismos archivos a través de un `curl` de reemplazo para la ruta `three@0.160.0`; cualquier otra URL va al `curl`
  real. Las pruebas no se han modificado.
- Ejecución en serie (`--test-concurrency=1`), un archivo cada vez.

| Prueba | PASS | FAIL | SKIP | TIMEOUT |
|---|---|---|---|---|
| Unitarias (26 archivos) | 258 | 0 | 2 (necesitan Blender `bpy`) | 0 |
| `first-paint-language` | 1 | 0 | 0 | 0 |
| `selection-scale` | 3 | 0 | 0 | 0 |
| `sheet` (incluye el caso nuevo de #79) | 9 | 0 | 0 | 0 |
| `brand` | 3 | 0 | 0 | 0 |
| `share-image` | 3 | 0 | 0 | 0 |
| `delivery-image` | 4 | 0 | 0 | 0 |
| `browser` | 34 | 0 | 1 («3D renders the same project…»: carga Three.js desde la CDN bloqueada, **no validado**) | **2** («F1 completion: touch 2D/3D» 390 y 844, 90 s) |
| `multiformat-guide` | 9 | 0 | 0 | 0 |
| `upload` | 8 | 0 | 0 | 0 |
| `guide-navigation` | 4 | 0 | 0 | 0 |
| `guide` | 5 | 0 | 0 | 0 |
| `room-layout` | 5 | 0 | 0 | 0 |
| `capture-3d` | 3 | 0 | 0 | 0 |

**«F1 completion: touch 2D/3D»:** también es TIMEOUT en `master` `e796e3d` y en #79 `13444d5`, en este entorno y en
los dos tamaños. En GitHub Actions pasó sobre `72bac33` (`Multiformat` ✅). No es una regresión de la integración. Queda
como TIMEOUT de este entorno.

**Suite `presentation`:** no se ha repetido completa sobre `2f4015f`. Su último resultado caso a caso es el de la
integración anterior (código `9726eb5`): 54 PASS, 1 FAIL (P13 1440) y 3 TIMEOUT (P15, P08 y P05 a 1440). La causa de
P13 está medida en #79 (`docs/qa/p13-1440-diagnosis-2026-10-23.md`); sigue siendo TIMEOUT y no está validada en GPU.

Registros: `docs/qa/artifacts/integration-2026-10-23-delivery/`.

## 4. Pruebas por rama (en su propio HEAD, en serie)
| Rama | SHA (código) | Pruebas | Resultado |
|---|---|---|---|
| #79 | `97c8578` (código `acabb54`) | `first-paint` 1/1 · `selection-scale` 3/3 · `brand` 3/3 | PASS |
| #79 | `acabb54` | `sheet` 9/9 (con la corrección) · unitarias 254 PASS, 2 SKIP | PASS |
| #79 | `b875157` (código `72bac33`), sin la corrección | `sheet` 7 PASS / **2 FAIL** (casos nuevos) | la prueba falla antes de corregir |
| #79 | `72bac33` | P13 1440 | **TIMEOUT** (2 de 2; `master` FAIL por aserción 2 de 2) |
| #79 | `13444d5` | «F1 completion: touch 2D/3D» 390 y 844 | **TIMEOUT** (igual en `master` `e796e3d`) |
| #81 | `2ae9811` (código `17e286a`) | unitarias 258 PASS, 2 SKIP · `brand` 3/3 · `share-image` 3/3 · `sheet` 7/7 · `delivery-image` 4/4 | PASS |
| #78 | `494f14d` | unitarias 254 PASS, 2 SKIP · `brand` 3/3 · `share-image` 3/3 · `sheet` 7/7 | PASS |

`browser` y las suites `multiformat` no se han repetido en #81 ni en #78 por separado. En GitHub Actions fallan F1b y
F2, igual que en `master`; esos casos pasan en la integración porque esta incluye #79.

## 5. GitHub Actions y previews
- **Actions:** la última ejecución es del 22-10 a las 23:09 UTC. Ninguno de los push del 23-10 ha creado ejecuciones,
  tampoco `acabb54` (#79), que cambia `js/` y `tests/`. Por tanto, **el CI no se ha ejecutado** sobre los HEAD
  actuales.
  - Última evidencia real: #79 `72bac33`, con `Guided` ✅ y `Multiformat` ✅.
  - #81 `17e286a` y #78 `494f14d` tienen `Multiformat` ❌, con los 7 FAIL F1b y F2 heredados de `master` que corrige
    #79.
  - `master` `e796e3d` también tiene `Multiformat` ❌.
- **Vercel:** todas las HEAD tienen un despliegue de preview en estado `READY`. `READY` acredita el despliegue, no la
  QA. Las previews exigen sesión de Vercel.

## 6. Comprobación de identidad del código
Integración reconstruida con los HEAD finales: `4368060` (el merge previo al commit de este informe). `git diff --stat 2f4015f 4368060 -- index.html js css tests vendor` → **vacío**. Solo cambian documentos de #79 y #80 (registros renombrados a `.txt`).

## 7. Pendiente
- **Decisión de Juanma sobre #78** (§2). Sin ella, #81 no puede llegar a `master`.
- **Equipo con GPU:** P13, P15, P08 y P05 a 1440 y «F1 completion: touch 2D/3D», según el protocolo de
  `docs/qa/p13-1440-diagnosis-2026-10-23.md` (#79).
- **Teléfono real:** «Compartir…» (#78 y #81). **Impresión:** lámina A3 medida con regla (#72).
- **`brand` 390, descarga intermitente:** no reproducida hoy y sin causa demostrada. El defecto relacionado está
  corregido en #79.
- **CI:** volver a lanzar o comprobar GitHub Actions sobre los HEAD finales antes de fusionar.
