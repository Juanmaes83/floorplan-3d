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
- Composición: horizontal «D» (imagen a la izquierda, columna de datos a la derecha) y vertical «B» (imagen arriba,
  franja debajo); nunca superpuesta. Contiene nombre del inmueble, planta y vista,
  «N estancias · Superficie útil aprox. X m²» y, si existe, logo y nombre del profesional. Contacto **solo si el
  profesional marca** «Mostrar mi contacto en la imagen» (desactivado por defecto).
- Formatos: horizontal 1600×1000 y vertical 1080×1350, elegibles en el diálogo. La vista previa **es** el archivo:
  mismo data URL y mismos bytes que la descarga y que el archivo entregado a `navigator.share`.
- Sin datos inventados: un dato ausente se omite (sin marcadores); la superficie es siempre «aprox.»; no hay
  ubicación (Rubik no la guarda); textos acotados terminan siempre en «…».

## Comparación de composiciones (mismo proyecto, cámara, formato y marca)
Medida: caja de los píxeles que difieren del fondo (umbral 30, paso 2 px; `scratchpad/measure.py`), como fracción de
la zona de imagen y del PNG completo. La caja incluye la sombra de la vivienda. Sin recortar ni deformar: la cámara solo
se acerca a lo largo de su dirección y la fov no cambia.

| Horizontal 1600×1000 | Zona de imagen | PNG completo | Vivienda (px) | Revisión visual |
|---|---|---|---|---|
| Antes, #78 (1280×800, sin datos) | 51,0 % | 51,0 % | 714×732 | sin identidad ni datos |
| B — franja inferior | 40,0 % | 32,8 % | 701×750 | legible; la franja quita altura |
| C — cabecera + pie | 40,0 % | 32,8 % | 701×750 | **defecto:** con nombres largos el nombre del estudio y el contacto se pisan |
| **D — columna lateral (elegida)** | **66,5 %** | **44,9 %** | **818×878** | título en 3 líneas, estudio en 2, contacto separado |

Vertical 1080×1350 (B, elegida): 66,5 % de la zona de imagen, 49,3 % del archivo (C idéntica en área, sin ventaja).

**Resultado que no se iguala:** en horizontal la vivienda ocupa menos fracción del archivo que antes (44,9 % frente a
51,0 %) porque el archivo incluye ahora una columna de datos que antes no existía. La vivienda es mayor en píxeles
(+37 % de superficie) y está completa. Subir la fracción exigiría recortar la vivienda o quitar los datos.

## Resultados (diálogo real, PNG descargado)
| Caso | Antes (#78) | Después |
|---|---|---|
| Teléfono, vista general | 19,7 % del archivo, sin datos | vertical 49,3 % del archivo (66,5 % de la imagen), con datos |
| Escritorio, vista general | 51,0 % | horizontal D 44,9 % del archivo (66,5 % de la imagen) |
| Dos plantas, con marca | 46,2 % del archivo | horizontal 52,1 %, vertical 57,2 %; «Planta baja · Vista general» |
| Vista previa = descarga | sí | sí en los 12 casos (bytes idénticos) |

## Pruebas por SHA (sin mezclar ramas)
El código actual de esta rama es el de `17e286a`. `2dff3d2` y los commits posteriores solo cambian docs y evidencia.

| SHA de código | Prueba | Resultado |
|---|---|---|
| `3cc4c4e` (anterior) | `delivery-image` unitarias 4/4 · navegador 4/4 · `share-image` 3/3 · `brand` 3/3 · unitarias 258/258 | histórico; este SHA ya no es el HEAD |
| `17e286a` (= `2dff3d2`) | unitarias 258/258 · `delivery-image` navegador 4/4 · `share-image` 3/3 | PASS (23-10, 02:06 UTC, en serie) |
| `17e286a` (= `2dff3d2`) | `brand` 390×844 | **FAIL intermitente**: 3.ª descarga de la lámina sin llegar. 5 de 6 ejecuciones a las 02:19–02:24 y 0 de 17 entre 03:40 y 04:20. **No reproducido hoy y sin causa demostrada.** Hay un defecto relacionado en `master` (lámina reabierta antes del evento `close`), corregido en #79 `acabb54`; la relación es plausible y no está demostrada (`docs/qa/sheet-reopen-2026-10-23.md` en #79) |
| `17e286a` en GitHub Actions | `Guided experience` ✅ · `Multiformat guided import` ❌ (7 FAIL: F1b ×3 y F2 ×4) | los mismos 7 fallos que en `master`; los corrige #79, que esta rama no contiene |

La suite `presentation` completa **no** se ha ejecutado sobre esta rama. Las ejecuciones posteriores sobre este SHA y sobre la integración temporal están en la descripción de la PR, para no cambiar el SHA de la evidencia.

## Abierto
1. Horizontal: 44,9 % del archivo frente al 51 % previo (explicado arriba); decisión de Juanma si prefiere menos datos.
2. ~~A 844×390 la vista previa es pequeña y hay que desplazar~~ → **resuelto en `17e286a` (está en el HEAD)**: en pantallas bajas el diálogo usa dos columnas (vista previa 422×264); sin desplazamiento vertical ni horizontal y todos los botones visibles con 44 px, medido a 844×390, 1440×900 y 390×844 (`dialog-844-two-columns.webp`).
3. ~~Sin marca, hueco bajo los datos~~ → **resuelto en `17e286a` (está en el HEAD)**: sin marca el bloque de datos se centra en la columna (`after-1level-nobrand-centred-land.webp`).
4. «Compartir…» en teléfono físico: pendiente.
5. Edificios: superficie de la planta visible, no total.
6. Llevarla a `master` exige integrar antes #78, que no está en la autorización actual. Ver la secuencia propuesta en la descripción de la PR.

## Evidencia
`artifacts/delivery-image/`: hoja de contacto antes/después, `layouts/` (B, C y D con nombres cortos, largos y sin marca), diálogo en 1440/390/844, PNG finales en WebP (antes y después), diálogo en
teléfono, medidas JSON.
