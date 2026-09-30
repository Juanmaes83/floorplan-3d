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

Publicación de preparación: rama remota `docs/f2-entry-evaluation`, commit de
protocolo/recorder `dc989ea046a977fc7c2d5619f7f3b802b1db9349`, publicado con
`git push -u origin HEAD`, sin force push. Crear la PR hacia master quedó bloqueado:
`Post "https://api.github.com/repos/Juanmaes83/floorplan-3d/pulls": Forbidden`.
No existe una PR creada por Codex para esta preparación. La rama está conservada:
[abrir revisión hacia master](https://github.com/Juanmaes83/floorplan-3d/compare/master...docs/f2-entry-evaluation?expand=1).
No se insistió por GraphQL ni se modificó red/autenticación. Registrar el número
real al abrirla desde GitHub; no fusionar ni presentar F2 como iniciada. No se
requiere preview UI nueva, porque esta entrega no cambia la interfaz.
