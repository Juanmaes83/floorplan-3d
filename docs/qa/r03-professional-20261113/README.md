# R03 Professional · evidencias del editor de interiores dentro de RUBIK (rama de revisión)

**Origen.** Capturas tomadas por `tests/r03-editor-in-rubik.browser.test.cjs` con el proyecto de ejemplo de RUBIK (datos sintéticos). Chromium con SwiftShader. Rama `review/r03-editor-in-rubik-20261113`.

| Archivo | Qué muestra |
|---|---|
| `1440x900-1-panel.png` | Panel del armario con «Interior del armario…» (solo en armarios) |
| `1440x900-2-dialog.png` | Diálogo: aviso experimental, alzado con 5 módulos, balda añadida, puertas «ocultas», acciones |
| `1440x900-3-3d.png` | Escena 3D con el armario guardado (vista aérea de la estancia) |
| `390x844-1-panel.png` | Móvil vertical: el botón junto a Girar, Duplicar y Eliminar |
| `390x844-2-dialog.png` | Móvil vertical: hoja a pantalla completa con la cabecera y el aviso fijos |
| `844x390-2-dialog.png` | Móvil horizontal: cabecera y aviso visibles; controles debajo |

**Límite honesto del 3D.** La vista aérea muestra el armario **desde arriba**, con su tablero superior, así que no deja ver el interior aunque las puertas estén ocultas. La prueba sí comprueba numéricamente que la altura en 3D es la del mueble y que se dibujan las piezas reales del casco, las baldas y las puertas. La imagen frontal del interior en 3D está en las evidencias del laboratorio de #202 (`docs/qa/sculpt-r03-complete/`).

**Pruebas de bloqueo que fallan a propósito en esta rama.** En esta rama `index.html` carga los módulos R03, así que dos pruebas fallan:
- `tests/r03-integration-core.test.cjs`, prueba «I0: no schema expansion or editor binding is implicitly authorized»;
- `tests/r03-cabinet-audit.test.cjs`, prueba «A4 … nothing in RUBIK loads».

Ambas comprueban que `index.html` **no** carga R03. **No se relajan**: protegen `master` y solo deben cambiar cuando el propietario autorice la integración. Si esta rama se fusionara por error, la CI lo impediría.
