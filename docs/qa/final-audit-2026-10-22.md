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
| integración `fa76113` (medido) | 54 | 0 | 4 (P13 1440, P15, P08, «Escape and browser Back») |

Causas en la integración, todas originadas en #71 (`feat/journey-orientation`, orientación del recorrido):
1. Tras presentar, la guía mueve la única entrada de presentación a la cabecera (`#presentationBtn`); el test
   suponía siempre `#guidePresent`. Ahora el test exige exactamente una entrada visible.
2. Defecto real de accesibilidad: al salir (Cerrar, Escape o Atrás) el foco caía en la búsqueda o en `body`.
   Corregido: vuelve a quien abrió la presentación o, si ya no se ve, a la entrada visible.

Los 4 timeouts NO son PASS y la suite NO está limpia: 54/58 medidos. Ningún límite se ha subido. P15 y P08 pasan todas sus aserciones con límites ×4 en una copia de
diagnóstico (borrada). «Escape and browser Back» queda como timeout SIN RESOLVER: en ejecución aislada tardó 112 s en #79
(`5c80049`) y 122 s en la integración (límite 120 s). Una sola medida por lado: la diferencia de 10 s no está atribuida
todavía al entorno; requiere comparación controlada (varias repeticiones, mismo equipo) y ejecución con GPU.
Pendiente de ejecución con GPU real: ver `manual-gpu-phone-protocol-2026-10-22.md`.

## Pendiente (no verificable en este entorno)
- Suite `presentation` con GPU real (Windows).
- «Compartir…» (`navigator.share`) en un móvil físico.
- Medida con regla de una hoja A3 impresa (#72).

## Evidencia
`artifacts/integration-2026-10-22/` (regeneradas sobre `fa76113`): 21 capturas (1440×900, 390×844, 844×390), `qa-log.txt` y dos vídeos.

Logs: `artifacts/integration-2026-10-22/logs/` — suite `presentation` sobre la integración `fa76113` (int3) y sobre #71 `0c9c6b0`
(antes del arreglo de Atrás), y la batería completa de 28 suites sobre `da4c5c1`.

## Comparación controlada de «Escape and browser Back» (mismo equipo, ejecuciones alternas, límite ampliado solo para cronometrar)
| Ejecución | #79 `5c80049` | Integración `9398394` (código = `fa76113`) |
|---|---|---|
| 1 | 109,8 s | 117,9 s |
| 2 | 107,8 s | 113,1 s |
| 3 | 106,3 s | 114,2 s |
| Media | 108,0 s | 115,0 s |

Todas las aserciones pasan en las 6 ejecuciones. La integración es **~7 s (≈6,5 %) más lenta en los 3 pares**: diferencia
reproducible, no ruido, y no atribuible solo al entorno. Causa sin identificar (candidatos: más DOM y escuchas de las PR
combinadas). Con el límite real de 120 s el caso sigue clasificado como **TIMEOUT sin resolver**; pendiente perfilar y
ejecutar con GPU. Log: `artifacts/integration-2026-10-22/logs/escback-controlled.txt`.

## Suite `presentation` en `9726eb5` (incluye #79 `d19f662`/`72bac33` y el test de #71 `d437ca6`)
Ejecutada **caso a caso** (`logs/presentation-per-case-runner.sh`) porque el contenedor se recicla al quedar inactiva
la sesión y la suite completa (~1 h) no llegaba a terminar. Cada caso corre aislado: condiciones algo más favorables
que la suite completa. Resultado: **54 PASS / 1 FAIL / 3 TIMEOUT** de 58 (`logs/presentation-per-case-9726eb5.tsv`).
- PASS nuevo: «Escape and browser Back» (110 s / 120 s).
- FAIL: P13 1440×900 — el clic en «Guardar PNG» agota 30 s mientras se genera la captura (SwiftShader).
- TIMEOUT: P15 (180 s), P08 pointer lock (120 s), P05 1440×900 (180 s; también expira en #79 y `fa76113` en este
  entorno más lento).
Ninguno se cuenta como PASS; todos pendientes de GPU real (protocolo `manual-gpu-phone-protocol-2026-10-22.md`).
