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

## Revisión de las nueve regresiones de PR #38

La ejecución [38439027552](https://github.com/Juanmaes83/floorplan-3d/actions/runs/38439027552), sobre `ad89792671c8d06473c5a4d9d2032fd7b4489f8f`, aprobó 176 unitarias (una omitida por Blender externo) y 26 recorridos de importación/guía. La última suite terminó con 36 aprobadas y nueve fallidas. Los fallos se conservan como evidencia del estado anterior, no como resultados de la corrección.

| Prueba fallida | Causa observada | Corrección y comprobación |
| --- | --- | --- |
| Rechazo atómico de archivos inválidos | Snapshot del SVG durante la transición de los paneles: cambiaba el `viewBox` por el ResizeObserver, sin cambio del proyecto | La entrada al editor espera los frames de layout y el final de las animaciones reales; se mantiene la comparación completa de proyecto, guardado y SVG |
| Colección local, recarga y JSON | Expectativa antigua de tres entradas: la importación ahora conserva el proyecto anterior y crea otra entrada | Se esperan cuatro entradas tras duplicar; además se reabre la entrada previa y se comprueban sus 46 muebles, frente a los 47 del original editado |
| Touch 2D/3D, 390×844 | La guía permanecía visible en modo «Todas las herramientas»; canvas de 56,3 % del alto | El editor completo oculta la guía y ofrece Recuperar guía; se conserva el requisito de canvas ≥60 % |
| Touch 2D/3D, 844×390 | Mismo problema; canvas de 36,9 % del alto | Mismo ajuste, incluida la rotación del viewport; no se rebaja el requisito de espacio útil |
| Flujo F1b, 844×390 | El canvas no alcanzaba el 60 % exigido | Recuperación de espacio en el editor completo; se mantienen calibración, 3D, orbitado y ZIP |
| F2, 360×800 | El observador registró la hoja local `css/guided-experience.css` como tráfico no permitido | Se admite solo esa ruta GET local, manteniendo las restricciones de cuerpo, query, origen, WebSocket y solicitudes inesperadas |
| F2, 390×844 | Sin esa hoja de estilos, el pie interceptaba el botón Tareas y ayuda | Cargar el CSS real y ejecutar el mismo flujo de aceptación/corrección/rechazo |
| F2, 844×390 | Sin CSS, el estado del pie interceptaba el botón | Mismo ajuste y pruebas completas de proyecto/exportación |
| F2, 1440×900 | Sin CSS, la biblioteca interceptaba el botón | Mismo ajuste; se conservan privacidad, geometría, historial y exportación |

La prueba guiada comprueba ahora en los tres tamaños la apertura del editor completo, la guía oculta, su recuperación, la recarga y la igualdad del documento/progreso. Captura el editor completo y la guía recuperada. No se cambia el contrato ni el comportamiento atómico de importación.

Comprobación local de esta corrección: **176 unitarias aprobadas, 0 fallos, 1 omitida**, sintaxis JS y `git diff --check` correctos. El entorno local carece de Chromium; la descarga devolvió una página de sitio no disponible. Por ello los resultados de navegador se obtienen de CI, sobre el SHA final de la PR.

El workflow guarda la evidencia en `qa-results/`, una carpeta visible para upload-artifact; la carpeta oculta anterior no produjo ningún artefacto. Ahora la ausencia de evidencia se considera un error. El resultado final, el SHA probado, los logs, el artefacto y la preview exacta se registran en la descripción de #38 después de terminar las comprobaciones.

Primera comprobación de la corrección, SHA `62ef50a`: los tres recorridos de editor completo/recuperación pasaron y el artefacto se publicó. Falló una prueba de calibración guiada (`estimated` en lugar de `real`); el paso de regresiones quedó sin ejecutar. Se estabilizan también los clics de cota después de las transiciones, usando el `getScreenCTM()` real del SVG, y se comprueba que la segunda cota sea consistente antes de confirmar. Se conserva la tolerancia del producto; no se fuerza el estado de escala ni se omite la prueba.

## Límites conservados

RoomPlan solo tiene fixtures de estructura; falta un escaneo real de iPhone. DWG no se importa directamente. DXF/PDF/IFC admiten el subconjunto documentado, con resultados estimados y revisables. La detección raster sigue siendo experimental y ortogonal. F2 no queda validada, no se aprueban umbrales ni se atribuye rendimiento en teléfonos físicos. No cambia FloorPlanProjectV1, sus unidades ni los modelos/materiales ya integrados.

Las capturas de `artifacts/upload-multiformat` heredadas del 12-10-2026 son antecedentes de la rama fuente y no representan el HEAD reconciliado. La evidencia vigente está en los artefactos del workflow y en la preview fijada en la PR.
