# Los cuatro pilares, tal como funcionan hoy (capturas reales)

Rama `lab/studio-presentation-e0e1` (producto en `f31f303`), Chromium local 1440×900, sin red externa; `/api/*` bloqueado.

| Archivo | Pilar | Qué muestra | Procedencia |
|---|---|---|---|
| `ft3d8-1-evolucion-caso-A.png` | Evolución de obra (FT3D-8) | Evolución día a día, Gantt y estado «Antes del comienzo» | **Caso sintético A** del laboratorio FT3D-8 (`evolucion/?lab=1&case=A`). Planificación prevista, no obra ejecutada. |
| `ft3d8-2-expediente-caso-A.png` | Evolución de obra | Expediente del caso A (fuentes: comprobado, verificado, declarado) | Mismo caso sintético. |
| `living-1-dibujo-vivo-grafito.png` | Dibujo vivo (Hybrid V2) | Salón a grafito, el mobiliario empieza a cobrar color | App real, proyecto de ejemplo, `scripts/qa/render-presentation-living-drawing.cjs` (manifiesto en `living-manifest.json`). |
| `living-2-dibujo-vivo-salon-color.png` | Dibujo vivo | Estancia ya en color al final de la historia | Ídem. |
| `render-1-vistas-preparadas.png` | Render IA | Entregar: las 5 vistas reales del modelo, origen de cualquier render | App real, proyecto de ejemplo. |
| `render-2-dialogo-render-ia.png` | Render IA | Diálogo real: vista de origen, estilo, consentimiento, código de acceso | **No se ha generado ninguna imagen** (tiene coste y requiere autorización). |
| `visita-1-entregar.png` | Visita 3D | Acceso a la vista previa 3D desde Entregar | App real. |
| `visita-2-cliente-inicio.png` | Visita 3D | Experiencia de cliente de solo lectura | **Vista previa local**, no un enlace publicado. |
| `visita-3-recorrido.png` | Visita 3D | Recorrido en primera persona con minimapa | Ídem. |

Captura: `tools/pillars-capture.cjs <repo> <salida>` (el paso del botón de minimapa falla porque el lienzo 3D intercepta el clic durante el recorrido; el minimapa ya es visible en `visita-3`).
