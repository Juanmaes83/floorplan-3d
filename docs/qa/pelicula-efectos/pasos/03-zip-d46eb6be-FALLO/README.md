# Paso 3 · Prueba ZIP de efectos · SHA probado `d46eb6be` · **FALLA (hallazgo real)**

- Prueba: `tests/pelicula-efectos-zip.browser.test.cjs` (Chromium 153, 1440×900, grabación continua `PEL_REC`).
- Resultado: `not ok 1` · `# fail 1` (ver `prueba.log`). Se detuvo en la comprobación 6 del paso 1; los pasos 2–6 no llegaron a ejecutarse.
- `comprobaciones.json`: 5 comprobaciones en verde (aviso de película pendiente, efecto/perfil, revisión, manifiesto con huella, proyecto) y
  1 en rojo: **el ZIP no lleva el kit** (`rubik_blender_rodaje.py`, `rodar.sh`, `RODAR-windows.bat`). `A-maqueta-revision.contenido.txt`: 5 ficheros.
- Causa: `KIT` ganó `entorno` y `KIT_HEAD` (scene-export-ui.js) no; la verificación de cabecera fallaba y la interfaz descartaba el kit entero,
  también en la exportación sin efecto. Regresión introducida en esta rama, no en master.
- Corrección: `a4719374` (`KIT_HEAD.entorno` + guarda `tests/scene-kit-heads.test.cjs`, que falla sobre d46eb6be y pasa sobre a4719374).
- `grabacion.mp4`: recorrido real hasta la primera descarga. El ZIP no se publica (no aporta más que su listado).
- Repetición sobre a4719374: paso 3b (pendiente).
