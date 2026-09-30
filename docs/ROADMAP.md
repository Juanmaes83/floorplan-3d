# Rubik Sota Floor Plan Designer — roadmap canónico

Actualizado: 30-09-2026. Base integrada verificada: master
`0f67a63e13e9139117f17200a3d6f8bf97590072`.

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
| F1b | Imagen raster local, calibración y segunda cota, trazado/edición, W1–W4, IndexedDB y ZIP | Aprobada e integrada: PR #6 (`7b5b083`). Seguimiento UX/WebP en esta rama, aún sin fusionar. Cinco planos autorizados y móvil físico pendientes. |
| F2 | Asistencia a interpretación, sugerencias editables y revisión humana | **No iniciada.** Requiere medir el flujo manual con cinco planos autorizados y fijar umbrales antes de construir asistencia. |
| F3 | Catálogo condicionado a permisos/licencias por asset y dimensiones verificadas | Pendiente; sin integración de Asset Lab, IKEA o muebles comerciales en esta entrega. |

## Correspondencia con el roadmap histórico de PR #2

La [PR #2, revisión 84ddf72](https://github.com/Juanmaes83/floorplan-3d/blob/84ddf72265b83d46daebdb91fde0d5e568ceb019/docs/ROADMAP.md)
proponía otra numeración. Sus números quedan como referencias históricas:

| PR #2 antigua | Numeración canónica |
| --- | --- |
| F0: auditoría/contrato | F0 |
| F1: base mobile-first + F2: proyectos múltiples | F1a, ya integrada |
| F3: subir y trazar | F1b, ya integrada |
| F4: detección asistida | F2, no iniciada |
| F5: escena 3D desde geometría | Parte de F1a y usada por F1b; no una fase pendiente independiente |
| F6: Asset Lab/IKEA | F3, condicionada |
| F7–F9: CRM, Immersphere Pro, analítica/oferta | Horizonte futuro sin fase aprobada ni numeración nueva asignada |

Propuesta para las PR documentales abiertas (no se modifican ni cierran aquí):
- **#2:** sustituir su roadmap por este documento reconciliado antes de continuar
  su revisión, o cerrar como sustituida tras integrar esta entrega. No fusionar
  el texto antiguo que vuelve a marcar resultados existentes como pendientes.
- **#3:** conservar auditoría, decisiones y criterios como evidencia fechada;
  actualizar referencias de fase a este roadmap. Revisar su diff contra master y
  retirar copias obsoletas de contratos/código antes de integrar documentación.
  No sobrescribir el schema F1b/WebP con el schema histórico de F0.
- **#1:** español/marca ya llegó por #5; revisar los cambios residuales contra
  master antes de resolverla, sin reintroducir su index.html anterior a F1a/F1b.

## Puerta antes de F2 y pendientes visibles

1. [Cinco planos reales autorizados](qa/F1b-five-plans.md), incluyendo escaneo y
   foto: registrar error de segunda cota, tiempo, correcciones e incidencias.
2. Juanma debe fijar los umbrales de precisión, tiempo y rendimiento usando esa
   línea base **antes** de construir asistencia. No se adopta el 30 % provisional
   del plan histórico ni se inventa otro umbral en esta tarea.
3. Probar el flujo y rendimiento en teléfono físico. SwiftShader y emulación
   táctil solo acreditan comportamiento/renderizado por software.
4. PDF y HEIC/HEIF diferidos: [decisión de formatos](technical/image-formats.md).
   WebP estático se implementa en esta entrega con pruebas del recorrido completo;
   quedan excluidos WebP animado y con EXIF.
5. Revisar humanamente esta corrección, su PR y una preview vinculada a su SHA.
   No reutilizar como evidencia una preview del commit F1b anterior.

CRM, cuentas, backend, IA, Asset Lab, precios y publicación de planos a terceros
no forman parte de este seguimiento F1b. Integraciones futuras requerirán alcance,
contratos, permisos y evaluación propios; no se inicia esa fase aquí.
