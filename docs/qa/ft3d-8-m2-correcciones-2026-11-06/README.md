# FT3D-8 · M2/S4 — Correcciones del examen y experiencia guiada para un usuario novato (06/11/2026)

| Dato | Valor |
|---|---|
| **Código corregido y probado** | `1620ba6af25d5ec793759225b183265f47f30d0b`, rama `feat/ft3d-8-m2-s4-correcciones-2026-11-06` |
| Base | M2 `49e8feb`, sin modificar |
| Examen de referencia | `qa/ft3d-8-m2-examen-final-2026-11-06` @ `5e0fc42`, sin modificar |

| Archivo | Contenido |
|---|---|
| [`informe-correcciones.md`](informe-correcciones.md) | Las rondas del bucle, el estado de D-01…D-14, la experiencia de novato, lo que no está en verde y las decisiones pendientes. |
| [`matriz-experiencia-novato.md`](matriz-experiencia-novato.md) | La matriz nueva: hallazgos N-01…N-17 de un usuario novato y el recorrido completo (V5). |
| `ronda-3/` | **Ronda final:** `matriz-pruebas.md`, los JSON de resultados y `evidencias/` con capturas, vídeos y entregas generadas. |
| `ronda-1/`, `ronda-2/` | Resultados JSON de las rondas intermedias (aprendizaje del bucle). |
| `regresion/` | Las 18 suites existentes sobre `1620ba6`: 1037 PASS y 0 FAIL. |

## Vídeos (ronda 3, código `1620ba6`)

| Vídeo | Archivo | Qué muestra |
|---|---|---|
| V1 | `ronda-3/evidencias/v1-recorrido-escritorio.webm` | Recorrido de escritorio: revisión A, 10 tareas y vuelta tras cambiar un precio. |
| V2 | `ronda-3/evidencias/v2-economia-persistencia.webm` | Revisiones B y C, tarifa BC3, invalidación y nueva entrega. |
| V3 | `ronda-3/evidencias/v3-movil.webm` | Móvil a 390×844 y 844×390. |
| V4 | `ronda-3/evidencias/v4-hallazgos-*.webm` | Repetición de cada hallazgo del examen. Los rótulos siguen diciendo lo que se observaba **antes** y la comprobación ahora pasa. |
| **V5** | `ronda-3/evidencias/v5-novato.webm` | **Un usuario novato, de la portada a la entrega descargada, guiado por el Recorrido de obra.** |

## Reproducir

```bash
CHROME=/ruta/chrome node --test --test-concurrency=1 tests/qa-m2-examen.browser.test.cjs
```

```bash
CHROME=/ruta/chrome node --test tests/qa-m2-hallazgos-v4.browser.test.cjs
```

```bash
CHROME=/ruta/chrome node --test tests/qa-m2-novato.browser.test.cjs
```
