# Paso 3c · Prueba ZIP de efectos · código probado `c25428f3` (HEAD `d6ddd437`, solo docs encima) · **SUPERADA**

- Prueba: `tests/pelicula-efectos-zip.browser.test.cjs`, Chromium 153, 1440×900, grabación continua (`grabacion.mp4`).
- **Código de salida 0**; `ok 1`, `# fail 0` (`prueba.log`). `comprobaciones.json`: **17/17** en verde, incluida «sin errores de página».

| ZIP | Recorrido | Guion en el ZIP |
|---|---|---|
| A | Maqueta abierta · revision | maqueta-abierta · revision |
| B | sin editar, Pieza a pieza · entrega1440 | pieza-a-pieza · entrega1440 (misma revisión que A) |
| C | elegir y editar el proyecto antes de exportar | ninguno; la interfaz dice que el proyecto cambió |
| D | cerrar la exportación sin preparar y volver | la elección sigue y se ve; pieza-a-pieza · revision |
| E | cancelar en la confirmación | ninguno |
| F | cambiar de proyecto | ninguno; id del otro proyecto |

- `zips/<ZIP>/`: listado, `manifest.json` y guion de cada descarga; `zips/SHA256SUMS`: huella de los seis ZIP.
  Los ZIP (13–14 MB cada uno, salvo F) no se suben al repositorio: el listado muestra que los seis llevan el kit completo.
  C, D y E pesan menos que A y B porque el paso 3 borra un mueble del proyecto.
- Historia: paso 3 (d46eb6be, kit ausente) → corrección a4719374; paso 3b (f45f1e06, ZIP B con guion de A) → corrección c25428f3.
