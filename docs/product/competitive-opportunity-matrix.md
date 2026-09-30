# Auditoría competitiva y matriz de oportunidades

Consulta: **30-09-2026 (Europe/Madrid)**. Base inspeccionada y comprobada contra el remoto:
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

La comparación es parcial: las páginas de producto, ayuda, precios y licencias
intentadas están bloqueadas por el entorno. Hay evidencia primaria accesible en
repositorios de los proveedores: un ejemplo reciente de integración app-to-app
magicplan y ejemplos Floorplanner de 2009/2011. Esto permite comparar mecanismos
concretos de intercambio, pero **no acreditar paridad de la interfaz, precios,
calidad de render, cobertura funcional o límites comerciales actuales**. Sweet
Home 3D queda no verificado. Una celda NV no demuestra que falte esa función.

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

## Evidencia y antecedentes

- **C**: confirmado documentalmente en una fuente primaria; no implica probar el producto.
- **H**: fuente histórica confirmada; disponibilidad comercial actual NV.
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

### Fuentes inaccesibles y datos comerciales

Cada URL siguiente se intentó mediante `curl --location --max-time 25`, con TLS
verificado. Resultado para todas: salida 56, **HTTP de destino 000**, error exacto
`curl: (56) CONNECT tunnel failed, response 403`. El 403 es del túnel/proxy del
entorno, no prueba una negativa del producto ni la existencia del path. No se pudo
leer título ni contenido; los nombres de esta tabla son destinos de investigación,
no títulos recuperados. No se eludió la restricción ni se cambió la política de red.

| IDs / URL intentada | Información pendiente / filas afectadas |
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

Precios públicos, monedas, periodicidad, límites por plan y presupuestos vigentes:
**NV para los tres productos**. No se afirma que sean gratis, que exijan cotización
para todos sus planes o que incluyan una API. Cualquier contratación/integración
comercial propuesta **requiere presupuesto y confirmación del proveedor**; no se
contactó a ninguno ni se abrió cuenta, aceptaron términos o contrataron servicios.

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
| T01 Crear/iniciar proyecto | **H**: API sobre proyectos en servidores ([FP-G1][fp-api]); UI actual NV (FP1/FP4) | **C documental**: ejemplo crea/reabre por `magicplanstd://`, enlaza referencia externa ([MP-G1][mp-demo]); UI/plan NV | **NV** SH1/SH2 | **R** proyectos locales CRUD |
| T02 Importar raster/calibrar | **NV** FP1/FP4 | **NV** MP1/MP4; paquete documentado no demuestra importación/calibración raster | **NV** SH2 | **R/P** PNG/JPEG/WebP estático, dos puntos + segunda cota; sin PDF/HEIC |
| T03 Dibujar/editar muros, habitaciones, huecos | **NV** FP4 | **C documental**: paquete contiene espacios/muros/huecos, medidas en metros ([MP-G1][mp-demo]); edición UI **NV** | **NV** SH2 | **R** trazado y edición manual; F2 **P**, experimental |
| T04 Colocar/editar mobiliario | **NV** FP1/FP4 | Paquete documenta objetos ([MP-G1][mp-demo]); catálogo/colocación/edición **NV** | **NV** SH2 | **R/P** genéricos y un GLB propio; catálogo externo pendiente |
| T05 Cambiar 2D/3D | **NV** FP1/FP4 | **NV** MP1/MP4 | **NV** SH1/SH2 | **R** dos vistas; sin WebGL se conserva 2D |
| T06 Exportar/imprimir/compartir/presentar | **H**: código de exportación COLLADA/texturas y SVG ([FP-G4][fp-fml], [FP-G5][fp-dae], [FP-G6][fp-svg]); iframe POC ([FP-G3][fp-iframe]); UI/formatos actuales **NV** | **C documental**: compartir paquete ZIP `.magicplan` vía iOS, thumbnails/media ([MP-G1][mp-demo]); impresión/PDF/visor alojado **NV** | **NV** SH2/SH4 | **R/P** JSON/ZIP/PNG; sin PDF a escala dedicado ni visor compartido |
| T07 Móvil/entre dispositivos | **NV** FP1/FP4 | **C documental**: integración nativa iOS; Android, sync y experiencia entre dispositivos **NV** ([MP-G1][mp-demo]) | **NV** SH1/SH2 | **P** táctil/local; transferir archivo manualmente no es sincronización |
| T08 Colaboración | **NV** FP3/FP4 | **NV** MP3/MP4; enlace/paquete no acredita coedición | **NV** SH1/SH2 | **Propuesto, no implementado**; proyectos locales |
| T09 API/SDK/iframe/white-label | **H** PHP REST con clave y POC iframe 2009 ([FP-G1][fp-api], [FP-G3][fp-iframe]); SDK/white-label/vigencia **NV** | **C documental** enlaces + formato paquete; cita Cloud API `/projects/{id}/plan` ([MP-G1][mp-demo]); acceso/contrato/SDK web/iframe/white-label **NV** | **NV** SH4; no concluir ausencia de API | **R** formato propio; servicio/API externa no implementado |
| T10 Planes/límites/precios | **NV** FP2/FP3 | **NV** MP2/MP3 | **NV** SH1/SH3 | Sin plan comercial implementado; no precios inventados. Límites técnicos no son tarifas. |

## Matriz de oportunidades

Las dos tablas siguientes forman una matriz por ID: la primera recoge necesidad,
referente, estado, usuarios y decisión propuesta; la segunda, dependencias y paso
verificable. **Confirmada** se refiere a capacidad/dato técnico, no a demanda.
“DESCARTAR” delimita la propuesta concreta indicada, no prohíbe investigaciones
futuras. No se asignan puntuaciones de mercado, aceptación o esfuerzo.

| ID / oportunidad y problema | Referencia oficial / evidencia | Estado actual | Usuarios potenciales | Recomendación / encaje |
| --- | --- | --- | --- | --- |
| O01 Catálogo externo pequeño y trazable: presentar opciones reales sin inventar medidas | Competidores T04 NV; dato confirmado del Asset Lab autorizado, auditoría actual abajo | Solo un GLB propio | Interioristas, agentes, cliente final | **INTEGRAR**, trabajo restante F3; utilidad hipótesis |
| O02 Procedencia de medidas: evitar que el aspecto visual sugiera un ajuste físico falso | T03 [MP-G1][mp-demo] documenta medidas de intercambio; no validación física. Brecha local confirmada | Alturas genéricas; 113 modelos existentes sin medidas completas | Reformas, interioristas, cliente final | **IMPLEMENTAR**, F3; problema hipótesis, brecha confirmada |
| O03 Texturas embebidas acotadas: conservar aspecto de los modelos autorizados | T06 [FP-G5][fp-dae] indica texturas históricas; 113 modelos actuales las contienen | Loader rechaza todas las imágenes/texturas | Interioristas, agentes | **IMPLEMENTAR**, F3; necesidad técnica confirmada |
| O04 Draco/WebP según candidatos: abrir catálogo sin aceptar cualquier formato | T04 competidores NV; 109 GLB actuales requieren Draco, 93 también EXT_texture_webp | Sin decodificador Draco ni extensiones permitidas | Interioristas, cliente final | **IMPLEMENTAR**, F3 en entrega separada tras piloto; alcance propuesto |
| O05 Materiales y selección por dimensiones: decidir combinaciones útiles | T04/T05 competidores NV; referencia de exportación texturada [FP-G5][fp-dae] solo histórica | Presets de suelo y catálogo genérico; externos pendientes | Interioristas, cliente final | **IMPLEMENTAR**, F3; utilidad hipótesis |
| O06 Presupuesto de carga/fallback: revisar en móvil sin bloquear el plano | T07 NV para prestaciones/rendimiento; evidencia local de loader y auditoría | Fallback y límites existentes; sin rendimiento físico medido | Los cuatro segmentos | **IMPLEMENTAR**, F3; mediciones/hosting pendientes |
| O07 Intercambio `.magicplan`: reducir recaptura al recibir un trabajo de campo | T01/T06/T07 [MP-G1][mp-demo], mecanismo confirmado, utilidad indicio | JSON/ZIP propios; no lector de ese paquete | Reformas, agentes | **INTEGRAR**, fase posterior; sujeto a necesidad y permiso específico |
| O08 Servicio Floorplanner alojado: consumir plataforma en vez de ampliar editor | T09 [FP-G1][fp-api]/[FP-G3][fp-iframe], solo 2009; oferta vigente NV | Estático y local, sin gestión de claves/backend | Agentes, interioristas | **POSPONER**, fase posterior; no justificado para F3 |
| O09 Presentación/impresión e intercambio 3D: entregar algo útil al destinatario | T06 [FP-G4][fp-fml]/[FP-G5][fp-dae]/[FP-G6][fp-svg] histórico; formatos actuales NV | PNG/JSON/ZIP; sin PDF dedicado ni COLLADA | Agentes, reformas, cliente final | **POSPONER**, fase posterior; probar destinatario/formato antes |
| O10 Sync/colaboración: compartir entre personas/dispositivos | T08 NV; paquete local [MP-G1][mp-demo] no demuestra coedición | Sin sync ni cloud; archivos manuales | Agentes, reformas | **POSPONER**, fase posterior; demanda hipótesis |
| O11 Promesa de interpretar cualquier plano automáticamente | T02/T03 NV para competidores; limitación F2 confirmada | H/V experimental, revisión humana y validación pendiente | Reformas, agentes | **DESCARTAR** esa promesa; fuera del alcance F3; continuar evaluación F2 aparte |
| O12 Ecommerce/precios/CRM dentro de F3 | T10 NV; no evidencia de necesidad ni condiciones comerciales | Sin esos flujos/contratos | Beneficio por validar con segmentos | **DESCARTAR** para F3, fuera del roadmap actual |
| O13 Reutilizar motor/catalogue de Sweet Home 3D | T04/T09 y SH2–SH4 bloqueados; código/licencias/formatos NV | No conexión ni lector implementado | Interioristas, cliente final | **POSPONER**, fase posterior; no adoptar código/modelos sin fuente legible |

| ID | Dependencias y límites | Próximo paso verificable |
| --- | --- | --- |
| O01 | Fichero/hash, dimensiones, normalización, atribución, restricciones específicas y QA; permiso general ya confirmado; hosting por decidir | Preparar ficha de un candidato con los datos abajo; ninguna incorporación automática del manifest |
| O02 | Fuente independiente de dimensiones físicas; eje/origen/unidad del modelo; mm del contrato; no escalar para ocultar discrepancia | Obtener referencia defendible de W/H/D y registrar comparación de caja tras transformaciones, preservando el tamaño elegido del objeto |
| O03 | Texturas internas, bytes/resolución/GPU, orientación/color/material; sin URI externos; no nuevo backend | Probar pouf con 3 imágenes y 1198 triángulos en fixture autorizado; añadir límites y pruebas positivas/negativas antes de admitirlo |
| O04 | Decoder y versión fijada, extensiones exactas, transporte/privacidad, memoria/tiempos; no “permitir todo” | Aislar Draco con lámpara sin imágenes; luego WebP/texture_transform solo si los candidatos lo necesitan |
| O05 | Texturas/modelos autorizados por candidato y atribución; contrato actual conserva color/presets; cambios futuros exigirían decisión explícita | Probar una combinación y búsqueda por medidas con usuarios; registrar qué datos no necesitan cambiar el contrato |
| O06 | Hosting/caché/retención, versión/hash, red, bytes en disco frente a memoria; presupuesto de rendimiento pendiente | Medir cold/warm load y memoria en un teléfono físico; mantener plano 2D/fallback operativo al fallar/hash distinto/timeout |
| O07 | Contrato paquete, metros→mm, coordenadas/objetos no mapeables; datos sensibles y alcance de licencia del ejemplo; sin API contratada | Mapear un paquete sintético autorizado, lista blanca de geometría, errores/migración, sin copiar media ni transmitir datos; validar necesidad antes de implementar |
| O08 | API vigente, presupuesto, contrato, backend seguro, borrado/localización de datos y lock-in | Cuando haya demanda, confirmar documentación/versiones/entitlements con proveedor; no usar endpoints HTTP 2009 ni claves en frontend |
| O09 | Destinatario, escala/unidades, privacidad de imagen/archivo; licencia del toolkit FML no verificada | Probar PNG actual con destinatarios; definir criterio de impresión/intercambio antes de elegir formato o proveedor |
| O10 | Consentimiento, cuentas, identidad, conflicto/borrado, tratamiento de direcciones/imágenes | Entrevistar usuarios sobre transferencia manual; no inferir cloud a partir de compartir un ZIP |
| O11 | Corpus autorizado, cinco sesiones, veinte referencias, umbrales; F2 sigue experimental | Ejecutar protocolo F2 y registrar cobertura/tiempos; evitar claims de precisión o reconocimiento universal |
| O12 | Modelo de negocio y datos/precios verificables ausentes; marcas y acuerdos comerciales específicos | Registrar demanda si aparece fuera de F3, sin inventar tarifas ni convertir monedas |
| O13 | Fuentes oficiales accesibles de licencia y formatos, procedencia por modelo/textura, compatibilidad | Reabrir investigación desde guía/licencia oficial cuando sea accesible; hasta entonces NV, sin copiar catálogo/código |

## Build / buy / partner

No se ofrecen costes estimados sin datos. “Requiere presupuesto del proveedor”
es un requisito de la eventual contratación, no una afirmación sobre su página de
precios. Ninguna opción se conectó a un servicio real.

| Opción / fuente | Requisitos y límites publicados o comprobados | Precio / dependencia | Encaje local, privacidad y móvil |
| --- | --- | --- | --- |
| Construcción propia incremental (O01–O06) | Límites actuales del loader/contrato; soporte de texturas/Draco pendiente, no presupuesto físico aprobado | Coste de desarrollo/hosting no estimado; control del contrato, dependencia Three.js | Compatible con frontend estático; archivos/medidas locales, red para módulos/assets. No prometer offline ni rendimiento físico |
| Asset Lab autorizado (O01) | Propietario confirma uso; restricciones por recurso y auditoría técnica más abajo | No precio/acuerdo de compra informado; dependencia de versión y selección | Catálogo estático posible tras fichas/adaptador/loader; distribución/hosting específico se documenta; no publicar catálogo completo ni cargas de usuario |
| Paquete magicplan (O07), [MP-G1][mp-demo] | Formato ZIP MIME `application/vnd.magicplan.project-package+zip`, esquema 1.0, manifest/media; demo iOS React Native y enlaces nativos | Tarifas/planes NV; requiere confirmación del proveedor y permiso del código si se reutilizara; dependencia del formato | No drop-in web: importar selectivamente geometría sería trabajo propio. Direcciones, geolocalización, formularios, fotos/360/vídeos pueden ser personales; no enviar ni copiar indiscriminadamente |
| API magicplan/partner, [MP-G1][mp-demo] | README cita Cloud API `/projects/{id}/plan`; autenticación, disponibilidad/SDK web/quotas no verificados | Requiere presupuesto/contrato del proveedor; planes NV; lock-in de IDs/esquema | Posible cambio a backend/credenciales y transferencia de datos: posponer; el demo nativo no habilita un iframe |
| API/iframe Floorplanner, [FP-G1][fp-api]/[FP-G3][fp-iframe] | API con claves y POC iframe documentados en 2009; vigencia/seguridad/white-label NV | Requiere confirmación y presupuesto del proveedor; MIT del cliente PHP no compra acceso al servicio | Datos del proyecto en servidores externos; secreto nunca en frontend. POC HTTP antiguo no es integración aprobada; UX móvil/embed por comprobar |
| Intercambio FML/SVG/COLLADA, [FP-G4][fp-fml]/[FP-G5][fp-dae]/[FP-G6][fp-svg] | Toolkit Ruby 0.2.5 de 2011, exportadores documentados por código; contrato actual del proveedor NV | Tarifa NV; licencia de toolkit no localizada; dependencias Ruby y traducción de geometría | No encaja directamente en browser estático; estudiar formato antes de reutilizar software; unidades/media/datos no mapeables por validar |
| Motor/catálogo/visor Sweet Home 3D (SH2–SH4) | Todo NV por acceso bloqueado; no inferir API/SDK ni licencia a partir del nombre del producto | Precio/licencia/servicio NV; requiere confirmación si se propone contratación | No evaluar compatibilidad web, cloud, móvil o redistribución sin fuentes; posponer |

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
| Código/modelos/texturas Sweet Home 3D, SH3 | NV; fuente bloqueada | No asumir licencia única ni reutilizar catálogo. Verificar términos separados por código/modelo/textura si se retoma |
| Marcas, medidas y fotografías de terceros | No se deriva permiso del nombre IKEA ni de MIT de herramientas | El permiso general de Asset Lab se mantiene; registrar restricciones específicas de cada recurso y atribución. Fotografías/medidas de otra fuente no quedan autorizadas por defecto |

### Nueva auditoría Asset Lab (solo lectura)

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
Todos los ficheros siguientes existen y su hash se calculó en la revisión actual.
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

## Verificación de esta entrega

La tarea es documental: no se ejecutaron de nuevo las suites de producto F1/F2/F3.
Las pruebas históricas citadas por los informes conservan su carácter histórico.
La nueva decodificación usa **renderizado por software SwiftShader**: no valida
rendimiento en GPU/teléfono físico, demanda, medidas físicas ni calidad comercial.

Comandos de investigación ejecutados desde el checkout actual (artefactos temporales
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

Validación documental final ejecutada:

```bash
python3 /tmp/validate-competitive-doc.py
git diff --check
git diff --cached --check
```

El comprobador temporal usa solo biblioteca estándar Python: resuelve enlaces
relativos desde cada documento, comprueba referencias Markdown y contrasta
inventario/hashes con los resultados actuales; comprueba URLs mediante curl.
Resultado, salida 0: **24 enlaces internos**, ninguno roto; **42 usos de referencias,
8 definiciones**, ninguna indefinida; inventario/decodificación/hashes concordantes.
**23 URLs externas distintas: 10 HTTP 200 y 13 bloqueadas** con el error declarado.
Los dos `git diff` terminan con salida 0, sin errores de whitespace. No se encontró
un linter/validador Markdown configurado en el repositorio. Los destinos bloqueados
se registran como NV; no se declara que todos los enlaces externos sean accesibles.
La revisión del diff limita la entrega a esta matriz y el enlace/propuestas del
roadmap; app, schema, README y assets quedan sin cambios.

## Enlaces de las fuentes primarias fijadas

[fp-api]: https://github.com/floorplanner/floorplanner-api-php/blob/1080ac8ce6c071b0bc4e09a81fe402141473aa93/README
[fp-license]: https://github.com/floorplanner/floorplanner-api-php/blob/1080ac8ce6c071b0bc4e09a81fe402141473aa93/MIT-LICENSE
[fp-iframe]: https://github.com/floorplanner/floorplanner-api-php/blob/1080ac8ce6c071b0bc4e09a81fe402141473aa93/php/iframe.php
[fp-fml]: https://github.com/floorplanner/fml/blob/476a3741257205ed276d1cac1204707d22d11b64/fml.gemspec
[fp-dae]: https://github.com/floorplanner/fml/blob/476a3741257205ed276d1cac1204707d22d11b64/lib/floorplanner/collada_export.rb
[fp-svg]: https://github.com/floorplanner/fml/blob/476a3741257205ed276d1cac1204707d22d11b64/lib/floorplanner/svg_export.rb
[mp-demo]: https://github.com/magicplan/app-to-app-integration-example/blob/d382a5ace5c829b8f66ae48d5f3b3000621e83d5/README.md
[three-license]: https://github.com/mrdoob/three.js/blob/r160/LICENSE
