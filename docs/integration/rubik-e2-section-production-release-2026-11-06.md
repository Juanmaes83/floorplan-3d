# RUBIK SOTA — E2 · Publicación de Section → visita espacial

**Fecha:** 2026-11-06  
**Estado:** SECCIÓN INTEGRADA EN `master` Y DESPLEGADA EN PRODUCCIÓN; QA visual del ciclo original y corrección del traspaso aceptados por el propietario.

## Operación autorizada

El propietario autorizó expresamente la fusión de `integration/rubik-e2-section-2026-11-06@d0e2b777a65cd9cdbcd4e64a4c7d90aa2f28a5aa` mediante la PR #172, incluyendo el despliegue automático de producción, sin integrar Hybrid V2.

- `master` anterior: `0f9c6ead9732901681498efec326d1ca92e42ffe`.
- PR original Section: #168 (se preserva como fuente de la implementación).
- PR de staging Section: #171, fusionada **solo** a staging.
- PR de promoción: #172, **MERGED**, mediante merge commit.
- Commit definitivo de producto en `master`: `d0d8c6ea79cf824ea7f6c07616c2a69b0d378209`.
- Commit validado de Section corregida: `d0e2b777a65cd9cdbcd4e64a4c7d90aa2f28a5aa`.
- Comparación `d0e2b777...master@d0d8c6ea`: **0 archivos de diferencia**; el commit adicional es exclusivamente la unión de las historias.
- Rama de corrección: `fix/section-visit-handover-2026-11-06`; PR #173 fue solo evidencia/CI, no se fusionó.
- **Hybrid V2 (#170), Hybrid V1 y otros desarrollos pendientes NO se han integrado en esta promoción.**

## Funcionalidad incorporada

Section → Spatial Visit V1: plano → sección dinámica del mismo modelo → ruta espacial validada al interior → permanencia a la altura de los ojos → «Explorar desde aquí» desde la pose de llegada y «Volver a la sección»; restauración, reversa, pausa, movimiento reducido y salida explícita.

La corrección del cierre automático fue acotada: 8 líneas en `js/presentation-ui.js`, con pruebas que reproducen el fallo en el staging antiguo y pasan tras corregirlo.

## Evidencia y calidad

- CI del SHA **exacto** `d0e2b777` antes de la promoción: **10/10 checks SUCCESS**, incluidos `presentation-story`, `project-first` y `templates-and-evidence`.
- Suite específica de traspaso: 3/3, con llegada, cámara sin salto después de 3 s, pase a Recorrer, vuelta, pausa/reanudación y reduced motion.
- Suite propia de Section: 6/6; suite unitaria: 756/758 con 2 omitidos (según auditoría de QA).
- La rama de staging inició una ejecución adicional de Actions del mismo SHA; se registró su progreso sin sustituir por ello la evidencia 10/10 ya obtenida.
- Evidencia antes/después: `docs/qa/section-spatial-visit-v1/handover-fix-2026-11-06.md` y `docs/qa/section-spatial-visit-v1/evidence/handover-fix/`.
- Los archivos del conjunto y documentación del staging siguen en `docs/integration/rubik-e2-section-staging-2026-11-06.md` (registro histórico anterior a la promoción).

## Comprobación de producción

- Despliegue automático Vercel de `master@d0d8c6ea79cf824ea7f6c07616c2a69b0d378209`: **READY**, `target=production`.
- Despliegue: `dpl_6pLcNKFYYi4GxwBukRN1rdms4m18`, URL `https://floorplan-3d-mf15tthb7-juanma-espinosas-projects.vercel.app`.
- Dominio de producción `https://floorplan-3d-alpha.vercel.app`: comprobado mediante la API de alias de Vercel, apuntando a dicho despliegue.
- Logs de compilación: **Deployment completed**, sin entradas `error`.
- Observabilidad reciente: sin errores de runtime reportados en la ventana de 30 minutos comprobada; ausencia de logs no equivale a un test de navegador o a tráfico real suficiente.

Este documento se incorpora **después del merge** en un commit exclusivamente documental de `master`. Esa modificación puede generar otro despliegue automático: verificar su SHA/alias antes de considerar definitiva la punta de producción.

## Limitaciones y deuda diferida

- Queda pendiente QA físico real en GPU, teléfono y tableta; las pruebas registradas se ejecutaron en Chromium/SwiftShader.
- Auditoría visual completa UI/UX diferida por decisión del propietario: jerarquía de todos los botones y de «Presentar mi vivienda», accesibilidad, experiencia de profesional/cliente y propuesta de valor.
- La tarjeta aún puede titularse «Vista general» durante el recorrido; era comportamiento anterior, fuera de alcance de la corrección.
- Las geometrías de Section pueden conservarse hasta la escena siguiente; no se observó crecimiento acumulativo en las pruebas.
- `master` no dispone de protección efectiva confirmada; debe revisarse antes de la siguiente promoción.

## Reversión y siguientes pasos

La referencia de reversión previa es `master@0f9c6ead9732901681498efec326d1ca92e42ffe`, despliegue Vercel `dpl_683hG9pCKz7Ue62Vos3C3u73oVtA`. En caso de regresión, revertir de manera explícita la fusión concreta y/o restaurar el despliegue anterior, verificando de nuevo dominio y estado; evitar force-push.

La próxima integración será Hybrid V2 (#170), **solo tras autorización y preparación independientes**, partiendo del nuevo `master` y reconciliando sus cambios con Section. No se ha ejecutado en esta operación.
