# UX-07 · Adaptador mínimo Variantes → comparador antes/después (preparado, sin conectar)

**Fecha:** 13-11-2026 · **Rama:** `lab/ux07-variants-adapter-20261113` · **Apilada sobre:** #212 `lab/ux07-ent04-budget-coherence-20261112`, que no se modifica · **Catálogo:** UX-07 (sin IDs nuevos).

**Objetivo:** preparar la conexión del comparador al producto **sin tocar** `index.html`, la persistencia canónica ni la publicación al cliente, y dejar la cirugía documentada para la auditoría de ChatGPT.

## Qué hay

| Pieza | Qué hace |
|---|---|
| `js/variants-compare-adapter.js` (`FloorPlanVariantsCompare`, puro) | Usa lo mismo que ya tiene el diálogo «Variantes» (`library.group(activeId)`, el proyecto abierto y `rubik-budget-v1`):<br>**`pairs()`:** original frente a cada variante, la abierta primero.<br>**`prepare()`:** comparación con `FloorPlanRevisionCompare`, relación `library-variant`, que es la del enlace local y nunca se declara otra; presupuestos de cada proyecto con `FloorPlanRevisionBudget`; avisos de la distribución abierta (se compara lo que se ve) y de la planta del edificio.<br>**`handoff()`:** parámetros de URL para abrir el comparador con esas dos entradas. |
| `labs/ux07-ent04/lab.js` | Acepta `?src=library&before=<entrada>&after=<entrada>`: elige esas entradas de la biblioteca de este navegador (**solo lectura**) y compara. Si no existen, lo dice y no muestra nada. |

**No es un sistema paralelo de variantes:** no crea, guarda ni borra variantes; solo lee el grupo que la biblioteca ya define.

## Pruebas

| Suite | Resultado |
|---|---|
| `tests/ux07-variants-adapter.test.cjs` (6), con la **biblioteca real**: variante creada con `library.variant` y reformada con `library.save`, como en el editor | 6/6 |
| `tests/ux07-variants-handoff.browser.test.cjs` (3): escritorio, móvil y entradas inexistentes; presupuestos guardados (comparación completa) y biblioteca sin ninguna escritura | 3/3 |

**Casos cubiertos:**
- 7 cambios reales con relación de variante;
- distribución abierta (lo que se ve gana a la copia guardada);
- presupuestos de los dos, de uno solo, o de otro proyecto (rechazado);
- fuera del grupo, la misma entrada o sin grupo;
- no muta nada ni escribe en la biblioteca.

## Cirugía propuesta en `index.html` (NO aplicada; archivo reservado)

En `renderVariants()` (~L2450), dentro del bucle de tarjetas, para cada variante (`g.variantOf`), añadir un botón junto a «Abrir» y «Eliminar variante»:

```js
// «Comparar con el original»: abre el comparador con esta variante frente a su original (solo lectura).
const cmp=document.createElement('button');cmp.className='btn';cmp.dataset.action='compare';cmp.textContent='Comparar con el original';
cmp.onclick=()=>{library.save(project); // lo que se ve, ya guardado como hace el editor
  window.open(COMPARE_URL+'?'+FloorPlanVariantsCompare.handoff({beforeId:group[0].id,afterId:g.id}),'_blank','noopener');};
actions.append(cmp);
```

Más:
- cargar `js/revision-compare-core.js`, `js/revision-budget-core.js`, `js/before-after-dossier-core.js` y `js/variants-compare-adapter.js`;
- definir `COMPARE_URL`.

**Decisión de ChatGPT:** el comparador vive hoy en `labs/`, que `.vercelignore` **no publica**. Para el producto hace falta una de dos cosas:
- **(a)** publicar el comparador en una ruta de producto, por ejemplo `comparar/`;
- **(b)** montar su vista en un diálogo del editor.

Esta rama no decide eso, ni la publicación del dossier al cliente (ENT-01/GOV-08).

## Límites

- Edificios: se compara la planta del mismo orden en cada distribución, como en `library.group`, y se avisa. La comparación del edificio completo no está cubierta.
- Las variantes tienen otro identificador de proyecto: un presupuesto guardado solo vale para su propio proyecto, y el de otro se rechaza.
- Pruebas en Chromium de Playwright; no en un dispositivo físico.
