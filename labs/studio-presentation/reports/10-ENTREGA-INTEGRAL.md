# 10 · Entrega integral del profesional al cliente

Ampliación estratégica sobre el mismo proyecto de ejemplo (`prj_reference-home`, revisión `rv1-0f3e96422fd20e08`).

Rama `lab/studio-presentation-e0e1`, cortes E0/E1. Nada de esto toca el producto (`js/`, `css/`, `api/`, `index.html`). Todo vive en `labs/studio-presentation/`.

## 1. Visión

Hoy RUBIK tiene las piezas de una gran entrega:

- vistas 3D;
- Dibujo vivo;
- Render IA;
- recorrido en vídeo;
- Evolución de obra (FT3D-8);
- presupuesto con dos variantes;
- libros PDF.

Pero esas piezas viven en pantallas distintas, y el cliente recibe archivos sueltos.

La propuesta es **una sola entrega, con un relato**:

> **Del dibujo a la casa.** El dibujo (Dibujo vivo) → el modelo medido (vistas 3D, planta, superficies) → el ambiente (imagen IA, siempre junto a su vista y rotulada) → la obra (evolución prevista) → el recorrido → la decisión (presupuesto y hoja de decisiones) → los documentos → la procedencia.

Cada pieza dice **cuánto fiarse de ella**: medida del proyecto, vista del modelo, imagen orientativa o ejemplo ilustrativo. RUBIK no inventa nada. Lo que falta se escribe.

El flujo profesional tiene cuatro pasos: **elegir → personalizar → revisar → entregar**. Hay siete tipos de entrega, que comparten un único contenido:

1. primera reunión;
2. propuesta comercial;
3. dossier técnico;
4. presentación de interiorismo;
5. presentación inmobiliaria;
6. explicación de la obra;
7. documentación integral.

## 2. Qué se ha construido (prototipos funcionales)

| Pieza | Archivo | Para quién | Qué hace |
|---|---|---|---|
| **Experiencia web de cliente** | `out/v3/entrega/index.html` y `tipo-*.html` (7) | Cliente | Carpeta offline de solo lectura. Funciona en escritorio, tableta y móvil, en la reunión o después. Capítulos según el tipo de entrega. Vídeos MP4, imágenes, PDF enlazados. Sin red y sin la interfaz de RUBIK. |
| **Presentación integral (PDF)** | `out/v3/entrega-integral.pdf` (10 págs., A4 apaisado, portada B) | Cliente | La misma entrega para imprimir o adjuntar. Paginación medida (ADR 06). |
| **Hoja de decisiones** | Capítulo de la web y pág. 9 del PDF | Cliente y estudio | Lo que el proyecto deja abierto, derivado de los datos: distribución, cada pavimento, mobiliario sin producto, presupuesto sin revisar, fechas, imágenes IA. Cada línea lleva su estado. |
| **Preparar entrega** | `out/v3/profesional/preparar-entrega.html` | Profesional | Elegir el tipo y ajustar capítulos y documentos. Vista del cliente en vivo, en escritorio, tableta o móvil. Comprobaciones antes de enviar (10). Registro de la entrega en JSON con SHA-256 de cada pieza. Propuesta interna del estudio aparte. |
| **Registro de la entrega** | `out/v3/entrega/entrega.json` | Estudio | Piezas, origen, huella, qué es orientativo y qué no se incluye. |

Regenerar: `CHROME=<chromium> node tools/compose.cjs snapshot out/v3`. Hace falta haber producido antes los activos con `tools/delivery-assets.cjs` (sección 3).

## 3. Activos reales del proyecto (sin capturas de la interfaz)

Todos los activos salen del producto (código de esta rama) en Chromium local, con `/api/*` bloqueado. Ninguno es una captura de la interfaz: solo el lienzo 3D (resto de la interfaz oculto), las vistas preparadas, los dibujos del compositor y las exportaciones del propio producto.

| Pilar | Activo | Cómo se obtuvo | Evidencia |
|---|---|---|---|
| Dibujo vivo | `assets/dibujo-vivo/00-overview.png` | «Presentar mi vivienda» con Dibujo vivo. Fotograma del lienzo en la apertura. | `assets/log-living.json` |
| Recorrido | `assets/recorrido/*.mp4` (55,7 s, 1280×720, H.264) y 4 fotogramas | El botón **«Grabar vídeo»** del producto (FloorPlanTourRecorder) en la misma presentación | `assets/log-living.json` |
| Render IA | `evidence/render-ia/render-ia-{1,2,3}.png` | Las 3 peticiones autorizadas (D7), con el flujo real | `evidence/render-ia/manifest.json`, `trazabilidad.json` |
| Evolución de obra | `assets/ft3d8/*` (vídeo, presentación de solo lectura y manifiesto) | Camino real: ejemplo → biblioteca → Presupuestar → Plan de obra → «Importar plan (JSON)» → Guardar → Ver evolución (`?source=library`) → Entrega | `assets/log-ft3d8.json` |
| Plan de obra | `assets/ft3d8-plan-demo.json` y `.schedule.json` | El plan que construye `js/construction-demo-core.js` para este proyecto, serializado por `FloorPlanConstructionSchedule` | — |

### Hallazgos de producto al producir los activos

1. **Dibujo vivo solo está activo en la parada de vista general.**
   - `presentationLivingDrawingInfo.active=false` en las paradas de estancia, por diseño de C1.
   - «Grabar vídeo» graba el render normal aunque Dibujo vivo esté activado.
   - Por eso **no existe exportación de Dibujo vivo**, ni imagen ni vídeo. Se confirma la limitación conocida.
   - El fotograma de la entrega es una captura del lienzo hecha por el laboratorio.
2. **La demo pública `?demo=obra` no ofrece la entrega.** El CSS oculta `#panel-entrega` y `go()` fuerza la pestaña de evolución.
   - Exportar la obra de este proyecto exige el camino de la biblioteca, con un plan guardado.
   - Al importar el plan de la demo, el producto avisa: «Plan importado de otra revisión del proyecto: revisa sus vínculos». La demo trata los muros como obra nueva, y su huella difiere de la del proyecto guardado.
   - Se guarda igualmente y se rotula en la entrega como **ejemplo ilustrativo, sin presupuesto**.
3. **Con renderizado por software, cada fotograma del lienzo tarda unos 15 s.** No se puede filmar aquí la animación de Dibujo vivo. En un navegador con GPU sí sería posible.

## 4. Correspondencia: un solo proyecto, autoridades distintas (auditoría 1)

`tools/correspondence.cjs` compara elemento a elemento y escribe `evidence/correspondencia/correspondencia.json`. Compara:

- el snapshot de los entregables;
- el ejemplo canónico (`FloorPlanCore.initial()`);
- el proyecto de la demo de obra.

| Conjunto | Id | Estancias, muros, huecos, objetos | Campos comparados | Diferencias |
|---|---|---|---|---|
| Canónico | `prj_reference-home` | 13, 70, 22, 46 | 835 | Solo `name` de 13 estancias: el original está en chino; el snapshot usa el nombre visible en español |
| Demo de obra | `prj_reference-home` | 13, 70, 22, 46 | 835 | Solo `status` de los 70 muros: `existing` en el proyecto, `new` en la demo (obra nueva) |

Conclusión: es **el mismo proyecto**, con geometría, huecos, estancias y objetos idénticos.

Las autoridades son distintas y nunca se mezclan:

- **Superficies, planta y mediciones:** el proyecto, revisión `rv1-0f3e96422fd20e08`.
- **Presupuesto:** precios de prueba de laboratorio (`budget.test`), pendientes de revisión.
- **Plan y vídeo de obra:** ejemplo ilustrativo de la demo, sin partidas.

El caso sintético A (`?lab=1&case=A`) **no aparece en ninguna entrega**.

## 5. Trazabilidad de los Render IA (auditoría 2)

Fuente de la comparación: la miniatura de la vista de origen que se ve en el diálogo real de Render IA (`dialogo-n.png`), cotejada con cada vista del snapshot. Método: reescalado, mejor alineamiento y diferencia media por canal (0–255).

| Render | Vista de origen | Diferencia | Veredicto |
|---|---|---|---|
| `render-ia-2-dormitorio-principal.png` | `view-03-room.png` | 2,3 | Idéntica (ruido de reescalado) |
| `render-ia-3-vista-general.png` | `view-01-overview.png` | 3,1 | Idéntica |
| `render-ia-1-salon.png` | `view-02-room.png` | 29,6 (búsqueda libre: 17,1) | **Misma estancia y encuadre, no la misma imagen**: la vista enviada se preparó de nuevo en esa sesión y no se conservó |

Cómo se presenta: la entrega empareja cada render con su vista y escribe la diferencia.

- Dormitorio principal y vista general: «generada a partir de esta misma vista».
- Salón: «a partir de otra vista del modelo de la misma estancia; añade un dormitorio que no forma parte de esta estancia».

No se inventan metadatos:

- **Se sabe:** estilo «Luz natural»; 1.738 tokens de la imagen 1.
- **No se sabe:** el modelo y el coste por imagen se perdieron y **no se repite ninguna petición**.

Proporciones: las vistas son de 1600×820 y los renders de 1536×1024. La franja que la vista no contiene la completa la IA.

## 6. Minimapa de la visita inmersiva (auditoría 3)

Prueba: `tools/minimap-probe.cjs`, en escritorio y móvil. Mide qué elemento recibe el clic en el botón «Ver/Ocultar plano» y en cada estancia, y prueba ratón, teclado y toque, y si «ir a la estancia» mueve al visitante. Resultados en la sección 9.

## 7. QA

| Pieza | Resultado |
|---|---|
| Presentación integral PDF | 10 páginas. 0 desbordes, solapes, contenido fuera de caja, SVG recortado y peticiones externas. Lint Huashu 0 rojos. Invariante de filas OK. |
| Web de cliente (8 archivos × 3 viewports) | 0 desbordamientos horizontales, imágenes rotas, enlaces rotos, peticiones externas, errores, texto < 12 px y solapes de texto. Vídeos con metadatos (`evidence/entrega/qa/entrega-qa.json`). |
| Preparar entrega (escritorio y móvil) | Al cambiar de tipo o quitar un capítulo, la vista del cliente se actualiza. El registro se descarga con 6 avisos y 15 piezas. 0 peticiones y 0 errores (`evidence/entrega/profesional/preparar-qa.json`). |

## 8. Crítica

### Impeccable

El detector (`detect.mjs`) encontró, antes de corregir:

- **En la web de cliente:**
  - borde lateral de acento;
  - marcadores numerados de sección;
  - 11 frases de cadencia aforística, en su mayoría el aviso «No es una fotografía» repetido en cada estancia.
- **En «Preparar entrega»:**
  - una transición de anchura;
  - una jerarquía tipográfica plana, con 9 tamaños.

Correcciones:

- la nota pasa a una regla superior;
- se quitan los números de capítulo (la navegación ya orienta);
- el aviso se dice una vez y en las estancias se escribe «Vista del modelo del proyecto»;
- se quita la transición;
- la escala tipográfica queda reducida.

**Excepción consciente:** los círculos 1–4 de «Preparar entrega» son los pasos de un proceso, no decoración.

### Open Design · 5 dimensiones (0–10)

| Dimensión | Nota | Por qué |
|---|---|---|
| Coherencia | 8 | Los tokens, la serif para leer y la Inter para datos son los mismos que en los libros PDF. La web y el PDF cuentan lo mismo en el mismo orden. |
| Jerarquía | 8 | Portada con tres cifras con su origen; un capítulo por idea; el presupuesto con la cifra grande y el gráfico al lado. |
| Detalle | 7 | QA a cero. Pendiente: la apertura de Dibujo vivo es un encuadre cerrado sobre el comedor, no la casa entera (es el fotograma real). |
| Funcionalidad | 9 | La misma carpeta sirve en la reunión y después. Los 7 tipos salen de un único contenido. La hoja de decisiones convierte lo pendiente en conversación. |
| Innovación | 8 | Los «tres grados de verdad» (dibujo, modelo, IA) y las comprobaciones antes de enviar no existen hoy en RUBIK ni en las referencias de B1. |

## 9. Estado de los puntos de la auditoría

| # | Punto | Estado |
|---|---|---|
| 1 | No mezclar el caso A con `prj_reference-home` | **Hecho**: correspondencia probada; ningún entregable usa el caso A; autoridades separadas y rotuladas |
| 2 | Render ↔ vista de origen | **Hecho** hasta donde llega la evidencia: 2 idénticas y 1 de la misma estancia, escrito |
| 3 | Minimapa durante la visita | Ver `evidence/minimapa/minimap-probe.json` y el informe 00 |
| 4 | D7 con el resultado real | **Hecho** (`DECISIONES-PENDIENTES.md`) |
| 5 | Credenciales y datos privados | Revisado el repositorio: no hay secretos publicados. El código de acceso sigue en los secretos de red del entorno: **lo debe borrar el propietario** (menú del entorno → Editar → Secretos de red) |
