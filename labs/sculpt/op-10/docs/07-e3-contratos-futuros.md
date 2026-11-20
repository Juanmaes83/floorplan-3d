# OP-10 · 07 · Studio E3 y contratos futuros (solo lectura)

Consultado sin modificar: laboratorio E3 congelado en `8c53263423359e4fa71fc25494c7a3b6ee1f7fd1` (`labs/studio-presentation/reports/21-E3-CONTINUIDAD-F0.md`, `tools/f0-adaptador*.cjs`). No se han tocado recetas ni entregables aceptados.

## Qué podría consumir E3 de OP-10

| Resultado de OP-10 | Consumidor E3 posible | Condición |
|---|---|---|
| `review.blend` + PNG por encuadre | Láminas e ilustraciones de las recetas (Architecture Book, propuesta) como «render local» | Que la receta declare la fuente «render local OP-10» y su huella |
| `scene.json` + manifiesto | Trazabilidad del dossier: qué geometría visible se usó | Ligado a la revisión transaccional F0 confirmada del trabajo (no al `fixtureContentId` del laboratorio) |
| Comparación A↔B↔C | Evidencia de fidelidad adjunta a la entrega | Solo comprobaciones contractuales; las visuales, como notas |

## Huellas distintas (no se confunden)

| Huella | Qué identifica | Qué NO acredita | Dónde |
|---|---|---|---|
| **Proyecto observado** | El proyecto tal como estaba cargado en el visor al capturar (`projectId`, `updatedAt`, SHA del JSON canónico) | **No es una revisión transaccional F0 confirmada**: no ha pasado por el diario ni por la confirmación de F0 | `manifest.source`, `identity.observedProject` |
| **ContentId del fixture** | `js/expediente-core.js` `contentId()` aplicado al fixture con **documentos vacíos** (sin presupuestos ni revisiones) y **sin bytes de imagen verificados** | Solo acredita el alcance de estos fixtures sintéticos; no es la identidad de un expediente real | `evidence/identity.json` (`fixtureContentId`) |
| **Revisión transaccional F0 confirmada** | La revisión que F0 registra y confirma | OP-10 no la produce ni la consulta | Fuera de OP-10 (F0) |
| **Huella completa de entrega** | El paquete del expediente (manifiesto F0) | — | Fuera de OP-10 (F0/E3) |
| **Huella de escena y cámara** | Escena observada + alcance (SHA de `scene.json`) + cámaras derivadas (`render-report.json`) | — | Manifiesto y `render-report` |
| **Huella del render** | Cada PNG (SHA-256) con motor, muestras y resolución; equivalencia comprobada por píxel | — | `render-report.json`, `evidence/render/equivalencia-pixel.json` |

**Hallazgo [E]:** `contentId()` llamado directamente sobre el proyecto neutraliza el id local pero **no** `createdAt`/`updatedAt`. Un consumidor futuro debe calcular la identidad **por el mismo camino que el expediente** (`pack`/`read`), nunca sobre un proyecto suelto.

## Dependencias para una integración futura

- **CAM01** (colocar una cámara en el 2D): hoy las cámaras de OP-10 se derivan del polígono de la estancia. Con CAM01, la pose guardada (`presentationPose`) sustituiría a la derivada y se registraría su huella.
- **IMG07** (render de día o de noche con la hora del 3D): hoy el sol de OP-10 es fijo y declarado (38° de elevación, 135° de azimut). Con IMG07 se tomarían la dirección y la intensidad del visor (`View3D.solarInspect`).

Ambas se preservan como dependencias: OP-10 no las implementa.
