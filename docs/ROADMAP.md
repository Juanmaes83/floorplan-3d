# Rubik Sota Floor Plan Designer — roadmap canónico

Actualizado: 30-09-2026. Base integrada verificada: master
`387a9bfd57630bced0d9fc1f858d9a0f3c181229`.

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
| F2 | Asistencia a interpretación, sugerencias editables y revisión humana | **Prototipo experimental de F2; en revisión; no validado (estado de esta rama).** Juanma autorizó el 30-09-2026 implementar y revisar sugerencias locales de muros antes de completar la evaluación. PR #8 integró la preparación; cinco sesiones, veinte planos y umbrales siguen pendientes. [Informe](technical/F2-wall-assist.md). Master solo cambiará de estado tras merge aprobado. |
| F3 | Catálogo condicionado a permisos/licencias por asset y dimensiones verificadas | Pendiente; sin integración de Asset Lab, IKEA o muebles comerciales en esta entrega. |

## Correspondencia con el roadmap histórico de PR #2

La [PR #2, revisión 84ddf72](https://github.com/Juanmaes83/floorplan-3d/blob/84ddf72265b83d46daebdb91fde0d5e568ceb019/docs/ROADMAP.md)
proponía otra numeración. Sus números quedan como referencias históricas:

| PR #2 antigua | Numeración canónica |
| --- | --- |
| F0: auditoría/contrato | F0 |
| F1: base mobile-first + F2: proyectos múltiples | F1a, ya integrada |
| F3: subir y trazar | F1b, ya integrada |
| F4: detección asistida | F2, prototipo experimental en revisión en esta rama |
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

La preparación de entrada F2 se fusionó por PR #8 el 30-09-2026 en `387a9bfd57630bced0d9fc1f858d9a0f3c181229`. Añade el protocolo reproducible, plantilla vacía y calculador offline; cobertura mínima alineada entre documentos, código y pruebas. Codex reportó 12/12 pruebas del recorder; no se ejecutaron de nuevo durante este merge. No hubo cambios de interfaz ni se requiere preview visual. En el cierre de PR #8 F2 permanecía **no iniciada**. La nueva autorización para
el prototipo de esta rama no modifica ese registro histórico ni completa F2.

CRM, cuentas, backend, IA, Asset Lab, precios y publicación de planos a terceros
no forman parte de este seguimiento. Integraciones futuras requerirán alcance,
contratos, permisos y evaluación propios.
