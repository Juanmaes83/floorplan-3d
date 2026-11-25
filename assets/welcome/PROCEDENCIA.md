# Procedencia de las imágenes de la Home (UX-312)

| Archivo | Origen | Uso |
|---|---|---|
| `caso-plano.webp`, `caso-3d.webp`, `caso-presupuesto.webp`, `caso-entrega.webp` | Capturas reales de RUBIK con la vivienda de ejemplo (lámina, vista 3D, Presupuestar y archivo para el cliente), hechas con Playwright sobre la rama UX-312 | Prueba del caso y «Qué recibe tu cliente» |
| `entregas/D1, D3, D5, P1, P2, P5, S2.webp` | Salidas reales de RUBIK con la vivienda de ejemplo (ficha de superficies, dossier, E3, presentación, vista 3D, material board, observaciones) | Miniaturas de «Qué recibe tu cliente» |
| `perfiles/arquitectura, inmobiliaria, promotora, reformas, decoracion.webp` | **Imágenes generadas con IA** (Canva, generación de imagen del conector autorizado por el propietario el 23/11/2026). No son personas reales. Recorte de la vista previa de 199 × 150 px | Retratos decorativos de las profesiones, rotulados en la Home como imágenes generadas |
| `perfiles/constructora.webp` | Recorte de `demo-evolucion-4d.webp` (captura real de Evolución de obra) | Constructora: la generación se detuvo por cuota agotada; no se compraron créditos |

**Pendiente del propietario:** el encargo pide fotos editoriales autorizadas de personas reales, con originales en 2K y licencia registrada. Las imágenes generadas NO cumplen ese criterio (ni resolución 2K ni personas reales). Hay que sustituirlas por fotos con licencia cuando se aporten. Basta con reemplazar los seis archivos de `perfiles/`, con el mismo nombre y formato cuadrado.

## Altas de #321 (23/11/2026)

| Archivo | Origen |
|---|---|
| `entregas/D4.webp` | Captura real del Dossier económico profesional de la vivienda de ejemplo, generada por `tests/economic-dossier.browser.test.cjs`. Los precios son los de prueba de esa suite (10 €/unidad), no son tarifas reales |
| `entregas/T2.webp` | Captura real de «Comparar distribuciones» (original frente a variante), generada por `tests/variants-visual.browser.test.cjs` |
| `demo-blueprint-3d.webp`, `demo-despiece-3d.webp` | Capturas de la evidencia e2e de Claude Code 2 (laboratorio `rubik-sculpt-simulator-lab`, rama `claude/bpdp-premium-v2`, commit `9b33d7c`), escena «Proyecto RUBIK · datos reales». Son muestras de laboratorio: el módulo no está integrado y su demo está pendiente de revisión del propietario |

## Altas de UX-312 / PERLA (23/11/2026)

Seis portadas de «Descubre RUBIK en acción» (`en-accion/*.webp`, 960 × 540) y sus muestras. Compuestas sin texto incrustado
a partir de capturas reales de RUBIK con la vivienda de ejemplo, hechas con Playwright CLI sobre Chromium (render por
CPU, SwiftShader) en la rama `claude/vibrant-clarke-woev1u`. Scripts: `portadas-raw*.js` y `portadas-compose.js` del
informe UX-312 (evidencia de la entrega).

| Archivo | Origen |
|---|---|
| `en-accion/recorrido.webp` | Paseo táctil real (teléfono 844 × 390, joystick con el dedo) en el salón: joystick, minimapa con posición y dirección, «Salir del recorrido» |
| `en-accion/video.webp`, `en-accion/recorrido-ejemplo.mp4` | MP4 real (H.264, 1280 × 720, 12,5 s, dos paradas) grabado con «Grabar vídeo» en la presentación. Con render por CPU sale a ~1,5 fps: los fotogramas muestran plano y entrada en el dormitorio, sin el movimiento continuo. **Pendiente:** regrabar en un equipo con GPU |
| `en-accion/comparativa.webp`, `en-accion/muestra-comparativa.webp` | `rubik-vs-cycles.png` del laboratorio (`claude/m03-blender-profesional-cierre`, M03): vista 3D de RUBIK y render de Blender 5.2.1 LTS Cycles (CPU, 128 muestras) con la misma cámara. La portada recorta el salón y el balcón de ambas mitades con el mismo encuadre |
| `en-accion/asistente.webp` | Ilustración editorial `consultora-rubik-v1.png` (generada, persona ficticia; entregada en el encargo UX-312) + captura real de la consulta guiada «¿Cuántas estancias hay?» con su respuesta y su fuente |
| `en-accion/estilos.webp`, `en-accion/muestra-estilos-origen.webp`, `en-accion/estilo-original.webp` | Vista de origen REAL: el Salón de la vivienda de ejemplo preparado por RUBIK (`FloorPlanProjectViews`), 1280 × 656. |
| `en-accion/estilo-nordico.webp`, `estilo-industrial.webp`, `estilo-mediterraneo.webp` | Variantes generadas con un **generador externo** (`gpt-image-2.5`, con la vista de origen como referencia), con autorización del propietario (commit `fd10c619`), 1280 × 656. **No** proceden de Render IA del producto (`api/render.js`), que hoy genera a 1536 × 1024. Ilustran estilos; no acreditan conservación geométrica exacta. |
| `en-accion/entrega.webp`, `en-accion/muestra-lamina|dossier|presentacion.webp` | Lámina, dossier y presentación reales de la vivienda de ejemplo con la firma de demostración «Estudio Demo · firma de ejemplo» |
| `perfiles/constructora.webp` | **Sustituida:** ilustración generada con Canva (conector autorizado por el propietario el 23/11/2026 para estos retratos; medio `MAHbxeO7Kiw`), persona ficticia. Recorte 150 × 150 de la vista previa de 199 × 150. La anterior era un recorte de Evolución de obra |

Pendiente para el «retrato editorial grande»: los originales en alta resolución de los seis retratos (Canva solo entrega aquí la vista previa de 199 × 150; exportarlos exige crear un diseño, que genera de nuevo).
