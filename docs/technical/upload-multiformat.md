# Subida multiformato: «Subir plano»

Origen: 12-10-2026, rama `claude/subir-plano-multiformato` en `878cc7441e164b43b20f1c905db76d9e1cc144ee`. Integración candidata: 13-10-2026, `feat/multiformat-guided-import`, sobre master `3fdbc0f34db9b545e5a2d4b037a66bcf841e23e4`. Origen: [auditoría de importación](https://github.com/Juanmaes83/lab-astra-sept-2026/blob/claude/magical-albattani-r7j27x/docs/10-AUDITORIA-IMPORTACION-PLANOS-FLOORPLAN.md).

## Experiencia
- **Un único control visible**, «Subir plano», en la cabecera. Se puede usar también **arrastrar y soltar** en cualquier punto de la página. «Archivo» conserva Importar proyecto JSON y ofrece Subir plano o proyecto conectado al mismo selector multiformato. La bienvenida y el buscador usan ese selector; no se duplica el CTA de #34.
- **El formato se detecta por el contenido** (`FloorPlanIntake.sniff`), nunca por la extensión.
- Todo ocurre en el navegador: no se sube nada a ningún servidor. Las librerías se sirven desde `vendor/` y se cargan solo cuando hacen falta.
- Cada importación crea un **nuevo proyecto** en la biblioteca y conserva el actual. Los mensajes resumen lo obtenido: muros, puertas, ventanas, estancias y elementos sin muro cercano.

## Ensamblaje común (DXF, PDF vectorial, IFC, RoomPlan y detección en imagen)
`FloorPlanIntake.assemble` convierte muros (eje + grosor) en un plano completo:
1. **Caras → muros**: en los dibujos de doble línea, dos caras paralelas separadas 50–600 mm forman un muro con su eje y su grosor medido. Los extremos del eje quedan a media distancia entre las caras para que las esquinas casen.
2. **Limpieza**: se descartan los remates (jambas y testas cortas sin pareja) y los muros duplicados contenidos en otro. Los extremos se prolongan hasta el eje del muro que tocan (uniones en T y esquinas).
3. **Huecos**: dos tramos colineales de grosor parecido separados 0,45–2,7 m se fusionan en un muro con un hueco.
4. **Puertas y ventanas sobre su muro**: la evidencia (bloques CAD, arcos de barrido, líneas de vidrio, elementos BIM, `parentIdentifier`) se proyecta sobre el muro más cercano. Si coincide con un hueco, lo clasifica; si no, crea un hueco nuevo con su ancho real.
5. **Estancias**: caras cerradas del grafo de ejes. El polígono se desplaza hacia dentro medio grosor de cada muro, de modo que queda en las **caras interiores**, como exige el esquema. El nombre sale del texto contenido en la estancia (se ignoran los textos con cifras, como las superficies) o de `IfcSpace` o de las `sections` de RoomPlan.

Todo lo importado lleva `source.method='imported'` (o `'suggested'` en la detección sobre imagen) y `review='unreviewed'`. La escala queda `estimated` con una nota de procedencia, porque `real` exige una calibración verificada.

## Rutas por formato
| Detectado | Ruta |
| --- | --- |
| PNG/JPEG/WebP aceptados por F1b | `addImage` con los **bytes originales** |
| PNG/WebP con EXIF, JPEG espejado, > 8000 px o > 15 MiB; GIF, BMP, AVIF | Decodificación con orientación → reducción uniforme (≤ 8000 px, ≤ 40 MP) → PNG o JPG |
| PDF | pdf.js (build legacy). Selector de página. Si la página tiene ≥ 8 trazos vectoriales se ofrece **«Importar muros con medidas»**, con la escala detectada en el rótulo («ESCALA 1:50», «E 1/100») y editable, o **«Usar como imagen»** (300 ppp) |
| PDF vectorial | `pdfVectorExtract` (lista de operadores con la transformación acumulada) → los rectángulos rellenos alargados son muros; los trazos gruesos se emparejan como caras; los cuartos de círculo son puertas; las líneas finas que cruzan un hueco son ventanas; el texto de la página da nombre a las estancias. Medida = puntos × 25,4/72 × escala |
| HEIC/HEIF, TIFF, SVG | heic2any; UTIF + pako; `<img>` sin scripts |
| DXF ASCII | dxf-parser → unidades `$INSUNITS`; capas de muro por nombre; bloques `INSERT` de puertas y ventanas (huella del bloque con escala y rotación, contando solo la parte barrida de los arcos); arcos de 90° de 0,5–1,3 m como barridos de puerta; TEXT/MTEXT para nombrar estancias |
| IFC 2x3/4 | web-ifc (WASM) → muros por **rectángulo de área mínima** de su huella (exacto para muros rectos y robusto ante los huecos); huecos desde `IfcOpeningElement` con el tipo de su relleno (`IfcRelFillsElement`: puerta o ventana) y **antepecho y altura reales**; estancias desde `IfcSpace` (contorno inferior exacto, también no convexo); altura de muro del modelo. Con varias plantas se importa la que tiene más muros y se avisa |
| RoomPlan CapturedRoom JSON | `transform` plano (16) o anidado (4×4); `parentIdentifier` sitúa cada puerta o ventana en su muro; antepecho a partir de la altura del escaneo; `sections` (livingRoom, bedroom, kitchen, bathroom, diningRoom) dan nombre a las estancias |
| JSON/ZIP de proyecto | Flujos existentes |
| DWG | Mensaje con la **versión de AutoCAD detectada** y la exportación a DXF (AutoCAD u ODA File Converter) |
| DXF binario, STEP, USDZ, GeoJSON | Mensaje con la exportación recomendada |

## Detección en imagen («Plano propio» → «Detectar muros y estancias»)
Disponible con una imagen **calibrada** y un plano vacío. Analiza la imagen a ≤ 2000 px:
- Un píxel cuenta como muro si es oscuro **y** su trazo tiene grosor mínimo en la dirección perpendicular. Así se ignoran textos, cotas, mobiliario y vidrios.
- Las bandas de grosor uniforme entre 50 y 600 mm y de al menos 300 mm de largo son muros.
- El ensamblaje común aporta huecos y estancias.

El resultado es una **propuesta** (`suggested`, `unreviewed`) que se aplica en un solo paso deshacible. No clasifica los huecos como puerta o ventana. Solo detecta muros horizontales y verticales.

## Exportación
Archivo conserva **Exportar plano JSON**, sin convertirlo silenciosamente a ZIP. Plano propio y la guía conservan la exportación ZIP con imagen; el JSON no incluye los bytes de las imágenes. Los proyectos JSON/ZIP se importan como una nueva entrada local, incluso cuando su ID de documento coincide con otro. Se preserva el ID portable y la entrada de biblioteca sigue siendo independiente.

## Verificación
- `tests/plan-intake.test.cjs` (11 tests):
  - detección de formato por contenido;
  - reducción de imágenes;
  - DXF con dos estancias, puertas (bloque y arco), ventana y nombres;
  - unidades;
  - IFC con huecos reales y espacios;
  - PDF vectorial a dos escalas y con escalas ambiguas;
  - RoomPlan plano y anidado con `parentIdentifier` y `sections`;
  - bandas ráster con vidrios en el hueco;
  - versiones de DWG.
- `tests/upload.browser.test.cjs` (8 tests en Chromium):
  - botón único e idiomas;
  - todos los formatos ráster y documentales;
  - PDF de dos páginas;
  - DXF, IFC y RoomPlan con puertas, ventanas y estancias;
  - PDF vectorial (diálogo, escala detectada, opción imagen y botón principal legible);
  - detección en imagen (bloqueada sin calibrar, propuesta, bloqueada con muros y deshacer);
  - arrastrar y soltar;
  - ZIP.
- Fixtures en `tests/fixtures/intake/`, generados con herramientas de referencia: ezdxf (DXF R2010 con bloques), IfcOpenShell (IFC4 con huecos y espacios), reportlab (PDF vectorial con relleno y con doble línea), Pillow y pillow-heif.
- Los proyectos generados validan contra `project-schema.js`.

## Límites conocidos
- **RoomPlan**: la estructura sigue la codificación `Codable` de `CapturedRoom` documentada por desarrolladores. **Falta validarlo con un escaneo real de iPhone.** Los suelos (`floors`, iOS 17) no se usan, porque la semántica de `polygonCorners` no está confirmada.
- **DWG**: no se puede abrir en el navegador. Convertirlo en un servidor con ODA File Converter requiere infraestructura y aceptar su licencia: es una decisión de producto pendiente. LibreDWG queda descartado en el SaaS por GPL.
- **PDF vectorial**: depende de cómo exporte cada programa CAD. Si se detectan menos de 3 muros, se ofrece la importación como imagen. Los textos convertidos en curvas no dan nombre a las estancias.
- **DXF**: solo LINE, LWPOLYLINE y POLYLINE (no SPLINE, HATCH ni XREF). Las puertas se reconocen por bloque o capa con «puerta/door» o por arcos de 90° de 0,5–1,3 m.
- **Detección en imagen**: solo muros ortogonales y bandas de grosor uniforme. Los huecos no se clasifican.
- Todo resultado importado es una base para revisar; ninguno sustituye una medición profesional.

## Integración con guía y navegación

La publicación de un proyecto valida el documento antes de una escritura atómica: conserva el proyecto visible anterior y añade la nueva entrada. Los blobs preparados por una importación cancelada se retiran. El guardado fallido no cambia la entrada activa.

La operación captura entrada local, revisión del documento y navegación. Inicio, Atrás y Cancelar invalidan la operación; el resultado tardío no sustituye el proyecto ni reabre un diálogo PDF. Una cancelación permite iniciar otra importación; la primera no puede finalizar sobre ella. La detección experimental usa también entrada/revisión/navegación, sin dar por distintos proyectos con el mismo ID.

La guía se inicializa como proyecto propio por entrada local, sin heredar pruebas 3D/PNG de otra entrada. Imagen cargada, escala confirmada, geometría y guardado se calculan con resultados reales. Un archivo vectorial no se trata como imagen ni se marca su escala estimada como confirmada. Los proyectos con imágenes mantienen sus tareas de calibración y comprobación.

El cambio del menú antiguo se revisa expresamente: se descarta eliminar los accesos de Archivo y cambiar su exportación JSON a ZIP automático. Esos recorridos se preservan y se comprueban en las regresiones.

Verificación y revisión pendientes de integración: [QA de esta entrega](../qa/multiformat-integration-2026-10-13.md). Las capturas heredadas de `artifacts/upload-multiformat` corresponden al 12-10-2026; no son evidencia del HEAD final reconciliado.
