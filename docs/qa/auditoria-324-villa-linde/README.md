# Handoff de auditoría para la PR #324

**Destino de producto:** [Juanmaes83/floorplan-3d · PR #324](https://github.com/Juanmaes83/floorplan-3d/pull/324), desde `claude/integracion-cabecera-entregar` hacia `master`. Esta rama documental publica el diagnóstico, las pruebas y los archivos sintéticos. Los arreglos corresponden al worktree de Claude sobre su HEAD vigente, con su handoff actual de la PR como punto de coordinación.

## Versiones y cobertura

| Referencia | Qué acredita |
|---|---|
| `dacb5d395abf32449102d73ffd03200e6c09c019` · master | Comparación de base para el alcance económico y Analizar. |
| `6e95151718d9300fc12aa78a390dc95433a7f1b6` · candidata | Primera auditoría, controles QA-01 a QA-23, casos pequeños y fallos de D3, progreso 3D y cantidades. |
| `5a061725573c8bf9796f365d3dee1708484c6723` · candidata | Villa Linde y su entrega, incluidos HTML P7, PDF D3, D4, videos, P3 y advertencias geométricas. |
| `39ea4bf0b61b095d4240c57abff96f4ebb3c1735` · último HEAD visto al preparar la publicación | Desde `5a061725` cambian las particiones de pruebas, el registro de regresión y el grabador de CI. Esta publicación conserva los SHA ejecutados y pide verificar el HEAD vigente antes de intervenir. |

Interacción comprobada en Chromium local sobre cada árbol, con datos sintéticos. La consulta de Catastro usó una referencia pública como sonda sin guardarla en la villa. No se certifican Production, solvencia estructural, precios reales ni proveedor de Render IA. El primer edificio de Villa Linde fue una prueba de carga. El archivo a usar para comprobar correcciones de la vivienda es el [edificio amueblado aprobado](villa-linde/aceptacion/villa-linde-aprobada.json).

## Empieza por aquí

- [Auditoría inicial, comparativa con master y QA-01 a QA-23](INFORME-AUDITORIA.md)
- [Cierre de Villa Linde sobre los planos aprobados](villa-linde/aceptacion/CIERRE-VILLA-LINDE.md)
- [Decisiones de diseño, orientación y mejora candidata por estancia](villa-linde/DECISIONES-DE-DISENO-Y-ORIENTACION.md)
- [Handoff de Claude publicado en el HEAD observado](https://github.com/Juanmaes83/floorplan-3d/blob/39ea4bf0b61b095d4240c57abff96f4ebb3c1735/docs/qa/integracion-324/README.md)
- [Prompt de continuación](PROMPT-CLAUDE-CODE.md)
- [Manifiesto SHA-256 de las evidencias](MANIFIESTO-EVIDENCIAS.json)

## Cola de correcciones y pruebas de aceptación

Las rutas y archivos de abajo orientan el diagnóstico. Verifica los consumidores en el HEAD real y aplica el cambio más acotado compatible con la UX aprobada.

| ID | Prioridad / esfuerzo inicial | Fallo y punto de partida | Resultado que se exige | Evidencia |
|---|---|---|---|---|
| V01 | **Alta** / medio | **Presupuestar → D4.** El coste corresponde a la planta activa. Con nombre neutro «Villa Linde» el HTML de impresión dice «Total con IVA» sin indicar la planta. El mismo fallo del presupuesto aparece en master. Revisar la composición del ámbito en Presupuestar, presupuesto, D4 y exportadores. | La planta y el alcance se entienden en cada total, resumen de cálculo y salida CSV/JSON/D4, aun con título neutro y tras cambiar de planta. Los importes, revisión, independencia por planta y parciales se conservan. Caso de una planta y caso de dos con precios distintos. Mantener el presupuesto de edificio completo como evolución aparte. | [D4 Cliente](villa-linde/aceptacion/D4-neutro.png) · [Registro](villa-linde/aceptacion/d4.log) · [Caso corto y master](INFORME-AUDITORIA.md) |
| V02 | **Alta** / medio | **Analizar / D3 / P7.** El resumen de 784,46 m² y las tablas corresponden a dos plantas. La portada dice «Planta única». Revisar autoridades de agregación frente a portada y composición del HTML offline. | Nombre de edificio y número/identidad de plantas coherentes en resumen, portada, PDF y HTML. La imagen declara si muestra una sola planta. Los totales y el desglose coinciden con la geometría y conservan exclusiones. Control de una planta e importación de datos anteriores. | [Salida PDF](villa-linde/aceptacion/villa-linde-dossier-D3.pdf) · [HTML local P7](villa-linde/aceptacion/archivo-cliente.html) · [Recorrido](villa-linde/aceptacion/d3-dxf-completo.log) |
| V03 | **Alta** / medio | **D3 → Cliente y contacto.** Rechazo de escritura simulado solo sobre la clave D3. Al volver del paso «Nota», el nombre se pierde sin aviso. Revisar la persistencia de `js/dossier-client-ui.js`. | Mantener el borrador durante la sesión, indicar con claridad que sigue sin guardarse, permitir reintentar sin pérdida y aislar fichas de proyectos. Probar escritura aceptada, rechazo y recuperación. La nota interna conserva su privacidad. | [Antes](d3-antes.png) · [Después](d3-despues.png) · [Móvil](d3-movil-despues.png) · [Procedimiento](probar-d3.js) |
| V04 | **Media** / bajo | **D3 → Preparar imágenes.** El fallo real de `View3D.deliveryShot` queda retenido por `js/project-views-ui.js`. El causante llega al estado de vistas y D3 no lo comunica en el caso auditado. El vídeo histórico de la rama usó otra ruta de fallo. | Inyectar fallo en la captura, ejecutar el `prepare()` real, comprobar causa y reintento en D3, conservar el borrador y evitar reapertura sobre otra vista. Si ya pasa en HEAD, acreditar el caso y cerrar sin rehacer. | [Captura](d3-captura-error-sin-aviso.png) · [Procedimiento](d3-captura-error.js) |
| V05 | **Media** / medio | **Diseñar → Escena 3D.** La apertura visual registra la revisión como hecha. `js/guide-ui.js` recibe `floorplan-view-ready`. Contrastar el contrato descrito por `js/perla-editor-ui.js`. | Solo «Revisar en 3D» o la acción explícita equivalente registra la revisión. El selector 2D/3D y las capturas internas conservan el estado. Comprobar también retorno desde entregables y pasos ya guardados. | [Antes](revision-3d-antes.png) · [Después](revision-3d-despues.png) · [Procedimiento](revision-3d.js) |
| V06 | **Media** / bajo | **Cantidades / CSV.** 22 huecos, incluidos 2 huecos de paso, se presentan como 22 carpinterías. El presupuesto ya computa 20 puertas y ventanas. | Designación exacta en tarjeta, tabla y CSV, con 20 carpinterías y dos huecos de paso, o 22 huecos con desglose. Mantener cantidades económicas y compatibilidad del CSV, incluyendo ES/EN/ZH. | [Panel](mediciones-presupuesto.png) · [CSV](cantidades.csv) |
| V07 | **Media** / bajo para explicar | **P3 Visita privada.** Villa Linde tiene dos plantas y la ficha dirige al ejemplo. `js/delivery-preview-ui.js` excluye multiplanta. | Identificar el límite de dos plantas en el lugar de la acción y ofrecer el acceso que sí funciona a P1. Mantener la navegación privada multiplanta real como corte independiente si se encarga. Distinguir cambio de vista de recorrido por escalera. | [Ficha](villa-linde/aceptacion/P3-limite-edificio.png) · [P1 cinematográfico](villa-linde/aceptacion/P1-rubik-sota-recorrido-villa-linde-planta-baja.mp4) |
| V08 | **Media** / diagnóstico | **Analizar → Exterior.** En el fixture, `wal_linde-b-30` mide 10 mm por el encuentro de dos líneas y `wal_linde-b-51` limita con la transición terraza/paso. La clasificación parcial bloquea la derivación de cubierta. | Reproducir con el modelo original de evidencia y una copia de diagnóstico. Determinar qué parte es de modelado, qué parte es del clasificador y si la UI puede localizar el segmento que bloquea. Mantener el resultado «no disponible» cuando la geometría sea insuficiente. | [Orientación](villa-linde/aceptacion/02-orientacion.png) · [Modelo](villa-linde/aceptacion/villa-linde-aprobada.json) |
| V09 | **Baja** / bajo | **P8 Blueprint.** En escritorio se truncan las etiquetas de la barra inferior de sección, como «Visual limp…» e «Inspecciona…». | Etiquetas o controles legibles y accesibles en escritorio y móvil. Mantener geometría, capacidades P8/P9, cierres y foco. Hacer tras los fallos funcionales. | [Captura de sección](villa-linde/aceptacion/P8-section.png) · [Recorrido](villa-linde/aceptacion/05-blueprint-despiece-studio.webm) |

**Por calificar:** recargar el proyecto de ejemplo cambió su ID en una sonda. Una copia propia con almacenamiento operativo mantiene ID y borrador. Verificar el contrato de identidad del ejemplo antes de considerarlo fallo. Véase [informe inicial](INFORME-AUDITORIA.md).

**Separado por alcance:** ficha de decisión por estancia y conexión Diseñar ↔ Analizar, muros curvos OP-07, piscina volumétrica, proveedor Render IA, BCCA gestionada, Gesture Labs con móvil y Película del proyecto §11. En este corte se registra su situación y se conserva la evidencia. La CI tiene su propia regresión y las aprobaciones humanas conservan sus Preview.

## Archivos y reproducción

- Usa el [fixture mínimo de dos plantas](edificio-dos-plantas.json), su [control con título neutro](edificio-nombre-neutro.json) y el [edificio aprobado de Villa Linde](villa-linde/aceptacion/villa-linde-aprobada.json). La [copia neutra de Villa Linde](villa-linde/aceptacion/villa-linde-control-alcance.json) reproduce V01. Prueba en un perfil de navegador limpio para evitar IDs duplicados.
- Los vídeos WebM muestran recorridos de auditoría con navegador. Los MP4 P1 y P4 y los ZIP, DXF, PDF y HTML etiquetados como salidas se generaron desde el producto o su ventana de impresión. [Hybrid](villa-linde/aceptacion/04-dibujo-vivo.webm) · [HERO](villa-linde/aceptacion/07-HERO-dibujo-vivo.webm) · [Evolución](villa-linde/aceptacion/evolucion-producto.mp4) · [Recorrido a pie](villa-linde/aceptacion/08-recorrido-editor.webm).
- Los snippets de Playwright documentan el procedimiento. `AUDIT_WORKSPACE/` sustituye la carpeta local. En una copia temporal, ajusta el prefijo, puerto, ubicación de fixtures y carpeta de salida a tu entorno. No los añadas al producto como suite sin adaptarlos. Los archivos de resultados conservan el contexto del corte. Los ZIP de Blender permiten reproducir esas sesiones sin duplicar la geometría de trabajo.
- Registra por hallazgo la reproducción en HEAD, commit de corrección, resultados en escritorio y móvil cuando proceda y CI. Para los flujos que necesitan explicación, enlaza una grabación continua desde el acceso hasta la salida, junto con captura del error o su corrección, SHA y Preview exacta. Conserva los controles ya superados que toquen tus cambios.


## Película del proyecto · propuesta de continuidad

[Ubicación propuesta en Home y Entregar y criterios de aceptación](PELICULA-PROPUESTA-HOME-ENTREGAR.md).
