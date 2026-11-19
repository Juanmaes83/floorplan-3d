# OP-10 · 02 · Clasificación KEEP / GENERALISE / OPTIONALISE / REPLACE / REMOVE

Donante: `portableRenderScene.ts` y su familia (openPlan3D@771c9e1). Adaptación: `src/scene-capture-core.js` y el resto del laboratorio.

| Pieza del donante | Decisión | Qué se hace en OP-10 y por qué |
|---|---|---|
| Recorrido con visibilidad heredada (`visible`, `renderExclude`) | **KEEP** | Idéntico. `renderExclude` se mantiene como marcador compatible |
| Mallas indexadas y no indexadas, `drawRange` | **KEEP** | Mismas validaciones (inicio múltiplo de 3, fin dentro del buffer) |
| Matrices anidadas, determinante negativo → orden de triángulos invertido | **KEEP** | Prueba portada «reflejo: normales hacia fuera» |
| Validación de índices, coordenadas y transformación | **KEEP** | Mismos códigos de rechazo, con `code` estable (`INDICES`, `COORDINATES`, `TRANSFORM`…) |
| Límites (mallas, vértices, caras, bytes) | **KEEP + GENERALISE** | Los 300 k del donante no bastan para el ejemplo de RUBIK (446 k vértices con 46 muebles procedimentales). Perfil de laboratorio medido: 1,5 M vértices/caras, 50 k instancias, 128 MiB. Siempre rechazo explícito al superarlo |
| Determinismo y ausencia de mutación | **KEEP** | Redondeo a 1 µm; prueba de bytes idénticos y de árbol sin cambios. La captura retrasada 6 s da los mismos bytes |
| Dependencia de `three` (`Mesh`, `Vector3`, `BoxGeometry`) | **GENERALISE** | El núcleo no importa `three`: lee objetos por su forma y opera matrices a mano. Corre igual en el visor (r160) y en Node |
| Rechazo de `InstancedMesh` | **REPLACE** | RUBIK agrupa piezas de mueble con `InstancedMesh` (172 instancias en el ejemplo). Se expanden por instancia con su matriz y límite propio |
| Un material por malla | **GENERALISE** | Geometrías con grupos y varios materiales: una malla por grupo |
| Factor 0,01 (centímetros) | **REPLACE** | RUBIK ya trabaja en metros. `unitsToMetres` es obligatorio y se declara (`1` en RUBIK); sin él no hay captura |
| Materiales neutros `wall`/`floor`/`proxy` | **REPLACE** | Se registra lo observado (tipo, color, rugosidad, metalicidad, opacidad, uso de mapa) sin copiar imágenes. La vista compatible `toOpenPlan3D()` reproduce los tres roles del donante |
| Rol por `wallId`/`renderMaterial` | **GENERALISE** | Identidad canónica por ancestro más cercano: `fid`, `r02aItem`, `door`, `wallId`, `slabRoom`, `ceilRoom`, `roomId`/`room`, `stairId`, `roof`, `exteriorVolume`, `levelId`. Sin ID → `unlinked`, y la comparación lo asocia por geometría declarada |
| Exclusión de vidrio, techos, etiquetas y ayudas | **GENERALISE** | Política explícita y contada: contornos y secciones de presentación, tapas de corte, sombras de contacto, propuesta UX-12 sin aplicar, contexto territorial (opcional), suelo decorativo (por nodo, sin marcarlo). El vidrio y los techos SÍ se capturan (son geometría visible) y se declaran por rol |
| Losa de soporte sintética | **OPTIONALISE** | Opción `supportSlab`, apagada por defecto y declarada como derivada |
| Contrato `openplan3d-render-scene` v1 | **KEEP (vista)** | `toOpenPlan3D()` produce el contrato del donante para un consumidor compatible futuro |
| Botón «Export Blender Scene» en el visor | **REMOVE (en el lab)** | La captura vive en un arnés de laboratorio sin tocar `index.html`. Su incorporación al producto es la cirugía posterior |
| Camara de foto, URLs, metadatos libres | **REMOVE** | Nunca se exportan. Prueba: un `sourceURL` y una textura «privada» no aparecen en el JSON |
| Worker nativo `render_jobs.py` | **REPLACE (bloqueado)** | Inaccesible. Sustituido por `blender/import_scene.py` + `reopen_verify.py` + `render.py` dentro de OP-10 |

## Nuevo en RUBIK (sin equivalente en el donante)

- **Regla de estabilidad de escena:** red quieta, ningún recurso en `loading`, puertas en reposo y firma idéntica 30 fotogramas.
- **Comparación A↔B↔C:** comprobaciones contractuales (deben pasar) y visuales (se miden y se declaran).
- **Manifiesto de escena:** identidad, huellas, alcance, unidades, exclusiones, estado de recursos y métricas.
