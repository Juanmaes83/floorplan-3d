# Estado de implementación F1b

Esta entrega apila F1b sobre PR #5 abierta (966ab83; mismo código que a4b5a9d), sin fusionarla.
El plan rector sigue en [PR #3](https://github.com/Juanmaes83/floorplan-3d/pull/3),
commit 825ddf6: F1b corresponde al flujo manual de imagen, calibración, trazado y
revisión; su relación con el roadmap de PR #2 permanece intacta.

Implementado para revisión: PNG/JPEG local, preparación no destructiva, dos cotas,
confirmación, muros/huecos/estancias editables, navegación diferenciada, W1–W4,
mobiliario/2D/3D existentes, ZIP portable y borrado local. Véase [F1b.md](../technical/F1b.md).

Pendiente: cinco planos reales autorizados (incluyendo escaneo y foto), validación
humana en móvil/escritorio, rendimiento en móvil físico y preview verificable por
SHA. No se declara F1b cerrada ni se modifican estados de aprobación de F0.
F2 (interpretación asistida), F3 (catálogos), PDF, backend y producción siguen fuera.

El encargo autoriza expresamente la entrega apilada como excepción al avance
secuencial de DEVELOPMENT-WORKFLOW.md. No altera sus reglas de revisión humana,
merge y cierre documental, ni declara cerrada la base todavía abierta.
