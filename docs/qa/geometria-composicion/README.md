# Composición Geometría · master `dacb5d39` + A0 `7d07c34e` + Muros `b35a6cc3`

Rama `claude/geometria-composicion`. Fusión en `668dcd86`; correcciones de composición en el commit que acompaña a este documento.

## 1 · `--professional-nav-bottom converge` (Firefox y WebKit, también Chromium en local)

| Base | Resultado de la misma prueba | Lectura |
|---|---|---|
| A0 aislado `7d07c34e` | 15/15 | La barra de áreas siempre se dibuja: su borde y el valor publicado coinciden |
| master `dacb5d39` (prueba trasladada, regla de ancla de master) | Convergencia T04: pasa. Fallan R1-T02/T02b (master no tiene `schema-epoch.js`, es decir, no tiene A0) y la sonda de escrituras (master escribe dentro de la entrega del ResizeObserver: es el defecto que A0 corrige) | El contrato de master se cumple |
| composición `668dcd86` | 12 fallos en CI (Firefox/WebKit × escritorio/móvil): `expected '0px', actual '161px'` | Ver causa |

**Causa.** En PERLA (master) la barra de áreas va integrada en la cabecera y no tiene caja; `position()` ancla el área bajo la
**cabecera** y publica su borde (161 px). La prueba heredada de A0 comparaba con `nav.getBoundingClientRect().bottom`, que es 0
cuando el elemento no se dibuja. El producto no estaba mal: la referencia de la prueba no conocía el ancla de master.
**Corrección (solo prueba, sin tolerancia):** se compara con el borde real del ancla según la regla de master (barra si se
dibuja; si no, cabecera), al píxel, y además se exige que el área de trabajo (`section.style.top`) quede en ese mismo borde.
La sonda de escrituras dentro de la entrega del ResizeObserver se conserva íntegra.

**Conflicto revisado para este contrato:** `js/professional-workspace-ui.js` se resolvió con el ancla PERLA de master y la
programación por fotograma de A0; es la combinación correcta (ni se escribe dentro de la entrega ni cambia el ancla).

## 2 · Asa de curvatura bajo `#fab` (S5b, 3 fallos en la composición)

**Causa.** PERLA sube la barra con `body.perla #stage>#fab{bottom:72px}`, más específica que `#fab.fab-flip{bottom:auto}`. Al
apartarse, la barra quedaba con `top:16px` y `bottom:72px` a la vez y se estiraba a toda la altura del lienzo, tapando el asa.
**Corrección (producto):** `fabAvoid()` mide las dos posiciones reales que da la hoja de estilos (no supone desplazamientos de
16 px) y `css/perla-editor.css` añade la variante apartada para PERLA (`top:16px;bottom:auto`). En el teléfono horizontal la
barra ya va fija arriba (`!important`): ambas posiciones miden igual y no se aparta (límite registrado).

## Resultados locales en el commit de corrección

| Suite | Chromium | Firefox | WebKit |
|---|---|---|---|
| `a0-browser-residuals` | 15/15 | CI | CI |
| `op07-s5b-edit-ui` | 8/8 | 8/8 | 8/8 |
| OP-07 núcleo (14 archivos) | 86/86 | — | — |
| S5, S7, S9, S8, S8b, S4-3d, «Desplazar muro», sin chino, retorno PERLA, writer fence | todas en verde | — | — |

CI cruzada: workflow `a0-cross-browser.yml` (A0 + writer fence en 12 trabajos; Muros S5b en los 6 de escritorio).

## §7.1 del encargo (`c14bd07a`) · Muros: edición descubrible desde Diseñar

**APROBADO por el propietario (revisión humana 26/11/2026)** en la Preview aislada `cf91b655` con OP-07 activo: la interacción
Recto/Curvo, el asa y Enderezar (implementación `8537ccca`, rama `claude/muros-forma-descubrible`). La integración y sus
comprobaciones siguen su proceso normal (no implica PR, fusión ni activación).

**Defecto aparte, corregido sin tocar el control aprobado:** tras curvar un muro exterior, la cota vertical izquierda mostraba
«3699.0858725761773» y se solapaba. Ahora el texto de las cotas se redondea a mm enteros; la cota se dibuja con el valor exacto
y la geometría no cambia. Prueba bloqueante `tests/op07-s11-cotas-muro-curvo.browser.test.cjs` (1440×900 y 390×844): sin la
corrección falla con ese mismo texto; con ella pasa 2/2.

**Decisión del propietario:** se aprueba el rediseño de interacción de Muros. La composición `a5beb0ab` pasó la CI cruzada,
pero la Preview revisada lleva OP-07 en estado *integrated*. La prueba de edición necesita una Preview aislada con
activación autorizada y un proyecto de ejemplo seguro de modificar.

**Siguiente corte (pendiente; no empezado en esta rama):**
- Al seleccionar un muro, **Forma del muro** con las opciones visuales **Recto / Curvo**.
- Curvo: asa central, aviso «Arrastra para curvar» y previsualización.
- **Enderezar**.
- Milímetros como ajuste secundario.
- Reutilizar el flujo de edición, validación y guardado de OP-07.
- Barra de selección libre del asa, también en móvil. Ya resuelto con PERLA en `a5beb0ab`.

**Recorrido de aceptación:** dibujar un muro recto en el plano de ejemplo, curvarlo, verlo en 3D, enderezar, deshacer y
rehacer, guardar y reabrir.

**URL de prueba humana con SHA y estado de activación:** requiere el despliegue de Preview del propietario o de Codex.
Desde esta sesión no hay autorización para desplegar.
