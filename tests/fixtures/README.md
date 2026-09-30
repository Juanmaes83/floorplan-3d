Los planos `manual-plan.png`, `manual-plan.jpg` y `manual-plan-exif6.jpg` son
fixtures sintéticos generados para estas pruebas: un rectángulo procedural de
480 × 320 píxeles. No representan una vivienda real ni contienen datos personales,
planos privados o recursos descargados. La variante JPEG EXIF declara orientación 6
para comprobar que se conserva el original al preparar su representación visual.
No sustituyen la evaluación humana con cinco planos autorizados.

`manual-plan.webp` (VP8L lossless) y `manual-plan-lossy.webp` (VP8 lossy)
se generaron localmente desde el mismo PNG sintético con Pillow disponible
en el entorno; no se añadió una dependencia a la aplicación o tests. Los bytes
de cada WebP son la referencia original de esos tests y se comparan tras ZIP.

`manual-plan-alpha.webp` añade un píxel transparente y usa VP8X/ALPH/VP8,
para comprobar el contenedor extendido con decodificación real.


`f2-wall-evaluation.synthetic.json` contiene exclusivamente segmentos geométricos
procedurales en mm: coincidencia exacta, parcial desplazado y duplicado. No
contiene ni procede de un plano real, raster, ruta, EXIF o permisos. Con tolerancia
explícita 5 mm para esta demostración, longitudes M=250, P=350, R=300: precisión
5/7 y exhaustividad 5/6. Son cálculos sintéticos, no calidad del detector en viviendas.
El SHA identifica la versión experimental integrada por PR #9; no se ejecuta
el detector ni se afina en estos tests.
