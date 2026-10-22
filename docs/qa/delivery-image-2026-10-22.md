# Imagen de entrega profesional — QA (2026-10-22)

**Rama:** `feat/delivery-image`, apilada sobre `feat/share-image` (#78). **Base de #78:** `master@e796e3d`.
Chromium 141 + SwiftShader (sin GPU), Playwright, Node 22. Sin merge ni despliegue.

## Problema observado (sobre el PNG real de #78, no sobre el diálogo)
- Teléfono, vista general: la imagen es la vista 3D tal cual (609×1280); la vivienda ocupa el **20 %** de la imagen
  (31 % de su altura) y no hay ningún dato del inmueble ni del profesional.
- Con marca: la franja se pinta **encima** de la parte inferior de la escena; no incluye datos de la vivienda.
- Medidas: `artifacts/delivery-image/before-measures.json`.

## Qué cambia
- Vista general: una cámara clonada se desplaza solo a lo largo de la dirección de vista actual para encuadrar la caja
  de la vivienda (sin cambiar la fov: sin deformar ni recortar). Estancias: su propia cámara, regla «contener».
- Composición «B»: imagen arriba y una franja propia debajo (no superpuesta) con nombre del inmueble, planta y vista,
  «N estancias · Superficie útil aprox. X m²» y, si existe, logo y nombre del profesional. Contacto **solo si el
  profesional marca** «Mostrar mi contacto en la imagen» (desactivado por defecto).
- Formatos: horizontal 1600×1000 y vertical 1080×1350, elegibles en el diálogo. La vista previa **es** el archivo:
  mismo data URL y mismos bytes que la descarga y que el archivo entregado a `navigator.share`.
- Sin datos inventados: un dato ausente se omite (sin marcadores); la superficie es siempre «aprox.»; no hay
  ubicación (Rubik no la guarda); textos acotados terminan siempre en «…».

## Resultados
| Caso | Antes (#78) | Después |
|---|---|---|
| Teléfono, vista general | 20 % del área, sin datos | vertical: 63 % del área (74 % ancho, 85 % alto) con datos |
| Escritorio, vista general | 92 % alto · 56 % ancho, sin datos | horizontal: 89 % alto · 40 % ancho, con datos (**algo más pequeña**) |
| Dos plantas | 88 % alto | horizontal 89 % alto; vertical 72 % del área; indica «Planta baja · Vista general» |
| Vista previa = descarga | sí | sí en los 12 casos (bytes idénticos) |

Pruebas: `tests/delivery-image.test.cjs` 4/4; `tests/delivery-image.browser.test.cjs` 4/4 (1440 y 390, marca con
contacto opcional, dos plantas; aserciones sobre píxeles del PNG descargado); `share-image` 3/3 (expectativa de
nombre de archivo actualizada a `rubik-sota-vivienda-horizontal.png`); `brand` 3/3; unitarias 258/258.

## Abierto (no resuelto en este corte)
1. En escritorio horizontal la vivienda queda algo más pequeña que la vista de #78; ajustar margen/área.
2. Composición alternativa «C» (cabecera + imagen + pie de marca): implementada en `compose(layout:'header')` pero
   **sin comparar todavía** con imágenes reales; la elección de «B» es provisional.
3. Nombres de estudio muy largos en horizontal se recortan a una línea («Estudio Norte Arqu…»).
4. «Compartir…» con el archivo compuesto en un teléfono físico: pendiente (protocolo en
   `docs/qa/manual-gpu-phone-protocol-2026-10-22.md` de la integración).
5. Superficie de una planta en edificios: se muestra la de la planta visible, con su nombre; no hay total del edificio.

## Evidencia
`artifacts/delivery-image/`: hoja de contacto antes/después, PNG finales en WebP (antes y después), diálogo en
teléfono, medidas JSON.
