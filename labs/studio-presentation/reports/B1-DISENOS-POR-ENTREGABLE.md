# B1 · Más diseños por entregable (v3)

Base: rama `lab/studio-presentation-e0e1` sobre `5b8ef74`. Datos: `snapshot/snapshot.json` (RUBIK `f31f303`), sin regenerar. Código: `tools/b1.cjs` (nuevo, llamado por `tools/compose.cjs` con sus mismos helpers: un solo camino de datos) y `system/rubik-editorial.css` (franja de cajetín). Salida: `out/v3/` (14 documentos, 67 páginas) y `out/v3/qa.json`. Evidencias: `evidence/v3/`.

Regenerar: `cd tools && npm i --no-save @fontsource/inter@5.1.1 @fontsource/newsreader@5.1.1 @fontsource/source-serif-4@5.1.1 && cd .. && CHROME=<chromium> node tools/compose.cjs snapshot out/v3` (IFC Sheet en `/home/user/donors/ifc-sheet`, Huashu en `/home/user/juanmaes83/huashu-design-3.0-agent-`). `STUDIO_B1=0` genera solo los documentos de v2.

## Lo nuevo

| Documento (`out/v3/`) | Págs. | Qué aporta | Referencias (reports/03 nota A, reports/05) |
|---|---|---|---|
| `interior-book-v3.pdf` | 14 | Índice; **pliego por estancia** (izquierda: recorte de planta a 1:50 o 1:75, superficie, pavimento, objetos numerados con su referencia del listado; derecha: vista 3D a sangre); «El resto de estancias» en pequeños múltiplos (las 9 sin vista 3D, declarado); cierre con datos del estudio y procedencia. Los pliegos empiezan en página par. | R36, R13, R46, R10 |
| `materials-furniture-book-v3.pdf` | 12 | **Portada con palabra gigante** (gramática de product-editorial-showcase: palabra como capa espacial + bloques de pavimento con altura ∝ superficie); **tablero de materiales por estancia**; **una ficha por línea del listado** (40), cuatro por página: medida, huella a escala, situación en la planta y cada desconocido escrito. | R19, R17, R20, R46 |
| `commercial-proposal-client-v3.pdf` | 2 | Resumen en una página con **gráfico de capítulos**; detalle con lo que ve el cliente. | R25, R30, R13 |
| `commercial-proposal-studio-v3.pdf` | 2 | La misma propuesta para el estudio: merma, origen del precio, estado de revisión, avisos y trazabilidad. | R06, R30 |
| `real-estate-sheet-v3.pdf` | 1 | **Ficha A4 vertical** de una página: vista, seis cifras con su origen debajo, planta, lo no disponible listado. | R04, R11 |
| `architecture-sheet-strip.pdf` | 1 | A3 con **cajetín en franja derecha** (IFC Sheet `titleBlock: 'right'`, 50 × 180 mm, mismos campos y plumas). Alzados y secciones declarados como no incluidos. | R22, R03 |
| `directions-b1.pdf`, `directions-b1-portrait.pdf` | 9 + 3 | **Puerta de 3 direcciones de Huashu** para cada tipo de página nuevo: pliego de estancia, ficha de objeto, portada de materiales y ficha inmobiliaria. El nombre de la dirección va en el pie. | — |

Elegidas para v3, **pendientes de aprobación** (`DECISIONES-PENDIENTES.md`): pliego B (el dibujo manda), ficha B (cuatro por página), portada A (palabra gigante), inmobiliaria A (la vista arriba).

## De dónde sale cada dato

| Elemento | Fuente en el snapshot | Cálculo del compositor |
|---|---|---|
| Recorte de planta, muros, huecos, huellas | `geometry.rooms/walls/openings/objects` | Escala y recorte; nada se redibuja a mano |
| Números del plano y referencias M-xx | `objects[i]` agrupados por estancia, nombre y medida (mismo criterio que el listado de v2) | Agrupación |
| Superficie, cómputo | `geometry.rooms[].areaM2/counted`, `surfaces.areaM2` | Ninguno |
| Pavimento y color | `rooms[].floorMaterialId` → `materials[]`, `board.floors[]` | Altura del bloque ∝ superficie |
| Vistas 3D | `views[]` (5; 4 de estancia) | Ninguno; pie «no es una fotografía» |
| Propuesta cliente y estudio | `budget.test.view.client` / `.professional`, generadas en el producto por `FloorPlanEconomicDossier.view(report,{variant})` | Suma de subtotales por capítulo y porcentaje sobre la base |
| Precios | `budget.test` (rotulados «Precios de prueba de laboratorio») | Ninguno |
| Estudio | `brand.profile` (sintético, dominio `.invalid`) | Ninguno |

Lo que el proyecto no tiene se escribe: «Sin referencia de producto», «Sin material asignado», «Altura no definida en el modelo», «Sin precio», «Sin vista 3D», «Alzados y secciones: no incluidos», «No disponibles en el proyecto: ubicación, precio de venta…».

## QA (`out/v3/qa.json`)

14 documentos, 67 páginas: 0 desbordes, 0 solapes de bloques, 0 solapes de texto, 0 contenidos que se salen de su caja, 0 textos SVG recortados, 0 solapes de etiquetas, 0 peticiones externas, 0 errores, lint Huashu **0 rojos**. 3 amarillos ya conocidos de v2 («Inter como mayor tipografía» en láminas y en la dirección C: el número de lámina es un dato y va en la cara de datos).

**El QA se ha ampliado en este bloque**, porque la primera revisión visual encontró defectos que no detectaba:
- *Solapes de texto*: cajas de línea de cada nodo de texto fuera de SVG; en cuerpos ≥ 48 px se compara el 70 % interior de la caja (falso positivo en tipos de exhibición, medido).
- *Contenido que se sale de su caja* (celda de rejilla, tarjeta) con `overflow: visible`.
- *Texto SVG recortado por su lienzo*. **Prueba negativa**: con el defecto del gráfico reintroducido, el control lo detecta («50 % de la base, 3 partidas»).
- Revelaron dos defectos heredados de v2 que también se corrigen: «Lámina» pisaba el número en el cajetín y la cifra de la portada C pisaba su pie.

Prueba a una tinta: `evidence/v3/b1-one-ink.png`. Legible; ningún estado depende del color (cada muestra lleva su nombre, cada estado está en palabras).

## Crítica

### Open Design · 5 dimensiones (0–10)
| Dimensión | Nota | Evidencia |
|---|---|---|
| Coherencia | 8 | Un solo registro: tokens RUBIK, serif para leer, Inter para datos, un acento por documento (arcilla cliente, petróleo estudio). Deriva: la portada de palabra gigante es más expresiva que el resto del libro. |
| Jerarquía | 7 | Pliegos claros (dibujo ↔ vista). En la ficha de objeto, la referencia M-xx y el nombre compiten poco con la tabla; la huella y la situación son pequeñas. |
| Detalle | 7 | QA a cero tras tres rondas. Quedan escalas distintas entre pliegos (Salón 1:75, dormitorios 1:50) y en los pequeños múltiplos (1:100 / 1:150), siempre declaradas. |
| Funcionalidad | 8 | Cada página responde a su lector: el cliente ve partida y precio; el estudio, origen y revisión; la ficha de obra, medida y situación. Nada inventado. |
| Innovación | 6 | La portada de materiales y el pliego con números en planta salen de la media; la ficha inmobiliaria y el resumen económico son correctos pero convencionales. |

### Impeccable (lo aplicable a impreso)
- **Veredicto «AI slop»:** no. Sin eyebrows, sin bandas laterales, sin cadenas «·», sin degradados; la composición sale de los datos (alturas ∝ superficie, barras ∝ importe, escalas reales).
- **Funciona:** el pliego estancia-vista; los números del plano enlazados al listado; las dos propuestas desde el mismo motor; la franja de cajetín.
- **P1 corregidos en este bloque:** pies que invadían la fila siguiente (pág. 12), cota de huella cortada, referencia «M-29» partida, texto del gráfico cortado, nota de precios repetida, «TV» en minúscula, página de vista sin número.
- **P2 abiertos:**
  1. La ficha de objeto se repite 40 veces con casi todo «sin…». Es honesto pero monótono. Propuesta para cuando haya productos: ficha completa solo con referencia; sin ella, la variante C (fila con situación) ocupa 5 páginas en lugar de 10.
  2. La lámina a 1:50 deja mucho blanco bajo la planta y el cuadro queda estrecho (unos 75 mm). A3 a 1:50 es la escala correcta; la mejora es un segundo dibujo (cuando exista motor de alzados).
  3. La ficha inmobiliaria redondea la reforma a euros enteros; correcto para el formato, pero distinto de la propuesta (céntimos).
- **Señales por lector:** *cliente*: ninguna. *Profesional*: echará en falta alzados y referencias de producto; ambos están declarados. *Inmobiliaria*: echará en falta ubicación y precio de venta; están listados como no disponibles.

## Pendiente para B2
Proyecto vacío o sin presupuesto, sin vistas y sin perfil de marca; nombres largos; logotipo sintético rotulado. Los nuevos controles de QA son los que deben saltar.
