# Integración y riesgos de convivencia — M2/S4 frente a master

**Código examinado:** `49e8feba2e3aad03a25fb602248758e39dbe3b3c` (rama `feat/ft3d-8-m2-s4-integracion-2026-11-06`)
**master contrastado:** `0cfe6a5f09ffddf35221dc0175e24b75b246bde0` (06/11/2026)
**Base común:** `0f9c6ead9732901681498efec326d1ca92e42ffe` (merge de la PR #159)

> El encargo citaba master en `8401894`. **master ya no está ahí**: avanzó a `0cfe6a5` (PR #174, «E2 Hybrid V2 Dibujo vivo + Section corregida», con un commit que dice haber registrado un lanzamiento en Production). `8401894` es antecesor de `0cfe6a5`. Todo el análisis se hizo contra `0cfe6a5`.

## Método (sin merges de ensayo en ramas)
- Solo lectura: `git diff`, `git log` y `git merge-base` sobre referencias remotas.
- Además se ejecutó **una** vez `git merge-tree --write-tree origin/master 49e8feb`. Es un cálculo en memoria: no crea rama, commit ni push, y no toca ninguna rama compartida. Lo declaro porque podría entenderse como una combinación de ensayo. Resultado: código de salida 0, **sin conflictos textuales**.
- No se hizo merge, rebase ni cherry-pick. No se creó ninguna PR. No se tocaron las ramas de Claude ni las de Kimi.

## Superficie de cambio desde la base común

| Lado | Archivos | Líneas |
|---|---|---|
| M2 (`49e8feb`) | 214 | +17 884 / −12 |
| master (`0cfe6a5`) | 70 | +6 439 / −33 |
| **Archivos tocados por ambos** | **1: `index.html`** | — |

Bloques de `index.html`:
- **M2** toca 2 bloques: el CSS (línea ~669, ocultar durante la salida de la presentación) y el final del archivo (~5009, carga de los módulos de construcción y el getter `View3D.renderBudget`).
- **master** toca 10 bloques entre las líneas 374 y 4926: CSS de la presentación, `FloorPlanApp`, `init()`, `enter()` y `abort3D()`, el bucle de render, `presentationRestore()` y `presentationRestorePose()` (+162 líneas).
- Los bloques **no se solapan**. El riesgo textual es bajo.

Lo que añade master y M2 no contiene:
- `js/presentation-living-drawing-core.js` y `js/presentation-living-drawing.js`, más cambios en `presentation-story-core.js` y `presentation-ui.js`;
- nueve tests nuevos o modificados de presentación (living drawing, visit, scenes-integration y story);
- el workflow `rubik-e2-hybrid-v2-gate.yml`;
- unos 49 documentos.

## Riesgos funcionales (no textuales)

| ID | Riesgo | Por qué | Severidad | Cómo cerrarlo (no ejecutado) |
|---|---|---|---|---|
| INT-R1 | Choque en el ciclo de vida de `View3D` | M2 suspende y reanuda la vista 3D (`setSuspended`) al abrir la Evolución en el overlay. master cambia `enter()`/`abort3D()`, el bucle `loop()` y la restauración de la presentación. Si se abre la Evolución con una presentación «Dibujo vivo» en curso, ninguno de los dos lados se ha probado contra el otro. | P1 (riesgo) | En una rama de integración aislada: abrir la Evolución durante el Dibujo vivo y durante la visita de la Section, volver, y comprobar que no hay doble `requestAnimationFrame` y que la pose se restaura. Ejecutar `presentation-living-drawing`, `presentation-visit-handover` y `m2-s4` sobre el resultado combinado. |
| INT-R2 | CSS `body.presentation-exiting` | M2 añade selectores a la misma regla que master amplía en la línea ~374. | P3 | Captura comparativa de la salida de la presentación tras combinar. |
| INT-R3 | CI | master añade el gate `rubik-e2-hybrid-v2-gate.yml` y M2 añade `ft3d-8-m2-s4.yml`. Ninguno ejecuta las suites del otro. | P2 | Ejecutar los dos workflows sobre el resultado combinado. |
| INT-R4 | Production | master registra un lanzamiento verificado en Production. M2 solo tiene Preview. Integrar M2 haría llegar la Evolución a Production. | P1 (proceso) | Es decisión del propietario: M2-GATE-09 y DEC-05/06/07 siguen abiertas. |
| INT-R5 | Kimi (FT8-S4-10) y Entregar | La entrega de M2 (MP4/HTML local) convive con «Entregar» de presentación/Kimi. No se ha examinado la rama de Kimi (fuera del alcance: no se pueden tocar ramas de otros agentes). | P2 | Revisión conjunta de rutas `Entregar` cuando el propietario lo autorice. |
| INT-R6 | PR #166 (acceso remoto de clientes) | No integrada y fuera del examen por instrucción expresa. La entrega de M2 es solo local. | — | Abierta. |

## Conclusión de integración
- Textualmente, M2 y master **conviven sin conflictos** (merge-tree limpio, un único archivo común y bloques disjuntos).
- Funcionalmente, **no está demostrado**. Las suites de master (Hybrid V2/Section) no se han ejecutado sobre un árbol combinado, porque eso exige una rama de integración que este examen tiene prohibido crear.
- La integración queda **pendiente** del propietario.
