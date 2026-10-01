# Cambios compatibles de FloorPlanProjectV1

## 1.3.0 — catálogo local opcional F3 (integrada por PR #12, 30-09-2026)

- Añade `rubik-sota-local` al enum de `assetRef.catalog`, ya opcional en V1.0.
- Revisión local: prefijo de 40 hex del SHA-256 del manifest; Asset Lab conserva commit Git.
- No hay migración de datos anteriores ni nuevos campos obligatorios.
- Solo la asociación local eleva la versión a 1.3.0; lectores anteriores pueden rechazar el nuevo enum.
- Schema canónico y embebido mantienen igualdad estructural.

## 1.2.0 — seguimiento de formatos (integrada por PR #7, c28a170)

- `sourceImages[].mediaType` admite `image/webp` estático además de PNG/JPEG.
- ZIP preserva y restaura `.webp` con bytes originales, dimensiones y SHA-256.
- WebP animado/con EXIF, PDF y HEIC/HEIF quedan excluidos del importador.
- No cambian calibración ni verificación; proyectos sin WebP conservan su versión.
- V1.0/V1.1 siguen funcionando; lectores con el enum antiguo pueden rechazar WebP.
- [Decisión y pruebas de formatos](../technical/image-formats.md).

## 1.1.0 — F1b (integrada por PR #6, 30-09-2026)

- `scale.verification` opcional: sourceImageId, puntos A/B en píxeles originales,
  knownLengthMm, measuredLengthMm (mm entero), errorPercent firmado, thresholdPercent
  (2, provisional), status consistent/discrepant y verifiedAt.
- `sourceImages[].opacity` opcional (0–1, ausencia equivale a 1).
- Verificación semántica: misma fuente que calibración, puntos distintos de la cota
  inicial y dentro del raster; distancia medida = redondeo(|AB| × mmPerPixel), error
  = (medida − conocida)/conocida × 100. Status concuerda con el aviso del 2 %. Fecha
  posterior o igual a calibración. Placement, si existe, coincide con esa escala ±0,1 %.
- Si la verificación existe, `real` exige resultado consistente y confirmación de
  calibration.confirmedByUser. En el flujo nuevo no se ofrece real antes de segunda
  cota. V1 antiguos sin verification conservan sus reglas originales y se leen sin
  añadir el campo; no se afirma que esos datos antiguos acrediten una segunda cota.
- Recalibrar elimina verification y confirmación; no reescala geometría persistida.
- Se mantienen V1.0, IDs, unidades, listas, límites del esquema, migración e historial.
  El lector F1a conserva campos V1.x desconocidos; no implementa su UI ni verifica
  estos campos nuevos. Para leerlos/escribirlos con sus garantías, usar esta versión.
- Extensión opcional autorizada por el encargo, no aprobación de decisiones F0.

El ZIP materializa `storage.kind:sidecar-file` y `ref:images/<imageId>.png|jpg|webp`.
Al importar se restaura `local-browser` con nueva clave local. Las referencias a
IDs, geometría, calibración, verificación y huellas se conservan; únicamente cambia
la ubicación de almacenamiento. El proyecto JSON nunca incluye data:/blob: ni binarios.
