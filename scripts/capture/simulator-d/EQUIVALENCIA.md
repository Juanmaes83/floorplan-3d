# D · Garantías de reproducibilidad por alcance (medidas, no supuestas)

Entorno medido: Chromium 153 (`chromium-1243`) sin interfaz con SwiftShader, Linux con 4 vCPU, Node 22, Playwright 1.63, RUBIK `02712b5`, ejemplo de bienvenida.

| Alcance | Qué captura | Garantía | Medida |
|---|---|---|---|
| `canvas3d` | **Solo el render WebGL** del visor. Durante la foto, una hoja temporal deja visible solo `#view3d canvas`; usa `visibility`, así que no cambia la maquetación ni el estado | **Byte a byte** por fotograma (`sequenceSha256`) | 3 + 3 sesiones de `flyToRoom rom_kid` (31 fotogramas): 0 fotogramas distintos |
| `window` | La ventana completa: interfaz, lienzo y capas DOM sobre el lienzo | **Exacto fuera del lienzo**. Sobre el lienzo, equivalencia según `pixel-diff.WINDOW_CONTRACT`: ≤ 1,2 % de los píxeles del lienzo distintos y Δ ≤ 64. Las huellas exactas se guardan siempre | 124 parejas de fotogramas: 98 exactas y 26 equivalentes. Peor caso: 0,85 % del lienzo, Δ 52; fuera del lienzo, 0 px |
| `element` | Recorte de un elemento | Huellas exactas registradas, sin garantía declarada | — |

## Por qué la ventana no es byte a byte (causa medida)

Las diferencias aparecen solo en los **bordes y el apilado de las capas DOM superpuestas al WebGL**: las etiquetas CSS2D de las estancias (bordes, sombras y orden de solape entre etiquetas que se pisan) y la píldora `#hint3d` (esquina antialiasada). La cámara, el estado de View3D y el render WebGL son idénticos.

Ninguna de estas medidas lo corrige:
- las banderas de composición síncrona de Chromium (`--run-all-compositor-stages-before-draw`, `--disable-threaded-animation`, `--disable-threaded-scrolling`, `--disable-checker-imaging`), que se mantienen porque no perjudican;
- congelar la línea de tiempo CSS;
- esperar a la red.

Es la composición de capas del navegador, no RUBIK ni la captura.

**Por qué el contrato es seguro.** Una etiqueta ausente o desplazada cubre en torno al 2,8 % del lienzo, así que **no** pasa el contrato. Un cambio de interfaz fuera del lienzo no pasa nunca, porque esa zona se exige exacta. Lo comprueban `test/pixel-diff.test.cjs` y `test/virtual-capture.browser.test.cjs`.

## Histórico corregido

- **Cierre técnico del 20/11 de Claude Code 2:** declaraba «byte a byte» también en `window` y para el lienzo con recorte de rectángulo.
- **Re-ejecución independiente** del 20/11 (otra sesión, misma base):
  - `canvas3d` falló (3 huellas distintas en ejecuciones distintas). La causa era la esquina de `#hint3d` incluida en el recorte;
  - la prueba de bloqueo falló por un plazo real de 5 s demasiado justo.
- **Ambos fallos se corrigieron:** aislamiento del lienzo, contrato de ventana y plazo real de 20 s en la prueba.
