# F3 · siguiente lote controlado de Asset Lab — propuesta en revisión

**Base de Rubik comprobada:** `origin/master` `e62d17ee62576466f937700f6c445c33b09ec9c2` (squash PR #22, 02-10-2026). **Asset Lab auditado en clon temporal de solo lectura:** `5dc7b182c5c227472b84aea66a3ffa1368c95981`. El lote todavía requiere revisión visual de Juanma y merge de la PR; no cambia el contrato `FloorPlanProjectV1`.

## Inventario y decisión técnica

La auditoría repetida sobre archivos físicos y manifest halló 134 fichas, 114 GLB físicos, 20 rutas sin GLB y cero ficheros sin ficha. Entre los no integrados, 97 usan Draco y 82 WebP; la incompatibilidad repetida queda cubierta por el perfil existente de decodificación y conversión. No se amplió el cargador de Rubik ni se añadió un perfil universal. Se intentaron ocho candidatos, seis aceptados y dos excluidos. La procedencia y el alcance de autorización constan en [registro de permiso específico](../../assets/f3/ASSET-LAB-NEXT-PROVENANCE.txt). El manifest de origen conserva `authorized-commercial-demo`, `redistributionAllowed:false`, `qaStatus:pending`; ninguno equivale a una licencia general de IKEA.

## Reproducción y controles

Desde `scripts/f3-pipeline`, con Node 24 y el lockfile existente:

```powershell
npm ci --no-audit --no-fund
node pipeline.mjs audit "$env:TEMP\rubik-assetlab-readonly-20261002"
node pipeline.mjs prepare "$env:TEMP\rubik-assetlab-readonly-20261002" --next ikea-glostad-2-seat-sofa-knisa-dark-grey-demo ikea-strandmon-wing-chair-tommaboda-deep-beige-demo ikea-skogsta-mesa-acacia-demo ikea-knoxhult-armario-bajo-con-puertas-y-cajon-blanco-demo ikea-stockholm-2025-aparador-chapa-roble-demo ikea-nordli-comoda-de-5-cajones-blanco-demo ikea-glostad-3-seat-sofa-knisa-dark-grey-demo ikea-saltsjobaden-armchair-tonerud-red-brown-demo
node integrate.mjs --next
```

`--next` escribe [resultados separados](F3-pipeline-next-results.json) y conserva el registro de la PR #20. El script ejecuta `@gltf-transform/cli` 4.3.0 mediante Node para decodificar Draco y `sharp` 0.34.4 con NodeIO para convertir imágenes opacas WebP/PNG/JPEG a JPEG de calidad 82 y lado máximo de 1024 px. Se rechazan transparencias y extensiones ajenas a Draco/WebP. Cada salida vuelve a pasar límites de GLB autocontenido, cero extensiones, cuatro JPEG/ ocho materiales, dimensiones de malla válidas, tamaño y hash. La integración exige IDs revisados, manifest de origen, SHA de cada entrada y salida, permiso de esta tarea y revisión previa de conflicto. El manifiesto externo resultante ocupa 55 209 bytes, bajo los 65 536 bytes admitidos por la UI. No se descarga un modelo al navegar por el catálogo: se carga al usarlo en 3D. Los SHA de salida se reprodujeron en este entorno Windows con las versiones fijadas; un codificador nativo de otra plataforma podría dar bytes distintos y el integrador exigiría revisar de nuevo el resultado antes de incorporarlo.

## Seis modelos incluidos

Todas las dimensiones de la tabla son **cajas de malla normalizada en mm, derivadas del GLB**; ninguna es una dimensión oficial verificada ni demuestra la escala física. El archivo de resultados contiene ruta, bytes, SHA-256, imágenes y cajas XYZ originales/finales.

| Modelo | Malla ancho × alto × fondo (mm) | Original → normalizado (bytes) | JPEG | SHA-256 final |
| --- | --- | --- | --- | --- |
| GLOSTAD sofá 2 plazas | 1235 × 766 × 794 | 892232 → 1810356 | 3 | `f851d4dcbf6fcc46c3eddc8dd2458978e2f2d1ed010274dd5dd2d3bdb2ec1ff5` |
| STRANDMON sillón | 814 × 1012 × 978 | 1196180 → 2682460 | 3 | `d2c40079ca97addd9d8152b58b6e34549eb33733e826ccdee81e347f0b1aa376` |
| SKOGSTA mesa | 1600 × 743 × 805 | 208876 → 1057164 | 2 | `511c1372cea9de56d4d9a8132cc43323ed3d64cd5e9caebddd0be326b7c950ee` |
| KNOXHULT armario bajo | 1220 × 909 × 610 | 301860 → 1627956 | 3 | `ae390ea20f370749aefab562d7d8b847e0d421068e59f82fab784027033a9cf0` |
| STOCKHOLM 2025 aparador | 1608 × 832 × 432 | 147828 → 490828 | 2 | `44d77f5745d5f03b96287b80d153a85e97103f3e398e371b22035795b2918d32` |
| NORDLI cómoda | 1202 × 1691 × 477 | 568708 → 1171204 | 4 | `892dc56901b334194549b841ccd71a6bb7c454c6295c183174c19d43cfffefe0` |

## Dos candidatos excluidos

| Candidato | Motivo reproducible |
| --- | --- |
| `ikea-glostad-3-seat-sofa-knisa-dark-grey-demo` | `unsupported source extension: KHR_texture_transform`; extensión fuera del perfil actual. |
| `ikea-saltsjobaden-armchair-tonerud-red-brown-demo` | `unsupported source extension: KHR_materials_ior, KHR_materials_specular`; extensión fuera del perfil actual. |

No se copian los convertidos de esos candidatos ni se silencian materiales opcionales para incluirlos. Las dimensiones oficiales no se consultaron ni verificaron en esta entrega; cualquier contraste de escala física requiere ficha fiable por producto. Rendimiento en teléfono físico y validación empírica F2 siguen pendientes, sin bloquear esta PR. [QA de esta entrega](../qa/f3-next-2026-10-02.md).
