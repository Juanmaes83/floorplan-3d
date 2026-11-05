# FT3D-8 · S1-F — Matriz de las 38 correcciones

Estados posibles: **RESUELTO**, **PARCIAL**, **PENDIENTE** y **BLOQUEADO**. Un punto solo cuenta como resuelto si hay
código, una prueba o una comprobación que lo demuestren; la documentación sola no basta. Las pruebas citadas se
ejecutan en la CI de esta rama (`ft3d-8v-schedule-core.yml`).

| # | Punto | Estado | Evidencia o explicación |
|---|---|---|---|
| 1 | Secuencia interna por gates | RESUELTO | Commits separados y subidos: S1-A `b45eef2`, S1-B `eb5e0f4`, S1-C `a39fa51`/`82d6df5`, S1-D `f2c0c49` y siguientes. Gates documentados en cada documento |
| 2 | Rama exacta y base | RESUELTO | `feat/ft3d-8-s1-real-project-integration-2026-11-05` desde `e730974` (= `f78b5e3` + especificación). No existía otra rama S1 (S1-A §0) |
| 3 | Archivos permitidos y protegidos | RESUELTO | `git diff --stat 0f9c6ea..HEAD` solo muestra `js/construction-*`, `labs/ft3d-8/**`, `tests/construction-*`, `tests/ft3d-8-*`, `docs/product/ft3d-8-*` y el workflow propio |
| 4 | Cambios concurrentes | RESUELTO | S1-A §7: diff de cada rama activa; solo #166 toca `api/share.js` (tipo `delivery`, compatible) |
| 5 | Bloqueos técnicos | RESUELTO | Se documentan y no se simulan: presupuesto de edificio, revisión en C1–C4, WFS, aprobación autenticada, mallas por elemento (S1-E §6) |
| 6 | Separación S1/S2/S3/S4 | RESUELTO | Sin WFS, sin proxy, sin BCCA gestionada y sin tocar Entregar, Presupuestar ni `index.html` |
| 7 | Resultado funcional inequívoco | RESUELTO | Laboratorio de 6 pasos; `ft3d-8-dossier.browser.test.cjs` demuestra la correspondencia y el cambio de proyecto |
| 8 | Almacenamiento entre dominios | RESUELTO | S1-A §3: dos rutas; el laboratorio lee archivos y nunca el `localStorage` de otro dominio; aviso «Ruta S1» en pantalla |
| 9 | Autoridad del proyecto activo | PARCIAL | Ruta S1: el documento cargado es la autoridad y se valida con el validador real. La lectura del proyecto **abierto** en el editor necesita S4 (`index.html`) |
| 10 | Contrato versionado de vinculación | RESUELTO | `rubik-sota.construction-dossier` 0.1.0 (S1-B §1), `assemble`/`openPackage`, prueba de paquete |
| 11 | Precedencia entre fuentes | RESUELTO | S1-B §3; conflictos con `resolution:'none'` (casos E, F, G y referencia de parcela) |
| 12 | Persistencia de planificación | PARCIAL | El plan persiste como archivo y dentro del paquete del expediente; RUBIK no tiene almacenamiento de planes (S4) |
| 13 | Compatibilidad de contratos | RESUELTO | Prueba con presupuesto 1.0.0 y plan 0.1.0 sin reescribirlos; manifiesto 0.2.0 lee 0.1.0; proyecto 1.6→1.12 con `setSite` |
| 14 | Invalidación de revisiones | RESUELTO | `invalidation()` y caso H (muro movido, precio cambiado, renombrado sin cambio de geometría); aviso en pantalla |
| 15 | Revisión declarada frente a acreditada | RESUELTO | Chips «Declarado», nunca «Verificado» para revisiones o presupuestos; `approval-not-authenticated` siempre presente |
| 16 | Selección del presupuesto correcto | RESUELTO | Identidad por tipo e ID, `budget-selection-required` con selector y `budget-selection-invalid`; caso E |
| 17 | Presupuesto de edificio | PARCIAL | Opciones 1 y 2 implementadas y probadas (caso B, «sin sumarlos»); la opción 3 necesita aprobación (D-S1-1) |
| 18 | Partidas agrupadas | RESUELTO | No se reparte entre elementos: prueba C6 (ninguna línea de coste lleva `elementId`) |
| 19 | Reparto porcentual | RESUELTO | Núcleo 0.2.0 reutilizado; C6: ninguna partida se asigna por encima de su subtotal; 50 % pendiente en el caso C |
| 20 | Impuestos, unidades y tipos de importe | RESUELTO | Neto, IVA y total separados y con su completitud (C6); unidades del motor; descuentos `not-in-contract` |
| 21 | Procedencia BC3/BCCA | RESUELTO | La prueba de procedencia conserva `user-bc3`, código, edición, región y licencia |
| 22 | Valores desconocidos y cobertura | RESUELTO | `null` en lugar de 0 (casos D e I); «desconocido» en pantalla; tres coberturas separadas |
| 23 | Contrato territorial existente | RESUELTO | Solo autoridades existentes (`site.parcel`, adaptadores e integración) |
| 24 | Correspondencia parcela-proyecto | RESUELTO | Caso G (otro proyecto, otra referencia, candidata sin colocar); la evidencia forma parte de la identidad |
| 25 | Transformaciones CRS | RESUELTO | C7: ancla, ida y vuelta, ancla en el CRS de origen, rotación de 1 m comprobada, tolerancia de 0,001 mm |
| 26 | Política de exportación territorial | RESUELTO | `restricted` nunca se exporta: manifiesto y HTML sin coordenadas (pruebas pura y de navegador) |
| 27 | Ausencia de Catastro | RESUELTO | Caso D: «No se inventa ninguna»; ortofoto y terreno, solo metadatos (caso I) |
| 28 | Privacidad territorial | RESUELTO | El GML no viaja en el paquete; los datos son sintéticos; no hay peticiones externas (vigiladas en cada prueba de navegador) |
| 29 | Experiencia comercial | PARCIAL | Flujo de 6 pasos Perla con mensajes comprensibles y versión móvil. Falta la validación humana del propietario (Gate D) |
| 30 | Regresión de vídeo, marca y entrega | RESUELTO | Las suites anteriores se ejecutan sin cambios en la CI; vídeo real con el expediente (prueba de navegador 5) |
| 31 | Estados de publicación | RESUELTO | Enlace público desactivado en S1 (`exportPolicy.publicLink.enabled=false`); la publicación sigue solo con mocks |
| 32 | Mensajes para datos parciales | RESUELTO | `MESSAGES` y prueba de que todo aviso tiene mensaje; capturas 05–10 |
| 33 | Prueba de integración real | PARCIAL | Documentos con la forma real de exportación, por el input real de archivos y con el proveedor real de Catastro. La ruta directa con la biblioteca abierta es S4 |
| 34 | Escenarios negativos | RESUELTO | E, F, G, H, I y J, más paquete alterado y documento desconocido; pruebas de mutación |
| 35 | CI de la nueva rama | RESUELTO | `3c82721`: rama S1 y comodines en el workflow; la ejecución del SHA final figura en el informe |
| 36 | Invariantes cuantificables | RESUELTO | Cinco resultados posibles; ID estable entre ejecuciones (fixture determinista); sin fugas al cambiar de proyecto; paquete de menos de 1 MiB |
| 37 | Seguridad y rendimiento de importación | RESUELTO | Límites derivados (S1-B §8), detección por contenido, profundidad, el estado se conserva si falla (caso J) |
| 38 | Integración y reversibilidad futura | RESUELTO | S1-E: productores y consumidores, archivos, responsables, migración y reversión |

**Resumen:** 33 RESUELTO, 5 PARCIAL (9, 12, 17, 29 y 33), 0 PENDIENTE, 0 BLOQUEADO.
Los puntos parciales dependen de cambios compartidos (S4) o de decisiones y revisión del propietario.
