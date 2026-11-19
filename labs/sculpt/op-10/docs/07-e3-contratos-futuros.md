# OP-10 · 07 · Studio E3 y contratos futuros (solo lectura)

Consultado sin modificar: laboratorio E3 congelado en `8c53263423359e4fa71fc25494c7a3b6ee1f7fd1` (`labs/studio-presentation/reports/21-E3-CONTINUIDAD-F0.md`, `tools/f0-adaptador*.cjs`). No se han tocado recetas ni entregables aceptados.

## Qué podría consumir E3 de OP-10

| Resultado de OP-10 | Consumidor E3 posible | Condición |
|---|---|---|
| `review.blend` + PNG por encuadre | Láminas e ilustraciones de las recetas (Architecture Book, propuesta) como «render local» | Que la receta declare la fuente «render local OP-10» y su huella |
| `scene.json` + manifiesto | Trazabilidad del dossier: qué geometría visible se usó | Ligado por `f0ContentId` del trabajo |
| Comparación A↔B↔C | Evidencia de fidelidad adjunta a la entrega | Solo comprobaciones contractuales; las visuales, como notas |

## Cinco huellas distintas (no se confunden)

| Huella | Qué identifica | Dónde |
|---|---|---|
| **Revisión local F0** | Este proyecto en esta biblioteca: `projectId` + `updatedAt` + SHA del JSON canónico | `manifest.source` |
| **ContentId portable** | El trabajo, con independencia del id local (`js/expediente-core.js`, `contentId()`) | `run summary · identity.f0ContentId` |
| **Huella completa de entrega** | El paquete del expediente (manifiesto F0) | Fuera de OP-10 (F0/E3) |
| **Huella de escena y cámara** | Escena observada + alcance (`scene.json` SHA) + cámaras derivadas (`render-report.json`) | Manifiesto y `render-report` |
| **Huella del render** | Cada PNG (SHA-256) con su motor, muestras y resolución | `render-report.json` |

**Hallazgo [E]:** `contentId()` llamado directamente sobre el proyecto neutraliza el id local pero **no** `createdAt`/`updatedAt`: misma geometría con otra fecha da otro valor. El informe E3 afirma que «otra fecha da el mismo trabajo», probablemente porque el expediente normaliza las fechas en `pack`/`read`. Un consumidor futuro debe calcular la identidad **por el mismo camino que el expediente**, nunca llamando a `contentId()` sobre un proyecto suelto.

## Dependencias para una integración futura

- **CAM01** (colocar una cámara en el 2D): hoy las cámaras de OP-10 se derivan del polígono de la estancia. Con CAM01, la pose guardada (`presentationPose`) sustituiría a la derivada y se registraría su huella.
- **IMG07** (render de día o de noche con la hora del 3D): hoy el sol de OP-10 es fijo y declarado (38° de elevación, 135° de azimut). Con IMG07 se tomarían la dirección y la intensidad del visor (`View3D.solarInspect`).

Ambas se preservan como dependencias: OP-10 no las implementa.
