# 00 · Cierre E0/E1 de Studio Presentation (v1.2 y v1.3)

**Fecha:** 17/11/2026 · **Ejecutor:** Claude Code · **Revisión independiente:** pendiente (ChatGPT) · **Decisión:** propietario.

| Referencia | SHA |
|---|---|
| `master` de partida para E2 | `403e6b74c95a81e23c17badb276abeca9f8c3fd1` (incluye #245) |
| Laboratorio auditado (v1.2) | `97d3eac3536b633f7df5b72c56ef8a7800c8012a` |
| Laboratorio tras este cierre | rama `lab/studio-presentation-e0e1`: `ef8711c` (A01–A03/A05), `2119a37` (A04/A06) y el commit de estos informes |

**Alcance y límites:**
- No se ha tocado el producto, Production, Vercel, workflows ni secretos.
- No hay nuevas generaciones IA de pago.
- No se ha abierto ninguna PR ni se ha hecho merge.
- No se han tocado las ramas de Codex (#243/#244).

## 0. Actualización v1.3 (vigente)

Las secciones 1 a 8 son el cierre v1.2 y se conservan como histórico. Lo que cambia con el mandato v1.3 está aquí. Detalle por requisito: `reports/13-REGISTRO-VIVO-v1.3.md`. Mandatos y huellas: `mandatos/INDICE-MANDATOS.md`.

| Bloque v1.3 | Resultado | Evidencia |
|---|---|---|
| Architecture Book (A21) | Libro de 14 páginas, distinto de la lámina A3; sección y fachadas solo con lo que calcula el producto; lint 0 | `out/v3/architecture-book.pdf`, `out/v3/qa.json` |
| Concepto (módulo 02) | Optativo, texto del profesional marcado como suyo, separado de los datos; sin texto, el capítulo no aparece | `out/v3/entrega-integral.pdf` p. 3 |
| Inglés (A22/A23) | 8 PDF y 7 webs; residuo español 0; cifras ES = EN; si el inglés falla, el español se publica igual | `evidence/i18n/`, `out/v3/qa.json` → `en` |
| Marca | 4 perfiles en ES y EN con QA 0; aviso de contraste del logotipo | `evidence/perfiles/` |
| QA de consumidor | 7 modalidades × ES/EN × 5 vistas, en Chromium; teclado, foco, landmarks; `postMessage` de un emisor ajeno ignorado; p50/p95 | `evidence/consumidor/` |
| Revisión visual (A28) | 116 páginas ES/EN; 2 defectos encontrados y corregidos | `evidence/revision-visual/index.html` |
| Paquetes (A10/A29) | ZIP del cliente ES y EN; ZIP del laboratorio por lista de permitidos y saneado; receta con versiones fijadas; dos reconstrucciones iguales | `evidence/paquetes/`, `RECETA.md` |
| H08 | Inventario: 68 archivos VIS en el Git público, sin licencia acreditada y sin exclusión de deploy | `evidence/h08/inventario-vis.json` |
| E2 (A24–A27) | Informe 11 reescrito sobre el código de `master@8525025`; A25 ×4 y A26 ×2 reproducidos | `reports/11-PROPUESTA-E2.md`, `evidence/e2/` |

**Pendiente y delimitado:**

- Estados económicos parcial, incoherente y de una cara en el laboratorio: pasan a N04 (v1.4).
- Firefox, WebKit y dispositivos físicos: NO_VERIFICADO.
- Revisión humana de las páginas y la web (D08).
- Especificación v1.2 revisada y hallazgos V13-01 a V13-09: **no recibidos**; registrados como BLOCKED.

### Recomendación v1.3 (graduada; no es autoaprobación)

| Pieza | Recomendación |
|---|---|
| **Cierre técnico v1.3 del laboratorio** | **GO para revisión independiente y humana**, con los pendientes de arriba. No acredita el producto. |
| **v1.4 (N01–N08, RP-Q01–RP-Q12)** | **GO para ejecutar en el laboratorio**, con las correcciones V1–V5 de `reports/14`. |
| **E2 (ENT-04)** | **GO condicionado**: GO explícito del propietario y base consolidada con Codex. Corte según `reports/11`. |
| **H08** | **Decisión del propietario** (licencia, historial, exclusión de deploy). Nada se borra por iniciativa propia. |
| **Publicación remota, gasto, Production, dependencias nuevas en el producto** | **NO GO** |

## 1. Qué es cada cosa

| Clase | Qué incluye |
|---|---|
| **Función de producto** (existe en `master`) | Cuatro estilos de dossier A4 (`FloorPlanDossier`); lámina SVG A3 con escalas; ficha de superficies; dossier económico C4; material board; imágenes de entrega; archivo de cliente B1; visita/publicación ENT-01; Evolución FT3D-8; Story. |
| **Prototipo funcional de laboratorio** | Compositor (`tools/compose.cjs` + `b1.cjs`); paginación medida (`flow.js`); exportación selectiva con manifiesto y comprobaciones (`exportar.cjs`); verificador (`verificar-entrega.cjs`); paquetes por allowlist con inspección (`package.sh`, `inspeccionar-paquete.py`). Funcionan, con pruebas, **solo dentro del laboratorio**. |
| **Muestra** | Los PDF de `out/v3`, la web de cliente de `out/v3/entrega` y los ZIP de `dist/`. Usan datos sintéticos («Proyecto de ejemplo», estudio `.invalid`) y precios de prueba rotulados. |

**Nada de esto marca un ID del catálogo como completo.** Un prototipo no acredita ENT-03, ENT-04 ni ENT-06.

## 2. Mapa: especificación, laboratorio y resultados

| v1.2 | Laboratorio | Estado |
|---|---|---|
| §10.1 `00-BASELINE` / `00-RESUMEN` | Este informe y `evidence/baseline/` | Cerrado |
| `01-INVENTARIO-DONANTES` | `reports/01` (SHA y licencias; 25 donantes) | Cerrado |
| `02-REFERENCIAS-VISUALES` | `reports/02` y `03` (49 hashes únicos, 46 diseños distintos) | Cerrado. Se recalcula solo si cambia el banco. |
| `03-SISTEMA-EDITORIAL` | `reports/04` y `system/rubik-editorial.css` | Cerrado (EXTEND de tokens RUBIK) |
| `04-CONTRATO-DOCUMENTAL` | `reports/11` §3 (modelo por composición) | Propuesta para E2 |
| `05-PROTOTIPOS` | `out/v3`, `reports/B1`, `B2`, `DECISIONES-PENDIENTES` | Cerrado; D1–D5 aprobadas |
| `06-EVALUACION-MOTORES` | `reports/06-ADR-MOTOR.md` y `out/v3/b3` | Elección provisional CSS Print + paginación medida; aprobación independiente pendiente |
| `07-QA-MATRIZ` | `reports/12-MATRIZ-QA-v1.2.md` | Este cierre |
| `08-MAPA-IMPACTO` | `reports/11` §5 | Propuesta |
| `09-PLAN-INTEGRACION` | `reports/11` | Propuesta; no se ejecuta sin GO |
| Hallazgos A01–A06 | `tools/exportar*.cjs`, `verificar-entrega.cjs`, `flow.js`, `compose.cjs`, `entrega.cjs` | Corregidos o delimitados (§4) |

### 2.1 Reconciliación de la arquitectura

- **3 familias.** La técnica, la editorial y la comercial son estilos sobre el mismo snapshot.
- **5 tipos de entregable:**
  - Interior Design Book: `interior-book-v3`, 14 páginas.
  - Materials & Furniture Book: `materials-furniture-book-v3`, 12 páginas.
  - Commercial Proposal: `commercial-proposal-client-v3` y `-studio-v3`.
  - Real Estate Presentation: `real-estate-sheet-v3`, más la variante sin presupuesto.
  - **Architecture Book: AUSENTE.** Solo existen las láminas A3 `architecture-sheet` y `-strip`, de una página. No se da por entregado por equivalencia (§2.5 de la v1.2).
    - Propuesta: libro técnico multipágina con portada, planta general A3, plantas por estancia (`roomPlan`), cuadro de superficies, leyenda y cajetín por lámina.
    - Alzados y secciones solo cuando exista un motor que los acredite; hoy son FALTA.
- **10 módulos frente a 11 capítulos web:**

  | Capítulo web | Módulo |
  |---|---|
  | portada | 01 |
  | vivienda | 03 / 04 |
  | dibujo | 05 / 06 |
  | estancias | 04 / 06 |
  | materiales | 07 |
  | presupuesto | 08 |
  | obra | 09 |
  | recorrido | 05 / 06 |
  | decisiones, documentos, procedencia | 10 |

  El módulo **02** (concepto) solo aparece como texto del profesional (`intro`). Ninguna modalidad cubre todos los módulos.
- **7 modalidades:** integral, primera reunión, propuesta comercial, dossier técnico, interiorismo, inmobiliaria y obra. Son presets de capítulos y documentos del mismo snapshot. Las 7 se exportan y se verifican (prueba ST02-b).
- **4 pilares:** ver §5.
- **Idiomas:** español; inglés pendiente de muestras (no hay traducción de las plantillas: NO_VERIFICADO). Chino aplazado (D6).

## 3. Matriz H01–H08 (enunciados de la v1.2 §3.3)

| H | Estado | Evidencia | Ámbito |
|---|---|---|---|
| H01 · Inventario sin `economic` | **Reproducido** en `f31f303` | `evidence/baseline/baseline.json`: `inventoryHasEconomic:false` con `renderedEconomicPage:true` (página `dossier-economic` impresa). No se ha probado sin presupuesto. | Producto. Sin corregir: el cierre E0/E1 no toca código. |
| H02 · Cabecera económica lee `brand.name` | **Reproducido** en `f31f303` | El snapshot tiene la forma `{profile,title,intro,takenAt}` sin `name`; `econBrandLineShown:false` con marca elegida. | Producto. Sin corregir. |
| H03 · Carrera en la preparación asíncrona | **Pendiente** | No reproducido. El laboratorio congela un snapshot estático, lo que **no** prueba el producto. La prueba exigida (cambiar la fuente durante un `await` de B1/dossier) es para E2/ST01. | Producto |
| H04 · Paginación A4 | **Reproducido el baseline; separado del harness** | Los PDF reales de los 4 estilos salen por la ventana de impresión del producto (`07-dossier-*.pdf`). La pérdida de CSS se debía a `context.route` del harness, no al producto. La paginación larga (1/50/200/500) se probó en el **laboratorio**, no en el dossier del producto. | Laboratorio y producto, por separado |
| H05 · Dos contratos HTML | **Confirmado por lectura** en `403e6b7` | ENT-04 `verify()`: sin scripts. B1 `FloorPlanClientShare.{build,download,CSP}`: scripts propios y CSP. La web del laboratorio es una tercera clase (sin scripts tras la exportación) y no sustituye a ninguno de los dos. | Producto |
| H06 · Revisión ≠ coincidencia de cantidades | **Confirmado (DEC-07)** | `revision-budget-core` 1.0.0 (`revisionMatch`, `compareBudgets`) no está cargado en el `index.html` de `master`. Las advertencias se mantienen. | Producto |
| H07 · Sin colores ni tipografía de marca | **Reproducido** en `403e6b7` | `brand-core.js` no define campos de color ni de fuente; solo nombre, contacto, logo y textos. | Producto. Ampliación propuesta en `reports/11`. |
| H08 · Referencias públicas | **Confirmado como riesgo de Git** | `.vercelignore` de `master` solo excluye `labs/`. Production respondió **404** a una imagen VIS (17/11, comprobación HTTP). El repositorio es público: la exposición en Git y en su historial persiste. | Repositorio; requiere decisión del propietario |

## 4. Hallazgos A01–A06 de la auditoría

| A | Qué se hizo | Prueba |
|---|---|---|
| A01 · Selección ≠ entrega | `exportar.cjs` poda el HTML (no oculta) y copia solo lo referenciado. **Dos fugas reales corregidas:** <br>• el tipo «Propuesta comercial» adjuntaba el PDF integral con obra, recorrido y dibujo; <br>• la ficha inmobiliaria llevaba el coste de la reforma en tipos sin presupuesto (nueva variante sin cifras). | ST02-a: 0 importes en HTML/PDF/medios al desmarcar el presupuesto. ST02-b: 7/7 tipos exportan. |
| A02 · Integridad | `MANIFIESTO.json` con **todos** los archivos (salvo él mismo), tamaño, tipo y procedencia. El resumen externo con el SHA-256 del manifiesto y del ZIP queda fuera de la carpeta. El registro es la selección real. | ST04-a/b/c/d: byte alterado, archivo extra y manifiesto reescrito, todos rechazados. |
| A03 · Comprobaciones como gates | Las comprobaciones se derivan de datos y artefactos: identidad, proyecto/revisión, editable, datos personales, coherencia y fuga. «Bloquea» impide exportar; «revisar» exige reconocimiento en modo cliente; el borrador se rotula. «Preparar entrega» se presenta como **simulación**. | ST03-a…g y ST06-a: 8/8 (7 bloqueos y el borrador rotulado). |
| A04 · Paginación | Invariante sobre el DOM final por índice y campos canónicos (etiqueta repetida ≠ dato duplicado). Una fila más alta que la página = **sin PDF**. Verificación **celda a celda** sobre el PDF impreso (`pdftotext -tsv`). | Presupuesto largo: 543 celdas, 0 diferencias. Prueba negativa (fila oculta solo al imprimir): bloquea. Variante `oversized-row`: rechazada. **No hay cobertura universal**: solo las tablas `table.flow`. |
| A05 · Paquete y canal | La web de cliente no escucha `postMessage`. Solo la copia de vista previa del profesional lo hace, comprobando el emisor (`e.source`) y el origen cuando no es `null`. En `file://` el origen es opaco: límite declarado. Paquetes por allowlist e inspección archivo a archivo. Metadatos de imagen, PDF y vídeo eliminados en origen. | Cliente: 30 archivos, 0 hallazgos. Laboratorio: 223 archivos, 0 que bloqueen y 16 a revisar: rutas absolutas en informes y el correo inventado de la prueba ST06-a. |
| A06 · Pilares y cobertura | Sin «a escala» con escala estimada (19 PDF y 7 web comprobados). Renders: «correspondencia visual medida por miniaturas», nunca «imagen de origen». Salón: aviso de distorsión. Obra: «ejemplo, sin presupuesto». Sin promesa de visita interactiva offline. | Búsqueda de texto en todos los PDF y HTML |

## 5. Cuatro pilares

| Pilar | Grado acreditado | Límite |
|---|---|---|
| FT3D-8 Evolución de obra | Vídeo, presentación de solo lectura y manifiesto exportados por la ruta real de biblioteca. El manifiesto declara `prj_reference-home`; el exportador lo comprueba. | Plan **orientativo**, sin presupuesto vinculado y con fechas ilustrativas. DEC-05 para remoto. |
| Hybrid V2 · Dibujo vivo | Un fotograma auténtico del lienzo. | **No** hay vídeo de Dibujo vivo. El recorrido es un vídeo 3D normal y está rotulado así. |
| Render IA | 3 imágenes (D7, consumidas). 2 corresponden visualmente a su vista (diferencia 2,3 y 3,1 sobre 255). | El Salón viene de otra cámara (17,1), con contenido ajeno al encuadre. No se conservó la imagen enviada. Modelo y coste por imagen no disponibles. **0 llamadas nuevas.** |
| Visita ENT-01 | Fuera de la carpeta: necesita enlace publicado. | Offline ≠ visita. Las restricciones multiplanta y de PointerLock están en `reports/09`. |

## 6. Paquetes reales

Generados por `tools/package.sh` en `dist/`, que **no se versiona**. Los archivos se adjuntan en el mensaje de cierre.

| Archivo | Bytes | SHA-256 |
|---|---|---|
| `entrega-vivienda-de-ejemplo-reparto.zip` (cliente + LÉEME) | 14,9 MB (30 archivos) | en `dist/SHA256SUMS` |
| `entrega-vivienda-de-ejemplo.zip` (carpeta verificada) | 12,5 MB | idem; también en `.digest.json` |
| `rubik-studio-presentation-lab.zip` | 64 MB (223 archivos) | idem |

**Pruebas del ZIP de cliente:**
- Se descomprime en una carpeta temporal fuera del repositorio y se abre en Chromium sin red.
- Vistas: 1440×900, 820×1180, 390×844 y 844×390.
- 18 imágenes, 0 rotas; 2/2 vídeos se reproducen; 0 peticiones externas; 0 errores; 0 desbordes; 0 contraste bajo; 0 textos de menos de 12 px; foco visible.
- Capturas y vídeos en `evidence/entrega/v1.2/`.
- **No probado:** dispositivos físicos, Firefox y WebKit.

## 7. Decisiones

D1–D6 aprobadas o vigentes. D7 consumida (3 peticiones). Se respetan y no se vuelven a pedir. Ver `reports/DECISIONES-PENDIENTES.md`.

## 8. Recomendación (graduada; no es autoaprobación)

| Pieza | Recomendación |
|---|---|
| **Cierre E0/E1** | **GO** para revisión independiente. Pendientes delimitados: Architecture Book, muestras en inglés, H03 y la aprobación independiente del ADR. |
| **E2 (ENT-04 activación mínima)** | **GO condicionado.** Requiere el GO explícito del propietario. Partir de `master@403e6b7` o del consolidado que acuerde Codex. Primer corte según `reports/11`. **Sin** el exportador del laboratorio ni sus binarios. |
| **Publicación remota, gasto, Production, dependencias nuevas** | **NO GO** |
