# Evidencia M05 · Editor y servidor local

El [recorrido real en Chromium](recorrido-m05.webm) muestra la consulta, la propuesta, su aplicación y su deshacer, el modo generativo con proveedor simulado y la revisión de la variante en RUBIK. Se verificó el vídeo completo con FFmpeg. Firefox y WebKit ejecutaron el mismo recorrido y obtuvieron el mismo diagnóstico y huella de simulación. [Identidad de los navegadores](multinavegador.json)

| Paso | Evidencia |
| --- | --- |
| Comparar una propuesta antes de aplicar | [Captura del editor](01-asistente-antes-despues.png) |
| V3 con permiso y herramienta real de RUBIK | [Captura con proveedor simulado](02-asistente-v3-proveedor-simulado.png) |
| Exportar el plano original | [Captura](03-mcp-plano-original.png) · [JSON descargado](original-exportado-rubik.json) |
| Diagnosticar y evaluar | [Respuesta stdio, métricas y límites](resultado.json) |
| Reabrir la alternativa | [Captura](04-mcp-variante-reabierta.png) · [ZIP de revisión](variante-revisada.zip) |

El proyecto sintético sigue teniendo dos muebles y 12 m² estimados. La simulación mueve una mesa 300 mm sobre X y pasa de un solape a cero en el modelo geométrico del caso. Los bytes del original y su entrada de biblioteca permanecen idénticos. El ZIP de variante enlaza el original, la simulación y el nuevo JSON mediante SHA-256. Para prepararlo, el registro automatizado ejercita la confirmación de la API local. La orden interactiva se ejercitó también en una terminal real con el mismo original y la misma simulación. [Manifiesto SHA-256](MANIFEST.sha256)
