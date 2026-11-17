# B2 · Pruebas de robustez

Objetivo: que el compositor no se rompa, no oculte datos y no invente nada cuando el proyecto llega incompleto o con datos incómodos.

## Método

`tools/variants.cjs snapshot <dir>` genera cuatro variantes del snapshot canónico, cada una con **un** tipo de estrés. Solo se quitan datos, se alargan nombres o se añade un logotipo sintético rotulado; nunca se añaden cifras.

| Variante | Qué cambia |
|---|---|
| `empty` | Sin geometría, objetos, materiales, vistas, presupuesto ni perfil de estudio. Superficie desconocida. |
| `no-budget-views-brand` | Geometría real; sin presupuesto, sin vistas 3D y sin perfil de estudio. |
| `long-names` | Título de 104 caracteres; estudio, profesional, estancias, objetos y materiales con nombres de 60 a 120 caracteres. |
| `logo` | Logotipo SVG sintético («LOGOTIPO DE PRUEBA», `label` que lo declara de laboratorio). |

Regenerar: `node tools/variants.cjs snapshot <dir> && node tools/compose.cjs <dir>/<variante> <salida>`. En la rama se guardan los `qa.json` (`out/v3/b2/<variante>/`) y las capturas (`evidence/v3/b2-*.png`); los PDF se regeneran en segundos.

## Resultado inicial (antes de corregir)

| Variante | Resultado |
|---|---|
| `empty` | **Rompe**: `Cannot read properties of undefined (reading 'bg')` (faltan vistas). |
| `no-budget-views-brand` | **Rompe**: el mismo error. |
| `long-names` | **Se detiene a propósito**: 10 estancias se quedarían sin rótulo (`plan: room tags dropped 10`). |
| `logo` | Genera, pero **el logotipo no aparece** en ninguna página (siempre «Logotipo: no facilitado»). |

Al revisar el código, además, salieron **suposiciones ocultas que inventaban datos** en casos límite:

- La cifra «Salón» buscaba una estancia con ese nombre exacto. Si no existía, imprimía **«0,00 m²»**.
- Los pies de las vistas usaban `||0`, que imprimía **0 m²** si faltaba la superficie.
- La superficie desconocida pasaba por `num(null)`, que imprimía **«0,00»**.
- La página de pavimentos afirmaba siempre «Incluye los miradores, que no computan…», aunque el proyecto no tuviera miradores.
- El libro decía siempre que faltaban «referencias de fabricante, acabados de pared…», sin comprobarlo.
- La planta de «El proyecto» (v3) y todas las axonometrías **omitían en silencio** los rótulos que no cabían. En el canónico eran los dos miradores en planta y 6 estancias pequeñas en la axonometría de portada. El QA no lo contaba.

## Correcciones (en `tools/compose.cjs`, `tools/b1.cjs` y `system/rubik-editorial.css`)

- **Valores ausentes escritos como ausentes:**
  - estudio «Estudio no facilitado»;
  - descripción «El profesional no ha escrito la descripción del proyecto»;
  - superficie «—»;
  - recuentos «—» si no hay estancias;
  - «Perfil de estudio no facilitado».
- **Sin geometría:** la planta y la axonometría se sustituyen por un recuadro que lo dice. La escala de las láminas pasa a «—».
- **Sin vistas:** la portada con imagen pasa a la portada de dibujo. Las páginas de vistas se sustituyen por «El proyecto no tiene vistas 3D generadas». La ficha inmobiliaria pasa a la dirección B (el dibujo arriba).
- **Sin presupuesto:** cada documento económico se reduce a una página que lo dice; las cifras de reforma muestran «—». Nunca aparece un importe.
- **Estancia mayor calculada** desde las superficies (nombre e importe reales), no buscada por su nombre.
- **Estancias numeradas en lugar de rótulos perdidos:**
  - una estancia cuyo nombre no cabe, o que supera 28 caracteres, lleva su número de orden en el proyecto;
  - el número se lista bajo el dibujo o en el cuadro de superficies;
  - el número es el mismo en planta, axonometría y lámina;
  - en la axonometría, el número se coloca donde no toca ninguna etiqueta.
- **Nombres largos:**
  - el título de portada baja de tamaño (30 → 22 → 18 pt);
  - el pie corrido corta con puntos suspensivos (el nombre completo está en portada);
  - el cuadro de superficies pasa a su propia página cuando no cabe;
  - las láminas A3 llevan un cuadro compacto (n.º, m², computa) y una **página anexa** con el cuadro completo;
  - el listado de mobiliario pasa a 9 líneas por página;
  - el tablero por estancia se pagina de 6 en 6;
  - los pequeños múltiplos se paginan de 3 en 3;
  - las fichas de mobiliario se ponen de 2 en 2.
- **Logotipo**, mostrado tal como lo da el estudio (`object-fit: contain`, sin filtro ni recolor), en:
  - las portadas;
  - el bloque de estudio;
  - el cierre;
  - el cajetín A3;
  - la franja de cajetín.
- **Direcciones B1:** solo se generan con el snapshot canónico (son una decisión de diseño, no un entregable).
- **QA:** el control de solapes de texto recorta cada caja por sus contenedores `overflow: hidden` (el texto cortado con puntos suspensivos ya no da falsos positivos).

## Resultado final

| Ejecución | Documentos | Páginas | Problemas QA |
|---|---|---|---|
| `empty` | 12 | 31 | 0 |
| `no-budget-views-brand` | 12 | 43 | 0 |
| `long-names` | 12 | 76 | 0 |
| `logo` | 12 | 55 | 0 |
| canónico (`out/v3`) | 14 | 67 | 0 |

«Problemas QA» = desbordes, solapes de bloques, solapes de texto, contenido fuera de su caja, texto SVG recortado, solapes de etiquetas, peticiones externas, errores y rojos del lint de Huashu.

**Cambio visible en el canónico respecto a B1:** la axonometría de portada numera ahora 6 estancias pequeñas (antes no llevaban rótulo, sin avisar) y lo indica en el pie. La planta de «El proyecto» numera los dos miradores y los lista. Evidencia: `evidence/v3/b2-canonical-cover.png`.

## Límites que quedan (para B3)

- Las páginas son de **tamaño fijo**: si un contenido no cabe, el compositor aplica una regla (bajar un tamaño, paginar, anexo), pero no puede **refluir** texto automáticamente a la página siguiente. Con datos todavía más extremos habría que añadir reglas. Un motor con paginación (Paged.js o Typst) resolvería esto de forma general: es la pregunta de B3.
- La ficha inmobiliaria en dirección B (sin vistas) no lleva el bloque de contacto ni la lista de datos no disponibles de la dirección A.
- Los umbrales (28 caracteres por rótulo, 34 por estancia, 75 por línea de listado) son empíricos con estas fuentes y tamaños.
