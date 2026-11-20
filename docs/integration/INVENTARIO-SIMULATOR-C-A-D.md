# RUBIK SOTA · Inventario de integración Simulator C, A y D

## Corte 20/11/2026 · C integrado, A y D pendientes

- **C/C-bis y dock.** #293 integrada y Production verificada sobre `e32c7cd7efddd791b9ff17e7dc8e8309ee19f3d4`. [Estado maestro](../product/ESTADO-MAESTRO-RUBIK-SOTA.md).
- **A.** HEAD fuente `1ba63cd038b1c781519ecaeba2f0ca2e30746cf6`. El propietario aceptó el recorrido de Evolución y la construcción por hiladas. La prueba dirigida sobre el acumulado previo a la corrección de QA de F2 volvió a acreditar las hiladas y el sólido final. La autorización de fusión se liga al merge efectivo de OP-11 lote 01 y al árbol acreditado. HERO FINAL sigue en preparación separada.
- **D.** `eae7d5f366ba7e24de9e04d38addd216a70a3d76` preservado. WebKit 26.6 reproduce el aviso durante el arranque, antes de elegir Ejemplo y antes de entrar en 3D, incluso con reloj real. Las aserciones de movimiento, contenido no vacío y equivalencia mantienen su alcance.

Corte del 20/11/2026. Fuente congelada: [laboratorio Simulator `09557c4cac1e6390d3af56281922d8d43093234e`](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/tree/09557c4cac1e6390d3af56281922d8d43093234e/COMPONENTES), árbol `435810ed92a107005df9dc1cb334ff473cffec6f`. Donante `simulator@57d562c`, MIT. Se conservan los avisos de origen para la publicación de cada corte.

La secuencia autorizada sigue siendo K13 → #272 → SMART. Después se preserva OP-10 → E → D. C y A quedan como cortes independientes, preparados en local sobre el árbol autorizado de SMART `e57089f61dc7a915f316a176280e4c08ebd49057`. Su base se comprobará antes de presentar cada integración.

## Actualización 20/11/2026 · Cierre de Claude Code 1

Fuente verificada en GitHub, `Juanmaes83/rubik-sculpt-simulator-lab`, rama `claude/sculpt-simulator-components`. HEAD `210a3929f9bb4032fb46731a7e921b956247f652`, árbol `3ca58d263fcc09f58a063c5da76318c2147c74e1` y padre `566c0fd7a766edb9debedc29b5d10e0c64aebaee`. [Handoff de CC1](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/210a3929f9bb4032fb46731a7e921b956247f652/COMPONENTES/HANDOFF-SIMULATOR.md)

OP‑07/A0 y Simulator D conservan prioridad. OP‑07 v4 `3afb9e18` espera el siguiente SHA de CC2. La composición aislada A0 real + S8 conserva las dos barreras, árbol `b16a0067e802991faebe40bfc6e0df7e6aeea567` y 7/7 casos acreditados. #273–#279 siguen congeladas. D conserva `eae7d5f366ba7e24de9e04d38addd216a70a3d76` y el gate de WebKit abierto por el aviso intermitente de ResizeObserver. Los seis arranques con trazador (tres por árbol) no reprodujeron el aviso. El siguiente contraste debe registrar el arranque sin lecturas síncronas de geometría y conservar los controles de movimiento, contenido, equivalencia y errores. [Corte de seguridad y evidencia anterior](op07-a0-2026-11-20/cierre-v4-d/README.md)

### A y C-bis · Preparación aislada

Base y único padre de ambos cortes `8e917e1a70f499a6b8dc68850c8413b7d06c5682`, árbol `dec6d20694e083cb615f42eae60bb74fd3209523`. Los parches exactos se aplicaron en dos worktrees independientes. El control de reversión del parche, la sintaxis de los JS modificados y `git diff --check` pasaron. Entre `adb86034` y este master solo se añadieron siete archivos de QA de Simulator E. Se conserva la evidencia anterior con su entorno y alcance.

| Corte | Commit local | Árbol | Alcance |
| --- | --- | --- | --- |
| A | `1ba63cd038b1c781519ecaeba2f0ca2e30746cf6` | `43152470cb9db02dbbcbba276dfaf6be800c4564` | Cinco archivos de Evolución y núcleo de fábrica. [Parche original](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/210a3929f9bb4032fb46731a7e921b956247f652/COMPONENTES/A-construccion-procedural/surgery/rubik-adb8603.patch) |
| C-bis | `53e305116bb034a00d3778a86baa6ccc4e237fb0` | `23a3aa7d4949e422846c90b3517715bf74b2b035` | Cuatro archivos de guía y maquetación 3D. [Parche original](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/210a3929f9bb4032fb46731a7e921b956247f652/COMPONENTES/C-seleccion-inspector-hud/maquetacion/rubik-adb8603-maquetacion.patch) |

- **A.** Evolución → seleccionar un plan de obra → recorrer su línea temporal. La fábrica se representa durante la ejecución prevista, reutiliza la clave del inventario y conserva los sólidos para inspección y al terminar. CC1 acredita 12/12 pruebas puras y 1/1 en Evolución real con 70/70 muros. La exclusión sintética de muros con forma conserva el sólido. La convivencia visual con geometría real de OP‑07 requiere una candidata acreditada de OP‑07. Quedan aceptación visual, composición WebGL en WebKit y autorización independiente. [Handoff A](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/210a3929f9bb4032fb46731a7e921b956247f652/COMPONENTES/A-construccion-procedural/HANDOFF.md)
- **C-bis.** Escena 3D → «Presentar mi vivienda» → Presentación. El parche reutiliza el botón y el foco, ajusta la ayuda para convivir con NAV3D y compacta por defecto la guía en ventanas bajas. Se conserva el QA de CC1 en cuatro ventanas emuladas. Quedan aceptación visual, comprobación en dispositivo y contraste del residual de movimiento reducido en el alcance autorizado. [Handoff C y C-bis](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/210a3929f9bb4032fb46731a7e921b956247f652/COMPONENTES/C-seleccion-inspector-hud/HANDOFF.md)
- **Residual anterior del producto.** CC1 lo reprodujo en `adb86034` sin parche, con emulación táctil y `REDUCED_MOTION=1` en `maquetacion/qa-u5.cjs`. Al entrar en 3D el viewport de diseño pasó de 390 a 967 px y `#mobileDock` quedó fuera de pantalla. Registrar como residual independiente. La atribución a C-bis o A0 carece de evidencia. [Reproducción documentada](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/210a3929f9bb4032fb46731a7e921b956247f652/COMPONENTES/C-seleccion-inspector-hud/maquetacion/qa-u5.cjs)
- **C.** Etiquetas de estancia conserva su corte independiente y gate estricto **p50 < 8 ms**. El resultado comunicado de **8 ms** en Chromium SwiftShader a 390×844 queda fuera del presupuesto. Las mediciones anteriores en Firefox y WebKit corresponden a sus entornos. Pendiente rendimiento acreditado en el escenario de referencia y aceptación.
- **B.** Encuadre original en vivo y encuadre cinematográfico opcional al exportar. Destino futuro «Presentación → Grabar vídeo». Reutilizar `tour-video-ui.js`, `tour-recorder.js` y el Simulator E ya integrado. Solo `clear` permite considerar comprobada la trayectoria. Exigir exportación reproducible en su alcance, cancelación, privacidad y restauración de estado y cámara. El laboratorio acredita 23/23 puras y la comparación de encuadre sobre el ejemplo. La conexión productiva queda para una autorización propia. [Handoff B](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/210a3929f9bb4032fb46731a7e921b956247f652/COMPONENTES/B-tiempo-direccion-cinematografica/HANDOFF.md)

Los candidatos y la integración siguen pendientes. Codex conserva el respaldo exacto y la trazabilidad documental. Siguiente actuación para A o C-bis tras autorización: acreditar la aceptación y los gates residuales del corte en su base efectiva antes de integrarlo.

## C · Etiquetas 3D en zona segura

- [Handoff y evidencia de Chromium](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/tree/09557c4/COMPONENTES/C-seleccion-inspector-hud). Dos módulos recuperados y dos puntos de conexión en `index.html`. Árbol local `678a04b49b9d0dd3f0ac8542d749ff2275a018eb`.
- Prueba dirigida Firefox y WebKit en 1280×800 y 390×844, con el arranque real y movimiento reducido. 4/4. Sin solapes, etiquetas bajo paneles ni etiquetas fuera del visor. Quedaron visibles 7 nombres en escritorio y 10 en móvil. 0 fotogramas adicionales en 700 ms una vez en reposo. Coste por colocación p50 ≤ 2 ms, p95 ≤ 3 ms en las 20 muestras por escenario. Proyecto intacto.
- Conserva el texto y estilo de etiquetas Perla. Las guías decorativas están fuera del árbol de accesibilidad, sin foco ni captura de pulsaciones. En Firefox, Intro activa «Desde arriba» y el foco permanece en el control. Los nombres visibles aparecen en el árbol accesible. Contraste mínimo calculado 11,5:1 para el estilo de Perla medido. La aceptación visual del propietario y la comprobación con lector de pantalla siguen pendientes. Las cuatro combinaciones tienen capturas de etiquetas. La captura WebKit headless Windows deja la malla del lienzo en blanco, de modo que acredita el DOM y los contadores de OP-02. La composición visual completa queda pendiente en WebKit.
- Validar contra Production efectivo antes de integrar. El presupuesto del handoff permanece en p50 < 8 ms. No se cubren U3, U4 ni U5 con este corte.

## A · Fábrica en Evolución

- [Handoff, parche y evidencia de Chromium](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/tree/09557c4/COMPONENTES/A-construccion-procedural). Parche original de cinco archivos aplicado con finales LF. Árbol local `5997853d6af39cc529428da8f7016586bf829172`.
- Regresión de Evolución real 1/1 en Firefox y 1/1 en WebKit. La obra sintética conserva las claves de 70/70 muros y muestra fábrica en 80 posiciones de medio día. 0 al inicio y al final del plan. Sólido final inspeccionable. 0 errores y 0 peticiones externas. Capturas con geometría visible en Firefox. WebKit headless Windows pasa el flujo y los contadores, pero el lienzo de la captura está vacío también en la base SMART sin el parche. Quedan pendientes la evidencia visual de WebKit y la aceptación del propietario.
- Autoridad vigente: `FloorPlanConstructionProject.levelsOf/elementKey` e inventario de Evolución para identidad y fases. A lee los muros de cada proyecto canónico y deriva su fábrica como representación temporal. El adaptador comprueba que existe `FloorPlanCore.geometry` y calcula las dimensiones a partir de los campos del muro.
- OP-07 `4a3118d63d3d7280aae8ea8251dad07302bd6017` añade `curve` y `heightEndMm`. El núcleo de A usa longitud de cuerda, ángulo único y altura inicial. Una sonda comparó A con el módulo canónico extraído del parche S1. El muro recto coincidió. En el curvo se midieron 4.000 mm en A frente a 4.589 mm en OP-07. En el inclinado, A dibuja 2.500 mm al final frente a 3.300 mm canónicos. Para una base con OP-07, excluir estos muros de la fábrica y conservar el sólido usando la autoridad existente. La prueba de convivencia debe incluir muro recto, curvo, con pendiente y huecos en todos ellos. Cualquier extensión de la fábrica usará las facetas y perfiles canónicos de OP-07.

## D · Reconciliación del contrato

- [EQUIVALENCIA.md](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/blob/09557c4/COMPONENTES/D-captura-reproducible/EQUIVALENCIA.md) limita al entorno Chromium Linux/SwiftShader acreditado la garantía byte a byte de `canvas3d`. Para `window` exige exactitud fuera del lienzo y aplica su contrato medido dentro del lienzo. `element` registra huellas.
- Firefox independiente con la fuente anterior: 1 de 4 fotogramas distintos a 0,1 s, 2.737 píxeles y cámara idéntica. Nueva prueba con `09557c4` y master `0e1a6e0a`: dos sesiones Windows, 4/4 fotogramas exactos tras aislar el lienzo. El resultado acredita ese recorrido y no amplía la garantía general ni prueba la causa de la diferencia anterior.
- WebKit Windows: la prueba de movimiento falla con `canvas3d`. Cuatro poses distintas y cuatro fotogramas del mismo color. El recorte sin aislamiento contiene 1.057 colores. El recorte sin aislamiento contiene interfaz superpuesta. El lienzo de Evolución también aparece plano en WebKit headless Windows sobre la base SMART. Las mediciones acotan el problema a la captura o composición en ese entorno, sin aislar la causa. Gate WebKit abierto. Conservar la aserción de movimiento y la comparación exacta. Sin transferir los umbrales de `window` a `canvas3d`.

## Residuales UX independientes

| Caso | Hallazgo | Criterio de cierre |
| --- | --- | --- |
| U3 | `#hint3d` recortada o tapada por los controles 3D. | Texto completo y fuera de los controles en 1280×800 y 390×844. |
| U4 | En 960×600 la guía consume unos 230 px y el lienzo queda en 139 px en la base del laboratorio. | Medir espacio útil y verificar acceso a guía, navegación y lienzo. |
| U5 | En 390×844 la cabecera corta «Presentar» y «Asistente». | Acciones accesibles por puntero y teclado sin desbordamiento de la cabecera. |
| Tarjeta de progreso en Evolución | Confirmado visualmente en la captura de Firefox del pico de obra: la tarjeta cubre parte de la vivienda. | Reproducir y medir la intersección con la vivienda, probar escritorio y móvil con progreso accesible y casa visible. |

[Auditoría U3–U5](https://github.com/Juanmaes83/rubik-sculpt-simulator-lab/tree/09557c4/COMPONENTES/AUDITORIA-UX-VISTA3D). A0 sigue congelada y D4 conserva su gate independiente.
