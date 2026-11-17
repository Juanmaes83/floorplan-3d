# 15 · Registro del delta v1.4 (N01–N08, RP-Q01–RP-Q12)

**Ámbito:** laboratorio `lab/studio-presentation-e0e1`. Nada de esto acredita el producto ni autoriza integrarlo.
**Mandatos:** `mandatos/RUBIK-SOTA-PROMPT-CLAUDE-DELTA-DOCUMENTAL-v1.4.md` y su anexo; correcciones V1–V5 e interpretaciones de `reports/14`. Índice y huellas: `mandatos/INDICE-MANDATOS.md`.

**Estados** (los del anexo §8):

| Estado | Significado |
|---|---|
| EXECUTED_PASS | Ejecutado sobre el candidato v1.4 y superado. |
| EXECUTED_FAIL | Ejecutado y no superado. |
| REUSED_VERIFIED | Evidencia anterior válida: mismas fuentes, dependencias, entorno y artefacto. |
| BLOCKED | Falta una fuente o un permiso. |
| NO_VERIFICADO | No se puede probar en este entorno. |
| N/A | No aplica. |
| EXPECTED | Planificado, aún no ejecutado. |

## Baseline congelada (cierre v1.3)

| Qué | Valor |
|---|---|
| Commit | `585fd9c` (rama del laboratorio) |
| Snapshot | `snapshot/snapshot.json`, SHA-256 `fcb6e19f…b390` |
| ZIP de cliente ES / EN | `a3f9958a…7bbe8` / `7a19c71a…01258` |
| ZIP del laboratorio | `309e077b…c1b07` |
| QA | 25 PDF con QA 0; web 42/42; exportador 72/72; reconstrucción ×2: 25/25 |
| Evidencia | `evidence/paquetes/`, `reports/13-REGISTRO-VIVO-v1.3.md` |

## N01 · Catálogo y selector de recetas RP01–RP21

**Qué existía:** 7 modalidades de entrega (`entrega.json` → `tipos`), el catálogo único de módulos, capítulos y documentos (`tools/catalogo-entrega.cjs`), el exportador con gates (`tools/exportar.cjs`), el verificador y «Preparar entrega».

**Qué se añade:**

| Pieza | Qué hace |
|---|---|
| `tools/recetas.cjs` | Catálogo de las 21 recetas (campos del anexo §5 N01), 6 perfiles, 3 fases y 43 fuentes evaluadas sobre el snapshot y el registro reales. `resolver()` devuelve el estado y, para una L, la selección del contrato v1.3 (modalidad, capítulos y documentos existentes). |
| `tools/receta-exportar.cjs` | Adaptador mínimo. Una L va a `exportar.cjs` **sin cambiar su contrato**. La receta y su versión quedan en la nota de la selección y en `<dir>.receta.json`, que liga la receta a la huella del ZIP. Una C, F o L bloqueada deja solo `<dir>.receta-rechazo.json`: ninguna carpeta, ZIP ni resumen. |
| «Preparar entrega», paso 1 | Filtros de perfil y fase (reversibles), lista con estado, detalle (qué obtendrás, qué falta, qué se omite, qué verificar). «Aplicar» rellena la selección libre, que sigue editable. C y F explican por qué no hay descarga. |
| `tools/recetas-qa.cjs` | Esquema, filtros, exportación real ES/EN de cada L, rechazo de cada C/F, negativos, navegador. |

**Interpretaciones aplicadas** (`reports/14` §3):

- Las aportaciones de fixture no cuentan en una L: los documentos actuales no las componen, así que la receta sigue parcial y lo dice.
- RP02 y RP09 comparten la selección y, por tanto, los bytes. Se acredita con las huellas del manifiesto, sin duplicar salida.
- El registro de la receta no entra en el manifiesto del cliente: el contrato del exportador no cambia. La evidencia es interna del laboratorio (`<dir>.receta.json`), como permite el anexo.

**Resolución sobre la entrega real** (`evidence/recetas/matriz-recetas.json`):

| Estado | Recetas |
|---|---|
| L completa | RP05, RP07 |
| L parcial (exportada; nombra lo que falta) | RP01, RP02, RP03, RP04, RP06, RP08, RP09, RP10, RP11, RP12 |
| C no elegible (sin descarga) | RP13, RP14, RP15, RP17, RP21 |
| F no disponible (sin descarga) | RP16, RP18, RP19, RP20 |

Resultados de las pruebas: ver la sección «RP-Q» más abajo.

## Continuidad del 17/11/2026

Rama remota y punto de partida `101fe167bd920c94c7e27938dfd3c22526dd9728`. Referencia de producto de solo lectura `8525025a1470d48d52d8e365070e5a0acf116134`. Las PR abiertas #246 y #247 apuntaban a master desde otras ramas. Se verificó un checkout limpio y disperso del laboratorio para evitar las rutas largas de las referencias VIS en Windows.

La fuente v1.2 está en `mandatos/` con su huella original. El bloqueo por ausencia de fuente de `reports/13` es histórico. Su §3.3 se sigue en H01–H08, §9 en D01–D18 y ST01–ST09, y §11 en A01–A06 más las ampliaciones v1.3. Las dos brechas editoriales de tamaño y contraste y la diferencia entre reconstrucción textual y visual se vuelven a evaluar con V13 y CONT. Se conservan E2–E7 como diagnóstico y planificación y D08 como decisión humana pendiente.

| ID | Requisito recuperado | Evidencia inicial y siguiente comprobación |
|---|---|---|
| V13-01 | Medir el texto efectivo de la escala gráfica, contando transformaciones SVG. | Aproximadamente 1,96 pt en PDF del candidato `cbdd24c`. Medir de nuevo en PDF, ES y EN. N02/N08. |
| V13-02 | Elevar la legibilidad de rótulos, usar números y leyendas donde falte espacio. | Rango observado 6,2–7,5 pt en `cbdd24c`. Reextraer del PDF y revisar visualmente. N02/N08. |
| V13-03 | Mejorar tamaño y contraste de pies editoriales. | Observación del candidato `cbdd24c`. Medir tipografía y contraste en la salida actual. N07/RP-Q09. |
| V13-04 | Recomponer láminas de estancias pequeñas, en especial el mirador, con localizador y escala honesta. | Observación visual de `cbdd24c`. Contrastar páginas ES/EN actuales. N02/N07. |
| V13-05 | Diferenciar Architecture Book, Interior Design Book y presentación integral por jerarquía y composición. | Observación visual de `cbdd24c`. Comparar las tres portadas. N07. |
| V13-06 | Revalidar foco visible efectivo, desplazamiento, navegación por teclado y zoom. | Incidencias del consumidor de `cbdd24c`. Reejecutar sobre paquetes reales. RP-Q09. |
| V13-07 | Entregar ZIP lab y digest externos ES/EN del candidato exacto. | Auditoría `cbdd24c`. Validar bytes e inventarios del cierre final. RP-Q10/RP-Q12. |
| V13-08 | Localizar textos y avisos de lector del manifiesto EN preservando claves, IDs y datos. | Auditoría `cbdd24c`. Inspeccionar ZIP inglés recién exportado. RP-Q09/RP-Q10. |
| V13-09 | Una sección vigente de handoff e histórico explícito. | Auditoría `cbdd24c`. El puntero de continuidad se actualiza desde `HANDOFF.md`. |
| CONT-01 | Comparación obligatoria y afirmativa de las rutas, huellas, selección e identidad común del adaptador y la UI. | Lectura estática `101fe167`: `eq !== false` también pasa con `null`. Pendiente prueba RP07 congelada. |
| CONT-02 | Separar receta consultada, selección activa y candidato descargable. | Lectura estática `101fe167`: al consultar C/F, el manejador de descarga sigue disponible. Pendiente prueba UI. |
| CONT-03 | Dos reconstrucciones independientes, conjuntos exactos, integridad, QA, idiomas, visual y salida no cero al discrepar. | Lectura estática `101fe167`: comparación de texto y páginas, medios A/B por intersección y sin puerta de salida. Pendiente ampliar y aplicar a ZIP final. |

### Cierre N01 y CONT-01/02

- Reproducción en Linux con Chromium 1243 de Playwright 1.63.0, Node 24.20.0 y Poppler 24.02. Primero se ejecutó el código heredado sobre una composición congelada. RP07 descargado de la interfaz y RP07 emitido por el adaptador compartieron la huella de registro `9163fb9ed70f24285ef639ee2b5b8282f4f365549220c18f2cfe5ffcd38a2ffb` y el manifiesto exacto `680f9fcc88a3d947f3db5c0e555e5e8e070d255f94f79b716ab9af14d946f438`. Al comparar la salida heredada almacenada con esta ejecución, solo difiere la huella de `documentos/real-estate-sheet-v3-sin-presupuesto.pdf`: se reproduce el riesgo de cruzar composiciones. El ZIP histórico del fallo no se conservó.
- CONT-01: los dos ZIP se verifican con sus resúmenes, dentro de una misma ejecución. Se compara identidad de proyecto/revisión/snapshot/registro, selección, metadatos e inventario íntegro por ruta normalizada, incluido LEEME/README. La comparación ausente falla. El nombre del contenedor ZIP depende del destino.
- CONT-02: la consulta de RP13/RP16 mantiene identificada la selección activa, bloquea su descarga durante la consulta y requiere una acción expresa para recuperarla. Los ensayos cubren ambos niveles y el retorno a RP07.
- RP07 final acotado 22/22. Suite completa 112/112, 21 recetas, exportaciones ES/EN, Chromium a 1440/390/320 px. Evidencia en `evidence/recetas/recetas-qa.json` y `salidas.json`. Composición `cd0e46c8c0e5c6f2b3fa9381a131b8276a88d52c0d0cc7ebdd36e7d4c3a8caac`.
- N05 reejecutado: 23/23 (integridad, obsolescencia y emisión simulada). Evidencia en `evidence/estados/estado-qa.json`.

### CONT-03 · Reconstrucción del corte N01/N05

`bash tools/reconstruir.sh dist/rubik-studio-presentation-lab.zip /tmp/recon` pasó sobre el ZIP intermedio `d3a4ba06b60a2bff7f48c9e3e7ee1a84e3c1cf53a2a507a042672f06c4b10093`. Dos extracciones con instalación y composición independientes. Coinciden los inventarios, los 20 medios en sus bytes, los 42 PDF por ruta (incluidas copias) en bytes salvo fechas, texto, páginas y raster a 110 dpi. Ningún PDF coincide en los tres SHA binarios originales. QA a cero y mismo snapshot e idiomas en los tres inventarios. El negativo, con un medio alterado en la copia B, devolvió 2 y registró el archivo. Evidencias en `evidence/paquetes/RECONSTRUCCION-v1.4-N01.json` y `RECONSTRUCCION-v1.4-negativo.json`. La reconstrucción del candidato final se repite tras el delta editorial.

## Delta documental del candidato

| Bloque | Estado y evidencia | Límite |
|---|---|---|
| N02 · Architecture Book | Índice con destinos internos AB-01–AB-11 medidos en PDF ES/EN, índice A-01–A-08, cuadro de 22 anchos, cajetines y localizador del mirador. `evidence/architecture/pdf-qa.json`. | Escalas del modelo estimado. FT3D-3/4 esquemáticos. Alturas, sentidos, replanteo, instalaciones y demolición sin autoridad propia. |
| N03 · FF&E | 46 instancias únicas, 40 fichas ES/EN, procedencia por revisión, agrupación por estancia, dimensiones, material y referencia de catálogo. `evidence/ffe/ffe-qa.json`, `out/v3/qa.json`. Negativos de duplicado, revisiones, cantidad y SKU; 1/50/200/500 fichas cotejadas en PDF. | M-xx estable frente a reorden de entrada en la revisión congelada. Las 46 son instancias genéricas; sin fabricante, precio o instalación acreditada. |
| N04 · Economía | Seis escenarios canónicos (complete, partial, incoherent, ambas direcciones one-sided, none) en propuesta e inmobiliaria, 12 pares HTML/PDF de fixture rotulada. Los valores coinciden por multiconjunto con la salida canónica. `evidence/economia/economia-qa.json`. | GitHub declara `licenseInfo: null` en el origen y el pin carece de fichero de licencia. QA lee temporalmente el producto fijado con paridad de blobs y SHA-256; el núcleo y sus dependencias quedan fuera del ZIP. El ZIP es autónomo para reconstruir el candidato, y el QA económico exige el objeto Git de producto. Escenarios comparativos de fixture en ES. |
| N06 · Autoridad | Las ofertas cotejan fuente, revisión, ámbito, unidad, método, moneda e IVA. Una simulación se rechaza como observación. Plan ajeno incompatible. Recetas C/F con evaluación y bloqueo, con lectura de A25/A26 en `evidence/e2/diagnostico.json`. | Diagnóstico v1.3 heredado de producto. RP13–RP21 continúan como contratos; sus proyecciones no acreditan obra o emisión. |
| N07 · Editorial | Portada técnica con planta ortográfica, interiorismo con axonometría y entrega integral con el fotograma auténtico de Dibujo vivo. Paleta con ID de pavimento y fuente en QA. Pies del sistema a 9 pt con el color de tinta. Láminas y fichas retienen referencias y D1–D5. | Uso de la escala gráfica de 9,63 pt y rótulos de 9,49 pt acreditado en el plano general AB ES/EN. Otras escalas y rótulos de variantes heredadas pueden usar cuerpos menores. |
| N08 · Impacto | `tools/mapa-impacto.cjs` cruza receta, módulo, fuente, selección, archivo y gate con huellas de dependencias y registro del candidato. `evidence/impacto/mapa.json`. | Las dependencias compartidas implican cobertura conservadora. Aceptación humana D08 pendiente. |

## Revalidación V13

| ID | Resultado en el candidato | Evidencia y alcance |
|---|---|---|
| V13-01 | Medición corregida: 9,63 pt efectivos para cada cifra y unidad de la escala del plano general. | `evidence/architecture/pdf-qa.json`. En la recomposición previa N01 se midieron 7,36 pt en la unidad; 1,96 pt corresponde al histórico `cbdd24c`. |
| V13-02 | Rótulos del plano general de al menos 9,49 pt. Las estancias que no admiten el nombre remiten numeradas a AB-02. | PDF ES/EN y verificador de destinos internos. Persisten cuerpos menores en planos auxiliares heredados. |
| V13-03 | Pies de 9 pt y color de tinta editorial. | PDF final medido. Cambio común del sistema de impresión. |
| V13-04 | El plano pequeño de AB-09 mantiene 1:50 del modelo estimado e incorpora localizador de contexto. | Revisión de página 11 ES/EN, `evidence/revision-visual/v1.4`. |
| V13-05 | Las tres portadas presentan encuadres y jerarquías distintas con dibujos procedentes del modelo. | Página 1 de arquitectura, interiorismo e integral, ES/EN. |
| V13-06 | Se reprodujo foco fuera de pantalla durante desplazamiento animado; retirado. QA comprueba recorrido entero, foco dibujado e intersección/oclusión efectiva. | Evidencia del consumidor y límites por navegador en la sección RP-Q. |
| V13-07 | Verificación por SHA-256 del ZIP ES/EN y digest externo, y del ZIP de laboratorio. | Cierre de distribución de este registro. |
| V13-08 | Textos de destinatario del manifiesto y digest EN localizados, con claves, nombres del proyecto y IDs canónicos preservados. | `i18n/en.manifest.cjs`, manifiesto y digest del ZIP inglés exacto. |
| V13-09 | Handoff vigente único en `HANDOFF.md`; dos handoffs anteriores conservados como histórico. | Índice de mandatos y corte de continuidad. |

**Diferencial**. PDF distribuidos desde `585fd9c` frente al candidato: 16 documentos, 114 páginas rasterizadas a 110 dpi, las 114 modificadas respecto a su página de referencia. Se revisaron planchas con todas las páginas, con mediciones PDF específicas en Architecture Book. Las figuras, composición, recortes y pies se contrastaron en ES/EN. Revisión independiente del propietario y prueba física de escala siguen pendientes. Comparativa por página en `evidence/revision-visual/v1.4/comparativa.json`.

**H08**. Recuento de 68 archivos en Git público en `master@8525025` confirmado por árbol Git. `.vercelignore` en ese pin excluye `labs/`; no declara la carpeta VIS de raíz. Esto acredita exposición en Git y alcance de la configuración examinada, no accesibilidad HTTP real. Se mantiene el inventario anterior. Revisión de derechos, aislamiento y posible exclusión en deploy requieren decisión independiente. La inspección del paquete confirmó cero archivos VIS y la huella íntegra del mandato v1.2.

## Reconciliación de la fuente recuperada v1.2

| Secciones | Correspondencia vigente | Deuda explícita |
|---|---|---|
| §0–2, §4 | Taxonomía preservada en `catalogo-entrega.cjs` y `recetas.cjs`. Autoridades de proyecto, revisión y módulos; A06/ST07 muestran los grados de los cuatro pilares. | Dibujo vivo conserva fotograma auténtico, sin exportación de su transformación. Visita interactiva sigue fuera de la entrega offline. |
| §3 | H01–H08 en `reports/13` y actualización H08 de este registro. A25/A26 solo diagnóstico. | Reproducir la carrera de B1 en producto y cambios del comparador, con GO de E2. |
| §5 | Capas editoriales y trazabilidad en N02/N03/N07. Revisadas las 114 páginas distribuidas. | D08 del propietario y escala de impresión física. |
| §6 | Composición y selección por snapshot. Economía de comparación cotejada en PDF con cifras canónicas de fixtures. | La paridad HTML/PDF de cada estado se comprobó en las fixtures. Falta un ZIP de prueba por estado comparativo. |
| §7 | Procedencia y licencias en `reports/01` y `vendor/PROCEDENCIA.md`; revisión diferencial de skills fijadas. | Sin licencia declarada para redistribuir la fuente de producto usada en N04. |
| §8 y §12 | Cortes y rollback en `reports/11`; decisiones D1–D7 heredadas. | E2–E7 solo plan. H08 y aceptación humana requieren decisión del propietario. |
| §9–11 | Matrices H/A/D/ST heredadas, pruebas de recetas, exportación, motor, paquetes y reconstrucción. | Evaluación completa por navegador y escala indicada en RP-Q. |
| §13 | Fuente maestra y anexos versionados con huella, archivos, procedencia y grado de evidencia registrados. | Las referencias de auditoría de producto son lectura histórica salvo revalidación declarada. |

Entorno del candidato: Ubuntu 24.04 en contenedor local, Node 24.20.0, Playwright 1.63.0 con Chromium 1243, Poppler 24.02, ffmpeg 6.1.1, Python 3.12.3 con Pillow 12.3.0 y pypdf 6.17.0. Linux se eligió para conservar los contratos Info-ZIP, Poppler y shell de la receta existente.

## RP-Q del candidato congelado

Registro de composición SHA-256 `5c4dcb1546b724569614b01a0ab4a9a9ae36dd9ec84c786dc75837144d5a596b`. Snapshot `fcb6e19f07cd69c7a757fa2a16cb229f62a6d3b8bae29cb358041e7fb071b390`.

| Gate | Resultado y prueba | Limitación |
|---|---|---|
| RP-Q01 · Taxonomía | EXECUTED_PASS. 21 claves, tres familias, cinco documentos, diez módulos, siete modalidades, cinco Story, seis perfiles y tres fases. `evidence/recetas/recetas-qa.json`. | Ejes de catálogo de laboratorio. |
| RP-Q02 · Selector | EXECUTED_PASS. 117/117 en la suite de recetas. 24 exportaciones L, más rechazo ES/EN de las nueve C/F. RP07 verifica identidad y todo el inventario entre adaptador y UI. | Las L parciales enumeran sus fuentes ausentes. |
| RP-Q03 · Autoridad | EXECUTED_PASS para selección y exportación lab. Revisión cruzada, plan ajeno, fuente obsoleta, campos opcionales ausentes y 72/72 del exportador. | H03/B1 y mutaciones de producto corresponden a E2. |
| RP-Q04 · Architecture Book | EXECUTED_PASS. Índice, destinos internos y tipografía efectiva ES/EN, anchos a partir del modelo, cajetín y avisos. | Escalas estimadas. Medición en impresión física pendiente. |
| RP-Q05 · FF&E | EXECUTED_PASS. Oráculo 46/40, fichas ES/EN y extremos 1/50/200/500. | Categoría instalados y catálogo comercial sin fuente demostrada en el caso. |
| RP-Q06 · Comercial | EXECUTED_PASS en 12 pares HTML/PDF de fixture sobre seis escenarios. RP07 queda sin importes, incluido el inventario físico. | Pendientes ZIP por cada escenario comparativo, publicación comercial y redistribución del núcleo N04. |
| RP-Q07 · Estados | EXECUTED_PASS. 23/23 en `evidence/estados/estado-qa.json`. Dos preparaciones concurrentes en el exportador y negativos de obsolescencia/integridad. | Emisión simulada y rotulada. |
| RP-Q08 · Conciliación | EXECUTED_PASS para contratos y negativos RP13–RP21 en laboratorio. A25/A26 tienen registro de diagnóstico anterior, sin ejecución de E2 en este corte. | Comparación informativa y alcance C/F preservados. |
| RP-Q09 · Diseño y accesibilidad | 114 páginas ES/EN revisadas por el agente. Los cuatro perfiles de marca se recompusieron ES/EN sin problemas de composición. Ver matriz de navegador y ZIP exacto. | Aceptación humana y dispositivos físicos pendientes. Reflujo al 200 % emulado. |
| RP-Q10 · Exportación y seguridad | Suites 72/72 exportador, 11/11 motor y verificadores de los ZIP exactos. Prueba CONT-01 sin adaptador devolvió 1. Los ZIP ES/EN incluyen sus manifiestos y tienen digest externo. | Revisión de propietario H08 sobre el banco Git. |
| RP-Q11 · Impacto | EXECUTED_PASS del mapa. 21 recetas, 105 archivos comunes con huellas, 12 gates, 24 artefactos de ejecución. | Las huellas de dependencias no sustituyen los ensayos ni modifican CI. |
| RP-Q12 · Continuidad | Comparativa contra `585fd9c`, dos reconstrucciones intermedias y comparación final archivada de forma externa al ZIP. | Evidencia y acta posterior al empaquetado en el cierre de distribución. |

La comprobación final añadió cobertura sobre los rótulos ingleses de contacto y tipo en el PDF. El ajuste modificó 12 páginas de Architecture Book en inglés. Los otros 102 raster no cambiaron.

Los informes 12 y 13 conservan la matriz D01–D18/ST01–ST09 y el registro acumulativo H01–H08/A01–A29. La tabla anterior actualiza la cobertura del laboratorio. H01/H02, H03, H06–H08, D02 de producto y ST01 de producto conservan su ámbito y condiciones de fase. D08 del propietario, dispositivos físicos D09, publicación D15 y PDF/A D18 permanecen fuera de lo acreditado aquí.

**Separación de salida**. Auditar el candidato de laboratorio con los archivos y huellas de distribución. La aceptación visual humana, la aprobación documental de producto y las decisiones H08 y E2 requieren al propietario. La fiscalidad, la ejecución de obra y la relación contractual quedan limitadas a sus fuentes y al estado declarado.

### Navegadores y ZIP exacto

| Navegador emulado | Resultado | Evidencia |
|---|---|---|
| chromium 153.0.8010.12 | EXECUTED_PASS, 14/14 paquetes y 70 aperturas | `evidence/consumidor/v1.4/chromium.json` |
| firefox 155.0 | EXECUTED_PASS, 14/14 paquetes y 70 aperturas | `evidence/consumidor/v1.4/firefox.json` |
| webkit 26.6 | EXECUTED_PASS, 14/14 paquetes y 70 aperturas | `evidence/consumidor/v1.4/webkit.json` |

Firefox comprobó alcance y retroceso de foco en su perfil de prueba. WebKit reproduce los vídeos con gesto real. La secuencia parte del documento para alcanzar también los enlaces anteriores al vídeo. El menú envuelve sus enlaces en todas las anchuras, el encabezado estrecho va con el documento y el desplazamiento del foco es inmediato. Se corrigieron así las dos causas observadas de foco fuera de pantalla.

Los ZIP exactos ES/EN pasaron bajo Chromium en seis configuraciones por idioma, incluido reflujo 200 % emulado (720 CSS px a escala de dispositivo 2). Sin recursos externos, medios rotos, enlaces internos rotos, errores o desborde horizontal en esa prueba. Ver `evidence/paquetes/navegador-v1.4-{es,en}.json`, con SHA-256 de cada ZIP. `decodificacion-v1.4.json` acredita los dos MP4 completos mediante decodificación, además de su reproducción medida en los tres navegadores.

Chromium registró apertura p50 de 86–103 ms y p95 de 88–125 ms, 10 repeticiones por configuración e idioma. Exportación de 14 modalidades/idiomas: p50 5.64 s y p95 9.34 s. Muestras del contenedor Linux, sin SLA ni comparación de velocidad entre entornos.

**Dictamen**. Candidato apto para revisión independiente del laboratorio con sus límites declarados. D08, H08, escala de impresión física, dispositivos reales y GO de producto siguen pendientes. La paridad HTML/PDF económica se acredita en fixtures ES. La equivalencia comparativa por estado en ZIP y la redistribución del núcleo no están acreditadas.

## Distribución verificada

Candidato empaquetado `26297e7b67b7c3c497ce3761b5bbf3f72f0b61da`. Este registro posterior al empaquetado se publica por separado para evitar autorreferencias. Los ZIP ES/EN que se abrieron sin red son byte a byte los mismos que se entregan.

| Archivo | Bytes | SHA-256 |
|---|---:|---|
| `entrega-vivienda-de-ejemplo-en.zip` | 12631551 | `5e469df638a2894c13149b08b0cbafcdb45c241d1b6ee355c9b1922e8ac21ef4` |
| `entrega-vivienda-de-ejemplo-es.zip` | 12629937 | `e689d0eeb64408c8c1583e215ea72999a001c8435bc7c719653babb24a53dd21` |
| `rubik-studio-presentation-lab.zip` | 143441943 | `b27fab2e032d5253aa29cd88ae3985a3c6d9da3b4cb33636ab035aeceb8b64a2` |
| `entrega-vivienda-de-ejemplo-en.digest.json` | 509 | `3172e536aef2481210cff1b46be1be289f5e0b41961641a19874e54efd24d527` |
| `entrega-vivienda-de-ejemplo-es.digest.json` | 516 | `eebc5bb7ca997622840081a1002aed336808c1e0a629c2e505d7151755cb9690` |

El ZIP del laboratorio tiene 523 archivos, cero referencias VIS y el mandato v1.2 con su huella original. La inspección no obtuvo bloqueos. Los avisos corresponden a la fecha del vídeo original, contactos sintéticos de negativos y patrones citados por el inspector. Las dos reconstrucciones limpias pasaron en Ubuntu 24.04. Inventarios y 20 medios exactos, QA a cero, mismo snapshot e idiomas. Las 42 rutas PDF (incluidas copias) coinciden en fichero salvo fecha interna, texto, número de páginas y raster a 110 dpi. Ver `evidence/paquetes/RECONSTRUCCION-v1.4.json` y `SHA256SUMS-v1.4`.

La revisión editorial del agente abarcó las 114 páginas distribuidas. La aceptación independiente del propietario queda pendiente.
