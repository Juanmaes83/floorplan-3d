# Casa Serra → Floorplan: integración visual y modo presentación

Fecha: 13-10-2026. **Estado: preparación técnica documentada; implementación y pruebas de producto pendientes.**

Juanma pide incorporar mejoras de Casa Serra a Floorplan, conservando sus funciones y su flujo plano → render ya trabajado en Astra Labs. Esta preparación define el alcance de las entregas y cómo comprobarlas. No equivale a producto implementado, fase canónica nueva, revisión visual aprobada ni integración automática con el LAB.

## 1. Alcance y autorización

- Objetivo autorizado: sumar presentación visual, navegación por estancias, materiales y efectos de Casa Serra a Rubik Sota.
- Juanma confirma en esta conversación, el 13-10-2026, permisos y licencia para usar e integrar Casa Serra en Floorplan. Se toma como autorización para este proyecto; la ausencia de un archivo LICENSE en el snapshot no bloquea este trabajo autorizado.
- Registrar autoría Sam Aing / Lintel y fuentes de los materiales al incorporar cada módulo o recurso. La autorización se documenta como declaración del propietario, sin atribuir una licencia SPDX no observada al código.
- Floorplan conserva su geometría editable, proyectos, guía, búsqueda, catálogo y exportaciones. Los estados de cámara/presentación son derivados separados.
- Astra se consulta como contexto del render existente; esta entrega no crea un sistema de vídeo ni modifica su repositorio.
- Aplicar el [workflow](../DEVELOPMENT-WORKFLOW.md): una entrega revisable cada vez, PR, pruebas y preview exacta para cambios visuales; merge tras aprobación humana.

## 2. Fuentes verificadas y documentación vigente

| Fuente | Referencia fijada | Hecho que condiciona la integración |
| --- | --- | --- |
| Floorplan master | `88b0cb568e9824533764518ec42e235e9c2774a9` | Snapshot de documentos y código utilizado en esta preparación |
| Experiencia guiada | PR #34, merge `92a1193fc1386d3f69566beab15923cc62836222` | Bienvenida, búsqueda de necesidades, cinco etapas, progreso y navegación ya integrados |
| Exportador offline | PR #24, merge `67b7f999c42b3a2960dac6caf94ab77dcc637819` | Paquete source-project / scene.glb / semantic / package; ejes e IDs comprobados en su fixture |
| Captura configurable | PR #29, merge `217ed068b90232907a40b8dff7748a11e6259e7f` | PNG configurable con restauración de cámara/buffer; no reconstruir el exportador |
| Variantes / MCP | PR #30 `3599e71432265860ba932147e1d9765f609b68c4`; PR #31 `88aef0bfeea8abb67865c3d2a33a484c909511ea` | Variantes locales y MCP de lectura integrados; mantener sus contratos |
| Casa Serra | `b47b775fae642439e8d42d6201ab5d1677d67f99` en fork y original | Misma copia publicada: casa, materiales y cámaras específicos, scripts minificados |
| LAB v03 aprobado | LAB PR #4, squash `37df8472e6163263f435424f6989b6c0e10b8ad9` hacia `feat/astra-blender-gate-1` | Escena Blender, renders, comprobaciones y reapertura ya entregados en ese piloto |
| Rama operativa LAB consultada | `7314803e0e71bde1e6f7816edff12c6c6a22e29e` | Es distinta del main histórico documental `245de018…`; no deducir estado actual del LAB leyendo solo main |

Fuentes de Floorplan: [roadmap canónico](../ROADMAP.md), [Roadmap 2](../ROADMAP-2-proposal.md), [guía integrada](guided-experience.md), [contrato](../contracts/FloorPlanProjectV1.md), [captura](capture-3d-phase-b.md), [exportación](post-F3-rubik-blender-candidate.md) y [auditoría histórica del ecosistema](../product/ecosystem-integration-audit.md).

Estado remoto comprobado en esta sesión: #24/#29/#30/#31/#34 están fusionadas. PR #28 y #32 son cierres/propuestas documentales abiertos: se consultan, no se editan ni se integran incidentalmente. PR #33 sigue abierta y su CTA ya fue incorporada en #34. No duplicar ese botón ni modificar ramas ajenas.

La [LAB PR #4](https://github.com/Juanmaes83/lab-astra-sept-2026/pull/4) confirma aprobación y merge. Su [informe v03 fijado](https://github.com/Juanmaes83/lab-astra-sept-2026/blob/37df8472e6163263f435424f6989b6c0e10b8ad9/docs/17-RUBIK-LAB-PILOT-v03.md) conserva el texto previo a revisión: su rótulo pendiente es histórico frente al cierre de la PR. El piloto incluye renders planta/axonómica, once modelos y cinco familias de superficies; no se reejecutó Blender en esta preparación. No se atribuye aquí una nueva generación de vídeo al piloto v03.

## 3. Qué hace Casa Serra y qué se adapta

| Módulo fuente en Casa Serra | Mecanismo leído | Integración en Floorplan |
| --- | --- | --- |
| `scene.js` | Rectángulos/puertas definidos en código; claves de cámara fijas; corte variable; shader dibujo/material por zonas | Usar habitaciones, muros, huecos e IDs del proyecto. Extraer el patrón visual, no sustituir geometría con la casa fija |
| `shared/fx-experience.js` | Interpolación Catmull-Rom, FOV/encuadre logarítmicos, paradas, fichas, reducción de resolución | Secuenciador de vistas sobre View3D; controles Siguiente/Anterior; movimiento reducido; presupuesto propio |
| `shared/fx-core.js` | Texturas color/normal/ARM, repetición en unidades del mundo, geometría/batching auxiliar | Ampliación selectiva de SurfaceRenderer y catálogo; repetir en mm mediante el contrato actual; conservar identidad de los objetos |
| `shared/fx-post.js` | Prepass, AO, bloom, grano, color, profundidad/efectos y buffers HalfFloat | Efectos opcionales y acotados después del piloto; mantener render base si no hay capacidades o presupuesto |
| `shared/fx-paint.js` | Finisher alternativo de dibujo/pintura | Está incluido en el HTML, pero la llamada de scene.js no selecciona PaintFinisher; no asumir que representa la ruta por defecto |
| `light-options.js` | Presets y cambios de exposición/luz/color asociados al recorrido | Presets de presentación reversibles, utilizando luz y tone mapping existentes |
| `hero-options.js` | Variantes tipográficas y dibujo progresivo del plano | Introducción opcional del ejemplo, con contenido de Rubik y salida rápida al editor |
| `gate.js` | Capacidad WebGL2/buffers, carga lenta, pérdida de contexto; imagen/vídeo alternativos | Degradación del proyecto actual a 2D o captura vigente. No mostrar la vivienda Casa Serra como sustituta de un plano propio |
| `staging.js` | Decoración y mobiliario construidos para la casa fija | Conservar biblioteca/modelos Rubik. Incorporar recursos concretos solo si aportan valor y pasan el perfil propio |

Las claves originales de cámara dependen de coordenadas, alturas y puertas de Casa Serra. Su spline y `__checkPath` no constituyen un planificador de rutas para viviendas arbitrarias. Los shaders `roomOf` clasifican rectángulos y compilan arrays de uniformes según esa casa; los polígonos cóncavos, diagonales y paredes compartidas de Rubik necesitan asociación por ID y tratamiento propio.

Casa utiliza THREE global 0.160.1; Rubik usa módulos Three 0.160.0. Adaptar módulos al entorno fijado y preservar callbacks/cache de materiales existentes. No añadir otra instancia de Three ni trasladar el secuestrado del scroll de toda la página al editor.

## 4. Entrega CS-1: presentación por estancias

**Primera implementación propuesta**, sobre el master integrado; no depende de nuevas texturas ni del LAB.

### Entrada y configuración

- Acción «Presentar mi vivienda» en el buscador: presentar, presentación, recorrido guiado, enseñar vivienda, presentation, tour.
- Acceso en «Revisar y guardar» y en el editor completo. Reutilizar requisitos reales de geometría y carga 3D.
- No cambiar el objetivo elegido al abrir esta acción. Presentación es opcional para los objetivos existentes.
- Configuración: vista general más estancias seleccionadas, reordenables; ejemplo preconfigurado y editable. Confirmar inicio; cancelar conserva documento y pantalla.
- Sin geometría útil: explicar y llevar a Distribuir. El ejemplo sigue identificado; no convertirlo silenciosamente en proyecto propio.

### Recorrido

Secuencia base: plano actual → transición 3D existente → vista general → vistas de estancias → cierre. Mostrar «Vista 2 de 4 · Cocina», acceso directo a paradas, Anterior/Siguiente, Pausa si se ofrece reproducción automática y Volver a editar.

CS-1 utiliza vistas superiores/isométricas derivadas de la envolvente real. Estimar encuadre/FOV con el viewport y altura mural, sin copiar las coordenadas de Casa Serra. Los desplazamientos de cámara deben mantenerse en una envolvente aérea segura sobre los muros; si no se puede comprobar, cortar entre vistas mediante una transición breve. Las cámaras a altura de persona entre habitaciones quedan para CS-3.

La ficha de estancia toma nombre/superficie del proyecto y acabados asignados. No inventar prestaciones, precios, cotas rectangulares para polígonos irregulares ni medidas oficiales de los muebles. Mantener la indicación de escala orientativa/estimada aplicable.

### Progreso y estados

- Progreso del objetivo: el actual de Guide.evaluate.
- Progreso de presentación: posición/vistas visitadas, identificado como recorrido, sin sumar tareas necesarias ni completar el objetivo por pasar diapositivas.
- Carga de recursos: indicador independiente. Un asset que falla mantiene su sustituto genérico y un aviso; no fingir carga de su malla.

Estados propuestos: inactivo, configuración, cargando, mostrando, pausado, degradado, saliendo, invalidado. Cambiar de documento/variante o editar geometría invalida el plan derivado. Una operación tardía no actúa sobre otro proyecto ni reabre una presentación cerrada.

## 5. Arquitectura de CS-1 y contrato derivado

| Punto existente | Adaptación propuesta |
| --- | --- |
| `js/guide-core.js` actions / resolve / evaluate | Acción presentation y sinónimos con prioridad frente a «ver 3D»; tarea opcional si se muestra en la guía; conservar goals/denominador |
| `js/guide-ui.js` execute / renderDetails / navegación | Lanzar la configuración desde búsqueda y Revisar y guardar; no usar setGoal por efecto lateral; gestionar foco y retorno |
| `index.html` módulo 3D: enter/exit, flyToRoom, camTween, setPose, applyGrow | Reutilizar transición y render loop; exponer una API de presentación con promesas de finalización/cancelación |
| `View3D.cameraState / canvasState` | Mantener getters de diagnóstico. La restauración requiere API nueva; no mutar los objetos devueltos ni usar globals de debug |
| `js/presentation-core.js` nuevo | Lógica pura: normalización de plan, IDs/revisión, paradas, encuadres y estado; no DOM ni mutaciones del plano |
| `js/presentation-ui.js` nuevo | Ficha/controles y configuración; se comunica con guía y API View3D |
| `css/presentation.css` nuevo | Espacio visual limpio, controles táctiles, estados, foco y movimiento reducido |
| `View3D.shot / shotSize` y exportPNG | Reutilizar captura configurable y recuperación del buffer; coordinar captura y animación, sin otra ruta de exportación |
| `FloorPlanProjectV1` / biblioteca / variantes | Conservar schema y documento. Plan de presentación en metadata separada, por entrada local y projectId |

Contrato propuesto `PresentationPlanV1` (aún no implementado): versión; ID de entrada de biblioteca y proyecto; revisión exacta de datos visuales/geometría; orden de paradas; roomId opcional; tipo de vista; pose derivada en metros y convención glTF/Three; FOV/encuadre; duración; preset visual; calidad. No incrustar binarios ni URLs temporales.

La clave local debe incluir la entrada de biblioteca, además de projectId, para separar variantes/duplicados. Reconciliar roomIds al reabrir: eliminar o marcar paradas inexistentes, informar y regenerar antes de reproducir. Un plano JSON antiguo sigue abriendo sin metadata de presentación. Exportar este sidecar, si se añade, será una acción explícita; no cambiar incidentalmente el JSON/ZIP del proyecto.

Usar el mismo centro `Core.geometry(project).center` que View3D/exportador: X=(x-cx)/1000, Y=altura/1000, Z=(y-cy)/1000. Un cambio del centro obliga a regenerar poses. FOV en grados verticales y aspect de la salida documentados. No repetir la transformación glTF→Blender.

### Invariantes y restauración

Abrir, avanzar, cancelar, Escape, Atrás o cerrar conserva JSON del proyecto, librería, asignaciones, geometría, calibración, selección e historial de edición. El estado separado de la presentación puede guardar su configuración.

Guardar y restaurar vista 2D/3D, cámara/target/FOV, modo órbita/recorrido, puertas visuales, corte mural, luz/noche, muebles/etiquetas, paneles, scroll/foco y recursos temporales. Tras resize conservar posición/orientación y restaurar el aspecto/buffer adecuado al viewport actual, no a dimensiones obsoletas.

Salir de pointer lock al entrar; no recuperarlo automáticamente al cerrar sin gesto del usuario. Restablecer modo y ofrecer continuar el recorrido. Cancelar RAF/promesas/listeners, soltar clones/texturas propias y no disponer recursos compartidos de F3. Serializar captura y transición de cámara. Incorporar tokens de operación y revisión.

No suspender errores existentes ni marcar el plano guardado/exportado por una captura parcial. La evidencia view3d puede actualizarse por el evento real de carga de la misma revisión; el progreso de guardado/PNG conserva sus mecanismos actuales.

## 6. Entrega CS-2: materiales y calidad visual selectivos

Dependencia: CS-1 revisada/integrada según workflow.

Dos candidatos comparten origen nominal con acabados ya existentes:
`oak_wood_planks` → `surface-oak-wood-planks` y
`marble_01` → `surface-marble-01`.
No se presume correspondencia de UV/crop por compartir nombre. Comparar albedos, orientación, escala de repetición y canales antes de asociar mapas.

Se leyeron y decodificaron seis JPEG físicos del directorio tex-1k: 1024×1024 RGB cada uno; 794430 bytes combinados. El cálculo nominal RGBA es 25165824 bytes antes de mipmaps/overhead; no es memoria GPU medida. [Hashes y resultados](../qa/artifacts/casa-serra/source-map-audit.json).

PBR de origen: diff=color sRGB; nor=normal lineal; arm alimenta AO y roughness en FX.pbr. No hay metalnessMap en ese helper: no atribuir al canal B una integración que el código no realiza. Verificar normal +Y y alineación; JPEG tiene pérdida, convertirlo a PNG no crea un master sin pérdida.

Implementación propuesta:
- Preservar los 50 albedos aprobados y su identidad. Si el alineamiento falla, crear candidato distinto, no asociar una normal a un albedo incompatible.
- Admitir mapas opcionales normal/AO/roughness mediante validación explícita de catálogo y perfil web. No cambiar FloorPlanProjectV1 para transportar píxeles.
- Actualizar SurfaceRenderer: validar hash/bytes/dimensiones/formato por mapa; espacios de color; repetir todos los canales coherentemente; abort/cancel; dispose; estimaciones de memoria; fallback al albedo existente.
- Como punto de partida de admisión, mantener ≤512 px/mapa y ≤512 KiB/mapa, coherentes con la biblioteca actual; medir conjunto activo y establecer su presupuesto con baseline. Estos máximos no son rendimiento validado.
- Cargar solo los acabados usados; calidad básica conserva comportamiento actual. Calidad mejorada ofrece el subconjunto probado y puede bajar resolución sin cambiar asignaciones.
- Presets de luz de presentación reversibles. Comparación antes/después desde la misma cámara, geometría y hora; no confundir luz más cálida con precisión métrica.
- Conservar capturas con ACES/color iguales a la vista, buffers restaurados y regresiones de exporter/GLB. PBR del perfil offline #24 no acredita automáticamente PBR web ni viceversa.

## 7. Entrega CS-3: efectos de dibujo y recorrido interior

Dependencias: CS-1 y presupuesto visual de CS-2 revisados/integrados.

- Vista dibujo→material opcional sobre IDs del proyecto. Asociar superficies/mallas a sus entidades; resolver ambas caras de paredes compartidas y suelos cóncavos. No usar los rectángulos fijos de roomOf.
- Shaders/materiales de presentación aislados y reversibles; preservar callbacks, UV, skins admitidas/no admitidas y caches de GLB; no recompilar cada frame ni modificar topología canónica.
- Trasladar solo las piezas necesarias del postprocesado. Capabilities se comprueban por efecto; un fallo de HalfFloat/MSAA conserva el renderer base y la edición.
- Respetar prefers-reduced-motion y opción manual para reducir animaciones: cambios directos de vista, sin parallax o movimiento automático obligatorio.
- Recorrido interior: paradas configurables por estancia, graph de huecos transitables y comprobación de cámara/segmentos contra muros/puertas/mobiliario. Evaluar diagonales, habitaciones desconectadas y puerta cerrada. Un grafo de adyacencias no garantiza una trayectoria libre.
- Catmull-Rom puede sobrepasar waypoints: verificar la trayectoria interpolada completa. Ante ruta incierta, ofrecer vista aérea o corte entre paradas; nunca atravesar una pared para cumplir el tour.
- Exportación de cámaras/sidecar reutilizable por el paquete actual solo después de comprobar ID/revisión/origen/ejes y rechazo de plan obsoleto. Mantener consumo LAB existente como contexto, no montar otra producción de vídeo.

La adopción de GSAP/Lenis o actualización de Three no es requisito previo de estas entregas. Evaluar necesidad concreta antes de introducir dependencias; el render loop e interpolación existentes cubren CS-1.

## 8. UX, accesibilidad y degradación

- Configuración breve y editable; CTA visible «Iniciar presentación»; «Volver a editar» accesible durante todo el modo.
- Ficha de estancia ligera; móvil usa panel expandible, sin tapar navegación. Teclas de navegación se aplican solo con foco fuera de inputs y se explican.
- Nombres de usuario se insertan como texto mediante SafeDOM/textContent; no trasladar innerHTML con datos libres.
- Escape/Atrás devuelven a la pantalla apropiada y restauran el foco; no alterar historial del documento ni volver a disparar importación.
- Sin WebGL o tras pérdida de contexto: conservar documento y ofrecer 2D. Solo utilizar una captura local si coincide con proyecto/revisión; etiquetar captura y no escena interactiva.
- No enviar imágenes/planos a servicios para esta integración. Una presentación local no es un enlace publicado ni un MP4 generado.
- Instrumentación local de carga, frame time y memoria estimada; sin bloquear la interfaz ni inventar FPS de un teléfono.

## 9. Orden y criterio para avanzar

| Entrega | Resultado revisable | Condición antes de la siguiente |
| --- | --- | --- |
| Preparación actual | Especificación, auditoría física acotada, actualización de roadmap y protocolo | Revisión del alcance; implementación no iniciada por esta documentación |
| CS-1 | Presentación real desde búsqueda/guía, ejemplo y proyecto propio; retorno intacto | Pruebas de estado/restauración, preview final y revisión humana |
| CS-2 | Dos materiales candidatos PBR y calidad acotada, comparación controlada | Recursos/UV/canales comprobados, presupuesto medido y revisión visual |
| CS-3 | Revelado opcional y recorrido interior comprobado; cámaras derivadas reutilizables | Trayectorias, compatibilidad, degradación y reversibilidad comprobadas |

No añadir numeración F4 ni mezclar esta secuencia con las fases A–G propuestas de Pascal, PR #28/#32 o tareas F2. Las cinco sesiones/veinte planos y rendimiento en teléfono siguen pendientes para sus evaluaciones; no impiden preparar o implementar esta mejora autorizada.

[Pruebas y revisión a ejecutar](../qa/casa-serra-integration-plan.md). No marcar esta planificación como PASS de producto.
