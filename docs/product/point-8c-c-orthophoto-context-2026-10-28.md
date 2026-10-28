# Punto 8C-C — ortofoto territorial contextual

**Estado:** candidato en revisión; no constituye cierre canónico de Punto 8. 8C-D (elevación/terreno) y 8C-E (integración/presentación/exportación) siguen pendientes.

## Fuente oficial y gate

El [PNOA Máxima Actualidad del IGN/CNIG](https://pnoa.ign.es/web/portal/pnoa-imagen/ortofotos-pnoa-maxima-actualidad) ofrece un mosaico dinámico mediante [WMS y WMTS](https://pnoa.ign.es/pnoa-imagen/visualizadores-y-servicios-web). Se verificó en Chromium el `GetCapabilities` de `https://www.ign.es/wms-inspire/pnoa-ma`: HTTP 200, XML `WMS_Capabilities`, WMS 1.3.0, capa exacta `OI.OrthoimageCoverage`, formato `image/jpeg` y CRS `EPSG:25829`, `EPSG:25830`, `EPSG:25831`, `EPSG:32628`. La capa publica la atribución `Sistema Cartográfico Nacional`. Una petición `GetMap` en `EPSG:25830` devolvió JPEG legible de 250 × 150 px con CORS; la señal abortada produjo `AbortError`. No se observó autenticación o captcha. El raster mostrado en pruebas automatizadas es **sintético**; CI no llama al WMS real.

La [ficha oficial de producto CNIG](https://centrodedescargas.cnig.es/CentroDescargas/index.jsp%2821/05/ortofoto-pnoa-maxima-actualidad) y las [condiciones SCNE para productos y servicios IGN](https://www.scne.es/productos.php) describen una licencia compatible con CC-BY 4.0 y obligación de atribuir la fuente. La procedencia guarda el texto de atribución que anuncia este servicio. La composición y productores concretos pueden variar por zona y fecha. La solicitud no demuestra fecha de vuelo, edición ni GSD del producto subyacente; `retrievedAt` sólo registra cuándo se pidió la imagen. La política durable es `latest-available`, por lo que una nueva solicitud puede devolver píxeles diferentes.

## Cadena implementada

`site.parcel` → CRS y extensión métrica fuente → operación neutral `GeoProvider.getOrthophoto` → WMS PNOA → JPEG validado y procedencia → previsualización con contorno en el mismo marco fuente. La operación es explícita; no hay descarga al abrir un proyecto. La vista no posiciona la vivienda ni crea geometría editable. No se añade terreno, elevación, proxy, teselas, WMTS ni COG.

La petición fija HTTPS, WMS 1.3.0, capa y JPEG. Se rechazan extensiones fuera de los CRS admitidos o mayores que 2048 px por lado, 4 millones de píxeles o 8 MB de respuesta. Se valida estado HTTP, MIME, firma JPEG, decodificación y dimensiones. La imagen vive como `Blob` y URL temporal revocada al cerrar o sustituirla. Se aplica `AbortSignal` y timeout de 20 s. Errores y cancelaciones quedan como resultados estables del provider.

`site.orthophoto` guarda únicamente extensión, dimensiones, resolución solicitada/efectiva, `sourcePolicy`, `mediaType` y snapshot de procedencia/licencia/atribución. ProjectV1 1.10.0 y BuildingV1 1.3.0 la admiten; la parcela es obligatoria y sus CRS/extensión deben coincidir. Un edificio la conserva sólo en `building.site`, y la exportación de planta copia los metadatos. JSON/ZIP conservan metadatos sin raster; PNG, GLB y Blender no incorporan ortofoto. El proyecto conserva validez sin red ni provider y no descarga la imagen al reabrirlo.

## Verificación

Pruebas sintéticas: cálculo de bbox/píxeles/superposición, límites, URL WMS, ruta neutral, cancelación, procedencia, gates de versión, JSON/ZIP, autoridad de edificio y Chromium escritorio/móvil con WMS simulado. La imagen sintética no demuestra contenido real de una parcela ni exactitud catastral.
