# RUBIK SOTA — Fichas de auditoría de los 4 PDF de referencias UI/UX

**Fecha:** 09/11/2026 · **Estado documental:** AUDITADO, con evaluación reproducible contra el SHA indicado. Las recomendaciones quedan como **PROPUESTO**. **Nada queda aprobado para implementar.**

| Concepto | Valor |
|---|---|
| Fuente | Rama `docs/referencias-nuevas-para-auditar-e-implementar-2026-11-06@66b24b0`, carpeta `REFERENCIAS NUEVAS PARA AUDITAR E IMPLEMENTAR/` (4 PDF + README) |
| Base de comparación | `master@de52d57`, idéntico a Production desde el 09/11/2026 |
| Documento principal | [`auditoria-oportunidades-ux-servicios-2026-11-09.md`](./auditoria-oportunidades-ux-servicios-2026-11-09.md) (matriz unificada e IDs UX-, V-, C-, G-, A-) |
| Método | Texto extraído de los PDF, contrastado afirmación por afirmación con el código de master (archivo y símbolo citados). Los vídeos originales no estaban disponibles. |

## 0. Lectura transversal: cómo tratar estos PDF

Los cuatro PDF se escribieron **para una demo de inversores «la semana que viene»**. Eso explica cuatro sesgos que hay que corregir antes de usarlos:

1. **Diagnósticos de ausencia que ya no son ciertos.** Afirman, entre otras cosas, que «el edificio aparece de golpe», que las puertas son «bloques rígidos», que no hay minimapa, que no hay medición y que el solar está «aislado». Muchas de esas funciones existen en master. Ver la columna «Realidad» de cada ficha.
2. **Plazos imposibles.** Proponen «Move Rooms en 2 días» o «foto → mueble 3D en 2–3 días». Se descartan como presupuesto, igual que todos sus plazos.
3. **Rutas de código inventadas o desfasadas.** Citan `room-layout-ui.js` para el minimapa, cuando nuestro minimapa vive en la Presentación, e `inspector de muebles`. Las guías técnicas del PDF no son instrucciones: hay que diseñar sobre las autoridades reales.
4. **Estética de «cabina de mando» sin datos.** Proponen «NOMINAL», «VERIFIED», «60 FPS», grúas y aerogeneradores. Contradicen la regla del producto de no mostrar estados que no salgan de datos reales. Se descartan.

**Qué sí aportan, y mucho:** un **vocabulario de interacción** muy concreto y bien observado (barras flotantes, tarjetas contextuales, comparación con cortina, cámaras por estancia, píldora de inspección, densidad de amueblamiento, toasts con recuento). Es el material para el **Corte 2** (mejoras rápidas) y para la **Home**.

**Leyenda.** Estado: **E** existe en master · **P** parcial · **N** no existe. Decisión: AHORA / SÍ / PATRÓN / DIFERIR / NO.

---

## 1. Ficha · Maket.ai (trilogía de vídeos, 10 páginas)

**Tesis del PDF:** Maket convierte mejor ante usuarios no técnicos gracias a cinco cosas: onboarding conversacional, Move Rooms, cortina antes/después, «trae tu propio mueble» y cámara 2D + minimapa + barra de render.

| # | Propuesta del PDF | Realidad en `master@de52d57` | Decisión | Cómo integrarla sin duplicar |
|---|---|---|---|---|
| M1 | Entrada bifurcada «Generar plano / Subir plano» | **E**: la bienvenida ya ofrece subir plano, empezar en blanco y ejemplo (`guide-ui.js`: `welcomeUpload`, `welcomeBlank`, `welcomeExample`) | Mejorar en **UX-01** | Jerarquía y texto por profesión. No crear otra entrada. |
| M2 | Asistente conversacional con tarjetas (1–4 plantas, silueta L/U/T, contadores de estancias) que **genera** el plano | **N**: no hay generador de distribuciones. La guía local de intención existe (`guide-core.js`), pero no genera geometría. | **DIFERIR** (G-03) | Requiere un generador con restricciones y criterios de calidad. Antes de que exista, un asistente con tarjetas solo podría **guiar** (crear edificio de N plantas, abrir importación), nunca generar plantas. |
| M3 | **Move Rooms**: arrastrar una estancia sobre otra e intercambiarlas, recolocando muros, puertas y muebles | **N** | **DIFERIR** (UX-14) | El PDF propone «permutar nombre y tipo y reamueblar». Eso **no** es intercambiar estancias de distinto tamaño: falsea la geometría. Una versión honesta requiere un solver. **Versión mínima aceptable:** intercambiar solo el *uso* entre dos estancias (tipo y nombre) con aviso, sin tocar muros. Coste bajo, valor limitado. |
| M4 | **Cortina antes/después** sobre el plano y entre 2D y 3D | **P**: comparador de variantes con métricas (`project-variants.js`), real↔IA en Render IA | **AHORA** (UX-07) | Fase 1: cortina entre **dos revisiones o variantes**, sobre las capturas reales de `project-views-ui.js` y la lámina 2D. Fase 2: 2D↔3D de la misma vista. |
| M5 | **«Trae tu propio mueble»**: foto → recorte (SAM) → medidas → 3D | **N** | **DIFERIR** la reconstrucción 3D (V-06); **SÍ** la versión simple | Versión honesta y barata: subir foto + medidas reales → **caja escalada con la foto como textura frontal o en ficha**, marcada «volumen genérico». El recorte automático y la malla 3D exigen un servicio de pago (V-06). |
| M6 | **Cámara colocable en el 2D** con cono de visión, ligada al render | **N** | **SÍ** (UX-16, junto a V-02) | Las vistas actuales son las paradas automáticas de la Presentación. Añadir una cámara manual que use `View3D.presentationGo` y `deliveryShot`, y que el Render IA use ese encuadre. |
| M7 | **Minimapa PIP en el paseo 3D**, con la estancia actual resaltada | **P**: el minimapa existe en la Presentación, pero **se oculta mientras se camina** (`index.html`: `.presentation-overlay[data-walking="true"] .presentation-minimap{display:none}`) | **SÍ** (nueva **UX-22**) | Reutilizar el mismo minimapa durante el paseo, en formato compacto. Coste bajo y delta real. |
| M8 | Selector de vistas 3D (isométrica / paseo / volumetría) | **P**: órbita, paseo, Presentación, «Muros seccionados» y modo INTERIOR | **SÍ** (UX-05 + UX-09) | Agrupar los controles existentes. «Volumetría» = maqueta blanca (UX-09). |
| M9 | Barra «Render scene» con prompt libre y tira de variantes | **P**: Render IA con estilos y acabados de listas cerradas; alternativas visibles en el diálogo | **SÍ, con matiz** (V-02) | **No abrir prompt libre**: #180 y la política de B2/B8 mantienen listas cerradas por seguridad y coste. La tira de variantes sí, dentro del estudio de imágenes. |
| M10 | Cotas en vivo hasta paredes y muebles al mover un mueble | **N** (la fuente de cálculo existe: `layout-review.js`) | **SÍ** (UX-08) | Rayos ortogonales desde la huella orientada, con la misma geometría de `layout-review`. |
| M11 | Panel derecho que cambia entre planta y estancia (área, dimensiones, «Amueblar estancia», acabados) | **P**: panel de estancia con dimensiones; superficies; sin «Amueblar estancia» | **SÍ** (UX-03 + UX-12) | El botón «Amueblar estancia» depende de UX-12 (presets con `furniture-placement.js`). |
| M12 | Contador de créditos visible en cabecera | **N** (#182 mide consumo por imagen) | **SÍ, después** | Cuando haya cuotas por usuario. Hoy basta con «consumo de esta imagen» (#182). |

**Veredicto:** máximo valor en **M4, M7, M10 y M6**. M3 y M5 en versión mínima y honesta. M2 diferido.

---

## 2. Ficha · ERECTION.OS / BIM 4D (8 páginas)

**Tesis del PDF:** una línea de tiempo 4D reproducible con hologramas, telemetría y capas de ingeniería impresiona a inversores y constructoras.

| # | Propuesta del PDF | Realidad en `master@de52d57` | Decisión | Cómo integrarla |
|---|---|---|---|---|
| E1 | Timeline 4D con play, nodos de fase y velocidades | **E**: Evolución 4D de FT3D-8 (`evolucion/fidelity-app.js`, con reproducción y selector de velocidad), Gantt (`evolucion/gantt-view.js`), plan de obra (`construction-*.js`) y MP4 | **NO rehacer** (UX-18) | Solo pulido: hitos clicables en la barra si faltan y botón «volver al inicio». Validar con EX-11-k.6 (movimiento reducido). |
| E2 | «Ghost» holográfico antes de que aparezca cada pieza | **P**: la escena ya pinta **fantasmas** para elementos sin tarea, color «en bruto» antes del acabado y demoliciones (`evolucion/project-scene.js`: `GHOST`, `RAW`, `DEMOLISH`) | **SÍ, pequeño** (UX-19) | Previsualizar en fantasma los elementos de la **siguiente tarea real**, durante su ventana de fechas. Nada de cian «láser» decorativo. |
| E3 | Panel de telemetría: % construido, coste acumulado, partidas validadas | **P**: la Evolución ya muestra cobertura de partidas y estado del plan; FT3D-8 tiene tarjetas económicas | **SÍ, con condiciones** (UX-20) | Un anillo «% del plan» y «coste planificado hasta la fecha» **solo** con presupuesto C1–C4 y plan vinculados. Rotular siempre «planificado», nunca «ejecutado». |
| E4 | Capas de ingeniería (cargas, holguras, MEP) | **P**: el tipo de muro **declarado** por el profesional existe (`project-core.js`: `load-bearing`, `partition`, con su procedencia), pero **no es una verificación estructural**. `layout-review` calcula holguras. **No hay instalaciones (MEP).** | **SÍ** muros de carga y holguras · **NO** MEP | Conmutador «Muros de carga (declarados)» y «Pasos libres» con datos reales, rotulando siempre la procedencia de la declaración. MEP no existe en el modelo: dibujar conductos sería inventar. |
| E5 | Velocidades 0.5x–5x y «reiniciar obra» | **E/P**: hay selector de velocidad | Ver E1 | — |
| E6 | Semáforo «NOMINAL» y reloj | **N** | **NO** como estética · **SÍ** como validación real | Un indicador «Integridad del proyecto» solo si refleja validaciones existentes (estancias cerradas, conflictos de edificio, plan rechazado). Nunca un «NOMINAL» fijo. |
| E7 | Entorno vivo: grúa, aerogeneradores, acopio | **P**: elementos ilustrativos en la Evolución (`evolucion/illustrative-props.js`) | **NO ampliar** | Ya hay atrezo ilustrativo marcado como tal. Grúas que «mueven piezas» serían marketing sin datos. |
| E8 | Edificio multiplanta que crece planta a planta | **P**: multiplanta (`building-ui.js`) y crecimiento por tareas en la Evolución | **Verificar** | Comprobar que la Evolución recorre bien los edificios de varias plantas. Si no, es un defecto de FT3D-8, no una función nueva. |
| E9 | Unidades SI / imperial | **N** (solo métrico) | **DIFERIR** | Útil solo con clientes fuera de España. |

**Veredicto:** el 4D **ya existe**. Este PDF sirve para **pulir** FT3D-8 (E2, E3 y E4 con datos reales) y como guía de lo que **no** hacer (E6 y E7).

---

## 3. Ficha · Makio «Apartment Model» (10 páginas)

**Tesis del PDF:** la experiencia interior a la altura de los ojos, con lienzo a pantalla completa y tarjetas flotantes contextuales.

| # | Propuesta del PDF | Realidad en `master@de52d57` | Decisión | Cómo integrarla |
|---|---|---|---|---|
| K1 | Barra de cámaras por estancia (HOME / ENTRY / KITCHEN…) | **P**: la Presentación tiene **paradas por estancia** con encuadre calculado (`presentationGo`) y FT3D-1b «Entrar en la estancia». Fuera de la Presentación no hay barra. | **SÍ** (nueva **UX-23**) | Exponer las paradas existentes como **barra de accesos por estancia** también en la vista 3D normal. Mismo cálculo, sin cámaras nuevas. |
| K2 | Maqueta blanca ↔ acabados reales, y ocultar muebles | **P**: hay visibilidad de muebles por planta, pero no un conmutador de maqueta | **SÍ** (UX-09) | `overrideMaterial` o un intercambio de materiales guardando los originales, más el conmutador de muebles. Barato y muy vistoso para arquitectura. |
| K3 | Puertas, armarios y cortinas animados, y «abrir todas» | **E** puertas: se abren y cierran con toque o clic en 3D y en el paseo · **N** armarios y cortinas | Puertas: **solo** «abrir todas» (SÍ, pequeño) · armarios y cortinas: **DIFERIR** | «Abrir/cerrar todas las puertas» reutiliza el mecanismo actual. Los armarios exigen modelos con piezas móviles. |
| K4 | Sol por hora y mes, temperatura de color y persianas | **P**: solar con orientación y ubicación privada (`solar-core.js`, `solar-ui.js`) y lámparas de techo en la Presentación | **DIFERIR** (UX-21) | Primero, presentar el sol actual en un panel flotante sencillo (hora y mes). Kelvin y persianas, después. Nunca prometer lux. |
| K5 | Píldora de inspección bajo el cursor (nombre, medidas) | **P**: hay raycaster y selección de muebles en 3D (`View3D.pickFurnitureAt`) | **SÍ, después de UX-03** (UX-10) | Mostrar nombre y medidas del catálogo. **Sin precio** mientras no exista catálogo comercial (CAT-IA). |
| K6 | Doble clic en una pared 3D → cambiar su acabado | **P**: diálogo de superficies con selección de muro (`surface-ui.js`) | **SÍ** (UX-11) | Abrir el diálogo de superficies existente desde el impacto del raycast, con deshacer. |
| K7 | Tarjeta flotante de mueble: bloqueo, rotación ±15°/90°, tela, color, precio y sustituir | **P**: edición de muebles en 2D y 3D (arrastrar, propiedades) | **SÍ** (UX-03) | Rotación por pasos y bloqueo: baratos. «Sustituir por otro del mismo tipo»: reutiliza `furniture-search.js`. Precio: solo con CAT-IA. |
| K8 | Selector de unidad o tipología del edificio, más altura de techo visible | **P**: multiplanta con selector de nivel; la altura de muro existe en el modelo (`wallHeightMm`) | **SÍ** (UX-05) | Mostrar la altura libre y el selector de planta junto al 3D. Las «unidades de una promoción» como entidad no existen: **DIFERIR**. |
| K9 | Lienzo 3D a pantalla completa con cápsulas flotantes | **P**: la Presentación ya ocupa la pantalla con tarjetas | **PATRÓN** | Aplicar al modo 3D normal solo si la revisión visual lo pide. No rediseñar toda la app. |

**Veredicto:** **K1, K2, K6 y K7** son mejoras de alto valor y coste contenido porque **reutilizan** autoridades existentes. K3 ya está hecho en lo esencial.

---

## 4. Ficha · Floorcraft Beta, «para inversores» (11 páginas)

**Tesis del PDF:** RUBIK es técnicamente muy superior (lo reconoce: multiformato, calibración, muros estructurales, solar, multiplanta, presupuestos y entrega), pero Floorcraft gana los primeros 90 segundos con gratificación inmediata.

| # | Propuesta del PDF | Realidad en `master@de52d57` | Decisión | Cómo integrarla |
|---|---|---|---|---|
| F1 | Stepper de 7 fases (Contorno → Muros → Estancias → Puertas → Generar → Luz → 3D) | **P**: la guía tiene etapas (Empezar, Preparar, Distribuir, Amueblar, Revisar y guardar: `guide-core.js`) y el área de trabajo profesional tiene cinco áreas | **PATRÓN** | No añadir un segundo stepper. Si la revisión lo pide, hacer más visible el de la guía. |
| F2 | Paleta de 9 herramientas con atajos de una letra (V, H, O, W, T, D, N, L, M) | **E** en buena parte: herramientas con atajo, incluida **Medir (M)**, deshacer y rehacer, y la ayuda «Atajos de teclado» | **Solo delta** (UX-04) | Auditar qué atajos faltan. No duplicar la paleta. |
| F3 | Barra guía inferior que cambia según la herramienta activa | **P**: guía contextual y ayudas | **SÍ** (UX-04) | Una línea de ayuda por herramienta, desde la guía existente. |
| F4 | Toasts con recuento («65 piezas colocadas») | **P**: hay sistema de toasts | **SÍ, pequeño** (UX-04) | Mensajes con cifra real tras acciones masivas: presets, importación, autoasignación. |
| F5 | KPI en vivo: superficie, estancias, puertas, muebles | **P**: «Superficie útil» y métricas de variantes; dossier | **SÍ** (UX-03) | Bloque de KPI siempre visible en el panel, desde `project-variants.metrics` y la geometría canónica. |
| F6 | «Auto-asignar» el tipo de estancia por área y conexiones | **N** (hay familias de estancia: `project-core.js` `roomFamilies`) | **SÍ, con revisión** (nueva **UX-24**) | Proponer tipos con una regla explicable (área, sanitarios, puertas). **Siempre como sugerencia** que el profesional acepta. Nunca asignar en silencio. |
| F7 | Amueblar por estancia en 1 clic, densidad Mínima/Equilibrada/Acogedora y «aleatorizar» con semilla | **N** | **SÍ** (UX-12) | Recetas declarativas por tipo de estancia × densidad, colocadas con `furniture-placement.js` (**determinista con semilla**: así una demo es reproducible) y validadas con `layout-review.js`. |
| F8 | 6 estilos globales que cambian materiales y textiles a la vez | **P**: biblioteca de superficies y moodboard | **SÍ, después** (UX-13) | Primero superficies. Mobiliario por estilo, cuando exista catálogo suficiente (V-10). |
| F9 | Plan de iluminación con luminarias, lux por estancia y «ver de noche» | **N** (solo lámparas ilustrativas en la Presentación) | **DIFERIR** | Un cálculo de lux creíble es un proyecto en sí mismo y tiene implicaciones normativas. «Ver de noche» como **ambiente** (sin cifras) sí sería barato. |
| F10 | Modos 3D: casa de muñecas, muros completos, corte | **E/P**: «Muros seccionados», sección y cortes en la Presentación, INTERIOR | **Solo agrupar** (UX-05) | — |
| F11 | Captura de pantalla y centrar cámara | **E**: exportación PNG e imágenes de entrega | **NO duplicar** | — |
| F12 | «Cada cambio mueve el presupuesto (€) y las mediciones (m²)» | **P**: C1–C4 con cantidades y precios, pero calculados bajo demanda | **SÍ, con cuidado** | Un indicador de «presupuesto desactualizado → recalcular» es más honesto que un total que cambia en vivo con datos parciales (regla D-01: «Total parcial»). |

**Veredicto:** este PDF es **el más útil para la Home y para el Corte 2**. Lo más valioso: **F7** (amueblar por estancia con semilla), **F5** (KPI), **F6** (sugerir tipos) y **F4** (toasts con cifra).

---

## 5. Nuevas candidatas surgidas de las fichas

Se añaden a la matriz del documento principal.

| ID | Mejora | Origen | Estado | Recomendación |
|---|---|---|---|---|
| **UX-22** | Minimapa también durante el paseo 3D, compacto, con la estancia actual | Maket M7 | P (existe, se oculta al caminar) | **SÍ, corte 2**: coste bajo |
| **UX-23** | Barra de accesos por estancia en la vista 3D normal | Makio K1 | P (las paradas existen en la Presentación) | **SÍ, corte 2** |
| **UX-24** | Sugerir el tipo de estancia (aceptar o rechazar) | Floorcraft F6 | N | **SÍ, corte 3** |
| **UX-25** | «Abrir/cerrar todas las puertas» | Makio K3 | P (las puertas se abren una a una) | **SÍ, corte 2**: pequeño |
| **UX-26** | Intercambiar solo el **uso** entre dos estancias (sin mover muros) | Maket M3 (mínimo honesto) | N | Opcional, corte 3 |
| **V-11** | «Trae tu mueble» simple: foto + medidas → volumen genérico con imagen | Maket M5 (mínimo honesto) | N | **SÍ, corte 3**, sin servicio de pago |

---

## 6. `house-plan-designer` (ZWD11): revisión en profundidad

**Qué es:** una *Skill* para agentes LLM («no recomendado con modelos como Doubao») que convierte un plano en **un diseñador HTML de un solo archivo**. Licencia MIT. Scripts Python (OpenCV, PyMuPDF, ezdxf) y Node (Playwright para QA).

**Su cadena de trabajo:**
1. medición: vector directo o imagen con detección de muros, ticks de cota y OCR de cifras;
2. el **agente** interpreta, completa muros y huecos y escribe un JSON de vivienda;
3. **autoinspección** con navegador headless (estancias cerradas, muros flotantes, cotas frente al original, superposición semitransparente sobre la imagen original) en bucle hasta coincidir;
4. amueblamiento automático e **instalaciones eléctricas y de fontanería según normas chinas GB**.

**Lo que tiene y RUBIK no, por orden de interés:**

| Técnica | Cómo funciona en el repositorio | Valor para RUBIK | Cómo lo haríamos nosotros |
|---|---|---|---|
| **Auditoría de muros** (`wallaudit.py`) | Corta el original cada 150 mm a lo largo de cada muro y cuenta líneas dentro del grosor: 2 = muro, 3–4 = ventana, 0 = hueco, gris = pilar. Compara con el modelo y enmascara los muebles adosados. | **Muy alto** para G-01: detecta muros y huecos mal importados | Implementación propia en JS sobre la imagen de referencia ya calibrada (`tracing-core.js`) y el modelo canónico. Informe de discrepancias **sin corregir en silencio**. |
| **Cadenas de cota contra el modelo** (`check.mjs`) | Recoloca cada cadena de cotas del plano en el modelo, busca el eje o cara de muro más cercano a cada tick e informa diferencias > 30 mm | **Alto**: prueba objetiva de fidelidad de la importación | Usar las cotas que el profesional introduce o confirma («Distancia conocida» ya existe) como cadena de control. |
| **Alinear dos planos** (`align2.py`) | Mínimos cuadrados sobre ticks de cota para llevar un plano de reforma a las coordenadas en mm del original | **Alto** para reformas: plano actual frente a reforma → alimenta UX-07 | Opción «Plano de reforma» que se superpone al original con escala y origen ajustados. |
| **Exportación DXF profesional** | R2007, 1:1 en mm, capas separadas, grosores por tipo, **muros de carga en negro, nuevos con rayado 45°, demolidos en discontinua**, cotas como objetos DIMENSION reales, ejes, numeración de carpinterías, cajetín, escala automática y bloques para muebles | **Muy alto** para G-02 | Nuestro modelo **ya distingue** el estado del muro (`existing` / `demolished`) y su tipo declarado (`load-bearing` / `partition`), así que la leyenda «existente / demoler / carga declarada» sale de datos reales. Empezar por capas, muros, huecos, estancias y cotas DIMENSION, con una prueba de ida y vuelta contra nuestro importador DXF. **Usar normas españolas de representación**, no GB. |
| **QA del diseñador con navegador** (`qa.mjs`, `clicktest.mjs`, `walktest.mjs`) | Acciona cada función del HTML generado | Bajo: RUBIK ya tiene una QA con Playwright muy superior | — |
| **Instalaciones automáticas** (`elecaudit.mjs`, A* sobre rejilla de 100 mm) | Circuitos y tuberías según GB 50096/50311/50242/50015 | **No aplicable** | En España rigen REBT y CTE-HS. Calcular instalaciones es responsabilidad profesional: **NO**. |

**Riesgos:**
- El origen y las licencias de sus **muebles y modelos 3D no se declaran**: no reutilizar activos.
- Depende de un agente LLM para «comprender» el plano: no es un algoritmo determinista que podamos embeber tal cual.
- Su interfaz y documentación están en chino y siguen normas chinas.

**Decisión:** **adoptar las técnicas** de auditoría (wallaudit, cadenas de cota, alineación de dos planos) y el **diseño de la exportación DXF**, reimplementados en nuestro stack y con nuestras normas. **No** integrar el repositorio ni sus activos.

---

## 7. Comprobación de acceso a fuentes

| Fuente | Acceso | Resultado |
|---|---|---|
| 4 PDF + README (rama de referencias, `66b24b0`) | **Sí** | Auditados en este documento |
| `ZWD11/house-plan-designer` | **Sí** (página pública del repositorio) | Sección 6 |
| Fuentes adicionales del 09/11 (MaterialCraft, CivilCraft, GeoLibre, Open PDF Studio, IngeTrazo, Bonsai, ABO, Operum…) | **Sí** | Documento principal §4.2 |
| Vídeos originales de Maket, ErectionOS, Makio y Floorcraft | **No** (no estaban en la rama) | Se audita lo que describen los PDF. Las marcas de tiempo no se han podido comprobar. |
| Google Drive | **No** (sin conector en esta sesión) | Ya no hace falta: los PDF están en GitHub |
| Solvaix / Revit MCP, God's Eye View, breakboard.art, OSIRIS | No revisados en profundidad | Todos están en «PATRÓN» o «NO». Si quieres enlaces concretos, se revisan. |
