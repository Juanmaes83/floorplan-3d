# RUBIK SOTA E2 · Hybrid V2 «Dibujo vivo» — integración de staging

Fecha: 2026-11-06. **STAGING, QA PENDIENTE. NO FUSIONAR A MASTER NI DESPLEGAR EN PRODUCCIÓN.**

Base: `master@840189407cb63a996a71e47f14ad8931a3dcfb4a` (Section corregida y ya publicada). Fuente: `feat/hybrid-v2-living-drawing@747f8e7da98247ce86903ed85b467d50e7af6d03` (PR #170). Esta rama aislada fusiona ambas genealogías, sin utilizar un master antiguo.

Se incorporan 30 archivos nuevos de Hybrid V2 por su SHA original y se reconcilian cuatro archivos compartidos: `index.html`, `js/presentation-story-core.js`, `js/presentation-ui.js` y `tests/presentation-story.test.cjs`. 10 solapamientos resueltos conservando las funciones de ambas ramas, incluido `room-visit` y `endsInVisit` de Section y el motor `living-drawing`. La lógica de handover corregida no se sustituye por la versión antigua de Hybrid.

**NO se incorpora Hybrid V1**, que es otra función separada. La rama anterior de QA `qa/hv2-integration-section-v1-2026-11-05@25a549b` incluía Hybrid V1 y precede al arreglo Section; solo sirve como referencia histórica, no como base de publicación.

## Puertas pendientes

1. CI del nuevo SHA final, sin heredar los resultados 10/10 de PR #170.
2. Prueba REAL de navegador conjunta Hybrid V2 + Section, sin omisión por ausencia de Hybrid V1: autoplay, llegada interior, «Explorar desde aquí», volver a sección; dos rondas sin residuos ni alteración del proyecto.
3. Verificar Dibujo vivo OFF por defecto, D3 opcional reversible, reduced motion, móvil 390×844, clips/materiales/renderer restaurados.
4. Preview específica de staging y aceptación visual del propietario; GPU real y dispositivo físico aún sin medir.
5. No promover a `master` hasta nueva autorización expresa y verificación de producción/rollback.

Deuda global UI/UX diferida. Este registro documenta solamente la integración técnica provisional; no afirma QA o aprobación de producción.
