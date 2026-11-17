# 14 · Auditoría de los documentos v1.4

Auditados:

- `RUBIK-SOTA-PROMPT-CLAUDE-DELTA-DOCUMENTAL-v1.4.md` (el mandato);
- `RUBIK-SOTA-ANEXO-ENTREGABLES-PROFESIONALES-v1.4.md` (el anexo, 193 líneas).

Contraste con el código de la rama `lab/studio-presentation-e0e1` (HEAD `4d94931` en el momento de la auditoría) y con `master@8525025`, consultado de nuevo. Fecha: 17/11/2026.

## 1. Veredicto

Los dos documentos son coherentes con v1.2 y v1.3. Su perímetro está bien acotado:

- solo laboratorio;
- E2–E7 solo diseño;
- cero IA de pago;
- sin tocar a Codex ni Production.

Son ejecutables casi enteros con los datos disponibles.

Cumplo su condición previa: **no empiezo el delta hasta cerrar v1.3**. Quedan:

- el QA del consumidor (en curso);
- los paquetes;
- las dos reconstrucciones;
- el registro vivo y los informes.

Hay **5 discrepancias de hecho** (§2) y **6 ambigüedades** que fijo con una interpretación explícita (§3). Ninguna bloquea, pero tres cambian el alcance real de N02, N04 y N06.

## 2. Discrepancias con el estado real (verificadas)

| # | Afirmación del documento | Estado real | Cómo lo trato |
|---|---|---|---|
| V1 | Anexo §3: «La lámina comparativa **ya existente**» es variante del Architecture Book. | No existe ninguna lámina comparativa, ni en el laboratorio ni en `master@8525025` (búsqueda de «comparativ» en `js/` y `comparar/`: 0 resultados). Existen la lámina A3 `architecture-sheet` y su variante con franja `architecture-sheet-strip`. | La variante del tipo es la lámina A3 actual. Una lámina comparativa necesita dos revisiones comparables, y el snapshot tiene una: queda como **F/C ligada a RP14 y ENT-04**, sin maqueta. |
| V2 | Anexo §1.2 y mandato §1: laboratorio `b967d448` como fotografía; inglés, QA y reconstrucción «subordinados al cierre v1.3». | Desde `b967d44` hay 6 commits: inglés implementado y con gate, ficha de Render IA, perfiles de marca, QA del consumidor y reparación de la vista previa en `file://`. | Uso el HEAD vigente como baseline (lo pide el propio mandato: «reconsulta HEAD»). Los resultados antiguos no se reutilizan sin reejecutar. |
| V3 | N02 y RP09: hojas «A-01…A-08». | El Architecture Book usa códigos **AB-01…AB-11** (11 láminas). Los dos esquemas chocan: «A-01» del anexo es una *categoría* de hoja (planta y superficies); «AB-01» es una *hoja* emitida. | Tabla de correspondencia A-0x → AB-xx con elegibilidad por hoja. No renombro AB-xx, porque son códigos estables ya emitidos. |
| V4 | N04: reutilizar `revision-budget-core` y los estados complete/partial/incoherent/one-sided/none. | El núcleo vive en el producto: lo carga `comparar/index.html` (H06). El laboratorio compone desde un snapshot con **un solo** presupuesto completo. | Para ejercitar los cinco estados hace falta el núcleo y fixtures. Cargarlo desde un worktree del producto rompe la reconstrucción autónoma (ST09). Opción elegida: copiarlo a `vendor/` con su huella y procedencia (mismo repositorio y licencia) y usarlo solo en pruebas. Si eso no se acepta: NO_VERIFICADO con motivo. |
| V5 | Mandato §3.A.3: donante Skills for Architects al pin `a9c4355a`; en E0 se usó `f11144680c93`. | El pin nuevo no está clonado en el entorno. | Leo las diez SKILL.md en el pin nuevo (lectura estática, sin instalar) y registro el delta con el pin anterior. Si la red no lo permite: BLOCKED con el error exacto. |

## 3. Ambigüedades y la interpretación que aplico

1. **Recetas L sin datos mínimos.** RP01 (honorarios), RP04 (precio del inmueble, impuestos de compra), RP06 (referencias de moodboard) y RP08 (oferta) son L, pero el snapshot no tiene esos datos. Con datos aportados como **fixture rotulada**, la salida es real. Sin ellos, la receta queda **L parcial** y nombra lo que falta; nunca se rellena con ceros ni se deriva del coste de obra.
2. **«Cada L elegible produce el artefacto final real».** Son 12 recetas L (RP01–RP12), y muchas comparten la misma selección de bytes que una modalidad. Cumplo el anexo §10.3 así: una selección real por receta, verificada, y **referencia a la misma salida** cuando los bytes coinciden, con la prueba de correspondencia individual. No genero 21 PDF duplicados.
3. **C frente a F.**
   - C (RP13, RP14, RP15, RP17, RP21): evaluación de elegibilidad sobre datos reales y el rechazo con requisitos ausentes.
   - F (RP16, RP18, RP19, RP20): contrato y prueba de indisponibilidad.

   Ninguna tiene descarga de cliente.
4. **Módulo 03 «Estado actual».** El catálogo lo declara ausente porque no hay revisión anterior. RP02 y RP04 lo piden: quedan como **L parcial** con el módulo 03 marcado «sin fuente».
5. **Seis perfiles y tres fases frente a cinco perfiles Story.** Son ejes distintos. Los cinco Story están verificados en `js/presentation-templates-core.js` de master: `real-estate`, `developer`, `architecture`, `renovation` e `interior-design`. Los seis perfiles (AR, AT, IN, RE, CO, IM) son un filtro de recetas: solo recomiendan, no restringen ni mutan datos.
6. **«Emitido».** En esta misión ninguna pieza pasa de «candidato verificado de laboratorio». Cualquier estado «emitido», «aceptado» o «firmado» que aparezca en pruebas es sintético y lo dice.

## 4. Riesgos que el mandato no menciona

- **Inglés y recetas:** cada receta suma textos de interfaz y de documento. El gate de inglés bloquea la publicación en inglés si falta una sola frase. Es correcto (no se mezclan idiomas), pero cada texto nuevo necesita su entrada en `i18n/`.
- **Coste de QA:** 21 recetas × 2 idiomas × 5 vistas ≈ 210 aperturas. Es asumible (el QA del consumidor de las 7 modalidades tarda unos 15 minutos), pero conviene agrupar por selección idéntica.
- **Producto en `file://`:** el defecto que encontré hoy en la vista previa (origen opaco) pasó desapercibido al endurecer el canal. Cualquier pieza nueva con `postMessage` debe probarse con un emisor ajeno **y** con el emisor legítimo.
- **Inventario FF&E (N03):** el snapshot tiene 46 objetos y 40 líneas, sin SKU, marca ni precio. Las pruebas de «duplicado de SKU con distinto acabado», «producto sin vínculo» o «precio faltante» solo existen como fixture rotulada. El libro real seguirá mostrando «sin referencia» en todo.

## 5. Plan de ejecución (tras cerrar v1.3)

| Orden | Bloque | Base existente que se reutiliza |
|---|---|---|
| 1 | Baseline v1.3 congelada: SHA, snapshot, selecciones, manifiestos, QA | `dist/`, `evidence/consumidor`, registro vivo |
| 2 | N01 catálogo RP01–RP21 + selector en «Preparar entrega» + exportador | `catalogo-entrega.cjs`, `exportar.cjs`, `preparar.cjs`, grafo |
| 3 | N05 estados (borrador → preparado → verificado; emitido solo sintético) | Selección ligada a la huella, verificador, recibo |
| 4 | N02 tabla A-01…A-08 → AB-xx con elegibilidad, cajetín y referencias cruzadas | `architecture-book.cjs`, derivados FT3D-3/4 |
| 5 | N03 FF&E: oráculo de instancias, códigos estables, no doble conteo, fixtures negativas | `b1.cjs` (fichas y keyplans) |
| 6 | N04 bloques económicos y 5 estados con el núcleo canónico (V4) | `commercial-proposal-*`, `flow.js`, QA celda a celda |
| 7 | N06 elegibilidad y conciliación informativa (RP13–RP21) | Diagnóstico A25/A26 |
| 8 | N07 gramática visual (paleta con origen, callouts con referencia) | Sistema editorial, D1–D5 |
| 9 | N08 mapa receta → módulo → fuente → pieza → gate, con huellas | Registro, `package.sh` |
| 10 | RP-Q01–RP-Q12, paquetes, 2 reconstrucciones, registro y cierre | Suites v1.3 |
