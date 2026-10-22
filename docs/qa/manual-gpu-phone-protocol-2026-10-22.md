# Pruebas pendientes de hardware real (22-10-2026)

Estas comprobaciones **no se han hecho**. Sin una GPU ni un teléfono físico no se pueden sustituir por emulación. Aquí está cómo repetirlas en Windows.

## 1. Suite `presentation` con GPU real (Windows)

En este entorno de pruebas, con Chromium 141 y SwiftShader sin GPU, cada interacción en 3D tarda unos 10 s. Dos casos se cortan por tiempo:

| Caso | Límite | Duración medida con SwiftShader | Aserciones (ejecución de diagnóstico con límite ×4, sin commit) |
| --- | --- | --- | --- |
| R2 P15: diez ciclos de presentación | 180 s | 221,5 s | Todas se cumplen |
| R2 P08: el bloqueo del puntero (pointer lock) en «Recorrer» se libera | 120 s | 166,9 s | Todas se cumplen |

Pasos en Windows, con Node 22, Git y Google Chrome instalados:

```powershell
git clone https://github.com/Juanmaes83/floorplan-3d.git; cd floorplan-3d
git checkout integration/2026-10-22
npm install --no-save playwright@1.56.1
$env:CHROME = "C:\Program Files\Google\Chrome\Application\chrome.exe"
node --test --test-concurrency=1 tests/presentation.browser.test.cjs
```

**Resultado esperado:** 58/58 PASS. Si P15 o P08 siguen superando su límite con GPU, es un defecto de rendimiento y debe registrarse como FAIL.

## 2. «Compartir…» en un teléfono físico (#78)

1. Abre la vista previa de #78 o la de la integración en Chrome para Android o Safari para iOS. Necesita sesión de Vercel.
2. Pulsa «Probar el ejemplo» → «Presentar mi vivienda» → «Iniciar presentación». Espera a que termine el vuelo de cámara.
3. Pulsa «Compartir imagen». Debe abrirse un panel con la imagen y el botón «Compartir…».
4. Pulsa «Compartir…». Debe abrirse el **menú de compartir del sistema** con la imagen `rubik-sota-vivienda.png`.
5. Elige WhatsApp o Gmail. La imagen debe llegar adjunta, con un texto que incluya «medidas orientativas» y **ningún enlace** al proyecto.

**Anota:**
- dispositivo y versión del navegador;
- si se abrió el menú del sistema;
- si la imagen llegó;
- cualquier error.

Si el menú no se abre, el fallo afecta a la activación por gesto del usuario y la corrección de `f8c0501` no basta.

## 3. Lámina a escala impresa (#72)

1. Descarga la lámina a 1:100 del ejemplo.
2. Imprímela en A3 apaisado al 100 %, sin «ajustar a página».
3. Mide con una regla la barra de 5 m, que debe medir 50 mm, y el ancho del dormitorio principal, que debe medir 36,7 mm.

**Pendiente.** La validación hecha hasta ahora es una medida en el navegador a 96 ppp, no papel.
