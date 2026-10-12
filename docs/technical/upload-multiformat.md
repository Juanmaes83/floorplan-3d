# Subida multiformato: «Subir plano»

Fecha: 12-10-2026. Rama `claude/subir-plano-multiformato`. Origen: [auditoría de importación](https://github.com/Juanmaes83/lab-astra-sept-2026/blob/claude/magical-albattani-r7j27x/docs/10-AUDITORIA-IMPORTACION-PLANOS-FLOORPLAN.md) sobre la preview `claude/phase-c-safe-variants`.

## Experiencia
- **Un único control visible**: «Subir plano» en la cabecera. «Archivo» ya no tiene «Importar proyecto JSON» ni «Cargar imagen de plano». Las entradas internas `#fileIn` y `#traceImageFile` siguen existiendo para los flujos de «Nuevo proyecto» y «Plano propio».
- **Arrastrar y soltar** en cualquier punto de la página. Aparece un aviso «Suelta el plano…» y, si se sueltan varios archivos, se usa el primero y se avisa.
- **Formato por contenido**: `FloorPlanIntake.sniff` lee las firmas de los bytes (`%PDF-`, PNG, JPEG, `RIFF…WEBP`, GIF, BMP, `II*`/`MM*`, `ftyp` HEIC/AVIF, `PK`, `AC10xx`, `ISO-10303-21`, `SECTION` DXF, `<svg`, JSON). La extensión no decide nada. Solo distingue un USDZ de un ZIP.
- Mensajes en español en cada caso: qué se ha hecho (página del PDF, ppp, reducción aplicada, muros detectados) y el siguiente paso (calibrar, revisar).
- Todo ocurre **en el navegador**: no se sube nada a ningún servidor.

## Rutas por formato
| Detectado | Ruta |
| --- | --- |
| PNG/JPEG/WebP que F1b acepta tal cual | `addImage` con los **bytes originales** (mismo SHA-256) |
| PNG/WebP con EXIF, JPEG espejado (2/4/5/7), > 8000 px o > 15 MiB | `createImageBitmap(imageOrientation:'from-image')` → canvas blanco → reducción uniforme (≤ 8000 px, ≤ 40 MP) → PNG; si pasa de 15 MiB, JPEG 0,92/0,8/0,65 |
| GIF (primer fotograma), BMP, AVIF | Igual que la fila anterior |
| PDF | pdf.js (build legacy): selector de página si hay varias, render a 300 ppp limitado por los topes, sin `eval` |
| HEIC/HEIF | heic2any → PNG |
| TIFF | UTIF (+ pako) → RGBA → canvas; tope de 150 MP antes de decodificar |
| SVG | `<img>` (sin ejecución de scripts) a 4000 px en el lado mayor |
| DXF ASCII | dxf-parser → `dxfToProject`: unidades `$INSUNITS` (mm, cm, dm, m, in, ft; sin unidades se asume mm y se avisa); capas de muros por nombre (`mur`, `wall`, `tabique`, `pared`, `fachada`…) o todas las líneas si no hay; las caras paralelas a 50–600 mm se convierten en un eje con el grosor medido; los ejes terminan a media distancia entre caras para que las esquinas casen; los bloques de puertas y ventanas se cuentan |
| RoomPlan CapturedRoom JSON | `roomPlanToProject`: muros desde `transform` (columna mayor) y `dimensions`; puertas, ventanas y huecos sobre el muro más cercano (≤ 300 mm) |
| JSON/ZIP de proyecto | Flujos existentes (`importProjectFile`, `importZip`) |
| DWG, DXF binario, IFC, STEP, USDZ, GeoJSON | Rechazo **con la exportación recomendada** (p. ej. DWG → DXF con AutoCAD u ODA File Converter) |

Los proyectos DXF y RoomPlan se crean como **nuevo proyecto** de la biblioteca, sin perder el actual. Sus muros llevan `source.method='imported'` y `review='unreviewed'`. La escala queda `confidence:'estimated'`, `method:'declared-ratio'`, con una nota de procedencia: el esquema solo reserva `real` para una calibración verificada.

## Exportación
«Exportar plano» genera un **ZIP** (JSON + imagen original) cuando el proyecto tiene `sourceImages`, y JSON en el resto de casos. Con esto se corrige la pérdida silenciosa de la imagen de fondo.

## Correcciones de la auditoría incluidas
- Cabecera en español sin escala original: «Superficie útil aprox. … · Unidades: mm» (la regex de la traducción ya no exige `1:60`).
- «3 dormitorios · 2 salones · 2 baños · Plano de referencia» solo se muestra con el plano de referencia.
- Mensajes de importación JSON traducidos: tamaño, JSON roto, JSON que no es un proyecto y sufijos de migración.
- Confirmación (toast) al cargar un plano.

## Verificación
- `tests/plan-intake.test.cjs`: detección de 12 formatos por contenido (también con extensión falsa), límites de reducción, DXF con unidades y capas, RoomPlan.
- `tests/upload.browser.test.cjs` (Chromium): botón único y su idioma, conversión de HEIC, TIFF, BMP, GIF, JPEG espejado, PNG con EXIF, SVG, escaneo de 9000 px y PDF de 1 y 2 páginas (cancelar conserva el proyecto); DXF y RoomPlan; JSON con extensión `.txt`; mensajes para DWG, IFC y JSON roto; arrastrar y soltar; exportación ZIP.
- Los proyectos generados por DXF y RoomPlan validan contra `project-schema.js` con el oráculo independiente `jsonschema` (0 errores).

## Límites y pendiente
- **DXF**: solo LINE, LWPOLYLINE y POLYLINE. Los arcos y bloques de puertas y ventanas se cuentan, pero los huecos aún no se colocan sobre el muro. Las estancias no se generan. Revisión humana obligatoria.
- **RoomPlan**: experimental; validado con un fixture sintético que sigue la estructura CapturedRoom (Codable). Falta validarlo con un escaneo real de iPhone.
- **IFC**: siguiente paso con `web-ifc` (MPL-2.0): IfcWall, IfcDoor, IfcWindow, IfcSpace → muros, huecos y estancias.
- **DWG**: no se abrirá en el navegador. Opción de servidor: ODA File Converter (licencia propia). LibreDWG queda descartado en el SaaS por GPL.
- **Reconocimiento automático de muros en imagen**: la asistencia F2 sigue siendo experimental (solo horizontales y verticales) y siempre una propuesta revisable. Una mejora con un modelo tipo CubiCasa5k requiere servidor y decisión de producto.
- Los PDF vectoriales se rasterizan: todavía no se leen sus vectores como geometría exacta.
