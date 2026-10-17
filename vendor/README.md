# Librerías de terceros incluidas

Se sirven desde el propio despliegue (sin CDN) y se cargan solo al subir un formato que las necesita.

| Carpeta | Paquete npm | Versión | Licencia | Uso |
| --- | --- | --- | --- | --- |
| `pdfjs/` | `pdfjs-dist` (build `legacy`) | 6.4.299 | Apache-2.0 (`pdfjs/LICENSE`) | Renderizar páginas PDF |
| `heic2any/` | `heic2any` | 0.0.4 | MIT (`heic2any/LICENSE.md`); incluye libheif compilada (LGPL-3.0), cargada como fichero separado y sustituible | Decodificar HEIC/HEIF |
| `utif/` | `utif` | 3.1.0 | MIT (`utif/LICENSE`) | Decodificar TIFF |
| `pako/` | `pako` | 2.1.0 | MIT (`pako/LICENSE`) | Descompresión Deflate para TIFF |
| `dxf-parser/` | `dxf-parser` | 1.1.2 | MIT (`dxf-parser/LICENSE`) | Leer DXF ASCII |
| `web-ifc/` | `web-ifc` (build ESM + `web-ifc.wasm`) | 0.0.78 | MPL-2.0 (`web-ifc/LICENSE.md`); se distribuye sin modificar | Leer IFC (BIM) |

Para actualizar: `npm pack <paquete>@<versión>`, copiar los mismos ficheros y repetir `tests/plan-intake.test.cjs` y `tests/upload.browser.test.cjs`.
