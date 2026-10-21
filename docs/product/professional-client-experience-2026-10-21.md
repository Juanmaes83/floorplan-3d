# Experiencia profesional y entrega al cliente — cortes propuestos

Estado: propuesta de producto del 21-10-2026. D-01 define como público inicial inmobiliarias, promotoras y estudios de arquitectura, y como segundo público reformas e interiorismo. La captura aportada por Juanma muestra la bienvenida actual de Rubik con las tres entradas «Subir un plano», «Crear desde cero» y «Probar el ejemplo». La referencia Enviz procede de las capturas y del texto facilitados por Juanma; sus afirmaciones comerciales no son resultados validados en Rubik.

## Cinco líneas de mejora

| Línea | Beneficio para D-01 | Primer corte verificable | Dependencia y límite |
| --- | --- | --- | --- |
| 1. Entrada por perfil | El profesional se reconoce desde la bienvenida. | Selector opcional «¿En qué trabajas?» con arquitectura, inmobiliaria, promotora, reformas e interiorismo. Las tres entradas y las herramientas siguen disponibles para todos. Preferencia local, fuera del JSON. | No inferir necesidades ni cambiar tareas a partir del perfil sin pruebas con usuarios. El corte de orientación de Claude es independiente y puede cambiar la misma bienvenida; reconciliar antes de integrar. |
| 2. Mostrar plano y experiencia | Permite explicar al cliente cómo el mismo proyecto pasa de plano a 3D y presentación. | Un ejemplo curado de una y dos plantas, con acciones explícitas para explorar 2D, 3D y presentación, sin simular una generación automática que no ocurrió. | Reutilizar #51 y #65; comprobar que las vistas se derivan del mismo proyecto y que las medidas orientativas están visibles. No duplicar la guía que Claude está ajustando. |
| 3. Revisión de cliente controlada | El cliente explora y deja observaciones; el profesional decide cambios. | Prototipo de paquete local de revisión con identidad de versión, comentarios anclados a estancia/vista y exportación/importación explícita; solo después diseñar enlaces alojados. | Un enlace web requiere almacenamiento, acceso, caducidad, retirada y política de datos todavía no decididos. No exponer JSON editable ni datos personales en una URL pública por defecto. Un comentario nunca edita el proyecto. |
| 4. Entrega interoperable | El estudio puede seguir trabajando en su software y entregar material identificable. | Inventario real de exportadores: JSON/ZIP y cadena Blender existente; validar un GLB del proyecto y su reapertura en visor independiente antes de ofrecerlo como descarga. | SKP, FBX, USDZ y BLEND no se prometen por aparecer en Enviz. Cada formato necesita geometría, materiales, escala, identidad y prueba de importación propios. El piloto Blender no equivale aún a calidad fotográfica. |
| 5. Asistencia IA opcional | Reduce esfuerzo para encontrar una acción y preparar revisiones concretas. | Primero un asistente contextual de solo lectura que explique estado, evidencia y siguiente paso; evaluar después un borrador de operación estructurada, p. ej. «ensancha la isla 200 mm», con vista previa, validación, aprobación y deshacer. | El MCP local aporta lecturas y diagnóstico, no un motor de edición. Definir proveedor, coste, privacidad, consentimiento y conjunto de operaciones permitido antes de conectar IA. Jamás aplicar cambios silenciosos ni afirmar cumplimiento normativo. |

## Orden y criterio de entrega

1. Esta rama implementa **solo el selector de perfil**. No añade un paso obligatorio ni modifica `FloorPlanProjectV1`, proyectos existentes, presentación, marca o exportadores.
2. Reconciliar con el corte de orientación de Claude sobre el `master` que resulte. Inspeccionar en escritorio, móvil vertical y horizontal que el primer acceso sigue ofreciendo las tres entradas sin desplazamiento horizontal, que elegir perfil se puede omitir, cambiar y recordar en el mismo navegador, y que idioma y teclado funcionan.
3. Prototipar por separado la línea 2 y medir comprensión con inmobiliaria, promotora y estudio. Continuar una línea por PR con contrato, datos de ejemplo, criterios de aceptación y revisión humana. Las líneas 3–5 exigen decisiones de arquitectura antes de prometer producto.

## Decisiones abiertas

- ¿Qué roles se agrupan o se muestran en el lenguaje comercial? Este selector usa cinco opciones visibles para no esconder promotora ni interiorismo bajo otra profesión.
- ¿Quién puede acceder a una entrega de cliente y durante cuánto tiempo? ¿Se conserva el proyecto en el navegador o hay servicio alojado?
- ¿Qué formatos 3D concretos pide primero D-01 y con qué fidelidad mínima?
- ¿Puede enviarse un plano a un proveedor de IA? Si se permite, ¿qué operaciones estructuradas y presupuesto están autorizados?

La prioridad inmediata sigue siendo cerrar y auditar el corte de orientación de Claude. Esta rama no modifica `feat/journey-orientation`.
