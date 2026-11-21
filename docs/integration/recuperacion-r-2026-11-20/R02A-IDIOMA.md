# R02-A · panel «Techo y elementos altos» en ES / EN / ZH (20/11/2026)

> **Estado:** R02-A sigue **experimental**, GOV-05 abierto y el aviso de 2100 mm orientativo y sin bloqueo. Solo cambia el idioma visible.

## Identidad

| Qué | Valor |
|---|---|
| Rama | `claude/r02a-idioma`. HEAD y árbol: los verificados en remoto al publicar (§4.3) |
| Base | `claude/r02a-cache-planner-key@0dd5e0af` = #296 `fd87c8a5` + corrección de la clave de caché (auditoría) |

## Qué se localiza (mismo sistema de idioma que el resto de RUBIK)

Un `tx(es, en, zh)` local que lee el `LANG` global, la convención de los módulos (p. ej. `quantity-schedule-ui.js`, R03). **No hay un segundo sistema.** Sin `LANG` (Node), el texto es **español idéntico**, por eso las pruebas existentes no cambian.

| Archivo | Textos |
|---|---|
| `js/r02a-ceiling-editor.js` | Todo el panel: título, insignia, límites, referencia vertical, formulario, tipos, botones (comprobar, colocar, centro, alternativas, guardar, editar, quitar, nuevo), confirmación, resultado, alternativas, avisos flotantes (guardado, referencia, quitado, tras editar, al abrir, estancia eliminada), `aria-label` de la capa del plano y del cierre del aviso |
| `js/r02a-ceiling-session.js` | Nombres de tipo (`TYPE_LABEL`, misma forma exportada), razones, explicaciones de estado y cotas, holguras, alternativas |
| `js/r02a-ceiling-contract.js`, `js/r02a-ceiling-bridge.js` | Rechazos visibles y el aviso general (`NOTICE.text`, misma forma) |

**Nombres visibles.** Muebles y estancias pasan por la fuente única del producto (`FloorPlanDisplayName` si existe; si no, `nm`). En ES/EN no se muestran nombres chinos sin traducir. Los datos no cambian.

**Cambio de idioma con el panel abierto.** Los textos ya generados en el estado del panel (última comprobación, alternativas, aviso) se rehacen: la comprobación se recalcula con el núcleo (solo lectura), y alternativas y aviso transitorio se retiran.

**Sin cambios de comportamiento.** Operaciones, validaciones, guardado (con la confirmación expresa), deshacer y rehacer, geometría y el contrato `x-r02a-ceiling` son idénticos.

## Defectos encontrados y corregidos durante el corte

1. **Textos guardados en el estado del panel.** Tras cambiar a ZH, el aviso («Saved in the project…») y la explicación de la última comprobación seguían en inglés. Lo vio la captura, no la prueba inicial. Corregido como se describe arriba. Además, la prueba en ZH se endureció: ninguna palabra latina de 4 letras o más dentro del panel, salvo «RUBIK» y el dato que escribió la persona.
2. **Cadena vacía en `tx`.** `'' || es` caía al español («· de 整层…»). Ahora es `?? es` en los cuatro módulos.

## Pruebas (Chromium 1243 y Node 22.23, Linux)

| Prueba | Resultado |
|---|---|
| `tests/r02a-i18n.browser.test.cjs` (nueva, bloqueante) | **3/3**, dos ejecuciones seguidas |
| `r02a-editor`, `r02a-lab`, `r02a-passage-in-editor`, `r02a-r03-coexistence` | 5/5, 13/13, 6/6, 1/1 |
| Pruebas puras R02-A: `core`, `session`, `bridge`, `integration-contract`, `activation`, `passage-indicative`, `cache-signature` | 22/22, 12/12, 6/6, 7/7, 3/3, 13/13, 3/3, **sin cambios en ninguna aserción** |
| Suite pura | 1527/1529, 0 fallos, 2 omitidas |
| Cobertura de navegador | 0 archivos sin cubrir |

Qué cubre `r02a-i18n.browser`:
- **Escritorio 1440×900 y móvil 390×844 táctil.**
- **EN:** recorre todo el texto del panel y de su aviso, y cada `aria-label`, `title` y `placeholder`, tras ejercitar referencia, comprobación con el **teclado** (foco en «Check» y Enter), guardado con confirmación, borrador bloqueado con alternativas y bloque orientativo. **Ningún texto en español y ningún nombre chino.**
- **Guardado y deshacer intactos:** el elemento se guarda por el camino normal; deshacer y rehacer, un paso.
- **Cambio de idioma con el panel abierto:** EN → ES (título en español, sin chino) → ZH (panel en chino, sin ES/EN).
- **Teclado, foco y proyecto:** el resumen se abre con Enter y conserva el foco; el campo «Applies to» tiene nombre accesible en inglés; abrir **otro proyecto** conserva el idioma y no muestra ni español ni chino.

**Discrimina:** con una sola cadena sin traducir («Comprobar» en EN) la prueba falla.

**Evidencia:** `docs/qa/artifacts/r02a-idioma/` (EN y ZH, escritorio y móvil), revisada a mano.

## Límites

- **Fuera del panel**, la aplicación conserva textos en español en EN/ZH («Diseñar», «Presentar mi vivienda»…). Es preexistente y queda fuera de este alcance.
- **Selección de la estancia.** En la prueba se hace con la función de la app (`select`), como en R03, porque el toque en el plano depende de la geometría de pantalla. Las interacciones del panel sí se hacen con clic, toque y teclado.
- **Fallo no reproducido.** Un fallo transitorio de escritorio (el resultado tardó en aparecer) se observó una vez y no se reprodujo en dos ejecuciones completas.
- Firefox, WebKit y Windows quedan para Codex.
