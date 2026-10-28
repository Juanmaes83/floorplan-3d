# Punto 8C-D — terreno / elevación territorial

**Estado:** candidato en revisión. **Base:** `0adf6fa0cd3ca7cfcb2dd654eaaa7cef4e6adac0` (8C-C fusionado). **Gate comprobado:** 2026-10-28 en Chromium real, sobre HTTPS y origen local distinto.

## Producto y evidencia oficial

Se usa **MDT05 primera cobertura**, malla nominal de 5 m, obtenida principalmente de puntos de terreno LiDAR PNOA. [PNOA productos](https://pnoa.ign.es/pnoa-lidar/productos-a-descarga), [metadatos oficiales MDT05](https://www.idee.es/csw-codsi-idee/srv/api/records/spaignMDT05). La primera cobertura corresponde aproximadamente a 2008–2015; **no es necesariamente el terreno más reciente**. Las alturas son ortométricas; no se afirma un geoide o datum vertical más específico porque este gate no lo identifica inequívocamente. La resolución de 5 m es el paso de la malla, no una precisión de ±5 m. En agua la fiabilidad es menor por escasez de retornos LiDAR e interpolación, según el metadato oficial. No es un levantamiento topográfico certificado ni un estudio geotécnico.

Licencia del producto `MDT05-cob1 2008–2015`: **CC BY 4.0**, según [tabla oficial SCNE](https://www.scne.es/tablaProductos.php). Atribución conservada: “MDT05-cob1 2008–2015 · Sistema Cartográfico Nacional (IGN, FEGA y Comunidades autónomas) · CC BY 4.0”. El proyecto conserva esa atribución incluso si el provider no está instalado en la sesión.

## Gates de transporte

| CRS de `site.parcel` | WCS 2.0.1 | OGC API Coverages |
|---|---|---|
| EPSG:25829 | PASS: subset numérico y `.prj` ETRS89 UTM29N | Sin colección/salida exacta demostrada |
| EPSG:25830 | PASS: subset numérico y `.prj` ETRS89 UTM30N | JSON numérico, pero `domain.referencing` declara OGC:3042, con otro orden de ejes |
| EPSG:25831 | PASS: subset numérico y `.prj` ETRS89 UTM31N | Sin colección/salida exacta demostrada |
| EPSG:32628 | PASS: subset numérico y `.prj` WGS84 UTM28N | Sólo colección nativa 4083, no 32628 exacto |

La [API Coverages](https://api-coverages.idee.es/) responde con `application/prs.coverage+json`, CORS y valores reales para su colección `EL.ElevationGridCoverage_25830_5_PB`, pero no acredita la matriz completa de CRS sin tratamiento adicional de ejes/reproyección. Se eligió una sola vía productiva: [WCS oficial MDT](https://servicios.idee.es/wcs-inspire/mdt), versión 2.0.1, `GetCoverage` con `application/asc` numérico en `multipart/related; boundary=wcs`. GetCapabilities anuncia las coberturas `Elevacion25830_5` y `Elevacion4083_5`, y formatos ArcGrid/ASC; DescribeCoverage de `Elevacion25830_5` confirma malla nativa de 5 m y EPSG:25830. Las solicitudes usan `SUBSETTINGCRS` y `OUTPUTCRS` del CRS de la parcela. **EPSG:32628 no figura en `crsSupported` de GetCapabilities**, pero un GetCoverage real sobre Canarias devolvió cotas numéricas y el `.prj` identificó explícitamente WGS84 UTM28N. El parser verifica el `.prj` exacto en cada respuesta y falla cerrado si el servidor cambia. Nunca equipara 4083 con 32628 ni reproyecta en cliente.

Muestras del gate: 25829 `85.297`, 25830 `648.914`, 25831 `95.223`, 32628 `2080.712` m. Subsets de 20×20 m, 4×4 celdas ASCII de 5 m, respuestas de ~1.4–1.5 kB, HTTP 200, `multipart/related`, CORS correcto y AbortSignal funcional. El endpoint es fijo en el provider. El límite Rubik es 2 km por lado, 160 000 muestras y 3 MB de respuesta, con timeout de 20 s, sin retry, proxy ni credenciales.

## Contrato y persistencia

La cadena es `site.parcel → sourceCrs → bbox → WCS → TerrainGrid → sampleElevation / deriveSurface → parcel.frame`. El grid runtime distingue bbox solicitado, bordes exteriores de celdas y centros interpolables. La primera muestra está en `xllcorner+2.5, yllcorner+(rows-0.5)*5`; filas de norte a sur. NoData es explícito; cero sigue siendo un valor posible. `sampleElevation` sólo usa interpolación bilineal con cuatro muestras válidas; fuera del dominio de centros o a través de NoData no extrapola. La superficie une centros, usa una diagonal y winding constantes y omite triángulos con NoData. Convierte X/Y con la fórmula de 8C-B y escala vertical 1:1; la base visual runtime no es el datum del edificio.

GeoProvider 1.3.0 añade `getTerrain` y conserva providers 1.0–1.2. El adapter MDT declara `terrain:true`, `elevation:false`; no hay segunda operación remota de cota. ProjectV1 1.11 y BuildingV1 1.4 guardan sólo `site.terrain` metadata de la última cobertura. `retrievedAt` es fecha de recuperación, no fecha del terreno. Abrir sin red conserva metadata y deja grid ausente hasta la acción explícita de carga. Un nuevo fetch puede producir valores distintos. El Building almacena el site compartido, y la exportación de una planta lo copia a ProjectV1 1.11; ninguna planta incrustada conserva autoridad terrain propia. JSON y ZIP incluyen metadata; PNG, GLB, Blender, delivery y presentación no incluyen terreno en 8C-D.

La UI neutral `Archivo → Contexto territorial → Terreno / elevación` muestra fuente, producto, cobertura, CRS, resolución, referencia vertical, fecha de recuperación, atribución/licencia y mínimo/máximo sólo si existe grid de sesión. La previsualización SVG superpone una superficie contextual a la parcela en su mismo marco, sin recorte por polígono ni ortofoto drapeada. Reemplazar/eliminar parcela borra ortofoto y terrain; eliminar terrain deja parcela y ortofoto. `site.terrain` exige parcela y CRS consistente. Un provider ausente no invalida el archivo ni provoca petición de red.

## Límites

No se infiere relación vertical entre edificio y terreno, ni floor 0, ni pendiente, orientación, movimiento de tierras, capacidad portante, suelo, estratigrafía, nivel freático, cimentación, excavación, drenaje o estabilidad. No modifica Solar, 8A/8B, View3D principal, Walk, Presentation ni exportadores. **8C-E continúa pendiente.** El cierre canónico requiere revisión, CI y merge posteriores; no se realiza aquí.
