# Flujo de trabajo por fases

## Regla de avance

El proyecto avanza una fase cada vez. No se inicia la fase siguiente hasta que la fase actual haya sido revisada por Juanma, aprobada, fusionada y documentada como cerrada.

**Ciclo obligatorio:**

1. **Preparar:** comprobar rama base, PR previas, documentación y estado del checkout. No sobrescribir trabajo ni dejar cambios ajenos en la rama.
2. **Implementar:** trabajar en una rama identificada con la fase; mantener el alcance acotado y actualizar la documentación técnica dentro de la PR.
3. **Verificar:** ejecutar las pruebas disponibles y registrar comandos, resultados, limitaciones y pruebas no ejecutadas.
4. **Publicar para revisión:** abrir una PR hacia la base correcta y obtener una preview identificada por URL y SHA exacto. No considerar READY como validación visual. Comprobar que la persona revisora puede acceder; declarar cualquier protección de Vercel.
5. **Revisión humana:** Juanma recorre la preview, especialmente los flujos acordados en móvil y escritorio, y comunica aprobación o cambios solicitados. No fusionar antes de su aprobación explícita.
6. **Resolver la PR:** tras la aprobación, fusionar la PR; no dejar la fase aprobada en una rama sin integrar. Si no se aprueba, corregir en la misma PR y repetir las comprobaciones y la revisión afectadas.
7. **Cerrar documentación:** después del merge, actualizar el roadmap vigente y el registro de fase con PR, SHA fusionado, preview revisada, pruebas, decisiones pendientes, incidencias aceptadas y estado final. Marcar la fase como cerrada solo cuando código y documentación estén en la base integrada.
8. **Limpiar y continuar:** eliminar la rama de trabajo ya fusionada cuando GitHub lo permita; identificar deployments anteriores como históricos/sustituidos y mantener un único enlace señalado como preview vigente. Iniciar la fase siguiente desde la base integrada y documentada.

## Datos mínimos por entrega

Cada PR de fase debe dejar visibles:

- Fase y alcance de producto.
- Rama base, rama de trabajo y SHA revisado.
- Enlaces a PR y preview; estado de Vercel y restricciones de acceso.
- Pruebas ejecutadas y resultados exactos.
- Revisión visual requerida y evidencia disponible.
- Pendientes, decisiones todavía abiertas y responsable de resolverlas.
- Relación con la fase siguiente y condición que permite iniciarla.

## Reglas que evitan ramas y previews olvidadas

- No abrir ramas paralelas para fases dependientes salvo que la PR explique claramente la dependencia y su base.
- No iniciar una fase dependiente sobre master si sus requisitos están en una PR anterior todavía sin fusionar.
- No presentar un deployment de otra rama o SHA como la versión actual.
- Al publicar un deployment nuevo, registrar el enlace junto con su SHA y marcar el enlace anterior como histórico.
- No fusionar ni desplegar a producción por el mero hecho de que CI o Vercel estén en verde; hace falta revisión humana y aprobación explícita.
- Si el trabajo queda bloqueado, conservarlo en una PR o rama claramente identificada y registrar el siguiente paso concreto; no crear una segunda rama que duplique el mismo trabajo.

## Cierre de F1a y F1b (30-09-2026)

- F1a canónica: PR #4 fusionada en `de195e35f531cccc5711d11f3b7fa82657d100c1`.
- Base local/mobile-first (proyectos locales, español/marca, fallback WebGL): PR #5 fusionada con merge commit `67e7498a478b77215cdf9920644f9f85b804b94c`.
- F1b (imagen, calibración, trazado): PR #6 fusionada con merge commit `7b5b083daaff91f7aac1b1ac4a77ecdb1c5968f9`.
- Cabeza de código F1b revisada: `d02d48979f5c0fd1be828aeddfa744f9b7721edd`.
- Preview de revisión de F1b: [deployment Vercel](https://floorplan-3d-6cgnmgojz-juanma-espinosas-projects.vercel.app/), ligado al SHA anterior. El enlace compartible temporal se generó para la revisión y caduca el 01-10-2026; no usarlo como enlace permanente.
- El usuario autorizó el merge de ambas PR. La revisión de interfaz mostró que «Archivo > Importar plano» filtra JSON y oculta PNG; el PNG se carga hoy mediante «Plano propio > Nuevo desde imagen». Se registra como mejora de UX para el siguiente trabajo.
- La revisión de cinco planos reales (incluyendo escaneo y foto) sigue pendiente y no se presenta como aprobada. Se conserva en `docs/qa/F1b-five-plans.md`.
- Codex reportó 77 pruebas Node y 7 Python aprobadas en su checkout. No se repitió la suite completa en esta sesión sobre el HEAD remoto final; los checks remotos disponibles fueron Vercel. 3D: Chromium/SwiftShader, sin acreditar rendimiento en GPU/móvil físico.
- Tras fusionar a `master`, Vercel generó automáticamente un deployment de producción `READY` desde el commit F1b. No se ejecutó un despliegue manual. El flujo de próximos cambios debe seguir la PR y revisión documentadas arriba.

La fuente canónica de numeración y estados es [docs/ROADMAP.md](ROADMAP.md), reconciliada con el plan F0. La PR #2 mantiene una propuesta histórica de otra numeración; revisar su diff y sustituir el documento antes de fusionarla. La PR #3 conserva decisiones/auditoría históricas y debe reconciliar sus contratos contra master. No se inicia F2 hasta medir cinco planos autorizados y acordar umbrales. Esta corrección UX/WebP es seguimiento de F1b ya integrada, no una nueva fase.

## Preparación de entrada F2 e higiene de ramas (30-09-2026)

Base consultada: `master` @ `d64466599e4ee5267471e1c136acc044062f0fa0`;
contiene el merge #7 `c28a170`. Checkout inicial limpio en la rama ya publicada
`fix/local-image-import-formats` @ `cbadb7d`. Preparación nueva en
`docs/f2-entry-evaluation`, sin rebase/reset/force push y sin iniciar asistencia.
El commit local previo `5fb6357` permanece protegido en la rama local F1b.

Documentación consultada: README, ROADMAP, este workflow, estado/uso F1b, matriz
de cinco planos y sección F2 del plan F0 de #3 @ `825ddf6`. No se importan sus
copias históricas del schema ni se consideran aprobadas sus decisiones abiertas.

| Elemento histórico | Comparación con master y tratamiento real |
| --- | --- |
| PR #1 / `feat/rubik-sota-spanish-brand` @ `540b825` | Sustituida por #5/#7: 129 de 130 traducciones antiguas ES_TEXT conservadas sin cambios; la restante, Import plan, reemplazada por etiqueta JSON. Las 91 entradas NAMES_ES, NAMES_EN, metadatos/marca y persistencia están conservadas. translateEs conserva lo previo y añade errores de guardado/importación. README vigente cubre el alcance anterior. Intento de cierre REST bloqueado por Forbidden; PR/rama siguen abiertas/preservadas. |
| PR #2 / `docs/immersphere-product-roadmap` @ `84ddf72` | Numeración/estados sustituidos por ROADMAP canónico. Conserva contenido único sobre visión, responsabilidades entre productos, VisualProposalV1 y detalle de horizontes CRM/Immersphere/analítica. Mantener PR/rama: reconciliar únicamente esas secciones en una PR documental, sin duplicar el contrato ni iniciar integraciones. |
| PR #3 / `docs/f0-product-contract-audit` @ `825ddf6` | F0-decisions (43 líneas), F0-product-audit (313), F1-F3-plan (87) y PR-preview-checklist (219) son contenido único ausente de master. Preservar PR/rama/SHAs. Migrar como evidencia histórica fechada y actualizar referencias/decisiones por revisión explícita; excluir contratos/ejemplos ya integrados y evitar la vuelta a schema PNG/JPEG anterior a 1.2.0. |
| Ramas remotas de PR #5/#6/#7 | Cabezas 966ab83/d02d489/cbadb7d comprobadas como ancestros de master, PRs fusionadas y sin cambios remotos nuevos. Eliminadas: feat/f1-local-projects-mobile, feat/f1b-image-calibration-tracing, fix/local-image-import-formats. Trabajo contenido en master; ramas locales conservadas. |
| Rama remota de PR #4 | 9e9bb93 no es ancestro por la integración de #4, pero su árbol coincide exactamente con de195e3 (diff vacío). PR fusionada y cabeza sin cambios. Eliminada feat/f1a-project-model; contenido en master y referencia local conservada. |

El cierre de #1 falló exactamente con:
`Patch "https://api.github.com/repos/Juanmaes83/floorplan-3d/pulls/1": Forbidden`.
No se eliminó su rama mientras la PR siga abierta, ni se insistió mediante GraphQL
o se cambió la red. #2/#3 no se cerraron porque contienen material único.
Las eliminaciones de ramas fusionadas se hicieron por Git normal, sin force push,
tras volver a comprobar sus SHAs remotos; no se eliminaron commits de master.

La [preparación reproducible](qa/F2-entry-protocol.md) mantiene la línea base de
cinco separada del conjunto fijo de veinte. Datos/consentimientos se mantienen
fuera de Git; la plantilla pública está vacía. F2 no comienza por publicar este
protocolo. Requiere línea base real y decisiones explícitas de umbrales; el conjunto
de evaluación requiere referencias/autorizaciones propias antes de evaluar.

Esta entrega no cambia interfaz: una preview nueva no es requisito de revisión
UI. La PR debe revisar documentos, cálculos y pruebas offline; no presentar la
preview histórica #7 como validación de la preparación o de asistencia inexistente.

Publicación inicial: la API REST bloqueó la creación de PR desde el entorno de Codex. Tras la aprobación de Juanma, se abrió la [PR #8](https://github.com/Juanmaes83/floorplan-3d/pull/8), que se fusionó; el cierre y SHA final constan en la sección siguiente. La preview Vercel generada por GitHub no se usó para QA visual porque esta preparación no cambia la interfaz.


## Cierre de preparación de entrada F2 — PR #8 (30-09-2026)

Juanma aprobó la entrega. Como Codex no pudo crear la PR por REST, se creó desde la integración de GitHub: [PR #8](https://github.com/Juanmaes83/floorplan-3d/pull/8), rama `docs/f2-entry-evaluation`, HEAD revisado `db5f363e731e56485f7284cdabead7ca88ec9213`. Se fusionó con merge commit `387a9bfd57630bced0d9fc1f858d9a0f3c181229` sobre `master`.

El [roadmap canónico](ROADMAP.md) quedó actualizado después del merge. PR #8 fue solo preparación de entrada: protocolo, plantilla vacía y recorder offline; no modifica interfaz y no implementa asistencia. Codex reportó 12/12 pruebas del recorder; no se repitieron en esta sesión. No requiere preview visual. F2 continúa **no iniciada** y mantiene como pendientes la línea base autorizada de cinco sesiones, conjunto de veinte planos con referencias y aprobación humana de umbrales.

La rama se conservó tras la fusión; su limpieza remota queda pendiente de la acción de GitHub si no se eliminó automáticamente. La PR #8 produjo un deployment Vercel READY, pero al no cambiar la interfaz no se usó como revisión visual ni como evidencia de QA 3D.


## Autorización de prototipo F2 (30-09-2026; estado de esta rama)

Juanma autoriza excepcionalmente implementar y revisar sugerencias locales de
muros antes de las cinco sesiones, veinte planos y umbrales finales. No autoriza
validar/completar F2 ni elimina las puertas del roadmap. Una sola rama
`feat/f2-local-wall-assist`, base remota verificada
`dbd29987308e7cca1455fdbf3cf7f3813feda1d6`, checkout inicial limpio en
`docs/f2-entry-evaluation` @ `db5f363`. Se conservan todas las ramas previas.
PR hacia master y revisión/aprobación humana obligatoria; sin merge en esta tarea.
El estado en master solo se actualizará tras merge aprobado.
Resultados, capturas y publicación: [informe experimental](technical/F2-wall-assist.md).


## Cierre del prototipo experimental F2 — PR #9 (30-09-2026)

Juanma aprobó la revisión y la [PR #9](https://github.com/Juanmaes83/floorplan-3d/pull/9) se fusionó a `master` con merge commit `10f7439b3fc86b0a0bd325d94531709d45cbcad4`. El HEAD revisado fue `3e3e6117770d97cb6e82f73fa06613d31a506019).

La preview de Vercel quedó `READY` y el deployment API confirmó ese mismo SHA y la rama `feat/f2-local-wall-assist`: [preview](https://floorplan-3d-git-feat-f2-local-82705b-juanma-espinosas-projects.vercel.app/) · [inspector](https://vercel.com/juanma-espinosas-projects/floorplan-3d/DCTag9Sc5JH4j3sce8sA6LLZN9Wn). Vercel Authentication protege la preview. Para la revisión se generó un enlace temporal de acceso; caduca y no debe tratarse como URL pública permanente. Juanma aprobó la PR después de la revisión.

Verificación reportada: la suite completa dio 98/98 antes del último ajuste localizado; la repetición dirigida final F2 fue 13/13, además de 10/10 schema y 12/12 recorder. La suite completa no se repitió tras ese ajuste. 3D se probó con SwiftShader; no acredita rendimiento en GPU/teléfono físico ni precisión con planos reales. No hubo despliegue manual a producción. La rama remota `feat/f2-local-wall-assist` sigue existiendo tras el merge; el conector de GitHub disponible en esta sesión no expone una operación para borrar refs. La rama es prescindible porque su contenido está integrado: queda pendiente eliminarla desde el botón **Delete branch** de la PR #9.

El estado de F2 es **prototipo experimental integrado, no validado**. La siguiente etapa es la evaluación, no añadir más automatización: reunir en privado las cinco sesiones manuales autorizadas y un conjunto fijo separado de al menos veinte planos autorizados con geometría/cotas de referencia; congelar la versión y acordar umbrales antes de afirmar precisión, mejora temporal o cobertura. Las imágenes, cotas, permisos y correspondencias privadas no se suben a GitHub ni a Vercel.


## PR #10 — evaluador offline F2 (30-09-2026)

La [PR #10](https://github.com/Juanmaes83/floorplan-3d/pull/10) se fusionó en `master` mediante merge commit `c8a62de89f3fa3c5cd4e6de75ec514f56929a6e7`. La rama añadió el comparador offline de geometría por longitud, el fixture sintético y pruebas/documentación; no alteró el detector ni la interfaz.

Juanma aprobó el método métrico: este comparador de ejes horizontales/verticales no da crédito a diagonales y conserva su longitud en los denominadores globales; informa aparte exhaustividad en ejes soportados. La suite dirigida del evaluador se ejecutó tras actualizar el estado: **16/16**; la CLI sintética devuelve `rules_status: metric_method_approved_thresholds_pending` y `f2_validated: false`. Readiness 12/12, schema 10/10 y regresiones Node 67/67 fueron reportadas en la rama antes de los cambios de aprobación, que no tocaron esas áreas.

Vercel confirmó `READY` para el SHA de rama `35502fa412e282bb5a83c78aabe5c35d534ff88e`; [preview de revisión](https://floorplan-3d-git-feat-f2-evalu-2df055-juanma-espinosas-projects.vercel.app/) · [deployment inspector](https://vercel.com/juanma-espinosas-projects/floorplan-3d/3scPzg7rEe9JvRz9mDkJUWjVDhXQ). No hay cambios visuales, así que no hace falta revisión humana de interfaz. La evaluación con cinco sesiones y veinte planos autorizados queda para validar precisión/tiempo más adelante; no bloquea continuar la implementación F2 con pruebas sintéticas. F2 sigue siendo experimental y **no validada**. La rama no se eliminó: no había herramienta de borrado de refs disponible en esta sesión; puede eliminarse con **Delete branch** en la PR una vez confirmado el merge.


## Entrega de exportación cruda F2 — en revisión (esta rama)

Base remota master verificada `65518be43c1ff6680f53af5b6c3cf4a9f2257635`.
Checkout inicial limpio en la rama del evaluador; nueva y única rama
`feat/f2-local-raw-export`, trabajo anterior conservado. Exportación explícita,
privada y transitoria; sin modificar detector ni FloorPlanProjectV1. Requiere
PR hacia master, preview del HEAD final y aprobación de Juanma; no se fusiona
en esta tarea. [Informe, auditoría de coordenadas, tests y evidencia](technical/F2-raw-export.md).
Cinco sesiones y veinte planos reales no bloquean el desarrollo autorizado;
siguen pendientes para validar empíricamente F2 y fijar umbrales.


## Cierre de exportación cruda F2 — PR #11 (30-09-2026)

Juanma aprobó y se fusionó la [PR #11](https://github.com/Juanmaes83/floorplan-3d/pull/11)
en `master`. HEAD revisado: `86479409567efb5df180c4d161ec9232059fa210`;
merge commit: `49ea432f7d8eba75042e00762c902a7d3830040d`. La rama publicada fue
`feat/f2-local-raw-export`. Se integró exportación voluntaria y local de
sugerencias crudas, con conversor al evaluador; no incorpora datos privados,
no hace upload y no altera FloorPlanProjectV1 ni el detector.

Vercel API informó deployment `READY` para el HEAD revisado. La
[preview](https://floorplan-3d-git-feat-f2-local-0acbc2-juanma-espinosas-projects.vercel.app/)
requiere autenticación Vercel; por ello no se registra como enlace público ni se
afirma revisión visual humana completada. No hubo despliegue manual a producción.

Codex reportó: Node/navegador 110/110, schema 10/10, readiness 12/12, evaluador
16/16, exportación 3/3; sintaxis y diff correctos. No se repitieron las suites
durante este cierre documental. SwiftShader no acredita rendimiento de GPU ni
teléfono físico. Los resultados y límites quedan en
[el informe técnico](technical/F2-raw-export.md).

Estado tras el merge: F2 continúa **experimental, no validada empíricamente**.
Las cinco sesiones y veinte planos con referencias, junto con los umbrales y
mediciones reales, son puertas de validación; no bloquean seguir implementando
F2 bajo pruebas sintéticas con sus limitaciones declaradas. Roadmap actualizado
en [docs/ROADMAP.md](ROADMAP.md).


## Cierre F3 inicial — PR #12 (30-09-2026)

Juanma aprobó la preview y la [PR #12](https://github.com/Juanmaes83/floorplan-3d/pull/12) se fusionó en `master`. Rama: `feat/f3-authorized-assets`; HEAD revisado: `b3c72d0c6fae1290c9a7b4e449aa388c3f878531`; base: `fdd3d803d537871ce9b2e37b2f87578dd5ae7f1f`; merge commit: `95fcf0da989a9e3bf85f8747c19fc4a9a13426ab`.

Vercel confirmó `READY` para el SHA revisado. [Preview protegida](https://floorplan-3d-git-feat-f3-autho-dce6ec-juanma-espinosas-projects.vercel.app/) · [deployment](https://vercel.com/juanma-espinosas-projects/floorplan-3d/F8NcvTSZF37VdrUBi2c7Kqx9W8uw). Juanma realizó la revisión visual. No se hizo despliegue manual a producción.

F3 queda como **entrega inicial integrada; catálogo externo pendiente**. Juanma confirma autorización para usar los assets del proyecto Asset Lab. El informe de inventario F3 registra una auditoría de solo lectura de un commit anterior; volver a comprobar disponibilidad, dimensiones, requisitos técnicos y permisos aplicables por candidato antes de su incorporación. El alcance de PR #12 sigue siendo un fixture sintético propio, genéricos dimensionados, asociación/carga local y fallback.

Codex reportó 120/120 pruebas Node/navegador, 10/10 dirigidas F3 y 41/41 Python; la revisión de merge no repitió esas suites. SwiftShader es renderizado por software y no acredita rendimiento físico. Los siguientes pasos de F3 son auditar el Asset Lab actual y seleccionar modelos con dimensiones verificables, sin cargar assets de terceros desde la app ni cambiar Asset Lab. Las cinco sesiones y los veinte planos F2 siguen pendientes para validación empírica y no bloquean F3.


## Cierre de F3 piloto texturizado — PR #17 (01-10-2026)

Juanma aprobó la revisión visual de la corrección de catálogo y autorizó el merge. La PR #17 se fusionó por squash desde `feat/f3-textured-external-catalog`: HEAD revisado `772e24c26d10cec4349f28558ffc87ee18748317`, merge en `master` `24534b5544ffa37840bf4fe77c4ad12afda0c38b`. Vercel confirmó deployment `READY` vinculado al mismo SHA en https://floorplan-3d-rgf0u4thu-juanma-espinosas-projects.vercel.app/ (protegido por Vercel Authentication). No hubo despliegue manual a producción.

La revisión detectó y resolvió que los fetch de manifests/permisos/GLB omitían la sesión. El comportamiento se corrigió con credenciales same-origin y diagnósticos concretos, preservando controles y fallback F3. La aprobación humana cierra el piloto de dos modelos y buscador. Las suites reportadas en la PR no se repitieron durante la actualización documental; véase [el informe](technical/F3-preview-catalog-fix.md).

F3 queda cerrada para el alcance de este piloto inicial; no se considera implementado un catálogo comercial amplio, una biblioteca general de materiales ni un pipeline universal de conversión. La siguiente candidata es la edición dimensional/nuevo proyecto del Roadmap 2, sin número de fase asignado hasta aprobar alcance y reglas geométricas. Las cinco sesiones y veinte planos pendientes de F2 no bloquean esa implementación.


## Cierre de entrega post-F3 — PR #18 (01-10-2026)

Juanma aprobó visualmente la entrega de proyectos vacíos/desde imagen y edición directa de dimensiones. La [PR #18](https://github.com/Juanmaes83/floorplan-3d/pull/18), desde `feat/home-room-dimensions`, se fusionó por squash en `master`. HEAD revisado: `c7d1b81e1f6456a9485c88f88723a6fd0fd7fe66`; commit integrado: `10e9f96b417f866d45088fede039786180ddce95`.

Vercel verificó `READY` para el SHA revisado en la preview protegida [post-F3](https://floorplan-3d-git-feat-home-roo-573ef9-juanma-espinosas-projects.vercel.app/), deployment `dpl_4NS1VpLdy1ABhYsksQ3vXFcNfk93`. Juanma abrió y aprobó la revisión temporal; el enlace compartible expiraba y no se registra como URL permanente. No hubo despliegue manual a producción.

Verificación reportada: Node agregado inicial 159/160; corregida la expectativa histórica, la prueba afectada pasó 1/1 y la repetición dirigida final dio 25/25. La suite completa no se repitió después del cambio de test. Python 41/41; sintaxis y diff correctos. Chromium usó SwiftShader; no acredita rendimiento de GPU ni móvil físico. No hay CI de tests del producto configurada. La limitación está explicada en [el informe de entrega](technical/home-room-dimensions.md).

La entrega no tiene número de fase nuevo hasta reconciliar la PR #15 de Roadmap 2 con el master actual. La próxima tarea documental es cerrar/reconciliar la F0 histórica en la PR #3 existente, sin crear una rama duplicada y sin reintroducir su schema antiguo. F2 sigue experimental y no validada; las cinco sesiones y veinte planos siguen pendientes pero no bloquean estas implementaciones.
