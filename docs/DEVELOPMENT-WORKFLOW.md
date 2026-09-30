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

## Aplicación a F1a y F1b

La PR #5, feat/f1-local-projects-mobile, es la entrega de base F1a que se está revisando. La preview comunicada para ese SHA es:

- PR: https://github.com/Juanmaes83/floorplan-3d/pull/5
- Rama: feat/f1-local-projects-mobile
- SHA de preview: a4b5a9dbb1af6349170c802dea6b931a45cfbed4
- Preview: https://floorplan-3d-6ii3r2tdm-juanma-espinosas-projects.vercel.app/

La descripción de la PR debe mantenerse sincronizada con la existencia y accesibilidad de esta preview. F1b depende de F1a integrada: no se inicia sobre una base incompleta ni se declara F1a cerrada hasta la revisión, aprobación, merge y actualización del roadmap.
