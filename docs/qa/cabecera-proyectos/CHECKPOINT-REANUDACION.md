# Checkpoint de reanudación · Claude · 27/11/2026 (noche)

Enlace a este checkpoint: https://github.com/Juanmaes83/floorplan-3d/blob/claude/cabecera-proyectos/docs/qa/cabecera-proyectos/CHECKPOINT-REANUDACION.md

## Ramas y worktrees (todo publicado: SHA local = remoto, comprobado con `git fetch` antes de escribir esto)
| Bloque | Rama | SHA | Worktree local | Estado |
|---|---|---|---|---|
| §9 Cabecera y proyectos (**rama activa**) | `claude/cabecera-proyectos` | `cf54b169` (+ checkpoint) | `/home/user/hdr` | candidata: Exportar diseño, acciones junto a su tarea, «Revisar en 3D»; local 2/2; falta regresión |
| §§8.1–8.2 y §10 (análisis y propuestas) | `claude/entregar-asistencia` | `d32c53ae` | `/home/user/ent` | inventario de Entregar + primer caso D3; §10 FOT-01 propuesta; esperan decisión |
| §5.3 Presupuestar y Analizar | `claude/ux-presupuestar-analizar` | `852e0f44` | `/home/user/p53` | corte 2 publicado; regresión EN CURSO |
| §5.2 BC3 | `claude/ux-bc3` | `a9bac718` | `/home/user/bc3` | cerrado y aprobado |
| §5.1 Visita 3D | `claude/ux-visita-3d` | `e20644b9` | `/home/user/ux` | cerrado y aprobado (36 capturas regeneradas por pruebas sin publicar: no son trabajo) |
| §7.1 Muros (producto) | `claude/muros-forma-descubrible` | `94f5b981` | `/home/user/geo` | aprobado |
| Preview Muros OP-07 activo (NO fusionar) | `claude/preview-muros-op07-activo` | `d4e2a733` | — | Preview revisada |
| StoryLayersV1 §7.2·§7.3·§8.3 | `claude/storylayers-v1` | `cd694e88` | `/home/user/story` | aprobado |
| Rodaje / tapicería v3 · §11 Blueprint (análisis) | `claude/rodaje-cierre-1440` | `cace5fc0` | `/home/user/rodaje` | sofá aprobado; MP4 en pausa; storyboard §11 propuesto |
Worktree auxiliar sin rama: `/home/user/base53` = base `dacb5d39` (contraste Point9; se puede retirar).

## Pruebas en curso
- **Regresión del §5.3, corte 2** (`852e0f44`, 23 archivos): script `scratchpad/p53-regr2.sh`, log
  `scratchpad/p53-regr2.log` (scratchpad = `/tmp/claude-0/-home-user/8ae691a0-8fef-5086-ba65-d2c190bb8356/scratchpad`).
  Consultar: `pgrep -f p53-regr2.sh` (¿sigue?) y `grep -E "^not ok|^# (tests|pass|fail)" <log>`. Al compactar: en curso,
  11 superadas, 0 fallos. Su salida `docs/qa/ft3d-8-m2-examen-final-2026-11-06/` en `/home/user/p53` es de una prueba: no publicar.
- Contraste Point9 contra `dacb5d39`: base 17/17 y corte 17/17 (los 2 fallos del primer corte `1a69e24b` eran regresión propia,
  corregida en `49e1cf37`).

## Aprobaciones vigentes y Previews revisadas
- §5.2 BC3 · `cb51c9a1` · https://floorplan-3d-pbmh51p45-juanma-espinosas-projects.vercel.app/ (aprobación `60522b5`)
- §5.3 · `7a5db569` · https://floorplan-3d-54812ljcx-juanma-espinosas-projects.vercel.app/ (aprobación `432fcc5`); lo añadido en `852e0f44` aún no revisado
- §5.1 Visita 3D · `8136afe0` · https://floorplan-3d-jfy2tfmwp-juanma-espinosas-projects.vercel.app/
- §7.1 Muros (control y cota) · `d4e2a733` · https://floorplan-3d-mbg1rdc4f-juanma-espinosas-projects.vercel.app/
- StoryLayersV1 · `cd694e88` · tapicería v3 (sofá) · `bb78fca0`
Previews pendientes de revisión (la de §9 se regenera para cada SHA nuevo): §5.3 corte 2 `852e0f44` https://floorplan-3d-ea48zyp68-juanma-espinosas-projects.vercel.app/ ·
§9 candidata `29e4b188` https://floorplan-3d-kcgqptkvo-juanma-espinosas-projects.vercel.app/

## Rodaje (MP4 completo 2 s · 48 fotogramas · 1440p) — EN PAUSA por decisión del propietario
- Salida: `scratchpad/rodaje/kit2-f2-rot30/mp4-completo/interior-1440/frames/` · terminados `f0000`–`f0002` (3/48) ·
  **primer fotograma pendiente: `f0003`**. El render se detuvo (proceso terminado); los fotogramas terminados se conservan.
- Reanudar (continúa por el primer fotograma que falte): `scratchpad/rodaje/mp4-reanudar.sh` (lanzar en segundo plano; ~600 s
  por fotograma con la CPU libre ≈ 7,5 h). Montaje al terminar: `ffmpeg -framerate 24 -i f%04d.png` → `docs/qa/rodaje/tapiceria-v3/movimiento/`.
- Los fotogramas viven en el scratchpad (temporal): si se pierde, se vuelven a renderizar con el mismo comando.
- Carta de materiales (10 casos): después del MP4.

## Qué queda
- **Por cerrar:** regresión del §5.3 corte 2 → publicar resultado y Preview final. Altura libre: «Ver estancia» se queda; la
  edición manual es otro corte (decisión del propietario).
- **Por implementar, en orden:** §9 (rótulo «Exportar diseño» para las salidas; acciones junto a su tarea; «Escena 3D» vs
  «Revisar en 3D» en el recorrido; pruebas de importar, copia, variante, JSON y vuelta a la misma historia de P10; regresión y
  Preview) → §§8.1–8.2 (inventario de plantillas de Entregar + primer caso con el patrón StoryLayers) → §10 Render AI sobre FOT-01
  (inmobiliaria, interiorismo/reformas) → análisis §11 Blueprint (reutilización, enlace al ZIP y report, storyboard) → MP4 →
  carta de materiales → examen de cinco proyectos (al final).
- **Primera tarea al reanudar:** consultar `p53-regr2.log`; si terminó, publicar su resultado en el handoff del §5.3.

## Handoffs
- §§8.1–8.2: https://github.com/Juanmaes83/floorplan-3d/blob/claude/entregar-asistencia/docs/qa/entregar-asistencia/README.md
- §10 Render AI: https://github.com/Juanmaes83/floorplan-3d/blob/claude/entregar-asistencia/docs/qa/render-ai/README.md
- §11 Blueprint: https://github.com/Juanmaes83/floorplan-3d/blob/claude/rodaje-cierre-1440/docs/qa/blueprint/README.md
- BC3: https://github.com/Juanmaes83/floorplan-3d/blob/claude/ux-bc3/docs/qa/ux-bc3/README.md
- Visita 3D: https://github.com/Juanmaes83/floorplan-3d/blob/claude/ux-visita-3d/docs/qa/ux-visita-3d/README.md
- §5.3: https://github.com/Juanmaes83/floorplan-3d/blob/claude/ux-presupuestar-analizar/docs/qa/ux-presupuestar-analizar/README.md
- §9: https://github.com/Juanmaes83/floorplan-3d/blob/claude/cabecera-proyectos/docs/qa/cabecera-proyectos/README.md
- Blender / rodaje: https://github.com/Juanmaes83/floorplan-3d/blob/claude/rodaje-cierre-1440/docs/qa/rodaje/tapiceria-v3/README.md ·
  Windows: https://github.com/Juanmaes83/floorplan-3d/blob/claude/rodaje-cierre-1440/docs/qa/rodaje/HANDOFF-RODAJE-WINDOWS.md

## REANUDACIÓN
Lee primero este checkpoint (enlace arriba) y retoma desde el último SHA de cada rama. Consulta las pruebas activas antes de
volver a lanzarlas. Orden:
A. Cierra la regresión de §5.3. Publica el resultado y la Preview del corte final con su SHA. «Ver estancia» sigue; la edición
   manual de la altura libre queda para un corte aparte.
B. Avanza §9: termina el menú y el inventario antes/después; «Exportar diseño» para las salidas; las demás acciones junto a su
   tarea; distingue «Escena 3D» de «Revisar en 3D» en el recorrido; prueba importar, copia, variante, JSON y volver a la misma
   historia de P10; publica regresión y Preview.
C. Mientras una prueba corre o una Preview espera revisión: §§8.1–8.2 (inventario de plantillas de Entregar y primer caso con
   el patrón StoryLayers) → §10 Render AI sobre FOT-01 (inmobiliaria e interiorismo/reformas con accesos al flujo real) →
   análisis de Blueprint §11. El render de Blender, después.
Si algo requiere aprobación o decisión de alcance, deja la Preview o la propuesta lista y sigue con lo siguiente. Conserva las
aprobaciones; examen de cinco proyectos al final; trabaja desde las ramas propias; al terminar, actualiza este checkpoint.
