# OP-10 · 04 · Métricas y límites

Entorno: contenedor Linux de 4 vCPU sin GPU; Chromium 1243 con SwiftShader (render por software); Node 22.23; Blender `bpy` 5.2.1 LTS (rueda PyPI de 402 MB en un entorno virtual temporal de 1,0 GB, fuera del repositorio). Mediciones [E] de la ejecución final; las cifras de tiempo varían de una ejecución a otra, los bytes no.

## Captura en el visor e importación

| Escenario | Mallas | Vértices | Caras | Instancias expandidas | scene.json | Captura + serialización (hilo principal) | Fotograma mediano antes / después | Importación Blender (tiempo · RSS pico) | Reapertura |
|---|---|---|---|---|---|---|---|---|---|
| F1 | 20 | 703 | 492 | 0 | 0,03 MB | 4 ms | 65 / 61 ms | 0,73 s · 480 MB | 0,62 s |
| F2 | 1.589 | 446.541 | 199.388 | 172 | 16,5 MB | 564 ms | 522 / 524 ms | 3,43 s · 878 MB | 2,54 s |
| F3 | 94 | 12.265 | 6.244 | 0 | 0,5 MB | 28 ms | 76 / 77 ms | 0,79 s · 484 MB | 0,74 s |
| F4 activa | 61 | 19.071 | 6.810 | 4 | 0,7 MB | 59 ms | 103 / 89 ms | 0,75 s · 483 MB | 0,69 s |
| F4 apilada | 94 | 47.911 | 16.544 | 4 | 1,6 MB | 77 ms | 94 / 96 ms | 0,84 s · 506 MB | 0,73 s |
| F5 | 1.509 | 446.385 | 199.752 | 172 | 15,8 MB | 593 ms | 547 / 542 ms | 3,46 s · 871 MB | 2,58 s |
| F6 | 1.513 | 437.989 | 197.080 | 172 | 15,5 MB | 668 ms | 538 / 539 ms | 3,47 s · 865 MB | 2,64 s |

Ejecución completa (7 escenarios, captura + fidelidad + Blender + reapertura): **392 s**, RSS pico 878 MB.

**Impacto en la navegación:** el fotograma mediano antes y después de capturar es el mismo, así que no hay efecto persistente. La captura bloquea el hilo principal **una vez**, entre 4 y 668 ms según el tamaño. Los ~0,5 s por fotograma de F2/F5/F6 son el coste del render por software de este contenedor con escenas de 200 k caras, no de la captura. No se ha medido en un dispositivo real [V].

## Render (Cycles por CPU, denoise, AgX)

| Fase | Resolución · muestras | Axo | Salón | Cocina | Dormitorio | RSS pico |
|---|---|---|---|---|---|---|
| 1 (neutro) | 640×400 · 16 | 2,8 s | 5,8 s | 6,6 s | 5,8 s | — |
| 2 (observado) | 640×400 · 16 | 3,9 s | 8,2 s | 9,1 s | 7,9 s | — |
| 3 (arquitectura) | 960×600 · 32 | 13,0 s | 38,0 s | 37,3 s | 34,4 s | 1,39 GB |

Sin vídeo: un recorrido de 20 s a 30 fps costaría unos 600 fotogramas × ~35 s ≈ 6 h por CPU, lo que no se justifica sin una decisión del propietario.

## Límites del núcleo (rechazo explícito)

| Límite | Donante | Perfil de laboratorio RUBIK | Motivo |
|---|---|---|---|
| Mallas | 10.000 | 20.000 | Ejemplo: 1.589 |
| Vértices | 300.000 | 1.500.000 | Ejemplo: 446.541 (el del donante lo rechaza) |
| Caras | 300.000 | 1.500.000 | Ejemplo: 199.752 |
| Instancias | (rechazadas) | 50.000 | Batching de muebles: 172 |
| Bytes JSON | 64 MiB | 128 MiB | Ejemplo: 16,5 MB |
| Coordenada | ±10 km | ±10 km | Igual |

Superar un límite produce un error con código (`VERTEX_BUDGET`, `FACE_BUDGET`, `INSTANCE_BUDGET`, `BYTES`) y no escribe nada.

## Privacidad

Sin imágenes, URL ni metadatos libres en la salida (prueba unitaria con una textura «privada» y un `sourceURL`). Solo peticiones al servidor local; cualquier otra se bloquea y hace fallar la captura (0 en todos los escenarios). Proyecto y `localStorage` idénticos antes y después de cada captura.
