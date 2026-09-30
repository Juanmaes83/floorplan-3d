# Estado de F1b

**Estado: integrada en master por la PR #6.**

- PR: [#6](https://github.com/Juanmaes83/floorplan-3d/pull/6), fusionada el 30-09-2026.
- Merge commit: `7b5b083daaff91f7aac1b1ac4a77ecdb1c5968f9`.
- HEAD de código revisado: `d02d48979f5c0fd1be828aeddfa744f9b7721edd`.
- Base F1a extendida de proyectos locales/mobile-first: PR [#5](https://github.com/Juanmaes83/floorplan-3d/pull/5), merge commit `67e7498a478b77215cdf9920644f9f85b804b94c`.
- Preview revisada: [deployment Vercel ligado al HEAD F1b](https://floorplan-3-6cgnmgojz-juanma-espinosas-projects.vercel.app/). El acceso compartible temporal caduca el 01-10-2026; el deployment directo puede requerir sesión Vercel.
- Vercel produjo automáticamente un deployment `READY` de producción al actualizarse `master`; no se lanzó manualmente.

## Alcance histórico al integrar PR #6

Importación local PNG/JPEG, colocación y opacidad, calibración y verificación con segunda cota, trazado/edición manual de muros, huecos y estancias, avisos W1–W4, mobiliario genérico, vistas 2D/3D, almacenamiento local y ZIP portable. El plano importado se carga desde «Plano propio» → «Nuevo desde imagen». «Archivo» → «Importar plano» espera un proyecto JSON, no una imagen.

## Evidencia histórica de PR #6

Codex informó 77 pruebas Node y 7 Python aprobadas en su checkout. No repetimos la suite completa sobre la revisión remota final. Los checks remotos observados fueron despliegues Vercel, no una CI de pruebas. La escena 3D se comprobó con Chromium/SwiftShader; no se midió rendimiento en móvil físico.

La imagen de referencia puede ser PNG/JPG de hasta 15 MiB y 8000 px por lado. El PNG adjuntado para la revisión (1448×1086, ~718 KB) está dentro de los límites. No se comprobó aún su carga satisfactoria por la ruta «Plano propio».

## Estado del seguimiento de importación

La mejora de claridad y el soporte de WebP estático quedaron integrados mediante
la [PR #7](https://github.com/Juanmaes83/floorplan-3d/pull/7), merge commit
`c28a1701186d885522b4c80f0ab78ae72bb8768d`. El commit de corrección documental
y schema fue `cbadb7d9a980eb688d9c7aaa1c768cc31e95bc6e`; la funcionalidad se
implementó en `fa278a920525fce654ea3c5d8539c0986601edc5`.

La preview Vercel READY ligada al SHA revisado fue
[esta deployment](https://floorplan-3d-7n9xg3hqg-juanma-espinosas-projects.vercel.app/).
Juanma aprobó la PR. Vercel creó automáticamente la deployment de producción
tras el merge; no hubo despliegue manual.

«Archivo» separa ahora «Importar proyecto JSON» de «Cargar imagen de plano».
PNG/JPEG siguen admitidos y WebP estático completa decodificación, calibración,
persistencia y ZIP conservando bytes. PDF, HEIC/HEIF, WebP animado y WebP con
EXIF siguen sin admitirse. Ver [decisión técnica](../technical/image-formats.md).

## Verificación y límites

Codex reportó para el SHA funcional `fa278a9`: 86/86 pruebas Node, 9/9 Python,
verificaciones sintácticas y `git diff --check` correctos. Para el commit de
documentación/schema `cbadb7d`: 59/59 pruebas Node de project/library/tracing,
10/10 pruebas Python de schema, `node --check js/project-schema.js` y
`git diff --check` correctos. No se repitió la suite de navegador tras ese
último commit, que cambió descripciones/documentación del schema y su prueba.

Juanma confirmó que la aplicación funciona en su teléfono. No se registró el
modelo ni se midió rendimiento físico. Las pruebas de 3D automatizadas usan
Chromium/SwiftShader y no acreditan rendimiento en un dispositivo.

## Pendientes para continuar

1. Evaluar cinco planos reales autorizados —incluidos un escaneo y una foto
   móvil— y registrar error de segunda cota, tiempo, correcciones e incidencias
   en [F1b-five-plans.md](../qa/F1b-five-plans.md).
2. Medir rendimiento en teléfono físico; la comprobación funcional de Juanma no
   constituye una medición de rendimiento.
3. Fijar umbrales de precisión/tiempo antes de iniciar la asistencia F2.
4. PDF y HEIC/HEIF permanecen diferidos, según la decisión técnica vinculada.

## Preparación antes de asistencia F2

Estado verificado sobre master d644665: PR #7 fusionada. El chequeo funcional
de Juanma en teléfono sigue siendo una confirmación manual; no hay medidas de
rendimiento físico. En el checkout solo hay fixtures sintéticos, sin cinco planos
reales autorizados ni un conjunto fijo de veinte con referencias. No hay métricas
de línea base ni prototipo asistido evaluado.

Se prepara el [protocolo y recorder offline](../qa/F2-entry-protocol.md), con
criterios relativos propuestos para decisión humana, sin números inventados ni
umbrales aprobados. F2 permanece no iniciada; cinco sesiones y veinte planos
de evaluación se registran y contabilizan por separado.
