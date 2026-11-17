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

## Preparar el entorno (una vez, con red)

Comprobado en Ubuntu 24.04 (glibc 2.39). Con otras versiones el texto de los PDF puede variar en detalles de fuentes del sistema; la comparación de `reconstruir.sh` lo detecta.

```bash
sudo apt-get install -y nodejs poppler-utils ffmpeg zip unzip python3 python3-pip
python3 -m pip install pillow==12.3.0 pypdf==6.17.0
cd tools && npm ci                       # fuentes y Playwright 1.63.0, fijados en package-lock.json
npx playwright install chromium          # el Chromium que corresponde a Playwright 1.63.0 (build 1243)
```

Si el entorno ya trae ese Chromium (como el contenedor donde se comprobó, con `PLAYWRIGHT_BROWSERS_PATH`), el último paso sobra. Otro ejecutable de Chromium se puede indicar con la variable `CHROME`.

La instalación inicial exige red (apt, PyPI, npm y la descarga de Chromium). La reconstrucción posterior no la exige.

## Un solo comando

```bash
bash tools/reconstruir.sh rubik-studio-presentation-lab.zip /tmp/reconstruccion
```

Extrae el ZIP dos veces e instala en cada copia las dependencias fijadas mediante `npm ci`. Compara los inventarios de ambas reconstrucciones con el paquete, verifica todas las piezas del registro y comprueba medios, snapshot, ES/EN y QA. El informe `RECONSTRUCCION.json` liga los resultados al SHA-256 del ZIP. Una discrepancia devuelve un código distinto de cero.

Para cada PDF registra la huella original y la huella con solo las fechas de creación y modificación neutralizadas. Exige además el mismo texto, número de páginas y rasterización de todas las páginas a 110 dpi.

## Qué no reconstruye

- **Los activos del producto** (`assets/`: vídeos, presentación de obra, fotogramas) y las imágenes de Render IA (`evidence/render-ia/`) se reutilizan tal cual. Rehacerlos exige el producto (`tools/delivery-assets.cjs`) y, para Render IA, un servicio de pago que no se vuelve a llamar.
- **El snapshot** se reutiliza. Regenerarlo exige el producto (`tools/snapshot.cjs <repo> snapshot`).
