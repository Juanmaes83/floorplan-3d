# Rubik Sota Floor Plan Designer — roadmap canónico

Actualizado: 01-10-2026 sobre master remoto `5e5e0dc42b8669e7afcb121851f2901d2930a260`, que incluye PR #3 y #15 fusionadas y el cierre aprobado de #18 (`10e9f96`). La biblioteca de superficies de esta rama está pendiente de revisión humana. La auditoría de integración del ecosistema quedó integrada mediante PR #13; merge squash `a403a52e7be467b96aa580cbceca55f0f653fb79` (rama revisada `docs/ecosystem-integration-audit`, HEAD `be931f827b96369b6b9147e6fb6d6d6ea0b3901b`). PR #9 integrada en `master` mediante merge commit
`10f7439b3fc86b0a0bd325d94531709d45cbcad4`; PR #10 mediante
`c8a62de89f3fa3c5cd4e6de75ec514f56929a6e7`; PR #11 mediante
`49ea432f7d8eba75042e00762c902a7d3830040d`; PR #12 (F3 inicial) mediante
`95fcf0da989a9e3bf85f8747c19fc4a9a13426ab`.

Este documento es la fuente canónica de **numeración, estado y alcance de fases**
a partir de esta entrega. El contrato canónico de datos sigue siendo
[FloorPlanProjectV1](contracts/FloorPlanProjectV1.md) y su schema JSON. La
correspondencia usa el [plan F0 de PR #3, revisión 825ddf6](https://github.com/Juanmaes83/floorplan-3d/blob/825ddf629d037d57690aedeea188b725ebf561b5/docs/product/F1-F3-plan.md).
No se aprueban retrospectivamente decisiones F0 aún abiertas ni sus umbrales
provisionales por adoptar esta numeración.

## Resultado y estado

El editor permite preparar una propuesta orientativa desde una imagen, calibrar,
trazar, amueblar con genéricos, revisar 2D/3D y guardar/exportar localmente. No
sustituye medición profesional, planos de ejecución ni certificación técnica.

| Fase canónica | Alcance | Estado y evidencia |
| --- | --- | --- |
| F0 | Contrato, auditoría, decisiones y criterios | Contrato integrado; auditoría/decisiones reconciliadas y fusionadas mediante PR #3 (`5e5e0dc`). Las decisiones de producto explícitamente abiertas siguen pendientes; no se declara aprobada toda F0. |
| F1a | Modelo, migración, importación/exportación JSON, varios proyectos locales, español/marca, mobile-first y fallback WebGL | Aprobada e integrada: PR #4 (`de195e3`) y #5 (`67e7498`). El 3D se deriva de la misma geometría. |
| F1b | Imagen raster local, calibración y segunda cota, trazado/edición, W1–W4, IndexedDB y ZIP | Aprobada e integrada: PR #6 (`7b5b083`). Seguimiento de claridad de importación y WebP estático integrado por PR #7 (`c28a170`). Cinco planos autorizados y medición de rendimiento móvil pendientes. |
| F2 | Asistencia a interpretación, sugerencias editables y revisión humana | **Prototipo experimental integrado y revisado; F2 no validada.** PR #9 fusionada por Juanma el 30-09-2026 (merge `10f7439`). Añade sugerencias locales de muros con aceptación/corrección/rechazo humanos. Siguen pendientes la línea base de cinco sesiones, el conjunto fijo de veinte planos con referencias y los umbrales. [Informe y limitaciones](technical/F2-wall-assist.md). Herramienta offline de evaluación geométrica integrada por PR #10. Juanma aprobó el 30-09-2026 el método de precisión/exhaustividad por longitud; diagonales sin crédito en el comparador de ejes y conservadas en denominadores globales. Sin umbrales de producto ni validación empírica de F2: [reglas y uso](technical/F2-wall-evaluation.md). |
| F3 | Catálogo de objetos 3D y materiales con assets autorizados y dimensiones verificadas | **Piloto externo texturizado acotado completado, aprobado y fusionado** por PR #17 (SHA revisado `772e24c`; merge `24534b5`): SONGESAND y puf STOCKHOLM, búsqueda/filtros y carga con sesión same-origin. No declara completo el catálogo comercial ni una biblioteca general de materiales; ampliaciones y pipeline de conversión quedan como entregas posteriores. [Informe](technical/F3-preview-catalog-fix.md). |
| Entrega post-F3, sin numeración nueva | Inicio de proyectos vacíos/desde imagen y edición directa de dimensiones de estancias rectangulares | Aprobada e integrada por PR #18 (`c7d1b81` revisado; merge `10e9f96`). No modifica schema 1.3.0; limita edición numérica a geometría ortogonal inequívoca. [Informe](technical/home-room-dimensions.md). |

## Correspondencia con el roadmap histórico de PR #2

La [PR #2, revisión 84ddf72](https://github.com/Juanmaes83/floorplan-3d/blob/84ddf72265b83d46daebdb91fde0d5e568ceb019/docs/ROADMAP.md)
proponía otra numeración. Sus números quedan como referencias históricas:

| PR #2 antigua | Numeración canónica |
| --- | --- |
| F0: auditoría/contrato | F0 |
| F1: base mobile-first + F2: proyectos múltiples | F1a, ya integrada |
| F3: subir y trazar | F1b, ya integrada |
| F4: detección asistida | F2, prototipo experimental de muros integrado; validación pendiente |
| F5: escena 3D desde geometría | Parte de F1a y usada por F1b; no una fase pendiente independiente |
| F6: Asset Lab/IKEA | F3, condicionada |
| F7–F9: CRM, Immersphere Pro, analítica/oferta | Horizonte futuro sin fase aprobada ni numeración nueva asignada |

Tratamiento de las PR históricas (revisado el 30-09-2026 tras integrar PR #8):

- **#2:** conserva contenido único sobre responsabilidades, VisualProposalV1 y fases futuras. Preservar PR/rama y reconciliar ese contenido en una entrega documental acotada; sustituir su numeración antigua antes de continuar
  su revisión; no retirarla mientras esos detalles sigan únicamente allí. No fusionar
  el texto antiguo que vuelve a marcar resultados existentes como pendientes.
- **#3:** reconciliada y fusionada el 01-10-2026 en `5e5e0dc`. Conserva auditoría, decisiones y criterios fechados, sin reintroducir schema/ejemplos obsoletos ni aprobar globalmente F0.
- **#1:** español/marca sustituida por #5/#7: diccionarios, nombres, metadatos y persistencia conservados; la etiqueta antigua de importación fue reemplazada deliberadamente. Cierre solicitado por REST, bloqueado con `Forbidden`; PR/rama preservadas hasta poder cerrarla. No reintroducir su index.html histórico. Detalle en DEVELOPMENT-WORKFLOW.md.

## Puertas de evaluación F2 y pendientes visibles

1. [Cinco planos reales autorizados](qa/F1b-five-plans.md), incluyendo exportación
   digital, escaneo y foto: registrar error de segunda cota, tiempo, correcciones e incidencias.
2. Preparar un conjunto **fijo de al menos veinte planos variados**, autorizados, con geometría/cotas de referencia y separación entre calibración y validación; no confundirlo con las cinco sesiones de base. En la inspección documentada del checkout para PR #8 no se encontraron candidatos reales autorizados: cero en ambos conjuntos; confirmar de nuevo al preparar datos locales. [Protocolo y registros](qa/F2-entry-protocol.md).
3. Juanma debe fijar los umbrales de precisión, tiempo y rendimiento usando esa
   línea base antes de validar o ampliar la asistencia. La autorización explícita
   de Juanma permite solo este prototipo experimental previo, sin aprobar umbrales. No se adopta el 30 % provisional
   del plan histórico ni se inventa otro umbral en esta tarea.
4. Juanma confirmó el 30-09-2026 que el flujo funciona en su teléfono físico.
   No consta el modelo ni una medición de rendimiento; medir rendimiento físico
   sigue pendiente. SwiftShader y emulación táctil solo acreditan
   comportamiento/renderizado por software.
5. PDF y HEIC/HEIF diferidos: [decisión de formatos](technical/image-formats.md).
   WebP estático quedó integrado por PR #7 con pruebas del recorrido completo;
   quedan excluidos WebP animado y con EXIF.
6. La corrección de importación fue revisada y aprobada por Juanma antes de
   fusionar PR #7. La preview de referencia correspondió al SHA
   `cbadb7d9a980eb688d9c7aaa1c768cc31e95bc6e`.

La preparación de entrada se integró por PR #8 en `387a9bfd57630bced0d9fc1f858d9a0f3c181229` (protocolo, plantilla vacía y calculador offline). En ese cierre F2 estaba no iniciada; es un registro histórico. Después, PR #9 integró el prototipo experimental, sin completar la evaluación ni cambiar los umbrales pendientes.

## Cierre del prototipo experimental F2 — PR #9 (30-09-2026)

Juanma aprobó y fusionó la [PR #9](https://github.com/Juanmaes83/floorplan-3d/pull/9) hacia `master`. HEAD revisado: `3e3e6117770d97cb6e82f73fa06613d31a506019`; merge commit: `10f7439b3fc86b0a0bd325d94531709d45cbcad4`. El deployment de Vercel estuvo `READY` y se verificó contra el mismo SHA. La revisión humana aprobó el prototipo. La preview requiere autorización Vercel; el enlace temporal de revisión no es permanente.

F2 queda en estado **prototipo experimental integrado; no validado**. La prueba reportada fue 98/98 antes del último ajuste y 13/13 dirigida F2 después; no se afirma que la suite completa se repitiera tras ese ajuste. 3D se verificó con SwiftShader. No se evaluó con planos reales, no se midió rendimiento en teléfono físico y no se establecieron umbrales. La siguiente etapa es preparar y registrar los datos locales autorizados, completar cinco sesiones manuales de línea base, congelar al menos veinte planos de evaluación con referencias y acordar criterios antes de atribuir precisión, mejora temporal o cobertura a la asistencia.

La interfaz no se desplegó manualmente a producción; Vercel genera deployments vinculados al flujo Git. Los links y evidencias por SHA constan en [DEVELOPMENT-WORKFLOW.md](DEVELOPMENT-WORKFLOW.md) y el [informe técnico](technical/F2-wall-assist.md).

CRM, cuentas, backend, IA, Asset Lab, precios y publicación de planos a terceros
no forman parte de este seguimiento. Integraciones futuras requerirán alcance,
contratos, permisos y evaluación propios.


## Evaluador F2 y decisión métrica (30-09-2026)

La PR #10 quedó fusionada en `master` mediante merge commit `c8a62de89f3fa3c5cd4e6de75ec514f56929a6e7`. Incorpora un evaluador geométrico offline con datos sintéticos de prueba; no cambia el detector ni la interfaz. Juanma aprobó el método de longitud cubierta y la regla explícita de que este comparador de ejes no acredita diagonales, que siguen en los denominadores globales. La exhaustividad sobre ejes soportados se muestra aparte. Esta decisión no establece tolerancia o umbrales de producto ni valida F2. El desarrollo del prototipo puede continuar con la evidencia sintética y las limitaciones declaradas; cinco sesiones y veinte planos reales se reservan para la validación empírica posterior y no son un bloqueo de implementación. La propuesta entonces candidata de exportar sugerencias crudas bajo acción expresa del usuario ya se integró por PR #11, sin imágenes, red ni persistencia automática ni modificación de FloorPlanProjectV1. Véase el cierre siguiente; no se marca esa implementación como pendiente.



## Exportación cruda F2 — cierre de PR #11 (30-09-2026)

La [PR #11](https://github.com/Juanmaes83/floorplan-3d/pull/11) integró en
`master` la exportación local voluntaria de sugerencias crudas y su conversión
para el evaluador. Merge commit: `49ea432f7d8eba75042e00762c902a7d3830040d`;
HEAD de la PR revisado: `86479409567efb5df180c4d161ec9232059fa210`.
No cambia el detector ni FloorPlanProjectV1, y no persiste sugerencias ni imágenes.

La preview Vercel fue `READY` para el SHA revisado y está protegida por
autenticación Vercel. Eso acredita el deployment; no acredita acceso público ni
una revisión humana visual completada. No se hizo despliegue manual a producción.
[Informe técnico actualizado](technical/F2-raw-export.md).

F2 continúa **experimental y no validada empíricamente**. Codex reportó 110/110
Node/navegador, 10/10 schema, 12/12 readiness, 16/16 evaluador y 3/3 exportación;
la revisión del reporte no repitió esas suites. 3D usa SwiftShader, sin medición
de rendimiento en GPU o teléfono físico. Las cinco sesiones autorizadas y los
veinte planos con referencias siguen pendientes para evaluar calidad, tiempos y
umbrales; no bloquean continuar el desarrollo de F2.


## F3 — entrega inicial integrada (PR #12, 30-09-2026)

PR #12 ([F3: initial authorized 3D asset catalog](https://github.com/Juanmaes83/floorplan-3d/pull/12)) fue revisada visualmente y aprobada por Juanma antes del merge. HEAD revisado: `b3c72d0c6fae1290c9a7b4e449aa388c3f878531`; base: `fdd3d803d537871ce9b2e37b2f87578dd5ae7f1f`; merge commit: `95fcf0da989a9e3bf85f8747c19fc4a9a13426ab`. Vercel confirmó READY con el SHA de la rama; deployment `dpl_F8NcvTSZF37VdrUBi2c7Kqx9W8uw`, preview [protegida por Vercel Authentication](https://floorplan-3d-git-feat-f3-autho-dce6ec-juanma-espinosas-projects.vercel.app/). No se cambió production manualmente.

La entrega integra catálogo genérico con alturas explícitas, asociación de `assetRef`, normalización/validación de GLB local, preservación del objeto y fallback. Incluye un banco sintético original con licencia MIT específica. No incluye modelos de Asset Lab ni catálogo comercial.

Juanma confirma el 30-09-2026 que el proyecto tiene permiso para usar los assets de Asset Lab. Esta confirmación sustituye el bloqueo previo de autorización para continuar el trabajo. La auditoría referenciada en el informe es una instantánea histórica del commit `5dc7b182c5c227472b84aea66a3ffa1368c95981`; no se toma como inventario actual. Antes de publicar cada modelo se vuelve a comprobar el fichero y hash, sus dimensiones verificables, compatibilidad del formato/extensiones, atribución y el alcance concreto del permiso. Se conserva el Asset Lab en solo lectura; los modelos se incorporarán al catálogo de este repo únicamente después de pasar esas comprobaciones.

**Estado:** F3 inicial integrada; **catálogo externo pendiente**. Pendientes de siguientes entregas: inventario actual y selección de modelos, decisión de normalización/dimensiones por candidato, soporte técnico de formatos (incluido Draco si se necesita), y revisar materiales externos. La medición en móvil físico y cualquier presupuesto de rendimiento siguen como validaciones; SwiftShader no las sustituye. F2 continúa experimental y no validada empíricamente; cinco sesiones y veinte planos siguen pendientes, sin bloquear F3.


## Ecosistema — propuestas pendientes de decisión (30-09-2026)

La [auditoría de integración](product/ecosystem-integration-audit.md) compara Rubik Sota, los tres proyectos de Immersphere, Asset Lab, el downloader IKEA y Blender MCP mediante snapshots fijados por SHA. Identifica formatos incompatibles y pruebas mínimas; no implementa conexiones ni acredita servicios publicados. El LAB Astra quedó localizado en `lab-astra-sept-2026`, con referencia explícita a la rama LAB de Blender MCP: hay arquitectura documental y código MCP, sin cadena completa ejecutada demostrada. Seedance 2.5 continúa sin evidencia de integración en esas fuentes.

Se propone evaluar primero un catálogo externo muy pequeño con medidas y permisos específicos, soporte técnico acotado y fallback; posteriormente, bajo decisión de alcance, estudiar propuestas comerciales al CRM, exportación determinista a Blender y presentaciones 360 con referencias estables. Son **propuestas pendientes de decisión**, sin cliente prioritario aprobado, nuevos números de fase ni cambio de alcance/cierre de F1, F2 o F3.

F3 inicial permanece integrada y el catálogo externo pendiente. F2 permanece experimental: cinco sesiones y veinte planos siguen pendientes, sin bloquear el avance de F3. La autorización general de Juanma sobre los assets ya está confirmada; se conservan las comprobaciones específicas por recurso antes de incorporarlo o distribuirlo.

## F3 — piloto externo texturizado en revisión (01-10-2026)

Rama `feat/f3-textured-external-catalog`, basada en master `6e8b512d61e8f500c2d6a7f1cfdfdeb7e7c5930f`, posterior a las PR #13/#14. Integra SONGESAND 90366839 y STOCKHOLM 2025 puf 80586139 con procedencia fijada, autorización de Juanma para Git/preview, medidas oficiales aportadas externamente y soporte acotado de JPEG embebido. El sofá 90591748 se excluye por superar la tolerancia de 20 mm. El schema sigue en 1.3.0; no se modifican Asset Lab ni decisiones comerciales.

[Informe y resultados actuales](technical/F3-initial.md#piloto-externo-texturizado-01-10-2026). La entrega requiere revisión humana y merge: **F3 permanece abierta**. La preview del nuevo SHA debe verificarse por separado de las capturas locales; la preview de PR #12 no acredita este piloto. SwiftShader no valida rendimiento en teléfono físico. F2 mantiene cinco sesiones y veinte planos pendientes.

### F3 — búsqueda local de muebles en revisión (01-10-2026)

Sobre la misma rama `feat/f3-textured-external-catalog`: búsqueda por nombre/tipo,
familias derivadas del catálogo, sinónimos españoles y filtros de estancia/familia.
Conserva los 60 genéricos y muestra únicamente los tres modelos del catálogo F3
aceptado, con etiquetas y atribución separadas. No cambia dimensiones originales,
contrato 1.3.0, assets ni decisiones comerciales.
[Informe de UX y QA](technical/F3-furniture-search.md).
Pendiente de preview verificable del SHA final, revisión humana y merge; **F3 sigue
abierta**, sin alterar el orden de fases. Cinco sesiones y veinte planos F2 pendientes.

### F3 — corrección de catálogo en preview protegida (01-10-2026)

La revisión humana de PR #17 detectó ausencia de los IKEA y aviso genérico de catálogo.
Se corrige en la misma rama la omisión de sesión en fetch de manifests/permisos/GLB:
credenciales solo del mismo origen validado, manteniendo guards F3. Se añade motivo
concreto de red/HTTP/JSON/adaptación/exclusión y regresión en navegador con protección
de sesión, desktop y móvil. [Diagnóstico y QA](technical/F3-preview-catalog-fix.md).
Requiere nueva preview del HEAD y revisión de Juanma; **F3 permanece abierta**.
No cambia schema, assets, decisiones de producto ni las cinco sesiones/veinte planos F2 pendientes.


## Cierre del piloto F3 de catálogo externo — PR #17 (01-10-2026)

Juanma aprobó la revisión visual de la versión corregida y la [PR #17](https://github.com/Juanmaes83/floorplan-3d/pull/17) se fusionó mediante squash el 01-10-2026. Rama: `feat/f3-textured-external-catalog`; SHA revisado y desplegado: `772e24c26d10cec4349f28558ffc87ee18748317`; commit de merge en `master`: `24534b5544ffa37840bf4fe77c4ad12afda0c38b`. Vercel confirmó `READY` para el SHA exacto en [la preview protegida](https://floorplan-3d-rgf0u4thu-juanma-espinosas-projects.vercel.app/). La revisión humana aprobó la búsqueda y el acceso a SONGESAND y STOCKHOLM; no hubo despliegue manual a producción.

La entrega reúne el piloto de dos modelos externos con texturas JPEG embebidas, dimensiones y atribución, buscador y filtros de muebles, y corrección de las solicitudes con sesión de la preview protegida. Conserva validaciones, fallback genérico y FloorPlanProjectV1 1.3.0. Codex reportó 138/138 Node/navegador y 41/41 Python antes del merge; estas suites no se repitieron para este cierre documental. SwiftShader no acredita rendimiento en un teléfono físico.

**Alcance cerrado:** piloto inicial acotado y aprobado; no equivale a completar un catálogo comercial amplio ni una biblioteca visual general de materiales. La conversión/normalización de cualquier asset, Draco/KTX2/meshopt, los acabados PBR y los conectores del ecosistema siguen siendo trabajos posteriores, con perfiles y límites propios.

**Estado de la recomendación:** ejecutada y aprobada mediante la PR #18, que integra el flujo de proyecto vacío/imagen y edición dimensional con límites rectangulares conservadores. La [PR #15](https://github.com/Juanmaes83/floorplan-3d/pull/15) quedó reconciliada y fusionada el 01-10-2026 en `4ab3902`. Su integración documental no autoriza todas las propuestas de Roadmap 2 ni altera la numeración canónica. La auditoría geométrica de [descubrimiento](product/room-dimension-editing-discovery.md) y el [informe de implementación](technical/home-room-dimensions.md) registran alcance y decisiones. F2 conserva las cinco sesiones y veinte planos pendientes; no bloquean esta entrega ni la próxima implementación.

## Cierre post-F3 — nuevo proyecto y dimensiones de estancias, PR #18 (01-10-2026)

Juanma aprobó la revisión humana y la [PR #18](https://github.com/Juanmaes83/floorplan-3d/pull/18) se fusionó por squash. Rama: `feat/home-room-dimensions`; HEAD revisado: `c7d1b81e1f6456a9485c88f88723a6fd0fd7fe66`; merge en `master`: `10e9f96b417f866d45088fede039786180ddce95`. Vercel confirmó deployment `READY` para el SHA revisado, ID `dpl_4NS1VpLdy1ABhYsksQ3vXFcNfk93`, en [preview protegida](https://floorplan-3d-git-feat-home-roo-573ef9-juanma-espinosas-projects.vercel.app/). La revisión se hizo con un enlace temporal de acceso; no se almacena porque caduca. No se ejecutó despliegue manual a producción.

La entrega permite crear proyectos locales vacíos o desde imagen, mantenerlos independientes, añadir habitaciones rectangulares ortogonales y editar ancho/profundidad interiores con lado fijo, vista previa, confirmación y una entrada de historial. Se protegen IDs, muros compartidos, huecos, cotas, muebles y habitaciones vecinas; relaciones ambiguas se bloquean y permanecen disponibles en edición manual. FloorPlanProjectV1 1.3.0 y F3 no cambian. No es todavía un editor dimensional general para geometrías irregulares ni un solver completo de viviendas. [Informe, QA y limitaciones](technical/home-room-dimensions.md).

Codex reportó suite Node agregada inicial **159/160**; tras actualizar una expectativa antigua de renombrado, esa prueba pasó 1/1 y la suite dirigida final fue **25/25**. La suite agregada completa no se repitió después del ajuste. Python: **41/41**; sintaxis y diff correctos. Chromium/SwiftShader acredita renderizado y pruebas de interacción por software, no rendimiento de GPU o teléfono físico. No hay workflow de CI del repo que ejecute la suite de producto.

**Estado:** entrega dimensional post-F3 aprobada e integrada. PR #3 y #15 ya fueron reconciliadas y fusionadas. Juanma autorizó específicamente implementar la biblioteca visual de 50 superficies de esta entrega, sin numeración nueva ni aprobación global de Roadmap 2. La implementación y su revisión humana se registran a continuación. F2 sigue experimental y no validada; sus cinco sesiones y veinte planos con referencias continúan pendientes y no bloquean desarrollo.

## Biblioteca visual de superficies — implementación en revisión, sin fase nueva

Base remota comprobada: `5e5e0dc42b8669e7afcb121851f2901d2930a260`.
Rama única `feat/surface-material-library`, checkout inicialmente limpio, creada
sobre esa base. Las PR #3/#15 están **MERGED**; sus ramas documentales se conservan.

Alcance autorizado: 50 acabados, diez por familia, búsqueda/comparación, aplicación
local a suelo o pared completa, representación 2D/3D, historial y persistencia.
Contrato opcional 1.4.0, recursos servidos localmente y fallback visible.
[Inventario, derechos, QA y límites](technical/surface-material-library.md).
La revisión humana y la integración de esta biblioteca siguen pendientes.
No incluye puertas, ventanas, muebles nuevos ni conectores. No modifica decisiones
comerciales abiertas ni completa F2: cinco sesiones y veinte planos siguen pendientes.
