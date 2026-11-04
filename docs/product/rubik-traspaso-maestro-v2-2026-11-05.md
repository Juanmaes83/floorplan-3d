# RUBIK SOTA — TRASPASO MAESTRO V2
## Reconciliación global del producto, Home V2, Entregas, IA visual, asistente, servicios premium y roadmap

**Fecha de corte: 5 de noviembre de 2026**

**Repositorio:** https://github.com/Juanmaes83/floorplan-3d

**Objetivo de este traspaso:** actualizar la ventana madre del proyecto RUBIK SOTA / FLOOR PLAN 3D CARACOLA con todos los avances, correcciones, capacidades existentes, nuevas oportunidades, documentación creada y tareas pendientes.

**IMPORTANTE:** no te limites a resumir este mensaje. Lee los archivos indicados, contrástalos con GitHub y elabora un estado global reconciliado, sin perder decisiones anteriores ni volver a programar funciones que ya existen.

---

# 0. REGLAS INNEGOCIABLES

1. NO fusionar ninguna PR sin autorización expresa del propietario.
2. NO modificar \`master\` ni desplegar en producción.
3. Esperar a que terminen Claude y Kimi y a la revisión del propietario antes de realizar la integración conjunta.
4. No sobrescribir ni duplicar trabajos de otros agentes.
5. Verificar siempre el último HEAD y las diferencias reales entre ramas.
6. Distinguir estos cinco estados:
   - Integrado en \`master\`.
   - Validado técnica o funcionalmente.
   - Validado parcialmente, pendiente de revisión humana o comercial.
   - Implementado únicamente en rama aislada.
   - Documentado o propuesto, sin implementación.
7. No confundir un render IA con geometría constructiva válida.
8. No crear un segundo motor geométrico, económico, de presentaciones o de imágenes.
9. No generar costes adicionales de API sin autorización.
10. La auditoría debe respetar las decisiones de producto ya tomadas, pero actualizar aquellas cuya base técnica haya cambiado.

---

# 1. ESTADO REAL DEL REPOSITORIO

## 1.1 Rama principal

**\`master\`**

HEAD verificado:

\`0f9c6ead9732901681498efec326d1ca92e42ffe\`

Contiene capacidades importantes ya integradas:

### Núcleo de producto

- Editor de viviendas 2D y 3D.
- Estancias, muros, huecos y mobiliario.
- Importación de planos en los formatos admitidos por el importador, con diferentes niveles de soporte y validación.
- Edición y exploración del proyecto.
- Exterior básico, fachada y capacidades territoriales.
- Contexto solar y de emplazamiento cuando existen datos suficientes.
- Gestión de proyectos y datos estructurados.

### Fase A — Project-First

A1–A4 cubren:

- Presentación de resultados reales.
- Análisis visual.
- Contexto del proyecto.
- Galería automática.
- Informe solar y territorial.
- Dossier y comunicación profesional.
- Estilos de presentación.

La implementación está integrada; algunos cierres documentales o humanos históricos deben reconciliarse.

### Fase B — Entrega y comunicación

Existe código para:

- Archivo cliente offline.
- Render IA B2.
- Vídeo del recorrido real.
- Compartición mediante enlace.
- Solicitud de servicio «Envíanos tu plano».
- Comentarios y observaciones.
- Moodboard.
- Alternativas visuales IA B8.
- Presentación avanzada.

La validación real de B4 ya se había realizado.

B2/B8 tienen ahora una primera prueba real adicional, detallada en este mensaje.

### Fase C — Economía

C1–C4 están integrados:

- Mediciones y cantidades.
- Presupuesto operativo.
- Costes y fuentes.
- BC3 en el alcance implementado.
- Dossier económico profesional y para cliente.

**Nunca crear otro sistema de presupuesto para el asistente IA.**

## 1.2 Corrección muy importante: FT3D-5 y FT3D-6

Los documentos de estado fechados a finales de octubre son históricos y quedaron desactualizados.

**FT3D-5 — Axonometría y despiece espacial del edificio**

Ya dispone de implementación integrada en el historial de \`master\`, con núcleo, narrativa, interacción y pruebas.

**FT3D-6 — Plantillas profesionales de presentación**

También está integrado.

PR fusionada:

https://github.com/Juanmaes83/floorplan-3d/pull/159

Se integraron plantillas por perfil profesional sobre la infraestructura de presentación existente.

**Por tanto, NO debe volver a planificarse FT3D-5 o FT3D-6 como una funcionalidad todavía inexistente.**

Tareas posteriores:

- Verificar aceptación y regresiones del HEAD actual.
- Revisar FT3D-7: salidas y compartición avanzada de Story.
- Mantener FT3D-8 como familia posterior, salvo nueva decisión.

Documentos técnicos relevantes:

\`docs/product/ft3d-5-axon-exploded-building-contract-2026-11-01.md\`

\`docs/product/ft3d-6-profile-templates-working-contract-2026-11-01.md\`

\`docs/qa/ft3d-6-implementation-2026-11-01.md\`

---

# 2. DOCUMENTACIÓN CREADA EN ESTA FASE

## Rama documental principal

\`docs/rubik-evolution-preparation-2026-11-04\`

HEAD:

\`71bed4b05bdba80bd5cf0895d10e6410a08d1a75\`

Todos los archivos siguientes están dentro de:

\`docs/product/\`

### Documento 1 — Home V2

**\`home-v2-content-audit-2026-11-04.md\`**

https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/home-v2-content-audit-2026-11-04.md

Contiene la auditoría de la bienvenida, contenido propuesto, estructura, nuevas capacidades que deben comunicarse y criterios de aceptación.

### Documento 2 — Programa de evolución

**\`evolution-preparation-gates-2026-11-04.md\`**

https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/evolution-preparation-gates-2026-11-04.md

Contiene las nueve líneas de desarrollo pendientes, dependencias, criterios de aceptación y límites de integración.

### Documento 3 — Auditoría B2/B8 y asistente

**\`ai-agent-b2-b8-technical-audit-2026-11-04.md\`**

https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/ai-agent-b2-b8-technical-audit-2026-11-04.md

Analiza el sistema existente de generación de imágenes, alternativas visuales, guía determinista y MCP.

Es anterior a la primera generación real de OpenAI; complementar con la evidencia posterior.

### Documento 4 — Plan maestro IA

**\`ia-imagenes-asistente-plan-maestro-2026-11-05.md\`**

https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/ia-imagenes-asistente-plan-maestro-2026-11-05.md

Documento principal de personalización de imágenes, escenas habitadas, referencias privadas, asistente IA, arquitectura y roadmap.

Incluye las mejoras IMG-01 a IMG-22.

### Documento 5 — Economía de servicios IA

**\`ia-costes-protocolo-unitario-lotes-2026-11-05.md\`**

https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/ia-costes-protocolo-unitario-lotes-2026-11-05.md

Protocolo de medición, coste por imagen, coste por lote, coste por imagen aceptada, referencias privadas, presupuesto y futuras ofertas.

### Documento 6 — Nuevos servicios premium

**\`ia-servicios-foto-reforma-panorama-360-video-valor-comercial-2026-11-05.md\`**

https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/ia-servicios-foto-reforma-panorama-360-video-valor-comercial-2026-11-05.md

Amplía el producto a:

- Reforma IA desde fotografías reales.
- Análisis fotográfico e ingeniería inversa.
- Panoramas 360°.
- Visitas 360° basadas en modelo.
- Vídeos a partir de imágenes.
- Servicios premium.
- Estrategia de monetización y prioridades.

### Documento 7 — Registro de pruebas

**\`ia-costes-pruebas-registro-2026-11-05.csv\`**

https://github.com/Juanmaes83/floorplan-3d/blob/docs/rubik-evolution-preparation-2026-11-04/docs/product/ia-costes-pruebas-registro-2026-11-05.csv

Primer registro de ensayo. No sustituir los valores desconocidos por ceros ni por estimaciones inventadas.

### Hoja económica complementaria

**\`RUBIK_IA_costes_pruebas_lotes_v2.xlsx\`**

Se creó y entregó en esta conversación. La ventana madre deberá recibir el Excel como archivo adjunto para utilizar sus hojas y fórmulas.

**No está confirmado que el Excel forme parte de GitHub.**

---

# 3. HOME V2 — TRABAJO YA DISEÑADO QUE FALTA IMPLEMENTAR

**Ésta es una omisión importante del traspaso anterior.**

La Home de RUBIK ya recibió una auditoría y propuesta de rediseño. Debemos recuperarla como una de las principales prioridades de producto.

## 3.1 Qué existe actualmente

La bienvenida está desarrollada principalmente en:

\`js/guide-ui.js::buildWelcome()\`

\`css/guided-experience.css\`

Actualmente existen tres rutas fundamentales que deben conservarse:

1. **Subir un plano** — \`welcomeUpload\`.
2. **Crear desde cero** — \`welcomeBlank\`.
3. **Probar el ejemplo** — \`welcomeExample\`.

También existe un ejemplo visual del plano, una captura 3D real, controles de presentación y mecanismos de orientación profesional.

**No cambiar estos identificadores ni romper sus interacciones.**

## 3.2 Qué problema detectamos

RUBIK ha evolucionado considerablemente, pero la Home todavía no presenta adecuadamente todo lo que puede hacer.

Comunica mejor las acciones iniciales de dibujar y explorar que sus nuevas capacidades para:

- Analizar viviendas.
- Evaluar orientación y contexto.
- Preparar mediciones.
- Crear presupuestos.
- Elaborar dosieres económicos.
- Presentar escenas y recorridos.
- Entregar información al cliente.
- Crear imágenes IA en validación.
- Preparar alternativas de diseño.

Esto genera una diferencia entre el valor real del software y el valor que percibe quien entra.

## 3.3 Hero propuesto

**Antetítulo:**

«Diseño y presentación profesional de viviendas».

**Titular:**

«Del plano a una propuesta que puedes diseñar, analizar, presupuestar y presentar».

**Descripción:**

«Importa tu plano o empieza desde cero. Trabaja en 2D y 3D, comprueba los datos del proyecto, prepara mediciones y presupuestos y crea materiales para explicárselo a tu cliente».

Esta propuesta documental sigue pendiente de aprobación final y diseño visual.

## 3.4 Contenido obligatorio de la Home

### A. Demostración principal real

Mostrar una transición reconocible:

**Plano 2D → modelo 3D → presentación real de RUBIK.**

No utilizar una imagen generada por IA haciéndola pasar por captura geométrica exacta del producto.

La demostración debe ser interactiva o comparativa, sin cargar innecesariamente el motor WebGL en la portada.

En móvil debe existir una versión compacta; actualmente parte de la demostración se oculta por CSS.

### B. Los cinco momentos del producto

1. **Empieza con un plano.**
2. **Diseña en 2D y explora en 3D.**
3. **Analiza tu proyecto.**
4. **Mide y presupuesta.**
5. **Presenta y entrega.**

Cada etapa debe explicar un resultado real, no limitarse a listar botones.

### C. Las capacidades profesionales existentes

Dar visibilidad comercial a:

- Modelo y plano conectados.
- Edición de estancias, muros y huecos.
- Materiales y mobiliario.
- Exterior y edificio.
- Orientación y sol.
- Análisis territorial cuando existen datos.
- Mediciones y presupuesto.
- Dossier económico.
- Story y presentación arquitectónica.
- Axonometría y despiece FT3D-5.
- Plantillas profesionales FT3D-6.
- Galería de imágenes.
- Archivo de cliente y opciones de compartición.
- Render IA con su etiqueta correcta de estado.

### D. Segmentos profesionales

Actualizar la comunicación para:

- Arquitectos y estudios técnicos.
- Interioristas.
- Empresas de reformas.
- Inmobiliarias.
- Promotoras.
- Usuarios particulares.

Cada perfil debe ver ejemplos de resultados relevantes.

No crear capacidades ficticias por perfil: la personalización inicial es de comunicación y presentación.

### E. Nuevos servicios IA

La Home V2 debe reservar espacio para presentar:

- Render IA.
- Alternativas de materiales.
- Reforma visual desde fotografía.
- Imágenes con ambientes y personas.
- Servicios premium.
- Asistente IA.
- Panorámicas y vídeo.

**Pero hay una regla esencial:**

Mostrar la etiqueta **Disponible**, **En validación** o **Próximamente** según el estado real.

No anunciar reformas fotográficas, agente conversacional, personas personalizadas o panoramas como servicios terminados.

### F. Resultados comerciales

La Home debe mostrar lo que el profesional puede obtener:

- Imagen de presentación.
- Propuesta antes/después.
- Informe de análisis.
- Presupuesto.
- Dossier.
- Presentación de vivienda.
- Archivo y ficha para cliente.

Priorizar ejemplos reales antes que promesas.

## 3.5 UX/UI y accesibilidad

Exigir:

- Conservación de las tres entradas.
- Diseño responsive.
- ES / EN / ZH.
- Comparador real 2D/3D.
- Navegación por teclado.
- Estados de foco visibles.
- Contraste adecuado.
- Textos alternativos.
- Reduced motion.
- Carga ligera y diferida.
- Sin scroll horizontal en móvil.
- Consistencia con Diseñar / Analizar / Presupuestar / Entregar / Mi estudio.
- Sin introducir un segundo sitio ni un segundo sistema de navegación.

## 3.6 Estado de Home V2

**Especificada y documentada. No implementada ni fusionada.**

Es necesario planificar su desarrollo en rama aislada y coordinarlo con los trabajos activos.

---

# 4. ENTREGAS — CENTRO COMERCIAL DEL PRODUCTO

Otra prioridad ya identificada es convertir el panel Entregas en una experiencia profesional unificada.

No se trata de añadir seis botones, sino de preparar resultados completos para el cliente.

## Contenido previsto

- Presentación 3D.
- Escenas y recorridos.
- Imágenes y renders.
- Galerías.
- Fichas y láminas.
- Mediciones y presupuesto.
- Dossier económico.
- Vídeo.
- Observaciones del cliente.
- Identidad profesional.
- Compartición y descarga.
- Futuros servicios premium IA.

## PR existente

**PR #166 — Delivery 3D Client Experience V1**

https://github.com/Juanmaes83/floorplan-3d/pull/166

Rama:

\`feat/delivery-client-3d-experience-v1\`

Estado verificado: **OPEN / DRAFT / NO MERGED**.

Claude está asociado a esta línea de trabajo.

### Criterios de integración pendientes

Auditar:

- Seguridad del archivo de cliente.
- Acceso, permisos y privacidad.
- Revisión y retirada de enlaces.
- Navegación 3D del cliente.
- Rendimiento móvil.
- Comportamiento offline.
- Compatibilidad con Story.
- Coherencia con presupuestos y galerías.
- Ausencia de regresiones al fusionar.

No construir otro panel Entregas paralelo para los servicios IA.

Las fichas y servicios premium deberán integrarse sobre el sistema que finalmente resulte aprobado.

---

# 5. RENDER IA B2/B8 — LO QUE YA SE HA CONSEGUIDO

## 5.1 Base actual

B2 y B8 son funcionalidades existentes que comparten una única infraestructura.

Archivos:

\`api/render.js\`

\`js/ai-render-ui.js\`

\`js/professional-workspace-ui.js\`

El usuario puede preparar vistas reales, seleccionar una, elegir estilo/acabados, generar un render orientativo y descargarlo.

La generación no modifica el proyecto geométrico.

## 5.2 Configuración real de OpenAI

Proyecto de OpenAI Platform:

**FLOOR PLAN 3D CARACOLA**

Se creó y configuró una credencial restringida para imágenes y se habilitaron los créditos iniciales de prueba.

La recarga automática quedó desactivada.

En Vercel Preview se prepararon:

- \`OPENAI_API_KEY\`.
- \`RUBIK_RENDER_MODEL\`.
- \`RUBIK_RENDER_TOKEN_PREVIEW\`.

La credencial de proveedor nunca debe confundirse con el código de acceso de RUBIK.

## 5.3 Rama aislada de compatibilidad

\`fix/b2-b8-gpt-image-25-compat-2026-11-04\`

https://github.com/Juanmaes83/floorplan-3d/tree/fix/b2-b8-gpt-image-25-compat-2026-11-04

HEAD:

\`7e738ec7bf9c20acd4b5e4b71daf1a68136b4fed\`

Se preparó la compatibilidad con Sunburst y el token específico de Preview.

No se ha integrado esa rama en \`master\`.

## 5.4 QA técnica

GitHub Actions:

https://github.com/Juanmaes83/floorplan-3d/actions/runs/41927791516

**6 tests aprobados, 0 fallos.**

Son pruebas automatizadas del flujo y proveedor simulado; no sustituyen la revisión real de imágenes.

## 5.5 Primer render real

Se ejecutó satisfactoriamente una generación desde RUBIK.

Vista: Salón.

Configuración:

- Premium inmobiliario.
- Porcelánico gran formato.
- Estuco arena.

Resultados:

- Solicitud real completada.
- Mejora visible del fotorrealismo.
- Iluminación y sombras más naturales.
- Materiales enriquecidos.
- Correspondencia visual general con la distribución.
- Comparación original/IA.
- Descarga profesional.

El archivo de entrega observado tiene 1600 × 1000 píxeles.

### Defectos y límites identificados

- Descripción de la imagen exportada truncada.
- No existe garantía de fidelidad métrica del render.
- No se ha probado una matriz amplia de materiales.
- No se ha ensayado sistemáticamente la máxima calidad disponible.
- No existe un control completo de costes, cuotas y lotes.
- No hay todavía instrumentación comercial multiusuario.
- No se ha validado consistencia entre varias imágenes del mismo proyecto.

**Estado correcto: primera prueba funcional con proveedor real satisfactoria; validación comercial y aceptación global pendientes.**

---

# 6. MEJORAS DE PERSONALIZACIÓN DE IMÁGENES PENDIENTES

Estas mejoras ya se documentaron, pero **no están implementadas** en el producto actual.

## 6.1 Materiales y texturas

Ampliar suelo, pared y techo:

- Maderas y formatos de colocación.
- Piedra natural.
- Mármol.
- Porcelánicos mate y pulidos.
- Terrazo.
- Microcemento.
- Revestimientos texturizados.
- Estucos.
- Panelados.
- Pinturas y colores personalizados.
- Materiales de fabricante con referencia autorizada.

## 6.2 Estilos y diseño

Añadir estilos:

- Mediterráneo.
- Escandinavo.
- Japandi.
- Contemporáneo.
- Minimalista.
- Industrial.
- Orgánico.
- Familiar.
- Hotelero.
- Premium inmobiliario.
- Otros presets profesionales.

## 6.3 Iluminación

Controlar:

- Hora del día.
- Luz natural/artificial.
- Temperatura de color.
- Intensidad.
- Sombras.
- Ambiente.
- Escenas nocturnas.
- Iluminación editorial/comercial.

No confundir luz visual generada con cálculo Solar real.

## 6.4 Decoración

Permitir controlar:

- Textiles.
- Alfombras.
- Cortinas.
- Plantas.
- Cuadros.
- Lámparas.
- Accesorios.
- Mobiliario decorativo.

## 6.5 Control del cambio

Modos:

- Fiel al proyecto.
- Equilibrado.
- Creativo.

Debe explicarse el nivel de libertad y la incertidumbre de cada resultado.

## 6.6 Variantes y comparación

Generar alternativas controladas.

Comparar antes/después y varias propuestas.

Seleccionar la versión final para entrega.

Mostrar el coste previsto antes de generar varias imágenes.

## 6.7 Fichas e historial

Conservar información de:

- Vista de origen.
- Acabados.
- Estilo.
- Versión.
- Coste.
- Advertencia IA.
- Estado de aprobación.
- Destino de entrega.

No almacenar información privada innecesaria.

## 6.8 Ubicación UX

**Entregar → Imágenes → Render IA / Estudio de imágenes.**

Interfaz de dos niveles:

- Modo rápido.
- Modo avanzado.

Evitar saturación de controles.

---

# 7. PERSONAS Y ESCENAS HABITADAS

Se identificó una oportunidad de valor: no presentar únicamente la arquitectura, sino también una representación de cómo podría utilizarse el espacio.

## Nivel 1 — Personas genéricas

Escenas con personas realizando actividades cotidianas.

Ejemplos:

- Leer.
- Cocinar.
- Conversar.
- Descansar.
- Trabajar.
- Compartir una comida.

Revisar anatomía, escala, integración y fidelidad espacial.

## Nivel 2 — Fotografías de referencia del cliente

Un profesional podría subir imágenes de personas que hayan autorizado expresamente su uso.

Crear composiciones personalizadas donde aparezcan, de forma orientativa, en el ambiente diseñado.

Requisitos:

- Consentimiento verificable.
- Autorización separada para compartir o animar.
- Tratamiento especial de referencias de menores.
- Eliminación de temporales y metadatos.
- Borrado y retención controlados.
- No usar imágenes sin derechos.
- Etiquetado claro de composición generada por IA.
- Control de coste adicional.
- Revisión de calidad y de representación.

Esta modalidad no debe activarse comercialmente hasta superar revisión de privacidad y seguridad.

---

# 8. NUEVO SERVICIO PRIORITARIO: REFORMA IA DESDE FOTOGRAFÍAS

El propietario ha identificado un servicio comercial de alto valor.

## Funcionamiento

El profesional o cliente aporta imágenes reales de una estancia.

RUBIK permite:

1. Subir fotografías autorizadas.
2. Analizar visualmente superficies y elementos.
3. Seleccionar qué conservar.
4. Elegir materiales, estilos y acabados.
5. Proponer reformas visuales.
6. Mostrar antes/después.
7. Comparar alternativas.
8. Crear fichas y entregas.

## Ubicación

Propuesta:

**Entregar → Estudio de imágenes → Reformar desde foto.**

La Home V2 podrá ofrecer una entrada comercial a este servicio cuando esté validado.

## Distinción esencial

**Foto → reforma visual** y **foto → proyecto 3D editable con medidas** son problemas distintos.

La reconstrucción geométrica necesita medidas y revisión. No afirmar que una foto permite deducir una vivienda completa con precisión.

## Clientes potenciales

- Interioristas.
- Empresas de reformas.
- Profesionales de cocinas y baños.
- Inmobiliarias.
- Promotoras.
- Estudios de arquitectura.
- Usuarios finales.

El servicio permitirá atender encargos incluso antes de disponer de un plano digital.

---

# 9. IMÁGENES 360° Y EXPERIENCIAS INMERSIVAS

La hoja de ruta anterior había diferido el 360°.

**El propietario ha reabierto su estudio porque ahora existe un nuevo caso de uso comercial.**

Diferenciar:

### Panorama conceptual IA

Imagen envolvente de carácter orientativo.

Parte de su contenido puede haber sido inferido por IA.

### Panorama arquitectónico basado en modelo real

Derivado de la geometría 3D existente.

Debe comprobar continuidad, huecos, muebles, perspectivas y cambios de vista.

### Visita interactiva del cliente

Es el servicio que se está desarrollando en Entregas. No duplicarlo ni confundirlo con una única imagen panorámica.

No afirmar que el 360° está implementado por haber podido generar un render convencional.

---

# 10. VÍDEO DESDE IMÁGENES IA

Se propone un nuevo servicio de medio plazo.

## Primera etapa

Vídeos de presentación utilizando imágenes aprobadas:

- Secuencia de imágenes.
- Antes/después.
- Desplazamiento de cámara simulado.
- Transiciones.
- Narración y fichas profesionales.

Reutilizar las herramientas de vídeo y Story existentes cuando corresponda.

## Segunda etapa

Vídeo generativo desde una imagen de referencia.

Medir:

- Coste por segundo.
- Resolución.
- Duración.
- Reintentos.
- Fidelidad temporal.
- Coherencia de la geometría.
- Privacidad.
- Derechos y limitaciones del proveedor.

No presentar estas dos etapas como una funcionalidad ya integrada.

---

# 11. ASISTENTE IA RUBIK — SIGUIENTE GRAN CAPACIDAD

## Estado

La arquitectura del futuro asistente está documentada.

No existe todavía un asistente LLM contextual completo integrado en \`master\`.

La guía determinista y el MCP local son capacidades existentes pero diferentes.

## Objetivo

Ayudar al usuario durante todo el proceso:

- Comprender su plano.
- Consultar habitaciones y medidas.
- Orientarse en el editor.
- Analizar posibilidades.
- Proponer acabados.
- Sugerir cambios geométricos.
- Revisar cantidades.
- Explicar presupuestos.
- Solicitar renders.
- Preparar alternativas y entregas.

## Ubicación

Un asistente contextual dentro de:

**Diseñar / Analizar / Presupuestar / Entregar.**

Una experiencia coherente, no cuatro asistentes incompatibles.

## Arquitectura obligatoria

Usuario → Asistente → servidor autenticado → modelo de lenguaje → herramientas autorizadas → validadores RUBIK → propuesta → vista previa → confirmación → aplicar → deshacer.

## Fases

**AG-1:** consultar sin modificar.

**AG-2:** proponer operaciones tipadas.

**AG-3:** simular, validar y presentar diferencias.

**AG-4:** aplicar solo tras confirmación, con Undo.

**AG-5:** solicitar renders, alternativas y servicios visuales con coste conocido.

## Límites

- Claves API únicamente en servidor.
- Sin ejecución de código arbitrario.
- Sin un nuevo modelo de vivienda.
- Sin un nuevo presupuesto.
- Sin geometría ficticia.
- Sin acciones irreversibles no confirmadas.
- Sin enviar datos privados que no sean necesarios.
- Sin modificar un proyecto mediante instrucciones textuales sin validación.

**Codex es principalmente una herramienta de desarrollo. No sustituye automáticamente al asistente IA del cliente.**

---

# 12. COSTES Y MONETIZACIÓN — PROGRAMA OBLIGATORIO

La primera generación real ya se ha conseguido.

En la pantalla de OpenAI Platform, el propietario mostró un gasto mensual de **0,02 USD** asociado a la clave de imágenes.

Eso constituye evidencia inicial de gasto, pero **no certifica todavía el coste exacto atribuible a la única imagen**.

## Implementar contabilización por petición

Registrar:

- Modelo efectivo.
- Calidad.
- Resolución.
- Imágenes de entrada.
- Tokens cuando estén disponibles.
- Coste de proveedor.
- Duración.
- Error o éxito.
- Reintentos.
- Número de imágenes generadas.
- Número de imágenes aceptadas.
- Coste por lote.

## Diferenciar métricas

**Coste API:** lo que cobra OpenAI u otro proveedor.

**Coste de producción:** API + infraestructura + almacenamiento + trabajo profesional + revisiones.

**Coste por imagen aceptada:** incluir los intentos rechazados y retrabajo.

**Precio premium:** considerar valor profesional, calidad, rapidez, personalización y disposición a pagar.

El objetivo **no es aumentar el gasto en IA**, sino obtener mejores resultados con coste controlado y comercializarlos con márgenes sostenibles.

## Ensayos necesarios

- Render estándar.
- Render de calidad máxima admitida.
- Variación de materiales.
- Tres variantes.
- Pack de cinco estancias.
- Reforma fotográfica.
- Referencias de materiales.
- Personas genéricas.
- Referencias personales consentidas.
- 360° conceptual.
- Vídeo generativo.
- Consultas del asistente.
- Operaciones propuestas por el asistente.

## Seguridad económica

Añadir:

- Estimación previa.
- Confirmación de consumo.
- Presupuesto por operación.
- Cuotas por proyecto o usuario.
- Límite de gasto por lote.
- Parada ante errores.
- Historial de uso.
- Conciliación con Usage/facturación real.

Los precios de paquetes documentados son hipótesis para estudiar, no tarifas aprobadas.

---

# 13. OTRAS CAPACIDADES PENDIENTES QUE NO DEBEMOS OLVIDAR

Además de Home, Entregas e IA, conservamos el programa de evolución previamente aprobado para estudio.

## 13.1 Exportación DXF

Ya existe importación DXF, pero eso **no demuestra exportación DXF equivalente**.

Preparar salida CAD 2D limitada con capas, unidades y pruebas de reimportación.

No prometer DWG, BIM o compatibilidad universal.

## 13.2 Edición conversacional

Permitir instrucciones como:

«Cambia este material».

«Mueve este mueble».

«Propón otra alternativa».

Siempre con operación tipada, validación, vista previa, confirmación y Undo.

Depende del asistente IA y de las autoridades actuales.

## 13.3 Foto → mueble 3D

Piloto para generar o adaptar un modelo visual a partir de fotografías de mobiliario.

Requiere medidas reales aportadas por el usuario, control de escala, colisiones, licencia, peso y rendimiento.

No inventar dimensiones.

## 13.4 Generación paramétrica de plantas

Crear un generador sujeto a:

- Contorno disponible.
- Programa de estancias.
- Superficies.
- Accesos.
- Adyacencias.
- Huecos.
- Restricciones geométricas.

El generador determinista y sus validadores serán la autoridad; la IA podrá ayudar a expresar requisitos y comparar alternativas.

No prometer cumplimiento normativo.

## 13.5 Otras familias de roadmap posterior

Mantener en el registro global, sin presentarlas como prioridades aprobadas para implementación inmediata:

- Instalaciones ligeras del Punto 10.
- Cubiertas inclinadas diferidas.
- Reconocimiento avanzado de planos.
- Captura espacial/LiDAR.
- Interoperabilidad CAD/BIM ampliada.
- Funciones de equipo y colaboración.
- Portal avanzado de clientes.
- White-label.
- FT3D-8 y planificación temporal.
- Mejoras de importación y exportación según alcance verificado.

Para cada una, revisar su decisión original, dependencias y estado vigente antes de reabrir desarrollo.

---

# 14. RAMAS Y PR QUE DEBEMOS CONSERVAR Y AUDITAR

## Legal — PR #161

https://github.com/Juanmaes83/floorplan-3d/pull/161

Rama:

\`docs/legal-rubik-proteccion-extraccion-2026-11-03\`

Estado: abierta, borrador, no fusionada.

Documento:

\`docs/legal/rubik-uso-servicio-ingenieria-inversa-extraccion-y-competencia-borrador-2026-11-03.md\`

Requiere revisión jurídica y comercial.

No tratarlo como términos vigentes.

Además, las nuevas funciones con fotografías de clientes exigen revisar consentimiento, tratamiento de datos, almacenamiento, retirada y uso comercial.

## Entregas — PR #166

https://github.com/Juanmaes83/floorplan-3d/pull/166

Rama:

\`feat/delivery-client-3d-experience-v1\`

Estado: abierta, borrador, no fusionada.

Coordinar con Claude.

## Fidelidad visual — PR #167

https://github.com/Juanmaes83/floorplan-3d/pull/167

Rama:

\`feat/visual-families-hero-fidelity-v2\`

Estado: abierta, borrador, no fusionada.

Revisión humana pendiente según evidencias disponibles.

## Visual Families — PR #164 y #165

https://github.com/Juanmaes83/floorplan-3d/pull/164

https://github.com/Juanmaes83/floorplan-3d/pull/165

Abiertas, en borrador y sin fusionar.

Relacionadas con evidencias y fundamentos de fidelidad visual.

## PR históricas B2/B8

https://github.com/Juanmaes83/floorplan-3d/pull/139

https://github.com/Juanmaes83/floorplan-3d/pull/146

Su estado administrativo continúa abierto, pero existe código B2/B8 en \`master\`.

No deducir que una función es inexistente únicamente porque su PR histórica siga abierta.

## FT3D-6 — PR #159

https://github.com/Juanmaes83/floorplan-3d/pull/159

**Fusionada el 2 de noviembre.**

Este hecho corrige los roadmaps históricos que la describen como futura.

## Trabajo de Kimi

No atribuir resultados o una rama concreta a Kimi sin confirmación de su trazabilidad.

El propietario ha indicado que está trabajando y debe terminar antes de integrar.

No cancelar sus trabajos automáticamente por la oportunidad comercial de Render IA.

Sin embargo, reevaluar qué mejoras visuales son imprescindibles para fidelidad geométrica y qué refinamientos estéticos pueden posponerse.

---

# 15. NUEVA PRIORIZACIÓN INTEGRAL PROPUESTA

La ventana madre debe contrastar el orden anterior con esta nueva oportunidad comercial.

## P0 — Consolidación y seguridad

- Reconciliar HEAD y documentos.
- Terminar revisión de Claude y Kimi.
- Mantener PR sin fusionar.
- Corregir exportación truncada del render.
- Instrumentar costes reales.
- Asegurar claves, cuotas y permisos.
- Definir criterios de aceptación humana.

## P1 — Home V2 y experiencia comercial

- Rediseño de bienvenida existente.
- Mantener las tres rutas originales.
- Actualizar el contenido comercial.
- Mostrar FT3D-5/6 y capacidades realmente integradas.
- Incluir estados correctos de IA.
- Mejorar demo 2D/3D y móvil.
- Adaptar comunicación por perfiles.

## P2 — Render IA avanzado

- Calidad explícita.
- Más materiales y texturas.
- Estilos.
- Iluminación.
- Decoración.
- Intensidad de cambio.
- Variantes.
- Comparadores.
- Costes previos.
- Fichas profesionales.

## P3 — Reforma fotográfica

- Subida de fotografías.
- Reformas antes/después.
- Referencias de materiales.
- Control de conservación.
- Escenarios decorativos.
- Entregas de propuestas.

## P4 — Consolidación de Entregas

- Integración coordinada con PR #166.
- Galería.
- Fichas de imagen.
- Dossier.
- Presupuesto.
- Presentaciones.
- Packs visuales.
- Identidad profesional.
- Enlaces y observaciones.

## P5 — Escenas habitadas

- Personas genéricas primero.
- Después referencias de clientes reales, sujetas a consentimiento y revisión de privacidad.

## P6 — Asistente IA

- Consultas contextuales.
- Herramientas autorizadas.
- Propuestas revisables.
- Confirmación y Undo.
- Orquestación de servicios IA.

Su diseño técnico puede avanzar en paralelo, pero no debe crear un segundo editor.

## P7 — Nuevos formatos

- Panorama 360° conceptual.
- Panorama basado en geometría real.
- Vídeo desde imágenes.
- Vídeo generativo.
- Fichas y narrativas comerciales.

## P8 — Interoperabilidad y automatización geométrica

- DXF export.
- Foto a mueble 3D.
- Foto a espacio editable, si se valida la medición.
- Generación paramétrica de plantas.
- Resto del roadmap técnico priorizado.

**Este orden es una propuesta para reconciliar con el programa global, no una autorización de ejecución automática.**

---

# 16. CÓMO DEBE ACTUALIZARSE LA HOME DESPUÉS DE ESTOS AVANCES

La Home es ahora un elemento estratégico.

Debe comunicar que RUBIK es una plataforma que permite:

**Diseñar → Entender → Presupuestar → Visualizar → Presentar → Entregar.**

Y que está evolucionando hacia:

**Reformar visualmente → Personalizar → Comparar → Habitar virtualmente → Crear experiencias premium.**

No obstante, separar lo ya disponible de lo todavía no implementado.

### Mensajes que debe transmitir

**Para profesionales:** transformar información de una vivienda en propuestas comprensibles y entregables.

**Para reformas/interiorismo:** facilitar decisiones y comparar alternativas.

**Para inmobiliarias y promotoras:** preparar presentaciones comerciales sobre proyectos reales.

**Para particulares:** comprender su vivienda y explorar posibilidades, dentro de las capacidades disponibles.

### Reglas de diseño comercial

- No convertir la Home en un catálogo caótico.
- La demostración del producto debe ser protagonista.
- Mantener tres entradas claras.
- Mostrar beneficios y resultados.
- Usar ejemplos auténticos.
- Diferenciar visualmente el plano/modelo real del render IA orientativo.
- Destacar servicios premium únicamente cuando sean utilizables.
- No prometer precisión, seguridad o resultados que aún no estén validados.

---

# 17. MATRIZ GLOBAL QUE DEBES GENERAR

Solicito una matriz unificada con estas columnas:

1. ID de capacidad.
2. Nombre.
3. Beneficio para el usuario.
4. Perfil de cliente.
5. Estado real verificado.
6. Archivo de código existente.
7. Documento de referencia.
8. Ubicación UX actual o propuesta.
9. Rama y PR responsable.
10. Dependencias.
11. Prioridad revisada.
12. Coste de desarrollo estimable.
13. Coste operativo/API.
14. Criterio de aceptación.
15. Riesgos técnicos y de privacidad.
16. Responsable o agente.
17. Decisión pendiente del propietario.
18. Gate de integración.

Separar los bloques:

- Home.
- Editor.
- Análisis.
- Presupuestos.
- Entregas.
- Story / FT3D.
- Render IA.
- Reforma fotográfica.
- Personas.
- 360°.
- Vídeo.
- Asistente IA.
- DXF.
- Foto a mueble.
- Plantas paramétricas.
- Legal y protección comercial.

---

# 18. ENTREGABLES QUE ESPERO DE LA VENTANA MADRE

## Entregable 1 — Estado técnico reconciliado

Informe actualizado contra el último \`master\`, las PR y la documentación.

Debe corregir explícitamente documentos históricos desactualizados.

## Entregable 2 — Roadmap maestro

Prioridades y dependencias con cortes pequeños y comprobables.

No abrir múltiples ramas largas que se solapen.

## Entregable 3 — Home V2

Recuperar la especificación ya creada.

Preparar arquitectura, contenidos, criterios UX y alcance real.

No volver a empezar su diseño desde cero.

## Entregable 4 — Integración Entregas

Auditar PR #166 y compatibilidad con los servicios de imágenes, vídeo y fichas premium.

## Entregable 5 — Programa IA

Consolidar Render IA, personalización, reforma desde fotografías, escenas habitadas, referencias y asistente.

## Entregable 6 — Economía

Consolidar:

- Coste unitario.
- Coste por lote.
- Coste por imagen aceptada.
- Coste de referencias privadas.
- Coste de vídeo.
- Coste completo.
- Precios premium propuestos.
- Márgenes objetivo.
- Cuotas y límites.

Sin inventar datos históricos.

## Entregable 7 — Legal

Auditar PR #161 e incorporar requisitos de uso comercial, privacidad y fotografías de clientes.

## Entregable 8 — Integración final condicionada

Preparar una secuencia de integración segura para cuando:

- Claude termine.
- Kimi termine.
- Se revisen las PR.
- Se ejecuten pruebas combinadas.
- El propietario dé su OK expreso.

Hasta entonces, **ningún merge**.

---

# 19. PREGUNTAS ESTRATÉGICAS QUE DEBES CONTESTAR

1. ¿Qué mejoras visuales de Kimi siguen siendo imprescindibles si Render IA ya aporta una mejora comercial clara?
2. ¿Qué parte de Home V2 puede implementarse sin conflictos con Entregas?
3. ¿Qué componentes actuales de RUBIK podemos reutilizar para Reforma IA desde fotografía?
4. ¿Qué es viable inmediatamente y qué requiere arquitectura adicional?
5. ¿Cómo evitar que la IA visual genere propuestas que contradigan la geometría real?
6. ¿Qué sistemas de consentimiento, almacenamiento y eliminación requieren las fotografías del cliente?
7. ¿Qué deberíamos medir antes de establecer precios?
8. ¿Cómo ofrecer imágenes, paquetes, vídeos y personalización con costes limitados?
9. ¿Cuál debe ser el primer alcance seguro del asistente conversacional?
10. ¿Qué PR están listas para revisión, cuáles tienen conflictos y cuáles requieren todavía aceptación humana?
11. ¿Qué podemos incluir ya en la Home como disponible y qué debe figurar como en validación o próximamente?
12. ¿Qué tareas ya se implementaron y deben eliminarse del backlog para no duplicar trabajo?

---

# 20. INSTRUCCIÓN FINAL

Quiero que actúes como coordinador técnico y de producto del programa RUBIK.

No empieces a programar ni a fusionar.

**Primero reconstruye el estado global real, conserva los avances realizados y presenta un plan de evolución único, jerarquizado, verificable y comercialmente coherente.**

Debes dar especial importancia a:

1. Home V2 y descubrimiento del valor actual.
2. Consolidación de Entregas.
3. Render IA y calidad/costes.
4. Reforma visual desde fotografías.
5. Personalización, escenas habitadas y referencias.
6. Servicios premium y monetización.
7. Asistente IA con herramientas existentes.
8. Capacidad de expansión hacia 360°, vídeo, DXF y generación paramétrica.
9. Seguridad jurídica, privacidad y protección del producto.
10. Coordinación de Claude y Kimi sin pérdida de trabajo.

**La prioridad es construir un producto profesional de alto valor sin perder la solidez geométrica, la trazabilidad económica ni las capacidades ya integradas.**

Al terminar la auditoría, entrégame:

- La matriz de estado actual.
- Las discrepancias detectadas entre documentación y código.
- El roadmap definitivo propuesto.
- Los principales riesgos.
- Las decisiones pendientes de mi aprobación.

**No ejecutes merges ni gastos API. Espera mi autorización para pasar de planificación a implementación.**