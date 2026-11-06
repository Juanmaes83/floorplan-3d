# RUBIK SOTA — Registro de integración E2: Section → Spatial Visit V1

Fecha: 2026-11-06
Estado: **INTEGRADO EN STAGING / SIN PROMOCIÓN A MASTER**
Alcance aprobado: primera integración controlada de Section; no autoriza producción ni otras ramas.

## Referencias congeladas

- Repositorio: `Juanmaes83/floorplan-3d`
- `master` previo y aún vigente: `0f9c6ead9732901681498efec326d1ca92e42ffe`.
- PR original Section: #168 (`feat/section-spatial-visit-v1`) @ `49c37f5e46b1fdde346401b3ea914f1cc8708daf`. Sigue sin fusionarse a `master`.
- Rama de staging: `integration/rubik-e2-section-2026-11-06`, creada desde el `master` indicado.
- PR de staging: #171, `feat/section-spatial-visit-v1` → `integration/rubik-e2-section-2026-11-06`, fusionada mediante merge commit.
- Commit de integración de staging: `62e0d342ab354cfd37446675a947d8f1eb7b0208`.
- La comparación Section → commit de staging indica **0 archivos de diferencia** (merge commit adicional solamente). Conserva el mismo contenido funcional.
- Preview automática Vercel: `https://floorplan-3d-fd1f4f8ys-juanma-espinosas-projects.vercel.app` (READY, `target=null`, no producción).

## Qué incorpora Section

- La experiencia `Section → visita espacial` opt-in, desde el corte real a la ruta interior validada y traspaso a Recorrer.
- Controles de Story (pausa, progreso, reversa, modo movimiento reducido), fallback honesto y minimapa de ruta.
- Documentación original, pruebas y evidencias de PR #168 sin reimplementarlas.

## Evidencia disponible

- SHA original Section: **10/10 checks GitHub** con conclusión `success`.
- Merge de staging: aplicado sin conflictos; PR #171 cerrado y marcado merged.
- Comprobación inmediata del commit staging: Vercel Preview Comments `success`; **no había workflows de GitHub Actions sobre el merge commit** en la primera consulta.
- Preview Vercel de staging: READY, `target=null`.
- `master` se mantiene `0f9c6ead`; despliegue de producción sigue basado en dicho SHA al momento de la verificación.

## Puertas pendientes antes de master

1. Forzar o activar validación de CI sobre la rama de staging mediante PR de revisión en borrador, sin merge, y comprobar todos los checks sobre el SHA final.
2. Revisar Section en esa Preview: abrir historia, corte, descenso, visita, traspaso a Recorrer y vuelta al editor.
3. Probar restauración de cámara/materiales, reversa, fallback, movimiento reducido y presentación habitual OFF; registrar limitaciones de QA físico móvil y GPU.
4. Confirmar configuración efectiva de protección de `master` (GitHub declara `protected:false`) y automatismo de despliegue a producción de Vercel.
5. Proponer la promoción final a `master` como autorización humana **distinta**, con SHA esperado, verificación posmerge y rollback.
6. Integrar Hybrid V2 posteriormente sobre la nueva base, sin mezclarlo con la promoción de Section.

## Reversión

Mientras solo esté en staging, revertir significa descartar o dejar de usar la rama de staging: `master` y producción no necesitan reversión. No borrar ramas originales ni usar force-push. Si se autorizase luego `master`, preparar un revert del merge exacto, más rollback de producción en Vercel si fuese necesario.

## Documento vivo

Este archivo describe únicamente la primera integración. Cada promoción, cambio de SHA o integración posterior debe generar una entrada documental con resultados verificados, sin atribuir un check a un commit distinto.
