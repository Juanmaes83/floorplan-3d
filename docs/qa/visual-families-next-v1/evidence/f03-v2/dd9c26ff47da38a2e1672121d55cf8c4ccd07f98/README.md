# F03 V2 - Evidencias para revision visual humana

Estado: TECHNICALLY_TESTED_VISUAL_PENDING_HUMAN

Codigo probado: dd9c26ff47da38a2e1672121d55cf8c4ccd07f98

Pruebas comunicadas:
- Unitarias F02/F03 V1/F03 V2: 10/10 PASS
- Chromium F03 V2 A/B/C: 1/1 PASS
- 42 capturas WebP y 3 manifiestos

A = F02 OFF / F03 OFF
B = F02 ON / F03 OFF
C = F02 ON / F03 V2 ON

## Estuco aprobado V1, ampliado en V2

| A | B | C |
|---|---|---|
| ![](stucco/A-F1.webp) | ![](stucco/B-F1.webp) | ![](stucco/C-F1.webp) |
| ![](stucco/A-D1.webp) | ![](stucco/B-D1.webp) | ![](stucco/C-D1.webp) |
| ![](stucco/A-G1.webp) | ![](stucco/B-G1.webp) | ![](stucco/C-G1.webp) |

[Manifest estuco](stucco/manifest.json)

## Revoco experimental - NO aprobado

| A | B | C |
|---|---|---|
| ![](rough/A-F1.webp) | ![](rough/B-F1.webp) | ![](rough/C-F1.webp) |
| ![](rough/A-D1.webp) | ![](rough/B-D1.webp) | ![](rough/C-D1.webp) |
| ![](rough/A-G1.webp) | ![](rough/B-G1.webp) | ![](rough/C-G1.webp) |

[Manifest revoco](rough/manifest.json)

## Movil emulado - estuco

| A | B | C |
|---|---|---|
| ![](stucco/mobile/A-G1.webp) | ![](stucco/mobile/B-G1.webp) | ![](stucco/mobile/C-G1.webp) |
| ![](stucco/mobile/A-M1.webp) | ![](stucco/mobile/B-M1.webp) | ![](stucco/mobile/C-M1.webp) |

[Manifest movil](stucco/mobile/manifest.json)

## Limitaciones

- Sin validacion visual humana de F03 V2.
- Sin prueba en movil fisico.
- La memoria GPU es estimada.
- PASS de Chromium no acredita calidad arquitectonica.
- F04 y F05 no forman parte de esta entrega.
- No merge. No deploy. No activacion por defecto.
