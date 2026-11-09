# RUBIK SOTA — Auditoría verificada de oportunidades UI/UX, servicios e integraciones

**Fecha:** 09/11/2026 · **Versión:** 1.0 · **Estado:** documento de revisión para el propietario. **No aprueba** implementación, merge, gasto de API ni cambios en Production.
**Base inspeccionada:** `master@de52d576183dc358bf75a55935284ec1aad6d7b9`, la misma que sirve hoy Production tras el Promote del 09/11/2026.
**Entrada auditada:** «Auditoría unificada de oportunidades UI/UX, servicios e integraciones» (corte 09/11/2026), aportada por el propietario.
**Método:** cada afirmación del informe se ha contrastado con el código de `master`, las ramas remotas, las PR abiertas y, para los recursos externos, con su repositorio público.

> **Documento de decisión unificado:** [`rubik-catalogo-maestro-mejoras-2026-11-09.md`](./rubik-catalogo-maestro-mejoras-2026-11-09.md) reúne en una sola tabla esta auditoría, las fichas de los 4 PDF y los planes de IA de imágenes y personas, CAT-IA, FOT/360/vídeo, asistente y Home, con su orden y sus conflictos.

> **Cómo leer este documento**
> - **Sección 1:** el veredicto en una página.
> - **Sección 2:** qué está desactualizado o es incorrecto en el informe de entrada, con la prueba.
> - **Sección 3:** la matriz verificada, con una recomendación por mejora y cómo integrarla.
> - **Secciones 4–6:** el orden propuesto, lo que no hacer y las decisiones que te corresponden.

---

## 1. Veredicto

**La tesis del informe es correcta y la comparto.** RUBIK no necesita otro editor ni otra app. Su ventaja está en encadenar plano real → diseño 2D/3D → visualización → medición, presupuesto y plan → propuesta → entrega y revisión. Las imágenes IA son ilustrativas: nunca sustituyen geometría ni costes.

**El informe acierta en lo grande:**
- prioridades: Home por profesión, Render IA D1, Entregas #166, antes/después y estudio de imágenes;
- descartes: OSIRIS, migrar la CI a Obscura y las telemetrías ficticias.

**Falla en el detalle por estar desactualizado.** He encontrado:
- **8 correcciones de estado:** algunas funciones que da por inexistentes ya existen, y otras que da por parciales no existen;
- **1 bloqueo que ya no aplica:** el perfil «Constructora» de la Home, porque FT3D-8 ya está en master;
- **1 omisión de higiene importante:** unas 20 PR abiertas obsoletas.

### Las 5 recomendaciones principales

| # | Recomendación | Por qué ahora |
|---|---|---|
| 1 | **Cerrar el ciclo Render IA D1:** fusionar #180 → #182 y #181 con tu autorización, activando antes `RUBIK_RENDER_ENABLED=1` | Ya está hecho y en verde. Pone límites a un gasto que hoy no tiene tope en el servidor. |
| 2 | **Higiene de PR:** cerrar o archivar las PR obsoletas (#133–#151 y #90) cuyo contenido ya está en master | Hoy confunden qué está integrado. El propio informe cae en ese error. |
| 3 | **HOME-UX-E2** con un **6.º perfil, «Constructora / jefe de obra»** | La bienvenida con 5 profesiones ya existe. El delta es la profundidad de la personalización, y el bloqueo «hasta S4» ya se cumplió. |
| 4 | **Comparador antes/después** reutilizando lo que ya existe: el comparador de variantes y las vistas automáticas | Alto valor de venta y coste medio, porque la mitad ya está construida. |
| 5 | **Auditoría de importación DXF/PDF, medición sobre el plano y exportación DXF 2D**, inspiradas en `house-plan-designer` (MIT) y en Open PDF Studio | Confianza del estudio de arquitectura. Se toma la idea y el método, no el código, las normas chinas ni el código LGPL. |

---

## 2. Correcciones al informe de entrada (verificadas en `master`)

| # | El informe dice | Realidad verificada | Prueba |
|---|---|---|---|
| C1 | Gate 0: «verificar Production vs HEAD» | **Hecho.** Production sirve `de52d57` (= master) desde el Promote autorizado del 09/11, con `labs/` excluido (404). | Despliegue `dpl_CdmBiEfNSrYsEnhkVt6ksYPrR7Xr`; verificación del 09/11 |
| C2 | V-01 Render IA: «modelo por defecto pendiente, uso/coste desconocido, banda truncada, control insuficiente», todo en la rama de compatibilidad | **Superado.** Hay tres PR en borrador con CI en verde: **#180** (interruptor, origen, freno de códigos, límites hora/día), **#181** (IMG-01, acabados completos en la exportación) y **#182** (IMG-02, consumo, coste con tarifa configurable y log sin secretos). El propietario confirma que **el render funciona hoy en Production**, así que la compatibilidad de modelo (PR-2) pasa a opcional. | PR #180/#181/#182; `docs/render-ai/` en esas ramas |
| C3 | UX-15 «Apertura/cierre de puertas en paseo 3D: P/N, dificultad Alta» | **Las puertas ya existen** en master: «toca una puerta para abrirla o cerrarla» en el recorrido y en la vista 3D. Faltan armarios y cajones. | `index.html` (ayudas «tap doors to open», «Toca una puerta para abrirla o cerrarla») |
| C4 | UX-07 Comparador antes/después: «P/N» | **Hay dos comparadores ya construidos**, aunque ninguno es un antes/después visual: (a) comparador de **variantes de proyecto** con métricas lado a lado, (b) **vista real ↔ render IA** en el diálogo de Render IA. El delta es la vista visual de dos revisiones. | `js/project-variants.js` (`comparisonFrame`, `metrics`); `#variantsError` en `index.html`; `js/ai-render-ui.js` |
| C5 | UX-01 Home por profesión: «P/N» | **La bienvenida ya tiene 5 profesiones** (arquitectura, inmobiliaria, promotora, reformas e interiorismo), con texto por audiencia, tarjeta de Soluciones antepuesta y «Recorrer el ejemplo en 3D». El delta es una propuesta completa por profesión: hero, prueba visual, ventajas y CTA. | `js/guide-ui.js` (`rubik-professional-audience-v1`, `welcomeWalkExample`, `welcomeSolutions`) |
| C6 | HOME-UX-E2: perfil constructora «solo cuando exista S4 integrado» | **La condición ya se cumple.** FT3D-8, con plan, Gantt, 4D, costes y MP4, está en master desde #178. El perfil puede diseñarse ya, sin prometer obra real ni ejecución física. | Merge #178 → `de52d57`; `js/construction-*.js` |
| C7 | UX-12 Presets de amueblamiento: «P» | **No existe** ningún preset ni autoamueblado. Sí existe una pieza útil para construirlo: **`furniture-placement.js`**, búsqueda pura de posición libre que respeta muros, barridos de puerta, escaleras y otros muebles. | `js/furniture-placement.js` |
| C8 | UX-08 Distancias al mover un mueble: «P» | **No hay cotas en vivo al arrastrar.** Existe la **revisión de distribución de solo lectura**, con holguras y huella orientada, que serviría de fuente de las cifras. | `js/layout-review.js`; sin coincidencias de «cotas en vivo» en la UI |
| C9 | Documentación de soporte (HOME-UX-E2, plan IA, CAT-IA, 360…) | **No está en master.** Vive en la rama `docs/rubik-evolution-preparation-2026-11-04`: 16 documentos y 4.331 líneas, sin fusionar. Sus «fotografías» de master son de `0f9c6ea`, anterior a #175–#178. | `git merge-base` (no es ancestro de master) |
| C10 | Omisión: estado de las PR | Hay **~30 PR abiertas**. De ellas, **#133–#151 y #90** son ramas antiguas que van **380–470 commits por detrás**, y su contenido ya entró en master por commits «integration: …». Siguen abiertas como si estuvieran pendientes. | `git merge-base --is-ancestor` y el log de master («integration: Fase B/C …», «FT3D-1a/1b») |

**Confirmado tal cual:**
- Existen: minimapa en Presentación (oculto mientras se camina), solar, multiplanta, importación PDF/DXF/IFC/imagen, sección/alzados/axonometría/Story, Gantt y 4D (FT3D-8), presupuesto C1–C4, vídeo, compartir, comentarios anclados, moodboard y marca.
- No existen: exportación DXF, cámara libre colocable sobre el 2D (las vistas son las paradas automáticas de la presentación), inspector contextual 3D de estancias y muros (solo se elige mueble en 3D y elemento en la Evolución) y presets.
- MCP local de lectura en `tools/rubik-mcp`: medidas, holguras, rutas, relaciones espaciales y diagnósticos.
- AG-1 en rama: 5 archivos y 350 líneas, `js/assistant-domain-tools-core.js`, no en master.
- Siguen abiertas como borrador: #166, #167, #165, #164 y #169.

**Los cuatro PDF (Maket, ErectionOS, Makio y Floorcraft):** auditados uno por uno desde la rama `docs/referencias-nuevas-para-auditar-e-implementar-2026-11-06@66b24b0`, en **[`auditoria-4-pdf-referencias-ui-ux-2026-11-09.md`](./auditoria-4-pdf-referencias-ui-ux-2026-11-09.md)**. Ahí están las fichas por documento, la revisión a fondo de `house-plan-designer` y las nuevas candidatas UX-22 a UX-26 y V-11.

Dos precisiones que salen de esa auditoría:
- El **minimapa** existe en la Presentación pero **se oculta mientras se camina**, lo que da la mejora real UX-22.
- Los **muros de carga** son un tipo **declarado** por el profesional, no una verificación estructural.

---

## 3. Matriz verificada: qué hacer con cada mejora y cómo integrarla

**Estados:**
- **E:** existe en master.
- **P:** parcial.
- **R:** en rama o PR, no en master.
- **N:** no existe.

**Recomendaciones:**
- **AHORA:** siguiente corte.
- **SÍ:** después, en su corte.
- **PATRÓN:** solo como referencia.
- **DIFERIR:** aplazar.
- **NO:** descartar.

### 3.1 Experiencia y UX

| ID | Mejora | Estado real | Recomendación | Cómo integrarla (sin duplicar) |
|---|---|---|---|---|
| UX-01 | Home por profesión | **P** (5 perfiles) | **AHORA** | Dentro de `buildWelcome()` en `guide-ui.js`. Hero, prueba visual real, 3–4 ventajas con acceso real y CTA por perfil. Añadir **«Constructora»** con capturas de FT3D-8. Mantener las tres entradas universales y las pruebas `welcome-generar` y `professional-entry`. |
| UX-02 | Catálogo de capacidades «Disponible / En validación / En preparación» | N | **AHORA** (con UX-01) | Un único registro JSON versionado con el SHA y la prueba QA de cada capacidad. La Home y la futura web lo consumen. Sin él, la Home volverá a prometer cosas de ramas. |
| UX-03 | Panel contextual del elemento seleccionado en 3D | P (mueble en 3D; elemento en la Evolución) | **SÍ** (corte 2) | Extender la selección 3D a estancias y muros. Mostrar los mismos datos que el inspector 2D (superficie, medidas y acciones reales). Nada de costes inventados. |
| UX-04 | Ayudas contextuales, atajos y toasts | P (atajos, toasts y guía existen) | **SÍ** (corte 2, solo delta) | Auditar primero qué cubre ya la guía. Añadir únicamente lo que falte. |
| UX-05 | Selector compacto de modos, plantas y cámaras | P | **SÍ** (corte 2) | Reorganizar los controles actuales (plantas en `building-ui.js`, vistas e INTERIOR) antes de crear cámaras nuevas. |
| UX-06 | Minimapa | **E** | **NO duplicar** | Solo comprobar que aparece en la experiencia cliente de #166 cuando se integre. |
| UX-07 | Antes/después | P (variantes + real↔IA) | **AHORA** (corte 2) | Fase 1: dos revisiones o variantes con capturas de `project-views-ui.js` y las métricas de `project-variants.js`, una al lado de otra o con deslizador. Fase 2 (después): 3D sincronizado. No confundir con real↔IA. |
| UX-08 | Cotas en vivo al mover muebles | N (fuente: `layout-review`) | **SÍ** (corte 2) | Calcular las cifras con la geometría canónica y la revisión de distribución. Mostrar el límite del método (huella en planta, sin alturas). |
| UX-09 | Maqueta blanca / acabados / ocultar muebles | P (visibilidad por planta, INTERIOR) | **SÍ** (corte 2) | Un conmutador sobre el renderer actual. No crear otro pipeline de materiales. |
| UX-10 | Píldora de inspección bajo el cursor | P (raycaster) | DIFERIR | Detrás de UX-03. La selección accesible por teclado va primero. |
| UX-11 | Editar el material del muro desde el 3D | P (`surface-ui` con selección de muro) | **SÍ** (corte 3) | Abrir el diálogo de superficies existente desde la selección 3D, con deshacer. Es independiente del Render IA. |
| UX-12 | Presets de amueblamiento por estancia | **N** | **SÍ** (corte 3) | Recetas declarativas (estancia × estilo → lista de piezas del catálogo) colocadas con `furniture-placement.js` y validadas por `layout-review`. Nunca al azar. |
| UX-13 | Recetas de estilo del proyecto completo | N | SÍ (después de UX-12) | Primero superficies (biblioteca existente), después mobiliario. |
| UX-14 | «Move Rooms» topológico | N | **DIFERIR** | Exige un solver de restricciones, puertas, escaleras, diff y undo. Muy alto coste. |
| UX-15 | Puertas en el paseo 3D | **E** (puertas) | Solo **armarios** (DIFERIR) | Las puertas ya funcionan. Los armarios exigirían modelos con piezas móviles. |
| UX-16 | Cámara colocable sobre el 2D con cono de visión | N | **SÍ** (corte 3, con V-02) | Útil para encuadrar el Render IA. Se reutiliza `View3D.presentationGo` y `deliveryShot`. |
| UX-17 | Despiece, aislar y x-ray de plantas | P (FT3D-5, Evolución) | PATRÓN | Tomar ideas de rendimiento e interacción de Breakboard. No importar activos. |
| UX-18 | Timeline 4D | **E** (FT3D-8) | **NO rehacer** | Cerrar sus pendientes (EX-05.3, EX-11-k.6 y QA-22). |
| UX-19 | Elementos futuros en fantasma | P/N | SÍ (después) | Solo sobre estados reales del plan de obra (`construction-visual-state.js`). |
| UX-20 | KPI y telemetría de obra | P | SÍ, con condiciones | Solo datos con respaldo (plan, presupuesto). Nada de estados «NOMINAL» ni de ejecución física inventados. |
| UX-21 | Sol, luz y persianas | P (solar) | DIFERIR | Ya existe solar. No prometer lux certificados. |

### 3.2 Visualización e IA

| ID | Mejora | Estado real | Recomendación | Cómo integrarla |
|---|---|---|---|---|
| V-01 | Render IA D1 | **R** (#180, #181 y #182 en verde) | **AHORA**: fusionar con autorización | Orden: #180 → #182, y #181 cuando quieras. Antes del Promote, `RUBIK_RENDER_ENABLED=1`. Opcional: las variables de tarifa. |
| V-02 | Estudio de imágenes: 2–5 variantes, intensidad, historial y fichas | P (B2/B8) | **SÍ** (corte 3) | Sobre `api/render.js` y `ai-render-ui.js`, con los límites de #180 y el coste de #182. Solo después de medir coste por imagen aceptada. |
| V-03 | Reforma sobre foto del cliente (FOT-01) | N | SÍ (piloto, después de V-02) | Requiere consentimiento, retención de imágenes, aviso de «ilustrativa, no medible» y presupuesto de prueba autorizado. |
| V-04 | Catálogo de fabricantes visual (CAT-IA1) | N | SÍ (piloto con material autorizado) | Licencias por escrito antes de tocar imágenes de fabricante. |
| V-05 | SKU, fichas y precio (CAT-IA2/3) | N | DIFERIR | Después de V-04 y con contratos. Nunca precio o stock salidos de la IA. |
| V-06 | Objeto 3D desde foto | N | DIFERIR | Alternativa simple: volumen genérico escalado con medidas confirmadas por el profesional. |
| V-07 | Personas en escenas | N | DIFERIR | Privacidad y derechos. |
| V-08 | 360 | N | DIFERIR (estudio) | No confundir con el recorrido 3D actual. |
| V-09 | Vídeo determinista / generativo | P (vídeo de recorrido y MP4 4D) | VID01 **SÍ** (después); VID02 DIFERIR | VID01 reutiliza `tour-recorder` y el muxer existente. |

### 3.3 Cliente, geometría y asistente

| ID | Mejora | Estado real | Recomendación | Cómo integrarla |
|---|---|---|---|---|
| C-01 | Entrega cliente 3D (#166) | R (borrador desde el 04/11, sin actualizar) | **AHORA** (revisión y puesta al día) | Integrar el master actual (FT3D-8 cambió `index.html`: hay un conflicto trivial de scripts), revisar la seguridad del enlace, móvil y retirada, y pedir revisión visual tuya. Después, merge con autorización. |
| C-02 | Dossier comercial antes/después y precio | P (dossier, láminas y presupuesto) | SÍ (corte 2–3) | Reutilizar `project-dossier-ui`, `economic-dossier` y UX-07. Las cifras parciales se rotulan como parciales, como ya hace D-01. |
| C-03 | Portal multiusuario y white-label | N | DIFERIR | Exige autenticación, retención y modelo de precios. |
| G-01 | Auditoría del plano original frente al modelo | N | **SÍ** (corte 4, laboratorio) | Inspirada en `wallaudit.py` de house-plan-designer: contrastar muros y huecos importados con las cotas del original y señalar contradicciones. Implementación propia en JS sobre `plan-intake.js`. |
| G-02 | Exportación DXF 2D | **N** (solo hay importación) | **SÍ** (corte 4) | Subconjunto 2D (muros, huecos, estancias y cotas, por capas, en mm), con prueba de ida y vuelta contra el propio importador. |
| G-03 | Generador paramétrico de distribuciones | N | DIFERIR | Antes, criterios y pruebas. No se infiere normativa. |
| G-04 | Foto/LiDAR → espacio métrico | N | DIFERIR | Exige evidencia métrica y validación humana. |
| G-05 | Cámara territorial y contexto | P (GeoProvider, Catastro, terreno) | PATRÓN | Solo patrones de cámara y LOD. Datos con licencia propia. |
| A-01 | Asistente de consulta (AG-1) | R (rama: 5 archivos) + MCP local **E** | SÍ (corte 4: AG-2A simulado) | Reutilizar `tools/rubik-mcp`, que ya mide, calcula holguras y rutas, en lugar de duplicarlo. Sin API de pago hasta autorizar presupuesto. |
| A-02 | Edición asistida con diff y deshacer | N | DIFERIR | Después de A-01 y de definir permisos. Nunca escribir sin revisión. |

---

## 4. Recursos externos: verificación y decisión

### 4.1 Recursos del informe de entrada

| Recurso | Qué es realmente (verificado) | Licencia | Decisión |
|---|---|---|---|
| **house-plan-designer** (ZWD11) | *Skill* para agentes que genera un diseñador HTML de un solo archivo a partir de un plano. Usa Python (OpenCV, PyMuPDF, ezdxf) y Three.js. Importa PDF vectorial y DXF, exporta **DXF R2007 con capas y cotas**, alinea dos planos por cadenas de cotas y tiene un **`wallaudit.py`** que contrasta el modelo con el original. Rutas de instalaciones según normas **chinas GB**. | MIT (declarada) | **Tomar ideas, no código ni normas.** Útil para G-01 (auditoría de muros y cotas) y G-02 (exportación DXF por capas). Las instalaciones no aplican: en España rigen CTE y REBT. Su stack Python no encaja en el cliente web de RUBIK. |
| **Obscura** (h4ckf0r0day) | Navegador headless en Rust, compatible con CDP y Playwright, orientado a *scraping* y agentes. | Apache-2.0 | **NO migrar la CI.** No consta soporte WebGL/GPU, y RUBIK depende de WebGL (SwiftShader en CI). Como mucho, un experimento aislado para pruebas solo de DOM. |
| **GenCAD** (MIT DeCoDE, arXiv 2409.16294) | Investigación académica: imagen → CAD mecánico BREP con transformers y difusión. | Sin verificar para el código | **NO** como generador de planos. Dominio mecánico. Como mucho, referencia futura para V-06. |
| **Solvaix / Revit MCP** | Patrón de leer antes de escribir, con guardas y revisión humana. | No verificada en esta sesión | **PATRÓN** para A-01 y A-02. Ya aplicado en el MCP local. |
| **breakboard.art** | Referencia de interacción y rendimiento en Three.js. | No localizada | **PATRÓN**, sin copiar activos. |
| **Architecture & Design (Steam)** | Producto comercial cerrado. | Comercial | **PATRÓN UX** únicamente. |
| **God's Eye View** | Cámara territorial con datos de terceros. | Datos con licencia propia | **PATRÓN** de cámara y LOD. Sin datos. |
| **OSIRIS** | OSINT: CCTV, vuelos y riesgos. | — | **NO.** Fuera de dominio. |

### 4.2 Fuentes adicionales aportadas por el propietario el 09/11 (verificadas)

| Recurso | Qué es (verificado) | Licencia | ¿Nos interesa? | Cómo aprovecharlo |
|---|---|---|---|---|
| **Open PDF Studio** (OpenAEC Foundation) | Editor PDF para planos de obra: 20+ marcas, **medición a escala con calibración y varias escalas por hoja**, conteo, tablas de cantidades a CSV y **comparación de revisiones** (superposición, lado a lado y deslizador, con lo añadido en verde y lo quitado en rojo). Web, escritorio y Android, con servidor MCP. | **LGPL-3.0** | **Sí, como referencia directa** | Es el modelo de UX para tres de nuestras líneas: **G-01** (contrastar plano importado y modelo), **UX-07** (comparar revisiones con verde/rojo y deslizador) y **mediciones sobre el PDF importado** antes de trazar. No copiar código: LGPL en una app web de un solo bundle complica el cumplimiento. Usar PDF.js, que ya es Apache-2.0. |
| **IngeTrazo** (Perú) | Modelador 3D de escritorio para arquitectura e ingeniería: push/pull, capa BIM opcional, **compositor de láminas a escala**, terreno satelital, IA con **puente MCP para Claude** y recetas que se pueden deshacer. Exporta glTF, IFC, DXF y PDF vectorial. | **GPL-3.0** | **Patrón** | Confirma el valor de G-02 (DXF), de las láminas a escala (ya las tenemos) y del patrón «IA → receta revisable y deshacible» para A-02. No reutilizar código GPL en RUBIK. |
| **MaterialCraft** (storytold) | Diseñador de materiales procedurales por nodos en Rust, que funciona en el navegador vía WASM. Exporta mapas PBR (color, normal, rugosidad, metal, altura, AO). | MIT / Apache-2.0 | **Sí, como herramienta interna** | Para **producir texturas propias y sin royalties** para la biblioteca de superficies (`surface-catalog.js`), fuera de la app. No integrarlo en el producto. |
| **GeoLibre v3.7** (opengeos) | GIS web y de escritorio (MapLibre, deck.gl, DuckDB-WASM): **interiores IMDF/IndoorGML** con selector de plantas, plantas extruidas por nivel, I3S Building Scene Layers (BIM por disciplina). Se puede embeber. | MIT | **Patrón**, e investigación futura | El **selector de plantas en mapa** y «clic en estancia → su planta» refuerzan UX-05. **Exportar a IMDF** (estándar de interiores de Apple) sería una salida interesante para promotoras y centros grandes (corte 5). No sustituye nuestro GeoProvider. |
| **CivilCraft** (CadCraft) | Diseño civil: superficies TIN, alineaciones, perfiles, explanaciones, redes de saneamiento y movimiento de tierras. LandXML, IFC 4.3, DWG y PDF. Web y escritorio. | Apache-2.0 (guardar en web exige licencia comercial) | **No por ahora** | Fuera de vivienda e interiores. Solo sería relevante si RUBIK entrase en urbanización. Su familia (BimCraft, TakeoffCraft, MarkupCraft) merece **vigilancia como competidor**. |
| **Bonsai** (Blender BIM) | Autoría y revisión IFC sobre Blender. | GPL-3.0 | **Patrón / herramienta externa** | Para **validar nuestras importaciones IFC** con un lector independiente y para el piloto offline de Blender ya documentado. No embeber. |
| **Amazon Berkeley Objects** | ~8.000 modelos 3D glTF con PBR 4K y metadatos (dimensiones y material) de 147.000 productos. | **CC BY 4.0** desde 2023 (antes CC BY-NC) | **Sí, con cuidado** | Candidato a **ampliar el catálogo de muebles** con atribución «Amazon.com». Antes, comprobar tamaño (de 1 a 44 MB por modelo, hay que optimizar), marcas registradas visibles y la atribución en la ficha legal. |
| **GeoModel3D** | Modelos geológicos 3D a partir de sondeos y CPT, en el navegador. | Apache-2.0 | **No** | Geotecnia. Fuera del alcance de vivienda. |
| **Flat Pack, Step by Step** (sael.net) | Instrucciones de montaje de IKEA en 3D, paso a paso. | No declarada | **Patrón** | Idea para la Evolución 4D y para presentaciones: «paso a paso girable» como formato de explicación. No usar los modelos de IKEA (marca y licencia). |
| **Operum**, **ZZTakeoff**, **ContractorOS** | Gestión y estimación de obra (Operum, gratuito), mediciones sobre plano (ZZTakeoff, comercial). | Propietarias | **Benchmark** | Comparar flujos de medición y presupuesto con nuestro C1–C4 y BC3. Ninguna integración: no publican formatos abiertos comprobados. |
| **GanttProject, Trello, LibreOffice Calc, Google Drive, Mitti, Jibble, Manager** | Herramientas genéricas de oficina, tareas, inspección, fichajes y contabilidad. | Varias | **Solo interoperabilidad** | Asegurar que nuestras **exportaciones CSV, BC3, MP4 y PDF** se abran bien en ellas. GanttProject lee CSV/MS Project: posible exportación del plan de obra en un formato que lea (corte 4). |
| **Matelume, «Image to 3D», Baga CAD, Blockd, World Creator, UE6, addons de Blender** (lista de un vídeo) | Herramientas de arte y videojuegos, en su mayoría comerciales, con enlaces de afiliado. | Comerciales / varias | **No** (salvo lo siguiente) | Solo **Poly Haven** (texturas y HDRI CC0, citado en la lista) es aprovechable directamente para la biblioteca de superficies. El resto es para un pipeline offline de Blender, no para el producto. |
| **pyGeoMapper, pyTopoComplexity** | Librerías Python de geociencia. | — | **No** | Fuera de dominio. |

**Qué cambia en la matriz por estas fuentes:**
- **UX-07 y G-01** suben de valor: Open PDF Studio demuestra que la comparación de revisiones en verde/rojo y la medición calibrada sobre PDF son funciones que los profesionales usan a diario.
- **Nueva candidata G-06 · Medir sobre el plano importado** (distancia, área y conteo, con calibración) antes o sin necesidad de trazar. Reutiliza la escala de `tracing-core.js`. Recomendación: **SÍ, corte 2–4**.
- **Nueva candidata V-10 · Biblioteca propia de materiales y muebles**: texturas propias con MaterialCraft, CC0 de Poly Haven y modelos CC BY de ABO con atribución. Recomendación: **SÍ, corte 3**, siempre con el registro de licencias.
- **Nueva candidata G-07 · Exportación IMDF** del edificio: **DIFERIR** (corte 5).

---

## 5. Orden recomendado (por valor y dependencias, sin fechas)

**Gate 0 · Higiene (sin funciones nuevas, todo con tu autorización):**
1. Fusionar Render IA D1 (#180 → #182, #181) con `RUBIK_RENDER_ENABLED=1` activado antes del Promote.
2. Cerrar o archivar las PR obsoletas #133–#151 y #90. Su contenido ya está en master; se puede comentar en cada una con el commit de integración.
3. Decidir el destino de las ramas visuales abiertas (#165, #167 y #169 F03), de #160–#162 (docs) y de la rama documental de preparación: fusionarlas como documentación o archivarlas.
4. Crear el **registro único de capacidades** (UX-02), que es la base para no volver a prometer cosas de ramas.

**Corte 1 · Confianza comercial:** HOME-UX-E2 con el perfil Constructora (UX-01 y UX-02), y puesta al día de **#166** para tu revisión visual.

**Corte 2 · Mejoras rápidas que reutilizan módulos existentes:** minimapa en el paseo (UX-22), accesos por estancia en el 3D (UX-23), «abrir todas las puertas» (UX-25), antes/después (UX-07), cotas en vivo (UX-08), maqueta blanca y ocultar muebles (UX-09), selector de modos (UX-05), panel contextual 3D (UX-03), dossier antes/después (C-02), ayudas (UX-04, solo delta) y **medición sobre el plano importado (G-06)**.

**Corte 3 · Nuevas ofertas:**
- estudio de imágenes (V-02), con cámara colocable (UX-16);
- presets de amueblamiento por estancia y densidad, con semilla reproducible (UX-12), más sugerencia de tipo de estancia (UX-24);
- «trae tu mueble» simple: foto + medidas → volumen genérico (V-11);
- biblioteca propia de materiales y muebles con licencias registradas (V-10);
- material del muro desde el 3D (UX-11);
- pilotos FOT-01 (V-03) y CAT-IA1 (V-04), con consentimiento y presupuesto de prueba.

**Corte 4 · Interoperabilidad y asistente:** auditoría del plano importado (G-01), exportación DXF 2D (G-02) y AG-2A simulado sobre el MCP local (A-01).

**Corte 5 · Diferido:** Move Rooms, foto → 3D medible, CAT-IA2/3, 360, IFC/LiDAR, exportación IMDF (G-07), portal multiusuario, asistente con escritura y vídeo generativo.

---

## 6. Qué NO hacer

- No rehacer lo que existe: minimapa, 4D, puertas en el recorrido, comparador de variantes, presupuesto, solar y multiplanta.
- No anunciar en la Home nada que solo esté en una rama. Las ramas con CI verde no son master.
- No copiar código, modelos, texturas ni datos de terceros sin una licencia comprobada. MIT del código no cubre los activos.
- No integrar normas de instalaciones chinas ni prometer cumplimiento normativo.
- No mostrar telemetría, estados o costes que no salgan de datos reales del proyecto.
- No consumir API de pago ni tocar Production por inferencia de esta matriz.

---

## 7. Decisiones que te corresponden

| Decisión | Opciones | Mi recomendación |
|---|---|---|
| D1. Fusión de Render IA | Autorizar #180, #182 y #181 | Autorizar, con la variable activada antes del Promote |
| D2. PR obsoletas | Cerrar, archivar con comentario o dejar | Cerrar con un comentario que enlace el commit de integración |
| D3. Segmento comercial prioritario | Inmobiliaria / arquitectura / reformas / promotora / constructora | Empezar por **inmobiliaria y arquitectura**, que tienen el recorrido más maduro, y añadir constructora tras UX-01 |
| D4. #166 Entrega cliente 3D | Ponerla al día y revisar, o aplazar | Ponerla al día: es el cierre natural del flujo |
| D5. Presupuesto de pruebas IA | Cuantía mensual para V-02, V-03 y V-04 | Fijarlo en la cuenta del proveedor antes de cualquier piloto |
| D6. Licencias de catálogo | Qué fabricantes y con qué permiso escrito | Obligatorio antes de V-04 |
| D7. Rama documental de preparación | Fusionar como documentación o archivar | Fusionar solo los documentos que sigan vigentes, con nota de que se refieren a `0f9c6ea` |

---

## 8. Validación con profesionales (antes de los cortes 3–5)

Mantener el piloto propuesto en el informe de entrada: 5 profesionales de distintos perfiles, con *fixtures* consentidos. Medir:
- **Tiempos:** importar plano → propuesta → presupuesto revisado → entrega comentable.
- **Calidad de la IA:** bloqueos, ratio de aceptación de imágenes y coste por imagen aceptada (ya medible con #182).
- **Rendimiento:** en portátil medio y en móviles físicos.

**Ninguna tarifa ni plazo de los PDF se toma como presupuesto.**
