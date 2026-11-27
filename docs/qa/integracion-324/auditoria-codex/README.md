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

### ID del proyecto de ejemplo al recargar (27/11, 21:0x)
Sonda `sondas/probe-id-recarga.js` sobre `ac2fe1ba`: abrir el ejemplo → `prj_reference-home` («Proyecto de ejemplo»); recargar → la app reabre sola el mismo proyecto con el **mismo ID** `prj_reference-home`, editor listo, 0 errores de página. El ID **no cambia** al recargar.

### CI de `c7093d62` (ejecución 20:32)
- `app-m2-gate-d`: **entorno**. El runner no pudo instalar Chromium (`packages.microsoft.com … 403 Forbidden`, «Failed to install browsers»); las 7 pruebas fallan por `Cannot find module 'playwright'` sin llegar a ejecutarse. El workflow no cambia en #324.
- `walk-controls-vs-master`: falla «desktop controls … 1440x900» en HEAD (pasa en master); todos sus pasos medidos pasan («Pasos nuevos rotos: 0»). En local, en el mismo árbol, 3/3 en verde. Segunda vez que aparece en CI: lo trato como **intermitente** y no como entorno cerrado; queda vigilado en el SHA final.
### Grabaciones V03 · V05 · V07 · V09 (27/11, 21:4x, árbol `8cff66b7` + grabación opcional)

Grabadas con la propia prueba bloqueante (`AUD_REC=<carpeta>`, con `slowMo` de 350 ms solo al grabar y `AUD_VP=390x844` para repetir en móvil V05 y V07). Las aserciones no cambian: sin esas variables, la prueba es idéntica. Resultado: 8/8 sin grabar; 4/4 en escritorio y 2/2 en móvil grabando. V09 se graba con la sonda `probe-v09e.js` (`AUD_REC` en `run.cjs`).

| Archivo | Tamaño de pantalla | Duración | SHA-256 |
|---|---|---|---|
| `grabaciones/v03-escritorio.mp4` | 1440×900 | 8.48 s | `2885b06bc54c5f22…` |
| `grabaciones/v03-movil.mp4` | 390×844 | 8.00 s | `fa0d0fed5db0ba9a…` |
| `grabaciones/v05-escritorio.mp4` | 1440×900 | 31.0 s | `66f01043f61e328e…` |
| `grabaciones/v05-movil.mp4` | 390×844 | 24.4 s | `7f4aba7d29767526…` |
| `grabaciones/v07-escritorio.mp4` | 1440×900 | 6.16 s | `c1a7ce15a9f9da2d…` |
| `grabaciones/v07-movil.mp4` | 390×844 | 5.80 s | `fbc90d08005c3ddb…` |
| `grabaciones/v09-entregar-5-tamanos.mp4` | 1440×900 (lienzo) | 31.1 s | `48b55a0e5be1f843…` |

**Límites:** V03, V05 y V07 usan el edificio sintético de dos plantas (`tests/fixtures/auditoria-324`); V05 y V09, el proyecto de ejemplo. Ninguna usa Villa Linde, cuya cubierta sigue en V08 (solo diagnóstico). V09 graba los 5 tamaños dentro de un lienzo de 1440×900. **Observación** (no es un hallazgo de la auditoría): en V07 móvil, el botón flotante «Asistente» tapa el borde inferior del diálogo «Presentar mi vivienda». Es **anterior a #324**: el acceso fijo que el Asistente coloca dentro de los diálogos (`js/assistant-ui.js`, igual en `master`). No se toca en #324 porque cambiaría una interfaz aprobada; queda como mejora propia (criterio «pie/Asistente sin tapar» del estándar de Entregar).
