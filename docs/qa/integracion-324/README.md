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

## Regresión del conjunto
En curso sobre esta rama: 64 archivos, los de §9 más `photo-project`, `perla-*` y las pruebas de las fichas de Entregar.
Después, G-02 y P16 sobre `master` `dacb5d39` para clasificar los fallos. Cada fallo se anotará como **base**,
**candidata** o **entorno**, con su evidencia.
