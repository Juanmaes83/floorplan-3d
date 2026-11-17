# 17 · Inventario diferencial de donantes (v1.4 §9)

Skills for Architects (Alpaca Labs, **MIT**), pin `a9c4355a6d5bff526786d590ed1f04b687b880a6`, leídas con `git show` en el clon local (`/home/user/donors/skills-for-architects`, fuera del paquete). **No se copia código ni texto**: solo patrones. Huella SHA-256 de cada `SKILL.md` leído:

```
proposal 30821c86cb5ee03bf08952509f2cc0734ef9aeac45f1ca67bdab8311a6fd6d21
ffe-spec-book bdbff5752eda6f24a74114a2069c6bb9e7865a042d720cf52e9d6770af416431
product-cut-sheet 386ee3dc6e7909ff08e7f0f46be222e71f29a75b6b7003d29d90e41c59b83cc9
schedule-quantity-reconcile 7498fed696ff6844abd8df9e6563dcaa217ba4f3b5acd81219d69eab83696a49
drawing-quantity-extract 75b274f36efbf5f9f41b8f6ef9f53df361dc03992e1e0715d22725f9b5608655
color-palette-generator c03d9f22346fae49c8fefc4b7c37186f5c4fe1ab33cfc8defaf4a412ae03844f
slide-deck-generator 5a63448ff81f9cd887c13098efb5d339f411a27303903a3e2ba3fe02d6910807
site-visit-report 8c28f98d146b4af5ef2332101128ce35f62230d87b5f68926234c35d9390a7c0
meeting-minutes 514b8fbbae42744784a2ac69c2e68fbc33bb57a093eed502effacd76933de6c4
spec-writer 8a4f054fdf83af0ac996cec4677f73e4326b89ac48fd19bc1a90a17d45ed02c1
```

| Skill | Requisito estudiado | Patrón aplicable | Código RUBIK que lo usa | Prueba | Mejora pendiente | Corte |
|---|---|---|---|---|---|---|
| proposal | Términos emitidos protegidos; ciclo comercial solo con evidencia; enviar es otra autorización | Bloque de alcance, honorarios por fase, exclusiones y validez separados del coste de obra; nada se envía | `tools/bloques-receta.cjs` (RP01), `exportar.cjs` (sin envío) | `bloques-qa` B-01/B-03, auditoría RP01 | Versionado de términos emitidos (no reescribir una oferta enviada) | E3 |
| ffe-spec-book | Libro ordenado; **cada producto contabilizado**; paquete congelado y recibos verificados | Inventario = instancias; fichas agrupadas; recibo y huella del candidato | `ffe.cjs`, `laminas-qa.py` (N03), `preparar.cjs` (recibo §6) | `laminas-qa` (46 instancias, catálogo ligado), `recibo-qa` R-01 | Invalidar el libro si cambia una ficha tras congelar | E4 |
| product-cut-sheet | Ficha fiel a la fuente; identidad y límites de la fuente | Fichas de catálogo con fabricante, SKU, acabado, estado (referencia / elegido / instalado) y precio solo verificado | `bloques-receta.cjs` (RP11) | `bloques-qa` B-06, auditoría RP11 (valores ES/EN) | Imagen de producto con licencia acreditada | E4 (ENT-05) |
| schedule-quantity-reconcile | Comparar cantidades con alcance; explicar coincidencias, ausencias y conflictos | Conciliación económica por estados (complete/partial/incoherent/one-sided/none) sin inventar | `economia-documental.cjs`, `economia-zip-qa.cjs` | `economia-zip-qa` 24/24 | Conciliación partida a partida en el documento (hoy: totales y comparables) | E2/E5 |
| drawing-quantity-extract | Conteos con evidencia de posición | Huella en planta y situación por objeto; keyplans | `ffe.cjs`, `b1.cjs` (keyplans) | `ffe-qa` (1/50/200/500 fichas) | Evidencia de posición en el registro de cada ficha | E4 |
| color-palette-generator | Paleta con códigos, pares y contraste | Paleta desde los materiales del snapshot con rol y fuente; contraste medido | `b1.cjs` (materiales), QA de contraste del compositor | lint del compositor (RED vacío) | Pares de contraste documentados por perfil de marca (H07) | E3 |
| slide-deck-generator | Presentación HTML autónoma con sistema de diseño | Web de entrega offline sin scripts, sistema editorial propio | `entrega.cjs`, `system/rubik-editorial.css` | `verificar-entrega`, QA de consumidor | Modo presentación a pantalla completa | E3 |
| site-visit-report | Observación directa ≠ informe de terceros ≠ interpretación | Contrato RP16: hechos, propuestas y decisiones separados; no se crean actas | `recetas.cjs` (RP15/RP16 contrato) | `recetas-qa` (negativos RP15/RP16) | — (motor futuro) | OBR futuro |
| meeting-minutes | Decisiones confirmadas vs propuestas; acciones propuestas | Contrato RP16 y capítulo «Lo que hay que decidir» con estado explícito | `entrega.cjs` (decisiones), `recetas.cjs` | `recetas-qa` | — (motor futuro) | OBR futuro |
| spec-writer | Secciones desde requisitos aceptados, con banderas de revisión | Contrato RP17: la especificación de ejecución exige validación competente | `recetas.cjs` (RP17) | `recetas-qa` | — (no se redactan especificaciones) | E4 (ENT-05) |

## Otros donantes (reconciliación)

| Donante | Uso en el laboratorio | Estado |
|---|---|---|
| IFC Sheet (MPL-2.0) | Solo la fuente Inter (OFL), copiada sin modificar en `vendor/fonts/inter`; ningún código | Vigente |
| Invoify | Patrón de bloques de oferta (partidas, condiciones, validez) para RP01; sin código | Conocimiento |
| Papora | Ritmo editorial de portadas; sin código | Conocimiento |
| Typst | Candidato posterior de motor (ADR 06); no instalado | Reservado |
| PDFme | Plantillas de PDF con campos; descartado como motor (CSS Print vigente) | No usado |
| Marker.js | Anotación sobre imágenes; fuera de alcance (no se anotan renders) | No usado |
| IFC Lite | Lectura IFC; el producto no exporta IFC; fuera de alcance | No usado |
| OpenConstructionERP | Modelos de certificación y obra para RP15/RP20 (solo contrato) | Conocimiento, futuro |
| DocuSeal | Firma; **no se simula ninguna firma** (RP20) | Excluido |
| Paged.js | Descartado por evidencia (ADR 06) | Descartado |

Ningún donante se instala ni se redistribuye en los paquetes; los nuevos motores o servicios no se introducen por aparecer aquí.
