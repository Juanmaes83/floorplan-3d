# Punto 8C-B — parcela y geometría territorial fuente

**Estado:** 8C-B candidato en revisión. Base `master` = `f944088c315140d67cfadfbcd8db6350fd559a48` (8C-A). No cierra Punto 8.

## Alcance y contrato

`FloorPlanGeoProvider.CONTRACT_VERSION` pasa a `1.1.0`. `parcel` es la segunda operación contratada, mediante `registry.getParcel(providerId, input, context?)`. El ID es explícito y no hay fallback. Cada provider con `parcel:true` declara los modos de entrada `document` y/o `reference`. Los errores, cancelación, ausencia del provider y capability desactivada se normalizan sin filtrar detalles internos. Manual sigue siendo el provider de coordenadas; Catastro sólo declara `parcel` y `sourceMetadata`.

El adapter `catastro-inspire-cp` representa las parcelas INSPIRE CP de la Dirección General del Catastro (DGC). Su modo activo es **documento GML aportado por el usuario**: `network:'none'`, `parcelInputModes:['document']`. El modo de referencia remota queda desactivado. No hay `fetch` a Catastro, descarga, caché ni redistribución en este corte.

## Evidencia oficial y gate de red

Consulta del 28-10-2026:

| Documento/servicio | Organismo y URL | Conclusión |
| --- | --- | --- |
| WFS INSPIRE Cadastral Parcels | DGC, [especificación WFS CP](https://www.catastro.hacienda.gob.es/webinspire/documentos/inspire-cp-WFS.pdf) | Documenta GetParcel por referencia de 14 caracteres, GML 3.2.1 y CRS de origen; los ejemplos publicados usan HTTP. Cobertura aproximada del territorio gestionado por la DGC, excluidos País Vasco y Navarra. Esto es evidencia documental, no smoke de servicio. |
| Asistente de georreferenciación y ayuda GML | DGC, [CRS admitidos](https://www.catastro.hacienda.gob.es/es-ES/asistente_catreg.html), [ayuda GML](https://www.catastro.hacienda.gob.es/ayuda/informacion_kml_fxcc_gml.htm) | Documentan GML de parcela y CRS métricos `EPSG:25829`, `25830`, `25831`, `32628`. |
| Licencia INSPIRE | DGC, [licencia](https://www.catastro.hacienda.gob.es/webinspire/documentos/Licencia.pdf) | Permite el uso propio e impone condiciones a la difusión de información original sin transformar. No se presenta como licencia libre ni como prueba jurídica del lindero. La procedencia conserva atribución y `license.status:'restricted'`. |

Se intentó un smoke Chromium → HTTPS → WFS/CORS. El entorno falló en resolución DNS antes de alcanzar el servicio (`net::ERR_NAME_NOT_RESOLVED` incluso para el origen de control). Por tanto HTTPS, CORS, autenticación/captcha y formato de respuesta real **no están verificados**. El gate live no pasó y el modo `reference` permanece desactivado. No se usa un proxy ni HTTP mixto para simular disponibilidad.

## Geometría, CRS y marco

El parser XML usa URI de namespace y nombre local, sin asumir prefijos. Admite `CadastralParcel` INSPIRE CP, `nationalCadastralReference`, `inspireId` si existe, `MultiSurface`, varios `surfaceMember`, `PolygonPatch` y anillos interiores. Rechaza DOCTYPE/entidades, XML inválido, parcelas múltiples sin selección inequívoca y geometría inválida. La referencia se normaliza a sus 14 primeros caracteres alfanuméricos, aceptando entradas de 14/18/20 caracteres con espacios o guiones visuales. No se corrigen referencias dudosas.

`sourceGeometry` es un `MultiPolygon` con coordenadas originales del CRS fuente; se conserva cada hueco. La canonicalización hace deterministas el sentido, vértice inicial y orden de anillos y polígonos, sin redondear ni simplificar la fuente. Se validan cierres GML, aristas, área, autointersecciones, contención y solapes. Los límites de tamaño y complejidad del parser protegen al cliente y no son límites oficiales catastrales.

Se aceptan sólo `EPSG:25829`, `25830`, `25831` y `32628`, leídos del GML. CRS contradictorios se rechazan; CRS geográficos y `EPSG:3857` quedan `unsupported-source-crs`. No hay dependencia de proyección ni conversión aproximada. El `frame` persistido usa el centro del bounding box como origen métrico, X este e Y norte. `toLocalGeometry` deriva milímetros, con Y hacia abajo, para vista previa; ese resultado no es autoridad ni se guarda.

## Persistencia y separación

La única autoridad de proyecto es `project.site.parcel` desde ProjectV1 `1.9.0`. La única autoridad compartida de edificio es `building.site.parcel` desde BuildingV1 `1.2.0`; `level.project.site.parcel` se prohíbe dentro del edificio. Crear un edificio copia la parcela a la raíz; exportar una planta la incorpora a la copia ProjectV1. Añadir una parcela eleva versión, abrir un documento anterior no lo migra y quitar la parcela no degrada la versión. JSON y ZIP conservan referencia, CRS, geometría fuente, frame y snapshot de procedencia legal incluso sin el provider instalado. No guardan GML bruto, respuesta HTTP, geometría local derivada o vista previa.

La geometría territorial fuente **no** se convierte en muros, estancias, footprint ni linderos editables. Tampoco demuestra dónde se encuentra el edificio en la parcela: no se define transformación edificio ↔ parcela. PNG, GLB y Blender no incluyen la parcela automáticamente. Solar y 8A/8B conservan su comportamiento; ortofoto (8C-C), elevación/terreno (8C-D) e integración/presentación/exportación (8C-E) siguen pendientes.

## Interfaz y verificación

La entrada visible está en **Archivo → Parcela territorial**. La UI obtiene providers mediante `list({capability:'parcel'})`, muestra los modos declarados y permite importar un GML local, previsualizar polígonos y huecos, guardar, sustituir o eliminar el snapshot. El diálogo muestra referencia, CRS, fuente, estado de licencia y atribución sin superponer la parcela al edificio.

Pruebas sintéticas: suite Node no-browser **542 PASS, 2 SKIP, 0 FAIL** (544 casos); schemas Python **19 PASS**; regresiones Chromium de Solar, guía y Building **26 PASS**; browser 8C-B **5 PASS**. `node --check` de los JS modificados y `git diff --check` pasan. Los dos SKIP son de la suite Node general, no del nuevo contrato. La prueba browser cubre escritorio, móvil vertical/horizontal, importación, huecos, persistencia al reabrir, eliminación, autoridad compartida de Building, ausencia de mutación de geometría editable y errores de consola. Capturas revisadas: [escritorio](../../output/playwright/point-8c-b/1440x900-parcel.png), [móvil vertical](../../output/playwright/point-8c-b/390x844-parcel.png), [móvil horizontal](../../output/playwright/point-8c-b/844x390-parcel.png).
