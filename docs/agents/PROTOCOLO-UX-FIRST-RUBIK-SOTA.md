# Protocolo UX‑FIRST / Flow Audit · RUBIK SOTA

Propuesta del 19 de noviembre de 2026 para aprobación del propietario. Su incorporación hará obligatorio este protocolo para todos los agentes. El [protocolo multiagente](PROTOCOLO-COORDINACION-MULTIAGENTE.md) sigue definiendo roles, permisos y cambios de estado.

## Alcance y responsabilidad

Toda capacidad debe poder descubrirse, entenderse y operarse con seguridad en ordenador, tableta y móvil. Se revisa el recorrido completo desde la intención de la persona hasta la verificación del resultado. El diseño conserva las capacidades profesionales, las autoridades canónicas y los límites acordados. El diagnóstico y la aceptación se vinculan a la versión observada.

El agente que desarrolla el corte lleva su evidencia. Codex mantiene la auditoría transversal y la trazabilidad de hallazgos. El propietario decide prioridades, acepta el resultado humano y autoriza las acciones que correspondan. Cada intervención conserva las autorizaciones separadas de desarrollo, integración, despliegue, activación y gasto.

## Tres reglas de oro

1. **Dejar que el diseño explique.** El nombre de la acción, su ubicación, su estado y la respuesta del producto deben mostrar qué va a pasar, qué ocurrió y cómo corregirlo. La ayuda aporta contexto cuando hace falta.
2. **Si una persona puede usar nuestra plataforma sin ti, será un producto con UI/UX perfecto.** Tratarlo como criterio de autonomía. Entregar la tarea a una persona que no conoce la implementación y observar, sin guiarla, si encuentra la entrada, elige el destino, confirma, comprueba el resultado y se recupera de un error o revierte la acción. Registrar las ayudas que tuvo que pedir y el contexto de la prueba.
3. **NINGÚN BLOQUEO SIN EXPLICACIÓN NI SOLUCIÓN.** Explicar qué ocurrió, por qué y dónde, con una referencia visual si ayuda a localizarlo. Dar un siguiente paso concreto, una alternativa segura y el estado de los datos. La persona debe poder recuperarse sin conocimientos técnicos ni ayuda externa.


## Método

| Fase | Entregable |
|---|---|
| OBSERVE | Recorrido real, desde sesión nueva o contexto documentado. Registrar SHA, árbol, origen, datos, viewport, dispositivo y estado previo. |
| MAP | Intención, entradas visibles, clics o acciones, cambios de vista, escritura, estado final y salida. Separar la ruta guiada y la profesional cuando existan. |
| DETECT | Hallazgo reproducible con evidencia y alcance. Verificar tanto estados alternativos como el resultado principal. Clasificar defecto funcional, barrera de usabilidad o mejora evolutiva. |
| DESIGN | Propuesta mínima, reversible y compatible con los contratos existentes. Fijar los criterios de aceptación y las dependencias antes de implementar. |
| IMPLEMENT | Cambio autorizado en rama y worktree propios. Reutilizar navegación, historial, persistencia y componentes existentes. |
| TEST | Prueba dirigida del defecto, regresiones relevantes, teclado, lector cuando corresponda y tamaños representativos. Probar alcanzabilidad sin auto-scroll cuando el control deba estar a la vista. |
| CAPTURE | Capturas antes/después y trazas con la misma tarea y datos. Identificar qué cambió entre versiones y qué comprobaciones son solo emuladas. |
| CRITIQUE | Revisar jerarquía, comprensión, errores, continuidad, accesibilidad y rendimiento percibido. Comparar evidencia y criterios; registrar lo que aún falta. |
| CORRECT | Corregir únicamente el delta autorizado y verificar las regresiones afectadas. |
| HUMAN REVIEW | Revisión del propietario o personas designadas en dispositivos acordados. Registrar aceptación o pendiente explícito por SHA y alcance. |

Observar descubrimiento, número de acciones, jerarquía, nombres, foco y señales de progreso. Revisar estados vacíos, errores, bloqueos, cancelación, Deshacer/Rehacer, cambios de proyecto y de vista, recarga, persistencia y salida por teclado. Si un paso no aplica, justificarlo. Contar acciones y medir tiempos solo con procedimiento y entorno reproducibles. Distinguir clic de aplicación, elección de archivo y acciones del sistema. Registrar si la herramienta desplaza o enfoca un control automáticamente.

## Gate propuesto de aceptación UX

- El recorrido y los escenarios alternativos tienen evidencia vinculada al SHA, incluido quién cambió qué y en qué punto puede recuperarse.
- La herramienta es localizable dentro del flujo de trabajo. Los controles principales tienen nombres claros, orden de foco útil y estados deshabilitados comprensibles. No depender solo del color, un icono o un tooltip.
- El cambio confirma su resultado y separa los estados pendiente, aplicado, cancelado y fallido. Si admite reversión, la persona puede encontrarla y entender cuándo deja de estar disponible.
- Cada bloqueo tiene una causa en lenguaje cotidiano, una ubicación cuando procede, una acción de recuperación y una salida segura. Comprobar con datos reales o sintéticos representativos que el mensaje describe el estado de los datos y que la persona puede seguirlo.
- La interacción se valida en ordenador, tableta y móvil. Cubrir teclado, foco visible, contraste, nombres accesibles, mensajes de estado y tamaño de objetivos. Identificar comprobaciones emuladas y validación física pendiente.
- Adjuntar evidencia visual antes/después, regresiones funcionales y pruebas dirigidas de escenarios alternativos. Registrar todo pendiente explícitamente. La aceptación final requiere revisión humana, incluso cuando los checks técnicos estén verdes.

## Registro y prioridades

Por hallazgo, registrar flujo, evidencia, problema, impacto, severidad, propuesta, dependencias, esfuerzo aproximado y criterios de aceptación. Referenciar IDs del catálogo solo cuando corresponda, sin duplicar su estado ni crear IDs en una auditoría.

- **Crítico funcional** — pérdida o corrupción de datos, exposición, operación insegura o resultado incorrecto sin salida fiable. Elevar a la puerta técnica y pedir autorización específica.
- **Barrera de usabilidad** — tarea clave difícil de descubrir, alcanzar o comprender, o sin recuperación visible. Priorizar por frecuencia, impacto, seguridad y facilidad de resolución.
- **Mejora evolutiva** — aumento de comodidad o capacidad sin afectar el contrato observado. Planificar en un corte separado.

## Incorporación propuesta

Tras aprobación, referenciar esta página desde AGENTS.md, CLAUDE.md, el protocolo multiagente y el maestro de continuidad. Los cuatro documentos de entrada enlazan al mismo archivo. El inventario y el roadmap de 17 flujos se conservan en el expediente UX‑FIRST del commit local 1556c87. En cada intervención prevista revisar los bloqueos de los IDs que cubre ese flujo y acreditar la tercera regla antes de cerrar el corte. El piloto es OP‑04. El [patrón Perla de mensajes contextuales](../technical/smoothui-perla-op04-ux.md#mensajes-contextuales-de-perla) se adopta progresivamente en los 17 flujos y 98 IDs.

## Adenda · Uso de donantes

El donante aporta patrones de interacción contrastables. Perla conserva los tokens, componentes y tecnologías del producto. Antes de adaptar, registrar commit, ruta, blob, licencia, patrón, dependencias, riesgos y pruebas. Si se copia código o un recurso, conservar atribución y licencia aplicable. La comparación visual identifica qué parte del diseño explica la tarea sin mediación.

Probar que los controles estén alcanzables en la primera posición visible, antes de que el test desplace o enfoque por el usuario. Para acciones de reversión, verificar que la propuesta antigua caduca cuando cambia el último paso, el nivel o el proyecto. Repetir en ordenador, tableta y móvil en ambas orientaciones. Medir el visor en reposo y probar interrupción o cancelación. Documentar aparte la revisión humana y con tecnología de asistencia real.

Adoptar una interacción compartida cuando la misma necesidad se haya observado en distintos recorridos. El [registro de SmoothUI y plan Perla](../technical/smoothui-perla-op04-ux.md) organiza su uso por cortes. Las tres reglas de oro y el gate humano se aplican a todo el recorrido, no a cada animación por separado.

## Foco por intención · decisión permanente del propietario (23/11/2026)

Cuando la persona elige una tarea, la interfaz se concentra en esa tarea y baja el ruido del resto. Es la cuarta regla de este protocolo y se aplica junto a las tres reglas de oro. La mantiene UX-312 (Claude Code 1); Codex la audita.

**Qué se prioriza, por este orden:**
1. El resultado o la escena relevante.
2. La acción principal.
3. Las herramientas necesarias.
4. El contexto imprescindible.
5. Los controles secundarios, solo cuando se piden.

Lo demás se pliega o pasa a segundo plano. Siempre de forma reversible y **sin eliminar capacidades**: cada herramienta plegada conserva una entrada visible para recuperarla.

| Aspecto del contrato | Regla |
|---|---|
| Estado de tarea | La tarea activa se deriva del estado que ya existe (área de trabajo, modo, diálogo o paso abierto). **No se crea un segundo router ni un estado global nuevo** sin justificar una necesidad real |
| Jerarquía de controles | Una acción dominante por estado (relleno petróleo); el resto, secundarias (contorno) o terciarias (texto). Ver [principios visuales](../product/premium-ux-design-2026-10-20.md#2-principios-visuales-y-de-interacción) |
| Paneles | Se abre lo que la tarea necesita y se pliega lo accesorio. La persona no debe cerrar varios paneles para hacer lo que ha elegido. Patrón de paneles: [editor-ux-pattern §3](../product/editor-ux-pattern-2026-10-19.md#3-patrón-compartido-de-paneles) |
| Visibilidad contextual | Lo plegado indica qué contiene y cuántos elementos tiene (por ejemplo, «Opciones de Diseñar · 7 herramientas») |
| Recuperación reversible | Todo lo plegado se recupera en un paso. La cajonera de las cinco fases tiene un cajón abierto a la vez, «Cerrar», Escape y foco devuelto |
| Foco | Al abrir una tarea, el foco va a su primer control útil; al cerrarla, vuelve al control que la abrió. Mover un nodo del DOM le quita el foco: no se recolocan contenedores con foco (lección de F3b.1) |
| Teclado | Tab en orden visual; Escape cierra el nivel abierto más interno y no la tarea entera; Intro y Espacio activan |
| Táctil | Objetivos de 44 px como mínimo, medidos con la animación terminada y sin redondeo; la acción principal queda al alcance del pulgar |
| Selección | Cambiar de herramienta o de panel no pierde la selección del proyecto |
| Continuidad | Cerrar un módulo devuelve a su origen: ver [navegación continua](../product/editor-ux-pattern-2026-10-19.md#8-navegación-continua-y-retorno-al-origen-ux-312-v3) |
| Preferencias | Se guardan solo cuando están autorizadas (p. ej. `huxing-panes`); nunca dentro del proyecto |
| Cambios sin guardar | Antes de salir se avisa y se ofrece guardar, descartar o seguir |
| Estados | Vacío, pendiente y bloqueado dicen qué falta, por qué y el siguiente paso (tercera regla de oro) |

**Ejemplos por tarea:**

| Tarea | Se prioriza |
|---|---|
| Diseñar | Construcción y edición |
| Amueblar | Catálogo y propiedades del objeto |
| Medir | Cotas |
| Presentar | La escena y los controles mínimos |
| Entregar | Las opciones del entregable elegido ([contrato de Entregar](../product/professional-client-experience-2026-10-21.md#12-contrato-de-entregar-ux-312-v3)) |
| Mi estudio | Marca, identidad, preferencias y personalización |
| Asistente | La consulta, con su modo real (consulta guiada o IA generativa) y sus límites visibles |
