# Rubik Sota Floor Plan Designer — roadmap canónico


## Decisión D-01 — público inicial confirmado el 17-10-2026

Juanma confirmó como público inicial a **inmobiliarias, promotoras y estudios de arquitectura**; como segundo público, **profesionales de reformas e interiorismo**. El problema prioritario es preparar y presentar viviendas completas mediante un plano editable, mobiliario y vistas coherentes, incluidas viviendas de varias plantas cuando proceda. La participación de estudios de arquitectura no convierte Rubik en herramienta de documentación técnica ni acredita precisión profesional. El uso inicial se apoya en proyectos locales e intercambio explícito; no se ha decidido precio, cuentas, SaaS, CRM o política de compartir planos. [Registro de decisión](product/F0-decisions.md). La evaluación inicial desembocó en la aprobación del contrato de edificio (opción D, #50) y su primer corte (#51); eso no aprueba D-16, un contrato 2.0 ni las demás funciones de LoRA LAB. El estudio comparativo sigue en [#48](https://github.com/Juanmaes83/floorplan-3d/pull/48), con límites de evidencia.

## Estado vigente tras la integración del 17-10-2026

Las PR [#38](https://github.com/Juanmaes83/floorplan-3d/pull/38) (importación guiada multiformato), [#39](https://github.com/Juanmaes83/floorplan-3d/pull/39) (presentación por estancias y recorrido) y [#42](https://github.com/Juanmaes83/floorplan-3d/pull/42) (piloto Blender offline) están **fusionadas en master**, en ese orden. Merge commits: `34aff2c2b521b004aa007bfa8a7ed2356013dfb4`, `85aaf771ec3b1622313cbfd8bd44962ca2019b0a` y `05d5514fd46130bf81c9a1e6e6d2f0929518fad7`. Las referencias a PR abiertas en secciones fechadas anteriores describen el momento de aquellas auditorías. La presentación web, el piloto Blender y la referencia visual Candidate 04 de LAB Astra conviven; no se sustituye una por otra ni se declara el piloto de calidad Candidate 04.

Juanma revisó visualmente la presentación y aceptó su calidad actual para avanzar. La regresión de navegador de #39 se ejecutó en su Windows con Chrome y NVIDIA RTX 5070 Ti: los 24 archivos salieron con código 0 y los casos dirigidos M11, P05 y retorno de cámara pasaron tres veces cada uno. [Alcance exacto de la evidencia](qa/casa-serra-larga-progress.md#r10--cierre-del-gate-de-navegador-con-gpu-17-10-2026-evidencia-aportada-por-juanma). No hay total agregado de casos en los logs compartidos ni CI aprobada; CI no ejecutó pasos. El piloto #42 se integró como cadena técnica offline con límites visuales declarados en su [informe](technical/offline-blender-pilot.md). Quedan para mejoras posteriores el encuadre cenital de baños, la llegada del baño en suite, el pasillo simple, un caso de suelo visible del plano girado (73,4 % frente al objetivo de 75 %), el coste de `roomFrame` en teléfono físico y los defectos de acabado del vídeo Blender. No son una nueva ronda de bloqueo de estas entregas.

**Actualización 18-10-2026, multipiso (estado tras los merges):**

- [#50](https://github.com/Juanmaes83/floorplan-3d/pull/50) (contrato, opción D) y [#51](https://github.com/Juanmaes83/floorplan-3d/pull/51) (primer corte: dos plantas y escalera recta) están fusionadas. El solape visual que Juanma no aprobó dio lugar a las tres correcciones siguientes.
- [#52](https://github.com/Juanmaes83/floorplan-3d/pull/52) corrige el dibujo de etiquetas y el fixture; fusionada en `5e945f3`.
- [#53](https://github.com/Juanmaes83/floorplan-3d/pull/53) cierra **BW5** (mueble sobre una escalera o su hueco) sin cambiar el JSON; fusionada en `7dfaa64`.
  - Estado derivado para todo el edificio, visible en 2D y en 3D.
  - Lista «Revisar», desde la que se localiza el mueble en 2D, se aísla su planta en 3D o se edita la escalera.
  - Al añadir o duplicar se busca un sitio libre determinista; si no lo hay, el mueble no se añade.
  - No se confirma ningún cambio que cree un conflicto nuevo.
  - Las salidas de presentación se bloquean mientras la distribución esté pendiente.
- [#54](https://github.com/Juanmaes83/floorplan-3d/pull/54) añade «Buscar sitio libre», recolocación asistida con vista previa, aplicación expresa y panel accesible en móvil horizontal; fusionada en `0766dc5`. Si no hay lugar válido en la misma estancia, conserva el conflicto y explica la corrección manual.
- [Detalle, pruebas y límites](qa/multilevel-first-cut.md#51-solape-del-hueco-de-escalera-causa-y-corrección).
- La revisión visual conjunta a 1440×900, 390×844 y 844×390 y las pruebas dirigidas constan en #54. La regresión completa en este entorno no quedó limpia; CI, GPU representativa y teléfonos físicos no están acreditados para estas correcciones.
- No se aprueban recorrido por la escalera, normas de escaleras, exterior ni más plantas.

**Actualización 18-10-2026, MCP local:** las PR [#40](https://github.com/Juanmaes83/floorplan-3d/pull/40) (relaciones espaciales), [#41](https://github.com/Juanmaes83/floorplan-3d/pull/41) (diagnóstico y medidas) y [#43](https://github.com/Juanmaes83/floorplan-3d/pull/43) (obstáculos del segmento mínimo y cadena de puertas) están fusionadas en `master`, en ese orden: `19f2f44`, `9c9e155`, `6728e16`. [Pruebas y límite exacto](qa/local-mcp-stage1-integration-2026-10-18.md). **Etapa 1 no completa:** el siguiente corte debe demostrar un recorrido con desvíos y anchura transitable, incluyendo extremos de muros, hojas y empotramientos, antes de atribuir paso libre. Las Etapas 2–4 no están aprobadas. **Cuarto corte en revisión:** `check_route_2d` comprueba un recorrido 2D con desvíos y anchura explícita para un disco, con positivos verificados y bloqueos demostrados ([contrato](technical/local-mcp-route-2d.md)). Está pendiente de auditoría y de validación con proyectos reales; no cierra por sí solo la Etapa 1. En paralelo, Claude Code continúa el **estudio** LoRA LAB en [#48](https://github.com/Juanmaes83/floorplan-3d/pull/48); sus hallazgos se usarán para elegir una sola entrega mínima, no para implementar toda la demo. El orden 4–8 de Roadmap 2 sigue orientativo y F2 continúa sin validación empírica.

**Actualización 16-10-2026, solo estado LAB (sin cambio de fases):** la [LAB PR #5](https://github.com/Juanmaes83/lab-astra-sept-2026/pull/5) «Rubik v03 — Living camera preflight» está **MERGED** el 16-10-2026 a las 14:57:56Z por Juanmaes83 en su rama operativa `feat/astra-blender-gate-1`, squash `b5cc40ad3446fa45df625cee1fbaccaf4a2d7234`. Juanma eligió su Candidate 04 como referencia humana de movimiento y acabado para la revisión de #39; es un render offline de Blender Cycles de una escena LAB concreta, no una capacidad de Floorplan. Las menciones de LAB #5 como abierta en secciones fechadas anteriores se conservan como historia. LAB #1 sigue siendo una decisión separada. F2 sigue experimental; no se aprueban F4 ni Roadmap 2 global.

Actualizado: 13-10-2026. Experiencia guiada y navegación de vuelta integradas por [PR #34](https://github.com/Juanmaes83/floorplan-3d/pull/34), merge `92a1193fc1386d3f69566beab15923cc62836222`; [cierre y evidencia](qa/guided-experience-integration-2026-10-13.md). La PR #23 también figura MERGED (`c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3`), verificado en GitHub. F2 sigue experimental y no validada; sus cinco sesiones y veinte planos con referencias siguen pendientes. Esta integración no aprueba otras fases.

**Antecedente del 02-10-2026:** al reconciliar la PR #23 con `origin/master` `7d49a5ed3c07da73c80e259465d62c22c6a69c0d`. Se conserva la exportación de PR #24 (`67b7f999c42b3a2960dac6caf94ab77dcc637819`) y sus cierres documentales #25/#26. La revisión visual de los seis modelos #23 fue aprobada por Juanma; el cierre por squash queda condicionado a pruebas, igualdad del contenido visible y preview READY del HEAD reconciliado. Vercel confirmó `READY` para producción en el SHA histórico de PR #20 (`29250810a8341b3b296539118b54799f1e31a77b`); no se promueve producción manualmente. La auditoría de integración del ecosistema quedó integrada mediante PR #13; merge squash `a403a52e7be467b96aa580cbceca55f0f653fb79` (rama revisada `docs/ecosystem-integration-audit`, HEAD `be931f827b96369b6b9147e6fb6d6d6ea0b3901b`). PR #9 integrada en `master` mediante merge commit
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

**Antecedente de revisión de #20 (01-10-2026; ya integrada):** la rama
`feat/f3-asset-lab-pipeline`, basada en `master` `18c68e2`, incorpora un pipeline
reproducible y doce modelos GLB normalizados de Asset Lab. Se comprobaron 114
GLB físicos frente a 134 fichas y se rechazaron cuatro candidatos concretos.
Las dimensiones nuevas se etiquetan como medidas de malla, sin equivalencia
oficial verificada. [Informe, inventario y límites](technical/F3-asset-lab-pipeline.md).
Aquella revisión quedó superada por el merge squash de PR #20 (`2925081`).
El pipeline está integrado para esta tanda acotada; no sincroniza automáticamente
Asset Lab ni admite cualquier modelo. No cambia el estado experimental de F2,
la biblioteca de 50 superficies ni las propuestas comerciales abiertas.

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
| F3 | Catálogo de objetos 3D y materiales con assets autorizados; verificación física por recurso | **Entregas acotadas integradas.** PR #17 incorporó SONGESAND y puf STOCKHOLM con búsqueda/filtros; PR #19 integró 50 mapas locales CC0-1.0 en cinco familias para suelos y paredes, con aplicación persistente, búsqueda, comparación, repetición y fallback (`FloorPlanProjectV1` 1.4.0; merge `fa79d07`). PR #20 integró un pipeline reproducible y acotado y doce GLB normalizados de Asset Lab (merge squash `2925081`); las medidas nuevas son de malla, sin escala física verificada. PR #23 añadió seis GLB, visualmente aprobados por Juanma e integrados por squash `c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3`, comprobado en #35; el cierre técnico anterior es histórico. No hay sincronización automática con Asset Lab, soporte universal de modelos ni catálogo comercial general. Otros perfiles/extensiones y PBR son propuestas futuras; rendimiento en teléfono físico pendiente. [Materiales](technical/surface-material-library.md) · [Pipeline](technical/F3-asset-lab-pipeline.md) · [Tanda #23](technical/F3-asset-lab-next.md). |
| Entrega legal integrada | Autoría visible y apartado «Legal y uso» en la plataforma | Integrada por PR #22, merge `e62d17ee62576466f937700f6c445c33b09ec9c2`, comprobado el 02-10-2026. Texto informativo, no asesoramiento jurídico; conserva licencias y atribuciones de recursos de terceros. |
| Entrega post-F3, sin numeración nueva | Inicio de proyectos vacíos/desde imagen y edición directa de dimensiones de estancias rectangulares | Aprobada e integrada por PR #18 (`c7d1b81` revisado; merge `10e9f96`). No modifica schema 1.3.0; limita edición numérica a geometría ortogonal inequívoca. [Informe](technical/home-room-dimensions.md). |

## Integraciones Pascal y MCP — estado reconciliado (13-10-2026)

Base auditada: `master` `88b0cb568e9824533764518ec42e235e9c2774a9`; referencia conservada en `baseline/control-2026-10-13-88b0cb5`. La bienvenida, buscador, guía y navegación de #34/#35 permanecen integrados.

| Entrega | Estado actual | Evidencia y alcance |
| --- | --- | --- |
| A: revisión local de distribución | Integrada por [#27](https://github.com/Juanmaes83/floorplan-3d/pull/27), merge `5b93339601998d750918e01cb4431073b75cf5a0` | Solapes, holgura explícita y barrido de puertas; lectura y resaltado sin persistencia. [Informe](technical/layout-review-phase-a.md). D-A1 sigue abierta. |
| B: captura 3D configurable | Integrada por [#29](https://github.com/Juanmaes83/floorplan-3d/pull/29), merge `217ed068b90232907a40b8dff7748a11e6259e7f` | Tamaño/proporción y restauración de cámara/buffer; [informe](technical/capture-3d-phase-b.md). |
| C: variantes locales seguras | Integrada por [#30](https://github.com/Juanmaes83/floorplan-3d/pull/30), merge `3599e71432265860ba932147e1d9765f609b68c4` | Original y hasta dos variantes, comparación y borrado. D-C1 resuelta como metadato de biblioteca, fuera del JSON exportado. [Informe](technical/variants-phase-c.md). |
| MCP local v0.1.0 | Integrado por [#31](https://github.com/Juanmaes83/floorplan-3d/pull/31), merge `88aef0bfeea8abb67865c3d2a33a484c909511ea` | Cuatro herramientas sobre un JSON exportado, stdio, solo lectura, hash por consulta. No conecta con la sesión activa ni crea variantes. [Uso](../tools/rubik-mcp/README.md). |
| Evolución del MCP | Cuatro etapas propuestas; no implementadas por esta documentación | Diagnóstico fiable, propuestas explicables, simulación aislada y variante revisable. [Roadmap MCP](technical/local-mcp-roadmap.md). |
| LAB v03 | Entregada y aprobada en LAB [#4](https://github.com/Juanmaes83/lab-astra-sept-2026/pull/4), squash `37df8472e6163263f435424f6989b6c0e10b8ad9` | Base `feat/astra-blender-gate-1`; consumió Rubik `c4f2493`. No es otra implementación pendiente de Floorplan. LAB #5 (cámara Living, Candidate 04) fusionada el 16-10-2026 en esa rama, squash `b5cc40a`; LAB #1 sigue abierta y separada. |
| Autoría rescatada de #21 | Rescate documental; adaptación visual pendiente | #21 cerrada sin merge; #22 conserva el panel vigente. Crédito en cabecera y textos adicionales requieren una PR mínima y revisión propia. [Seguimiento](qa/documentation-reconciliation-2026-10-13.md#adaptación-visual-rescatada-de-21--entrega-independiente). |

A/B/C son entregas de la propuesta Pascal, no nuevas fases canónicas. El MCP implementa un subconjunto de lectura relacionado con D1; no equivale a aprobar toda D ni D–G. F2 continúa experimental: cinco sesiones, veinte planos con referencias y umbrales pendientes; escala física de modelos y rendimiento en teléfono siguen sin acreditar.

## MCP local de Rubik — primera entrega y evolución propuesta

La PR #31 ofrece `get_project_summary`, `list_project_elements`, `get_project_element` y `review_layout`; revalida el JSON, limita campos y devuelve SHA-256. La evidencia de uso reportada el 07-10-2026 conserva 47 llamadas con hash estable y sin escrituras. Windows: `npm run check` correcto y 5/6 tests por `EPERM` al crear un symlink de fixture; CI Linux 6/6.

El filtro por habitación y cuatro pares de holgura posiblemente separados por muros son hipótesis a reproducir. Los 600 mm fueron un valor de prueba, no un umbral normativo ni un defecto demostrado. Las cuatro etapas del [roadmap específico](technical/local-mcp-roadmap.md) requieren implementación y revisión propias; esta reconciliación no añade herramientas de escritura ni cambia `FloorPlanProjectV1`.

La [reconciliación de #28/#32](qa/documentation-reconciliation-2026-10-13.md) conserva fuentes, aportes únicos, resultados históricos y límites. Las PR originales se cierran como sustituidas después de comprobar el merge de esta actualización; sus ramas y SHAs se conservan durante este cierre.

## Correspondencia con el roadmap histórico de PR #2

**Entrega post-F3 integrada, sin nueva numeración (02-10-2026):**
Juanma aprobó visualmente y fusionó la PR #24. Merge squash:
`67b7f999c42b3a2960dac6caf94ab77dcc637819`; HEAD revisado:
`86c207530c8bca2ec8a04115c6483319c64582c2`. Incluye exportación determinista
de un fixture sintético Rubik→GLB/Blender, perfiles offline acotados y tres
albedos CC0 candidatos separados del catálogo web. [Informe y límites](technical/post-F3-rubik-blender-candidate.md).
Es una integración técnica acotada, no F4 ni aprobación global de Roadmap 2.
No conecta automáticamente LAB Astra, Blender MCP, Unreal, CRM o Immersphere.
F2 conserva pendientes sus cinco sesiones, veinte planos reales y umbrales; no
bloquearon esta entrega y siguen pendientes para validación empírica.

**Referencia externa registrada el 17-10-2026:** la [demostración de Summerz3002 sobre CAD y Blender](technical/summerz-cad-blender-reference-2026-10-17.md) se evalúa en el [Roadmap 2 propuesto](ROADMAP-2-proposal.md#33-referencia-externa-cadblender-17-10-2026). El código de esa ampliación no está identificado en los enlaces publicados; no altera el estado de fases canónicas ni acredita una integración en Rubik.

La [herramienta de diseño de LoRA LAB](technical/loralab-design-reference-2026-10-17.md) es una referencia distinta para varias plantas, exterior y recorrido. El [siguiente paso de Roadmap 2](ROADMAP-2-proposal.md#34-lora-lab-siguiente-evaluación-de-vivienda-completa) es compararla en profundidad con Rubik antes de elegir una mejora. No se aprueban aquí nuevas fases ni cambios del contrato.

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

**Estado en aquel cierre de #12:** F3 inicial integrada; catálogo externo aún pendiente entonces. Después se integraron #17, #19 y #20 dentro de sus alcances. Nuevos candidatos, extensiones y perfiles generales requieren otra entrega. La medición en móvil físico sigue pendiente; SwiftShader no la sustituye. F2 continúa experimental y no validada empíricamente.


## Ecosistema — propuestas pendientes de decisión (30-09-2026)

La [auditoría de integración](product/ecosystem-integration-audit.md) compara Rubik Sota, los tres proyectos de Immersphere, Asset Lab, el downloader IKEA y Blender MCP mediante snapshots fijados por SHA. Identifica formatos incompatibles y pruebas mínimas; no implementa conexiones ni acredita servicios publicados. El LAB Astra quedó localizado en `lab-astra-sept-2026`, con referencia explícita a la rama LAB de Blender MCP: hay arquitectura documental y código MCP, sin cadena completa ejecutada demostrada. Seedance 2.5 continúa sin evidencia de integración en esas fuentes.

El piloto inicial de catálogo externo se amplió con doce modelos normalizados de Asset Lab mediante PR #20 y la tanda aprobada de seis modelos de #23. Se mantienen perfiles acotados, fallback y permisos por recurso; no se valida escala física ni integración comercial general. La exportación determinista Rubik→Blender ya está integrada por #24 dentro de su fixture y perfil; no es un conector universal. CRM y presentaciones 360 siguen propuestas pendientes, sin cliente prioritario aprobado ni nueva numeración de fase.

F3 inicial, el piloto texturizado y la primera tanda de doce modelos de Asset Lab están integrados. Siguen pendientes la verificación de escala física y el rendimiento en teléfono físico; los siguientes assets requieren comprobación específica. F2 permanece experimental: cinco sesiones y veinte planos siguen pendientes, sin bloquear el avance.

## Antecedente F3 — piloto externo texturizado en revisión antes de #17 (01-10-2026)

Rama `feat/f3-textured-external-catalog`, basada en master `6e8b512d61e8f500c2d6a7f1cfdfdeb7e7c5930f`, posterior a las PR #13/#14. Integra SONGESAND 90366839 y STOCKHOLM 2025 puf 80586139 con procedencia fijada, autorización de Juanma para Git/preview, medidas oficiales aportadas externamente y soporte acotado de JPEG embebido. El sofá 90591748 se excluye por superar la tolerancia de 20 mm. El schema sigue en 1.3.0; no se modifican Asset Lab ni decisiones comerciales.

[Informe de aquella revisión](technical/F3-initial.md#piloto-externo-texturizado-01-10-2026). La revisión y el merge se completaron después en #17; véase su cierre abajo. La preview de PR #12 no acreditaba este piloto. SwiftShader no valida rendimiento en teléfono físico. F2 mantiene cinco sesiones y veinte planos pendientes.

### Antecedente F3 — búsqueda local de muebles antes del merge #17 (01-10-2026)

Sobre la misma rama `feat/f3-textured-external-catalog`: búsqueda por nombre/tipo,
familias derivadas del catálogo, sinónimos españoles y filtros de estancia/familia.
Conserva los 60 genéricos y muestra únicamente los tres modelos del catálogo F3
aceptado, con etiquetas y atribución separadas. No cambia dimensiones originales,
contrato 1.3.0, assets ni decisiones comerciales.
[Informe de UX y QA](technical/F3-furniture-search.md).
La preview, revisión humana y merge de este alcance se completaron después en #17.
Cinco sesiones y veinte planos F2 continúan pendientes.

### Antecedente F3 — corrección de catálogo en preview protegida antes de #17 (01-10-2026)

La revisión humana de PR #17 detectó ausencia de los IKEA y aviso genérico de catálogo.
Se corrige en la misma rama la omisión de sesión en fetch de manifests/permisos/GLB:
credenciales solo del mismo origen validado, manteniendo guards F3. Se añade motivo
concreto de red/HTTP/JSON/adaptación/exclusión y regresión en navegador con protección
de sesión, desktop y móvil. [Diagnóstico y QA](technical/F3-preview-catalog-fix.md).
Aquella nueva preview y revisión se completaron antes del merge #17.
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

## Biblioteca visual de superficies — PR #19 integrada (01-10-2026)

Juanma aprobó la revisión humana y la [PR #19](https://github.com/Juanmaes83/floorplan-3d/pull/19) se fusionó por squash. Rama revisada: `feat/surface-material-library`; SHA revisado `104830bf97cab262df7a26dae725203d661e097d`; merge a master `fa79d07243672076df506aae0f50ec84fca82b5d`.

Entrega acotada: 50 mapas CC0-1.0 (diez en cada una de cinco familias), búsqueda y comparación, aplicación persistente a suelos y paredes, repetición configurable, fallback y muestras 2D. `FloorPlanProjectV1` pasa a 1.4.0 con campos opcionales para acabado mural y repetición; la compatibilidad de proyectos existentes se mantiene. [Inventario, procedencia, QA y límites](technical/surface-material-library.md).

Vercel informó READY para el SHA revisado; la preview estuvo disponible en [esta URL](https://floorplan-3d-git-feat-surface-ddcf54-juanma-espinosas-projects.vercel.app/). Codex reportó pruebas locales y renderizado de los mapas en Chromium/SwiftShader; la suite completa tuvo fallos/timeout iniciales y no se repitió completa tras los ajustes. No se declara rendimiento validado en teléfono físico.

**Estado en el cierre de #19:** F3 incorporaba el piloto de mobiliario externo y esta biblioteca acotada. La propuesta siguiente era evaluar un pipeline controlado para modelos; #20 integró después su primera versión limitada para doce GLB. No se afirma completado un catálogo comercial ilimitado, un pipeline universal ni perfiles PBR completos. F2 continúa experimental: cinco sesiones y veinte planos con referencias siguen pendientes, sin bloquear el desarrollo.

## Cierre de tanda F3 #23 — integrado

Los seis modelos GLOSTAD/KNOXHULT/NORDLI/SKOGSTA/STOCKHOLM/STRANDMON están
aprobados visualmente por Juanma en HEAD `5b7267f84380586d5e482373bd70f0392e896009`.
La rama existente conserva ambos lados al integrar master `7d49a5e`, incluido
el exportador #24. El pipeline repite los mismos hashes, seis admitidos y dos
exclusiones; no cambia loader, schema ni contenido visible aprobado.
[Reconciliación, pruebas, fallos y procedimiento de cierre](qa/f3-reconciliation-2026-10-02.md).
Esta sección forma parte del squash autorizado de [PR #23](https://github.com/Juanmaes83/floorplan-3d/pull/23);
su metadata confirma MERGED y squash `c4f2493195c05fe54ca22bc1b9fbaf7ea1681af3` (comprobación 13-10-2026).
No se aprueba globalmente F3/Roadmap 2 ni se promueve producción manualmente.
Siguiente entrega autorizada, **solo tras MERGED**: LAB v03 desde la v02 integrada,
con seis modelos nuevos y cinco familias de superficie; revisión humana propia.

## Experiencia unificada UI/UX — integrada (13-10-2026)

Juanma autorizó implementar bienvenida, objetivos, cinco etapas, buscador local de
acciones, tareas necesarias/opcionales/condicionales y progreso verificable por
proyecto. Rama `feat/unified-guided-experience`, desde master `88aef0b`. Conserva
el comportamiento «Subir plano» de la PR #33 abierta; no modifica el schema.

[Implementación y límites](technical/guided-experience.md) ·
[Plan](technical/guided-experience-plan.md) ·
[QA y capturas](qa/guided-experience-2026-10-13.md).
Juanma aprobó la versión corregida y autorizó el merge. [PR #34](https://github.com/Juanmaes83/floorplan-3d/pull/34) fusionada en `92a1193fc1386d3f69566beab15923cc62836222`, desde el HEAD revisado `5f0ae7200c206fec2ad22ada8b5be3ae17ebd5f0`. El árbol del merge coincide con el probado. Incluye Inicio visible, Paso anterior, Atrás/Adelante y recuperación sin pérdida de proyecto; URL base → bienvenida, recarga de `#editor` → editor.

[QA de retorno](qa/guide-navigation-2026-10-13.md) · [Cierre, pruebas y deployment](qa/guided-experience-integration-2026-10-13.md). Producción automática READY para el merge; sin promoción manual. No cambia el estado experimental de F2 ni constituye aprobación de fases adicionales. PR #33 sigue abierta; su comportamiento ya está incluido, no requiere una segunda integración de la misma CTA.

## Registro histórico rescatado de PR #28 — 06-10-2026

> Este registro conserva la evidencia y las decisiones de aquella fecha. El estado vigente está en la sección «Integraciones Pascal y MCP». Fase C ya está integrada por #30; las menciones a autorizaciones, próximos pasos y PR abiertas de este registro no sustituyen ese estado. LAB #1/#5 siguen abiertas según la comprobación del 13-10-2026.

### Estado posterior al 06-10-2026 — cierre de Fase A (PR #27) y verificación de LAB v03

Comprobado contra GitHub el 06-10-2026: `origin/master` en
`5b93339601998d750918e01cb4431073b75cf5a0`. Las secciones anteriores se conservan
como registro histórico fechado.

### Fase A de la propuesta Pascal–Rubik — integrada por PR #27

[PR #27](https://github.com/Juanmaes83/floorplan-3d/pull/27) se fusionó el
06-10-2026 a las 16:36:44Z con un merge commit,
`5b93339601998d750918e01cb4431073b75cf5a0`, cuyos padres son `c4f2493` y el HEAD
de la rama `d8ff504f166bbc9ecc750aa516efc24832ff3595`.

**Aprobación.** La ejecutó Juanma mediante el merge (`merged_by: Juanmaes83`). En
GitHub no consta una review formal ni un comentario de aprobación separado. La
entrega se hizo por instrucción expresa de Juanma, en una rama aislada.

**Qué integra:**

- La auditoría [PASCAL-RUBIK-INTEGRATION-ROADMAP](proposals/PASCAL-RUBIK-INTEGRATION-ROADMAP.md), que sigue siendo una **propuesta no aprobada**.
- La revisión local de distribución, de solo lectura:
  - solapes de huellas orientadas;
  - holgura frente a un umbral que introduce la persona;
  - barrido de puertas con bisagra y sentido guardados;
  - estados `checked`/`partial`/`insufficient_evidence`, también cuando se omite geometría;
  - resaltado 2D exacto y no persistido.

**Qué no cambia:**

- `FloorPlanProjectV1`, su schema, ejes, unidades, persistencia y formato.
- No asigna numeración canónica a la Fase A ni aprueba otras fases Pascal: la Fase B y siguientes siguen siendo propuestas.

**Decisión de esta iteración.** No hay umbral de holgura predeterminado; sin él,
la holgura queda en `insufficient_evidence`. Ofrecer valores orientativos sigue
pendiente (D-A1 de la propuesta).

**Pruebas registradas** en [el informe técnico](technical/layout-review-phase-a.md).
Se ejecutaron en secuencia, sobre clones aislados, y con Three.js 0.160.0 servido
desde el tarball npm por el bloqueo de jsDelivr.

| Suite | `master` | Fase A |
| --- | --- | --- |
| Pruebas de la Fase A | — | 18/18 (16 unitarias + 2 de navegador) |
| Unitarias existentes | 124 pasan, 1 omitida (Blender) | 124 pasan, 1 omitida (Blender) |
| `browser.test` | 36 pasan, 1 omitida (chequeo de CDN propio) | 36 pasan, 1 omitida (chequeo de CDN propio) |
| F3 | 21 pasan, 4 fallan (2, 15, 16, 17) | 21 pasan, 4 fallan (los mismos) |
| Superficies | 7/7 | 7/7 |
| Dimensiones | 5/5 | 5/5 |

Los 4 fallos de F3 son preexistentes: el mismo error `replaceChildren … blur` y
el mismo número de ocurrencias en ambas versiones.

**Límites que se conservan:**

- No evalúa altura, holgura frente a muros, recorridos ni entrega de muebles, normativa, accesibilidad ni mallas 3D.
- A poco zoom en móvil el resaltado es pequeño.
- No se verificaron la preview del SHA exacto, un teléfono físico ni la revisión visual humana registrada en el informe técnico.

### LAB v03 — ya satisfecha en el repositorio LAB; no requiere cambios en Rubik

La línea anterior «Siguiente entrega autorizada, solo tras MERGED: LAB v03 desde
la v02 integrada, con seis modelos nuevos y cinco familias de superficie» se
refería al piloto **Rubik → LAB** del repositorio privado
[`lab-astra-sept-2026`](https://github.com/Juanmaes83/lab-astra-sept-2026), no a
una entrega de código de Rubik. Verificación de solo lectura del 06-10-2026:

| Entrega LAB | PR | Estado | Rama base / merge |
| --- | --- | --- | --- |
| Piloto sintético Blender | [LAB #2](https://github.com/Juanmaes83/lab-astra-sept-2026/pull/2) | Cerrada el 02-10-2026; el registro LAB la da por fusionada (`4e447ff`) | `feat/astra-blender-gate-1` |
| v02, transferencia de catálogo | [LAB #3](https://github.com/Juanmaes83/lab-astra-sept-2026/pull/3) | Cerrada el 02-10-2026; squash `101d94a` según el registro LAB | `feat/astra-blender-gate-1` |
| **v03, catálogo F3 ampliado** | [LAB #4](https://github.com/Juanmaes83/lab-astra-sept-2026/pull/4) | **MERGED** el 02-10-2026 a las 20:31:16Z por Juanmaes83; cuerpo: «Aprobada por Juanma» | squash `37df8472e6163263f435424f6989b6c0e10b8ad9` en `feat/astra-blender-gate-1` |

Según [`docs/17-RUBIK-LAB-PILOT-v03.md`](https://github.com/Juanmaes83/lab-astra-sept-2026/blob/37df8472e6163263f435424f6989b6c0e10b8ad9/docs/17-RUBIK-LAB-PILOT-v03.md):

- **Productor:** v03 tomó como productor fijado Rubik `c4f2493`, el squash de PR #23.
- **Seis modelos nuevos:** son los seis modelos de #23 (GLOSTAD 2 plazas, STRANDMON, SKOGSTA, KNOXHULT, STOCKHOLM aparador y NORDLI), sumados a los cinco de control de v02.
- **Cinco familias de superficie:** son cinco superficies actuales de la biblioteca #19, una por familia (`herringbone-parquet`, `marble-01`, `terrazzo-tiles`, `blue-plaster-wall` y `square-tiles`).
- **En Rubik:** todos esos recursos ya estaban integrados; v03 no modificó Rubik ni pide importaciones, conversiones, cambios de contrato, loaders o persistencia.
- **Lo que no acredita:** compatibilidad de todo el catálogo, escala de fabricante, rendimiento en móvil físico, photoreal ni conexión de producto.

**Conclusión:** LAB v03 está entregada y aprobada en su repositorio. En esta
verificación no se cambió código de producto de Rubik.

### Siguiente paso: decisión pendiente de Juanma

> **Registro histórico, superado.** Después de esta sección Juanma autorizó la Fase B, ya integrada por PR #29, y la Fase C. Véase la [actualización siguiente](#actualización-06-10-2026--fase-b-integrada-pr-29-y-fase-c-autorizada). Las demás opciones siguen pendientes.

Con Fase A integrada y LAB v03 cerrada, este roadmap **no define ahora otra
entrega autorizada**. No se inventa ninguna. Hechos verificados para decidir:

- En el LAB está abierta la [PR #5 «Rubik v03 — Living camera preflight [HUMAN REVIEW]»](https://github.com/Juanmaes83/lab-astra-sept-2026/pull/5), creada el 03-10-2026 desde `codex/rubik-living-walkthrough-v01`. Es trabajo del repositorio LAB, pendiente de revisión humana allí. No se ha auditado su contenido en esta tarea y no figura como entrega de Rubik.
- [LAB PR #1 «F2-A — Astra + Blender MCP Gate 1»](https://github.com/Juanmaes83/lab-astra-sept-2026/pull/1) sigue abierta, como decisión separada.
- Siguen pendientes:
  - en Rubik: la validación empírica F2 (cinco sesiones, veinte planos y umbrales), la escala física de los modelos de malla, el rendimiento en teléfono físico y D-01;
  - de la propuesta Pascal: la decisión D-A1 y las fases B–G, sin aprobar.

Opciones, sin preferencia asignada:

1. Revisar LAB #5 en su repositorio.
2. Aprobar expresamente otra propuesta acotada, por ejemplo la Fase B (captura 3D configurable) de la propuesta Pascal.
3. Priorizar la validación empírica F2 o la medición en teléfono físico.

Hasta esa decisión no se inicia ninguna entrega nueva de producto.

## Actualización 06-10-2026 — Fase B integrada (PR #29) y Fase C autorizada

Comprobado contra GitHub el 06-10-2026:

- `origin/master` en `217ed068b90232907a40b8dff7748a11e6259e7f`, el merge de PR #29, con padres `5b93339` y `88aa43aa4922dbee4fb414bb0630c68b6654f895`.
- Las secciones anteriores son registros fechados y se conservan.

### Fase B de la propuesta Pascal–Rubik — integrada por PR #29

[PR #29](https://github.com/Juanmaes83/floorplan-3d/pull/29) se fusionó el
06-10-2026 a las 22:15:35Z (`merged_by: Juanmaes83`). HEAD revisado:
`88aa43aa4922dbee4fb414bb0630c68b6654f895`; Vercel informó `success` para ese SHA.
Detalle en [el informe técnico de la Fase B](technical/capture-3d-phase-b.md).

**Qué integra:**

- Tamaño de captura 3D: «Vista actual» por defecto (el comportamiento anterior) o lado mayor de 1280, 1920 o 2560 px.
- Proporción: igual que la vista, 16:9, 4:3, 1:1 o 9:16.
- Las opciones son solo de sesión.

**Cómo funciona:**

- Reutiliza el mismo renderer con una copia de la cámara y encuadre «contain».
- Restaura el canvas de forma síncrona: no cambian la vista, la cámara, el canvas, el proyecto, el historial ni `localStorage`.

**Límites:**

- 2560 px por lado.
- Presupuesto de 2560 × 1920 px, además de los límites de la GPU.
- Si el buffer real no coincide con lo pedido, la captura se aborta con un aviso.

**Pruebas registradas** (secuenciales, en clon aislado):

| Suite | `master` | Fase B |
| --- | --- | --- |
| `capture-3d.browser` (nuevo) | — | 3/3 |
| Fase A | 18/18 | 18/18 |
| Unitarias | 124 pasan, 1 omitida | 124 pasan, 1 omitida |
| `browser.test` | 36 pasan, 1 omitida | 36 pasan, 1 omitida |
| F3 | 21 pasan, 4 fallan | 21 pasan, 4 fallan (los mismos, preexistentes) |
| Superficies | 7/7 | 7/7 |
| Dimensiones | 5/5 | 5/5 |

**Límites que se conservan:**

- Memoria y tiempo en teléfono físico sin medir: el presupuesto es un cálculo, no una medición.
- SwiftShader no acredita GPU real.
- Las etiquetas CSS2D no aparecen en la imagen.
- `READY` o `success` no sustituyen la revisión visual humana.

No cambia `FloorPlanProjectV1`.

### Fase C de la propuesta Pascal–Rubik — autorizada, no canónica

Juanma autorizó el 06-10-2026, por instrucción expresa, implementar la **Fase C
(variantes seguras)** de la [propuesta](proposals/PASCAL-RUBIK-INTEGRATION-ROADMAP.md):

- duplicar una distribución;
- editar la copia sin alterar el original;
- comparar hasta tres distribuciones con métricas y avisos existentes;
- borrar una variante con confirmación.

La autorización no convierte las fases A–G en fases canónicas ni autoriza las
fases D–G. La implementación va en una PR independiente de esta, con su propio
informe técnico.

**Decisión D-C1 resuelta para esta entrega:**

- El vínculo variante → original se guarda como **metadato local de la colección de proyectos** del navegador.
- Referencia el `id` de la entrada de la biblioteca local.
- Queda fuera del JSON exportado y de `FloorPlanProjectV1`: sin `extensions['x-variant-of']`, sin campos nuevos ni cambios de versión o schema.
- Si una variante se exporta e importa en otra instalación, sigue siendo un proyecto válido, pero sin vínculo con su origen.

### Pendientes que no cambian

- **Rubik:** validación empírica F2 (cinco sesiones, veinte planos y umbrales), escala física de los modelos de malla, rendimiento en teléfono físico y D-01.
- **Propuesta Pascal:** D-A1 sigue abierta; las fases D–G siguen sin aprobar.
- **Repositorio LAB:** las PR #1 y #5 siguen siendo decisiones separadas en ese repositorio.
