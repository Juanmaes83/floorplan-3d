# R03 Professional · evidencias del editor de interiores dentro de RUBIK (rama de revisión)

**Origen.** Capturas tomadas por `tests/r03-editor-in-rubik.browser.test.cjs` con el proyecto de ejemplo de RUBIK (datos sintéticos). Chromium con SwiftShader. Rama `review/r03-editor-in-rubik-20261113`.

| Archivo | Qué muestra |
|---|---|
| `1440x900-1-panel.png` | Panel del armario con «Interior del armario…» (solo en armarios) |
| `1440x900-2-dialog.png` | Diálogo: aviso experimental, alzado con 5 módulos, balda añadida, puertas «ocultas», acciones |
| `1440x900-3-3d.png` | Escena 3D con el armario guardado (vista aérea de la estancia) |
| `1440x900-3-3d-frente.png`, `390x844-3-3d-frente.png`, `844x390-3-3d-frente.png` | **El interior editado en el 3D de RUBIK, de frente**: módulos, barras, baldas del módulo estrecho y cajones (puertas guardadas como «ocultas») |
| `390x844-1-panel.png` | Móvil vertical: el botón junto a Girar, Duplicar y Eliminar |
| `390x844-2-dialog.png` | Móvil vertical: hoja a pantalla completa con la cabecera y el aviso fijos |
| `844x390-2-dialog.png` | Móvil horizontal: cabecera y aviso visibles; controles debajo |

**3D.** La vista aérea enseña el armario desde arriba. Para verlo de frente, la prueba coloca la cámara de RUBIK delante del armario con su API pública `View3D.presentationRestorePose`, en el eje +z del armario a 3,2 m y a 1,2 m de altura. Así se ve el interior editado **dentro de RUBIK**. Además, la prueba comprueba numéricamente que la altura en 3D es la del mueble.

**Pruebas de bloqueo que fallan a propósito en esta rama.** En esta rama `index.html` carga los módulos R03, así que dos pruebas fallan:
- `tests/r03-integration-core.test.cjs`, prueba «I0: no schema expansion or editor binding is implicitly authorized»;
- `tests/r03-cabinet-audit.test.cjs`, prueba «A4 … nothing in RUBIK loads».

Ambas comprueban que `index.html` **no** carga R03. **No se relajan**: protegen `master` y solo deben cambiar cuando el propietario autorice la integración. Si esta rama se fusionara por error, la CI lo impediría.

## Auditoría de #215 (13/11): «Dividir módulo» y cierre con cambios pendientes

Prueba `R03 «Dividir módulo» y cierre con cambios pendientes`, en 1440×900 y 390×844. Comprueba la secuencia que pedía la auditoría: dividir, cambio real, primer Escape y confirmación. Además separa una división rechazada de un cambio aplicado.

| Caso | Resultado |
|---|---|
| División válida | Un módulo más (p. ej. 577,5 → 279,75 + 279,75 mm), aviso verde «Módulo dividido.», `dirty === true` y proyecto sin tocar |
| Primer Escape | **No cierra.** Aviso «Hay cambios sin guardar. Pulsa Escape otra vez…» y nada se deshace |
| Segundo Escape | Cierra. El proyecto y el deshacer de RUBIK siguen igual. El foco vuelve a «Interior del armario…» |
| «Cerrar» con cambios (el único cierre en el móvil) | Primera pulsación: pide confirmación. Segunda: cierra |
| Ctrl+Z en el diálogo | Deshace la división: `dirty === false` y un Escape cierra |
| División rechazada (módulo de menos de 150 mm) | Módulos idénticos y aviso rojo con el motivo de cada mitad («Módulo 1: cada módulo necesita al menos 150 mm de anchura libre. Módulo 2: …»). Los cambios válidos anteriores siguen pendientes |
| División rechazada sobre un interior recién guardado | `dirty === false`; ni el proyecto ni el deshacer cambian; un Escape cierra |
| Guardar / Ctrl+Z / Ctrl+Shift+Z de RUBIK | Un paso; quita y devuelve el interior; el 3D dibuja el armario dividido (más de 10 piezas) |

**Defectos encontrados y corregidos en #214** (cada uno falla con el adaptador de `ac7df16` y pasa ahora):
1. «Cerrar» tiraba los cambios sin avisar.
2. Ctrl+Z dentro del diálogo no hacía nada. La prueba anterior no lo veía: ahora compara el estado completo.
3. Tras guardar, el foco caía al `body` al cerrar.

Detalle: `docs/technical/r03-professional-20261113.md`, §2 R2.

Capturas `*-split-1-confirmar.png` (primer Escape tras dividir) y `*-split-2-rechazo.png` (división rechazada sobre el interior guardado), en escritorio y móvil.
