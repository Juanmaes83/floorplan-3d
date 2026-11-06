# RUBIK SOTA — HOME-UX-E2 · Descubrimiento profesional y Home adaptativa

**Fecha:** 06/11/2026  
**Versión:** 1.0 — ESPECIFICACIÓN DOCUMENTAL PARA REVISIÓN  
**Estado:** línea HOME-UX-E2 incorporada al roadmap, **SIN IMPLEMENTACIÓN NI APROBACIÓN VISUAL**  
**Repositorio:** Juanmaes83/floorplan-3d  
**Rama documental:** docs/rubik-evolution-preparation-2026-11-04  
**Base de inspección:** master@0f9c6ead9732901681498efec326d1ca92e42ffe (fotografía temporal; verificar HEAD antes de cada misión)  
**Decisión del propietario:** mejorar la Home para mostrar las capacidades de RUBIK y adaptar el valor mostrado a la profesión seleccionada. Se autoriza **documentar y auditar** esta línea, no desarrollar, fusionar ni publicar.

## 0. Propósito, límite y precedencia

**Resultado buscado:** quien entra en RUBIK identifica en segundos para qué le sirve según su profesión, descubre mejoras que ya existen, ve una demostración honesta y llega mediante una acción real a la herramienta correcta, sin modificar el proyecto o perder el contexto.

- **P0 · HOME-UX-E2 (primer corte que podrá encargarse):** rediseño de descubrimiento y presentación **dentro de la bienvenida existente** `#inicio / welcomeDialog`, con selección de profesión, hero, demostración, capacidades, CTA y estados verificables. Sin nuevas capacidades de cálculo, geométricas ni económicas.
- **P0 · UX transversal candidata, NO incluida automáticamente en el primer corte de Home:** panel contextual con KPI y preflight de integridad tras cambios (secciones 7–8). Se necesita encargo específico, permisos de módulos y pruebas separadas.
- **P1/P2/P3 · Oportunidades de producto:** biblioteca editorial, recetas de estilo, amueblamiento local, controles 3D simples, iluminación y generación global; son candidatos, no funcionalidades ya implementadas ni autorizadas.
- HOME-UX-E2 **no sustituye ni amplía** la misión FT3D-8 M1 S2+S3 ni adelanta S4. FT3D-8 sigue siendo obligatorio para E2 por decisión del propietario, y sus estados comerciales son independientes de este documento.
- **No es una landing pública nueva ni otro stack.** La Home en alcance es la bienvenida dentro de la aplicación. Una web comercial separada requerirá otro mandato; si se propone, debe consumir el mismo catálogo verificado de capacidades.
- No cambiar por esta línea `FloorPlanProjectV1`, presupuestos C1–C4, geometría, importaciones, proyectos, marca, políticas de enlace, privacidad ni motores de vídeo.

**Precedencia:** decisiones posteriores del propietario > contratos comprobados en el SHA actual > criterios de este documento para HOME-UX-E2 > auditorías/propuestas históricas. No elevar propuestas del PDF a decisiones aprobadas.

### Documentos relacionados sin duplicación

1. [Home V2 — auditoría de contenido y propuesta 04/11/2026](./home-v2-content-audit-2026-11-04.md): conserva su auditoría, tres entradas, demostración 2D/3D, ES/EN/ZH, estados y performance. HOME-UX-E2 añade personalización efectiva por sector, catálogo de claims y trazabilidad de tests.
2. [Punto 9 — descubribilidad profesional](https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/product/point-9-ux-professional-discoverability-2026-10-28.md): la navegación Diseñar / Analizar / Presupuestar / Entregar / Mi estudio sigue siendo la autoridad de organización; no añadir un segundo menú.
3. [Experiencia profesional/cliente](https://github.com/Juanmaes83/floorplan-3d/blob/master/docs/product/professional-client-experience-2026-10-21.md): selector optativo y cinco perfiles existentes; distingue audiencia comercial de perfil de firma.
4. [FT3D-8 E2 v1.1 — referencia S2–S4](./ft3d-8-e2-documento-maestro-borrador-v1.md): no anunciar FT3D-8 como integrado mientras permanezca fuera de master y sin gates de E2.
5. **Benchmark aportado por el propietario:** PDF «Floorcraft vs. RUBIK SOTA», auditoría de producto/UI-UX de 12 páginas, corte 05/11/2026, elaborado a partir de un vídeo. Fuente externa a este repositorio: no hay URL GitHub verificada del PDF. Sus observaciones sobre el producto competidor provienen de vídeo, **no** de auditoría del backend, dispositivos reales ni licencias.

## 1. Inventario real de la Home en master (punto de partida)

| Autoridad/componente | Estado observado en la base | Qué se conserva | Delta HOME-UX-E2 |
|---|---|---|---|
| `js/guide-ui.js::buildWelcome()` | Bienvenida implementada | `#inicio`, retorno, búsqueda/guía | Orden comercial, contenido sectorial y estados |
| `rubik-professional-audience-v1` | Profesión opcional conservada localmente | Cinco valores y selección reversible | Personalización del hero, demostración, beneficios y CTA; no solo párrafo |
| `welcomeUpload`, `welcomeBlank`, `welcomeExample` | Tres rutas operativas y probadas en su alcance | IDs, acciones, navegación, fallbacks | Mantener visibles, sin sustitución ni falsas acciones |
| `welcomeView-plan/home`, `assets/welcome/example-3d.webp` | Alternancia ejemplo 2D/3D | Misma vivienda y captura real | Galería/demostración pertinente por profesión con fuente exacta |
| `welcomeWalkExample` | Recorrido de ejemplo enlazado | Entrada real a demo | Destacarlo al perfil inmobiliario si conserva su comportamiento |
| `welcomeSolutions` y `welcomeAudiencePurpose` | Cinco tarjetas y explicación por audiencia | Accesibilidad del selector, tarjetas reutilizables | Reordenar, priorizar y convertir capacidades destacadas en accesos reales |
| `js/professional-workspace-ui.js` | Diseñar, Analizar, Presupuestar, Entregar, Mi estudio | Mapa de trabajo actual | Vocabulario consistente y deep links solo si son válidos |
| `css/guided-experience.css` | Estilos responsive de bienvenida | Perla, responsive y estados de interacción | Composición premium y demostración compacta móvil |
| `tests/welcome-generar.browser.test.cjs`; `tests/professional-entry.browser.test.cjs` | Suites existentes | Regresión de entradas, selección y móvil | Ampliar QA sin borrar expectativas existentes |

**Diagnóstico:** hoy seleccionar una profesión cambia el texto de utilidad, marca y antepone su tarjeta de Soluciones, pero no construye una propuesta completa diferente. Varias capacidades de análisis, presupuesto, BC3, presentaciones y entrega no tienen presencia ni jerarquía proporcional a su valor en la Home.

**Estados y precisión:** una función puede existir en `master` y tener condiciones de uso, datos necesarios o QA parcial. No inferir disponibilidad comercial por ver un archivo. Las versiones en ramas de Kimi/Claude/Gate D no equivalen a `master`, aunque tengan CI verde y revisión visual.

## 2. Contrato de Home: una plataforma, varios recorridos de valor

La Home mantiene **un conjunto único de motores y herramientas**. La profesión seleccionada solo modifica **presentación, orden, ejemplos y CTA de descubrimiento**; no altera geometría, presupuestos, marca, derechos ni permisos.

### 2.1 Cinco profesiones actuales y un candidato futuro

| Perfil existente (clave actual) | Promesa verificable que puede encabezar | Capacidades que prioriza | Primera acción real | Nunca prometer antes de gate |
|---|---|---|---|---|
| Estudio de arquitectura (`architecture`) | «Del plano a una propuesta que puedes diseñar y documentar» | Calibrar/importar, superficies, 2D/3D, vistas/lámina, cantidades | `welcomeUpload` o ejemplo | Certificación normativa, cotas topográficas o S4 integrado |
| Inmobiliaria (`real-estate`) | «Ayuda a compradores a comprender los espacios en 3D» | Amueblamiento, recorrido 3D, capturas, presentación, marca | `welcomeWalkExample` | Enlace cliente remoto PR #166 como publicado |
| Promotora (`developer`) | «Presenta tipologías y niveles con coherencia» | Edificios/plantas disponibles, 2D/3D, vistas/Story, marca, documentación | `welcomeExample` | BIM completo, multiusuario o modelos de comercialización aún no validados |
| Reformas (`renovation`) | «Explica una propuesta de redistribución y sus partidas» | Estancias/huecos, materiales, superficies, presupuesto, comparación | `welcomeUpload` | Simulación de obra real certificada; evolución 4D antes de S4 |
| Decoración e interiorismo (`interior`) | «Explora espacios amueblados y sus acabados» | Muebles, materiales, ambientes 3D, recorrido y presentación | `welcomeExample` | Recetas globales o randomizador local no construidos |
| **Candidato: constructora/jefe de obra** | Preparar solo cuando exista S4 integrado | Plan profesional, Gantt, 4D, costes, MP4 | Por decidir tras QA E2 | **No mostrarlo como perfil con funciones disponibles hoy** |

Los cinco perfiles existentes no desaparecen. La selección es opcional, deseleccionable y recordada en el navegador como preferencia de interfaz. El usuario mantiene acceso completo a todas las áreas. La profesión NO es el perfil profesional de «Mi estudio», que tiene sus propios datos y marca.

### 2.2 Composición y jerarquía

1. **Hero por profesión:** antetítulo, H1 y texto breve con un resultado que las funciones integradas permiten obtener, sin cifras/certificaciones inventadas. Sin profesión, hero general.
2. **Acción inmediata:** conservar subir plano, crear desde cero y probar el ejemplo como alternativas universales, **visibles y accesibles**; destacar una acción contextual solo si abre un flujo operativo.
3. **Prueba visual real:** plano vs vista 3D del mismo proyecto; para perfiles pertinentes, capturas adicionales de funciones ya integradas con atribución al SHA/caso QA, no renders ficticios ni capturas de ramas como producción.
4. **Tres o cuatro ventajas por profesión:** cada ficha nombra la capacidad, explica el resultado concreto y ofrece acceso real o una descripción; no botones inertes.
5. **Mapa sencillo de trabajo:** Preparar → Diseñar → Amueblar → Revisar → Entregar, como orientación **no rígida**. Presupuestar es área de trabajo opcional según profesión; la navegación principal mantiene sus cinco áreas existentes.
6. **Resto de capacidades:** descubrimiento transversal compacto, con grupos «Diseñar», «Analizar», «Presupuestar», «Presentar y Entregar», «Mi estudio»; no convertirlo en catálogo interminable que oculte las acciones iniciales.
7. **Pie y limitaciones:** datos locales del navegador, exportar copia, medidas orientativas, origen/limitaciones de servicios. No ocultar condiciones por embellecer la portada.

### 2.3 Lenguaje Perla

- Priorizar **3D y resultados reales**, tipografía legible, blanco/perla, petróleo y teal como acento; evitar monotonía de cajas, iconografía genérica excesiva y marketing grandilocuente.
- No insertar un visor WebGL nuevo ni descargar assets 3D de gran tamaño al abrir la Home. Imágenes reales optimizadas y con fallback accesible.
- Pantalla inicial en portátil: H1, demostración y primera acción reconocibles sin tener que recorrer un bloque de texto extenso. El descubrimiento adicional puede estar más abajo con scroll intencional.
- Móvil 390×844 y 844×390: CTA accesible, selector usable, demostración compacta, sin desbordamiento horizontal. No hacer desaparecer toda la prueba visual.
- ES/EN/ZH consistentes: no mezclar idioma tras cambiar profesión, ni perder selección durante traducción, navegación o retorno.
- Las acciones con paso siguiente explican resultado; los enlaces a funciones no cambian de proyecto sin consentimiento.

## 3. Registro de capacidades y disciplina comercial

**Pieza central de HOME-UX-E2:** una fuente documental/configuracional de capacidades con estado y evidencia, consumida por la bienvenida y reutilizable por una eventual web comercial futura. No hace falta crear un backend de catálogo.

Ficha mínima **por capacidad**: ID, título/beneficio, profesión(es), autoridad del código, rama/SHA, prueba/QA, gate/condición, estado, CTA real/fallback, evidencia visual y última revisión.

### 3.1 Estados que deben respetarse

| Estado interno | Cuándo se permite | Qué puede mostrar la Home |
|---|---|---|
| `INTEGRADO_VERIFICADO` | Función en master, contrato/QA acreditados, sin bloqueo de uso para el caso mostrado | «Disponible», CTA operativo |
| `INTEGRADO_CON_CONDICIONES` | En master pero exige datos, compatibilidad, configuración o verificación externa | Beneficio específico con condición visible; no promesa universal |
| `EN_VALIDACION` | Prototipo/código disponible, integración, QA o aceptación incompleta | Etiqueta «En validación» sin CTA que prometa uso general |
| `EN_PREPARACION` | Existe plan o rama no integrada | «En preparación» en sección secundaria o no mostrar |
| `BLOQUEADO_PERMISOS` | Catálogo, publicación o licencia no acreditados | No ofrecer acción activa; explicar condición si se menciona |
| `NO_SOPORTADO` | No acreditado como disponible en el alcance actual | No aparecer como prestación real |

**Regla absoluta:** CI verde de rama, Preview READY o aprobación parcial ≠ integrado comercial. Verificar estado antes de construir contenido para cada release. Cuando cambie un gate, se actualizan catálogo y QA en el mismo corte de Home; no elevarlo por fecha ni por copia promocional.

### 3.2 Primer inventario de ejemplos: confirmar en la implementación

| Capacidad (contenido candidato) | Autoridad inicial a comprobar | Situación al corte documental | Política de Home |
|---|---|---|---|
| Importar plano y crear en blanco | Editor/importador y bienvenida | En master, con límites por formato | Disponible solo para formatos probados |
| Editar estancias, puertas y ventanas | Editor, `js/opening-ui.js` | Integrado según inventario de master | Mostrar valor real, sin precisión normativa |
| Modelo 2D/3D y recorrido | Editor y presentación | Integrado en alcance actual | Foco visual principal |
| Superficies, orientación y sol | Área Analizar y motores existentes | Integrado en alcance documentado | «Análisis orientativo», distinguir datos ausentes |
| Edificios y plantas | FloorPlanBuilding | Primer corte integrado | Prometer solamente niveles/casos compatibles |
| Muebles y acabados | Catálogos y UI existentes | Integrado en alcance de catálogo | Sin filtros de estilo globales inventados |
| Cantidades, presupuesto y BC3 | C1–C4 | Integrados en alcance documentado | Precios propios/BC3; nunca total completo sin cobertura |
| Mi estudio y láminas | Marca y Entregar | Integrados en alcance existente | Beneficio por perfil con datos de ejemplo reales |
| Story, sección, alzado, axon y plantillas | FT3D-1…6 según master | Funciones integradas en alcance de cada módulo | Demostrar capacidades disponibles; no confundir ampliaciones aisladas |
| Catastro directo | FT3D-8 M1/S3 | Pendiente | No ofrecer consulta directa como disponible |
| BCCA gestionada | FT3D-8 M1/S2 y gate legal | Permiso de reutilización todavía no acreditado | No activar ni prometer catálogo gestionado |
| Evolución 4D y Gantt profesionales | FT3D-8 Gate D/S4 | Gate D en rama, S4 no integrado | «En preparación», no botón de integración inventado |
| Visita/enlace remoto de cliente | PR #166 | Draft no fusionada ni publicada | «En preparación» y política de acceso pendiente |
| Materiales F03 / visor avanzado Kimi | Rama ajena | No integrado comercialmente por este corte | No presentarlo como función de master |
| Recetas de estilo y amueblamiento asistido local | Benchmark, propuesta | No demostrado como capacidad actual | «Idea futura», no ficha de disponible |
| Planificador lumínico con lux | Benchmark, propuesta | No acreditado | No mostrar como cálculo certificado |

## 4. Requisitos P0: primer corte Home (implementación futura separada)

Cada fila es un contrato de producto: **autoridad → delta pendiente → responsable → QA → condición observable**. Estado inicial de todas las filas: `DOCUMENTADO / NO IMPLEMENTADO EN HOME-UX-E2`. Que exista una base parcial no convierte la mejora en terminada.

| ID | Autoridad existente | Trabajo adicional exigido | Responsable al encargar | QA / aceptación |
|---|---|---|---|---|
| HOME-UX-E2-01 | `guide-ui` + Home V2 | Diagnóstico de claims y mapa de capacidades con SHA y gates | Responsable Home + auditor QA | HUX-QA-01: registro rastreable, sin features ficticias |
| HOME-UX-E2-02 | Selector `rubik-professional-audience-v1` | Mantener 5 perfiles opcionales y persistencia; desacoplar audiencia de Mi estudio | Home UI | HUX-QA-02/03/12: elección reversible y sin mutación |
| HOME-UX-E2-03 | `buildWelcome()` | Hero H1, texto y beneficio por perfil más versión neutra | Home UX/contenido | HUX-QA-04: 5 héroes + neutro, claims acreditados |
| HOME-UX-E2-04 | `welcomeSolutions` | Ordenar 3–4 capacidades prioritarias por sector con fuente y acceso real | Home UI + QA | HUX-QA-05/06: tarjetas sectoriales y estado |
| HOME-UX-E2-05 | `welcomeUpload/Blank/Example/WalkExample` | CTA contextual real sin perder las tres entradas universales | Home UI | HUX-QA-07/08: clicks abren lo esperado |
| HOME-UX-E2-06 | Ejemplo real 2D/3D y assets | Demostraciones reales relevantes; pruebas de origen y vista compacta móvil | Home UX + visual | HUX-QA-09/10: ejemplo verdadero y encuadrado |
| HOME-UX-E2-07 | Catálogo de capacidad y gates | Disponible/condicionado/validación/preparación/bloqueado sin falsos enlaces | Producto + QA | HUX-QA-01/05/11: cambio de estado no ofrece CTA |
| HOME-UX-E2-08 | Punto 9 + guía actual | Relacionar áreas profesionales y tareas sin segundo menú ni wizard obligatorio | Home UX + guía | HUX-QA-08/13: navegación y regreso preservados |
| HOME-UX-E2-09 | Perla y `guided-experience.css` | Jerarquía de un primer pantallazo, CTA accesible y descubrimiento posterior | Home UX | HUX-QA-09/10/14: revisión visual humana |
| HOME-UX-E2-10 | i18n existente ES/EN/ZH | Traducir todos los perfiles/capacidades y mantener ARIA/foco/teclado | Home frontend | HUX-QA-15/16: accesibilidad y tres idiomas |
| HOME-UX-E2-11 | Preferencia local y biblioteca | Cambiar sector sin cambiar proyecto, revisión, firma ni permisos | Home frontend/QA | HUX-QA-03/12: snapshots antes/después iguales |
| HOME-UX-E2-12 | Base `welcome-generar` + CI | No romper subidas, editor, guía, proyecto, 3D, Presupuestar o Entregar | Home frontend/QA | HUX-QA-07/17: regresiones sin degradación |
| HOME-UX-E2-13 | Estado de integraciones y PR | Preparar actualización futura por gates S2/S3/S4 y posible perfil constructor | Producto/FT3D-8 | HUX-QA-11/18: no adelantar capacidades |
| HOME-UX-E2-14 | Documentación y capturas existentes | Publicar matriz, antes/después, métricas, bloqueos y demo por profesión | Home + auditor/propietario | HUX-QA-14/18: evidencia por SHA y aprobación visual |

**Invariantes P0:** ninguna función desaparece; el catálogo comercial no altera contratos del editor; UI premium no introduce nuevas peticiones de pago, analítica no autorizada o servicio externo; no importar funciones de ramas ajenas al render de la Home.

## 5. Matriz QA exacta para HOME-UX-E2

Todos los casos se ejecutarán al encargar el trabajo en la rama aislada de Home y deberán registrar **SHA, ambiente, viewport, pasos, resultado PASS/FAIL/BLOCKED/NOT_RUN, evidencia (captura/log) y responsable**. Estos son casos **planeados**, no pruebas ejecutadas.

| ID | Prueba y contexto | Criterio PASS observable |
|---|---|---|
| HUX-QA-01 | Contrastar catálogo con HEAD de master y PRs | Cada claim tiene autoridad, gate y QA; 0 funciones de rama presentadas como operativas |
| HUX-QA-02 | Elegir/cambiar/borrar cada uno de cinco perfiles, recargar | Selección visual, guardado opcional y estado neutro reversibles |
| HUX-QA-03 | Cambiar profesión con un proyecto real abierto y regresar | Id/revisión/geometría/presupuesto/firma intactos |
| HUX-QA-04 | Capturar hero neutro y los cinco héroes | Texto principal, beneficio y demostración/CTA adaptados; no solo el párrafo inferior |
| HUX-QA-05 | Inspeccionar 3–4 ventajas por profesión | Orden propio; datos y claims comprobados, sin duplicidades incongruentes |
| HUX-QA-06 | Activar cada ficha y CTA destacado | Navega a función real o presenta información sin fingir botón funcional |
| HUX-QA-07 | Rutas originales subir plano, crear, ejemplo y retorno | Mantienen IDs/acciones, validación y proyecto; sin regresión |
| HUX-QA-08 | Camino sector → entrada → área profesional → Home | Navegación correcta; sin pérdida de vista/selección/historial del proyecto |
| HUX-QA-09 | Capturas 1280×720, 1366×768, 1440×900, 1920×1080 | Primer mensaje, demostración y acción identificables; jerarquía premium |
| HUX-QA-10 | 390×844, 844×390 y zoom 125/150 % | Sin scroll horizontal ni CTA tapado; demostración compacta presente y fallback |
| HUX-QA-11 | Flags de funciones no integradas, bloqueadas o sin permiso | No hay promoción a «Disponible» ni enlaces ejecutables no autorizados |
| HUX-QA-12 | Alternar arquitectura → inmobiliaria → interiorismo y Mi estudio | Marca y datos de cliente inalterados; preferencias separadas |
| HUX-QA-13 | Guía 5 etapas/áreas de trabajo, saltar pasos opcionales | No wizard rígido, sin pérdida de estado y CTA del momento reconocible |
| HUX-QA-14 | Comparar antes/después de 5 perfiles en desktop/móvil | Capturas viewport; evaluación estética humana y errores identificados |
| HUX-QA-15 | Ciclo ES → EN → ZH, cambio de perfil, regreso | Traducción completa, estado/CTA coherentes, sin textos mezclados |
| HUX-QA-16 | Teclado, foco, etiquetas, voz/lector donde sea posible, movimiento reducido | Operación sin ratón, ARIA coherente, foco visible, contraste y animación reducida |
| HUX-QA-17 | CI de Home y regresiones: budget, guía, biblioteca, guardado, editor, marca | Suites existentes siguen verdes, sin modificaciones de esquema |
| HUX-QA-18 | Rendimiento y seguridad: red/CPU, lazy images y permisos | Sin WebGL/IA/compartir involuntario; assets razonables y ninguna filtración de datos |

**Piezas de evidencia obligatorias:** capturas de al menos 5 perfiles y estado neutro, dos o más tamaños móviles, registro de capacidades con fuentes, prueba de los CTA, vídeos/capturas reales, CI por SHA, deltas de carga y matriz de riesgos.

## 6. Dependencias, agentes y orden de ejecución propuesto

| Corte | Alcance | Dependencias/gates | Autorización actual |
|---|---|---|---|
| H0 · Inventario comercial | Mapear capacidades de master, rama, licencia y CTA | Código actual y QA; PRs revisadas | Solo documentación aprobada |
| H1 · Home adaptativa Perla | HOME-UX-E2-01…14; 5 sectores y contenido probado | H0, coordinar propietario de `js/guide-ui.js` y `css/guided-experience.css` | **Todavía no encargada** |
| H2 · Panel contextual | Ver §7; KPI por estancia y estado de revisión | Responsables de editor/medidas; permisos de código compartido | **Propuesta, no autorizada** |
| H3 · Preflight de integridad | Ver §8; mostrar impacto y rollback | Geometría/topología/undo; pruebas negativas | **Propuesta, no autorizada** |
| H4 · Creatividad y nuevas capacidades | Ver §9; estilos, catálogo, iluminación | Contratos de activos/licencias y producto | **Propuesta, no autorizada** |

El responsable de una futura misión Home deberá crear su propia rama aislada sobre una base verificada, **no reutilizar ramas de Claude/Kimi ni invadir la misión FT3D-8**. Los módulos compartidos pertenecen a sus responsables técnicos actuales; coordinación previa obligatoria. **No tocar PR #166, visor Kimi, budgets, Catastro ni el motor del proyecto.**

Antes de encargar H1, el propietario revisará contenido comercial, prioridades y si HOME-UX-E2 se declara requisito bloqueante del release E2. Estar en el roadmap E2 como P0 documental **no es aprobación implícita de merge, Production o alteración de la secuencia FT3D-8**.

## 7. Candidato P0 complementario: panel contextual y KPI (no incluido en H1)

**Propuesta HUX-CONTEXT-01:** un único panel de contexto cambia según estancia/objeto/modo, mostrando primero datos reales (m², recuento de huecos/muebles, fuente/revisión, alertas), después ajustes, y acción primaria siempre accesible. No reemplazar `FloorPlanSurfaceMetrics`, el editor de propiedades o presupuestos.

**Contrato:** seleccionar estancia A → panel de A; cambiar a B → información de B sin seleccionar/alterar A; volver a modo anterior → selección y datos recuperados. Si una medida no está calibrada, mostrarlo, no inventarla. Grupos plegables, CTA fijo cuando la ventana sea baja.

**QA candidata HUX-CONTEXT-QA-01:** 2 estancias, cambio de modo, edición, medidas faltantes, teclado, 1366×768 y 390×844. PASS: mismo proyecto, ningún resultado duplicado o divergente, CTA visible, sin mutaciones no solicitadas. Su viabilidad requiere auditar rutas de selección, proveedor de medidas y permisos de archivo; **no autoriza su implementación**.

## 8. Candidato P0 complementario: preflight de cambios (no incluido en H1)

**Propuesta HUX-PREFLIGHT-01:** ante cambios de muros, tipo de estancia o propuestas automáticas, calcular una vista de impacto **sin confirmar**: áreas/estancias afectadas, apertura invadida, mueble en colisión, vínculo que se pierde, consecuencias económicas si están calculables. El usuario compara **antes / después**, elige Aplicar o Cancelar y puede deshacer.

**QA candidata HUX-PREFLIGHT-QA-01:** dos estancias con puerta y mueble; proponer cambio conflictivo. PASS: diagnóstico sobre geometría autoritativa, cancelación deja hash/revisión intactos; Aplicar produce cambio controlado, undo revierte exactamente; sin inferencias de seguridad/validez normativa. El alcance depende de contratos de edición y undo; **no se considera realizable solo con una capa de UI**.

## 9. Oportunidades adicionales tomadas del benchmark (no autorizadas)

| ID candidato | Prioridad | Hipótesis verificable | Condiciones y prueba previa |
|---|---|---|---|
| HUX-IDEA-01 | P1 | Biblioteca editorial por uso, dimensiones, estilo y licencia | Metadatos y derechos reales; QA filtrado sin falsos resultados |
| HUX-IDEA-02 | P1 | Recetas de materiales/ambiente **por estancia** | Preview + aplicar + deshacer, sin sobrescribir acabados reales ni datos de catálogo |
| HUX-IDEA-03 | P1 | Amueblamiento local asistido con objetivo densidad | Colisiones, pasos, anchuras, seed, diff, solo estancia y reversión |
| HUX-IDEA-04 | P1 UX | Accesos claros a dollhouse, muros y cortes / calidad render | Reutilizar modos existentes; no asumir F03 integrado ni descargar assets masivos |
| HUX-IDEA-05 | P2 | Planificador de iluminación exclusivamente visual | Módulo independiente de Solar; lux solo si hay método validado; sin certificación |
| HUX-IDEA-06 | P2 | Sugerencias editables de tipología de estancias | Diferenciar inferencia de dato declarado/importado, confirmación y undo |
| HUX-IDEA-07 | P3 | Randomización global reproducible | Solo con reglas, semilla, historial, diff, consentimiento y límites de recursos |

**Regla de benchmark:** el PDF no prueba backend, precisión, persistencia remota ni seguridad del competidor. Adoptar gramática de interacción, no supuestas garantías. No usar screenshots de Floorcraft como contenido comercial de RUBIK.

## 10. Gates y definición de terminado

- **G-HUX-CONTRATO:** inventario de capabilities comprobado contra el SHA actual y dependencias, 14/14 requisitos vinculados a QA, traducciones y claims revisados. No basta documento atractivo.
- **G-HUX-FUNCIONAL:** recorridos, cinco profesiones, accesos reales y proyectos intactos; tests browser de los tres CTA de siempre y casos HUX-QA-01…18 registrados.
- **G-HUX-VISUAL:** propietario acepta explícitamente capturas y Preview de 5 profesiones en portátil y móvil; Perla, visual 3D, legibilidad y jerarquía verificados.
- **G-HUX-SEGURIDAD:** sin reclamar features en rama, permisos inexistentes, IA de pago, exportación no permitida ni enlace público sin política aprobada; seguridad y privacidad inspeccionadas.
- **G-HUX-RELEASE:** merge y Production son **autorizaciones independientes y explícitas**, aun con CI verde y aceptación visual. Cualquier definición de «E2 READY» se coordina con los gates FT3D-8 y el roadmap global.

**Definition of Done del corte H1:** exactamente **14 requisitos P0 y 18 QA planeados**, evidencias por SHA, regresiones verdes, cinco perfiles auditados, lenguaje ES/EN/ZH, revisión humana y registro de limitaciones. Si algún QA queda BLOCKED/NOT_RUN, no marcar H1 como aceptado sin resolución o excepción expresa del propietario.

## 11. Registro de decisiones y siguiente mandato

| ID | Estado | Decisión / bloqueo | Responsable |
|---|---|---|---|
| HUX-DEC-01 | **APROBADO_DOCUMENTAL** | Incorporar HOME-UX-E2 al roadmap y mantenerla separada de M1 S2+S3 | Propietario |
| HUX-DEC-02 | **PROPUESTO** | H1 Home sectorial como próximo trabajo autónomo y fecha de encargo | Propietario |
| HUX-DEC-03 | **PROPUESTO** | Convertir HOME-UX-E2 en gate bloqueante del lanzamiento comercial E2 | Propietario |
| HUX-DEC-04 | **PROPUESTO** | Activar perfil constructora después de verificar S4 | Propietario |
| HUX-DEC-05 | **PROPUESTO** | Contratos y responsables para panel contextual y preflight | Propietario + técnicos |
| HUX-DEC-06 | **PROPUESTO** | Nuevas recetas, iluminación y generación opcional | Propietario |
| HUX-DEC-07 | **PENDIENTE** | Verificar en código/CI actuales cada claim comercial antes del encargo | Responsable Home + auditor |

**Próximo paso permitido:** revisión y aprobación humana de esta especificación; después, redactar un prompt de implementación H1 en rama aislada. **Este documento no es ese prompt y no comienza trabajos de desarrollo.**

**Prohibiciones vigentes:** no merge a master, no Production, no alterar ramas de otros agentes, no tocar servicios pagados, no publicar clientes, no levantar licencias o política de acceso mediante una decisión UX.