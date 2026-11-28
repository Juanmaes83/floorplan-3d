# Checkpoint de reanudación · Claude · 27/11/2026 (noche)

Enlace a este checkpoint: https://github.com/Juanmaes83/floorplan-3d/blob/claude/cabecera-proyectos/docs/qa/cabecera-proyectos/CHECKPOINT-REANUDACION.md

## ▶ CHECKPOINT · 28/11/2026, 11:10 (bucle autónomo, cinco frentes)

1. **avc1**: Chromium 153 sobre `ad928d43` → P10 §8.3 rc 0, sin aviso, MP4 del cliente completo (9,95 s, 138 fotogramas, sha = manifiesto).
   `reanudacion/avc1-ci/chromium153-ad928d43/` (9635c77a). Cambio mínimo de CI propuesto SIN aplicar: consolidation-regression.yml
   L47/L87 playwright 1.62.1 → 1.63.0 (42 fijaciones en 31 workflows). Espera autorización de Juanma. #324 en borrador.
2. **Pieza a pieza pulido**: efectos `pasos/12-pieza-a-pieza-pulido` (código b33d56fb, evidencia 1ª línea de este push). Rótulo sin encogerse,
   contorno naranja. Defecto nuevo: relevo de rótulos superpuesto ~6 fotogramas → siguiente corrección.
3. **Muestra para el profesional**: código 228eb656 (núcleo `sample`, kit `--muestra`, `rodar muestra`, aviso en la confirmación).
   Pendiente: demostración con caso real (ZIP descargado de RUBIK → `sh rodar.sh muestra` con BLENDER→bpy) y prueba UI.
4. **Desde el paisaje**: Catastro sigue limitado (11:0x, RCCOOR 403 límite por hora); GML INSPIRE (www.catastro.hacienda.gob.es)
   acepta conexión pero no responde en 30 s. Bloqueado: necesita que Catastro responda o la parcela que indique Juanma.
   En desarrollo, sin validar: rótulo «vivienda ficticia sobre entorno real» + atribución en el vídeo (cambio local en blender-rodaje.py, sin commit).
5. **Inventario de ramas**: `inventario-ramas/` parcial; el script sigue corriendo en segundo plano.
Si hay reinicio: nada que reanude solo; relanzar `inventario.sh` y la validación del rótulo de paisaje.

## ▶ CHECKPOINT · 28/11/2026, mañana (tanda dirigida de Juanma: avc1, rótulos, Pieza a pieza por grupos)

1. **avc1 / P10 §8.3 (#324 `ad928d43`)** → `reanudacion/avc1-ci/` (commit 594a6c1b). Chromium de CI (151, playwright 1.62.1) instalado
   aislado en `scratchpad/pw1621`: la prueba falla igual que CI (rc 1). Mismo recorrido de grabación en master `dacb5d39`: **mismo aviso**.
   MP4 de ambos: se abren, duran ~7,4 s, se reproducen hasta `ended`, decodificación estricta limpia, SPS en banda = avcC (no cambia).
   Recomendación: mantener avc1; alinear CI con Chromium ≥ 153 (decisión de Juanma); no relajar la aserción. #324 en borrador.
2. **Rótulos** → efectos `pasos/10-rotulos-1440` (código 54bed980): 1:1 a 2560×1440; contraste 1,95→2,82 y 2,09→3,29; Pasillo ya no toca muro.
3. **Pieza a pieza por grupos** → efectos `pasos/11-pieza-a-pieza-grupos` (código 6e5c32ce): clip continuo 13 s, rc 0.
   Pendiente antes del render largo: fundido del rótulo de grupo (se encoge ~8 fotogramas) y naranja más visible sobre suelos claros.
Sigue: Catastro (parcela llana de Conil), renders largos tras la revisión de Juanma, examen de los cinco proyectos el último.

## ▶ CHECKPOINT · 28/11/2026, 00:55 (tras el reinicio de las 00:52)

Leer esto primero; sustituye al de las 00:30 para el estado de las validaciones.

**Fase 1 · validaciones (todas publicadas por paso, con SHA, código de salida y log)**
- #324 `ad928d43`: P10 §8.3 ×2 rc=0 → `reanudacion/cierre-324-ad928d43/pasos/` (commit ba0a945b). Regresión 482/479 (3 de base) cerrada.
  CI del SHA: todo verde salvo `contract` (aviso avc1, no reproducible en local) y `full-regression` (skipped); Preview Vercel OK.
  `contract` relanzado (run 46072294158, intento 2): **vuelve a fallar** (201/202), mismo test: P10 §8.3 `story-assist.browser.test.cjs:117`
  recibe el aviso de Chromium «When using "avc1" for mp4 encoding, the codec description is not supposed to change… Consider switching to
  "avc3"». **El test es nuevo en #324** (no existe en master), así que el fallo es de #324, no de base. CI 2/2; local 0/6 (Chromium 153 vs
  chromium-1234 de CI). Grabador: `js/tour-recorder.js` (TYPES prefiere `video/mp4;codecs=avc1.42E01E`; lienzo fijo 1280×720).
  **Decisión de Juanma**: (a) preferir `avc3` (lo que pide el aviso; riesgo de compatibilidad del MP4 en reproductores del cliente),
  (b) preferir WebM en la propuesta, (c) investigar en el Chromium de CI por qué cambia la descripción del códec. No se relaja el test.
- Efectos `claude/pelicula-efectos` HEAD `3716f325` (`docs/qa/pelicula-efectos/pasos/` + tabla en HANDOFF):
  ZIP d46eb6be FALLA (kit ausente) → a4719374; ZIP f45f1e06 FALLA (ZIP B con guion de A) → c25428f3; **ZIP c25428f3 rc=0, 17/17**;
  interfaz rc=0 ×2; previas Maqueta abierta (60 f) y Pieza a pieza (48 f) rc=0; rótulos de planta corregidos (f45f1e06, decisión de
  Juanma: mínimo 0,24/0,34/ocultar); cubierta visible desde fuera en Desde el paisaje (3716f325).
- Desde el paisaje: demo montada (sonda corregida: procedencia del terreno) y ZIP con entorno sin parcela; **emplazamiento 11039A02800004
  RECHAZADO** (ladera: −4,1…+4,0 m bajo la huella, puerta 2,3 m enterrada; ningún giro/posición < 1,36 m) → paso 8.

**En curso:** buscar sitio llano. `scratchpad/sondas/llano.cjs` (MDT05 directo, excluye agua aplanada). Candidatos 25 m con desnivel
≈0,05 m: La Janda N 250053/4013538, La Janda S 252653/4008758, Campiña Jerez 228223/4062248, Conil 222553/4021778 (EPSG:25830).
Siguiente: ortofoto de cada candidato (campo + camino, sin edificar) → parcela en Catastro por coordenadas (a las 01:51 Catastro **seguía** devolviendo «límite de peticiones por hora»; reintento único a las 03:05: **sigue limitado** (la IP de salida cambia y es compartida: el límite no depende solo de esta sesión). No se insiste; queda bloqueado por Catastro: reintentar en otra sesión o con la parcela que indique Juanma; si no, `WFS_REPLAY` no vale: es otra parcela) → montaje con la sonda → previa suelo/terreno/camino/puerta → revisión de Juanma.
**Después:** renders largos uno cada vez (piloto v1.1 → Maqueta abierta → Pieza a pieza → Desde el paisaje aprobado); examen de los
cinco proyectos el último. Si hay reinicio: no hay cadena activa; relanzar `fase1-v2.sh` solo salta pasos con rc=0.

## ▶ CHECKPOINT DE COMPACTACIÓN · 28/11/2026, 00:30 (leer primero; el roadmap de las 22:30 sigue como orden general)

**Procesos:** ninguno activo. El contenedor se reinició ~00:20 (uptime 0) y cortó `fase1.sh` en el paso «story-assist 1».
Nada encadenado: `pel-v11.sh` parado (bloqueo `scratchpad/pel-v11-STOP`), sin tareas programadas. Worktrees limpios: las salidas
regeneradas por la regresión (docs/qa/artifacts, qa-results/serra-r1) se devolvieron a su estado; no se publica ninguna.

### Frentes (repo `Juanmaes83/floorplan-3d`)
| Frente | Rama · SHA | Verificado | Pendiente | Logs / evidencias |
|---|---|---|---|---|
| #324 (borrador) | `claude/integracion-cabecera-entregar` · **`ad928d43`** | Regresión local completa **482 · 479 ok · 3 fallos de base** (G-02, P16 1440 y «Estudio de imágenes» fallan igual en `master` `dacb5d39`; G-02 y P16 en el contraste de esta noche, «Estudio de imágenes» en el de la tarde). CI 95/96: solo `contract` §8.3 P10 con aviso `avc1`. **avc1 local: 6 grabaciones reproducibles (3 master, 3 #324) por la interfaz real, 0 avisos, MP4 válidos** → no reproduce con Chromium 153; propio del Chromium 1234 de la CI | P10 §8.3 repetida ×2 en local; relanzar `contract` en CI o decidir avc3; CI + Preview del SHA final; comentario por hallazgo (borrador publicado) | `reanudacion/cierre-324-ad928d43/`: `regresion-ad928d43.tap`, `contraste-master-dacb5d39.tap`, `avc1/*.json` + 6 MP4, `grabar.cjs`, `borrador-comentario-324.md` |
| Tres efectos | `claude/pelicula-efectos` · **`d46eb6be`** | Núcleo 5/5; scene-delivery 14/14 + kit 6/6; scene-site 8/8; sonda UI local (Home tras Dibujo vivo, Entregar P12 tras P1, 0 errores, sin chino); kit con guion y 3 coreografías (código) | **Prueba UI** `tests/pelicula-efectos.browser.test.cjs` y **prueba ZIP** `tests/pelicula-efectos-zip.browser.test.cjs` (d46eb6be): **escritas, pendientes de ejecución** (grabación PEL_REC + ZIP + comprobaciones.json); previas Blender de Maqueta abierta y Pieza a pieza; montaje demo «Desde el paisaje» (`sonda-montar-demo-paisaje.cjs`) y previa suelo/terreno/camino/puerta | `docs/qa/pelicula-efectos/HANDOFF.md`; guiones `reanudacion/cierre-324-ad928d43/guion-*.json` |
| Piloto v1.1 | `claude/rodaje-cierre-1440` · `230c7316` (también fusionado en efectos) | código de las 4 correcciones | render 720p (fase 2, entrega propia) | `pel-v11.sh` en `cierre-324-ad928d43/` |
| Gesture Labs | `claude/gesture-labs` · `92ffb5f1` | navegador 6/6 ×2, core 11/11 | grabación de Juanma con cámara frontal | `docs/qa/gesture-labs/` |
| Cabecera/§9 | `claude/cabecera-proyectos` (este checkpoint) | — | — | — |

### Reanudar (orden)
1. `bash docs/qa/cabecera-proyectos/reanudacion/cierre-324-ad928d43/fase1-resto.sh` (desligado con setsid): P10 ×2 → UI efectos →
   ZIP efectos (grabación + 6 ZIP + comprobaciones.json) → previas Blender. Log: `scratchpad/fase1-resto.log`.
2. Publicar resultados y evidencias (vídeo, ZIP, capturas de previas) en `docs/qa/pelicula-efectos/` con el SHA probado.
3. Montaje demo «Desde el paisaje» (sonda) + exportación sin emplazamiento + previa suelo/terreno/camino/puerta → **revisión de Juanma**.
4. #324: CI/Preview del SHA final y comentario por hallazgo (borrador). Sin fusión sin autorización expresa.
5. Fase 2 (renders largos, uno cada vez): piloto v1.1 → Maqueta abierta → Pieza a pieza → Desde el paisaje (tras aprobar la previa).
6. Fase 3: examen de los cinco proyectos (depende de la fusión de #324).
**Dependencias de /tmp:** venv `scratchpad/bpy52` y `scratchpad/rodaje/kit5-f5` (si se perdieron: README de `docs/qa/pelicula-proyecto/`
y ZIP `entrada/` para reconstruir); sondas y guiones ya copiados al repositorio.

## ▶ ROADMAP · 27/11/2026, 22:30 (leer primero; sustituye al orden anterior)

### Ahora mismo
- **Activo:** solo la regresión final de #324 sobre `ad928d43` (`scratchpad/integ-regr-final.sh`, desligada). Último resultado:
  228 pruebas, 1 fallo (G-02, ya falla igual en `master`). Al terminar ejecuta su segundo paso, ya previsto: g02 +
  presentation + visual-studio en `master` `dacb5d39` (contraste). No arranca nada más.
- **Colas detenidas:** `pel-v11.sh` terminada a las 22:28 y bloqueo `scratchpad/pel-v11-STOP` creado; ningún render largo
  arrancará al acabar la regresión. Sin tareas programadas en la cuenta (list_triggers vacío) ni crontab.

### Cerrado (enlace · SHA)
| Tarea | Rama · SHA | Pruebas locales | CI | Humana |
|---|---|---|---|---|
| Auditoría #324 V01–V07, V09 | `claude/integracion-cabecera-entregar` [`ad928d43`](https://github.com/Juanmaes83/floorplan-3d/commit/ad928d433c6b60e19622fc07030b518532b534de) | auditoria-324 8/8; V09 integrado 5 tamaños; ID del ejemplo estable | 95/96 verde; `contract` rojo (avc1, ver abajo) | pendiente (Claude, Codex, Juanma) |
| Grabaciones V03/V05/V07/V09 | `675db8cd`, `32e76db7` (`auditoria-codex/grabaciones/`) | — | — | pendiente |
| Retirada de 93 evidencias regeneradas | #324 `ad928d43`, cabecera `565eb948` | código idéntico a `2f1c0ee4` | — | informada |
| Gesture Labs: prueba de navegador + guion | `claude/gesture-labs` [`92ffb5f1`](https://github.com/Juanmaes83/floorplan-3d/commit/92ffb5f130035228d38f5de9ace57b0c699e93f6) | 6/6 ×2, core 11/11 | — | grabación con cámara frontal (Juanma) |
| Piloto v1.1: código de las 4 correcciones | `claude/rodaje-cierre-1440` [`230c7316`](https://github.com/Juanmaes83/floorplan-3d/commit/230c7316695250bced2e073e13f59efff7877ba7) | sintaxis; cronología = misma revisión | — | tras el render |
| Catastro WFS/MDT05/PNOA reales desde la interfaz + corrección malla MDT05 | `claude/pelicula-efectos` `6c88d08e` | terrain-provider 6/6 (prueba nueva) | — | candidata independiente a master |
| ZIP con entorno + importador Blender | `claude/pelicula-efectos` `047646fc`, `25066fd9` | scene-site-core 8/8, scene-delivery 6/6 (sin emplazamiento = mismo ZIP byte a byte) | — | — |
| Emplazamiento demo elegido | `claude/pelicula-efectos` `cea12600`, `e4e6ac02` | — | — | — |

### A medias / con dependencia
- **#324 `contract` (P10, avc1):** `tests/story-assist.browser.test.cjs:117` recibe el aviso de Chromium «avc1 … codec description
  … consider avc3» al grabar el vídeo de P10 (`js/tour-recorder.js`, código de master, lienzo de tamaño fijo). Pasó en ejecuciones
  previas → candidato a intermitente de Chromium 1234. Falta: grabación reproducible N veces en `master` y en `ad928d43`, y P10
  repetida; decidir entre intermitente documentado o preferir `avc3` (cambio acotado con prueba). Depende de que acabe la regresión.
- **Comentario por hallazgo en #324:** borrador listo (`scratchpad/coment-324.md`); depende de la regresión, CI y Preview del SHA final.
- **Desde el paisaje:** sonda `scratchpad/catlive/demo/montar.cjs` escrita (proyecto «Proyecto de demostración sobre entorno real»,
  parcela `11039A02800004`, norte 180°, cota del MDT05). Falta ejecutarla, validar el ZIP en Blender y **publicar la previa** suelo ↔
  terreno ↔ camino ↔ puerta antes de cualquier render.
- **Home / Entregar → Vídeo (tres efectos):** sin empezar el código de interfaz.
- **Corrección MDT05 a master:** preparada, pendiente de decisión de integración (Juanma).
- **Evidencia con contorno catastral en el historial** (`6c88d08e`): recortada en `e4e6ac02`; reescribir historia solo con permiso.

### Orden de ejecución
**Fase 1 · desarrollos y validaciones dirigidas (sin renders largos; previas ligeras sí)**
1. *(con la regresión aún en marcha, solo edición)* Interfaz Home + Entregar → Vídeo para los tres efectos en `claude/pelicula-efectos`.
2. Al terminar la regresión: clasificar su resultado frente a `master`; contraste avc1 (grabación reproducible ×N en master y
   `ad928d43`); decidir; CI + Preview del SHA final; comentario por hallazgo en #324 (borrador).
3. Desde el paisaje: montar el proyecto demo (sonda), comprobar en navegador la exportación habitual sin emplazamiento, importar el
   ZIP en Blender y publicar la **previa** (fotogramas fijos a baja resolución) suelo/terreno/camino/puerta → decidir colocación.
4. Previas ligeras de cámara (baja resolución, pocas muestras) de Maqueta abierta y Pieza a pieza sobre la misma revisión.
5. Pruebas de navegador de Home/Entregar (escritorio y móvil, ES/EN) y grabación del recorrido con MP4 de muestra.

**Fase 2 · renders largos (uno cada vez)**
6. Piloto v1.1 720p (entrega propia). 7. Maqueta abierta. 8. Pieza a pieza. 9. Desde el paisaje (tras aprobar la previa).

**Fase 3** · 10. Examen de los cinco proyectos sobre la candidata común (depende de la fusión de #324).

**Siguiente paso concreto:** fase 1.1, interfaz de los tres efectos (solo edición mientras corre la regresión).

## ▶ ESTADO · 27/11/2026, 21:50 (leer primero; el bloque de las 20:15 queda como histórico)

**#324** (`claude/integracion-cabecera-entregar`, borrador) · HEAD **`ad928d43`** (código = `2f1c0ee4`):
- `ac2fe1ba` V09 verificado integrado en Entregar (5 tamaños, sin recorte; ejemplo, no Villa Linde).
- `8cff66b7` ID del ejemplo estable al recargar (`prj_reference-home`); CI de `c7093d62` clasificada:
  `app-m2-gate-d` = entorno (apt de Microsoft 403, Chromium sin instalar); `walk-controls` = intermitente (local 3/3; vigilar).
- `675db8cd`/`32e76db7` grabaciones V03/V05/V07 (escritorio y móvil) y V09 en `auditoria-codex/grabaciones/` (con SHA);
  grabación opcional `AUD_REC`/`AUD_VP` en la prueba (aserciones intactas; 8/8 sin grabar).
- `2f1c0ee4` acceso del Asistente que tapa el pie de diálogos en móvil = **anterior a #324** (master), mejora propia.
- **En curso:** regresión completa del SHA final `scratchpad/integ-regr-final.sh` → `integ-regr-final.log` (+ `master-final.log`
  con g02, presentation y visual-studio en `dacb5d39`). Relanzada desligada (setsid) sobre `ad928d43` a las 21:47; el reloj del contenedor se reinició ~21:30 (uptime).
- Después: CI + Preview de `2f1c0ee4`, comentario en #324 por hallazgo, Previews aprobadas (fccda24b, 7b2e01ab) aparte.

**Corrección 21:40 · evidencias regeneradas:** el checkpoint `474e0d7a` (09:22) metió por error 93 imágenes regeneradas de
`docs/qa/artifacts` (61 M, 32 A) que llegaron a #324. Retiradas: #324 **`ad928d43`** (código idéntico a `2f1c0ee4`, solo cambian
evidencias; la regresión en curso vale para ambos) y `claude/cabecera-proyectos` `565eb948`. Ninguna otra rama propia vigente las
tiene, salvo `muros-forma-descubrible` y `geometria-composicion` (36 cada una, de la composición OP-07): excluirlas al integrar.

**Ramas antiguas frente a la base (`dacb5d39`) y a #324 (`merge-tree`, 21:40):**
| Rama | SHA | Sobre master | Contra #324 | Entre sí |
|---|---|---|---|---|
| §5.1 `ux-visita-3d` | `e20644b9` | limpia (6 commits, 11 archivos) | limpia | limpia con §5.2 y §5.3 |
| §5.2 `ux-bc3` | `a9bac718` | limpia (6, 20) | conflicto en `css/perla-editor.css` | limpia |
| §5.3 `ux-presupuestar-analizar` | `32de044c` | limpia (11, 27) | conflicto en `css/perla-presupuestar.css` | limpia |
| §7.1 `muros-forma-descubrible` | `94f5b981` | limpia (40, 102) | `css/perla-editor.css` + 36 evidencias | limpia con geometría |
| Geometría `geometria-composicion` | `eb5723d4` | limpia (37, 100) | 36 evidencias | — |
| `muros-asa-accesible` / `muros-sobre-a0` | `b35a6cc3` / `52737606` | **base antigua (200 detrás), conflicto** | — | sustituidas por la composición |
Orden propuesto tras fusionar #324: §5.1 (limpia) → §5.2 y §5.3 (resolver un CSS cada una) → §7.1 + geometría (sin evidencias).
Cada una con su regresión y revisión humana; ninguna se integra sin autorización.

**Gesture Labs** `92ffb5f1`: prueba de navegador 6/6 ×2 (reloj sintético monótono en la prueba) y core 11/11; guion de
cámara frontal en `docs/qa/gesture-labs/GUION-GRABACION-CAMARA-FRONTAL.md`. Pendiente: grabación de Juanma.

**Película v1.1** (`claude/rodaje-cierre-1440` `230c7316`): kit con los 4 hallazgos corregidos y cronología
`docs/qa/pelicula-proyecto/entrada/pel-f5-timeline-v1.1.json` (misma revisión; conciliación idéntica a v1.0).
Cadena desligada `scratchpad/pel-v11.sh` (espera a la regresión): previa 426×240 → `rodaje/pel-v11-prev/previa.mp4`, luego
720p 12 muestras → `rodaje/pel-v11/…-v1.1.mp4`. Crear `scratchpad/pel-v11-STOP` para no lanzar el 720p si la previa falla.
Revisar la previa (tramos 17–24,5 s y 22 s) antes de dar por bueno el 720p.

## ▶ CHECKPOINT DE COMPACTACIÓN · 27/11/2026, 20:15 (leer primero)

**Estado de la máquina al escribir esto:**
- Ningún proceso vivo: no hay render ni pruebas.
- Los cinco worktrees `/home/user/{integ,hdr,ent,gest,rodaje}` coinciden con el remoto, sin cambios útiles en local (en `ent`
  solo `qa-results/`, que no se publica).
- `/home/user/base53` = `master` `dacb5d39`.

### Commits publicados en esta sesión (desde las 19:00)
| Rama | SHA | Qué |
|---|---|---|
| `claude/rodaje-cierre-1440` | `91b4ced9` | Clip 720p «Del plano a la vivienda»: MP4 `f4e75386…6d01`, informe, hoja de contactos y tres efectos aprobados en el handoff |
| `claude/rodaje-cierre-1440` | `fd3c4a8e` | **Auditoría del propietario** del clip (4 hallazgos con tramos) para la tanda nocturna |
| `claude/integracion-cabecera-entregar` | `93339c8a` | CI `contract`: story-assist/flow/proposal sin el desplazamiento explícito frágil (10/10 local) |
| `claude/integracion-cabecera-entregar` | `c7093d62` | **HEAD actual de #324.** Ejecutor y sondas de la auditoría versionados (`docs/qa/integracion-324/auditoria-codex/sondas/`) |

### #324: CI de `cfabe252`, clasificada (verificado)
| Fallo | Evidencia | Clasificación |
|---|---|---|
| `walk-controls-vs-master` · desktop controls 1440 | Local 4/4 en candidata y 4/4 en master. **Relanzado en CI sobre el mismo `cfabe252` → éxito** en master y en HEAD | **entorno** (intermitente en CI) |
| `ux08` · 820×1180 táctil | Local 3/3 y 3/3. En CI alterna verde/rojo en SHAs que no tocan ese código (verde en `5a061725`, `f70891aa`, `917d80e9`, `b05676f2`, `6434b0b4`; rojo en `cfabe252`, que solo cambia documentación) | **entorno** |
| `contract` · story-assist §8.3 | «scrollIntoViewIfNeeded: Element is not attached». Primera ejecución en CI de esa prueba | **candidata (prueba frágil)**, corregido en `93339c8a` sin tocar aserciones. Si se quita el desplazamiento en story-layers se rompe su prueba de posición (2/2), así que ese archivo lo conserva |

`full-regression` figura como **omitida** en la CI.
**Pendiente:** CI y Preview de `c7093d62` (o del SHA final) sin consultar todavía.

### Pendiente de #324, en orden (una tanda pesada cada vez)
1. Comprobar la CI y la Preview del HEAD vigente.
2. **Auditoría:**
   - V09 integrado: la sonda `probe-v09e.js` no llegaba a abrir Blueprint en Entregar con el render activo; reintentar
     con la máquina libre;
   - grabar V03, V05, V07 y V09 en escritorio y móvil;
   - comprobar si cambia el ID del ejemplo al recargar;
   - V08 sigue como diagnóstico.
   Fila por hallazgo en `docs/qa/integracion-324/auditoria-codex/README.md` y en #324.
3. Regresión completa local del SHA final (`reanudacion/integ-regr.sh`, añadiendo `auditoria-324` y
   `quantity-schedule`), con la CI y la Preview de ese mismo SHA y un recorrido breve.
4. Separar las Previews ya aprobadas (§9 `fccda24b`, Entregar `7b2e01ab`) de la revisión pendiente de la candidata
   conjunta.
5. **Borrador hasta** la revisión de Claude, Codex y Juanma y la autorización expresa de Juanma sobre ese SHA.

### Gesture Labs (fuera de #324)
- `claude/gesture-labs` `c585dda4`: núcleo 11/11, confirmado por Codex.
- **Pendiente:** la prueba de navegador (`tests/gesture-lab.browser.test.cjs`, con el ensayo de giro añadido y sin
  ejecutar). Va después de la validación de #324, nunca a la vez.
- Después, el guion para que Juanma grabe con la cámara frontal del móvil:
  1. entrar por P11;
  2. ver las viñetas de cada paso con su botón equivalente;
  3. desplegar el plano;
  4. pasar a la misma estancia en 3D;
  5. orientar la maqueta con la palma moviéndose despacio;
  6. salir y comprobar que la cámara se apaga.

### Tanda NOCTURNA · nueva versión de la película (fuera de #324)
Corregir los 4 hallazgos de la auditoría (`fd3c4a8e`):
- luz a 22,21 s;
- descenso de 18 a 25 s;
- ritmo;
- nitidez, vidrio y entorno.

Misma revisión (`prj_op10-f5-furniture`, huella `20c1a79b…`). Entregar el MP4 con su SHA, su informe, su resolución y su
perfil, y los tramos de cada corrección. El MP4 `f4e75386…` queda de referencia.

**Tras un reinicio:**
- kit = `$S/rodaje` (`kit5-f5`) y `$S/bpy52` (bpy 5.2.1);
- si faltan, reconstruirlos con `docs/qa/pelicula-proyecto/README.md` (rama `claude/rodaje-cierre-1440`; ZIP y cronología en
  `entrada/`);
- script base: `reanudacion/pel-clip.sh`.

### Dependencias de /tmp (`$S` = `/tmp/claude-0/-home-user/8ae691a0-8fef-5086-ba65-d2c190bb8356/scratchpad`)
- `$S/audit/ws/output/auditoria-324` (material de Codex): se recrea con `git archive 87f4661b docs/qa/auditoria-324-villa-linde`.
- `$S/rodaje/kit5-f5`, `$S/bpy52`: se recrean con el README de la película.
- Ejecutor y sondas: ya versionados en `c7093d62`.

## CHECKPOINT · 27/11/2026, 19:00 (decisiones, servicios e inventario siguen vigentes)

**Regla de carga:** una tanda pesada cada vez. Mientras renderiza Blender, solo trabajo ligero: lectura, documentos y
pruebas puras de Node.

### Estado real de cada entrega
| Entrega | Rama · SHA | Estado | Pendiente |
|---|---|---|---|
| **#324** · candidata conjunta §9 + Entregar + StoryLayersV1 + auditoría V01–V09 | `claude/integracion-cabecera-entregar` · `cfabe252` | **Borrador.** V01–V07 corregidos con prueba. V08 diagnosticado. V09 con corrección aplicada, sin verificar integrado. | Ver «Validación de #324». Sin fusión hasta la revisión de Claude, Codex y Juanma y la autorización expresa de Juanma sobre el SHA final. |
| §9 Cabecera (aprobada en `fccda24b`) | `claude/cabecera-proyectos` · `9a44e870` | Incluida en #324 | — |
| Entregar D3 · P2 · FOT-01 · cuadrícula (aprobada en `7b2e01ab`) | `claude/entregar-asistencia` · `09b1440b` | Incluida en #324 | — |
| StoryLayersV1 (dependencia autorizada) | `claude/storylayers-v1` · `cd694e88` | Incluida en #324; **no está en master** | Entra con #324 |
| Película del proyecto §11 · clip 720p | `claude/rodaje-cierre-1440` · `90d38d54` | Renderizando: fotograma ~653/720 a las 18:52 | Revisar la secuencia completa y publicar MP4, SHA e informe en el [handoff de rodaje](https://github.com/Juanmaes83/floorplan-3d/blob/claude/rodaje-cierre-1440/docs/qa/rodaje/HANDOFF-RODAJE-WINDOWS.md) |
| Gesture Labs §6 · giro con la palma lenta | `claude/gesture-labs` · `c585dda4` | Núcleo 11/11, confirmado también por Codex. Fuera de #324 | Prueba de navegador después del render. Recorrido preparado para que Juanma lo grabe con la cámara frontal del móvil (P11 → salir) |

### Validación de #324 (después del render, en este orden)
1. **CI de `cfabe252`:** fallan `walk-controls-vs-master` (controles 3D de escritorio: pasan en master y fallan en la candidata),
   `ux08` (cotas durante el arrastre táctil) y `contract` (P10, con un elemento que se desprende del DOM durante el recorrido).
   La regresión completa de CI figura como omitida. Reproducir cada fallo en la base y en la candidata, clasificarlo y conservar
   las aserciones de comportamiento.
2. **Auditoría de Codex:**
   - verificar V09 integrado;
   - grabar V03, V05, V07 y V09 en escritorio y móvil;
   - comprobar si el ID del ejemplo cambia al recargar;
   - V08 queda como diagnóstico.
   Tabla: [auditoria-codex/README.md](https://github.com/Juanmaes83/floorplan-3d/blob/claude/integracion-cabecera-entregar/docs/qa/integracion-324/auditoria-codex/README.md)
   · fuente: [handoff de Codex `87f4661b`](https://github.com/Juanmaes83/floorplan-3d/blob/87f4661b353d8a906435b99bdc9cb75c08ddf10b/docs/qa/auditoria-324-villa-linde/README.md).
3. **Candidata verificable:** regresión completa local, CI y Preview del MISMO SHA final, con un recorrido breve.
   Separar las Previews que Juanma ya aprobó (§9 `fccda24b`, Entregar `7b2e01ab`) de la revisión pendiente de la candidata
   conjunta.

### Decisiones aprobadas registradas (27/11)
**Tres efectos de película** · fuente: [`aeeef513` · PELICULA-PROPUESTA-HOME-ENTREGAR.md](https://github.com/Juanmaes83/floorplan-3d/blob/aeeef513/docs/qa/auditoria-324-villa-linde/PELICULA-PROPUESTA-HOME-ENTREGAR.md).
Trabajo propio, **fuera de #324**. Implementación y aceptación visual pendientes.

| Efecto | Qué debe entender el cliente | Referencia |
|---|---|---|
| Pieza a pieza | El croquis o la planta queda de referencia mientras las piezas reales entran y encajan por grupos; se entiende cómo se forma la vivienda sobre el plano | Courtyard house |
| Maqueta abierta | Una planta legible gana volumen; vista desde arriba de cómo se conectan las estancias y descenso a una para verla por dentro | Apartment |
| Desde el paisaje | La vivienda en su entorno representado; la cámara se acerca y entra por un hueco real. Si falta el entorno, el profesional lo sabe antes de prepararlo | Cliff villa |

Condiciones:
- **Origen:** los tres parten de una revisión real (geometría, huecos, materiales y plantas). El croquis aparece si está
  disponible y alineado; la planta de RUBIK se rotula como tal. P8 Blueprint 3D sigue siendo un entregable técnico aparte.
- **Home:** módulo propio junto a Dibujo vivo, con ejemplos reproducibles que muestran qué diferencia a cada efecto.
- **Entregar → Vídeo:** junto a Dibujo vivo. Elegir efecto → ver la revisión y las plantas → vista previa ligera de la
  transición completa → estimación para el perfil (si faltan datos, «Estimación no disponible») → confirmar el render.
  Si cancela, el render completo no se inicia.
- **Aceptación:**
  - un clip continuo por efecto (inicio, transición y llegada) con su revisión, SHA e informe; los tres fotogramas solo sirven
    para comprobar encuadres;
  - grabar el flujo con un proyecto propio, desde la elección hasta el MP4 y el informe;
  - comprobar que la vista previa y la salida usan el mismo guion y la misma revisión.

**Servicios técnicos pendientes** · fuente: [`f53e95b2` · GUIA-IMPLEMENTACION-SERVICIOS-TECNICOS.md](https://github.com/Juanmaes83/floorplan-3d/blob/f53e95b2e483eaa74fb8baa814597a5841856f65/docs/qa/auditoria-324-villa-linde/GUIA-IMPLEMENTACION-SERVICIOS-TECNICOS.md)
(publicación documental de Codex). Fuera de #324; cada uno tendrá su encargo.

| Servicio | Dependencias | Aceptación (resumen de la guía) |
|---|---|---|
| 1 · Ficha de inmueble, parcela y orientación | Parcela confirmada y su fuente (Catastro), autoridad de superficies, D3 estilo Cliente, V01/V02 cerrados para casos de varias plantas | PDF Cliente con plano, superficies por planta y ficha territorial con fuente y fecha. Casos: con referencia, sin parcela, error de fuente, norte vacío y capa no exportable. Con 2 plantas, nunca «Planta única» |
| 2 · Reforma comparada (premium) | P10 StoryLayers en la base, presupuesto por planta, contraste previo con EnvolventeCTE (commit, licencia y tolerancia fijados) | Original frente a ventanas frente a ventanas + aislamiento, con elementos, cantidades, importe por planta y prestaciones. Coincide con EnvolventeCTE dentro de la tolerancia; cambiar una ventana no altera el resto |
| 3 · Revisión previa de habitabilidad (piloto) | Un municipio y una actuación definidos; medidas declaradas con fuente; validación de un técnico | Por regla: ámbito, fuente, medida y estado (comprobado / requiere revisión / faltan datos / fuera de alcance). Lo que falte aparece pendiente |

### Inventario de tareas antiguas (14 partidas; antes dije 13 por error)
| # | Partida | Dónde está | En PR | En master | Falta |
|---|---|---|---|---|---|
| 1 | Kit de rodaje: reglas genéricas | `claude/rodaje-cierre-1440` `8900be59` | — | No | Integrar tras revisar la evidencia visual |
| 2 | Comparativas 1440p | `rodaje-cierre-1440` (`docs/qa/rodaje/comparativas-1440`) | — | No | Ídem |
| 3 | Lanzador Windows | `rodaje-cierre-1440` (`HANDOFF-RODAJE-WINDOWS.md`) | — | No | Ídem |
| 4 | Geometría A0 y asa de muros | `claude/geometria-composicion` `eb5723d4` · `claude/muros-asa-accesible` `b35a6cc3` · `claude/muros-sobre-a0-2c7e7739` `52737606` | — | No | Comparar con la base vigente; validar Firefox/WebKit |
| 5 | StoryLayersV1 vertical | `claude/storylayers-v1` `cd694e88` | **#324** | No | Entra con #324 |
| 6 | Carta de materiales (10 casos sintéticos) | **sin implementar** | — | — | En cola; depende de Material Tokens (hecho) y del kit de rodaje |
| 7 | §5.1 Visita 3D | `claude/ux-visita-3d` `e20644b9` (regresión completa del corte aprobado) | — | No | Decidir integración comparando con la base |
| 8 | §5.2 BC3 comparar → aplicar | `claude/ux-bc3` `a9bac718` | — | No | Ídem |
| 9 | §5.3 Presupuestar y Analizar | `claude/ux-presupuestar-analizar` `32de044c` (regresión 153/153) | — | No | Ídem |
| 10 | Tapicería v3 | `rodaje-cierre-1440` `86fb8f7f` (aprobada por Juanma) | — | No | Integrar con el rodaje |
| 11 | §7.3 StoryLayers, plantilla comercial | en `cd694e88` | **#324** | No | Entra con #324 |
| 12 | §7.2 StoryLayers, de la variante a la descarga | en `cd694e88` | **#324** | No | Entra con #324 |
| 13 | §7.1 Muros descubribles | `claude/muros-forma-descubrible` `94f5b981` (aprobación de la cota registrada) | — | No | Decidir integración |
| 14 | §7.4 Tapicería en otra escena | `rodaje-cierre-1440` `bb78fca0` | — | No | Integrar con el rodaje |

**Cola, al final:** carta de materiales (pendiente de implementar) y examen de cinco proyectos sobre la candidata común
(depende de que #324 esté fusionado). Para las ramas antiguas, la integración se decide comparando cada mejora con la base
vigente y revisando su evidencia visual.

### Fuentes
- Guía y handoff Gesture: `c532877a` (rama `codex/encargo-reutilizacion-cinco-repos`).
- Auditoría: `87f4661b`.
- Efectos: `aeeef513`.
- Servicios: `f53e95b2`.
- Todo en `codex/auditoria-324-villa-linde`, salvo la guía y el handoff Gesture.

## CHECKPOINT DE COMPACTACIÓN · 27/11/2026, 12:10 (histórico)
**Hecho que cambia el estado:** el contenedor se **reinició hacia las 12:05**. Todos los procesos murieron. El scratchpad
(`/tmp/claude-0/-home-user/8ae691a0-8fef-5086-ba65-d2c190bb8356/scratchpad`, en adelante `$S`) sobrevivió, pero no es
fiable: todo lo necesario está en GitHub. **No hay nada en ejecución.**

### Ramas y worktrees (local = remoto, sin cambios útiles sin subir; comprobado a las 12:08)
| Frente | Rama · SHA remoto | Worktree | Handoff |
|---|---|---|---|
| **PR #324 · candidata conjunta** | `claude/integracion-cabecera-entregar` · `6d087b6650d7cc7db2faf1608406d3fd0a23fcfc` | `/home/user/integ` | [`docs/qa/integracion-324/README.md`](https://github.com/Juanmaes83/floorplan-3d/blob/claude/integracion-cabecera-entregar/docs/qa/integracion-324/README.md) · [PR #324](https://github.com/Juanmaes83/floorplan-3d/pull/324) (borrador) |
| §9 Cabecera | `claude/cabecera-proyectos` · ver el SHA de este checkpoint (código `98a6d3a1`) | `/home/user/hdr` | `docs/qa/cabecera-proyectos/README.md` |
| Entregar: D3, P2, cuadrícula y Home | `claude/entregar-asistencia` · `8b83d955` (código `2f4a25d9`) | `/home/user/ent` | `docs/qa/entregar-asistencia/revision-27-11/README.md` |
| Gesture Labs §6 | `claude/gesture-labs` · `809aa3cb` | `/home/user/gest` | `docs/qa/gesture-labs/README.md` |
| Película §11 | `claude/rodaje-cierre-1440` · `90d38d54cd34ad5c0f4a498cefb864e155e9ba8a` | `/home/user/rodaje` | `docs/qa/pelicula-proyecto/README.md` |
| Base `master` | `dacb5d39` (#323) | `/home/user/base53` (detached en `dacb5d39`) | — |
| StoryLayersV1 (dependencia en #324) | `claude/storylayers-v1` · `cd694e88` | `/home/user/story` | `docs/qa/storylayers-v1/README.md` |

Guía de referencia del propietario: `c532877a` (rama `codex/encargo-reutilizacion-cinco-repos`):
`docs/integration/GUIA-AUDITORIA-INTEGRACION-Y-LABORATORIOS.md` y `HANDOFF-GESTURE-LABS-Y-CANDIDATAS.md`.

### Aprobaciones y decisiones vigentes
- **Aprobado (Preview):**
  - §9 en `fccda24b`;
  - Entregar (D3, P2/FOT-01, cuadrícula P8 → P9 → P10) y la muestra de estilos de Home en `7b2e01ab`.
  - La propuesta comercial sigue en borrador.
- **Decisión del propietario (27/11):** StoryLayersV1 `cd694e88` entra como dependencia explícita en #324.
- **#324:** se mantiene en **borrador** hasta la revisión del SHA final por Claude, Codex y el propietario. La **fusión
  espera la autorización explícita del propietario sobre ese SHA**.
- **Fuera de #324:** Gesture Labs (pendiente de la prueba con cámara frontal y de las mejoras del handoff ampliado) y
  Película §11 (se revisa con el MP4 de 720p).

### Resultados
- **Regresión final §9 sobre `fccda24b`** (log `$S/hdr-regr-final4.log`): 418 · 403 superadas · 4 omitidas · 11 fallos.
  - G-02 y P16: **base** (mismo error en `cd694e88`; falta comprobarlos en `master`).
  - 9 de **pruebas sin adaptar**: `guide-navigation` ×5 y `premium-shell` ×4. Corregidas en `ec45639d` (14/14) y `98a6d3a1`
    (5/5); ambas están en `6d087b66`.
  - Publicado en el README de §9 y en un [comentario de #324](https://github.com/Juanmaes83/floorplan-3d/pull/324#issuecomment-7217539535).
- **Regresión del conjunto sobre `6d087b66`** (log `$S/integ-regr.log`): **INTERRUMPIDA** por el reinicio en la prueba 33.
  33 superadas, 0 fallos hasta ahí. Hay que relanzarla.
- **G-02/P16 sobre `master`** (`$S/master-g02-p16.log`): **no llegó a ejecutarse**.
- **Clip de 720p:** **no llegó a empezar** (0 fotogramas). La entrada y la receta para reproducirlo están versionadas en la
  rama de la película.
- **D3, verificado y grabado en la candidata:**
  - falla o se abandona «Preparar imágenes»: prueba 5/5;
  - vídeos en `docs/qa/integracion-324/video/`.

### Discrepancias detectadas en la auditoría
1. Dije que la Preview conjunta `7eee68a1` no incluía la corrección de D3. **La incluye** (`2f4a25d9` es antecesor de
   `7eee68a1`). Lo único que falta en esa Preview es el ajuste de prueba de `premium-shell` (`98a6d3a1`), que no toca la
   interfaz.
2. Dije que la regresión del conjunto y el clip «corrían» o «estaban en cola». El reinicio los interrumpió; ver arriba.
3. El comentario de #324 dice que la regresión del conjunto «ya está en marcha». Hay que publicar un comentario
   corrigiéndolo al relanzar.
4. Pendiente de verificar: CI de GitHub en #324 (no consultada). La Preview de `6d087b66` no está comprobada.

### Cómo comprobar y retomar (por orden)
```bash
S=/tmp/claude-0/-home-user/8ae691a0-8fef-5086-ba65-d2c190bb8356/scratchpad; uptime; pgrep -fa "integ-regr|pel-clip|blender|node --test"
```
1. **Regresión del conjunto** (una sola tanda pesada a la vez). Script versionado:
   `docs/qa/cabecera-proyectos/reanudacion/integ-regr.sh`. Corre los 64 archivos en `/home/user/integ` y después G-02 y P16
   en `/home/user/base53` (`master`). Logs: `$S/integ-regr.log` y `$S/master-g02-p16.log`.
   ```bash
   cp /home/user/hdr/docs/qa/cabecera-proyectos/reanudacion/integ-regr.sh $S/ && chmod +x $S/integ-regr.sh && nohup $S/integ-regr.sh >/dev/null 2>&1 &
   ```
   Si faltan los worktrees: `git worktree add /home/user/integ claude/integracion-cabecera-entregar` y
   `git worktree add --detach /home/user/base53 dacb5d39`. CHROME:
   `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.
2. **Clasificar cada fallo** (base, candidata o entorno). Si se sospecha del entorno, reproducir con el código previo o la
   base y la máquina en el mismo estado de carga, como se hizo con Gesture Labs. Publicar en un comentario de #324 y en
   `docs/qa/integracion-324/README.md`. Añadir la Preview del SHA final y consultar la CI.
3. **Clip de 720p (después de la regresión):** script `docs/qa/cabecera-proyectos/reanudacion/pel-clip.sh`, o la receta del
   README de la película. Es reanudable. Log `$S/rodaje/pel-clip.log`; fotogramas en `$S/rodaje/pel-clip/frames/`. Se
   publica con MP4, SHA y report.
4. **Gesture Labs:** siguiente ensayo (girar la maqueta con la palma moviéndose despacio) y Preview con viñetas, según
   `c532877a`.
5. **Examen de cinco proyectos:** al final, sobre la candidata común.

## Aprobaciones del propietario (27/11, noche) y autorización de integración
| Bloque | Rama · SHA aprobado | Preview revisada | Evidencia |
|---|---|---|---|
| §9 Cabecera y proyectos | `claude/cabecera-proyectos` · `fccda24b` | https://floorplan-3d-piotfpkn3-juanma-espinosas-projects.vercel.app/ | `docs/qa/cabecera-proyectos/` (vídeos JSON y P10, `json-menu/`, `distancia-conocida/`, `regresion/`) |
| Entregar: D3, P2/FOT-01 y cuadrícula P8 → P9 → P10 | `claude/entregar-asistencia` · `7b2e01ab` | https://floorplan-3d-eyj9ph0s3-juanma-espinosas-projects.vercel.app/ | `docs/qa/entregar-asistencia/revision-27-11/` |
| Home: muestra de estilos con procedencia en cada imagen | misma rama y SHA | la misma | `revision-27-11/home/` |

- La propuesta comercial (`docs/propuestas/…`) sigue en **borrador**.
- **Autorizado:** integrar los tres bloques en `master` vigente (`dacb5d39`), validando el conjunto con los recorridos
  aprobados y su regresión, y fusionar si la evidencia es satisfactoria y conforme a la coordinación con Codex.
- **Fuera de esta tanda:**
  - Gesture Labs §6, pendiente de la prueba con la cámara frontal del móvil: P11, los accesos por gestos desde Home y P1 y
    el código de cámara siguen en `claude/gesture-labs`;
  - Película del proyecto §11, bloque aparte: su aprobación llegará con el MP4 de 720p.
- **Añadido tras la aprobación, a petición del propietario:** D3 «Preparar imágenes» que falla o mientras la persona sale
  (`2f4a25d9`, prueba D3 5/5).

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
