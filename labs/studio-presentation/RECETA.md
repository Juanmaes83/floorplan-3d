# Receta de reconstrucción del laboratorio

Todo sale de este ZIP: snapshot del proyecto, activos exportados por el producto, fuentes y sonda de lint copiadas en `vendor/` con sus licencias (`vendor/PROCEDENCIA.md`), diccionario de inglés en `i18n/`. No hace falta el repositorio de RUBIK ni red, salvo el registro de npm para las fuentes fijadas.

## Versiones con las que se ha comprobado

| Herramienta | Versión |
|---|---|
| Node.js | 22.23 |
| Playwright + Chromium | 1.63.0 (Chromium 1243) |
| poppler-utils (`pdftotext`, `pdfinfo`, `pdftoppm`) | 24.02 |
| ffmpeg | 6.1.1 |
| Python | 3.13, con Pillow 12.3 y pypdf 6.17 |
| zip / unzip | Info-ZIP 3.0 |
| Fuentes | Inter 4 (OFL, `vendor/fonts/inter`), Source Serif 4 5.1.1 (`@fontsource`, OFL, `tools/package-lock.json`) |

## Un solo comando

```bash
bash tools/reconstruir.sh rubik-studio-presentation-lab.zip /tmp/reconstruccion
```

Descomprime en una carpeta limpia, instala las fuentes (`npm ci`), compone dos veces y escribe `RECONSTRUCCION.json`: páginas y texto de cada PDF iguales entre las dos composiciones y con los PDF empaquetados, problemas de QA, idiomas y huellas de los medios.

Los PDF no son idénticos byte a byte (llevan su fecha de creación): se compara su contenido página a página.

## Qué no reconstruye

- **Los activos del producto** (`assets/`: vídeos, presentación de obra, fotogramas) y las imágenes de Render IA (`evidence/render-ia/`) se reutilizan tal cual. Rehacerlos exige el producto (`tools/delivery-assets.cjs`) y, para Render IA, un servicio de pago que no se vuelve a llamar.
- **El snapshot** se reutiliza. Regenerarlo exige el producto (`tools/snapshot.cjs <repo> snapshot`).
