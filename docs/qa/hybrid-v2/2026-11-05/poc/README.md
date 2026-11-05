# Prototipo Hybrid V2 (herramienta de QA, no es código de producto)

- **No lo carga la aplicación.** Se ejecuta con Node + Playwright contra un checkout de RUBIK, por defecto `/home/user/fp-ssv-base`, que es `master@0f9c6ea`.
- **No modifica el repositorio.** `harness.cjs` sirve los ficheros e inyecta **en memoria** un gancho de solo lectura (`window.__hv2`) justo antes de `window.View3D = {`.
- **`proto.js`:** pase REAL (el render de RUBIK), pase AUX (posición de mundo e identidad por píxel) y composición (grafito sobre papel más manchas de realismo con su momento de llegada).
- **`sequence.cjs`:** cámara salón → cocina, semillas ancladas a muebles, vestido de materiales con el catálogo de RUBIK (sin guardar) y renderizado fotograma a fotograma.

Uso:

```
CHROME=… THREE_LOCAL_DIR=… NODE_PATH=… node sequence.cjs <salida> stills|video [fps]
```

Entorno de la evidencia: Chromium 141 con SwiftShader (CPU), 1280×720. Los tiempos por fotograma no representan una GPU.
