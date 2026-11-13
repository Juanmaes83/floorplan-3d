# SCULPT-R03 · Procedencia y derechos (GOV-05/R03 revisado, 11/11/2026)

Esta ficha se refiere **solo a R03**. No resuelve GOV-05 para R01, R02 ni para ningún otro donante.

## 1. Fuente exacta

| Dato | Valor | Cómo se ha verificado |
|---|---|---|
| Repositorio | `caikaidev/floorplan-3d`, rama `codex/walkthrough-cabinet-interiors` | `git ls-remote` del 11/11/2026 |
| Commit | `2495d8e0bf7d3846d2da827121c15e3e83d752bd`, árbol `9b2ab2010a6f782bff7dc02c96815ef9edd5273c` | `fetch-source-exact.sh` |
| Autor del commit | kai cai (cuenta `icaikai`), 2026-10-15T08:49:20Z | metadatos git |
| Padre directo | `3314c440d62ff6af7336ba867ea43b63cc5ceedb` | git |
| Bifurcación | `a03136c86842968a3de5da4c33549d3df3313c51` (wuyi, sin LICENSE) | git |
| PR | wy51ai/floorplan-3d#11, abierta y cerrada por caikaidev el 15/10/2026, sin merge, 16 commits | página de la PR |
| Copia en el upstream | `refs/pull/11/head` de `wy51ai/floorplan-3d` = `2495d8e…` | `git ls-remote`, 11/11/2026; el script la usa como respaldo y se ha probado |
| MIT del upstream | `fbcb8d56a12090f53551ddaa7ae31ae4886a94d1` (01/10/2026), presente en la base de la PR `730ec0923a018fdf38b4687c5ef385c7dcac451f` | git; LICENSE sha256 `293e6ff1…4f14` |
| Archivos | 18 (`SOURCE-EXACT.sha256`); sin imágenes ni datos de terceros | manifiesto |

## 2. Base de derechos (razonamiento)

**Textos consultados.**
- Términos de Servicio de GitHub, vigentes desde el 27/04/2026. Fuente: el repositorio oficial `github/site-policy`, fichero `Policies/github-terms/github-terms-of-service.md`. Su último cambio es `166eb97` (2026-04-27), así que esa versión estaba vigente el 15/10/2026. El texto leído tiene sha256 `b99f6130…74cf`.
  - Consulta del 11/11/2026 con `raw.githubusercontent.com` y un clon git de solo lectura.
  - `docs.github.com` no resuelve DNS desde el contenedor y `api.github.com` devuelve 403 a través del proxy. Por eso se usó la fuente que genera esa página.
- Condiciones de Anthropic, leídas el 11/11/2026 en `anthropic.com/legal/consumer-terms` (en vigor desde el 08/10/2025) y `anthropic.com/legal/commercial-terms` (en vigor desde el 17/06/2025).

**Textos literales.**
- **D.6 «Contributions Under Repository License».** «Whenever you add Content to a repository containing notice of a license, you license that Content under the same terms, and you agree that you have the right to license that Content under those terms. If you have a separate agreement to license that Content under different terms, such as a contributor license agreement, that agreement will supersede.»
- **D.5.** «Your Content that you post publicly, including issues, comments, and contributions to other Users' repositories, may be viewed by others.»
- **D.3.** «These licenses end when you remove Your Content, unless other Users have forked it.»
- **D.8.** «these Terms do not restrict lawful access to or use of the contents of public repositories by third parties».
- **Anthropic.** Consumer Terms: «we assign to you all of our right, title, and interest—if any—in Outputs». Commercial Terms: «Anthropic hereby assigns to Customer its right, title and interest (if any) in and to Outputs».

**Hechos acreditados.**
1. El repositorio receptor contenía el aviso MIT cuando se presentó la PR.
2. El contenido de la PR está almacenado en ese repositorio (`refs/pull/11/head`) y se puede recuperar de él.
3. No consta CLA, DCO, CONTRIBUTING ni ningún acuerdo distinto.
4. El contenido no se ha retirado: el fork y la ref de la PR siguen existiendo.
5. El texto de D.6 no exige que la contribución se fusione.

**Interpretación.** Que abrir una PR contra un repositorio con licencia equivale a «add Content to a repository» es la lectura que GitHub describe como la norma «inbound=outbound». Se apoya además en que D.5 llama expresamente «contributions to other Users' repositories» a ese contenido. No es un hecho comprobable, pero la documentación es suficiente para un laboratorio aislado.

**Riesgo residual.** Que alguien defienda que una PR cerrada sin merge no «añade» contenido. No se ha identificado ninguna reclamación, negativa ni licencia incompatible.

**Commits «Claude <noreply@anthropic.com>».**
- La etiqueta identifica la herramienta, no al titular.
- Anthropic no reclama los Outputs y cede al usuario cualquier derecho que pudiera tener sobre ellos. GitHub (J.2) tampoco reclama los Outputs de sus funciones de IA.
- Esos commits los integró una persona (la cuenta caikaidev, mediante las PR internas #1–#7 del fork) y luego se presentaron en la PR #11.
- **No consta ningún tercero con derechos acreditados.** Ninguno de esos commits aporta archivos a este laboratorio: solo afectan a `index.html`, README, `vendor/three` y ficheros de despliegue, que no se copian aquí.

## 3. Matriz por componente

| Componente | Autoría | Base | Uso en R03 | Decisión |
|---|---|---|---|---|
| `design.js` (motor) | kai cai, `2495d8e` | MIT + D.6 (cat. B) | copia literal en `workshop/`, esculpida en `cabinet-core.js` | **REUTILIZABLE**: KEEP + GENERALISE |
| `cabinet-model.js` (3D) | kai cai | MIT + D.6 (B) | copia literal, usada en la vista 3D del laboratorio | **REUTILIZABLE**: KEEP (OPTIONALISE para la cirugía) |
| `cabinet-editor.js` | kai cai | MIT + D.6 (B) | sin copiar: se generalizan el alzado (`elevation`), `split` y `merge` | **REUTILIZABLE** en parte: GENERALISE / REMOVE (diálogo ligado a globales) |
| `view-settings.js` | kai cai | MIT + D.6 (B) | sin copiar | **REMOVE** en R03: calibración de cámara, fuera del alcance |
| `tests/design.test.cjs` | kai cai | MIT + D.6 (B) | copia literal; se ejecuta sin cambios | **REUTILIZABLE**: KEEP |
| `tests/browser-smoke.cjs` | kai cai | MIT + D.6 (B) | sin copiar; se ejecuta sin cambios sobre SOURCE EXACT local | **EVALUABLE**: baseline |
| `index.html` (cambios del paseo y la colisión) | mixto: wuyi (MIT), «Claude», kai cai | MIT; MIT + D.6 | sin copiar | **REMOVE** en R03: runtime ajeno a RUBIK |
| `vendor/three` | autores de three.js | MIT propia (cat. A) | no se duplica: es idéntico byte a byte al de RUBIK | **REMOVE** (duplicado) |
| `wrangler.jsonc`, `.assetsignore`, `.gitignore`, README | mixto | MIT / MIT + D.6 | sin copiar | **REMOVE** (despliegue ajeno) |

## 4. Obligaciones

- Conservar el texto MIT y los avisos, en `workshop/LICENSE-donor-MIT.txt`:
  - «Copyright (c) 2026 wuyi».
  - La atribución de la contribución: «Portions Copyright (c) 2026 kai cai (caikaidev / icaikai), contributed to wy51ai/floorplan-3d via PR #11».
- Mantener la cabecera de procedencia en `cabinet-core.js` (código derivado).
- No presentar la escultura como una implementación independiente.

## 5. Qué se publica y qué no

**Se publica en la PR del laboratorio:**
- los 3 ficheros literales (`workshop/`), verificados contra el manifiesto;
- el código derivado, con su atribución;
- pruebas, fixtures sintéticos, capturas y documentación.

**No se publica:** la instantánea completa (SOURCE EXACT). No hace falta para R03 y contiene el runtime entero del donante. `fetch-source-exact.sh` la reconstruye fuera del repositorio y verifica cada hash.

## 6. Límites

Este análisis no es un dictamen jurídico profesional. Si el propietario quiere más certeza antes de la cirugía de producción, puede pedir una confirmación de cortesía a caikaidev. No hace falta para el laboratorio. La PR no autoriza merge, Promote ni integración.
