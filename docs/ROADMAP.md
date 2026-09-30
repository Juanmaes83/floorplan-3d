# Rubik Sota Floor Plan Designer — roadmap canónico

Actualizado: 30-09-2026. PR #9 integrada en `master` mediante merge commit
`10f7439b3fc86b0a0bd325d94531709d45cbcad4`; PR #10 integrada mediante merge
commit `c8a62de89f3fa3c5cd4e6de75ec514f56929a6e7`.

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
| F3 | Catálogo condicionado a permisos/licencias por asset y dimensiones verificadas | Pendiente; sin integración de Asset Lab, IKEA o muebles comerciales en esta entrega. |

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

La PR #10 quedó fusionada en `master` mediante merge commit `c8a62de89f3fa3c5cd4e6de75ec514f56929a6e7`. Incorpora un evaluador geométrico offline con datos sintéticos de prueba; no cambia el detector ni la interfaz. Juanma aprobó el método de longitud cubierta y la regla explícita de que este comparador de ejes no acredita diagonales, que siguen en los denominadores globales. La exhaustividad sobre ejes soportados se muestra aparte. Esta decisión no establece tolerancia o umbrales de producto ni valida F2. El desarrollo del prototipo puede continuar con la evidencia sintética y las limitaciones declaradas; cinco sesiones y veinte planos reales se reservan para la validación empírica posterior y no son un bloqueo de implementación. Próxima tarea candidata para avanzar F2: exportar bajo acción expresa del usuario las sugerencias crudas aún no revisadas desde el navegador, en un formato compatible con el evaluador; sin exportar imágenes, red ni persistencia automática. Verificar primero la forma actual del dato y no añadir esta exportación a FloorPlanProjectV1 sin justificarlo.


Siguiente trabajo de implementación F2: puede continuar con datos sintéticos y casos unitarios, sin esperar los conjuntos reales. Mantener como limitaciones visibles el comparador solo horizontal/vertical y la ausencia de umbrales de producto. Cinco sesiones y veinte planos autorizados son necesarios para la validación empírica, no para seguir desarrollando el prototipo.
