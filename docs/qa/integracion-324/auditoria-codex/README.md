# Auditoría de Codex sobre #324 · V01–V09 (27/11/2026)

**Origen:**
- Handoff de Codex en `87f4661b`: `docs/qa/auditoria-324-villa-linde/README.md`.
- Las 352 evidencias de su manifiesto verifican el SHA-256 (0 discrepancias).
- Fixtures sintéticos usados: edificio de dos plantas, el mismo con título neutro y Villa Linde aprobada.

**HEAD de partida:** `39ea4bf0`.
- Cada hallazgo se reprodujo en ese HEAD con el procedimiento de Codex (`async page => …`) antes de corregirlo.
- Las pruebas permanentes están en `tests/auditoria-324.browser.test.cjs`, en la regresión bloqueante, y en los
  archivos de prueba afectados.

| ID | Estado | Causa | Commit | Resultado observado | Evidencia directa |
|---|---|---|---|---|---|
| V01 | **Corregido** | El presupuesto es de la planta activa, pero Presupuestar, D4 y las salidas solo usaban el nombre del proyecto | `3751cac6` | «Alcance: solo la planta «Planta baja» · 1 de 2 plantas del edificio…» en Presupuestar y en D4 (pantalla e impresión); «Total con IVA · Planta «Planta baja»» 28.125,67 €; CSV con columna `scope`; JSON y BC3 con la planta en el título y en el nombre de archivo; al cambiar de planta, el alcance la sigue y el total es otro; con una planta, nada cambia | [PDF D4](salidas/V01-D4-cliente.pdf) · [HTML impresión](salidas/V01-D4-cliente-impresion.html) · [CSV](salidas/V01-presupuesto.csv) · [JSON](salidas/V01-presupuesto.json) · [Presupuestar](salidas/V01-presupuestar-alcance.png) |
| V02 | **Corregido** | `summary()` esperaba `levelContext.levels` como lista; `app.levelContext` lo da como número, así que «Planta única» aunque la métrica sumara 2 plantas | `1ae6bd3d` | Analizar: «2 plantas: Planta baja, Planta primera». Portada D3, PDF y P7: nombre del edificio y «PLANTAS · 2 plantas…». La imagen dice que es el plano de una planta y que el cómputo incluye las 2. Control de una planta: «Planta única» | [PDF D3](salidas/V02-D3-dossier.pdf) · [HTML P7](salidas/V02-P7-archivo-cliente.html) · [Portada](salidas/V02-D3-portada.png) · [Analizar](salidas/V02-analizar.png) |
| V03 | **Corregido** | `save()` se tragaba el rechazo de `localStorage` y `load()` releía `localStorage`: el nombre se perdía al cambiar de paso | `53f2c09c` | Con la escritura rechazada solo en la clave D3: el nombre y la nota siguen al volver de «Nota»; aviso persistente «Sin guardar…» con «Reintentar guardar»; al guardar, el aviso desaparece y queda escrito. Escritorio y móvil | prueba V03 (2 viewports) · grabación en el cierre |
| V04 | **Corregido** | `prepare()` no lanza cuando falla `View3D.deliveryShot`: deja `status()='error'`. D3 solo atendía excepciones | `917d80e9` | Con el fallo real de captura: D3 en «Revisar» dice «No se pudieron preparar las imágenes: QA: captura 3D indisponible… Tu borrador está guardado», con el borrador intacto; el reintento prepara vistas reales | prueba `dossier-cliente` V04 |
| V05 | **Corregido** | `guide-ui` registraba `view3d` en cada `floorplan-view-ready` (selector 2D/3D, capturas, vuelta de un entregable) | `b05676f2` | «Escena 3D» no marca la revisión; «Revisar en 3D» sí; volver a 2D la conserva. Guía, recorrido y perla: 77/77 | prueba V05 · grabación en el cierre |
| V06 | **Corregido** | Los huecos de `kind:'opening'` se contaban como carpinterías | `6434b0b4` | Ejemplo: «20 carpinterías · 2 huecos de paso» en la tarjeta y el resumen; apartado «Huecos de paso» en el CSV. Presupuesto sin cambios; CSV con las mismas columnas. La prueba C1 afirmaba el defecto y ahora exige el criterio | pruebas `quantity-schedule` |
| V07 | **Corregido** (explicación) | `delivery-preview-ui` excluye multiplanta y mandaba al ejemplo | `9d4f7f36` | Con 2 plantas, P3 dice que la prueba privada recorre una sola planta, que P1 muestra cada planta por separado (no la escalera), y ofrece «Abrir P1 Presentación 3D». La visita multiplanta queda fuera de esta PR | prueba V07 |
| V08 | **Diagnosticado** (sin cambios de motor ni modelo) | Planta baja: `b-30` (10 mm, encuentro de dos líneas → **modelado**) y `b-51` (borde terraza/paso, `insufficient-room-geometry` → **clasificador**). Sin `b-30` sigue bloqueando `b-51`. Planta primera: clasificación completa, pero el contorno de fachada está abierto en y = 14 360 (x = 0 `p-18`, x = 7100 `p-37`) → **modelado** | — | La cubierta sigue «no disponible» con geometría insuficiente. La UI podría localizar el segmento (el clasificador da `wallId` y motivo; el contorno da los nodos abiertos): propuesta aparte | sondas en el procedimiento de esta carpeta |
| V09 | **Corregido · verificado integrado en Entregar (proyecto de ejemplo)** | Entregar → «Abrir la vista 3D» → Blueprint → Sección, a 1600×1000, 1440×900, 1280×800, 844×390 y 390×844. Las 5 etiquetas del segmentado («Visual limpio» 111 px, «Espacios», «Medición», «Inspeccionar» 113 px, «Presentar») sin recorte (`scrollWidth ≤ clientWidth`) en los 5 tamaños; en 390 px la barra pasa a dos líneas sin cortar texto. 0 errores de página | `ab847198` | `salidas/v09-entregar-1440x900.png`, `salidas/v09-entregar-390x844.png`; sonda `sondas/probe-v09e.js` | Falta la grabación con Villa Linde |

**Por calificar (Codex):** que el ID del ejemplo cambie al recargar. Se verifica en el cierre, antes de tratarlo como
fallo.

**Fuera de esta PR, como se pidió:** presupuesto global, visita privada multiplanta, Gesture Labs y Película del
proyecto.
