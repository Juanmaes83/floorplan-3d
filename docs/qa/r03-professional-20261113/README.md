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
