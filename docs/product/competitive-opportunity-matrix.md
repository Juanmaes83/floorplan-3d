# Auditoría competitiva y matriz de oportunidades

Consulta, corrección metodológica y ampliación externa: **30-09-2026 (Europe/Madrid)**. Base inspeccionada y comprobada contra el remoto:
`master` @ `19d286b5d8d1b288048ee5617ea734cff2964ef6`.
Rama documental: `docs/competitive-opportunity-matrix`.
Esta entrega contiene propuestas; no aprueba decisiones de negocio ni implementa funciones.

## Resumen ejecutivo

Rubik Sota ofrece un editor estático con proyectos locales, importación raster,
calibración con segunda cota, trazado manual, geometría compartida 2D/3D y
exportación JSON/ZIP/PNG. F1a y F1b están integradas. F2 (#9–#11) es un prototipo
experimental integrado y sin validación empírica. F3 inicial (#12) está integrada:
alturas explícitas del catálogo genérico, asociación de `assetRef`, un banco GLB
sintético propio, normalización y fallback. **Catálogo externo pendiente; F3 abierta.**

La comparación sigue parcial: los intentos con curl y Playwright de abrir las
páginas de producto, ayuda, precios y licencias fallan en este entorno. Estos
resultados describen límites de los métodos disponibles; no demuestran que la
información oficial no exista o no pueda verificarse desde otro entorno.
Se añaden nueve referencias oficiales aportadas en la conversación, con consulta
externa reportada del 30-09-2026: niveles/exportaciones y presentación profesional
Floorplanner; plan gratuito, creación/edición y planes magicplan; guía, licencia,
API/plugins y descarga/uso móvil/visor Sweet Home 3D. Su procedencia externa se
identifica como **E**, sin atribuir acceso a Codex. Las paráfrasis aportadas
permiten confirmar documentalmente formatos, algunas
condiciones y licencias; no incluyen importes inequívocos ni todos los límites.
No se inventan cifras o cláusulas ausentes.

Además se conserva la documentación primaria leída por Codex: un ejemplo reciente
app-to-app magicplan y ejemplos Floorplanner de 2009/2011. Las fuentes documentales
no acreditan **paridad funcional, pruebas de uso ni calidad/rendimiento**. Una
celda NV expresa el detalle pendiente, no ausencia de la función.

Los hallazgos que cambian la siguiente decisión son:

1. **F3 puede avanzar con el permiso de Juanma ya confirmado.** Una nueva auditoría
   de Asset Lab encuentra 134 entradas y 114 GLB existentes. Ninguno es compatible
   con el cargador público actual: 113 contienen imágenes/texturas y 109 requieren
   Draco. Empezar por un modelo sin Draco todavía requiere soporte de texturas.
2. Solo uno de los 114 modelos existentes tiene tres dimensiones numéricas en el
   manifest. Su caja geométrica discrepa en dos ejes del límite de 20 mm usado en
   F3. Decodificar un modelo no acredita sus dimensiones físicas: hace falta
   procedencia de medidas y normalización defendible por candidato.
3. El ejemplo oficial reciente de magicplan documenta un paquete `.magicplan` y
   enlaces nativos iOS; no acredita un SDK web, iframe, white-label ni acceso API
   incluido en un plan. Es una oportunidad posterior de intercambio, sujeta a
   necesidad de usuarios y condiciones específicas, sin sustituir el contrato local.
4. El ejemplo Floorplanner de API/iframe es histórico. No justifica integrar hoy
   sus endpoints ni colocar claves en un frontend público. Tampoco permite elegir
   proveedor o calcular costes sin información comercial vigente.
5. La portabilidad local y un catálogo pequeño con medidas trazables son una
   diferenciación **alcanzable como propuesta**, no una ventaja competitiva ni
   demanda demostrada. Conviene probarla con los usuarios antes de ampliar alcance.

Brechas comprobadas del propio producto: catálogo externo y texturas sin integrar,
sin sincronización/collaboración, sin presentación compartida alojada ni exportación
PDF a escala dedicada. La relevancia de esas brechas para clientes sigue siendo
hipótesis; la comparación bloqueada no permite atribuirlas a los tres competidores.
No conviene replicar ahora backend, cuentas, ecommerce, CRM, precios o IA universal.

## Corrección de métodos de investigación (30-09-2026)

Esta revisión continúa en la misma rama desde `6861600`, conservando la matriz
publicada. Corrige su falta de evidencia sobre descubrimiento de herramientas y
navegación. No abre PR ni cambia app, schema, assets o decisiones. La comparación
**no se declara completa**: tareas y condiciones comerciales importantes siguen
sin poder revisarse mediante las herramientas disponibles en esa ejecución.
Este apartado registra la corrección local publicada en `733f8dd`; la ampliación
posterior con paráfrasis externas actualiza las filas vigentes de comparación.

### Descubrimiento previo del tooling

Se inspeccionaron `README.md`, `docs/technical/F1a.md`, referencias de F1b/F2/F3,
`tests/browser.test.cjs` y `tests/assets.browser.test.cjs`, nombres de manifests y
configuraciones pertinentes de checkout/workspace, resolución de módulos y comandos.
No se leyeron ni imprimieron valores de `.env`, credenciales o tokens.

| Herramienta | Evidencia de disponibilidad | Uso en esta corrección |
| --- | --- | --- |
| Playwright Node **1.62.1** | `require.resolve("playwright")` y versión del package instalado; usado por pruebas existentes | **Sí**: navegación real `page.goto`, contexto nuevo sin autenticar, sin interceptar ni sustituir respuestas. Veinte URLs intentadas; ninguna recuperó una página inspeccionable |
| Chromium | `/usr/bin/chromium`, documentado en runner existente | **Sí**, headless con opciones existentes; no se instaló navegador ni se ignoraron errores TLS |
| Playwright Python | `importlib.util.find_spec("playwright")` encuentra módulo | No: se usó el runner Node ya documentado |
| Firecrawl CLI/Node/Python | Sin comando `firecrawl`; módulos `@mendable/firecrawl-js`, `firecrawl` y Python `firecrawl` no encontrados; sin configuración identificada en checkout | **No disponible entre las herramientas comprobadas**, no usado ni instalado |
| MCP / búsqueda / crawling conectado | Catálogo de herramientas activas y recursos revisado; no herramienta callable de navegador, Firecrawl o búsqueda web encontrada. Skills disponibles no aportan aquí un navegador conectado; no se abrió conexión ni OAuth | No disponible para esta investigación; no se instaló servidor MCP |
| Scripts de navegación y validadores | Runners Playwright del repo; sin manifest de dependencias ni linter Markdown configurado localizado en checkout. No script Firecrawl/crawling pertinente encontrado | Se reutiliza la biblioteca instalada en scripts temporales; biblioteca estándar Python para validación documental |
| curl / Git | Comandos existentes, lectura de repositorios oficiales ya descargados y revisiones fijadas | **Sí**, curl con TLS verificado para apertura de URLs y Git para contenido documental; no equivalen a observar flujos de UI |

### Intentos de navegador y cobertura pendiente

Playwright lanzó Chromium sin desactivar comprobaciones de certificados. Se
intentaron las doce páginas FP1–FP4, MP1–MP4 y SH1–SH4 de la tabla de fuentes,
más SH5 SourceForge: **13 fallos `net::ERR_TUNNEL_CONNECTION_FAILED`**. No hubo
respuesta HTTP del destino, título ni contenido de producto recuperado; no se
recorrieron flujos, formularios, exportaciones o planes porque ninguna página abrió.
No se afirma inspección visual de esas páginas.

También se intentaron siete fuentes primarias GitHub FP-G1–FP-G6 y MP-G1:
**7 fallos `net::ERR_CERT_AUTHORITY_INVALID`**. No se hizo click para continuar,
no se ignoró TLS ni se modificó red/permisos. Esas fuentes se verifican por lectura
Git y curl con TLS verificado, que sí permite abrir sus URLs. Esto distingue un
fallo del navegador de una fuente documental accesible por otro método.

| Apartado solicitado | Qué se intentó / fuente legible | Estado tras la corrección local anterior (actualización externa E abajo) |
| --- | --- | --- |
| Floorplanner: tareas, niveles/límites, exportación y precios | Navegador FP1/FP2/FP4; curl; FP-G4–FP-G6 legibles por Git | Actualidad comercial/UI **NV**. Exportadores de 2011 confirmados documentalmente, no extrapolados al producto actual |
| Floorplanner: compartir/embed/API | Navegador FP3/FP4; curl; FP-G1/FP-G3 legibles por Git | POC/API de 2009 confirmados. API vigente, white-label, entitlements y tarifas **NV** |
| magicplan: creación/edición móvil y web, importación y calibración | Navegador MP1/MP4; curl; MP-G1 legible por Git | Demo nativo iOS y esquema del paquete confirmados; edición web, calibración y recorrido UI **NV** |
| magicplan: exportar/colaborar/API/planes/límites/precios | Navegador MP2/MP3/MP4; curl; MP-G1 legible | Paquete compartido y referencia Cloud API confirmados documentalmente. Coedición, acceso API y condiciones comerciales **NV** |
| Sweet Home 3D: tareas, importación/exportación, móvil/web | Navegador SH1/SH2/SH4/SH5; curl | **NV**; no contenido inspeccionable recuperado |
| Sweet Home 3D: API/plugins, licencia de app y licencias de modelos/texturas | Navegador SH2/SH3/SH4; curl | **NV** por separado para aplicación, plugin/visor, modelo y textura; no se infiere una licencia común |

**“curl bloqueado en este entorno”** identifica el fallo CONNECT de ese método.
**“No localizado en fuentes oficiales accesibles”** solo se usa tras leer una
fuente: por ejemplo, ausencia de LICENSE en los árboles fijados de FML y del demo
magicplan, o ausencia de condiciones comerciales actuales en sus documentos.
Ninguna expresión demuestra inexistencia de una función/licencia/oferta en el
producto. La corrección local anterior no recuperó contenido nuevo de las webs
bloqueadas; la posterior aportación externa permite confirmar solo los datos
parafraseados, identificados como E en la comparación vigente. Tampoco un
extracto de búsqueda sustituye la lectura:
no se usaron resultados de búsqueda como evidencia ni se encontró un buscador callable.

## Evidencia y antecedentes

- **C**: confirmado documentalmente en una fuente primaria; no implica probar el producto.
- **H**: fuente histórica confirmada; disponibilidad comercial actual NV.
- **E**: fuente oficial aportada por el usuario, consulta externa reportada del
  30-09-2026; se usan las paráfrasis aportadas, no se atribuye lectura a Codex.
  No son citas literales. Detalles no aportados siguen NV; E no equivale a prueba
  interactiva ni a comprobación independiente del texto original.
- **R**: implementado y comprobado mediante lectura de código/documentación del repo.
- **P**: parcial, con límite concreto indicado.
- **NV**: no verificado; no equivale a ausencia.
- **Hipótesis**: utilidad o preferencia por contrastar con usuarios; **indicio**: mecanismo
  documentado que merece exploración, sin validar demanda.

No se encontró una matriz competitiva en el master inspeccionado ni en las
instantáneas consultadas de las ramas remotas documentales F0, roadmap y evaluación
F2. También se buscaron los nombres de los tres productos en `docs/` y `README.md`
de las referencias remotas disponibles. La lista pública de PR abiertas mostraba
#1, #2 y #3; sus antecedentes no aportaron una comparación con fuentes reutilizable.
Esta búsqueda no prueba que nunca se investigara fuera de esas instantáneas.

El [plan histórico F0/F1–F3](https://github.com/Juanmaes83/floorplan-3d/blob/825ddf629d037d57690aedeea188b725ebf561b5/docs/product/F1-F3-plan.md)
y [decisiones F0](https://github.com/Juanmaes83/floorplan-3d/blob/825ddf629d037d57690aedeea188b725ebf561b5/docs/product/F0-decisions.md)
son antecedentes de la rama `docs/f0-product-contract-audit`, no estado actual.
D-01 proponía operador/agente inmobiliario: no se encontró aprobación verificable
del segmento prioritario. Agentes inmobiliarios, interioristas/decoradores,
empresas de reformas y cliente final son usuarios potenciales, no mercado validado.

Autoridad actual: [roadmap](../ROADMAP.md), [flujo y cierres](../DEVELOPMENT-WORKFLOW.md),
[contrato](../contracts/FloorPlanProjectV1.md) y
[schema canónico](../contracts/FloorPlanProjectV1.schema.json).
El README ya describe F2 integrada y experimental: no se modifica.
Las cinco sesiones y los veinte planos reales siguen pendientes según
[protocolo F2](../qa/F2-entry-protocol.md) y [línea base](../qa/F1b-five-plans.md);
no bloquean esta auditoría ni el avance de F3.

## Fuentes oficiales consultadas

Todas las fuentes de esta sección se consultaron el **30-09-2026**. Los enlaces
GitHub siguientes devolvieron HTTP 200. Se leyó el contenido de las revisiones
fijadas, además de comprobar apertura del enlace. Los títulos de documento se
indican abajo; para los ficheros sin título editorial se usa su nombre real.
**Método por fuente:** FP-G1–FP-G6 y MP-G1: nueva lectura `git show` de los
ficheros de las revisiones fijadas, comprobación del árbol para licencias y apertura
de enlace mediante curl/TLS; sus intentos Playwright fallaron por certificado.
THREE: apertura curl/TLS y licencia documental de la versión fijada, sin atribuir
licencia al catálogo. Los diez enlaces GitHub (ocho fuentes y dos antecedentes)
se reintentaron con curl en la corrección local `733f8dd`; no se atribuye
a ese método la evidencia E aportada después.

Floorplanner publica estos repositorios bajo su organización y el README remite
a su dominio; el ejemplo magicplan lo publica su propia organización. Su antigüedad
no debe confundirse con una oferta comercial vigente.

| ID / fuente primaria | Título y revisión | Afirmación limitada a la fuente | Aplicación |
| --- | --- | --- | --- |
| [FP-G1][fp-api] | Floorplanner API; `1080ac8`, 06-03-2009 | API para usuarios, proyectos y diseños en sus servidores; claves, entonces por invitación; librería PHP REST | T01, T09; O08; opciones API |
| [FP-G2][fp-license] | MIT-LICENSE; misma revisión | MIT para ese código, copyright Floorplanner B.V. 2008; conservar aviso | Licencias; no extiende derechos a servicio/modelos |
| [FP-G3][fp-iframe] | Floorplanner embedding POC (`php/iframe.php`); misma revisión | Ejemplo HTML con iframe HTTP 600×400 | T06, T09; O08; no oferta vigente |
| [FP-G4][fp-fml] | `fml.gemspec`; `476a374`, 12-04-2011 | Toolkit FML versión 0.2.5, dependencias Ruby; homepage Floorplanner | T06; O09; intercambio histórico |
| [FP-G5][fp-dae] / [FP-G6][fp-svg] | `collada_export.rb` / `svg_export.rb`; misma revisión | Código `to_dae` con geometrías/texturas y `to_svg`; no demuestra exportaciones actuales de la UI | T06; O03, O09 |
| [MP-G1][mp-demo] | magicplan Integration Field App Example; `d382a5a`, 13-04-2026 | Crear/reabrir proyecto por enlace nativo; recibir paquete ZIP `.magicplan` iOS, esquema 1.0, espacios/media/formularios; cita endpoint Cloud API | T01, T03–T04, T06–T07, T09; O07, O10 |
| [THREE][three-license] | LICENSE, `r160` | MIT del motor Three.js; no licencia de modelos ni marcas | Licencias; motor existente |

### Fuentes documentales aportadas por una vía externa

**Procedencia, método y fecha:** el usuario aporta las URLs, títulos y resúmenes de
fuentes oficiales consultadas el **30-09-2026 mediante otra vía de investigación**,
fuera del entorno local de Codex. El método externo concreto no fue especificado.
Los resúmenes son **paráfrasis, no citas literales**. Codex los incorpora como
**E: evidencia documental aportada externamente**, sin afirmar haber abierto estas
nueve URLs con curl/Playwright ni probado los productos. Los títulos siguientes son
los proporcionados por el usuario. Los detalles no incluidos siguen pendientes.

| ID / URL oficial | Título aportado | Datos respaldados por la paráfrasis externa / límites | Aplicación |
| --- | --- | --- | --- |
| [FP-E1][fp-levels-external] | Project levels | Mejoras por proyecto mediante créditos; exportaciones PDF/FML/DXF según nivel/resolución/condiciones. Básico: SD con marca de agua y límites de plantas/diseños. Niveles superiores amplían límites y opciones de compartir. Tours 3D y embed público Spaceplanner tienen condiciones/créditos adicionales. Cantidades exactas y equivalencia monetaria no aportadas | T06/T09/T10, O08/O09 |
| [FP-E2][fp-professionals-external] | Floorplanner for professionals | Promociona visualización profesional, renders interiores y tours 3D; no acredita calidad comparativa ni flujo probado | T05/T06, O09 |
| [MP-E1][mp-free-external] | Using magicplan for free | Starter: dos proyectos; excluye Workspaces & Teams y API & Integrations. Se describen planes superiores; importes no confirmados | T08/T09/T10, opciones de integración |
| [MP-E2][mp-first-plan-external] | Crea tu primer plano | Creación/edición en app móvil/tableta; cloud no edita proyectos. Habitaciones manuales, importar/dibujar sobre plano existente, modificar dimensiones, añadir/editar objetos. LiDAR en iOS compatible; guía indica que Android no ofrece ese escaneo de habitaciones. Formatos y procedimiento de calibración no aportados | T01–T04/T07 |
| [MP-E3][mp-pricing-external] | Pricing | Dos proyectos gratuitos; documentación/informes/estimaciones, sincronización/almacenamiento y acceso API según plan. Importes/condiciones exactos no confirmados; no atribuir prestaciones a Starter por inferencia | T07–T10, build/buy |
| [SH-E1][sh-license-external] | Licencia | Código y componentes indicados: GPL v2 o posterior. Programa, documentos generados y derechos sobre modelos/texturas se tratan separadamente; algunos contenidos requieren atribución y externos pueden tener términos propios | Licencias separadas abajo; no extender GPL a todos los assets o exportaciones |
| [SH-E2][sh-guide-external] | Guía del usuario | Importación de modelos OBJ/DAE/3DS/ZIP con modelo compatible/KMZ; exportación de vista 3D a OBJ y archivos asociados. Bibliotecas de muebles/texturas exigen evaluar licencias específicas | T04/T06, O09/O13; no atribuir esos formatos a FloorPlanProjectV1 |
| [SH-E3][sh-documentation-external] | Documentation | Guía de desarrollo de plugins y Javadocs de API del ecosistema de escritorio; no demuestra SDK web, iframe o API SaaS compatible con Rubik Sota | T09, O13 |
| [SH-E4][sh-download-external] | Descarga | Compatibilidad móvil para importar/exportar SH3D/SH3X; visor 3D HTML5/WebGL publicable en sitio propio a partir de un proyecto. No equivale a colaboración multiusuario o integración lista para Rubik Sota | T05–T07/T09, O13 |

La existencia de estas fuentes y sus datos documentales corrige el NV general de
niveles/exportaciones Floorplanner, edición móvil/plan Starter magicplan y
licencia/formatos/API de escritorio/visor Sweet Home 3D. No acredita paridad,
calidad, rendimiento ni disponibilidad de todo ello en cualquier plan/dispositivo.
Se mantienen pendientes **todos los importes monetarios no confirmados**: créditos
Floorplanner no se convierten en euros ni se toman como precio de suscripción.

### Fuentes con acceso fallido por curl y navegador; datos comerciales pendientes

Registro histórico de `733f8dd`: cada URL siguiente se reintentó mediante curl
y Playwright en aquella corrección local;
Playwright falla como se detalla arriba. Para curl se usó
`curl --location --max-time 25`, con TLS
verificado. Resultado para todas: salida 56, **HTTP de destino 000**, error exacto
`curl: (56) CONNECT tunnel failed, response 403`. El 403 es del túnel/proxy del
entorno, no prueba una negativa del producto ni la existencia del path. No se pudo
leer título ni contenido; los nombres de esta tabla son destinos de investigación,
no títulos recuperados. No se eludió la restricción ni se cambió la política de red.

| IDs / URL intentada | Información no obtenida en el intento local (E actualiza la comparación vigente) |
| --- | --- |
| [FP1: inicio](https://floorplanner.com/) | T01–T08, funciones actuales |
| [FP2: precios](https://floorplanner.com/pricing) | T10, planes/precios/monedas/límites |
| [FP3: enterprise](https://floorplanner.com/enterprise) | T08–T10, integración/comercial/white-label |
| [FP4: ayuda](https://floorplanner.com/help) | T01–T09, flujos y restricciones |
| [MP1: inicio](https://www.magicplan.app/) | T01–T08, producto actual |
| [MP2: precios](https://www.magicplan.app/pricing) | T10, planes/precios/monedas/límites |
| [MP3: integraciones](https://www.magicplan.app/integrations) | T08–T10, APIs/SDK/planes |
| [MP4: ayuda](https://help.magicplan.app/) | T01–T09, formatos y condiciones |
| [SH1: inicio](https://www.sweethome3d.com/) | T01–T10, producto actual |
| [SH2: guía](https://www.sweethome3d.com/userGuide.jsp) | T01–T08, flujos/exportaciones |
| [SH3: licencia](https://www.sweethome3d.com/license.jsp) | Código, modelos, texturas: NV |
| [SH4: visor JS](https://www.sweethome3d.com/SweetHome3DJSViewer.jsp) | T09, integración: NV; el nombre del path no prueba una API |
| [SH5: distribución SourceForge](https://sourceforge.net/projects/sweethome3d/) | Alternativa de distribución oficial intentada; también bloqueada, sin contenido utilizable |

Importes públicos, monedas, periodicidad y presupuestos vigentes:
**NV para los tres productos**. MP-E1 documenta Starter con dos proyectos y
exclusiones concretas; FP-E1 documenta créditos por proyecto y condiciones
generales. Otras cantidades o condiciones no aportadas siguen pendientes. No se
afirma gratuidad de todo el producto ni API incluida en todos los planes.
Cualquier contratación/integración comercial propuesta requiere confirmar
condiciones y presupuesto del proveedor; no se contactó a ninguno ni se abrió
cuenta, aceptaron términos o contrataron servicios.

## Estado real de Rubik Sota

“Comprobado” aquí significa lectura de código en la base indicada. Las pruebas
históricas de implementación no se presentan como ejecutadas en esta auditoría.

| Capacidad / estado | Evidencia actual y límites |
| --- | --- |
| Raster, escala y trazado: **R** | [tracing-core.js](../../js/tracing-core.js), [F1b](../technical/F1b.md): PNG/JPEG/WebP estático, hasta 15 MiB y 8000 px por lado; PDF/HEIC y WebP animado no admitidos. Calibración de dos puntos, segunda cota y confirmación explícita. El 2 % es una regla provisional de consistencia, no precisión física validada. |
| Muros, habitaciones, huecos y objetos: **R** | [project-core.js](../../js/project-core.js), [index.html](../../index.html): geometría canónica en mm, edición y vistas derivadas 2D/3D. Advertencias del trazado ayudan a revisar, no certifican planos. |
| Proyectos y portabilidad: **R / P** | [project-library.js](../../js/project-library.js), [F1 local/mobile](../technical/F1-local-projects-mobile.md): crear/abrir/renombrar/duplicar/eliminar con confirmación y persistencia local. JSON por proyecto; ZIP de F1b incluye imágenes. No sincronización entre dispositivos ni coordinación concurrente entre pestañas. |
| App sin servidor propio: **R / P** | Frontend estático; datos mayormente locales. Three.js/GLTFLoader se descargan desde jsDelivr y los GLB locales se solicitan al origen. Sin backend de proyectos; no equivale a offline garantizado. |
| F2: **P** | [F2 asistente](../technical/F2-wall-assist.md), [exportación cruda](../technical/F2-raw-export.md), [evaluador](../technical/F2-wall-evaluation.md): candidatos de ejes oscuros H/V, revisión humana; no interpretación universal, diagonales/curvas/perspectiva no cubiertas. Evaluación offline y exportación voluntaria sin imágenes. Calidad/tiempos empíricos y umbrales de producto pendientes. |
| Catálogo genérico: **R** | [generic-catalog.js](../../js/generic-catalog.js): 60 entradas, seis grupos, ancho/profundidad/color y alturas explícitas. Los objetos nuevos guardan altura; los antiguos sin altura siguen compatibles. Medidas de diseño genéricas, no verificadas por fabricante. |
| F3 inicial: **R / P** | [F3 inicial](../technical/F3-initial.md), [asset-catalog.js](../../js/asset-catalog.js), [asset-loader.mjs](../../js/asset-loader.mjs): `assetRef`, un banco original MIT, normalización y caja comprobada antes de ajustar al objeto, fallback al cargar/fallar y preservación de campos. Sin catálogo Asset Lab incorporado. |
| Compatibilidad GLB actual: **P** | GLB 2.0 sin texturas/imágenes, extensiones, animaciones, skins, morphs, sparse ni URI externos; GLB ≤8 MiB y hasta 300 000 elementos por accessor. Caja normalizada debe coincidir por eje dentro de 20 mm. Adaptador requiere QA aprobada, evidencia/hash, ruta `assets/f3/` y marca propia: no es un importador externo universal. |
| Materiales: **P** | Contrato define color/apariencia y presets; app aplica presets procedurales al suelo. No catálogo de texturas externas ni pipeline de materiales comerciales. |
| Presentar/compartir: **R / P** | PNG 2D/3D y archivos locales en [index.html](../../index.html). No visor compartido alojado, PDF a escala dedicado, colaboración o backend/API de proyectos implementados. |
| Móvil y WebGL: **P** | Controles táctiles/fallback 2D documentados. QA previa usa SwiftShader (renderizado por software); no evidencia de rendimiento en móvil físico. Esta tarea no repite esa QA. |
| Segmento prioritario: **pendiente de decisión** | D-01 histórico no aprobado de forma comprobable; validar tareas con agentes, decoradores/interioristas, reformas y cliente final antes de aprobar prioridades. |

No se cambia [FloorPlanProjectV1](../contracts/FloorPlanProjectV1.md). Versión del
schema actual 1.3.0: `assetRef` admite catálogo local/Asset Lab e identificador con
revisión opcional; el proyecto no incorpora binarios ni precios. Un consumidor
antiguo con enum cerrado puede rechazar un catálogo nuevo: futura interoperabilidad
requiere una prueba de migración concreta, no prometer compatibilidad universal.

## Comparación de tareas

Las fuentes enlazadas en cada celda permiten distinguir evidencia de una
capacidad comercial actual. Ninguna aplicación competidora se probó de forma
interactiva. **La paridad funcional entre productos sigue NV**: representar
habitaciones en un formato de intercambio no acredita la experiencia de edición.

| ID / tarea | Floorplanner | magicplan | Sweet Home 3D | Rubik Sota |
| --- | --- | --- | --- | --- |
| T01 Crear/iniciar proyecto | **H** API sobre proyectos alojados ([FP-G1][fp-api]); **E** niveles por proyecto ([FP-E1][fp-levels-external]); pasos de creación UI **NV** | **E** creación en móvil/tableta, cloud no edita ([MP-E2][mp-first-plan-external]); **C** demo crea/reabre por enlace nativo ([MP-G1][mp-demo]) | **E** proyectos SH3D/SH3X importables/exportables en móvil ([SH-E4][sh-download-external]); pasos de creación **NV** | **R** proyectos locales CRUD |
| T02 Importar raster/calibrar | **NV** FP1/FP4; exportar FML no acredita importación raster | **E** importar/dibujar sobre plano existente y modificar dimensiones ([MP-E2][mp-first-plan-external]); formatos/calibración y segunda cota **NV** | Importación de modelos documentada, pero raster/calibración **NV** con el resumen aportado de [SH-E2][sh-guide-external] | **R/P** PNG/JPEG/WebP estático, dos puntos + segunda cota; sin PDF/HEIC |
| T03 Dibujar/editar muros, habitaciones, huecos | **NV** FP4 | **E** crear habitaciones manuales y modificar dimensiones ([MP-E2][mp-first-plan-external]); **C** paquete con espacios/muros/huecos y medidas ([MP-G1][mp-demo]); herramientas exactas de muros/huecos **NV** | Herramientas geométricas exactas **NV**; resumen de [SH-E2][sh-guide-external] centrado en modelos/exportación | **R** trazado y edición manual; F2 **P**, experimental |
| T04 Colocar/editar mobiliario | Catálogo/edición **NV** FP1/FP4 | **E** añadir/editar objetos ([MP-E2][mp-first-plan-external]); catálogo/dimensiones verificadas **NV** | **E** importar modelos OBJ/DAE/3DS/ZIP compatible/KMZ ([SH-E2][sh-guide-external]); pasos de edición/medidas físicas **NV** | **R/P** genéricos y un GLB propio; catálogo externo pendiente |
| T05 Cambiar 2D/3D | **E** renders interiores/tours 3D ([FP-E2][fp-professionals-external]); cambio interactivo 2D/3D **NV** | **NV** MP1/MP4; guía no aporta detalle de vista 3D | **E** visor 3D HTML5/WebGL ([SH-E4][sh-download-external]); cambio editor 2D/3D **NV** | **R** dos vistas; sin WebGL se conserva 2D |
| T06 Exportar/imprimir/compartir/presentar | **E** PDF/FML/DXF con condiciones de nivel, básico SD/marca de agua, compartir y tours ([FP-E1][fp-levels-external]); visualización profesional ([FP-E2][fp-professionals-external]). Resoluciones exactas/cuotas **NV**; COLLADA/SVG son solo **H** ([FP-G5][fp-dae], [FP-G6][fp-svg]) | **C** paquete ZIP vía iOS ([MP-G1][mp-demo]); **E** informes/documentación según plan ([MP-E3][mp-pricing-external]); formatos/impresión/visor **NV** | **E** vista 3D exportable OBJ y archivos asociados ([SH-E2][sh-guide-external]); visor en sitio propio y proyectos SH3D/SH3X en móvil ([SH-E4][sh-download-external]); condiciones específicas y flujo no probado | **R/P** JSON/ZIP/PNG; sin PDF a escala dedicado ni visor compartido |
| T07 Móvil/entre dispositivos | **NV** FP1/FP4 | **E** edición móvil/tableta; cloud no edita; LiDAR solo iOS compatible, sin ese escaneo Android según guía ([MP-E2][mp-first-plan-external]); sync/almacenamiento según plan ([MP-E3][mp-pricing-external]); experiencia no medida | **E** importar/exportar SH3D/SH3X en móvil ([SH-E4][sh-download-external]); sync/edición móvil exacta **NV** | **P** táctil/local; archivo manual no es sync |
| T08 Colaboración | Compartir documentado **E** ([FP-E1][fp-levels-external]); coedición **NV** | **E** Workspaces & Teams excluido de Starter ([MP-E1][mp-free-external]); alcance de coedición/planes superiores **NV** | Visor publicable **E** ([SH-E4][sh-download-external]); colaboración multiusuario **NV** | **Propuesto, no implementado**; proyectos locales |
| T09 API/SDK/iframe/white-label | **E** embed público Spaceplanner con condiciones/créditos ([FP-E1][fp-levels-external]); **H** cliente REST/iframe 2009 ([FP-G1][fp-api], [FP-G3][fp-iframe]); API vigente/white-label/entitlements **NV** | **E** API & Integrations excluido de Starter ([MP-E1][mp-free-external]); acceso API según plan ([MP-E3][mp-pricing-external]); **C** demo nativo/paquete ([MP-G1][mp-demo]); cuotas/SDK web/iframe **NV** | **E** Javadocs/API y guía plugins escritorio ([SH-E3][sh-documentation-external]), visor HTML5/WebGL alojable ([SH-E4][sh-download-external]); no acredita API SaaS/SDK web compatible | **R** formato propio; servicio/API externa no implementado |
| T10 Planes/límites/precios | **E** niveles y upgrades por proyecto/créditos, SD con marca de agua y límites ampliables ([FP-E1][fp-levels-external]); cantidades/importes exactos **NV** | **E** Starter dos proyectos, sin Teams/API; planes/prestaciones según [MP-E1][mp-free-external]/[MP-E3][mp-pricing-external]; importes/condiciones no aportados **NV** | **E** licencia de código GPL v2+ ([SH-E1][sh-license-external]); eso no fija precio de cada distribución o servicio, importes **NV** | Sin plan comercial implementado; límites técnicos no son tarifas |


## Matriz de oportunidades

Las dos tablas siguientes forman una matriz por ID: la primera recoge necesidad,
referente, estado, usuarios y decisión propuesta; la segunda, dependencias y paso
verificable. **Confirmada** se refiere a capacidad/dato técnico, no a demanda.
“DESCARTAR” delimita la propuesta concreta indicada, no prohíbe investigaciones
futuras. No se asignan puntuaciones de mercado, aceptación o esfuerzo.

| ID / oportunidad y problema | Referencia oficial / evidencia | Estado actual | Usuarios potenciales | Recomendación / encaje |
| --- | --- | --- | --- | --- |
| O01 Catálogo externo pequeño y trazable: presentar opciones reales sin inventar medidas | T04: edición de objetos magicplan e importación de modelos Sweet Home 3D **E** ([MP-E2][mp-first-plan-external], [SH-E2][sh-guide-external]); dato confirmado del Asset Lab autorizado, auditoría actual abajo | Solo un GLB propio | Interioristas, agentes, cliente final | **INTEGRAR**, trabajo restante F3; utilidad hipótesis |
| O02 Procedencia de medidas: evitar que el aspecto visual sugiera un ajuste físico falso | T03 [MP-G1][mp-demo] documenta medidas de intercambio; no validación física. Brecha local confirmada | Alturas genéricas; 113 modelos existentes sin medidas completas | Reformas, interioristas, cliente final | **IMPLEMENTAR**, F3; problema hipótesis, brecha confirmada |
| O03 Texturas embebidas acotadas: conservar aspecto de los modelos autorizados | T06 [FP-G5][fp-dae] indica texturas históricas; 113 modelos actuales las contienen | Loader rechaza todas las imágenes/texturas | Interioristas, agentes | **IMPLEMENTAR**, F3; necesidad técnica confirmada |
| O04 Draco/WebP según candidatos: abrir catálogo sin aceptar cualquier formato | T04 importación de modelos **E** ([SH-E2][sh-guide-external]); no acredita Draco en competidores. 109 GLB actuales requieren Draco, 93 también EXT_texture_webp | Sin decodificador Draco ni extensiones permitidas | Interioristas, cliente final | **IMPLEMENTAR**, F3 en entrega separada tras piloto; alcance propuesto |
| O05 Materiales y selección por dimensiones: decidir combinaciones útiles | T04 objetos/importación y T05 presentación 3D **E** ([MP-E2][mp-first-plan-external], [SH-E2][sh-guide-external], [FP-E2][fp-professionals-external]); selección/materiales exactos NV | Presets de suelo y catálogo genérico; externos pendientes | Interioristas, cliente final | **IMPLEMENTAR**, F3; utilidad hipótesis |
| O06 Presupuesto de carga/fallback: revisar en móvil sin bloquear el plano | T07 uso móvil **E** ([MP-E2][mp-first-plan-external], [SH-E4][sh-download-external]); rendimiento físico NV; evidencia local de loader y auditoría | Fallback y límites existentes; sin rendimiento físico medido | Los cuatro segmentos | **IMPLEMENTAR**, F3; mediciones/hosting pendientes |
| O07 Intercambio `.magicplan`: reducir recaptura al recibir un trabajo de campo | T01/T06/T07 [MP-G1][mp-demo], mecanismo confirmado, utilidad indicio | JSON/ZIP propios; no lector de ese paquete | Reformas, agentes | **INTEGRAR**, fase posterior; sujeto a necesidad y permiso específico |
| O08 Servicio Floorplanner alojado: consumir plataforma en vez de ampliar editor | T09 embed Spaceplanner **E** con condiciones ([FP-E1][fp-levels-external]); API REST solo **H** ([FP-G1][fp-api]); API comercial vigente NV | Estático y local, sin gestión de claves/backend | Agentes, interioristas | **POSPONER**, fase posterior; no justificado para F3 |
| O09 Presentación/impresión e intercambio 3D: entregar algo útil al destinatario | T06 PDF/FML/DXF **E** ([FP-E1][fp-levels-external]) y OBJ **E** ([SH-E2][sh-guide-external]); límites exactos/entitlements pendientes | PNG/JSON/ZIP; sin PDF dedicado ni COLLADA | Agentes, reformas, cliente final | **POSPONER**, fase posterior; probar destinatario/formato antes |
| O10 Sync/colaboración: compartir entre personas/dispositivos | T08 Starter sin Teams **E** ([MP-E1][mp-free-external]); sync según plan **E** ([MP-E3][mp-pricing-external]); coedición NV | Sin sync ni cloud; archivos manuales | Agentes, reformas | **POSPONER**, fase posterior; demanda hipótesis |
| O11 Promesa de interpretar cualquier plano automáticamente | T02/T03 NV para competidores; limitación F2 confirmada | H/V experimental, revisión humana y validación pendiente | Reformas, agentes | **DESCARTAR** esa promesa; fuera del alcance F3; continuar evaluación F2 aparte |
| O12 Ecommerce/precios/CRM dentro de F3 | T10 planes documentados **E** ([MP-E3][mp-pricing-external]); importes NV y sin evidencia de necesidad en Rubik Sota | Sin esos flujos/contratos | Beneficio por validar con segmentos | **DESCARTAR** para F3, fuera del roadmap actual |
| O13 Reutilizar motor/catálogo de Sweet Home 3D | T09 API/plugins escritorio y visor **E** ([SH-E3][sh-documentation-external], [SH-E4][sh-download-external]); código GPL v2+ **E** ([SH-E1][sh-license-external]); licencias por asset/compatibilidad NV | No conexión ni lector implementado | Interioristas, cliente final | **POSPONER**, fase posterior; no adoptar código/modelos sin fuente legible |

| ID | Dependencias y límites | Próximo paso verificable |
| --- | --- | --- |
| O01 | Fichero/hash, dimensiones, normalización, atribución, restricciones específicas y QA; permiso general ya confirmado; hosting por decidir | Preparar ficha de un candidato con los datos abajo; ninguna incorporación automática del manifest |
| O02 | Fuente independiente de dimensiones físicas; eje/origen/unidad del modelo; mm del contrato; no escalar para ocultar discrepancia | Obtener referencia defendible de W/H/D y registrar comparación de caja tras transformaciones, preservando el tamaño elegido del objeto |
| O03 | Texturas internas, bytes/resolución/GPU, orientación/color/material; sin URI externos; no nuevo backend | Probar pouf con 3 imágenes y 1198 triángulos en fixture autorizado; añadir límites y pruebas positivas/negativas antes de admitirlo |
| O04 | Decoder y versión fijada, extensiones exactas, transporte/privacidad, memoria/tiempos; no “permitir todo” | Aislar Draco con lámpara sin imágenes; luego WebP/texture_transform solo si los candidatos lo necesitan |
| O05 | Texturas/modelos autorizados por candidato y atribución; contrato actual conserva color/presets; cambios futuros exigirían decisión explícita | Probar una combinación y búsqueda por medidas con usuarios; registrar qué datos no necesitan cambiar el contrato |
| O06 | Hosting/caché/retención, versión/hash, red, bytes en disco frente a memoria; presupuesto de rendimiento pendiente | Medir cold/warm load y memoria en un teléfono físico; mantener plano 2D/fallback operativo al fallar/hash distinto/timeout |
| O07 | Contrato paquete, metros→mm, coordenadas/objetos no mapeables; datos sensibles y alcance de licencia del ejemplo; sin API contratada | Mapear un paquete sintético autorizado, lista blanca de geometría, errores/migración, sin copiar media ni transmitir datos; validar necesidad antes de implementar |
| O08 | API vigente, presupuesto, contrato, backend seguro, borrado/localización de datos y lock-in | Cuando haya demanda, confirmar documentación/versiones/entitlements actuales, condiciones Spaceplanner y presupuesto con proveedor; no usar endpoints HTTP 2009 ni claves en frontend |
| O09 | Destinatario, escala/unidades, privacidad de imagen/archivo; licencia del toolkit FML no verificada | Probar PNG actual con destinatarios; definir criterio de impresión/intercambio antes de elegir formato o proveedor |
| O10 | Consentimiento, cuentas, identidad, conflicto/borrado, tratamiento de direcciones/imágenes | Entrevistar usuarios sobre transferencia manual; no inferir cloud a partir de compartir un ZIP |
| O11 | Corpus autorizado, cinco sesiones, veinte referencias, umbrales; F2 sigue experimental | Ejecutar protocolo F2 y registrar cobertura/tiempos; evitar claims de precisión o reconocimiento universal |
| O12 | Modelo de negocio y datos/precios verificables ausentes; marcas y acuerdos comerciales específicos | Registrar demanda si aparece fuera de F3, sin inventar tarifas ni convertir monedas |
| O13 | Fuentes oficiales accesibles de licencia y formatos, procedencia por modelo/textura, compatibilidad | Mapear formatos OBJ/SH3D al contrato local y verificar GPL/atribución/compatibilidad por componente y asset; sin copiar catálogo/código en esta entrega |

## Build / buy / partner

No se ofrecen costes estimados sin datos. “Requiere presupuesto del proveedor”
es un requisito de la eventual contratación, no una afirmación sobre su página de
precios. Ninguna opción se conectó a un servicio real.

| Opción / fuente | Requisitos y límites publicados o comprobados | Precio / dependencia | Encaje local, privacidad y móvil |
| --- | --- | --- | --- |
| Construcción propia incremental (O01–O06) | Límites actuales del loader/contrato; soporte de texturas/Draco pendiente, no presupuesto físico aprobado | Coste de desarrollo/hosting no estimado; control del contrato, dependencia Three.js | Compatible con frontend estático; archivos/medidas locales, red para módulos/assets. No prometer offline ni rendimiento físico |
| Asset Lab autorizado (O01) | Propietario confirma uso; restricciones por recurso y auditoría técnica más abajo | No precio/acuerdo de compra informado; dependencia de versión y selección | Catálogo estático posible tras fichas/adaptador/loader; distribución/hosting específico se documenta; no publicar catálogo completo ni cargas de usuario |
| Paquete magicplan (O07), [MP-G1][mp-demo] | Formato ZIP MIME `application/vnd.magicplan.project-package+zip`, esquema 1.0, manifest/media; demo iOS React Native y enlaces nativos | Tarifas NV; Starter excluye API & Integrations ([MP-E1][mp-free-external]); esto no confirma restricciones de paquetes compartidos. Permiso del código si se reutilizara; dependencia del formato | No drop-in web: importar selectivamente geometría sería trabajo propio. Direcciones, geolocalización, formularios, fotos/360/vídeos pueden ser personales; no enviar ni copiar indiscriminadamente |
| API magicplan/partner, [MP-G1][mp-demo] | README cita Cloud API `/projects/{id}/plan`; [MP-E3][mp-pricing-external] documenta API según plan y [MP-E1][mp-free-external] la excluye de Starter. Autenticación/SDK web/quotas no verificados | Requiere confirmar plan contratado, presupuesto y condiciones; Starter sin API **E** ([MP-E1][mp-free-external]); lock-in de IDs/esquema | Posible cambio a backend/credenciales y transferencia de datos: posponer; el demo nativo no habilita un iframe |
| API/iframe Floorplanner, [FP-G1][fp-api]/[FP-G3][fp-iframe] | API con claves y POC iframe de 2009; embed público Spaceplanner **E** con condiciones/créditos ([FP-E1][fp-levels-external]); no acredita API/white-label vigente | Requiere confirmación y presupuesto del proveedor; MIT del cliente PHP no compra acceso al servicio | Datos del proyecto en servidores externos; secreto nunca en frontend. POC HTTP antiguo no es integración aprobada; UX móvil/embed por comprobar |
| Intercambio FML/SVG/COLLADA, [FP-G4][fp-fml]/[FP-G5][fp-dae]/[FP-G6][fp-svg] | Toolkit Ruby 0.2.5 de 2011, exportadores documentados por código; exportación FML actual **E** ([FP-E1][fp-levels-external]); compatibilidad del formato antiguo con el actual NV | Tarifa NV; licencia de toolkit no localizada; dependencias Ruby y traducción de geometría | No encaja directamente en browser estático; estudiar formato antes de reutilizar software; unidades/media/datos no mapeables por validar |
| Motor/catálogo/visor Sweet Home 3D ([SH-E1][sh-license-external]–[SH-E4][sh-download-external]) | **E** código GPL v2+, API/plugins escritorio, modelos OBJ/DAE/3DS/ZIP/KMZ y visor WebGL propio ([SH-E1][sh-license-external]–[SH-E4][sh-download-external]); detalles por componente pendientes; bloqueo local conservado | Importes/servicio NV; GPL v2+ del código, sin licencia única del catálogo; verificar obligaciones por componente/asset | Visor HTML5/WebGL posible en sitio propio, no plugin de escritorio ejecutable en browser ni servicio SaaS listo. Mapeo de formatos, hosting, redistribución y privacidad por evaluar; posponer |

## Licencias, permisos y assets

**Juanma confirmó el 30-09-2026 que Rubik Sota puede usar los assets de Asset Lab.**
Es confirmación del propietario registrada también en el roadmap actual; sustituye
el antiguo bloqueo general. No se pide otra autorización general. No se modificó
Asset Lab ni se incorporó modelo, preview, textura o documentación de terceros al
repositorio público en esta entrega.

| Recurso propuesto/existente y fuente | Autorización comprobable | Uso / restricción específica |
| --- | --- | --- |
| Three.js/GLTFLoader existente, [THREE][three-license] | MIT, conservar aviso | Motor existente; eventual Draco requiere revisar aviso de su distribución concreta. MIT del motor no concede derechos sobre modelos/texturas/marcas |
| Banco propio, [licencia específica](../../assets/f3/LICENSE.txt), [manifest](../../assets/f3/catalog.manifest.json) | MIT solo banco/generador, autor Rubik Sota; streaming/redistribución/modificación mundial sin caducidad, aviso requerido | Ya integrado; no afirmar LICENSE global del repo ni extender permiso a terceros |
| Asset Lab, propietario y revisión actual abajo | Confirmación de Juanma; manifest dice `authorized-commercial-demo`, commercial=true, redistribution=false en 134/134; QA pending; 133 referencias son plantilla, una PDF inexistente | No reabrir bloqueo general. Es una contradicción/limitación específica del metadato frente al uso autorizado: documentar para cada candidato alcance de hosting/streaming/redistribución/transformación, marca y atribución con la confirmación existente; no cambiar false a true por inferencia ni usar plantilla como contrato firmado |
| Cliente PHP Floorplanner, [FP-G2][fp-license] | MIT para ese código con aviso | No copiar: antiguo y fuera de F3. No concede servicio/API, usuarios/diseños, catálogo ni marca Floorplanner |
| Toolkit FML de Floorplanner, [FP-G4][fp-fml] | No se encontró archivo LICENSE/COPY en árbol de la revisión consultada; licencia NV | Referenciar mecanismos, no copiar código ni extrapolar MIT del otro repo |
| Demo magicplan, [MP-G1][mp-demo] | No se encontró LICENSE/COPY/TERMS en árbol; package private=true no es una licencia | Referencia documental, no copiar código. El paquete puede contener datos/media de clientes sin derecho de redistribución; importación selectiva futura requiere origen autorizado |
| Código de aplicación Sweet Home 3D, [SH-E1][sh-license-external] | **E** GPL versión 2 o posterior para código y componentes indicados ([SH-E1][sh-license-external]); revisar alcance y obligaciones concretas si se reutilizara | No declarar que habilita un servicio o copiar código sin condiciones verificadas |
| Bibliotecas/modelos Sweet Home 3D, [SH-E1][sh-license-external]/[SH-E4][sh-download-external] | **E** condiciones separadas del programa; algunos contenidos requieren atribución. Licencia/procedencia concreta por biblioteca/modelo **NV** | No extender una licencia del código a los modelos; comprobar modificación, redistribución y hosting |
| Bibliotecas/texturas Sweet Home 3D, [SH-E1][sh-license-external]/[SH-E4][sh-download-external] | **E** condiciones separadas; ciertos contenidos requieren atribución y externos pueden tener términos propios. Licencia concreta por textura **NV** | No presumir que una textura descargable autoriza su uso o redistribución en Rubik Sota |
| Plugins/API/visor Sweet Home 3D, [SH-E3][sh-documentation-external]/[SH-E4][sh-download-external] | **E** documentación plugins/API escritorio y visor web; licencia de cada plugin/biblioteca/visor, versión y compatibilidad concretas **NV** | API documentada no equivale a derecho de redistribuir SDK/plugin o contratar API cloud |
| Ficheros exportados con Sweet Home 3D, [SH-E1][sh-license-external]/[SH-E2][sh-guide-external] | **E** la página separa uso de documentos generados y licencias de modelos/texturas; derechos concretos de assets incluidos siguen por verificar | No transferir automáticamente al resultado la licencia de la aplicación ni asumir libertad de hosting de materiales incluidos |
| Marcas, medidas y fotografías de terceros | No se deriva permiso del nombre IKEA ni de MIT de herramientas | El permiso general de Asset Lab se mantiene; registrar restricciones específicas de cada recurso y atribución. Fotografías/medidas de otra fuente no quedan autorizadas por defecto |

### Auditoría Asset Lab de la corrección local `733f8dd` (solo lectura)

**Reverificado en la corrección local publicada en `733f8dd`**, con lectura de
archivos/hash y nueva decodificación; no se tomó solo del CSV histórico.
Esta ampliación documental externa conserva esa evidencia fechada, sin repetirla.
Se volvió a consultar el remoto y a inspeccionar ficheros actuales de
`Juanmaes83/immersphere-asset-lab` el 30-09-2026. HEAD remoto verificado:
`5dc7b182c5c227472b84aea66a3ffa1368c95981`. Coincide con la instantánea histórica,
pero los resultados siguientes **se obtuvieron de nuevo**, no de su CSV copiado.
Fuente: `manifest/ikea-sample.manifest.json`, árbol Git y binarios existentes de esa
revisión. SHA-256 del manifest:
`30d8c7dde47a5b06bf3d03f423bcff3782a37987b37f7ce892bbadea51ddd5ab`.
Acceso mediante el remoto Git existente; no se publica un enlace a binarios privados.

| Comprobación actual | Resultado / interpretación |
| --- | --- |
| Entradas / ficheros GLB | 134 / 114 existentes y tracked; 20 rutas de modelo inexistentes |
| Previews / documentos | 134 previews existentes; 133 referencias de permiso existentes pero apuntan a plantilla; una referencia PDF no existe |
| GLB 2.0, longitud/chunks | 114/114 parseados; hashes SHA-256 calculados sobre bytes reales |
| Medidas W/H/D numéricas | Solo 1 de los 114 modelos existentes; los otros 113 sin dimensiones completas. Los 20 placeholders con medidas no tienen modelo |
| Extensiones | 109 requieren Draco: 87 + WebP, 16 solo Draco, 6 + WebP + texture_transform; cinco sin extensiones |
| Texturas/imágenes | 113/114 contienen imágenes; el único sin imágenes requiere Draco. Sin URI externos de buffers/imágenes en los 114 inspeccionados |
| Decodificación experimental | 114/114 decodificados con GLTFLoader + DRACOLoader 0.160, Chromium/SwiftShader. Caja de geometría transformada, triángulos y bytes de atributos calculados; no certificado dimensional ni rendimiento físico |
| Compatibilidad con F3 público | 0/114 admitidos por combinación de rechazo de imágenes/extensiones, incluso antes de QA/medidas/ruta/marca. No modificar esos controles en esta tarea |
| Validador del manifest | 134 entradas pasan su validador. Valida estructura; no demuestra disponibilidad, derechos de hosting, precisión dimensional o aceptación por el cargador |

### Candidatos técnicos para la siguiente entrega

Selección propuesta por requisitos técnicos observados, no por ventas/demanda.
Los ficheros siguientes existían y sus hashes se calcularon en la inspección
fechada de `733f8dd`; no se declara una nueva auditoría en esta ampliación.
Caja XYZ del modelo en mm, **no dimensiones comerciales verificadas**. Conteos de
triángulos suman mallas recorridas; bytes geométricos no incluyen texturas/memoria GPU.

| Candidato / ID exacto | Bytes GLB / triángulos | Caja XYZ mm (redondeada) | Requisito y siguiente comprobación |
| --- | --- | --- | --- |
| `ikea-stockholm-2025-puf-alhamn-beige-80586139-demo` | 369416 / 1198 | 657.736 × 403.561 × 689.464 | Sin extensiones, 3 imágenes: piloto de texturas embebidas; faltan dimensiones físicas y procedencia |
| `ikea-songesand-comoda-de-3-cajones-blanco-90366839-demo` | 784576 / 10605 | 816.000 × 805.916 × 509.610 | Sin extensiones, 2 imágenes: segundo caso después del piloto; dimensiones físicas pendientes |
| `ikea-solvinden-solar-floor-lamp-outdoor-beige` | 25968 / 10614 | 258.303 × 1199.998 × 249.981 | Draco, sin imágenes: aislar decoder; medidas físicas pendientes |
| `ikea-vittskar-armchair-outdoor-dark-grey-20575167` | Medidas manifest 640 × 950 × 590 mm | 612.415 × 945.416 × 657.876 | Diferencias 27.585 / 4.584 / 67.876 mm antes de una normalización defendible: dos ejes exceden 20 mm. No forzar ajuste para ocultarlo |

Hashes SHA-256 (no hashes declarados sin comprobación):

- Pouf: `f293f011748cb7687beb9e664ca5133eed55beae2c20011453a520c3a1b9f8d0`.
- Cómoda: `0deb36aec6daf871df610e0dbfa1d2cfe321c1b772145b7bb365a8921381cb7f`.
- Lámpara: `fd7be7eae99afc3a787482afa17244fa4db27e71e2a8d261d3a7726494160411`.

## Próxima entrega F3 propuesta

**Puede avanzar ahora:** ficha técnica de un candidato autorizado, pruebas de
soporte acotado de texturas internas con fallback, trazabilidad de medidas,
normalización y atribución; selección pequeña antes de ampliar catálogo. Propuesta:
comenzar con el pouf por 1198 triángulos y ausencia de extensiones, no por demanda
comercial. Que decodifique en el harness no significa que ya lo acepte la app.

**Por modelo, antes de incorporar:** verificar revisión/ruta/hash; contrastar
W/H/D con fuente física defendible (no solo caja glTF); registrar unidad, ejes,
origen y transformaciones; reconciliar el metadato restrictivo con la autorización
existente en el alcance específico; QA de textura/color/escala/atribución; mantener
el objeto editable y sin binarios en FloorPlanProjectV1. Probar error/cancelación,
recarga/importación y fallback, además de la carga correcta.

**Depende de decisiones concretas:** dónde alojar los modelos seleccionados,
qué se conserva en caché, formatos necesarios y presupuesto medible de tiempo,
memoria/texturas en móviles objetivo. No hay un presupuesto aprobado ni datos de
móvil físico. El harness de auditoría con Draco no modifica el loader público.
Ampliar el adaptador hoy limitado a marca propia es trabajo futuro: expresar la
autorización del propietario con procedencia/alcance específicos, sin exigir que un
modelo IKEA declare ser propio y sin eliminar comprobaciones de seguridad.

**Requiere decisión real de Juanma:** segmento/tarea prioritaria de D-01,
alojamiento y objetivos de rendimiento/dispositivos para la siguiente entrega,
y tratamiento de restricciones específicas que contradigan el alcance confirmado.
No necesita reiterar el permiso general de Asset Lab. Estas son propuestas para
revisión, no aprobación implícita de negocio, contratación o cambio de contrato.

**Después de F3:** intercambio magicplan, presentación PDF/otros formatos,
servicio Floorplanner, colaboración y evaluación de Sweet Home 3D si hay fuentes
accesibles y necesidad. Ecommerce/CRM/IA cloud quedan fuera. F2 conserva cinco
sesiones y veinte planos pendientes, sin bloquear catálogo/materiales F3.

## Verificación de esta entrega y de la corrección

La tarea es documental: no se ejecutaron de nuevo las suites de producto F1/F2/F3.
Las pruebas históricas citadas por los informes conservan su carácter histórico.
La nueva decodificación usa **renderizado por software SwiftShader**: no valida
rendimiento en GPU/teléfono físico, demanda, medidas físicas ni calidad comercial.

Comandos de la **corrección local anterior (`733f8dd`)** ejecutados desde el mismo checkout:

```bash
git status --short --branch
git rev-parse HEAD
rg --files -g 'AGENTS.md' -g '*package*.json' -g '*playwright*' -g '*firecrawl*' -g '*requirements*' -g '*mcp*' -g '!node_modules/**'
rg -n -i 'playwright|firecrawl|crawling|browser|navegaci|mcp' README.md docs tests .github
command -v chromium
command -v firecrawl
node -e 'console.log(require("playwright/package.json").version)'
node /tmp/competitive-browser-research.cjs
node /tmp/competitive-browser-primary.cjs
git ls-remote https://github.com/Juanmaes83/immersphere-asset-lab.git HEAD refs/heads/main
git -C /tmp/f3-asset-lab-audit rev-parse HEAD
git -C /tmp/f3-asset-lab-audit status --short
python3 /tmp/competitive-current-assets.py
node /tmp/f3-asset-lab-audit/scripts/validate-manifest.js
node /tmp/f3-private-audit.cjs
python3 /tmp/validate-competitive-doc.py
python3 /tmp/validate-competitive-markdown.py
git diff --check
git diff --cached --check
```

Además: resolución de módulos Node y `find_spec` Python, inspección de nombres/
claves de configuración pertinente sin valores sensibles y metadatos de herramientas
MCP; `git show SHA:archivo` y `git ls-tree` en repositorios de proveedor para
reconfirmar documentos/ausencia de archivos de licencia. `command -v firecrawl`
y resoluciones negativas son evidencia de no disponibilidad, no instalaciones.
Los scripts temporales Node usan `page.goto` con timeout 18 s y recogen fallos de
navegación; terminan con salida 0 porque registran los **20 fallos de acceso**, no
porque las páginas estén verificadas. Sin cambios de red, certificados o permisos.

Auditoría de aquella ejecución Asset Lab: remoto/checkout seguían en `5dc7b18`, limpio; Python
relee manifest, árbol, todos los archivos y hashes; salida 0. Se reconfirman 134
entradas, 114 GLB, 134 previews, 133 referencias existentes, una sola dimensión
W/H/D completa entre GLB existentes, 113 con imágenes, 109 Draco, 93 WebP y las
banderas restrictivas. Validador actual: 134/134, salida 0. Decodificación repetida:
114, fallos `[]`, salida 0. Las cajas/candidatos/hashes publicados se contrastan
contra esos resultados nuevos. F3 público no se modifica ni se evalúa rendimiento
físico. Autorización general confirmada; hipótesis de demanda permanecen hipótesis.

Comandos de la **publicación inicial** ejecutados desde el checkout actual (artefactos temporales
fuera del repositorio; ningún modelo o preview se añadió al Git público):

```bash
git status --short --branch
git rev-parse HEAD
git ls-remote origin refs/heads/master
git fetch origin master
git switch -c docs/competitive-opportunity-matrix origin/master
# Fuentes: curl --location --max-time 25 URL; lectura de repositorios de proveedor
# en clones temporales de solo lectura y git show de revisiones fijadas.
git -C /tmp/f3-asset-lab-audit fetch origin main
git -C /tmp/f3-asset-lab-audit rev-parse FETCH_HEAD
git -C /tmp/f3-asset-lab-audit status --short
node /tmp/f3-asset-lab-audit/scripts/validate-manifest.js
node /tmp/f3-private-audit.cjs
```

Resultados: Asset Lab limpio; remoto SHA indicado; validador 134/134, salida 0;
decodificación 114, fallos `[]`, salida 0. Auditoría Python estándar sobre árbol/
bytes/JSON calculó inventario y hashes; lectura/caja con loader separado no equivale
a aceptación en la app. Fuentes GitHub de la tabla: 8/8 enlaces HTTP 200; páginas
comerciales/ayuda/licencias y distribución intentadas: 13 bloqueadas (error arriba).
Los dos enlaces históricos F0 también devolvieron HTTP 200 en la comprobación final.
No se instaló herramienta, contactó proveedor ni creó cuenta.

Validación documental de la **corrección metodológica previa** ejecutada:

```bash
python3 /tmp/validate-competitive-doc.py
python3 /tmp/validate-competitive-markdown.py
git diff --check
git diff --cached --check
```

El comprobador temporal usa solo biblioteca estándar Python: resuelve enlaces
relativos desde cada documento, comprueba referencias Markdown y contrasta
inventario/hashes con los resultados actuales; comprueba URLs mediante curl.
Resultado, salida 0: **24 enlaces internos**, ninguno roto; **42 usos de referencias,
8 definiciones**, ninguna indefinida; inventario/decodificación/hashes concordantes.
**23 URLs externas distintas: 10 HTTP 200 y 13 bloqueadas** con el error declarado.
Comprobación Markdown temporal, salida 0: fences equilibrados y columnas
consistentes en las 12 tablas de la matriz y las dos del roadmap; registro de
navegación contrastado (20 intentos, 13 túnel y 7 TLS, cero páginas inspeccionables);
cajas y triángulos de candidatos reconfirmados contra la decodificación nueva.
Estos controles básicos no se presentan como un linter Markdown completo.
Los dos `git diff` terminan con salida 0, sin errores de whitespace. No se encontró
un linter/validador Markdown configurado en el repositorio. Los destinos bloqueados
se registran como NV; no se declara que todos los enlaces externos sean accesibles.
La revisión del diff limita la entrega a esta matriz y el enlace/propuestas del
roadmap; app, schema, README y assets quedan sin cambios.

## Última ampliación con fuentes externas (30-09-2026)

Parte de `733f8dd98cc5615b0ed18b8e3a25d26476566e4e` en la misma rama. Solo cambia
esta matriz y su resumen en el roadmap. No se abren PR ni se incorporan decisiones,
funciones, schema o assets. Los resultados curl/Playwright y de Asset Lab de arriba
son registros de las ejecuciones anteriores, **no reejecutados en esta ampliación**.
Las nueve fuentes externas se registran con su procedencia y no se suman como
páginas abiertas por Codex a los 23 enlaces del registro de acceso local.

Validación ejecutada en esta ampliación:

```bash
python3 /tmp/validate-external-amplification.py
python3 /tmp/validate-competitive-markdown.py
git diff --check
git diff --cached --check
```

Resultados, salida 0: **24 enlaces internos**, ninguno roto; **109 usos de
referencias y 17 definiciones**, ninguna indefinida. **32 URLs externas** con
sintaxis/dominios oficiales válidos: 23 del registro anterior más nueve fuentes
aportadas, sin abrirlas por red en esta ampliación. Se contrastaron títulos, fecha,
procedencia y afirmaciones con las nueve paráfrasis proporcionadas, no con una
lectura independiente de las páginas originales. Markdown: fences equilibrados
y columnas consistentes en **13 tablas de la matriz y dos del roadmap**. El
validador existente recontrasta registros guardados de navegación/decodificación;
no vuelve a navegar ni decodificar Asset Lab. No hay linter Markdown configurado.
Ambos `git diff` pasan sin errores de whitespace. No se ejecutaron suites de app.

Pendientes concretos: importes/monedas/periodicidad de planes; cantidades de créditos,
resoluciones y cuotas exactas Floorplanner; condiciones actuales de API/white-label
Floorplanner y del embed Spaceplanner; plan/cuotas/autenticación y prestaciones
exactas de integración magicplan; formatos/calibración que no detalla la paráfrasis,
coedición y experiencia real entre dispositivos; licencia/atribución de cada
modelo, textura, plugin o componente del visor Sweet Home 3D y condiciones de
los assets incorporados a exportaciones. Ningún detalle pendiente cambia D-01,
F3 abierta ni las cinco sesiones y veinte planos F2 pendientes.

## Enlaces de las fuentes primarias fijadas

[fp-api]: https://github.com/floorplanner/floorplanner-api-php/blob/1080ac8ce6c071b0bc4e09a81fe402141473aa93/README
[fp-license]: https://github.com/floorplanner/floorplanner-api-php/blob/1080ac8ce6c071b0bc4e09a81fe402141473aa93/MIT-LICENSE
[fp-iframe]: https://github.com/floorplanner/floorplanner-api-php/blob/1080ac8ce6c071b0bc4e09a81fe402141473aa93/php/iframe.php
[fp-fml]: https://github.com/floorplanner/fml/blob/476a3741257205ed276d1cac1204707d22d11b64/fml.gemspec
[fp-dae]: https://github.com/floorplanner/fml/blob/476a3741257205ed276d1cac1204707d22d11b64/lib/floorplanner/collada_export.rb
[fp-svg]: https://github.com/floorplanner/fml/blob/476a3741257205ed276d1cac1204707d22d11b64/lib/floorplanner/svg_export.rb
[mp-demo]: https://github.com/magicplan/app-to-app-integration-example/blob/d382a5ace5c829b8f66ae48d5f3b3000621e83d5/README.md
[three-license]: https://github.com/mrdoob/three.js/blob/r160/LICENSE

[fp-levels-external]: https://floorplanner.com/es/project-levels
[fp-professionals-external]: https://floorplanner.com/es/professionals
[mp-free-external]: https://help.magicplan.app/using-magicplan-for-free
[mp-first-plan-external]: https://help.magicplan.app/es/crea-tu-primer-plano
[mp-pricing-external]: https://magicplan.app/es/pricing
[sh-license-external]: https://www.sweethome3d.com/es/licencia/
[sh-guide-external]: https://www.sweethome3d.com/es/guia-del-usuario-de-sweet-home-3d/
[sh-documentation-external]: https://www.sweethome3d.com/documentation/
[sh-download-external]: https://www.sweethome3d.com/es/descarga/
