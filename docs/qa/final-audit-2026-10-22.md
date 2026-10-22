# Auditoría final — PRs #71–#79 e integración (2026-10-22)

Rama de integración (no master): `integration/2026-10-22` = #79 + #71→#73→#76 + #74 + #75 + #78 + #72.
Entorno local: Chromium 141 + SwiftShader (sin GPU), Node 22, Playwright; Three.js servido localmente.

## CI (GitHub Actions) — sí se ejecutó
- «Multiformat guided import» falla en master y en las PRs sin #79 con 38 PASS / 7 FAIL:
  F1b ×3 (el mueble no es visible: la paleta abre en «Construir») y F2 ×4 (peticiones a
  `css/design-system.css` y `css/brand.css` no incluidas en la lista permitida). Defectos de master; corregidos en #79.
- «Guided experience» en master: el intento 1 falló y el 2 pasó en el mismo SHA; los registros del intento 1 ya no
  están disponibles (404). Clasificado como fallo no reproducible, sin causa demostrada.

## Suite `presentation` (58 casos)
| SHA | PASS | FAIL | TIMEOUT |
|---|---|---|---|
| #79 `5c80049` | 55 | 0 | 3 (P13 1440 bajo carga, P15, P08) |
| integración (antes de corregir) | 43 | 13 | 2 cancelados |
| integración (después) | 54 | 0 | 4 (P13 1440, P15, P08, «Escape and browser Back») |

Causas en la integración, todas originadas en #73 (journey):
1. Tras presentar, la guía mueve la única entrada de presentación a la cabecera (`#presentationBtn`); el test
   suponía siempre `#guidePresent`. Ahora el test exige exactamente una entrada visible.
2. Defecto real de accesibilidad: al salir (Cerrar, Escape o Atrás) el foco caía en la búsqueda o en `body`.
   Corregido: vuelve a quien abrió la presentación o, si ya no se ve, a la entrada visible.

Timeouts: ningún límite se ha subido. P15 y P08 pasan todas sus aserciones con límites ×4 en una copia de
diagnóstico (borrada). «Escape and browser Back» tarda 112 s en #79 y 122 s en la integración (límite 120 s).
Pendiente de ejecución con GPU real: ver `manual-gpu-phone-protocol-2026-10-22.md`.

## Pendiente (no verificable en este entorno)
- Suite `presentation` con GPU real (Windows).
- «Compartir…» (`navigator.share`) en un móvil físico.
- Medida con regla de una hoja A3 impresa (#72).

## Evidencia
`artifacts/integration-2026-10-22/`: 21 capturas (1440×900, 390×844, 844×390), `qa-log.txt` y dos vídeos.
