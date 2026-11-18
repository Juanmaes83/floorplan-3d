# Procedencia del soporte DXF G-02

`dxf-tools.js` agrupa `dxf-writer@1.18.4` (MIT, Ognjen Petrovic) y dos utilidades de openPlan3D `771c9e1ad30bd1c3cc7584d6eca74deb2e14943d` (MIT, theLodgeStudio). Las licencias completas acompañan al fichero.

La fuente exacta de `src/lib/utils/canvasSymbolDxf.ts` y `src/lib/utils/exportText.ts` está registrada en `labs/sculpt/openplan3d-771c9e1/` del commit `6dadcbb75c2fa28930007658e3521e91c8d261a5`. El manifiesto y las 69 pruebas DXF del donante acreditan el punto de partida.

El bundle se genera con esbuild 0.28.2, IIFE legible llamado `RubikDxfTools`, exportando `Drawing` de la dependencia y las funciones `canvasSymbolDxf` y `cadText` de esos dos archivos. La entrada reexporta los símbolos y el pie añade acceso CommonJS para las pruebas. Se normalizan las rutas de los comentarios y del registro de módulos. Las importaciones de JSZip y el catálogo quedan fuera del runtime.

El adaptador `js/dxf-export.js` aplica los símbolos y convenciones de capas sobre los contratos de RUBIK. El bundle no contiene stores, modelos ni componentes del editor donante.
