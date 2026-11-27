# PR #324 · candidata conjunta: §9 Cabecera + Entregar (D3, P2/FOT-01, cuadrícula P8 → P9 → P10) + muestra de estilos + StoryLayersV1

- **Rama:** `claude/integracion-cabecera-entregar`.
- **Base:** `master` `dacb5d39` (#323).
- **Estado:** PR **borrador**. La fusión espera la revisión del SHA final por Claude Code, Codex y el propietario, y después
  la autorización explícita del propietario sobre ese SHA.
- **Composición:** fusión `--no-ff` de `claude/cabecera-proyectos` y `claude/entregar-asistencia` sobre `master`, sin
  conflictos.
- **Dependencia explícita, autorizada por el propietario el 27/11:** StoryLayersV1 `cd694e88` (9 commits: P10 «Explicar el
  cambio», §§7.2, 7.3 y 8.3), sobre la que se construyeron las dos ramas aprobadas.
- **Fuera:** Gesture Labs §6 (sigue en su rama) y Película del proyecto §11 (bloque aparte).

## Recorridos grabados en la candidata (`video/`)
| Recorrido | Escritorio | Móvil |
|---|---|---|
| **P10 → editar la variante con un cambio guardado → volver al MISMO capítulo** («Mobiliario»), con una sola vuelta | `9-p10-capitulo-con-cambio-escritorio.mp4` | `…-movil.mp4` |
| **D3 · «Preparar imágenes» que FALLA:** vuelve a «Revisar», explica el motivo, el borrador sigue y se puede reintentar *(posterior a la Preview aprobada, `2f4a25d9`)* | `d3-preparar-imagenes-falla-escritorio.mp4` | `…-movil.mp4` |
| **D3 · «Preparar imágenes» ABANDONADO** (la persona se va a Diseñar): no se reabre encima; aviso «tu dossier sigue en Entregar → D3»; al volver, el borrador sigue en «Revisar» *(posterior, `2f4a25d9`)* | `d3-preparar-imagenes-abandona-escritorio.mp4` | `…-movil.mp4` |
| §9 · Proyecto ▾ → Descargar proyecto JSON → «Proyecto JSON descargado» → reimportar | `9-json-descargar-reimportar-escritorio.mp4` | `…-movil.mp4` |

Los recorridos aprobados de D3 (tres pasos), P2/FOT-01, la cuadrícula y Home se grabaron en sus ramas (ver
`docs/qa/entregar-asistencia/revision-27-11/`). Su código entra sin cambios en la candidata.

## Regresión del conjunto (27/11/2026)
**Tanda completa** sobre `6e951517`, 66 archivos: los 64 previstos más `project-first` y `qa-m2-novato`, que solo cubría
la CI. Resultado: **466 pasan · 8 fallan**. Cada fallo se reprodujo por separado en la base (`master` `dacb5d39`) y en
las ramas de origen.

| Fallo | Clasificación | Evidencia | Estado |
|---|---|---|---|
| G-02 (descarga del nivel activo) | **base** | También falla en `master` `dacb5d39` (`master-g02-p16`, prueba 1) | Fuera de esta PR |
| R2 P16 (nombre largo tipo HTML, 1440×900) | **base** | También falla en `master` `dacb5d39` (prueba 30) | Fuera de esta PR |
| Estudio de imágenes · escritorio (cambios fuera de la zona 0.1 % frente a 0.0 % exigido) | **base** | También falla en `master` `dacb5d39`; la candidata no toca ese módulo | Fuera de esta PR |
| V5 novato (N.12–N.14) | **entorno** | Pasa 2/2 sola en `5a061725`; falló mientras corrían otras pruebas en paralelo | Sin cambio |
| Project-First A4 · dossier (×2) | **candidata** | Pasa en `master`; falla en `claude/entregar-asistencia` | Corregido en `7fc88d41`: el estilo Cliente vuelve a incluir «Imágenes de la vivienda», sin instrucciones de trabajo |
| Project-First A2 · vistas (×2) | **candidata** | Pasa en `master`; falla en Entregar | Corregido en `09b1440b`: «Preparar vistas» no esconde el control enfocado; el foco no cae al documento |

**CI de GitHub en la misma serie**, corregido sin relajar pruebas:
- **`6d087b66`:**
  - Project-First A1 «no fake thumbnails»: las imágenes FOT-01 estaban en la tarjeta antes de pulsar. Corregido en `6e951517`.
  - `qa-m2-novato`: «Crear copia» vive en Proyecto ▾. Corregido en `6e951517` con `mostrar()`.
- **`5a061725`:** `guard`/`observe`. Siete pruebas nuevas no las ejecutaba ningún workflow. Entran en `blocking` en
  `4e581d7f`, porque están en verde en la tanda local.

**Verificación sobre `5a061725`:** `project-dossier`, `dossier-cliente`, `project-views`, `project-first`,
`professional-workspace`, `fot01-casos` y `visual-studio` dan 36 pasan y 1 falla (Estudio de imágenes, de la base).
El novato, solo, da 2/2.

**Preview `5a061725`:** READY (`floorplan-3d-cowiiyu1z-juanma-espinosas-projects.vercel.app`).

**Límite:** la ejecución de `presentation` en `master` se cortó a los 1500 s (prueba 56 de ~60). Los dos fallos que se
clasifican (G-02, P16) quedaron registrados antes del corte.
