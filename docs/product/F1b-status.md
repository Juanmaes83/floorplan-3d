# Estado de F1b

**Estado: integrada en master por la PR #6.**

- PR: [#6](https://github.com/Juanmaes83/floorplan-3d/pull/6), fusionada el 30-09-2026.
- Merge commit: `7b5b083daaff91f7aac1b1ac4a77ecdb1c5968f9`.
- HEAD de código revisado: `d02d48979f5c0fd1be828aeddfa744f9b7721edd`.
- Base F1a extendida de proyectos locales/mobile-first: PR [#5](https://github.com/Juanmaes83/floorplan-3d/pull/5), merge commit `67e7498a478b77215cdf9920644f9f85b804b94c`.
- Preview revisada: [deployment Vercel ligado al HEAD F1b](https://floorplan-3-6cgnmgojz-juanma-espinosas-projects.vercel.app/). El acceso compartible temporal caduca el 01-10-2026; el deployment directo puede requerir sesión Vercel.
- Vercel produjo automáticamente un deployment `READY` de producción al actualizarse `master`; no se lanzó manualmente.

## Alcance integrado

Importación local PNG/JPEG, colocación y opacidad, calibración y verificación con segunda cota, trazado/edición manual de muros, huecos y estancias, avisos W1–W4, mobiliario genérico, vistas 2D/3D, almacenamiento local y ZIP portable. El plano importado se carga desde «Plano propio» → «Nuevo desde imagen». «Archivo» → «Importar plano» espera un proyecto JSON, no una imagen.

## Verificación y límites

Codex informó 77 pruebas Node y 7 Python aprobadas en su checkout. No repetimos la suite completa sobre la revisión remota final. Los checks remotos observados fueron despliegues Vercel, no una CI de pruebas. La escena 3D se comprobó con Chromium/SwiftShader; no se midió rendimiento en móvil físico.

La imagen de referencia puede ser PNG/JPG de hasta 15 MiB y 8000 px por lado. El PNG adjuntado para la revisión (1448×1086, ~718 KB) está dentro de los límites. No se comprobó aún su carga satisfactoria por la ruta «Plano propio».

## Pendientes aceptados para continuidad

1. Mejorar la claridad del menú: «Importar plano» → «Importar proyecto JSON» y acceso «Cargar imagen de plano (PNG/JPG)» desde Archivo, reutilizando el flujo existente.
2. Evaluar cinco planos autorizados —incluyendo escaneo y foto móvil— y registrar error de segunda cota, tiempo, correcciones e incidencias en [F1b-five-plans.md](../qa/F1b-five-plans.md).
3. Probar rendimiento en un teléfono físico.
4. Evaluar formatos adicionales (PDF, WebP y HEIC/HEIF) mediante una entrega acotada posterior. No están admitidos por el importador actual ni quedan aprobados sin pruebas de compatibilidad, privacidad y límites.

F1b queda cerrada por aprobación expresa y merge de Juanma con estas limitaciones visibles; no se afirma que las pruebas pendientes se hayan realizado ni que exista precisión profesional.

## Seguimiento de importación (esta rama, aún sin fusionar)

La mejora de claridad y WebP estático está implementada para revisión: «Archivo →
Importar proyecto JSON» y «Cargar imagen de plano (PNG/JPG/WebP)», reutilizando el
flujo existente. WebP conserva bytes, calibración, IndexedDB y ZIP; 15 MiB/8000 px
no cambian. [Decisión de formatos](../technical/image-formats.md). PDF, HEIC/HEIF,
WebP animado y con EXIF siguen no admitidos. Los puntos 1 y 4 del listado anterior
describen lo pendiente en master al inicio; esta entrega resuelve el punto 1 y la
ampliación WebP del punto 4, sin reclamar que ya estén fusionados.

[Roadmap canónico](../ROADMAP.md): F1a/F1b integradas, F2 asistencia **no iniciada**,
F3 catálogo condicionado. Siguen pendientes cinco planos autorizados, revisión
humana de esta corrección y teléfono físico. No se repite la implementación F1b.
