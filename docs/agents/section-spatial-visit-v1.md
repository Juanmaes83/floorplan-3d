# RUBIK SOTA — MISIÓN CLAUDE CODE
# SECTION → SPATIAL VISIT V1 · Desarrollo autónomo con vídeo, QA y GitHub continuo
Fecha: 2026-11-04

**Repositorio:** `Juanmaes83/floorplan-3d`
**Rama ya creada:** `feat/section-spatial-visit-v1`
**Base fijada:** `master@0f9c6ead9732901681498efec326d1ca92e42ffe`
**Agente:** Claude Code en worktree NUEVO, independiente.
**Autorización:** implementar, ejecutar pruebas, iterar, capturar vídeo y PNG, hacer commits y push periódicos, documentar y abrir PR draft. Progresar por hitos autónomamente mientras haya capacidad.
**No autorizado:** merge, despliegue de producción, editar ramas ajenas, publicar datos privados, cambiar permisos/costes ni declarar validación visual humana.

## 0. DESTINO FINAL: NO REPETIR LA SECCIÓN DINÁMICA

**FT3D-3 YA EXISTE EN RUBIK. NO RECONSTRUIRLO.**

Necesitamos convertir la sección visual del modelo real en una **experiencia espacial cinematográfica, reversible y controlable**, que permita comprender la vivienda, acercarse a una estancia auténtica y entrar en el modo de visita 3D existente.

**Storyboard de éxito:**
1. Vista general real del proyecto.
2. Sección frontal de un corte vertical verdadero, con caras de corte legibles y escala/encuadre estable.
3. Apertura fluida de lente/perspectiva que revela profundidad detrás del corte sin cambiar de edificio.
4. Aproximación comprensible a una estancia REAL del plan del profesional; ruta sin atravesar muros, muebles, puertas cerradas ni techo.
5. Llegada a una cámara a altura de ojos y posibilidad de seguir en `Recorrer`/visita espacial, con controles, puertas y colisiones existentes.
6. Retroceder, pausar, volver a sección, cancelar o salir y restaurar el estado original de presentación/editor, sin residuos.

**La experiencia no está conseguida si sólo se añade un botón, una pantalla estática o un salto de cámara.** Debe demostrarse en un vídeo continuo revisado del último SHA, con fluidez razonable y significado espacial evidente. Tampoco hay que inventar una ruta sólo para hacerla cinematográfica.

Las escenas refuerzan la presentación arquitectónica de Rubik: clara, comercial, premium y verdadera respecto al proyecto. Se trabajará con el MISMO modelo, renderer, Story y autoridad geométrica. No implementar otra aplicación.

---

## 1. LÍNEA BASE Y AISLAMIENTO

**CONFIRMADO en master:**
- `js/presentation-section-core.js`: derivación pura de sección desde geometría Rubik.
- `js/presentation-story-core.js`: `sectionOpen`, `planReveal`, `roomDescent`, `NARRATIVES`, `SCENE_MS` y `stateAt(p)`.
- `js/presentation-ui.js`: configuración profesional, player, orden de estancias y retorno.
- `index.html`: `View3D.presentationStoryBegin/Apply/End`, cámara, render, clipping y modo `Recorrer`.
- `js/presentation-route.js`: autoridad de rutas y coreografía existente.
- `FloorPlanProjectV1`, `FloorPlanBuildingV1`, `SurfaceRenderer`: autoridades de verdad.
- Tests dedicados `tests/presentation-section.test.cjs` y `tests/presentation-section.browser.test.cjs`.

El contrato FT3D-3 publicado establece sección real, elección determinista 50/40/60 %, FOV de sección, dolly zoom, clipping/caps, multipiso por nivel, reduced-motion y restauración. **No gastar tokens rehaciendo lo ya realizado.**

**Separación obligatoria:**
- Delivery cliente PR #166, `feat/delivery-client-3d-experience-v1`, es draft SIN MERGE; sus APIs nuevas `walkPose` y `walkToRoom` no forman parte de master. NO asumirlas disponibles, no copiar a ciegas y no editar esa rama.
- Kimi F02 V2 PR #167, `feat/visual-families-hero-fidelity-v2`, es otra rama draft. No consumir ni editar.
- Hybrid `feat/hybrid-registered-elevation-v1` permanece intacta pendiente de revisión humana.
- `feat/ft3d-3-dynamic-section` y PR #157 son antecedentes; no reabrir campañas cerradas.
- Floor-by-Floor y The Face siguen pausadas.
- **Esta misión no publica la sección en Delivery**. Dejar contrato de integración futura y preview profesional verificable.

**Primeros pasos:**
1. Verificar SHA remoto, worktrees, rama propia, AGENTS.md y cambios locales. Reutiliza la rama ya creada sin force push ni reset.
2. Trabaja en worktree aislado de Delivery/Hybrid/Kimi.
3. Lee este documento, el contrato FT3D-3 y sólo las funciones relevantes del código. Ejecuta baseline de tests de sección y Story.
4. Crea `docs/qa/section-spatial-visit-v1/progress.md` con base, primer SHA, qué existe, brecha concreta y próximo paso. Publica primer checkpoint antes de desarrollar extensamente.
5. Empieza R1; no entregar sólo un plan.

---

## 2. FUENTES DE REFERENCIA PINNED — LECTURA ACOTADA

### Autoridad de producto
- `docs/product/ft3d-3-dynamic-section-contract-2026-10-31.md`, ``1–13 y 16–18: implementación base que debes extender, no repetir.
- `docs/product/flat-to-3d-presentation-knowledge-programme-2026-10-30.md`: paso sección frontal→perspectiva→visita, cámara como parte del producto.
- `docs/product/ft3d-donor-global-reconciliation-2026-11-01.md`: D01 encuadre; D02 sección/framing; D06 caps; D08 frente de revelado; **D13 coreografía y validez real de rutas**; D20/D21 QA y evidencia.
- `docs/product/evidence/donor-cuts-2026-11-01/manifest.md`: procedencia exacta.
- Cuts 1–2: `docs/product/ft3d-donor-code-gap-analysis-2026-11-01.md` en `cc04f67fc0b46c87bc696bf566adb362f43041fd`; usar sólo las entradas D01/D02/D06/D08/D13 pertinentes.
- `docs/product/evidence/donor-cuts-2026-11-01/cut3-d14-d15-d19.md`: composición de cámara y escala percibida, si se requiere.
- `docs/product/evidence/donor-cuts-2026-11-01/cut5-d20-d21-completion.md`: método QA, evidencias y límites legales.
- `docs/technical/terminal-development-loop.md`: loop, checkpoints, recuperación; adaptar a Claude, no usar comandos Codex sin verificar.

### Donantes ejecutables, NO autoridades constructivas
`Juanmaes83/flat-to-3d@d7b9b69753d3af679535ee56695a05c8d955c3c6`:
- `02-section-sweep/README.md`, `main.js` (cámara, `swingState`, walkthrough de ejemplo) y `draw.js` si hay una necesidad concreta de tinta.
- `03-open-section/README.md`, `page.js` (`mix` y `stateAt`), `engine.js` (clipping/caras) si es útil.
- Demos de referencia: https://sam1983aing.github.io/flat-to-3d/02-section-sweep/ y https://sam1983aing.github.io/flat-to-3d/03-open-section/.

**Aprender:** sección del mismo modelo; plano estable mientras abre FOV; tinta→material sólo cuando tenga utilidad; cámara con dirección espacial; entrada al interior y vuelta clara.

**NO copiar:** casa del donante, trayectorias spline prefijadas, habitaciones inventadas, tres plantas de demo, valores de lente que no cuadren con Rubik, scroll runner/renderer nuevo, materiales ficticios. D13 advierte que endpoints válidos NO garantizan un camino libre; incluso una spline suave puede colisionar. La ruta validada de Rubik manda.

El donante Flat-to-3D declara MIT con atribución; conservar licencia y avisos si copias código. Los assets/dependencias tienen permisos separados y no deben copiarse sin verificación.

### Vídeo y referencias visuales disponibles
- `videos/proyecto-floor-plan-3d.mp4` está versionado en el repositorio (~91,7 MB); consultar sólo fragmentos relevantes y keyframes con herramientas existentes, no reprocesar 90 MB reiteradamente.
- El programa y la reconciliación anteriores contienen las interpretaciones visuales del vídeo y los Cuts.
- Hay otros vídeos originales citados en informes históricos que pueden estar sólo en carpetas locales ajenas; **verificar antes de afirmar acceso**. No bloquear el desarrollo si esos vídeos no están disponibles; utilizar las demos y documento existente.

**No hacer otra auditoría de todos los D01–D21 ni de toda la aplicación.**

---

## 3. CONTRATO DE EXPERIENCIA PARA PROFESIONAL Y ESPECTADOR

### Profesional
Añadir de forma aditiva al flujo de `Presentar mi vivienda` una opción clara, por ejemplo `Sección → visita espacial`, desactivada por defecto y sólo habilitada cuando la sección y un destino sean reales y compatibles.

- Elegir destino a partir de `roomId/levelId` de estancias existentes elegidas por el profesional y en su orden; puede ser la primera estancia válida con opción de elegir otra.
- Sin waypoints dibujados manualmente, sin programación de una spline y sin una nueva área global.
- No duplicar los controles de Story ni la configuración FT3D-6; reutilizar player y sesión de presentación.
- La disponibilidad debe expresar razones verificables: sección incompatible, habitación inexistente, punto inseguro, ruta bloqueada, etc.
- Si una plantilla profesional no exige el capítulo, no cambiar sus mínimos ni reglas por defecto.

### Espectador
- Mantener la etiqueta `Sección visual · derivada del modelo · no es plano de ejecución` o equivalente comprensible.
- Controles existentes: play/pausa, progreso, anterior/siguiente, repetir, ir a estancia, volver a sección, salir. Ratón, teclado, touch, accesibilidad y foco visibles.
- Un CTA `Entrar en la estancia` / `Explorar desde aquí` sólo cuando existe pose de entrada válida; si cambiar de modo implica una transición distinta a un vuelo real, explicarlo.
- Mantener coherente el minimapa existente: posición, habitación destino, dirección y línea de sección cuando aplique. No crear minimapa paralelo.
- UI visualmente atractiva, sin tapar el corte ni robar área útil en móvil. No rediseñar todo `Entregar` ni importar la UI del cliente en draft.

---

## 4. STORYBOARD Y CONTINUIDAD — GATES S0–S6

Esta misión **completa la conexión entre sistemas existentes**, no reimplementa el story engine.

El diseño debe privilegiar componer `sectionOpen` → `roomDescent` → `Recorrer` sobre el mismo estado/renderer. Introducir un pequeño adaptador/narrativa de transición pura sólo si hace falta para continuidad y restauración reales.

**S0 · Overview:** misma pose determinista y materiales reales, sin residuo de corte. Si el profesional eligió `planReveal`, preservar esa precedencia.

**S1 · Sección frontal:** clipping vertical real y caras/contornos donde corta muros; encuadre legible, hold suficiente, caption veraz, referencia de ubicación en minimapa.

**S2 · Abrir profundidad:** dolly zoom y dirección de mirada coherentes, sin cambiar de modelo; tamaño aparente del corte estable en el momento crítico; el espacio detrás de sección empieza a leerse.

**S3 · Destino y aproximación:** señalar una estancia realmente elegida. Rutas/poses derivadas de geometría real; trayectoria de cámara suave y físicamente válida. No volar a través de paredes, puertas cerradas, techos o muebles. Una interpolación de endpoints sin prueba espacial no es suficiente.

**S4 · Vista interior:** llegar a una posición libre a altura de ojos, encuadre que enseñe la habitación y la relación con su acceso; sin clipping/caps residuales, salto de horizonte, pared delante de lente ni cambio de proyecto.

**S5 · Relevo:** transferir control a la presentación/`Recorrer` existente. Preservar colisiones, puertas, inputs, focus y posibilidad de salir. No duplicar el renderer, la locomoción ni un loop de animación.

**S6 · Retorno:** pause/reverse/replay/Back/Escape/cerrar funcionan en cualquier etapa. Se restauran pose, target, FOV/near/far, orientación y órbita, `opt.cut` horizontal, clipping/visibilidades, muros/muebles, nivel, selección y recursos, según el modo al que se vuelve. Salir de Presentation devuelve el editor exacto.

### Reglas de matemática y rutas
- Los endpoints vienen del `FloorPlanPresentationCore` y la identidad estable `projectId/entryId/levelId/roomId/revision`. No inventar IDs por nombre de habitación ni persistir una cámara artística como dato de proyecto.
- `stateAt(p)` puro y determinista, con valores reproducibles también en `0 / .25 / .5 / .75 / 1`, seek arbitrario, reverse, pause y replay.
- Reutilizar poses existentes de overview, sección y roomDescend; no cambiar la cámara de base para conseguir una sola captura bonita.
- Sección/volúmenes/caps calculados al entrar o cambiar de planta, no por frame. Ruta sólo se recalcula si cambian los inputs autorizados.
- Validar espacio libre y camino real, no sólo que el destino está dentro del polígono de habitación. Revisar huecos y puertas reales, evitar GLB y mobiliario sólido.
- Si NO hay ruta físicamente válida, **fallback honesto**: sectionOpen→overview/roomDescent existente, ofrecer CTA de entrada manual validada, explicar que se cambia de modo; no falsear un vuelo continuo.
- En edificio de dos niveles, usar `showLevel`/Presentation existente; NO simular escaleras que no se recorren ni un edificio apilado falso.
- No usar `opt.cut` como sustituto del clipping vertical y no cortar terreno, ortofoto, contexto, UI o minimapa.

### Reduced motion
Sin flythrough obligatorio: estados discretos equivalentes que permiten leer la sección, abrir profundidad, entrar mediante acción explícita y volver. El efecto no puede desaparecer por tener animación reducida.

---

## 5. CRITERIOS VISUALES Y COMERCIALES

Una experiencia **profesional y perceptiblemente mejor** demuestra:
- Sección que se entiende como corte arquitectónico del proyecto real y no paredes truncadas al azar.
- Tamaño de sección coherente al abrir lente; sin cambio súbito de escala o falsos espesores.
- Aproximación que identifica el destino, mantiene horizonte estable y lleva a una habitación legible; no sólo teletransporte.
- Materiales/vidrio/interiores reales permanecen tal como los proporciona el renderer, sin inventar mobiliario.
- Movimiento natural, ritmo que permite leer cada etapa; sin flicker de clipping, pop-in de caps ni paredes flotantes.
- Controles bonitos, legibles y con feedback; el vídeo muestra un viaje comprensible.
- Vista sin la opción activada comportándose igual que la presentación base.

**Evaluar por separado:** verdad semántica, composición, continuidad de cámara, estabilidad temporal, rendimiento y UX. El test verde no implica aceptación visual.

No añadas shaders sofisticados de donantes que no estén justificados por una diferencia relevante y medible.

---

## 6. CASOS LÍMITE NO NEGOCIABLES

1. Casa de una planta con sección/room válidos; planta rectangular e irregular.
2. Sección imposible (bounds o intersecciones): no ofrece capítulo falso.
3. Sin habitación elegida, roomId obsoleto o no disponible.
4. Puertas cerradas y acceso bloqueado; ruta inexistente; estación inicial inaccesible.
5. Paredes, muebles y GLB que obstaculizan cámara o tránsito.
6. Puertas/ventanas/vidrio atravesados por sección: sin residuos extraños.
7. Dos plantas; una soportada y otra no; no paseo ficticio por escaleras.
8. Cambio de nivel, proyecto o revisión durante sesión.
9. Cancelar en S1/S2/S3/S4, Back/Escape repetidos, reingresar varias veces.
10. Fallo del renderer/recurso, WebGL context loss/restauración cuando pueda simularse.
11. Teclado, táctil, tab, foco, captions y `prefers-reduced-motion`.
12. Viewport escritorio 1440×900, móvil vertical 390×844, horizontal 844×390.
13. Modo base desactivado, vídeo/capturas y presentación normal sin regresión.
14. Inmueble sin ruta adecuada: fallback explícito, no recorrido inventado.

NO alterar schema, geometría, materiales declarados, datos privados, clipping horizontal existente, colisiones ni persistencia.

---

## 7. HERRAMIENTAS EXISTENTES PARA QA

Reusar antes de instalar algo nuevo:
- `scripts/qa/presentation/harness.cjs` — Playwright/Chromium y servidor.
- `scripts/qa/presentation/gpu-check.cjs` — identificador GPU, diferencia SwiftShader/CPU.
- `scripts/qa/render-presentation-story-frames.cjs` y `scripts/qa/record-presentation-story.cjs`.
- `tests/presentation-section.test.cjs`, `tests/presentation-section.browser.test.cjs`.
- `tests/presentation-story.test.cjs` y browser asociado.
- `tests/presentation-route.test.cjs` y browser asociado.
- `tests/walk-controls.browser.test.cjs`, `tests/walk.browser.test.cjs`.
- `tests/presentation-reveal.browser.test.cjs`, `tests/presentation-templates.browser.test.cjs`.
- `docs/qa/PR-preview-checklist.md`.

Usa Node/CLI, Chrome/Chromium y `ffmpeg/ffprobe` si ya existen; confirma versiones reales y ruta `playwright`, sin dar por hecho instalación en raíz. No instalar otro navegador si puedes aprovechar el existente.

### Plan de pruebas
**Unitarias:** narrativas, destinos, determinismo, reversa, poses, decisiones de fallback, data contract sin mutación.

**Browser:** entrada real sección→estancia→Recorrer→salida, recorrido validado vs bloqueado, minimapa/controles, 1/2 niveles, cambios de proyecto, 5 ciclos y WebGL loss/restauración si es comprobable.

**Visual desktop+mobile:** S0–S6, varias vistas/room; vídeo continuo real con tiempo suficiente para inspeccionar movimiento y estados; separa capturas de evidencias realmente revisadas.

**Rendimiento:** tiempo de entrada, frame interval p50/p95 y recursos en baseline/candidato comparables, distinguir rAF de coste GPU, NO certificar móvil físico con viewport emulado.

**Regresión:** Section/Story/Presentation/Route/Walk OFF y ON, proyecto JSON sin cambios, fuga de objetos, restauración y toolbars existentes.

Los fallos ajenos deben reproducirse exactamente en el baseline antes de clasificarlos como históricos. No llamar CI «PASS» sin ejecución verificada.

---

## 8. LOOP VISUAL Y GITHUB — ORDEN OBLIGATORIA

**Implementar → test focalizado → renderizar/grabar → abrir e inspeccionar → corregir → COMMIT → PUSH → VERIFICAR SHA REMOTO → checkpoint → seguir.**

- No acumules horas de cambios únicamente en local. Publica R0 y cada incremento funcional, cada comparación visual relevante, antes de una prueba larga y antes de cualquier pausa/corte por créditos.
- Verifica `git status`, `git rev-parse HEAD` y `git ls-remote origin refs/heads/feat/section-spatial-visit-v1`; sólo declara publicado si los HEAD coinciden.
- Guarda `docs/qa/section-spatial-visit-v1/progress.md`: estado, fase, base, HEAD local/remoto, SHA probado, tests, enlaces de evidencia, defectos observados, próxima acción exacta.
- Guarda `docs/qa/section-spatial-visit-v1/evidence-manifest.json` con rutas, hashes, viewport, modo GPU y `CAPTURED/INSPECTED`.
- Subir a Git muestras JPG/contact sheets compactas y un pequeño storyboard visible. Los vídeos grandes en artefactos de Actions u otro almacenamiento permitido; verificar enlaces descargables y caducidad. No dejar **todas** las evidencias sólo en `/tmp` o en máquina local.
- Cada ciclo debe corregir uno de los 2–5 defectos de mayor impacto, no limitarse a cambiar constantes al azar.
- Si 3–4 iteraciones sustanciales no convergen, cambia de mecanismo/cámara y registra `VISUAL_NON_CONVERGENT`, sin agotar crédito en pulido microscópico.
- No volver a ejecutar baterías grandes tras cada detalle; hacer tests focalizados por incremento y regresiones completas al cierre.
- Si hay bloqueo, publicar estado `BLOCKED/PARTIAL` y seguir con subtarea independiente autorizada. No inventar PASS.

**Autonomía esta noche:** puedes avanzar por todas las fases R0–R5 sin solicitar aprobación humana entre avances seguros. La persona revisará capturas/vídeos mañana. No prometer reanudación automática tras agotamiento de cuota sin comprobar que Claude CLI realmente la soporta; no cambiar permisos, facturación, autenticación ni energía del equipo. No más de un agente escritor por worktree.

---

## 9. ROADMAP EJECUTABLE

**R0 · Reconciliación rápida + checkpoint remoto.** Contratos y pruebas actuales, hoja de progreso; crear primer commit y push. NO detenerse en planificación.

**R1 · Bridge Section → Room.** Acoplar sección actual a habitación real elegida y mostrar primera continuidad; pure model + browser mínimo; grabar vídeo real. Publicar.

**R2 · Handoff espacial.** Recorrido validado, pose segura eye-level y entrega a `Recorrer`. Fallback coherente para rutas bloqueadas, retorno a sección. Publicar.

**R3 · Escultura y UI.** Ajustar encuadre, ritmo/holds, transición de lente y cámara, notas/mapa y controles profesionales; vídeo antes/después realmente inspeccionado; desktop y móvil. Publicar.

**R4 · Robustez.** Reversa/seek/replay, reduced motion, 2 niveles, cancelación, context loss, cinco ciclos, regresiones; rendimiento comparable. Publicar.

**R5 · Entrega.** PR en borrador contra master, documentación y evidencias remotamente accesibles, listado de limitaciones y QA final sobre SHA exacto. Publicar y verificar. No merge, no deploy, no empezar otra misión.

Si un hito llega a bloqueo real, documentar y avanzar con parte independiente; no aprobar automáticamente la calidad por tests.

---

## 10. ACEPTACIÓN V1 Y HANDOFF

El resultado será **READY_FOR_HUMAN_REVIEW** sólo si se cumplen:
- [ ] Section FT3D-3 original no se duplica ni se regresa.
- [ ] Sección real, legible y con opening 3D perceptible y fiel.
- [ ] Destino corresponde a estancia y nivel reales elegidos.
- [ ] Transición espacial no atraviesa sólidos; fallback honesto cuando no existe ruta.
- [ ] Entrada interior/Recorrer a altura de ojos con puertas/colisiones existentes.
- [ ] Progreso reversible y retorno exacto a cámara, clipping, materiales, nivel y editor.
- [ ] UI/controles/español y accesibilidad en desktop y mobile viewport.
- [ ] Vídeo continuo real y storyboard S0–S6 inspeccionados.
- [ ] Test específicos y regresiones sin fallos nuevos ocultos.
- [ ] Memoria/recursos sin fugas observadas en ciclos medidos.
- [ ] Invariantes del proyecto, JSON, datos, permisos y ramas ajenas intactos.
- [ ] Checkpoints y evidencias publicadas con SHA remoto verificado.
- [ ] PR draft y estado humano pendiente de decisión.

**Entregar informe breve y transferible:** rama y HEAD; código añadido; mecanismo donante adaptado con procedencia; estado S0–S6; pruebas y GPU; vídeos/capturas con enlaces descargables; defectos pendientes; próximos pasos. Mantener estados separados `TECHNICAL_PASS/PARTIAL`, `VISUAL_PENDING_HUMAN`, `MOBILE_PHYSICAL_PENDING`, `CI_STATUS` y `MERGE_NOT_AUTHORIZED`.

**NO hacer merge ni desplegar a producción. NO tocar la PR #166 de Delivery, #167 de Kimi, Hybrid ni las otras experiencias pausadas.**

## ORDEN FINAL A CLAUDE CODE

Lee esta misión directamente en `feat/section-spatial-visit-v1`, confirma estado Git y elementos FT3D-3 ya existentes, utiliza las técnicas D02/D13 y los vídeos/demos seleccionados, implementa un bridge real desde sección hasta visita espacial, **graba e inspecciona la transición**, corrige defectos, haz commit/push/verify después de cada avance y continúa autónomamente hasta R5 o un bloqueo documentado. El profesional debe poder mostrar el paso de la sección al espacio real de su vivienda, no sólo iniciar otra animación genérica.

**NO DUPLICAR FT3D-3. NO PROMESAS SIN VÍDEO. NO TRABAJO ÚTIL SÓLO EN LOCAL. NO MERGE. NO DEPLOY.**
