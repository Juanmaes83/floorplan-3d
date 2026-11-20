# OP-10 · 08 · Riesgos residuales y plan de cirugía posterior

## Riesgos residuales

| # | Riesgo | Efecto | Mitigación en el lab | Pendiente |
|---|---|---|---|---|
| R1 | **Caras coincidentes en la geometría procedimental** (armario: cara superior del cuerpo y de la tapa en la misma cota, 2,20 m) | En trazado de rayos salen negras: el visor las oculta con el buffer de profundidad | Detectado, documentado, **no maquillado** en el render | Cirugía del visor (C3) |
| R2 | El visor no etiqueta ventanas, umbrales ni lámparas con su ID | Mallas `unlinked` en la captura | La comparación las asocia al hueco por geometría, declarado como «inferido» (97/108 en el ejemplo); el resto son lámparas | Marcar `openingId` en el visor (C2) |
| R3 | Escenas grandes: 446 k vértices y 16 MB de JSON en el ejemplo con 46 muebles | Captura y serialización de 0,3–0,7 s bloquean el hilo principal en el contenedor | Límites explícitos con rechazo | Salida binaria (GLB) o por trozos si se integra (C4) |
| R4 | `contentId()` es sensible a las fechas si se llama fuera del camino del expediente | Identidad de trabajo distinta para el mismo trabajo | Documentado en 07 | Usar el camino del expediente en la integración |
| R5 | Consumidor nativo del donante inaccesible | No se ha validado el contrato `openplan3d-render-scene` con su worker real | Vista compatible `toOpenPlan3D()` probada en unidad | Solo si el propietario obtiene acceso |
| R6 | Render local por CPU: entre 13 y 38 s por imagen a 960×600 con 32 muestras, y 1,4 GB de pico | No apto para vídeo largo ni para un dispositivo modesto | Imágenes económicas, nunca vídeo | Decisión de producto sobre GPU/servidor |
| R7 | Firefox y WebKit no probados (ni el donante ni la captura) | Diferencias de motor no medidas | — | QA de navegadores |
| R8 | Pulido con derivados declarados: luz de estancia, exterior neutro, color de suelo desde el material del proyecto | Pueden confundirse con datos del proyecto | Colección `OP10_derived` y lista `derived` en cada `render-report.json` | Mantener la declaración en el producto |
| R9 | `capture-visual.cjs` del piloto usa `FloorPlanApp.importProject`, que ya no existe | El piloto anterior está roto en master | OP-10 usa `#fileIn`, el camino real | Retirar o actualizar el piloto (C1) |

## Plan de cirugía (requiere GO; nada de esto está hecho)

| Paso | Qué | Dónde | Prueba de aceptación |
|---|---|---|---|
| C1 | Unificar: retirar `scripts/offline-pilot/capture-visual.cjs` en favor de la captura OP-10, o reescribirlo sobre ella | `scripts/offline-pilot/` | Piloto reproducible en master |
| C2 | El visor etiqueta sin mutar datos: `userData.openingId` en marcos, vidrios y umbrales; `userData.fixture` en lámparas | `index.html` (construcción de huecos y `lampG`) | 0 mallas `unlinked` en F1–F6 |
| C3 | Eliminar caras coincidentes de los muebles procedimentales (la tapa 1 mm por encima del cuerpo, o el cuerpo sin cara superior) | `index.html` (`buildFurniture`) | Render sin manchas negras; comparación visual estable |
| C4 | `View3D.captureScene()` de solo lectura: el núcleo `scene-capture-core.js` dentro del visor, con la regla de estabilidad y salida GLB/JSON | `index.html` + `js/scene-capture-core.js` | Mismos bytes que el arnés de laboratorio para F1–F6 |
| C5 | Entrega «Escena Blender» en Entregar: descarga escena + manifiesto, sin texturas ni fotos | Entregar | Proyecto y almacenamiento intactos; textos ES/EN |
| C6 | Integración con E3/F0: huellas de escena y render enlazadas al `contentId` del expediente | Studio Presentation | Recetas intactas; nueva fuente declarada |
| C7 | CAM01 + IMG07: cámara guardada y sol del visor en lugar de los derivados | Visor + render | Pose y sol reproducibles |

Lo que no se hace nunca: otro motor geométrico, otro exportador GLB del proyecto (sigue siendo `export.cjs`) ni cambios en `FloorPlanProjectV1` o en el formato del expediente.
