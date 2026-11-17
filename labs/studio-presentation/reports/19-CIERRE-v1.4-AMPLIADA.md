# 19 · Cierre de la v1.4 ampliada: registro F01–F16, dossier de mejoras y hoja de aceptación humana

Rama `lab/studio-presentation-e0e1`. Base de producto en solo lectura: `master@8525025`. Los registros anteriores siguen vigentes y no se reescriben:

- H01–H08, A01–A29, D01–D18 y ST01–ST09: informes 12 y 13.
- V13-01–09, CONT-01–03, N01–N08 y RP-Q01–12: informe 15.

Este informe solo añade lo nuevo.

## Registro F01–F16 (esta auditoría)

| ID | Hallazgo | Cambio | Prueba / evidencia | Estado |
|---|---|---|---|---|
| F01 | RP01 no representaba alcance, servicios, honorarios, exclusiones ni validez | Bloque RP01 en la propuesta (ES/EN) | `bloques-qa` B-01/B-03; `auditoria-completitud.json` | Listo para revisión humana |
| F02 | RP04 sin compra ni impuestos | Bloque «Compra y reforma» por autoridad, sin sumar | B-07; auditoría RP04 (valores ES/EN) | Listo para revisión humana |
| F03 | RP06 sin moodboard ni concepto | Concepto atribuido y referencias desde las vistas del propio modelo (sin terceros) | auditoría RP06 | Listo para revisión humana |
| F04 | RP08 sin oferta técnica, exclusiones ni planificación | Segunda lámina A3; vínculo plan–presupuesto declarado ausente | auditoría RP08; corte E3/E6 | Listo para revisión humana |
| F05 | RP10 sin finalidad propia | Memoria descriptiva con superficies; «no es memoria constructiva» | auditoría RP10 | Listo para revisión humana |
| F06 | RP11 y RP12 sin catálogo positivo ni revisión del presupuesto | Fichas con estado genérico, referencia, elegido o instalado, y precio solo verificado; estado de revisión y condiciones | B-06; `laminas-qa` (catálogo ligado, sin SKU en obra) | Listo para revisión humana |
| F07 | El resolvedor ignoraba toda aportación en L | Cuenta solo lo compuesto y registrado (`entrega.json → aportaciones`, con huella); una aportación distinta se declara ignorada | B-08; `recetas-qa` 117/117 | Hecho |
| F08 | Oráculo: presencia ≠ validez; RP03 sin documentos; ES/EN no comprobado | Valores exactos de la fixture en ES y EN; documentos heredados de RP03; campos de corte E2/E4 declarados | `tools/auditoria-recetas.cjs` → 12/12 L | Hecho |
| F09 | `compose` terminaba con 0 con el inglés bloqueado | Código 3 (`INGLES-BLOQUEADO`) | B-10, prueba real | Hecho |
| F10 | Falso positivo de exclusión textual | Texto de la fixture corregido; caso de regresión | B-09 | Hecho |
| F11 | N04 solo en ES, multiconjunto de cifras, sin exportador | Seis escenarios ES/EN por composición, exportador y verificador del ZIP; filas y orden | `economia-zip-qa` 24/24; 12 ZIP + digest | Hecho (licencia del núcleo pendiente) |
| F12 | Web EN incompleta en estados degradados (sin vistas, presupuesto ni revisión) | Traducciones añadidas; el gate las exige | `economia-zip-qa` (EN publicado en los seis) | Hecho |
| F13 | Identidad de receta solo en texto libre | Campo `receta` validado y fuera del manifiesto; recibo interno con huella exacta del candidato | `recibo-qa` 6/6, interfaz incluida | Hecho |
| F14 | Idioma de interfaz = idioma de documento en el selector | Idiomas independientes y textos del selector en ES/EN | `selector-ui-qa` 7/7 (Chromium emulado) | Hecho; Safari real y dispositivos pendientes |
| F15 | QA tipográfico solo del plano general | Todas las páginas técnicas ES/EN; FF&E inventario ↔ instancias | `laminas-qa.json` ok | Hecho |
| F16 | Mapa de impacto sin verificación (estaba obsoleto) | `verificar-impacto.cjs` con negativos; mapa regenerado | `impacto-qa` 5/5 | Hecho |

## Dossier de mejoras realmente implementadas

| Mejora | Código | Prueba |
|---|---|---|
| Bloques documentales de siete recetas | `tools/bloques-receta.cjs`, `snapshot/aportaciones.json` | `tools/bloques-qa.cjs` |
| Registro de aportaciones compuestas y resolvedor por bytes | `tools/compose.cjs`, `tools/entrega.cjs`, `tools/recetas.cjs` | `tools/recetas-qa.cjs` |
| Oráculo de completitud | `tools/auditoria-recetas.cjs` → informe 16 | — |
| Escenarios económicos por el exportador real | `tools/economia-zip-qa.cjs` | evidencia `economia/economia-zip-qa.json` |
| Recibo de receta | `tools/preparar.cjs`, `tools/exportar.cjs` | `tools/recibo-qa.cjs` |
| Idioma de interfaz | `tools/entrega.cjs` (selector) | `tools/selector-ui-qa.cjs` |
| QA de láminas y FF&E | `tools/laminas-qa.py` | — |
| Donantes y roadmap | informes 17 y 18, `tools/roadmap-recetas.cjs` | — |
| Mapa de impacto verificable | `tools/verificar-impacto.cjs` | `tools/impacto-qa.cjs` |

## Matriz de 21 recetas y de seis perfiles × tres fases

Están en el informe 16, que se regenera con `node tools/auditoria-recetas.cjs`.

- **Recetas L:** las 12 están completas documentalmente en ES y EN. Sus campos de otras fases se declaran como corte.
- **Recetas C y F:** RP13–RP21 son contratos sin emisión (informe 18).
- **Perfiles × fases:** la fase P no tiene receta L en ningún perfil. Es por diseño: sus recetas son futuras (RP18–RP21).

## Hoja de aceptación humana (propietario)

| # | Qué revisar | Dónde | Resultado |
|---|---|---|---|
| 1 | Páginas nuevas de RP01 y RP12 en la propuesta, ES y EN | `dist/` → ZIP del cliente → `documentos/commercial-proposal-client-v3*.pdf` | ✔ Aceptado (propietario, 17/11, candidato ca9fcc1) |
| 2 | «Compra y reforma» de la ficha inmobiliaria | `real-estate-sheet-v3*.pdf`, página 2 | ✔ Aceptado (propietario) |
| 3 | «Concepto y referencias» del libro de interiorismo | `interior-book-v3*.pdf`, penúltima página | ✔ Aceptado (propietario) |
| 4 | Oferta técnica en la lámina A3 | `architecture-sheet-strip*.pdf`, página 2 | ✔ Aceptado (propietario) |
| 5 | Memoria descriptiva | `architecture-book*.pdf` | ✔ Aceptado (propietario) |
| 6 | Productos con referencia | `materials-furniture-book-v3*.pdf`, penúltima página | ✔ Aceptado (propietario) |
| 7 | Seis escenarios económicos | `dist/economia/*.zip` | ✔ Aceptado (propietario) |
| 8 | Selector de recetas con la interfaz en inglés | `out/v3/profesional/preparar-entrega.html` | ✔ Aceptado (propietario) |
| 9 | Impresión a escala física, Safari real y dispositivos físicos | No probados | ☐ Pendiente |
| 10 | H08: exposición VIS en Git y licencia del núcleo económico | Decisión del propietario | ☐ Pendiente |

**Contenido de la fixture.** Los datos de la fixture son inventados y están rotulados en cada página. Antes de cualquier uso real, el estudio aporta los suyos.

## Aceptación visual del propietario (17/11/2026)

El propietario declara de forma expresa que ha **revisado y aprobado visualmente** los entregables profesionales de Studio Presentation v1.4 ampliada del **candidato `ca9fcc1`** (`ca9fcc19…`). Esta acta solo registra esa declaración. No se ha regenerado ni modificado ningún entregable.

Las huellas originales de distribución siguen siendo las de `evidence/paquetes/distribucion-v1.4-ampliada.json`, que lista 29 archivos e incluye los 12 ZIP económicos y sus digest:

| Paquete | SHA-256 |
|---|---|
| `entrega-vivienda-de-ejemplo-es.zip` | `a8816cbde20c7689a454f42cbabe5159f664ac4d3b4ccdb79821784397f61b23` |
| `entrega-vivienda-de-ejemplo-en.zip` | `bf7284d7fc226fa740f7bc62857e15f981443ddb00be22b550ca8c6fadefeb4f` |
| `rubik-studio-presentation-lab.zip` | `2d621cce70bd25d66285c5708b87fe72519a6808c7340e59783ab5c7c8e03a84` |

| Ámbito | Estado |
|---|---|
| Aceptación visual (D08, puntos 1–8 de la hoja) | **ACEPTADO por el propietario** sobre `ca9fcc1` |
| Impresión a escala física, Safari real y dispositivos físicos | **No probados**. Fuera de esta aceptación. |
| H08 (exposición VIS en Git e historial) | **Decisión del propietario pendiente**. Inventario y propuesta conservados. |
| Derechos de redistribución del núcleo económico | **No acreditados**. El núcleo se ejecuta desde el pin en solo lectura y no se redistribuye. |
| E2–E7 | Solo diagnóstico y plan. Requieren mandato y GO específicos. |

**Desarrollo autorizado de E0/E1: TERMINADO.** No se empieza ningún corte de integración hasta recibir el mandato y el GO específicos.
