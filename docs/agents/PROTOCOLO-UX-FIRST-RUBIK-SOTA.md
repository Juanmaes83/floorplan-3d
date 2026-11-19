# Protocolo UX‑FIRST / Flow Audit · RUBIK SOTA

Propuesta del 19 de noviembre de 2026 para aprobación del propietario. Su incorporación hará obligatorio este protocolo para todos los agentes. El [protocolo multiagente](PROTOCOLO-COORDINACION-MULTIAGENTE.md) sigue definiendo roles, permisos y cambios de estado.

## Alcance y responsabilidad

Toda capacidad debe poder descubrirse, entenderse y operarse con seguridad en ordenador, tableta y móvil. Se revisa el recorrido completo desde la intención de la persona hasta la verificación del resultado. El diseño conserva las capacidades profesionales, las autoridades canónicas y los límites acordados. El diagnóstico y la aceptación se vinculan a la versión observada.

El agente que desarrolla el corte lleva su evidencia. Codex mantiene la auditoría transversal y la trazabilidad de hallazgos. El propietario decide prioridades, acepta el resultado humano y autoriza las acciones que correspondan. Cada intervención conserva las autorizaciones separadas de desarrollo, integración, despliegue, activación y gasto.

## Dos reglas de oro

1. **Dejar que el diseño explique.** El nombre de la acción, su ubicación, su estado y la respuesta del producto deben mostrar qué va a pasar, qué ocurrió y cómo corregirlo. La ayuda aporta contexto cuando hace falta.
2. **Si una persona puede usar nuestra plataforma sin ti, será un producto con UI/UX perfecto.** Tratarlo como criterio de autonomía. Entregar la tarea a una persona que no conoce la implementación y observar, sin guiarla, si encuentra la entrada, elige el destino, confirma, comprueba el resultado y se recupera de un error o revierte la acción. Registrar las ayudas que tuvo que pedir y el contexto de la prueba.


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
- La interacción se valida en ordenador, tableta y móvil. Cubrir teclado, foco visible, contraste, nombres accesibles, mensajes de estado y tamaño de objetivos. Identificar comprobaciones emuladas y validación física pendiente.
- Adjuntar evidencia visual antes/después, regresiones funcionales y pruebas dirigidas de escenarios alternativos. Registrar todo pendiente explícitamente. La aceptación final requiere revisión humana, incluso cuando los checks técnicos estén verdes.

## Registro y prioridades

Por hallazgo, registrar flujo, evidencia, problema, impacto, severidad, propuesta, dependencias, esfuerzo aproximado y criterios de aceptación. Referenciar IDs del catálogo solo cuando corresponda, sin duplicar su estado ni crear IDs en una auditoría.

- **Crítico funcional** — pérdida o corrupción de datos, exposición, operación insegura o resultado incorrecto sin salida fiable. Elevar a la puerta técnica y pedir autorización específica.
- **Barrera de usabilidad** — tarea clave difícil de descubrir, alcanzar o comprender, o sin recuperación visible. Priorizar por frecuencia, impacto, seguridad y facilidad de resolución.
- **Mejora evolutiva** — aumento de comodidad o capacidad sin afectar el contrato observado. Planificar en un corte separado.

## Incorporación propuesta

Tras aprobación, referenciar esta página desde AGENTS.md, CLAUDE.md, el protocolo multiagente y el maestro de continuidad. Los cuatro documentos de entrada enlazan al mismo archivo. El inventario y el roadmap de 17 flujos se conservan en el expediente UX‑FIRST del commit local 1556c87.

## Adenda · Uso de donantes

El donante aporta patrones de interacción contrastables. Perla conserva los tokens, componentes y tecnologías del producto. Antes de adaptar, registrar commit, ruta, blob, licencia, patrón, dependencias, riesgos y pruebas. Si se copia código o un recurso, conservar atribución y licencia aplicable. La comparación visual identifica qué parte del diseño explica la tarea sin mediación.

Probar que los controles estén alcanzables en la primera posición visible, antes de que el test desplace o enfoque por el usuario. Para acciones de reversión, verificar que la propuesta antigua caduca cuando cambia el último paso, el nivel o el proyecto. Repetir en ordenador, tableta y móvil en ambas orientaciones. Medir el visor en reposo y probar interrupción o cancelación. Documentar aparte la revisión humana y con tecnología de asistencia real.

Adoptar una interacción compartida cuando la misma necesidad se haya observado en distintos recorridos. El [registro de SmoothUI y plan Perla](../technical/smoothui-perla-op04-ux.md) organiza su uso por cortes. Las dos reglas de oro y el gate humano se aplican a todo el recorrido, no a cada animación por separado.
