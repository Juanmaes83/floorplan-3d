# Checkpoint de reanudación · Claude · 27/11/2026 (noche)

Enlace a este checkpoint: https://github.com/Juanmaes83/floorplan-3d/blob/claude/cabecera-proyectos/docs/qa/cabecera-proyectos/CHECKPOINT-REANUDACION.md

## Estado tras aplicar la revisión del 27/11 (tarde) · L = local · V = Preview Vercel · H = revisión humana
| Bloque | Rama · SHA | Preview (V) | Entrada | Evidencia | Estado |
|---|---|---|---|---|---|
| §9 cabecera | `claude/cabecera-proyectos` · `fccda24b` | https://floorplan-3d-piotfpkn3-juanma-espinosas-projects.vercel.app/ | Diseñar → «Proyecto ▾» · Tareas del proyecto | `video/9-json-descargar-reimportar-*`, `json-menu/`, `regresion/regresion-final-2e23820a.txt` | L: regresión sobre `2e23820a` 401 · 395 ok · 2 fallos de base (G-02 y P16, mismo error en `cd694e88`); regresión del SHA final en curso (`scratchpad/hdr-regr-final4.log`) · H pendiente |
| Entregar: D3, P2/FOT-01, cuadrícula y Home | `claude/entregar-asistencia` · `7b2e01ab` | https://floorplan-3d-eyj9ph0s3-juanma-espinosas-projects.vercel.app/ (en construcción al escribir) | Entregar → D3 · P2 · P8–P10 · Home → «Estilos · muestra ilustrativa» | `docs/qa/entregar-asistencia/revision-27-11/` | L: D3 3/3, FOT-01 2/2, C4 2/2; regresión photo-project y perla-* (28 archivos) encadenada (`scratchpad/ent-regr.log`) · H pendiente |
| Propuesta comercial | `claude/entregar-asistencia` · `7b2e01ab` | — | `docs/propuestas/oferta-comercial-rubik-2026-11.md` | — | borrador, sin precios · H pendiente |
| §6 Presentación con gestos | `claude/gesture-labs` · `e72f34dd` | https://floorplan-3d-4jvsx2qf8-juanma-espinosas-projects.vercel.app/?gesture-lab=1 | Home → «Módulos para tu trabajo» · Entregar → P11 · P1 | `docs/qa/gesture-labs/` (vídeos continuos escritorio y móvil) | L 12/12, sintético · cámara física pendiente (propietario) · H pendiente |
| §11 Película del proyecto | `claude/rodaje-cierre-1440` · `67e147e9` | — | ZIP de Entregar + kit Blender (`--shot pelicula`) | `docs/qa/pelicula-proyecto/control-720/` (3 fotogramas + report) | clip 720p en cola tras las regresiones (`scratchpad/rodaje/pel-clip.log`) · H pendiente |

## Revisión humana consolidada (27/11, mañana) · sustituye los mensajes parciales anteriores
**Aprobado:** §5.3 corte 2 (Preview `852e0f44`; aprobación `32de044c`; regresión 153/153 `e31a9264`). Siguen vigentes §5.2 BC3,
§5.1 Visita 3D, §7.1 Muros con cota, StoryLayersV1 §§7.2·7.3·8.3 y tapicería v3. Altura libre manual = tarea aparte; conservar
«Ver estancia». Aprobar una Preview ≠ integrar ni producción.
**Pendiente de revisión humana:** D3, P2/FOT-01, §9 final, Gesture Labs, vídeo Blueprint §11.

| # | Bloque | Rama | Qué pide la revisión | Estado |
|---|---|---|---|---|
| 1 | Estándar visual Entregar | `claude/entregar-asistencia` | D3 y P2 con componentes de Entregar/Analizar/Presupuestar: una primaria vino, secundarias, «Volver» al origen, pie/Asistente sin tapar | pendiente |
| 2 | Cuadrícula P8→P9→P10 | `claude/entregar-asistencia` | orden visual y de teclado; plantilla común; miniatura P10; tarjeta = estado + siguiente acción, pasos al detalle; capturas antes/después | pendiente |
| 3 | D3 Dossier | `claude/entregar-asistencia` | «Cliente y contacto» · «Nota de presentación» · «Revisar el dossier»; PDF primaria al revisar; «Preparar imágenes» y vuelta sin perder lo escrito; 11 estancias vs 13 espacios (miradores) aclarado; refs. internas solo en Técnica; vídeo escritorio y móvil | pendiente |
| 4 | P2 / FOT-01 | `claude/entregar-asistencia` | estado «5 vistas preparadas» + acción real «Ver imágenes y opciones» (ratón, teclado, táctil); separar Vistas y Reformar desde fotografía; casos sin cortar; ejemplo ≠ simulación; D3 y P2 en una Preview; regresión photo-project + perla-* | pendiente |
| 5 | §9 | `claude/cabecera-proyectos` | JSON solo en Proyecto ▾ (hecho en `2e23820a`); sin JSON en «Exportar diseño»; quitar «(paso)» y la revisión duplicada; encabezado de Tareas recortado; vídeos JSON y P10; Distancia conocida 360/390; regresión del SHA final; G-02/P16 con evidencia; disyuntiva de descarga = histórica | en curso |
| 6 | §6 Gesture | `claude/gesture-labs` | `.vercelignore` excluye `labs/` (el acceso no aparece en Vercel): publicar solo los recursos del laboratorio; captura del botón en la Preview; acceso guiado Entregar → P1; «Empezar con botones»/«Activar cámara»; enseñar cada gesto; vídeo móvil; guía de prueba con cámara frontal; sintético vs físico | en curso |
| 7 | §11 Blueprint | `claude/rodaje-cierre-1440` | 3 imágenes de la misma vivienda (plano alineado, volumen, interior con acabados del ZIP) enlazadas al report; luego clip 720p sin sonido; MP4 2 s 1440p aparte; render largo en su ventana | pendiente (CPU) |
| 8 | Home y oferta | por crear | muestra de estilos con original RUBIK vs ilustrativas; propuesta comercial por profesión (dolor→demo→entregable→beneficio), oferta por proyecto, estudios recurrentes, premium; ejemplo de reforma; medición como plan de prueba; precios a revisión | en cola |
Examen de cinco proyectos: al final, sobre la candidata común.

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


## Actualización 27/11 · 00:30 — noche de trabajo continuo (instrucción del propietario)
| Objetivo | Entrada en RUBIK | Rama · SHA | Evidencia | Pruebas | Revisar al volver |
|---|---|---|---|---|---|
| A · §5.3 plan vacío → borrador → revisado sin recargar; imágenes; inventario | Presupuestar → Plan de obra · Analizar → Exterior | `claude/ux-presupuestar-analizar` · `a901452e` | `docs/qa/ux-presupuestar-analizar/corte2/video/` (MP4 escritorio y móvil + hoja de contactos), inventario en `corte2/` | regresión completa **153/153, 0 fallos** (`e31a9264`) | vídeo y Preview `852e0f44` |
| B · §9 cabecera: JSON y P10 con una vuelta | menú de proyecto ▾ · Entregar → P10 | `claude/cabecera-proyectos` · `5acb40dc` | `docs/qa/cabecera-proyectos/video/` (4 MP4; **aún sin revisar fotograma a fotograma**) | `cabecera-proyectos` 2/2 local; **regresión pendiente** | vídeos y Preview del último SHA |
| Rodaje MP4 | — | `claude/rodaje-cierre-1440` · `6c7a214e` | comando completo fuera de /tmp: `docs/qa/rodaje/mp4-completo/README.md` | — | en pausa: `f0003` primero pendiente |
Gesture Labs (E): **EN ESPERA por orden del propietario** («espera»). Donantes clonados en solo lectura y fijados:
`/home/user/rubik-sota-director-de-orquesta` (`dcf4b7ac`) y `/home/user/map-gesture-controls` (`6939d43a`). Director de Orquesta
no tiene archivo LICENSE: el propietario indica que son suyos y que puede publicarlos para reutilizar las piezas; antes de copiar
código, registrar esa autorización (o la licencia) en el handoff. Patrón analizado del donante principal (before-after-reforma
v2.1.2): clasificación por dedos extendidos + EMA de apertura, estabilización por fotogramas (OPEN 2 · FIST 4 · HOLDING 5),
deslizamiento con |dx|≥0,18, |dy|≤0,11, velocidad ≥0,55/s y 850 ms entre disparos, pérdida de mano a 700 ms sin disparo, parada
de pistas al salir. Base propuesta del laboratorio: el comparador `comparar/` de StoryLayers (dos revisiones reales, cortina).

### REANUDACIÓN (esta noche)
1. §5.3 cerrado en local: regresión 153/153 registrada en `e31a9264`; espera revisión humana (Preview `852e0f44`).
2. Revisa los 4 vídeos de §9 (fotogramas) y lanza la regresión de §9 (`claude/cabecera-proyectos`, adaptar las pruebas que pulsaban
   «Subir plano» en la fila 2 para que abran el menú de proyecto); publica resultado y Preview.
3. C · §8 D3 Dossier (Mi estudio + ficha de cliente + asistencia local, salida sin notas internas) → D · §10 casos FOT-01 →
   F · §11 Blueprint (escena y report para 720p). Gesture Labs solo cuando el propietario lo libere.

## Actualización 27/11 · noche (2.ª instrucción del propietario: bucle nocturno)
| Bloque | Rama · SHA | Estado | Evidencia / siguiente |
|---|---|---|---|
| §9 cabecera | `claude/cabecera-proyectos` · `c921c60f` (+ ayudante `mostrar()` en curso) | regresión de 44 archivos EN CURSO (`scratchpad/hdr-regr.log`); fallos sobre todo por controles movidos al menú de proyecto; **regresión propia corregida**: clic fantasma táctil en «Distancia conocida» (`js/tracing-ui.js`) | contrastar los archivos con fallos en la base `cd694e88` (`/home/user/story`) con la máquina libre; adaptar pruebas con `mostrar()`; reproducir 360×800 y 390×844; regrabar P10 con cambio guardado |
| §8 D3 Dossier | `claude/entregar-asistencia` · `24cc42c8` | implementado y probado (2/2) | `docs/qa/entregar-asistencia/d3/` · falta Preview y repasar el vídeo (empieza en Entregar → D3; impresión) |
| §10 FOT-01 | `claude/entregar-asistencia` · `13546c5a` | código sin probar | generar pares con `tests/zz-fot01-ejemplos.browser.test.cjs` (FOT_OUT, FOT_FLOOR=mat_wood), prueba y vídeos |
| §6 Gesture Labs | `claude/gesture-labs` · `5c55b8ea` (base `cd694e88`) | núcleo 7/7; laboratorio `?gesture-lab=1` escrito; prueba `tests/gesture-lab.browser.test.cjs` sin ejecutar | autorización del propietario registrada (donantes públicos y suyos, 27/11) |
| §11 Blueprint | `claude/rodaje-cierre-1440` · `f4f3ce84` | cronología + conciliación contra el ZIP real; **rótulos corregidos** (mallas ≠ entidades) | render 720p: falta integrar la cronología en `blender-rodaje.py` (otra ventana) |
| §5.3 | `claude/ux-presupuestar-analizar` · `e31a9264` | regresión 153/153 publicada | revisión humana (Preview `852e0f44`) |
Reglas de la noche: MP4 1440p y render Blueprint en pausa; una tanda pesada a la vez.

## Cierre de la noche · 27/11 (bucle nocturno)
Leyenda: **L** = prueba local (Chromium en el contenedor) · **CI** = GitHub Actions (no corre en ramas `claude/…`) ·
**V** = Preview de Vercel (despliegue automático por push; no es producción) · **H** = aprobación humana (pendiente en todo).

| Bloque | Objetivo | Entrada exacta en RUBIK | Rama · SHA | Preview (V) | Evidencia | L | Qué comprobar |
|---|---|---|---|---|---|---|---|
| §9 cabecera y proyectos | acciones de proyecto en su menú, «Exportar diseño», «Revisar en 3D», JSON, P10 con una vuelta | Diseñar → «Proyecto ▾» (menú de proyecto) · Entregar → P10 | `claude/cabecera-proyectos` · `7daf67f1` (código `3bca7fcd`) | https://floorplan-3d-mfq4p4odp-juanma-espinosas-projects.vercel.app/ | `docs/qa/cabecera-proyectos/video/` (JSON, P10 con cambio guardado), `distancia-conocida/` (rama y base) | 66 → 30 → 0 en los archivos reejecutados; regresión completa final sobre `3bca7fcd`: 401 pruebas · 394 ok · 3 fallos (G-02 y P16 preexistentes en la base; 1 **conflicto abierto**, ver README) | menú de proyecto en escritorio y móvil; vídeo `9-p10-capitulo-con-cambio-*`; fila 2 con ⤓; aviso de variante |
| §8 D3 Dossier | cliente, contacto de Mi estudio, nota con ayuda local; la salida excluye notas internas y campos no marcados | Entregar → D3 Dossier del proyecto → Preparar dossier → «Preparado para» | `claude/entregar-asistencia` · `24cc42c8` (evidencia `26e2aeee`) | https://floorplan-3d-6q38g1av0-juanma-espinosas-projects.vercel.app/ | `docs/qa/entregar-asistencia/d3/` (vídeos con la ventana de impresión, capturas) | `dossier-cliente` 2/2 | portada e impresión: solo lo marcado |
| §10 FOT-01 | dos casos con ejemplo propio y acceso a la acción de hoy | Entregar → P2 «Imágenes» (ficha) → «Reformar desde fotografía · dos casos con ejemplo» | `claude/entregar-asistencia` · `369047c6` | https://floorplan-3d-1sltg4nvj-juanma-espinosas-projects.vercel.app/ | `docs/qa/render-ai/fot01/` (vídeos y capturas) | `fot01-casos` 2/2 | textos honestos («no retira muebles»), aviso de simulación |
| §6 Gesture Labs | plano → 3D de la misma revisión → antes/después con ≤ 2 gestos y controles equivalentes | `/?gesture-lab=1` → «Presentar con gestos · laboratorio» | `claude/gesture-labs` · `4375c07a` | https://floorplan-3d-c0qx1ey77-juanma-espinosas-projects.vercel.app/?gesture-lab=1 (se estaba construyendo al escribir esto) | `docs/qa/gesture-labs/` (vídeos, capturas, README) | 10/10 (gestos sintéticos, cámara simulada) | **pendiente: webcam real** (ver README) |
| §11 Blueprint | cronología y report contra el ZIP real; comando para la próxima ventana | (kit de rodaje, sin interfaz) | `claude/rodaje-cierre-1440` · `f4f3ce84` | — | `docs/qa/blueprint/evidencia/blueprint-timeline-pkg3.json` | generador probado con pkg3 | rótulos por entidad; render 720p pendiente de integrar en `blender-rodaje.py` |
| §5.3 | resultado final | Presupuestar · Analizar | `claude/ux-presupuestar-analizar` · `e31a9264` | https://floorplan-3d-ea48zyp68-juanma-espinosas-projects.vercel.app/ (`852e0f44`) | `corte2/video/` | 153/153 | revisión humana |
Siguen en pausa el MP4 de 1440p (`f0003`) y el render de Blueprint. El examen de cinco proyectos queda para el final.
