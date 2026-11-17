# ADR 06 · Motor de PDF y paginación de los entregables

Estado: **propuesta aceptada en el laboratorio** (E1). Fecha: 17/11/2026. Bloque B3 de `PROMPT-CONTINUACION.md`.

## Contexto

Los entregables se componen como páginas HTML de tamaño fijo (A4 apaisado, A4 vertical, A3) y se imprimen con Chromium. B2 dejó un límite abierto: si una tabla no cabía, el compositor aplicaba reglas fijas (20 o 9 líneas por página). Esas reglas no se adaptan a los datos. Con un presupuesto largo, el detalle se salía de la página y solo el QA lo detectaba.

La pregunta de B3: ¿qué motor da una paginación automática, sin perder ni duplicar contenido, sin red y sin coste?

## Candidatos y método

| Motor | Versión | Cómo se ejecuta |
|---|---|---|
| CSS Print | Chromium de Playwright (local) | `page.pdf()` sobre HTML que fluye: `thead` repetido, `@page` con contador «Página n de N». |
| Paged.js | 0.4.3 (polyfill) | El mismo HTML, paginado por Paged.js dentro de Chromium. |
| Typst | typst.ts 0.7.0, compilador WASM | Plantilla Typst; fuentes Inter de IFC Sheet cargadas en memoria. Sin red. |

Se evitó typst.ts 0.8.0-rc4 por demasiado reciente. La 0.7.0 es del 1/6/2026.

Banco de pruebas: `tools/engines/bench.mjs`. Una misma tabla de presupuesto con 1, 50, 200 y 500 filas, con y sin una fila extrema. A 50 filas se añade además una fila **más alta que una página**.

- La fila extrema lleva 14 repeticiones de texto más una palabra de 180 caracteres sin espacios.
- La fila más alta que una página lleva 90 repeticiones.
- Las filas son **datos sintéticos de prueba** derivados de las descripciones del presupuesto canónico, rotulados «PRUEBA n»; no son un presupuesto.

Se mide con `pdfinfo`, `pdftotext` y `pdffonts`:

- páginas;
- cabecera repetida en cada página;
- filas encontradas frente a las esperadas;
- texto completo de la fila extrema (marca `FIN-EXTREMA`);
- «Página i de N» correcto;
- fuentes incrustadas;
- peticiones externas;
- tiempo.

Resultado completo en `out/v3/b3/bench.json`.

## Resultados

| Motor | 500 filas: páginas, ms | Cabecera en todas | Filas sin perder | Fila más alta que una página | Fuentes | Red |
|---|---|---|---|---|---|---|
| CSS Print | 14 págs., 377 ms | **Sí** (14/14) | **Sí** (500/500, 501/501) | **Completa**: 90 de 90 repeticiones en 5 páginas. Deja un hueco en la primera página porque la fila no se parte. | Incrustadas | 0 |
| Paged.js 0.4.3 | 14 págs., 721 ms | **No**: solo en la 1.ª página (1/14) | Sí en tablas normales | **Pierde texto**: 87 de 90 repeticiones. Las cifras de la fila quedan desalineadas en la página siguiente. | Incrustadas | 0 |
| Typst 0.7.0 (WASM) | 10 págs., 592 ms | **Sí** (10/10) | **Sí** | **Completa**: 90 de 90 repeticiones, sin hueco | Incrustadas | 0 |

Evidencias:

- `evidence/b3/fila-mas-alta-que-una-pagina.png`: filas de CSS Print, Paged.js y Typst;
- los tres PDF `out/v3/b3/*-50xx.pdf`.

**Hallazgo del propio banco (primera ronda, `out/v3/b3/bench-naive-css.json`).** El CSS ingenuo partía cualquier celda (`overflow-wrap: anywhere` en todas). Con la fila extrema, la columna «Ref.» se estrechaba hasta partir «F-0001» en tres líneas: 32 páginas en lugar de 15, y 0 referencias legibles.

La corrección: partir solo la columna de descripción y no partir nunca la referencia. Se incorpora como regla del sistema.

## Decisión

1. **El motor de los entregables sigue siendo CSS Print (Chromium).**
   - Es el mismo navegador del producto.
   - Las páginas de diseño fijo (pliegos, portadas, láminas) no cambian.
   - Es el único que conserva el CSS editorial completo: rejilla, SVG de planta y axonometría, tipografía incrustada.
2. **Paginación medida en el navegador** (`tools/flow.js`) para toda tabla larga. Las tablas marcadas `table.flow` son:
   - el listado de mobiliario;
   - el detalle del presupuesto (estudio y cliente);
   - la propuesta económica.

   Se ejecuta en el mismo Chromium antes de imprimir:
   - mide dónde deja de caber la página (el pie);
   - pasa las últimas filas a una copia de la página;
   - repite hasta que nada se sale;
   - nunca deja un título de capítulo solo al final;
   - repite en la continuación el valor de la columna agrupada (la estancia);
   - renumera «i / N» y escribe «Parte k de n»;
   - muestra la introducción solo en la primera parte y la nota final solo en la última.

   El HTML guardado es el ya paginado, así que la web y el PDF son idénticos.
3. **Invariante en el QA.** Cada fila de cuerpo existe **exactamente una vez y en su orden**: se compara la secuencia de filas antes y después. `qa.json` guarda `flow.ok`, las páginas añadidas y las filas que no caben ni solas (`unsplittable`). Las tres cosas se revisan en cada ejecución.
4. **Paged.js, descartado.** Pierde texto al partir una fila que no cabe en una página y no repite la cabecera de la tabla. No cumple «sin pérdidas».
5. **Typst, reservado para E2** como motor de servidor: documentos largos solo de datos (anexos de mediciones, actas). Es el más compacto, el más rápido y parte filas largas sin hueco.
   - No sustituye a CSS Print porque exigiría mantener una segunda plantilla por documento, en otro lenguaje.
   - Las pruebas de E2 deben usar las mismas fuentes y el mismo invariante de filas.

## Resultado sobre los entregables

| Ejecución | Tablas paginadas | Páginas añadidas | Invariante | QA |
|---|---|---|---|---|
| canónico `out/v3` | 4 | 1 (listado de mobiliario, 23 + 17 líneas) | OK | 0 problemas |
| `long-budget` (nueva variante de B2: 97 filas de detalle, partidas ×8 rotuladas PRUEBA) | 4 | 4 por propuesta (5 partes) | OK | 0 problemas, tras corregir una etiqueta del gráfico de capítulos que se salía del lienzo con 24 partidas |
| `long-names`, `logo`, `no-budget-views-brand`, `empty` | 0–1 | 0–3 | OK | 0 problemas |

Evidencias:

- `evidence/b3/presupuesto-largo-paginado.png`;
- `evidence/b3/listado-mobiliario-paginado.png`.

**Cambio visible en el canónico.** El listado de mobiliario reparte ahora 23 + 17 líneas (llena la página) en lugar de 20 + 20. Desaparecen los umbrales fijos de 20 o 9 líneas por página.

## Límites

- **Fila más alta que una página.** Una fila de tabla no se parte; si una sola fila no cabe en una página, se cuenta como `unsplittable` y el QA la señala. Con los datos actuales no ocurre. En E2 la solución es Typst o partir la celda en el modelo de datos.
- **Rejillas de tarjetas.** Las fichas de mobiliario y los pequeños múltiplos se siguen paginando por número fijo (4/2 y 9/3). Son tarjetas de alto fijo, no filas: el número fijo es exacto.
- **Cada tabla larga necesita su clase.** La medición solo actúa sobre tablas marcadas `flow`. Una tabla nueva sin la clase vuelve a depender del QA de desbordes.
