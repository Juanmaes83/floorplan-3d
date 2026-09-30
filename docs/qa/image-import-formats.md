# QA — claridad de importación y formatos locales

Fecha: 30-09-2026. Rama: `fix/local-image-import-formats`.
Base: master `0f67a63e13e9139117f17200a3d6f8bf97590072`, verificado en remoto
antes de editar y después de las pruebas. Esta es una corrección de F1b integrada,
no una nueva implementación de F1a/F1b ni inicio de F2.

## Preflight y protección de trabajo previo

- Checkout inicial: `feat/f1b-image-calibration-tracing`, HEAD local `1252232`,
  con cambios en los dos schemas y `tests/schema.test.py`.
- Remoto F1b actual: `d02d48979f5c0fd1be828aeddfa744f9b7721edd`, ya integrado
  mediante PR #6; master incorpora corrección equivalente del schema.
- Trabajo local protegido en commit **`5fb6357`** de la antigua rama local F1b.
  No se reseteó, descartó ni publicó encima de la rama remota. Su mejora útil de
  pruebas strict-source se integró sobre los tests de master, reutilizando el
  detector existente. No se volvió a implementar la corrección ya integrada.
- Nueva rama basada en master, sin rebase/force push. La rama previa y su commit
  local siguen disponibles; no son el remoto final de esta entrega.
- PR #4/#5/#6 fusionadas; #1/#2/#3 abiertas, comprobadas en páginas públicas GitHub.
  No se modifican o resuelven las PR documentales aquí; la propuesta está en
  [ROADMAP.md](../ROADMAP.md).

## Comandos y resultados reales

| Comando | Resultado |
| --- | --- |
| `node --test tests/project.test.cjs tests/library.test.cjs tests/tracing.test.cjs tests/browser.test.cjs` | Ejecución final: **86/86 aprobadas**, cero fallos/cancelaciones/omisiones, 236,96 s. Incluye F1a, biblioteca, F1b y nuevos flujos. |
| `python3 tests/schema.test.py` | **9/9 aprobadas**, 0,15 s; schema canónico y literal JS sin duplicados, igualdad estructural y compatibilidad de ejemplos. |
| `git diff --check` | Código 0, sin errores. |
| `node --check js/tracing-core.js` | Código 0. |
| `node --check js/tracing-ui.js` | Código 0. |
| `node --check js/project-package.js` | Código 0. |
| `node --test --test-name-pattern='image import' tests/browser.test.cjs` | Última ejecución enfocada: **7/7 aprobadas**, 39,34 s. La ejecución final completa incorpora las posteriores comprobaciones de mensajes en cuatro viewports. |

Una ejecución intermedia de la prueba ampliada falló por configuración del test:
`touchscreen.tap: hasTouch must be enabled on the browser context before using the touchscreen.`
El recorrido reutilizaba `imageTap` en un contexto sin `hasTouch`. Se corrigió el
contexto y se repitieron las pruebas enfocadas y la suite completa; no se omitió
ni desactivó ninguna prueba. La ejecución completa anterior pasó 85/85 antes de
la última ampliación de accesibilidad/mensajes; el resultado vigente es 86/86.

## Cobertura comprobada

- Eventos `filechooser`: JSON abre `fileIn`, imagen abre `traceImageFile`;
  accesos existentes y nuevo acceso reutilizan el flujo. Texto/ayuda en ES/EN/ZH.
- PNG y JPEG siguen decodificando y restaurándose desde ZIP sin cambiar bytes.
- WebP VP8, VP8L y VP8X/alpha: firma/contenedor/dimensiones y decodificación real.
  Calibración y segunda cota, confirmación, schema 1.2.0 conservado, persistencia
  local, ZIP en contexto limpio y comparación exacta de bytes/restauración.
- MIME vacío válido, extensión/MIME falso, truncado/corrupto, 15 MiB excedidos,
  lado de 8001 px, variantes WebP no admitidas, PDF/HEIC: rechazo sin alterar
  proyecto, colección o claves de imágenes. ZIP válido con imagen corrupta también
  falla antes de guardar. Fallos simulados de lectura, decodificación y guardado
  conservan el estado y no dejan nuevas claves.
- Viewports **360×800, 390×844, 844×390 y 1440×900**, táctil emulado: acciones,
  recorrido WebP, menú accesible, mensajes completos dentro del viewport y sin
  scroll horizontal del documento. El header conserva su scroll táctil histórico.
- F1a/F1b existentes: migración/JSON, edición/trazado, recarga, ZIP, eliminación,
  2D/3D y fallback sin WebGL. Render 3D con **Chromium/SwiftShader por software**.
  El transporte de Three.js de los tests usa curl con TLS verificado cuando
  Chromium rechaza la CA del entorno. No se modifica la política de red ni TLS.
- Fixtures raster sintéticos propios: no se han subido planos privados o imágenes
  de usuario a servicios. Los nuevos recorridos también vigilan destinos de red.

## Revisión visual y límites de evidencia

Se inspeccionaron capturas sintéticas del menú de 360×800 y 844×390 y del error
PDF en 360×800. La automatización genera capturas en las cuatro resoluciones en
`/tmp/image-import-<ancho>.png` y `/tmp/image-import-error-<ancho>.png`; no se
incluyen capturas ni logs temporales en el commit.

El evento filechooser y `setInputFiles` permiten comprobar el input y su recorrido,
no la apariencia del diálogo nativo del sistema operativo ni la carpeta Descargas.
No se afirma revisión manual en teléfono ni evaluación de cinco planos reales.
Los tests 3D no acreditan rendimiento físico.

## Pendientes de revisión

- Cinco planos reales autorizados (matriz aún vacía), teléfono físico y umbrales
  aprobados antes de F2.
- PDF y HEIC/HEIF diferidos; WebP animado/con EXIF excluidos. Véase
  [decisión técnica](../technical/image-formats.md).
- Revisión humana de la corrección y preview pública ligada a su SHA. Una preview
  del F1b anterior no valida esta entrega. No se despliega a producción.
- No hay workflow de CI de pruebas en el checkout. Las pruebas aquí son locales;
  despliegues Vercel, si existen, no equivalen a una CI de tests.
