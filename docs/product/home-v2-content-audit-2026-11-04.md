# RUBIK SOTA — Home V2: auditoría, contenido y diseño de implementación
**Fecha:** 2026-11-04 · **Base auditada:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`
**Estado:** PREPARACIÓN · NO MERGE · NO DESPLIEGUE · SIN CAMBIOS DE UI

## 0. Reglas de coordinación
- No modificar `master`, las ramas de Claude ni las de Kimi.
- PR #166 (Delivery 3D) y PR #161 (borrador legal) no se fusionan hasta que Claude y Kimi terminen y exista un OK expreso del propietario.
- Los cambios Home deberán desarrollarse en otra rama aislada; este documento solo concreta contrato, textos y criterios de aceptación.
- No anunciar funcionalidades en rama/draft, proveedores externos no validados ni precisión constructiva certificada.

## 1. Diagnóstico verificable en base
- La bienvenida está construida desde `js/guide-ui.js::buildWelcome()`; diseño en `css/guided-experience.css`.
- Conservar exactamente las 3 rutas iniciales: `welcomeUpload` (Subir un plano), `welcomeBlank` (Crear desde cero), `welcomeExample` (Probar el ejemplo).
- Ya hay SVG del plano de ejemplo, captura `assets/welcome/example-3d.webp`, selector 2D/3D, botón de recorrido, perfiles profesionales y tarjetas de soluciones.
- La Home prioriza subir, dibujar, amueblar, recorrer; no presenta con suficiente jerarquía análisis territorial/solar, cantidades/presupuestos/BC3, dossier económico ni Story avanzada.
- En CSS, `@media(max-width:600px)` oculta `.welcome-visual`; evaluar mini-demostración móvil en vez de ocultarla.
- `js/professional-workspace-ui.js` ya define navegación Diseñar / Analizar / Presupuestar / Entregar / Mi estudio. Usarla como vocabulario coherente, no introducir un segundo menú.
- La página de bienvenida es parte de la aplicación, no un segundo sitio/stack.

## 2. Propuesta de contenido, en orden

### Hero (primera pantalla)
**Eyebrow:** "Diseño y presentación profesional de viviendas"
**H1:** "Del plano a una propuesta que puedes diseñar, analizar, presupuestar y presentar"
**Subtítulo:** "Importa tu plano o empieza desde cero. Trabaja en 2D y 3D, comprueba los datos del proyecto, prepara mediciones y presupuestos y crea materiales para explicárselo a tu cliente."
**Acciones:** conservar los tres CTA existentes, sin desviar `id`, listeners ni accesos por teclado.
**Prueba visual principal:** el mismo ejemplo real 2D → 3D, con un control accesible; en móvil, variante compacta visible y sin inicializar WebGL en la portada.

### Recorrido por el producto: cinco etapas verificables
1. **Empieza con un plano** — PDF, imagen, DXF, IFC, RoomPlan o proyecto RUBIK cuando el importador soporte la variante concreta; revisar escala/resultado antes de usarlo.
2. **Diseña en 2D y explora en 3D** — estancias, muros, huecos, muebles, acabados y recorrido del modelo existente.
3. **Analiza el proyecto** — superficies, orientación y Solar; parcela/ortofoto/terreno solo cuando el origen de datos y el sitio estén disponibles, siempre orientativos.
4. **Mide y presupuesta** — cantidades, partidas, precios propios/tarifas y BC3 en alcance C1–C4; indicar vacíos/condiciones en lugar de inventar precios.
5. **Presenta y entrega** — Story/escenas, vistas 3D, imágenes, dossier, vídeo, archivo cliente y enlace cuando el flujo esté listo para el proyecto. La visita 3D de PR #166 NO se anuncia como disponible mientras no esté integrada y validada.

### Capacidades de valor en tarjetas breves
- "Plano y modelo conectados" — edición 2D y exploración 3D.
- "El contexto importa" — orientación, sol y emplazamiento cuando hay datos.
- "Números que acompañan el diseño" — cantidades y presupuesto con fuentes explícitas.
- "Explica mejor cada propuesta" — narrativa, vistas, secciones/axonometría dentro de su alcance visual orientativo.
- "Una entrega con tu identidad" — documentación, presentación y compartir según funcionalidades integradas.

### Segmentos
Conservar y actualizar arquitectura, inmobiliarias, promotoras, reformas e interiorismo. Mostrar resultados reales que cada perfil puede obtener. No prometer permisos, normativas, certificaciones ni sincronización multiusuario.

### Etiquetas de estado comercial
- **Disponible:** solo funciones en `master` con QA documentado.
- **En validación:** Render IA B2 y alternativas B8, hasta prueba externa con proveedor; en el editor pueden estar disponibles condicionadas por configuración.
- **En preparación:** visita cliente 3D PR #166, asistente conversacional, DXF export, foto→mueble 3D y generación de plantas. No situarlas en el Hero como servicios en producción.
- **Diferido:** 360 dedicado, salvo decisión futura.

## 3. Diseño visual y UX
- Un único foco visual: comparativa real del mismo proyecto; imágenes raster reales del producto, nada de renders IA presentados como capturas exactas.
- Separar inicio inmediato (3 CTA) de descubrimiento comercial (beneficios) con jerarquía limpia.
- En móvil evitar `display:none` de toda la demostración: un before/after compacto o imagen real accesible, carga diferida, tamaños y compresión comprobados.
- Mantener ES / EN / ZH; traducción completa de nuevo contenido, no mezclar idiomas.
- Reducir texto redundante en tarjetas; usar 5 bloques profesionales de diseño/analizar/presupuestar/presentar/entregar.
- Estados hover/focus/pressed, contraste, alt, `prefers-reduced-motion`, sin scroll horizontal a 390×844 y 844×390.
- La Home no debe disparar servicios IA, compartir archivos ni cargar motor 3D sin acción expresa del usuario.

## 4. Matriz de aceptación mínima
1. Las 3 acciones iniciales conservan comportamiento, IDs, navegación, retorno desde editor y permisos.
2. Comparación visual 2D/3D responde en 1440×900, 390×844 y 844×390; usar la misma geometría y datos de ejemplo.
3. Ningún texto atribuye funciones de PR #166 o proyectos pendientes a `master`.
4. Claims verificables mediante fuente de código y pruebas; evitar expresiones como "exactitud milimétrica", "cumple normativa" o "totalmente automático".
5. ES / EN / ZH completos; auditoría de accesibilidad con teclado, lector y móvil.
6. Sin cambio en schema `FloorPlanProjectV1`, importación, guardado, 3D, Presupuestar ni Entregas.
7. Capturas antes/después, diferencias visuales y browser tests revisables por humano; no confundir variación de píxeles con mejora estética.
8. Sin degradación significativa de primer pintado ni incremento innecesario de peticiones/assets.

## 5. Dependencias y revisión cruzada antes de integrar
- Respetar PR #166: no usar nueva funcionalidad de visita cliente en Home hasta su QA/merge explícito.
- Respetar PR #161: cualquier enlace contractual final requiere revisión jurídica, publicación y aceptación.
- Conciliar el estado FT3D-5/6 con `master`: `docs/product/current-status-2026-10-30.md` sigue describiendo cortes anteriores aunque `master@0f9c6ea` contiene FT3D-6.
- Kimi: rama/alcance todavía no identificados en la revisión; solicitar trazabilidad en fase de integración, no interferir.
- El desarrollo visual requerirá nueva revisión humana, además de QA automática.

**Resultado de este documento:** especificación y textos propuestos; no implica implementación ni autorización de publicación.
