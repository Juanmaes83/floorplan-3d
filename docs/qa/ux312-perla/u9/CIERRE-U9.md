# U9 · Navegación coherente — cierre

**SHA final de U9:** `f49b79572c…` (ver `git log`), sobre `5d487d4c` + corrección de dos pruebas de Codex.
**Batería completa (39 suites, 3D real, Chromium 153, SwiftShader):** sobre `5d487d4c`, worktree fijo (sin ediciones
durante la ejecución). Tabla: `bateria-5d487d4c.md`. Resultado: **35 pasan, 4 con fallos**, todos explicados:

| Suite | Caso | Causa comprobada | Evidencia | Estado en el SHA final |
|---|---|---|---|---|
| share-link | Phase B4 | La prueba buscaba «Publicar enlace» una sola vez; con U9 la ficha P7 lo muestra como acción y su panel también (mismo control real). | `fallo-*` en la batería; corrección `f49b7957` | **Pasa** (1/1), y share-withdraw 2/2 |
| bpdp-routes | dos demos y cuatro salidas | El vídeo tarda 184 s / 337 s con 3D por software; la prueba espera 90 s. Con espera ampliada: **pasa entera**, MP4 h264 1080p, 19 s y 21,5 s, decodifican completos. | `bpdp-routes-video.md` | Igual (entorno); aserciones intactas |
| tour-video | SCULPT dron | Agota 240 s; **falla igual en la rama de Codex sola** (`b7af2d99`). | registro U8 | Igual (entorno, prueba de Codex) |
| presentation | 27 · P16 | Falla también en `master` (preexistente, no PERLA). | baterías anteriores | Igual (preexistente) |
| presentation | 26 · P15 | Sensible a la carga (4 suites en paralelo); **aislado pasa** (126 s). | ejecución aislada sobre `5d487d4c` | Pasa aislado |

Comparación reproducible del cambio de historial (`perla-return.js`): `opening-contextual` y `share-link` pasan en
`b6c411f7` (antes), fallan en `8368cfa7` y pasan con `b0ffb13c` (la presentación y las entradas de la misma área ya no se
interceptan). Tablas: `bateria-8368cfa7.md`, `bateria-5d487d4c.md`.

Entregado en U9:
- «Volver» al origen (área, ficha y posición) en el sitio de siempre.
- Atrás o Adelante del navegador dentro de la app.
- Atrás cierra primero el diálogo abierto.
- Aviso «✓ Guardado».
- Acceso «Asistente» del móvil como pie de diálogo.
- Sin duplicados a la vista. Excepción documentada: el «Recorrido de obra» de Presupuestar, que se une al semáforo en U10.

Pruebas propias:
- `perla-return` 2/2.
- `perla-dialog-assistant` 2/2, con control negativo.
- Auditorías reproducibles: `auditoria-volver.cjs` y `auditoria-duplicados.cjs`.
