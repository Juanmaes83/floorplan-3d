# Importación multiformato integrada con la guía — candidata, 13-10-2026

## Fuente y alcance

Base: master `3fdbc0f34db9b545e5a2d4b037a66bcf841e23e4`, después de #37. Fuente recuperada: `claude/subir-plano-multiformato` en `878cc7441e164b43b20f1c905db76d9e1cc144ee`. Rama de integración: `feat/multiformat-guided-import`. Se aplicó una combinación de cambios sobre la base vigente, resolviendo los hunks de index.html y tracing-ui.js; no se sustituyeron esos archivos por sus versiones antiguas completas.

Implementación candidata para PR y revisión. El SHA final y la preview correspondiente se registran en la PR y en los resultados del workflow; no se incrusta aquí un SHA propio que cambiaría al editar este registro.

Se recuperan los conversores locales, fixtures, licencias y límites de [la especificación](../technical/upload-multiformat.md). La documentación reconciliada de #37, la guía/navegación #34/#35 y el rescate independiente de #21 se conservan. No se incorpora Casa Serra #36.

## Decisiones de integración

| Límite | Comportamiento candidato | Evidencia a comprobar |
| --- | --- | --- |
| Archivo → proyecto | Validar primero; guardar el original visible y crear una entrada nueva en una sola escritura de biblioteca | Pruebas unitarias de escritura única, IDs iguales y fallo de cuota; recorridos guiados |
| Documento y biblioteca | Conservar IDs portables de JSON/ZIP; la entrada local tiene ID independiente | Importación consecutiva del mismo JSON, conservación de todas las entradas y recarga |
| Guía | Estado propio por nueva entrada; imagen/escala/geometría/guardado derivados de datos reales; no heredar evidencia 3D/PNG | Recorridos de imagen, vector, JSON y ZIP |
| Conversión asíncrona | Capturar entrada, revisión y navegación; comprobar antes de publicar; Cancelar/Inicio/Atrás invalidan la operación | Lectura tardía, conversor tardío y nueva importación tras cancelar |
| Imagen en IndexedDB | Retirar blobs preparados si se invalida la operación o falla la escritura | Regresiones F1b y ZIP |
| Detección experimental | Mantener revisión humana y deshacer; comprobar también entrada/revisión/navegación | Fixture ortogonal y regresión de detección |
| Menú Archivo | Mantener JSON explícito y el acceso Subir plano o proyecto al selector común | UI de escritorio/móvil y regresiones de archivos |
| Exportación | Mantener JSON explícito; ZIP desde Plano propio/guía con imagen | Descargas reales y restauración |

## Cambio del menú revisado expresamente

La rama fuente eliminaba los accesos de importación de Archivo y convertía su exportación JSON a ZIP cuando había imagen. Esa propuesta no se traslada a la experiencia vigente.

- Se conserva **Importar proyecto JSON**, ahora creando otra entrada y preservando la anterior.
- **Subir plano o proyecto** reutiliza el selector de cabecera, bienvenida y buscador.
- Se conserva **Exportar plano JSON**. Las acciones ZIP de Plano propio y de la guía permanecen disponibles.
- El botón principal mantiene el ID/posición de #34, sin duplicar el CTA ni ocultarlo como herramienta avanzada.

## Pruebas y trazabilidad

Comprobación local del código candidato: **175 pruebas Node aprobadas, 0 fallos y 1 omitida por Blender externo**, incluyendo 11 de intake y dos nuevas de biblioteca. Sintaxis de módulos y scripts de index.html e importmap correctos. Una primera ejecución de interop no encontraba `/tmp`; se repitió la suite con TMPDIR dentro del workspace y pasó. No se cambió el producto para ese ajuste de entorno.

Chromium local no pudo iniciar: SIGTRAP antes de cargar la página. Ese resultado no acredita recorridos ni capturas de aplicación. Las pruebas de navegador se ejecutan por GitHub Actions y sus resultados exactos se registran en la PR antes de considerar la entrega lista.

El workflow **Multiformat guided import** comprueba `git rev-parse HEAD` contra el HEAD de la PR; ejecuta unitarias, imports y recorridos guiados, navegación, guardado/calibración, 2D/3D y capturas. Los artefactos llevan el SHA probado y las capturas nuevas se guardan aparte de las heredadas.

Suites de navegador previstas:

- `multiformat-guide.browser`: escritorio 1440×900, móvil 390×844 y 844×390; DXF y JSON con el mismo ID; imagen/ZIP; Inicio/Atrás/Cancelar; lecturas y conversores tardíos; cancelación PDF.
- `upload.browser`: conversores, formatos, menús, PDF vector/raster, geometría y detección experimental.
- `guide-navigation.browser` y `guide.browser`: navegación y recorridos completos de guía, calibración y evidencia de 3D/PNG.
- `browser`, `room-layout.browser` y `capture-3d.browser`: persistencia, JSON/ZIP, cotas/dimensiones, 2D/3D, exportaciones y restauración de cámara/buffer.

La preview debe estar READY para ese mismo HEAD. Una preview de otra rama o un SHA anterior no satisface esta puerta. La revisión visual de la preview final y la aprobación antes del merge se gestionan en la PR.

## Límites conservados

RoomPlan solo tiene fixtures de estructura; falta un escaneo real de iPhone. DWG no se importa directamente. DXF/PDF/IFC admiten el subconjunto documentado, con resultados estimados y revisables. La detección raster sigue siendo experimental y ortogonal. F2 no queda validada, no se aprueban umbrales ni se atribuye rendimiento en teléfonos físicos. No cambia FloorPlanProjectV1, sus unidades ni los modelos/materiales ya integrados.

Las capturas de `artifacts/upload-multiformat` heredadas del 12-10-2026 son antecedentes de la rama fuente y no representan el HEAD reconciliado. La evidencia vigente está en los artefactos del workflow y en la preview fijada en la PR.
