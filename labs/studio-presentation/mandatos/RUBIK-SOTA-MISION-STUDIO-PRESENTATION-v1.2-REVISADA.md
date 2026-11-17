# RUBIK SOTA — Misión Studio Presentation

**Especificación maestra de producto, diseño, implementación y QA**  
**Versión:** 1.2 · **Fecha:** 17/11/2026 · **Revisión de continuidad auditada sobre v1.1 y el laboratorio E0/E1**  
**Estado:** PROPUESTA DE CONTINUIDAD Y CIERRE PARA APROBACIÓN DEL PROPIETARIO. No autoriza E2 ni publicación.  
**Ejecutor Studio:** Claude Code. Codex conserva consolidación #243/#244, GOV-08 S3, estabilidad y CI inteligente. ChatGPT audita independientemente; propietario decide. Un responsable por corte; no intercambiar ramas.  
**Repositorio de producto:** [Juanmaes83/floorplan-3d](https://github.com/Juanmaes83/floorplan-3d)  
**Nombre de trabajo:** RUBIK Studio Presentation. No constituye un nuevo ID, piedra SCULPT ni ola.

> Este documento define la misión y sus criterios de aceptación. Su entrega al agente no autoriza por sí sola cambios en Production, merge, push, uso de proveedores, gasto, publicación de datos ni instalación indiscriminada de dependencias. Cada corte requiere su GO explícito y mantiene los límites del catálogo maestro. Las autorizaciones ya acreditadas (laboratorio, decisiones D1–D6, tres generaciones D7 ya consumidas) no se solicitan otra vez ni se amplían por inferencia. Se permite cerrar el laboratorio en el alcance vigente; toda integración nueva requiere GO. El mandato operativo actualizado está en §11.

## 0. Decisión rectora: evolucionar el producto existente

RUBIK ya tiene cinco áreas profesionales: Diseñar, Analizar, Presupuestar, Entregar y Mi estudio. Ya existen perfiles de marca, personalización por proyecto, cuatro estilos de dossier A4, cinco plantillas de presentación profesional, lámina SVG a escala, ficha de superficies, dossier económico, material board, imágenes configurables, archivo HTML de cliente, publicación y retirada, visita 3D y expediente/entrega de Evolución 4D. No crear un segundo Studio, un segundo gestor de marca, otro dossier general ni otro sistema de publicación. «Studio Presentation» es únicamente el nombre de esta misión transversal, no una nueva pantalla principal ni un nuevo producto.

**REGLA DE ORO DEL PROPIETARIO: TODO LO QUE RUBIK ENTREGA ES VERAZ Y PROCEDE DE LOS DATOS DE SU PLATAFORMA. NO INVENTAMOS NADA.**

La estética nunca modifica ni completa datos de dominio. El origen debe ser el proyecto y la revisión correctos, las mediciones y presupuestos canónicos, las vistas y materiales disponibles, el plan validado o datos expresamente aportados y confirmados por el profesional. Una fotografía, render ilustrativo, referencia estética o simulación no acredita geometría, obra ejecutada, SKU ni características reales. Los datos ausentes se omiten o rotulan según contrato; datos orientativos, aproximados, declarados, sin revisar y no disponibles permanecen diferenciados. No presentar como verificado aquello que solo se ha declarado. Ninguna plantilla, IA, skill o motor de PDF puede alterar estas reglas. Cero fallos de esta regla son tolerables, incluso si implican reducir el impacto visual o impedir una entrega comercial.

La misión mejora lo que ya existe y añade únicamente capacidades acreditadas como ausentes o insuficientes. El agente debe demostrar el delta de cada corte frente al producto existente.

## 1. Objetivo y meta de producto

Transformar el trabajo que el profesional realiza en RUBIK —planos, modelos 3D, variantes, revisiones, visualizaciones, materiales, mobiliario, mediciones, presupuestos y planificación— en una propuesta profesional que pueda revisar, personalizar, presentar y entregar al cliente.

**Meta:** pasar de un plano de entrada a una propuesta de proyecto diseñada, visualizada, presupuestada y comunicada con la calidad editorial de un estudio profesional. No se trata de crear otro editor gráfico genérico, otro motor de presupuesto ni un segundo producto independiente.

Resultados esperados:

- Elevar la calidad percibida, la claridad y la confianza de los entregables.
- Hacer comprensible la transformación del espacio mediante comparaciones, vistas y anotaciones verificadas.
- Facilitar la decisión comercial del cliente, sin falsear presupuestos, plazos o características.
- Permitir desde una sola lámina hasta un dossier integral, con secciones elegibles.
- Personalizar la comunicación de cada estudio sin alterar los datos canónicos del proyecto.
- Reutilizar e integrar de forma incremental las capacidades de RUBIK, sin dependencias innecesarias.
- Conseguir un flujo local, reproducible, accesible y comprobable antes de habilitar entregas públicas.

Son objetivos de producto, no promesas de ventas, monetización ni certificación técnica.

**Experiencia narrativa de referencia:** «Del dibujo a la casa»: dibujo vivo → modelo medido (o estimado, según calibración) → ambiente IA orientativo → evolución prevista → recorrido → decisiones → documentos → procedencia. La narrativa no impone mostrar pilares o módulos ausentes ni sustituye las cinco tipologías de documento.

## 2. Alcance funcional: qué queremos poder entregar

### 2.1 Tres familias visuales, cinco tipos de entregable

| Familia | Tipos de entregable | Dirección de diseño | Referencias iniciales |
|---|---|---|---|
| Técnica / Architecture | Architecture Book; lámina comparativa | Retícula precisa, planos vectoriales, cotas disponibles, escalas acreditadas, cajetín y leyendas | VIS-01, 06, 08, 11, 14 |
| Editorial / Interior Design | Interior Design Book; Materials & Furniture Book | Fotografía o visualización protagonista, ritmo editorial, texturas, paletas, fichas FF&E, tipografía cuidada | VIS-02, 04, 07, 09, 10, 13 |
| Comercial / Commercial | Commercial Proposal; Real Estate Presentation | Objetivos, alcance, alternativas, coste comprensible, condiciones y próximos pasos | VIS-03, 05, 07, 09, 12, 13 |

La misma revisión y los mismos datos deben producir las tres familias sin divergencias. Las familias son estilos; los tipos de entregable son combinaciones de módulos, no cinco motores.

### 2.2 Biblioteca de diez módulos

| Módulo | Contenido y condiciones |
|---|---|
| 01 Portada | Título, proyecto, estudio, cliente opcional, fecha, revisión e imagen autorizada. |
| 02 Concepto y objetivos | Texto redactado por el profesional, necesidades y alcance; nunca inventar un encargo. |
| 03 Estado actual | Planos, superficies y fotografías existentes con procedencia. |
| 04 Nueva distribución | Planos de propuesta y comparación de revisiones/variantes vinculadas. |
| 05 Transformación 3D | Axonometrías o vistas equivalentes, anotaciones revisadas y cambios reales. |
| 06 Visualizaciones | Vistas 3D existentes, render disponible y fotografías debidamente rotuladas; no generar por defecto. |
| 07 Materiales y mobiliario | Paleta y fichas FF&E, SKU, fabricante, cantidades y licencia solo cuando consten. |
| 08 Propuesta económica | Partidas, capítulos, mediciones, unidades, precios, IVA, exclusiones y diferencias según motor canónico. Honorarios e inmueble separados de ejecución. |
| 09 Planificación | Fases, cronograma y fechas disponibles de la misma revisión; si no hay plan válido, omitir o indicar ausencia. |
| 10 Entrega y próximos pasos | Contacto, condiciones aportadas por el profesional, revisión y enlace únicamente si existe una publicación autorizada. |

Cada plantilla deberá soportar módulos opcionales y ausencia de datos sin espacios rotos ni contenido fabricado. Un dossier de una página y uno largo deben ser posibles sin alterar la fuente de datos.

### 2.3 Experiencia de usuario objetivo

El flujo se apoya en «Mi estudio» para perfiles, identificación y preferencias editoriales reutilizables, y en «Entregar» para preparar y revisar los documentos del proyecto. Mantener «Firmar con», la navegación profesional, los accesos a lámina, imágenes, presentación, dossier y archivo de cliente y las opciones existentes. Ampliar la interfaz `FloorPlanDossier` y evaluar la integración de ENT-04 en ella o como variante comparativa vinculada desde la misma área, sin duplicar generadores. La ubicación exacta del comparador requiere decisión UX con evidencia.

Flujo: proyecto/revisión actual → comparación cuando proceda → estilo existente/evolucionado y módulos elegibles → identidad seleccionada en Mi estudio → previsualización → verificación → descarga → publicación solo con consentimiento y gates ya existentes. Mantener intactas las otras rutas.

La marca ya contiene nombre comercial, responsable, logo, email, teléfono, web, lema, título e introducción. Añadir, si se aprueban, tokens de color con contraste, opciones tipográficas y preferencias de plantilla/formatos en el sistema existente. No crear un gestor de marca alternativo ni migrar almacenamiento a IndexedDB solo porque Papora lo usa. A4 ya existe en impresión; horizontal, A3 documental y paginación avanzada requieren medición y pruebas. La lámina técnica A3 con escalas ya existe, conservarla. No confundir formato físico, captura PNG, presentación 16:9 y escala real.

Mantener los campos profesionales editables separados de la autoridad del modelo; textos redactados por el profesional se identifican como tales. La versión guardada de una entrega no cambia al cambiar el perfil del estudio. Proponer migración compatible y reversible solo para preferencias nuevas.

### 2.4 Cuatro pilares multimedia: requisitos y límites

| Pilar | Objetivo de producto | Punto de partida acreditado o declarado en laboratorio | Gate de aceptación |
|---|---|---|---|
| Evolución de obra FT3D-8 | Integrar fases, Gantt, estado 3D, hitos, vídeo, expediente y economía únicamente cuando estén vinculados | Exportación mediante ruta biblioteca; plan de ejemplo adaptado tras rechazar 45 vínculos incompatibles. Nivel orientativo, no calendario contractual. | Identidad de proyecto/revisión/plan, vínculos validados, procedencia, distinción previsto/ejecutado, no fabricar relación económica, DEC-05 para remoto. |
| Hybrid V2 · Dibujo vivo | Secuencia narrativa auténtica del dibujo a la geometría; fotogramas, imagen y vídeo cuando el producto lo permita | Fotograma auténtico del lienzo; grabador convencional produce recorrido 3D, no conserva Dibujo vivo. | Exportación específica demostrada con estados y frames verificables, restauración del modelo/cámara, rendimiento en GPU/dispositivo; no vender captura QA como función. |
| Render IA | Visualización ilustrativa revisada, con vista de origen exacta conservada, receta, revisión y proveedor/consumo cuando estén disponibles | Tres generaciones autorizadas ya efectuadas; dos coincidencias visuales por miniatura y una misma estancia sin imagen exacta de origen. El salón añade contenido ajeno al encuadre. | Vincular bytes/hash de entrada y salida, cámara/estancia, revisión, fecha, estilo, modelo/consumo/coste si la API los acredita; distinguir estimado de facturado; advertencias y revisión profesional; cero nuevas llamadas con coste sin GO. |
| Visita inmersiva ENT-01 | Navegación real de cliente, minimapa y recorrido en contexto; complementar la entrega documental | Vista previa local; hoy la carpeta del laboratorio solo ofrece vídeo, no visita interactiva. Restricciones de plantas y PointerLock (clic del minimapa tras Esc). | Probar navegación, accesibilidad, control de minimapa, alcance y minimización; offline no implica visita interactiva; remoto solo con autorización y seguridad. |

### 2.5 Taxonomía y modalidades de entrega

Mantener separadas tres familias gráficas, cinco tipos de documentos editoriales, diez módulos documentales (§2.2), cinco perfiles Story existentes y siete **modalidades de entrega** demostradas en el laboratorio: primera reunión, propuesta comercial, dossier técnico, interiorismo, inmobiliaria, explicación constructiva y documentación integral. No crear IDs del catálogo ni confundir modalidades con plantillas o motores. Cada modalidad es una selección/preset de piezas elegibles del mismo snapshot. Mapear los once capítulos web del laboratorio a los diez módulos de origen (p. ej., decisiones/documentos/procedencia al módulo 10; recorrido/dibujo a 05–06; obra a 09). No deducir que todas las modalidades cubren todos los módulos. Identificar contenidos obligatorios, dependencias entre documentos y medios, y contenido interno no exportable.

El Architecture Book es distinto de una lámina: en el inventario `out/v3` verificado aparecen `architecture-sheet.pdf` y `architecture-sheet-strip.pdf`, no un libro técnico multipágina explícitamente identificado. Mantenerlo como alcance pendiente de evidencia o decisión expresa, no darlo por entregado por equivalencia. Lo mismo aplica a Story interactivo y los módulos no demostrados.

## 3. Estado de partida, autoridad y fuentes

Fotografía GitHub consultada directamente el 17/11/2026; volver a consultar en cada inicio de corte.

| Ref | SHA comprobado | Estado |
|---|---|---|
| `master` | `403e6b74c95a81e23c17badb276abeca9f8c3fd1` | 4/4 checks correctos; incorpora #245 |
| #243 | `47cfcd1f2e630929f4b353f5242eb81e5f446503` | Abierta, draft, base `403e6b7`; 55/91 correctos, 7 en curso, 29 en cola |
| #244 | `28a01b0b0195593d966729d385ab97d32bc16c6c` | Abierta, draft, base `403e6b7`; 48/92 correctos, 13 en curso, 31 en cola |
| #245 | `bcd9692bd6b8d89adeec4246a145230f55358b3e` | Fusionada; merge `403e6b7` |
| `lab/studio-presentation-e0e1` | `97d3eac3536b633f7df5b72c56ef8a7800c8012a` | Laboratorio publicado en GitHub, sin PR de integración |

Sin fallos ni cancelaciones en los checks consultados de #243/#244; son cifras temporales. No equivalen a aceptación de seguridad ni a autorización de merge. Catálogo v1.10 vigente en master, v1.11 candidata (98 IDs, HOM-04; CAT-04 alias de trabajo, no nuevo ID). Consolidación y preview aislado S3 quedan en Codex. No afirmar validación aislada ni SHA de Production sin evidencia.

La auditoría estática original se conserva en §3.2 con su base histórica `f31f3031399384049b93966449dcd438957c2abd`; los motores se estudiaron inicialmente en `40b4ae5d724ef83d0e70651545b4f5e4832becd3`. El laboratorio parte de `f31f303`. Para E2 partir del master efectivo consolidado, no fusionar la rama completa de laboratorio.

Fuentes inmutables: [master](https://github.com/Juanmaes83/floorplan-3d/commit/403e6b74c95a81e23c17badb276abeca9f8c3fd1), [#243](https://github.com/Juanmaes83/floorplan-3d/pull/243), [#244](https://github.com/Juanmaes83/floorplan-3d/pull/244), [#245](https://github.com/Juanmaes83/floorplan-3d/pull/245), [HEAD laboratorio](https://github.com/Juanmaes83/floorplan-3d/commit/97d3eac3536b633f7df5b72c56ef8a7800c8012a).

### 3.1 Autoridades del proyecto

- [Catálogo maestro vigente](https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/product/rubik-catalogo-maestro-mejoras-2026-11-09.md): IDs, nombres, olas y dependencias.
- [Estado maestro candidato #243](https://github.com/Juanmaes83/floorplan-3d/pull/243): evidencia de estado a su corte, pendiente de integración. Consultar la versión vigente al inicio.
- [Acta UX-07/ENT-04](https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/qa/ux07-ent04-integracion-master-20261113.md): contratos, pruebas, seguridad y límites.
- [Banco visual oficial de la misión](https://github.com/Juanmaes83/floorplan-3d/tree/master/REFERENCIAS%20VISUALES%20ENTREGA%20CLIENTE%20DISE%C3%91O%20EDITORIAL) y sus [criterios](https://github.com/Juanmaes83/floorplan-3d/blob/master/REFERENCIAS%20VISUALES%20ENTREGA%20CLIENTE%20DISE%C3%91O%20EDITORIAL/README.md).
- Decisiones explícitas posteriores del propietario prevalecen. No cerrar una mejora ni cambiar de ola por inferencia.

### 3.2 Auditoría directa de implementación (master@f31f303)

Fuente de esta sección: lectura estática de archivos de GitHub en el SHA indicado, tests existentes y capturas históricas de QA. No se ejecutó el navegador ni se publicaron enlaces durante esta auditoría. Los tests listados son evidencia de cobertura diseñada, no resultados de una nueva ejecución. Verificar funcionamiento y SHA de producción antes de afirmar que una capacidad está acreditada en ese entorno.

| Sistema existente | Código y lo confirmado | Delta de esta misión |
|---|---|---|
| Mi estudio y navegación | [`professional-workspace-ui.js`](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/js/professional-workspace-ui.js#L191-L209): cinco áreas, identidad por proyecto, perfiles, preferencias, vista previa de lámina firmada; `catalog-ui.js` añade Mis catálogos local. | Ampliar preferencias editoriales y conectar plantillas a la identidad actual. No segunda navegación ni perfil paralelo. |
| Identidad profesional | [`brand-core.js`](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/js/brand-core.js#L10-L72), `brand-ui.js`: hasta 12 perfiles, logo PNG normalizado (máx. 300 KB), contacto, lema, título, introducción. `rubik-sota-brand-profiles-v1` y `rubik-sota-brand-delivery-v1`; snapshot `{profile,title,intro,takenAt}` vinculado a `entryId`. | Extensión compatible de tokens y preferencias; no confundir perfiles locales con cuentas o aislamiento multiusuario. |
| Entregar | [`professional-workspace-ui.js`](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/js/professional-workspace-ui.js#L92-L150): documentación, experiencia del cliente, seguimiento, identidad, tarjetas y previsualizaciones reales. | Reorganización incremental si hace falta, mantener rutas y salidas actuales. |
| Dossier general | [`project-dossier-ui.js`](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/js/project-dossier-ui.js#L14-L29), `css/project-dossier.css`: cuatro estilos `technical`, `client`, `realestate`, `studio`. Secciones y orden por estilo; portada, plano, superficies, orientación, emplazamiento, exterior, vistas, observaciones, economía y fuentes según disponibilidad. Vista previa DOM e Imprimir/Guardar PDF con A4 y @page. | Evolucionar estilos existentes y ofrecer selección/orden de secciones, tokens, composición y formatos nuevos; conservar IDs, estilos y compatibilidad. No declarar que no existe PDF. |
| Lámina profesional | [`sheet-ui.js`](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/js/sheet-ui.js): SVG 1600×1100, marca, cotas, materiales, superficie, proyecto y revisión; ajuste a hoja o 1:50/100/200, hoja 420 mm de ancho compatible con A3, barra de escala y aviso si calibración estimada; rechaza plano sin calibrar a escala. | Elevar cajetín y composición sobre este SVG. Mantener medición, encuadre, avisos, y validar tamaño físico. No traer IFC solo para dibujar una lámina. |
| Ficha de superficies | `surface-sheet-ui.js`, autoridad `FloorPlanSurfaceMetrics.home`: estancias incluidas/excluidas, métricas, firma, impresión/PDF. | Mejorar lectura editorial y reutilizar misma tabla, no recalcular superficies. |
| Dossier económico C4 | [`economic-dossier-ui.js`](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/js/economic-dossier-ui.js#L29-L31), `economic-dossier-core.js`, `budget-presentation.js`: lee presupuesto guardado de `FloorPlanBudgetUI.current`, `buildReport`, vistas profesional/cliente; imprime, CSV, JSON, BC3 cuando disponible; página compacta en dossier general. | Maquetación, consistencia y trazabilidad de revisión; preferir misma salida canónica y mismos estados. No nuevo motor de precios ni editor de presupuesto. |
| Presentación 3D y Story FT3D-6 | [`presentation-templates-core.js`](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/js/presentation-templates-core.js#L28-L64), `presentation-templates-ui.js`, `presentation-story-core.js`, `presentation-ui.js`: cinco perfiles (`real-estate`, `developer`, `architecture`, `renovation`, `interior-design`), opciones manuales y por sesión, selección de estancias, sección, alzado, axonometría, despiece, sol orientativo, estados supported/partial/unavailable y avisos. Recursos/salidas recomendadas no acreditan que toda función recomendada esté disponible. | Reutilizar el resolvedor de capacidades y su semántica para narrativa visual; mejorar salida editorial hacia cliente sin sustituir Story, cámaras ni plantillas. |
| Imágenes y vistas | [`delivery-image.js`](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/js/delivery-image.js#L1-L35), `project-views-ui.js`: 1600×1000 / 1080×1350, composiciones banda/cabecera/lateral (lateral solo horizontal), firma y datos disponibles; vistas de proyecto con clave entryId/projectId/revisión/planta que caducan al cambiar fuente. | Reusar imágenes y mejorar variantes editoriales, preservar aspecto, procedencia y obsolescencia. No crear un segundo exportador de imágenes. |
| Material board y catálogos | `moodboard-core.js`, `moodboard-ui.js`: colores, suelos, paredes y mobiliario del proyecto; previsualización y descarga PNG del mismo canvas. `catalog-ui.js`, `catalog-placement-core.js`, `catalog-budget-core.js`: piloto local, fichas/revisión/fuente, asociación SKU/precios según reglas. | FF&E multipágina y fichas con fuente, revisión, cantidad y precio únicamente si existen. No certificar similitud visual como SKU. |
| Estudio de imágenes | `visual-reform-ui.js`/`visual-reform-core.js`, `tests/visual-studio.browser.test.cjs`: CAT-01/FOT-01 simulación etiquetada, referencias, zona, revisión y coste bloqueado; aceptable en prueba no implica entregable (simulación no descargable como imagen de cliente). Distinguirlo de Mi estudio. | No activar generación real, no convertir muestras de simulación en entregables. ENT-05 con gates. |
| Archivo cliente B1 | [`client-share-ui.js`](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/js/client-share-ui.js#L87-L110): compone estilo `client` del dossier, incrusta recursos, añade formulario de observaciones JSON, versión y CSP; HTML local sin necesidad de red ni proyecto editable, scripts internos controlados. | Preservar este contrato y su funcionalidad; incorporar estilos/módulos solo después de validar privacidad y consistencia. No aplicar a B1 la prohibición de scripts del ENT-04 estático. |
| Publicación y visita | `share-link-ui.js`, `api/share.js`, `api/unshare.js`, `api/view.js`, `api/delivery.js`, `client-delivery-core.js`, `delivery-client.js`, `delivery-preview-ui.js`: publicación consentida, código independiente de Render IA, registro local, retirada; visita/snapshot de alcance mínimo. | No tocar la rama S3. Integración de dossier nuevo solo con gates de seguridad y alcance acreditado. La vista de prueba local no es publicación. |
| Expediente y entrega de Evolución 4D | [`evolucion/dossier-ui.js`](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/evolucion/dossier-ui.js), `construction-dossier-core.js`, `evolucion/delivery-ui.js`, `construction-delivery-core.js`: expediente con proyecto/presupuesto/plan/vínculo/marca y huellas, video/presentación de obra prevista; toma identidad de Mi estudio en ruta biblioteca y conserva snapshot. | Módulo de planificación ligado a autoridad/revisión, reutilizar video y entrega existente. No simular obra realizada ni sustituir expediente. |
| Antes/después ENT-04 | `revision-compare-core.js`, `revision-budget-core.js`, `before-after-dossier-core.js` (1.1.0), `variants-compare-adapter.js`, `labs/ux07-ent04/`; comparación por IDs, estados económicos, HTML estático y manifiesto con compatibilidad 1.0.0. | Activación de comparador y dossier dentro de flujo profesional existente; aprovechar su contrato, no confundirlo con el dossier general que sí está activo. |

### 3.3 Hallazgos originales H01–H08: reconciliar, no reiniciar E0

| Hallazgo estático / cuestión | Evidencia y prueba exigida |
|---|---|
| H01. Inventario de dossier no expone `economic` en `contents().sections`, aunque `render` incluye página económica si existe presupuesto; las etiquetas de tarjeta deben reconciliarse. | `project-dossier-ui.js:25–29, 74–75`; `professional-workspace-ui.js:124–130`. Reproducir con y sin presupuesto y verificar contador, leyenda y PDF. Es una inconsistencia de código, no incidente confirmado en producción. |
| H02. Cabecera económica parece leer `brand.name` de un snapshot con forma `{profile,...}`. | `economic-dossier-ui.js:78`, `brand-core.js:64–67`, `brand-ui.js:snapshot()`. Probar marca elegida vs ninguna en dossier C4 e impresión; usar contrato de marca existente si se confirma defecto. |
| H03. Dossier general usa estado vivo y varias lecturas de presupuesto/vistas; B1 compone DOM y después realiza pasos asíncronos antes de construir metadatos. | `project-dossier-ui.js:25–38,74–78`, `client-share-ui.js:87–108`. Riesgo a comprobar, no prueba de mezcla: congelar identidad/revisión, simular cambio de fuente durante preparación e impedir que se genere una entrega inconsistente. |
| H04. Paginación actual A4 con bloques `break-inside:avoid`, `break-after:page`; no hay evidencia nueva de tablas de 500 filas o formatos vertical/horizontal arbitrarios. | `css/project-dossier.css:35`. Generar PDF real desde baseline; comprobar texto, clipping, cabeceras, filas, márgenes y continuidad. No declarar que PDF falta. |
| H05. Diferencia de contratos HTML: ENT-04 sin scripts; B1 con scripts propios controlados y CSP para observaciones. | `before-after-dossier-core.js:135–149`, `client-share-ui.js:87–108`. Mantener verificadores distintos; nunca relajar `verify` para paginación. |
| H06. Comparación presupuestaria no equivale a revisión persistida: DEC-07 identifica límite histórico, la coincidencia de cantidades no equivale a certificar revisión. | Acta UX-07/ENT-04 y avisos en documento de laboratorio. Preservar advertencias, no inventar relación histórica; contrastar estado actual antes de modificar. |
| H07. Los colores/tipografía corporativos personalizados no figuran en el esquema de marca examinado, mientras existen colores por estilo y layouts de imagen. | `brand-core.js:30–32`, `css/project-dossier.css`, `delivery-image.js`. Auditar otras personalizaciones antes de ampliar; preservar formatos/estilos ya elegibles. |
| H08. Riesgo de referencia pública y atribución; 64 imágenes, 49 únicas en el corte anterior, sin licencias comerciales acreditadas. | Banco visual y `.vercelignore`. Verificar exposición y autorización, no incorporar al producto ni borrar originales sin GO. |

La tabla anterior recupera los enunciados exactos que faltaban a Claude en el informe 09. Conservarlos y añadir estado/evidencia por hallazgo, distinguiendo laboratorio, producto, hipótesis y fix. H01/H02: inconsistencias reportadas, mejoras de maquetación del laboratorio no arreglan master. H03: probar carrera durante preparación asíncrona; no dar por cerrado por un snapshot estático. H04: el handoff de continuidad atribuye la incidencia de carga CSS observada al harness Playwright; separar esa incidencia de la cobertura de paginación real, y no afirmar un defecto confirmado en Production. H05: preservar explícitamente las dos clases de HTML. H06: DEC-07, conservar advertencias; no inferir revisión a partir de cantidades. H07: no equiparar uso del logo a preferencias de color/tipografía completas. H08: licencias, exposición y trazabilidad; la exclusión `labs/` de `.vercelignore` no excluye el banco visual de raíz. No corregir código de producto en el cierre E0/E1.

### 3.4 Evidencias y regresiones que ya existen

- [`tests/professional-workspace.browser.test.cjs`](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/tests/professional-workspace.browser.test.cjs): navegación, identidad, accesos, no mutación del modelo.
- [`tests/brand.browser.test.cjs`](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/tests/brand.browser.test.cjs) y `brand-core.test.cjs`: perfiles, logo, sanitización, firma SVG, snapshot conservado.
- [`tests/project-dossier.browser.test.cjs`](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/tests/project-dossier.browser.test.cjs): cuatro estilos, superficies, ausencia de imágenes inventadas, ventana de impresión, identidad y modelo intacto.
- `tests/economic-dossier.browser.test.cjs`, `economic-dossier.test.cjs`, `budget-presentation.test.cjs`: no guardar desde C4, igualdad de cifras y exportaciones, estados IVA, informe profesional/cliente.
- `tests/sheet.browser.test.cjs`, `sheet-scale.browser.test.cjs`, `surface-sheet.browser.test.cjs`: lámina y medidas; `tests/delivery-image*.cjs`, `moodboard*.cjs`: imagen/material board.
- `tests/presentation-templates.browser.test.cjs`, `presentation-templates.test.cjs`: capacidades, selección, fallos de adaptadores y restauración del modelo y preferencias.
- `tests/client-share.browser.test.cjs`: archivo offline, ausencia de geometría editable y recursos externos, inyección y retorno de observaciones. `tests/delivery-3d-link.browser.test.cjs`, `client-delivery-core.test.cjs`, `ent01-delivery-api.test.cjs`: visita/publicación.
- `tests/ft3d-8-delivery.browser.test.cjs`, `ft3d-8-dossier.browser.test.cjs`, `construction-dossier-core.test.cjs`, `construction-delivery-core.test.cjs`: expediente y evolución.
- `tests/ux07-*`, fixture `tests/fixtures/ux07-dossier-1.0.0/`: conservar compatibilidad, seguridad y regresiones.

Capturas históricas revisadas visualmente: [gestor de marca](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/docs/qa/artifacts/premium-ux/brand/1440x900-02-brand-saved.png), [lámina firmada](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/docs/qa/artifacts/premium-ux/brand/1440x900-03-sheet-branded.png), [entrega de imagen](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/docs/qa/artifacts/delivery-image/dialog-1440.webp), [dossier comparativo de laboratorio](https://github.com/Juanmaes83/floorplan-3d/blob/f31f303/docs/qa/ux07-ent04-fase2-presupuestos-2026-11-12/evidencias/5-dossier-descargado-seccion-presupuestos-escritorio-1440x900.png). Son evidencia histórica, no capturas de una nueva sesión de Production.

## 4. Encaje con el catálogo maestro

| ID | Ola | Papel en esta misión |
|---|---:|---|
| UX-07 | 2 | Selección y comparación de revisiones, cortina, vistas equivalentes. |
| ENT-04 | 2 | Primer corte local: activar dossier antes/después y presupuesto rotulado. |
| ENT-03 | 2 | Story, plantillas, compositor modular y personalización inicial. |
| ENT-01 | 1 | Visita 3D como complemento de entrega, no como sustituto del dossier. |
| ENT-02 / GOV-08 | 1 | Caducidad, revocación, permisos, cuotas, aislamiento y ciclo de vida de publicación. |
| ENT-05 | 3 | Fichas de imágenes, materiales, versiones y leyendas de IA; depende de IMG-12 y ENT-01. |
| ENT-06 | 3 | Paquetes de entrega, lotes, ZIP, coste y cancelación; depende de IMG-04/IMG-12. |
| ENT-07 | 5 | Portal, equipos, white-label empresarial; depende de GOV-06b. |
| ECO-01 / IMG-04 / GOV-06a | 2 | Medición real, autorización de gasto y cuotas antes de generación de servicios de pago. |
| GOV-05 | Según catálogo | Marco legal y privacidad, especialmente datos de cliente, licencias y entrega pública. |

E0–E7 son cortes de trabajo internos de esta misión; no son nuevas olas. No cambiar estados del catálogo por completar un prototipo. ENT-04 no equivale a ENT-03 completo; el dossier local no acredita publicación, firma, portal ni exportación avanzada.

## 5. Banco visual y estándar editorial

En la revisión anterior se contaron 64 archivos de imagen, 49 hashes de contenido únicos y 14 referencias VIS con manifiesto. Claude declara clasificación de las 49 únicas; revisar sus JSON versionados y solo recalcular si el banco cambió por SHA o hash. El propietario puede seguir subiendo material. No repetir el inventario sin delta. Conservar originales; no borrar duplicados sin autorización. Catalogar por hash, dimensiones, procedencia, licencia, familia, composición, aplicación y exclusiones. VIS son IDs de referencia, no del producto.

Prioridad creativa: VIS-07 (dossier integral), VIS-08 (2D y 3D), VIS-09 (mobiliario), VIS-10 (materiales), VIS-11 (técnico), VIS-14 (anotaciones), VIS-01 y VIS-06 (comparación clara). VIS-02/04/13 aportan narrativa, VIS-03/05/12 aportan economía y alcance.

Estándar a construir:

- Sistema tipográfico con jerarquías, numeración, cuerpo, pies de imagen, tablas y cifras tabulares; fuentes con derechos de uso y embebido comprobados.
- Retículas, alineaciones, márgenes físicos, espacios y composición modular; no abusar de tarjetas de interfaz ni decoración genérica.
- Identidad visual RUBIK coherente con marca del estudio; contraste verificable y legibilidad por encima del color personalizado.
- Planos con proporciones correctas, grosores de línea diferenciables, leyendas y cajetín parametrizado. Escala impresa solo cuando se compruebe físicamente y se indique impresión al 100 %; no llamar «a escala» a un dibujo ajustado automáticamente.
- Imágenes con pie de procedencia: fotografía real / modelo geométrico 3D / IA ilustrativa / referencia autorizada; distinguir estado actual/propuesta. Sin estirar imágenes ni recortar información técnica.
- Capturar antes y después con cámara, encuadre, iluminación y escala comparables cuando proceda; declarar excepciones y no simular cambios inexistentes.
- Tablas largas con encabezados repetidos y sin pérdida de filas, subtotales ambiguos ni columnas cortadas. Los elementos demasiado altos requieren política explícita de continuación, no recorte.
- Cajetín: estudio, proyecto, revisión, fecha, formato, número de lámina, escala si validada, autor y estado. Campos desconocidos se omiten o rotulan como pendientes.

**Privacidad y licencias de referencias:** la carpeta está en la raíz de un repositorio público. En la revisión previa `.vercelignore` solo excluía `labs/`; comprobar exposición de referencias y proponer aislamiento/exclusión en un cambio independiente autorizado. Excluir del deploy no elimina exposición de Git ni su historial. No reproducir referencias de terceros en producto, plantillas, ejemplos exportables ni publicar material de clientes sin autorización. No redistribuir fuentes, imágenes o marcas por asumir que están licenciadas junto con código.

## 6. Arquitectura objetivo

```text
Datos canónicos RUBIK (proyecto + revisión + variantes + presupuesto + plan)
    ↓ adaptadores de lectura / comprobación de identidad y coherencia
Modelo documental común (snapshot versionado + procedencia + estados)
    ↓ reglas de elegibilidad y módulos disponibles
Evolución de FloorPlanDossier / PresentationTemplates + comparador ENT-04
    identidad de FloorPlanBrand, módulos y estilos existentes/evolucionados
    ├─ ENT-04: HTML estático verificable y manifiesto (contrato actual)
    ├─ B1: archivo de cliente con observaciones y CSP (contrato separado existente)
    ├─ Impresión/PDF existente y mejoras tras pruebas (un motor documental elegido)
    └─ Presentación 3D / publicación existentes (ampliación tras gates GOV-08)
QA documental y visual + manifiesto / trazabilidad + revisión profesional
```

### 6.1 Principios técnicos

1. Mantener el dominio puro separado de la presentación. No recalcular cifras en CSS, Typst, React, plantillas o exportadores.
2. Un modelo de datos para previsualización y exportación. Proponer un contrato versionado solo si el existente no basta, con compatibilidad comprobada. Campos conceptuales: proyecto y revisiones, relación, módulos, procedencia, economía y estado, plan, recursos, branding, formato, versión de plantilla, advertencias.
3. El snapshot es inmutable para la generación. Al cambiar proyecto, revisión, variante, presupuesto o plan, invalidar borrador y exigir nueva preparación. Los cambios estéticos no escriben en modelos ni presupuestos.
4. Mantener el HTML descargado de ENT-04 sin scripts, iframes ni recursos externos de acuerdo con `verify()`. B1 conserva su contrato de scripts propios y CSP para observaciones, sin editor ni modelo editable; no someterlo al verificador ENT-04. Cualquier script de paginación se ejecuta en el compositor controlado, no en el artefacto final. Si se transforma HTML, generar y verificar el manifiesto sobre bytes definitivos; no reutilizar hash de otro artefacto.
5. Para PDF y nuevos formatos, proponer manifiesto separado con hash de bytes, versión de plantilla/exportador, revisión y procedencia. Las huellas acreditan integridad, no veracidad ni firma digital. Evitar publicar metadatos privados innecesarios.
6. Fuentes e imágenes locales autorizadas, sin CDN, sin telemetría ni descarga de modelos en ejecución. No enviar proyectos o código a servicios de IA para diseño/QA sin autorización específica.
7. Dossier interno y entrega publicada tienen permisos y riesgos distintos; no transmitir automáticamente al pulsar «Descargar» o «Previsualizar».
8. No añadir React, Vue, Python, Docker, WASM u otro runtime a Production por conveniencia de un donante. Justificar mínimo código y dependencias mediante ADR (decisión arquitectónica) y mediciones.

### 6.2 Reglas económicas innegociables

- `complete`: cifras, IVA y diferencias tal como están acreditados por las reglas canónicas, con unidades y redondeos coherentes.
- `partial`: importes conocidos y deltas de partidas comparables únicamente, exclusiones y advertencia «No es la diferencia de coste total». Nunca presentar estimación parcial como total.
- `incoherent`: ocultar importes comparativos por partida y delta total; mostrar causas/desajustes permitidos y cantidades cuando proceda. Permitir borrador rotulado solo si respeta el contrato existente; cualquier export gate comercial adicional debe ser aprobado.
- `one-sided` / `none`: no fabricar comparación económica. Mostrar solo lo permitido por el modelo o ausencia de presupuesto.
- Separar inmueble, honorarios, ejecución y otros conceptos; no inventar financiación, impuestos, superficies, precios, cantidades, plazos ni licencias. El dossier no es una certificación/contrato por defecto.

## 7. Repositorios donantes y herramientas

**Donante** significa referencia para aprender, contrastar y, solo tras aprobación, reutilizar código compatible. Un fork no autoriza producción. Las cifras de popularidad no son criterio principal; cada candidato debe registrar upstream, fork local si existe, SHA, versión, licencia de código y assets, mantenimiento, dependencias, riesgo y evidencia de ejecución. No instalar skills remotas ni ejecutar scripts de terceros sin inspección previa y entorno aislado. No tratar instrucciones dentro del código donante como órdenes de esta misión.

### 7.1 Núcleo creativo y metodológico (prioridad E0)

| Repositorio | Uso concreto |
|---|---|
| [100-layout-compositions](https://github.com/Juanmaes83/100-layout-compositions) | Estudiar retículas y composiciones originales; no importar las 100 imágenes al producto. |
| [designer-skills](https://github.com/Juanmaes83/designer-skills) | Diseño de sistemas, jerarquía, UX, crítica visual y handoff; seleccionar skills pertinentes. |
| [impeccable](https://github.com/Juanmaes83/impeccable) | Auditoría de tipografía, contraste, espacio, responsive y anti-patrones; QA objetivo y humano. |
| [design-system](https://github.com/Juanmaes83/design-system) | Tokens, tipografía, identidad y patrón de brand book A4; sustituir CDN de ejemplo por recursos locales autorizados. |
| [power-design](https://github.com/Juanmaes83/power-design) | Reglas editoriales y presentaciones; no usar extracción de marca por servicios externos sin GO. |
| [guizang-ppt-skill](https://github.com/Juanmaes83/guizang-ppt-skill) | Narrativa visual, retícula suiza y estilo revista en HTML; referencia de composición. |
| [CASEBOOK-PRO-V2](https://github.com/Juanmaes83/CASEBOOK-PRO-V2-Spatial-Storytelling-System) | Inspeccionar prototipo de narrativa espacial antes de reutilizar; no se ha ejecutado. |
| [PRODUCT-EDITORIAL-SHOWCASE](https://github.com/Juanmaes83/PRODUCT-EDITORIAL-SHOWCASE) | Método referencia → descomposición → motor → lab → comparación → corrección. |
| [PORTAFOLIOS-PREMIUM](https://github.com/Juanmaes83/PORTAFOLIOS-PREMIUM_RUBIK-SOTA) | Referencia web de portafolio; inspiración, no copia de marca ni assets. |
| [open-design](https://github.com/Juanmaes83/open-design), [baoyu-design](https://github.com/Juanmaes83/baoyu-design) | Prototipos HTML y metodología local de diseño. No integrar sus plataformas ni providers. |
| [SCALES Design Tokens](https://github.com/Juanmaes83/SCALES-Design-Tokens-Starter-Set), [style-dictionary](https://github.com/Juanmaes83/style-dictionary) | Candidatos opcionales de organización de tokens; inspeccionar si hacen falta. No añadir pipeline por defecto. |

### 7.2 Conocimiento de arquitectura y economía

| Donante | Uso | Decisión |
|---|---|---|
| [Skills for Architects](https://github.com/AlpacaLabsLLC/skills-for-architects) · [copia del propietario](https://github.com/Juanmaes83/skills-for-architects) | `ffe-spec-book`, `product-cut-sheet`, `slide-deck-generator`, paletas, reconciliación de mediciones, disclaimers profesionales. | Prioritario; adaptar criterios al contexto local, no asumir validez normativa. |
| [IFC Sheet](https://github.com/BIMvoice/ifc-sheet) · [copia](https://github.com/Juanmaes83/ifc-sheet) | Cajetín, formatos y escala; estudiar `title-block-renderer.ts`. | Donante de diseño técnico; MPL-2.0, revisar obligaciones. No introducir IFC para maquetar. |
| [Papora](https://github.com/bilalmlkdev/papora) | Configuración modular, vista previa desde datos comunes, IndexedDB y gates de exportación. | Prioritario como patrón, no importar React ni motor económico por defecto. |
| [Invoify](https://github.com/al1abb/invoify) | Presentación económica, formularios, validación y temas. | Prioritario como patrón; comprobar rutas cliente/servidor, no prometer privacidad total. |
| [IFC Lite](https://github.com/LTplus-AG/ifc-lite) | Cuadros técnicos y contraste BIM futuro. | Investigación, no sustituye mediciones RUBIK. |
| [IfcOpenShell](https://github.com/IfcOpenShell/IfcOpenShell) · [copia](https://github.com/Juanmaes83/IfcOpenShell-IfcOpenShell-) | IFC diff y CSV como contraste si existe modelo IFC adecuado. | Investigación independiente; revisar licencia LGPL y correspondencia del modelo. |

### 7.3 Motores de maquetación: elegir uno, no acumular

| Candidato | Aplicación | Condición |
|---|---|---|
| CSS Print nativo | Baseline HTML existente, `@page`, saltos, tablas y PDF mediante impresión | Sin dependencias; preferido si cumple todos los criterios. |
| [Paged.js](https://github.com/pagedjs/pagedjs) | Paginación editorial en navegador, cabeceras/pies y contadores | Ejecutar solo en compositor; demostrar ausencia de filas perdidas y HTML final estático. |
| [Typst](https://github.com/typst/typst) + [Typst.ts](https://github.com/Myriad-Dreamin/typst.ts) | Candidato vectorial y tipográfico WASM local | Plantillas propias; empaquetar fuentes, impedir red, medir tamaño y tiempos. |
| [React-pdf](https://github.com/diegomura/react-pdf) | PDF directo y posible perfil PDF/A | Alternativa si los anteriores fallan; renderizador propio, no convierte HTML. PDF/A requiere veraPDF. |
| [Fragmentainers](https://github.com/pagedjs/fragmentainers) | Casos de fragmentación compleja | Solo investigar si se demuestra un problema sin resolver. |
| [WeasyPrint](https://github.com/Kozea/WeasyPrint) | Contraste independiente y PDF en Python | Laboratorio/QA; no desplegar servicio adicional. |

**Prueba comparativa E1 ya realizada en laboratorio (pendiente de aceptación independiente):** CSS Print frente a Paged.js frente a Typst.ts. Revisar ADR 06 y `out/v3/b3/bench.json`; no repetir indiscriminadamente. CSS Print/Chromium + paginación medida es la elección provisional para integración; Paged.js 0.4.3 descartado en ese benchmark por pérdida de texto y cabeceras; Typst.ts 0.7.0 reservado como candidato para anexos extensos, no motor de Production autorizado. La prueba de CSS Print fluido no equivale al algoritmo de páginas fijas `flow.js`: este detecta filas imposibles y aún exige política de división o bloqueo. Para equivalencia completa exigir el mismo snapshot, contenido, formatos y familias equivalentes. React-pdf/WeasyPrint como alternativas selectivas, no obligación de integrar. Medir resultados, fallos, offline, memoria, tamaño, tiempos fríos/calientes, esfuerzo de mantenimiento y compatibilidad. Si CSS nativo satisface el alcance inicial, evitar dependencia. Si falla, justificar el motor ganador con evidencia. No prometer ausencia absoluta de fallos de tablas ni conformidad PDF/A sin validación.

### 7.4 Presentación, anotaciones y futuro

| Repositorio | Uso | Dictamen |
|---|---|---|
| [Marker.js 3](https://github.com/ailon/markerjs3) | Edición visual de callouts | E4 candidato; licencia Linkware/comercial a revisar. Preferir SVG propio si suficiente. Anclaje semántico es RUBIK. |
| [React Compare Slider](https://github.com/nerdyman/react-compare-slider) | Patrón de accesibilidad/táctil | Referencia, no dependencia; UX-07 ya tiene cortina propia. |
| [Slidev](https://github.com/slidevjs/slidev) | Story en pantalla y presentaciones 16:9 | E3/E6 referencia; exportación usa Playwright, no asumir exportación móvil automática. |
| [PDFme](https://github.com/pdfme/pdfme) | Editor visual avanzado JSON/PDF | E7/ENT-07 futuro; no editor libre inicial. |
| [Gotenberg](https://github.com/gotenberg/gotenberg), [Carbone](https://github.com/carboneio/carbone) | Lotes servidor / documentos Office editables | Diferidos. Infraestructura, seguridad y licencia CCL de Carbone requieren decisión independiente. |
| [DocuSeal](https://github.com/docusealco/docuseal), [Documenso](https://github.com/documenso/documenso) | Aceptación/firma futura | Fuera del alcance; AGPL/comercial, privacidad, identidad y requisitos legales. No extraer automáticamente controles de GOV-08. |
| [Zine Deck Maker](https://github.com/Juanmaes83/zine-deck-maker) | Posible metodología creativa alternativa | No prioritario: estilo de zine no encaja como base de la familia profesional. |

### 7.5 QA y herramientas

- Playwright y suites existentes de RUBIK (pruebas puras, integración, navegador y fixtures); usar regresiones registradas según mecanismo existente, sin modificar workflows sin GO.
- [Agent Browser](https://github.com/Juanmaes83/agent-browser) y [Impeccable](https://github.com/Juanmaes83/impeccable): revisión del prototipo, capturas y crítica. Preferir comprobaciones deterministas sin LLM/proveedor. Las reglas estéticas no sustituyen revisión humana.
- [veraPDF](https://verapdf.org/) si se pretende PDF/A; Poppler (`pdfinfo`, `pdftotext`, `pdftoppm`) o equivalente local para dimensiones, datos y raster de páginas; extracción no sustituye revisión de clipping/vectorialidad. Comprobar licencias/herramientas instaladas.
- RUBIK Architecture Intelligence (laboratorio separado de Codex): análisis de impacto y dependencias por SHA, sin publicar el mapa ni utilizar Ask con código sin permiso. Sus resultados son auxiliares, no una fuente de verdad funcional.

### 7.6 Forks recomendados por la auditoría anterior

Verificar existencia actual antes de duplicar; no crear forks automáticamente: [Typst](https://github.com/typst/typst/fork), [Typst.ts](https://github.com/Myriad-Dreamin/typst.ts/fork), [Invoify](https://github.com/al1abb/invoify/fork), [Slidev](https://github.com/slidevjs/slidev/fork), [WeasyPrint](https://github.com/Kozea/WeasyPrint/fork), [IFC Lite](https://github.com/LTplus-AG/ifc-lite/fork). Los tres repositorios del ámbito BIM/skills con copia identificada se listan en 7.2. Para Paged.js, Papora y otros donantes externos: comprobar acceso al upstream y si existe copia ya. No es necesario forkear un repositorio solo para leer su documentación. El agente deberá revalidar cada licencia, SHA y estado; esta selección no acredita compatibilidad, ni una versión concreta de una librería.

### 7.7 Donantes adicionales de branding y composición

Como recursos selectivos, no instalaciones: [brand-identity-skill](https://github.com/Juanmaes83/brand-identity-skill), [get-shit-pretty](https://github.com/Juanmaes83/get-shit-pretty), [anydesign](https://github.com/Juanmaes83/anydesign), [design-dna](https://github.com/Juanmaes83/design-dna), [brand-system-skill](https://github.com/Juanmaes83/brand-system-skill), [huashu-design](https://github.com/Juanmaes83/huashu-design-3.0-agent-), [diagram-design](https://github.com/Juanmaes83/diagram-design). Confirmar acceso, contenido, SHA y licencias solo de los recursos usados; no presumir compatibilidad. El enlace Papora queda pendiente de comprobar, sin ser bloqueo para la misión.

## 8. Roadmap por cortes y puertas de decisión

Orden maestro que se conserva: E0 → E1 → E2 → E3 → E4/E5 según dependencia → E6 → E7. E0/E1 tienen entregables existentes: cerrar evidencias y brechas específicas, no empezar de nuevo. La integración E2 está pendiente de GO y de base consolidada acordada con Codex. No detener la revisión de laboratorio por CI ni tocar las ramas de consolidación. Si hay urgencia comercial, el propietario puede autorizar E2 mínimo local una vez congelados contrato y plantilla inicial, sin incorporar motor avanzado pendiente.

| Corte | Objetivo y entregables | Gate de salida |
|---|---|---|
| E0 · Baseline del Studio, entregables y dirección artística | Reproducir hallazgos H01–H08, inventariar UI/exports existentes con capturas reales y escenarios de ausencia; comparar baseline y propuesta. Inventario de referencias por hash, 5 documentos de ejemplo sobre un proyecto sintético común (lámina técnica, dossier editorial, propuesta comercial, FF&E, story conceptual). Tres familias originales. Tokens, layout, ficha por módulo, donantes con SHA/licencia, mapa de impacto. | Aprobación visual humana de las tres familias + límites y contrato ratificados; ningún cambio funcional. |
| E1 · Laboratorio de composición | Comparativa de impresión/PDF actual como baseline, CSS Print mejorado/Paged.js/Typst.ts, PDF/HTML de fixtures, matriz de calidad/tamaño/privacidad, ADR del ganador y plan de integración. | Cero pérdida de datos y de filas; offline; compatibilidad; revisión visual. GO separado para dependencia si procede. |
| E2 · ENT-04 activación mínima | Integrar lectura y comparador en Entregar, reutilizar FloorPlanDossier, marca y tarjetas existentes según ADR; selección revisión, plantilla sobria profesional, previsualización y descarga HTML/manifiesto; PDF local solo si E1 lo acredita para este corte. | UX-07 y ENT-04 verdes, biblioteca y presupuestos intactos byte a byte, compatibilidad 1.0/1.1, sin publicación ni llamadas externas, aceptación humana. |
| E3 · ENT-03 compositor | Evolucionar los cuatro estilos de dossier y las cinco plantillas Story existentes, mantener IDs; configuración por módulos, ampliar marca local existente, tres familias, lámina de una página y dossier largo, A4 vertical/horizontal, story/plantillas según alcance aprobado. | Mismo snapshot y cifras para todas las plantillas, personalización segura, QA móvil/impresión, prueba visual humana en las tres familias. |
| E4 · Láminas técnicas y visuales | Evolución del SVG técnico A3/escalas existentes, cajetín parametrizado, captura comparable, callouts SVG sobre cambios reales revisados, fichas FF&E e imágenes con origen. | Escalas acreditadas o rotuladas, asociación de anotación a revisión, metadata y licencias; ENT-05 solo cuando sus dependencias se cumplan. |
| E5 · Calidad PDF avanzada | Optimización/exportación, tablas extensas y PDF/A solo si existe caso profesional; validar formatos y vectorialidad, decidir si interesa otro renderizador. | Un motor mantenible; cero pérdida; PDF/A solo con verificador independiente y evidencia del perfil; no afirmar conformidad si no se probó. |
| E6 · Entrega segura y paquetes | Ampliación del archivo cliente B1 y publicadores existentes para dossier/presentación/visita; preservar observaciones y visita; ciclo de vida, cuotas, revocación, caducidad, registro y aislamiento. Lotes/ZIP según ENT-06. | GOV-08/ENT-02 y gates de seguridad pertinentes, pruebas negativas y aceptación manual contra URL/SHA exacto. Servicios de pago solo con ECO-01/IMG-04/GOV-06a y GO. |
| E7 · Personalización empresarial | Evaluar PDFme, roles, equipos, plantillas corporativas y portal ENT-07. | GOV-06b, legal/privacidad, nueva decisión de arquitectura y autorización explícita. |

No se asignan plazos antes de medir el trabajo residual. La aceptación de una fase no autoriza la siguiente, ni merge, ni Vercel. Mantener el orden del catálogo; cortes con dependencias no satisfechas quedan bloqueados. No activar Asistente V3, prueba C ni nuevas generaciones Render IA; la excepción D7 de tres peticiones se consumió.

### 8.1 Reconciliación del informe 11 con el roadmap maestro

El informe 11 denomina E2-1…E2-8 a tareas que abarcan E2–E6 del roadmap. No convertirlas en una autorización global ni desplazar el primer corte ENT-04. Correspondencia propuesta (requiere GO):

| Propuesta de Claude | Encaje maestro | Decisión de esta auditoría |
|---|---|---|
| E2-1 modelo de entrega | E2 cimientos de ENT-04; evolución E3 | Primero inventariar y mapear contratos existentes. `FloorPlanClientDelivery` versión 1 es un contrato minimizado de visita, no un esquema documental genérico. Reutilizar por composición, no ensanchar payload de red ni crear un segundo dominio por defecto. |
| E2-2 paginación | E2 solo si necesaria para el PDF mínimo; E3/E5 completa | CSS Print provisional; filas imposibles y QA post-transformación antes de habilitar. |
| E2-3 preparar entrega | E3, ENT-03 | Antes debe existir activación local ENT-04/ruta de comparación según E2 maestro. La interfaz del laboratorio no exporta una selección real aún. |
| E2-4 carpeta offline | E6 local después de E3; ENT-02/06 según alcance | Mantener B1 y observaciones; exportar paquetes seleccionados y sanitizados. No acreditar lotes comerciales ENT-06 por ZIP local. |
| E2-5 Render IA trazable | E4/ENT-05, IMG-12 | Análisis de contrato temprano permitido; integración con GO y dependencias acreditadas; sin nuevas peticiones pagadas. |
| E2-6 obra | E3/E4 composición, E6 entrega | Solo material y plan elegibles, respetar autoridad y DEC-05. |
| E2-7 Dibujo vivo | E4/E5 o corte específico Hybrid/Story | Exportación real pendiente; validar rendimiento y dependencias. |
| E2-8 enlace remoto | E6 | Seguridad, cuotas, aislamiento y DEC-05 según tipo de contenido; nunca confundir S3 con S5. |

Orden del primer E2 propuesto: contrato/snapshot y compatibilidad → comparar revisiones/variantes desde la ruta existente → dossier ENT-04 local con origen y estado económico → pruebas de exportación y aceptación. Preparar multimedia y diseño sin mutar producto mientras se cierra el laboratorio. No fusionar el laboratorio ni copiar sus binarios, node_modules o referencias al árbol de Production.

## 9. Definition of Done y matriz de QA

Cada fase define qué filas le aplican y registra PASS/FAIL/BLOCKED/NO_VERIFICADO con evidencia. No usar «todo verde» si solo se probó un subconjunto. Conservan validez las pruebas previas con su SHA, no como certificación automática de otro árbol.

| ID QA | Prueba/criterio | Evidencia y condición de salida |
|---|---|---|
| D01 | Identidad de proyecto/revisión y origen de variante | Casos correctos y cruzados; datos de otro proyecto rechazados. |
| D02 | Ausencia de mutación | Captura byte a byte de biblioteca y presupuestos antes/después de preparar, cambiar estética y descargar. |
| D03 | Estados económicos | Casos complete/partial/incoherent/one-sided/none, incluidos IVA, unidades y cantidades con discrepancia. Cero deltas inventados. |
| D04 | Equivalencia entre formatos | Extraer texto/tablas y confrontar con modelo; no confiar solo en comparación de capturas. |
| D05 | Paginación larga | Fixtures de 1, 50, 200 y 500 partidas identificadas: cada fila exactamente una vez, sin recorte ni duplicación; encabezados y continuación coherentes. Incluir fila más alta que la página, descripciones largas, caracteres acentuados y varias monedas/unidades solo si motor admite. |
| D06 | Tamaño y orientación | A4 vertical/horizontal; A3 cuando aplique. Medir dimensiones del PDF, márgenes, cabeceras/pies, numeración y saltos. No exigir escala física a render no acreditado. |
| D07 | Planos y vistas | Proporciones, cotas y escala declaradas; cambio de encuadre avisado; plan/revisión correctos; vectores cuando el formato lo requiera. |
| D08 | Calidad visual | Revisar todas las páginas rasterizadas; tipografía, composición, ritmo, legibilidad y jerarquía, imágenes sin deformación, ausencia de solapamiento/desborde. Revisión humana sobre los cinco ejemplos. |
| D09 | Responsive y accesibilidad | Teclado, foco, etiquetas, contraste, reflow de interfaz en escritorio y móvil (referencia 1440×900, 390×844, 844×390), zoom, errores y estados vacíos. Chromium y, si disponibles, Firefox/WebKit; dispositivos físicos etiquetados como pendientes si no probados. |
| D10 | Privacidad y HTML estático | Interceptar tráfico y bloquear externos; exportar con red deshabilitada tras cargar assets locales; recursos autorizados. `verify()` y pruebas XSS/escape de campos, imágenes y SVG. |
| D11 | Manifiesto y versiones | Fixture auténtica 1.0.0, dossier 1.1.0 y artefactos nuevos; hashes de salida, detectar alteración y pérdida de origen. |
| D12 | Branding | Logo válido/inválido, texto largo, colores sin contraste, cambio/restablecimiento, persistencia autorizada y separación entre proyectos/estudios. |
| D13 | Datos incompletos | Sin foto, precio, material, plan, cotas o escala: ausencia clara, sin espacios rotos ni invención. |
| D14 | Rendimiento | Tamaño de bundle y PDF, tiempos p50/p95 medidos sobre fixture y dispositivo documentados; memoria si disponible. Proponer presupuesto de rendimiento tras baseline y aprobarlo. |
| D15 | Seguridad publicación | Solo E6: enlace inexistente, caducado, revocado, sin permiso/código, cruces de ámbito y fallos de almacén; visita/4D existentes no regresan. |
| D16 | Regresión | Suites puras y de navegador ENT-04/UX-07, variantes, identidad, presupuesto, entrega y particiones pertinentes. No eliminar aserciones ni subir timeouts para esconder fallos. |
| D17 | Licencias y seguridad dependencias | Inventario de versiones, avisos de seguridad, licencias de código/assets y software incorporado, no secretos. |
| D18 | PDF/A si se afirma | Validación veraPDF con perfil concreto, informe y muestras. PDF ordinario no se publicita como PDF/A. |

Criterios duros: 0 discrepancias canónicas, 0 filas económicas perdidas, 0 escrituras no autorizadas, 0 recursos externos no autorizados, 0 cambios de seguridad inadvertidos, 0 regresiones nuevas en checks bloqueantes. QA visual: rúbrica 1–5 para composición, jerarquía, legibilidad, coherencia, calidad de imágenes/planos y percepción profesional; objetivo propuesto ≥4/5 en cada dimensión tras revisión humana, además de los criterios duros. No sustituir la revisión visual por una nota de IA.

### 9.1 Nuevos gates de continuidad (QA-ST, no IDs del catálogo)

| ID | Gate exigido | Prueba negativa mínima |
|---|---|---|
| ST01 | Snapshot transaccional de proyecto/revisión/identidad/presupuesto/plan/recursos, con obsolescencia y cancelación | Cambiar fuente durante un await; jamás mezclar revisión ni metadatos. |
| ST02 | Selección real y minimización por modalidad: vista previa personalizada, artefacto final y registro corresponden exactamente | Desmarcar presupuesto, documentos, imágenes y contenido interno; buscar sus cadenas y bytes en HTML/PDF/ZIP/medios y enlaces, no solo `hidden`. Abrir ZIP desde perfil limpio sin repo. |
| ST03 | Checks reales que gobiernan exportación; distinguen error, aviso, ausente/no verificado | Proyecto cruzado, dato personal/interno, falta de identidad cuando obligatoria, hash alterado, selección inválida; debe bloquear o seguir política explícita, no botón siempre activo. |
| ST04 | Manifiesto por archivo final incluido, salvo autorreferencia especificada; rutas relativas normalizadas, hashes, tamaño, tipos y procedencia | Modificar byte de HTML, imagen, PDF, vídeo o añadir archivo inesperado; verificador rechaza. Manifiesto del ZIP fuera del propio ZIP o digest externo; distinguir integridad de autenticidad y veracidad. |
| ST05 | QA del artefacto final, no solo DOM antes del ajuste | Fila excesiva, títulos huérfanos, texto suplementario, cabecera, footer; comparar filas/IDs y datos finales extraídos del PDF; no truncar, dividir con reglas o bloquear. |
| ST06 | Seguridad offline: allowlist exportable, ausencia de editable/secretos, límites por artefacto, política CSP/iframe/scripts por contrato y no red | Inspeccionar ZIP completo, metadatos de imágenes/PDF, HTML/JS/JSON, nombres/rutas y permisos; simular `postMessage` de emisor no autorizado, no aceptar mensajes en artefacto cliente; abrir entrega sin red. Validar observaciones B1 y ENT-04 estático por separado. |
| ST07 | Trazabilidad de los cuatro pilares | Origen de IA no disponible, cambio de cámara, plan incompatible, vídeo normal etiquetado dibujo vivo, recorrido sin visita real: mostrar el grado correcto o excluir. |
| ST08 | Cobertura editorial y accesibilidad | Matriz tres familias × cinco entregables × módulos elegibles, muestras reales en español/inglés; Architecture Book diferenciado de lámina, pruebas de escalas físicas y revisión visual por propietario. |
| ST09 | Reproducibilidad y licencias | ZIP desde entorno limpio, versiones/lockfile o receta exacta de herramientas, hashes y licencias verificadas; inspección de código/activos y revisión de datos en capturas; sin copiar donantes completos por defecto. |

CI inteligente: ejecutar pruebas de impacto y dependencias según política vigente una vez Codex la implante. No modificar workflows desde Studio. Registrar cada check como ejecutado PASS/FAIL, reutilizado con evidencia SHA/huella/entorno, no aplicable con motivo, o pendiente. Ambigüedad de impacto exige cobertura conservadora; ninguna prueba se elimina ni se da por ejecutada por reutilización.

## 10. Entregables de ingeniería y protocolo multiagente

### 10.1 Paquete E0/E1 (inventario lógico original; reconciliar con rutas ya existentes)

- `00-BASELINE-STUDIO-Y-ENTREGABLES.md`: inventario por ruta, ID, origen, controles, formato, estado y pruebas/capturas del producto actual. Reproducir H01–H08, registrar delta y decisiones de no duplicación.

- `00-RESUMEN-EJECUTIVO.md`: dictamen, decisión y límites.
- `01-INVENTARIO-DONANTES.md` + tabla fuente/SHA/licencia/uso/descartes.
- `02-REFERENCIAS-VISUALES.json`: clasificación, hashes, procedencia, licencia, criterio visual.
- `03-SISTEMA-EDITORIAL.md`: retículas, tokens, tipografía, componentes, tipos de página y límites.
- `04-CONTRATO-DOCUMENTAL.md`: mapeo de modelo → módulos; compatibilidad y casos económicos.
- `05-PROTOTIPOS/`: cinco ejemplos, capturas y, si procede, PDF/HTML generados con datos sintéticos.
- `06-EVALUACION-MOTORES.md`: fixtures idénticas, métricas, evidencias y ADR del candidato ganador.
- `07-QA-MATRIZ.md` + capturas, informes y comandos reproducibles.
- `08-MAPA-IMPACTO.md`: archivos/suites afectados por E2/E3, dependencias y registro de conflictos.
- `09-PLAN-INTEGRACION.md`: ramas, cortes, tests, rollback y riesgos; sin ejecutar integración hasta GO.

El laboratorio existente es `labs/studio-presentation/` en `lab/studio-presentation-e0e1`. No duplicar los informes que ya existen: crear índice de equivalencias, completar vacíos y versionar solo conforme a la autorización vigente. El `HANDOFF.md` cita informe 00, no localizado en `reports/` al HEAD auditado; entregar ese cierre o indicar ruta real. `tools/package.sh` genera ZIP en `dist/` no versionado: entregar archivos reales, tamaños, SHA-256, inventario y forma de reproducción. La revisión estática de su grep de patrones no acredita ausencia de datos personales, secretos o material sin licencia. Usar allowlist de cliente y laboratorio separadas, inspección final de binarios/metadatos y pruebas de exclusión. No subir fixtures de clientes, referencias ajenas sin derechos ni mapas sensibles.

### 10.2 Reglas de coordinación

- El propietario prioriza, autoriza y acepta estética/funcionalidad; Claude Code ejecuta Studio, Codex consolidación/CI inteligente, ChatGPT audita. No cambiar ese reparto sin decisión del propietario. Nombrar un responsable por corte y revisor independiente.
- Antes de empezar: `git status`, rama, HEAD, remoto y PR abiertas; comprobar relación con #243 y ejecución de S3; no hacer checkout sobre worktree ajeno ni usar stash/reset/rebase sobre su rama. No mezclar VQ-01 u otros trabajos.
- Usar worktree/clone aislado desde SHA acordado. Rama sugerida E2: `feat/ent04-studio-presentation`; E3: `feat/ent03-studio-composer`. Nombres propuestos, comprobar disponibilidad, no crear sin GO correspondiente.
- Solicitar a Architecture Intelligence mapa de impacto de archivos y pruebas si está disponible; prohibido enviar el código a Ask externo o publicar su grafo sin autorización.
- En cada corte entregar: objetivo, SHA base/HEAD, archivos, diff, dependencias/licencia, resultados de pruebas, capturas y PDF si procede, incidencias, no verificado, decisiones tomadas y rollback. Registrar el estado exacto del árbol.
- No push, PR, merge, promoción de alias, cambio Vercel/variables/workflows, borrado de ramas ni gasto fuera de la autorización explícita. CI verde no autoriza deploy. Si algo exige permisos de red, secreto o proveedor, detener ese punto y pedir GO específico, no cambiar el alcance por cuenta propia.
- Después de aceptación, actualizar documentación/catalogación mediante cambio autorizado. No marcar ID completo por un laboratorio, ni cambiar olas, ni borrar evidencia histórica.

## 11. PROMPT OPERATIVO ACTUALIZADO — Claude Code: cierre E0/E1 y preparación de E2

**Misión:** terminar y acreditar RUBIK Studio Presentation, «Del dibujo a la casa», sin reiniciar trabajo validado ni tocar el producto hasta GO. Usa esta especificación v1.2 completa como autoridad junto a catálogo vigente, decisiones del propietario, acta UX-07/ENT-04 y recursos versionados. El alcance inmediato es laboratorio y cierre verificable, no integración, gasto ni publicación.

**0. Recupera contexto por SHA.** Comprueba estado de worktree, master, laboratorio y ramas concurrentes. Usa `lab/studio-presentation-e0e1` y su HEAD vigente. Codex se ocupa de #243/#244 y CI inteligente; no toques sus ramas ni fuerces sincronizaciones, tampoco Vercel/Production. No repitas B1/B2/B3 ni fuentes ya verificadas salvo cambio o hallazgo justificado. Conserva las decisiones D1–D6 y tres renders D7 ya obtenidos.

**1. Cierra la documentación, no inventes estado.** Recupera exactamente H01–H08 de §3.3. Añade matriz con evidencia, reproducido/descartado/pendiente y ámbito; los fixes de laboratorio no arreglan master. Entrega informe 00 y mapa entre especificación original, documentación versionada y resultados. Reconciliar arquitectura y alcance mediante tres familias, cinco documentos, diez módulos, siete modalidades y cuatro pilares. Identificar qué es muestra, prototipo funcional y función de producto. Verificar Architecture Book real o declarar su ausencia y propuesta. No repetir aprobaciones visuales D1–D5. Español/inglés, chino aplazado.

**2. Investiga y corrige dentro del laboratorio los hallazgos A01–A06 siguientes.** El objetivo es convertir las simulaciones de interfaz en evidencia fiable, sin introducir un compositor paralelo en producto. Prioriza A01–A03 y A05 por privacidad/veracidad; si un cambio excede el laboratorio, documenta deferido y gate E2/E3/E6. Ejecuta pruebas negativas concretas.

| Hallazgo | Evidencia de lectura estática en HEAD `97d3eac` | Acción y aceptación |
|---|---|---|
| A01 · Selección ≠ entrega | `tools/entrega.cjs`, `push()` oculta capítulos/documentos en iframe mediante `postMessage`; `#open` apunta al archivo predefinido de la modalidad; `#reg` descarga JSON, el ZIP empaqueta la carpeta general. | Prototipo de exportación selectiva real o etiquetar inequívocamente simulación/registro; al exportar una selección, comprobar ausencia física de datos no elegidos en HTML/PDF/ZIP/medios, equivalencia exacta de preview/artefacto/registro. Los PDF integrales con secciones excluidas deben regenerarse o no incluirse. |
| A02 · Integridad incompleta | `entrega.json` enumera siete HTML en `tipos` pero `pieces` se construye con `reg` + PDF; no hash de los siete HTML. `#reg` incluye todos los medios (`startsWith('media/')`) aunque el usuario los excluya. | Manifiesto final de todos los archivos permitidos, no solo piezas parciales; no autorreferencia imposible. Verificador independiente y prueba de manipulación/archivo extra. Registrar solo la selección real. |
| A03 · Checks no acreditados como gates | `prepararPage()` contiene estados `ok` fijos para mismo proyecto, sin editable y datos personales; `#reg` no bloquea por `checks`. Los checks reflejan el ejemplo, no una validación general. | Derivar comprobaciones de datos y artefactos reales; separar registro de borrador de exportación/comercial; bloquear estados prohibidos; pruebas con revisión cruzada, falta de identidad, archivo editable y datos fuera de ámbito. No afirmar que un aviso detiene una entrega si no lo hace. |
| A04 · Paginación y autoridad | `tools/flow.js` mide y contabiliza `unsplittable`; la invariante de texto se toma antes de repetir valores de estancia (`data-repeat`). ADR 06 distingue CSS fluido y páginas fijas. | No dar cobertura universal. Validar filas finales por identificador y campos canónicos, distinguir etiquetas repetidas de datos duplicados, probar oversized row e impedir PDF truncado o dividirlo explícitamente; verificar tras los ajustes y extracción del PDF. |
| A05 · Seguridad de paquete y canales | `tools/package.sh` escanea patrones de texto y zippea todo `entrega/` y gran parte del lab. `entrega.cjs` usa `postMessage` con `'*'` para el preview. | Revisar canal y emisor del iframe; separar preview de HTML final y eliminar listeners de edición no necesarios; no confundir script local con XSS demostrada. Allowlist y revisión de binarios/metadatos; inspeccionar contenido completo, ZIP, recursos y archivos extra. No borrar evidencia histórica ni declarar fuga confirmada sin reproducir. |
| A06 · Cuatro pilares y cobertura | Informe 10, manifiesto y trazabilidad; escala del ejemplo `estimated`; vídeo de recorrido no es Dibujo vivo; `notIncluded` indica visita interactiva ausente. | Rotular autoridad en toda salida, revisión y origen exacto cuando exista. Dos renders con correspondencia visual, no equivalencia binaria acreditada; salón orientativo y distorsión explícita. Validar identidad real del vídeo, plan orientativo sin presupuesto asociado; no prometer acceso interactivo offline ni escala física en planos estimados. |

**3. Eleva calidad editorial sin sacrificar rigor.** Comprueba cinco tipos de entregable y tres familias con muestras reales del mismo proyecto sintético, portadas, pliegos, materiales, tipografía, composición, cifras, imágenes, gráficos y autoridad; revisa todas las páginas rasterizadas y casos B2. Mantén B1 aprobado, evita rediseñar de cero. Registra críticas y cambios observables. No uses una nota generada ni 21 checks de viewport como sustituto de revisión visual. Completa tabla de D01–D18 y ST01–ST09 aplicables con PASS/FAIL/BLOCKED/NO_VERIFICADO, más artefacto, comando, SHA y entorno.

**4. Acredita paquetes y reproducibilidad.** Entrega ZIP del cliente y ZIP del laboratorio por separado, sin editor ni proyecto editable en el primero, sin credenciales, datos no autorizados ni dependencias innecesarias; incluye índice, README para abrir offline, versiones, hashes externos, archivos y tamaños. Inspecciona binarios y licencias; no confíes solo en grep. Prueba desde carpeta limpia, red deshabilitada, hosts sin acceso al repositorio, escritorio/tableta/móvil emulados y dispositivos físicos solo cuando se prueben realmente. Proporciona PDF, HTML, vídeos y capturas reales. No inventes enlace de descarga ni digas que el ZIP está entregado si solo existe `package.sh`.

**5. Prepara E2, no lo ejecutes.** Alinea el informe 11 con §8.1. Inspecciona `FloorPlanDossier`, `FloorPlanBrand`, `FloorPlanClientDelivery`, `FloorPlanClientShare`, `before-after-dossier-core`, `revision-budget-core`, `construction-delivery-core` y Story. Diseña un modelo documental por composición sobre contratos existentes y adaptadores de solo lectura. Mantén ENT-04 estático sin scripts y B1 con CSP y observaciones; el contrato ENT-01 de visita no debe convertirse en un contenedor de todo. Propón activación mínima ENT-04, no marca de estado completa, compatibilidad 1.0/1.1, obsolescencia, presupuestos y biblioteca intactos byte a byte. Define delta, riesgos, suites de impacto, rollback y aceptación visual. CSS Print provisional, sin nueva dependencia Production. Diferir publicación, cuotas y enlaces a GOV-08 pertinente, GOV-05 y DEC-05; S3 no hace privado un Blob público.

**6. Entrega y gate.** Informe ejecutivo con: SHA base/HEAD, cambios, archivos y enlaces, tabla de cierre y limites, decisiones D1–D7, matriz H01–H08, QA D01–D18/ST, cobertura de cinco tipos de documentos, cuatro pilares, licencias, diffs, hashes y ZIPs reales, lista de pendientes justificados y propuesta E2 por corte. Presenta una recomendación GO/NO-GO graduada, no autoaprobación. No autorices tu propia integración. No hagas merge, publicación, gasto, cambios de seguridad/workflows ni instalaciones de Production. No pidas GO de nuevo para decisiones ya aprobadas. Si solo está pendiente un punto, delimítalo y continúa los demás trabajos permitidos de laboratorio.

**Fin del mandato:** listo para auditoría independiente y decisión del propietario, sin reiniciar ninguna de las misiones ni marcar capacidades como completadas por un prototipo.

## 12. Registro de decisiones y puertas pendientes

| Decisión | Situación |
|---|---|
| D1 portada | B · dibujo protagonista, aprobada |
| D2 pliego | B · dibujo manda, aprobada |
| D3 mobiliario | B · cuatro fichas/página, aprobada |
| D4 materiales | A · palabra gigante, aprobada |
| D5 inmobiliaria | A · vista protagonista, aprobada |
| D6 idiomas | ES/EN; chino aplazado, decisión vigente |
| D7 IA | Tres generaciones autorizadas y efectuadas; no saldo de llamadas autorizado |
| Cierre E0/E1 | Continuar dentro del lab; falta informe final, ZIP e inspección independiente de A01–A06 |
| ADR PDF | CSS Print con paginación medida, elección del lab; aprobación independiente pendiente, Typst solo candidato |
| GO E2 | Pendiente, no concedido por esta especificación |
| Marca/formatos/privacidad | Ratificar cambios de esquema y recursos nuevos si proceden, no repetir estética D1–D5 |
| Publicación y firma | Fuera de la autorización actual; decidir por separado |

**Dictamen de continuidad:** GO recomendado para finalizar E0/E1 y revisar brechas del laboratorio. HOLD para integración E2 hasta resolver o delimitar las brechas, revisar los entregables y el contrato, confirmar master de partida y obtener GO explícito. NO GO para publicación remota, gasto adicional, cambios de Production, merge automático y dependencias productivas no autorizadas. No bloquear el trabajo de Codex por tareas de Studio independientes.

## 13. Fuentes de auditoría y límites

Revisión documental y lectura estática de GitHub; enlaces fijados por SHA para evitar deriva.

- [Catálogo v1.10 en master](https://github.com/Juanmaes83/floorplan-3d/blob/403e6b74c95a81e23c17badb276abeca9f8c3fd1/docs/product/rubik-catalogo-maestro-mejoras-2026-11-09.md), [acta UX-07/ENT-04 y DEC-07](https://github.com/Juanmaes83/floorplan-3d/blob/403e6b74c95a81e23c17badb276abeca9f8c3fd1/docs/qa/ux07-ent04-integracion-master-20261113.md).
- [FloorPlanClientDelivery](https://github.com/Juanmaes83/floorplan-3d/blob/403e6b74c95a81e23c17badb276abeca9f8c3fd1/js/client-delivery-core.js), [B1 FloorPlanClientShare](https://github.com/Juanmaes83/floorplan-3d/blob/403e6b74c95a81e23c17badb276abeca9f8c3fd1/js/client-share-ui.js), [.vercelignore](https://github.com/Juanmaes83/floorplan-3d/blob/403e6b74c95a81e23c17badb276abeca9f8c3fd1/.vercelignore).
- Laboratorio: [HANDOFF](https://github.com/Juanmaes83/floorplan-3d/blob/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/HANDOFF.md), [ADR 06](https://github.com/Juanmaes83/floorplan-3d/blob/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/reports/06-ADR-MOTOR.md), [07 matriz](https://github.com/Juanmaes83/floorplan-3d/blob/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/reports/07-MATRIZ-EXISTE-AMPLIAR-FALTA.md), [09 riesgos](https://github.com/Juanmaes83/floorplan-3d/blob/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/reports/09-RIESGOS-LIMITES-NOTAS.md), [10 entrega integral](https://github.com/Juanmaes83/floorplan-3d/blob/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/reports/10-ENTREGA-INTEGRAL.md), [11 propuesta](https://github.com/Juanmaes83/floorplan-3d/blob/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/reports/11-PROPUESTA-E2.md), [D1–D7](https://github.com/Juanmaes83/floorplan-3d/blob/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/reports/DECISIONES-PENDIENTES.md).
- Código y evidencias: [entrega.cjs](https://github.com/Juanmaes83/floorplan-3d/blob/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/tools/entrega.cjs), [entrega.json](https://github.com/Juanmaes83/floorplan-3d/blob/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/out/v3/entrega/entrega.json), [flow.js](https://github.com/Juanmaes83/floorplan-3d/blob/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/tools/flow.js), [package.sh](https://github.com/Juanmaes83/floorplan-3d/blob/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/tools/package.sh), [QA 21 ejecuciones](https://github.com/Juanmaes83/floorplan-3d/blob/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/evidence/entrega/qa/entrega-qa.json), [trazabilidad IA](https://github.com/Juanmaes83/floorplan-3d/blob/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/evidence/render-ia/trazabilidad.json), [inventario out/v3](https://github.com/Juanmaes83/floorplan-3d/tree/97d3eac3536b633f7df5b72c56ef8a7800c8012a/labs/studio-presentation/out/v3).

Esta auditoría verifica existencia, contenido y relaciones de los archivos consultados. Los resultados de ejecución son registros del laboratorio, no nuevas ejecuciones independientes. No se han abierto/revisado visualmente todos los PDFs, comprobado todos los hashes de binarios, validado todas las licencias, abierto ZIPs finales, probado dispositivos físicos ni verificado Production. No se ha modificado ningún recurso remoto. Los hallazgos estáticos A01–A06 describen límites o riesgos concretos del prototipo, no incidentes acreditados de Production. Los nuevos gates ST son propuestas de aceptación dentro de la misión, no IDs oficiales ni autorización de alcance adicional.

---

**Nota de trazabilidad:** esta v1.2 conserva el contenido maestro de v1.1 y sus decisiones de arquitectura, módulos, catálogo, QA, donantes y cortes. Actualiza estado, alcance multimedia y encargo inmediato sobre el handoff del 17/11/2026 y las fuentes indicadas. En caso de discrepancia posterior, prevalecen las decisiones explícitas del propietario, contratos y HEAD comprobados. No reinterpretar la propuesta como GO ni como cierre de capacidades.
