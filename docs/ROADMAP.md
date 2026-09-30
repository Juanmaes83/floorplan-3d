# Rubik Sota Floor Plan Designer — roadmap canónico

Actualizado: 30-09-2026. PR #9 integrada en `master` mediante merge commit
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
| F0 | Contrato, auditoría, decisiones y criterios | Contrato integrado; PR #3 conserva auditoría/decisiones históricas pendientes de reconciliar con master. No se declara aprobada toda F0. |
| F1a | Modelo, migración, importación/exportación JSON, varios proyectos locales, español/marca, mobile-first y fallback WebGL | Aprobada e integrada: PR #4 (`de195e3`) y #5 (`67e7498`). El 3D se deriva de la misma geometría. |
| F1b | Imagen raster local, calibración y segunda cota, trazado/edición, W1–W4, IndexedDB y ZIP | Aprobada e integrada: PR #6 (`7b5b083`). Seguimiento de claridad de importación y WebP estático integrado por PR #7 (`c28a170`). Cinco planos autorizados y medición de rendimiento móvil pendientes. |
| F2 | Asistencia a interpretación, sugerencias editables y revisión humana | **Prototipo experimental integrado y revisado; F2 no validada.** PR #9 fusionada por Juanma el 30-09-2026 (merge `10f7439`). Añade sugerencias locales de muros con aceptación/corrección/rechazo humanos. Siguen pendientes la línea base de cinco sesiones, el conjunto fijo de veinte planos con referencias y los umbrales. [Informe y limitaciones](technical/F2-wall-assist.md). Herramienta offline de evaluación geométrica integrada por PR #10. Juanma aprobó el 30-09-2026 el método de precisión/exhaustividad por longitud; diagonales sin crédito en el comparador de ejes y conservadas en denominadores globales. Sin umbrales de producto ni validación empírica de F2: [reglas y uso](technical/F2-wall-evaluation.md). |
| F3 | Catálogo de objetos 3D y materiales con assets autorizados y dimensiones verificadas | **Entrega inicial integrada** por PR #12 (merge `95fcf0d`): catálogo genérico dimensionado, adaptador, GLB sintético local y fallback. **Catálogo externo pendiente**: Juanma confirma autorización para usar los assets del proyecto; cada modelo candidato debe superar comprobaciones de existencia, hash, dimensiones, compatibilidad técnica y alcance de permisos. F3 sigue abierta. [Informe](technical/F3-initial.md). |

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
- **#3:** conservar auditoría, decisiones y criterios como evidencia fechada;
  actualizar referencias de fase a este roadmap. Revisar su diff contra master y
  retirar copias obsoletas de contratos/código antes de integrar documentación.
  No sobrescribir el schema F1b/WebP con el schema histórico de F0.
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


## Auditoría competitiva — propuestas para F3 (30-09-2026)

La [matriz de oportunidades](product/competitive-opportunity-matrix.md) contrasta
el estado integrado con documentación primaria leída por Codex y nueve fuentes
oficiales aportadas en la conversación, consultadas por una vía externa el
30-09-2026. Estas últimas añaden referencias de niveles/exportaciones Floorplanner,
Starter/edición móvil magicplan y licencia GPL v2+/formatos/API de escritorio/visor
web Sweet Home 3D, según paráfrasis externas; importes y condiciones no aportadas
siguen pendientes. Los fallos locales de curl/Playwright se conservan sin atribuir
a Codex el acceso externo; ni las fuentes
ni sus paráfrasis acreditan pruebas de uso, paridad o investigación completa.
Propone para revisión un catálogo externo pequeño, medidas trazables, soporte
acotado de texturas
y evaluación de formatos/rendimiento; no aprueba negocio, hosting o integraciones.

La autorización general de Juanma para usar Asset Lab sigue confirmada. La
inspección técnica fechada en la corrección `733f8dd` verificó remoto y ficheros
sin copiar assets; no se repite en esta ampliación de fuentes externas.
**F3 inicial integrada; catálogo externo pendiente; fase no cerrada.** D-01 y las
decisiones concretas de alojamiento/rendimiento siguen para revisión. F2 permanece
experimental: cinco sesiones y veinte planos reales pendientes, sin bloquear F3.
