# F3 · normalización e integración de Asset Lab — integrada (PR #20)

**Base Rubik:** `18c68e21ec03819b9d44dfe51d27179c5bdad5d7` (`master`, comprobado por `git ls-remote` el 01-10-2026). **Asset Lab:** `5dc7b182c5c227472b84aea66a3ffa1368c95981` (`main`, clon temporal de solo lectura). La autorización de Juanma para usar recursos de Asset Lab en Rubik y preparar Git/preview se registra en [la procedencia](../../assets/f3/ASSET-LAB-PIPELINE-PROVENANCE.txt). El manifest de origen declara `authorized-commercial-demo`, `redistributionAllowed:false`, `qaStatus:pending` y referencias mayoritariamente a una plantilla; se conservan esos hechos, separados del permiso específico confirmado por Juanma. No se afirma licencia IKEA general ni afiliación.

## Inventario y selección

El [inventario generado](F3-pipeline-inventory.json) recorre físicamente `assets/**/*.glb` y contrasta rutas, bytes y SHA-256 con las 134 entradas del manifest. Resultado: **114 GLB físicos, 20 entradas sin GLB, cero GLB físicos fuera del manifest**. Guarda por recurso formato, extensiones requeridas, imágenes embebidas (tipo, resolución y peso), materiales, dimensiones declaradas, datos de permiso y estado QA. El inventario anterior era del mismo SHA, pero esta entrega lo reprodujo. El único producto físico con tres dimensiones numéricas en el manifest no basta para convertir las cajas de los demás en medidas oficiales.

Se probó una tanda variada de 16 candidatos, escogidos por habitaciones y tipos distintos y peso de entrada inferior a 8 MiB. **Doce superaron el perfil y se incorporaron**: cama BRIMNES, cómoda MALM, mesa y silla LISABO, mesa NÄMMARÖ, mesa de centro FRÖTORP, alfombra MORUM, mueble TV HEMNES, lámparas SOLVINDEN y LAUTERS, sillón VÄSMAN y sofá NÄMMARÖ. Los cuatro rechazados están en [el registro de conversión](F3-pipeline-results.json): GLOSTAD conserva `KHR_texture_transform`; BRIMNES TV y la mesita BRIMNES conservan `EXT_texture_webp` y seis imágenes (límite: cuatro); SALTSJÖBADEN conserva `KHR_materials_ior` y `KHR_materials_specular`. No se publican sus archivos convertidos.

## Perfil y ejecución reproducible

El pipeline usa Node 24, `@gltf-transform/cli`, core, functions y extensions **4.3.0**, `draco3dgltf` **1.5.7** y `sharp` **0.34.4**, fijados en [package-lock.json](../../scripts/f3-pipeline/package-lock.json). La normalización decodifica Draco con `copy`, convierte WebP/PNG a JPEG con calidad 82 y reduce cada imagen como máximo a 1024 px de lado con Lanczos3. Mantiene escena, unidades glTF en metros y transformaciones de nodos; no escala para simular medidas de fabricante. El perfil de salida exige GLB autocontenido, sin extensiones usadas o requeridas, sin animaciones o skins, cuatro imágenes JPEG embebidas como máximo, ocho materiales, imagen ≤1 MiB/2048 px y archivo ≤8 MiB. El cargador de Rubik comprueba además recursos y hashes en tiempo de ejecución; **no se amplió su lista de formatos aceptados**.

```bash
git clone --depth=1 https://github.com/Juanmaes83/immersphere-asset-lab.git /tmp/f3-asset-lab-audit
cd /workspace/floorplan-3d/scripts/f3-pipeline
npm ci --cache /tmp/f3-npm-cache --no-audit --no-fund
node pipeline.mjs audit /tmp/f3-asset-lab-audit
node pipeline.mjs prepare /tmp/f3-asset-lab-audit ikea-solvinden-solar-floor-lamp-outdoor-beige ikea-glostad-3-seat-sofa-knisa-dark-grey-demo ikea-brimnes-estructura-de-cama-con-almacenaje-blancoluroy-demo ikea-malm-comoda-6-cajones-blanco-demo ikea-lisabo-mesa-chapa-fresno-demo ikea-lisabo-silla-negrotallmyra-negro-gris-demo ikea-nammaro-garden-table-light-brown ikea-frotorp-coffee-table-white-chrome-white-glass-demo ikea-morum-indoor-outdoor-rug-beige ikea-brimnes-tv-unit-white-demo ikea-hemnes-tv-unit-white-light-brown-stain-demo ikea-saltsjobaden-armchair-tonerud-red-brown-demo ikea-lauters-floor-lamp-brown-ash-demo ikea-brimnes-mesita-de-noche-blanco-demo ikea-vasman-armchair-outdoor-brown ikea-nammaro-2-seat-outdoor-sofa-light-brown-beige-grey
node integrate.mjs
```

`integrate.mjs` acepta solo IDs revisados y verifica el hash de cada salida antes de actualizar el manifest. Cada modelo conserva ID de Asset Lab, hash de entrada/salida, peso original/final, límites de imágenes, caja XYZ, autorización, atribución y pasos de conversión. [Resultados por modelo](F3-pipeline-results.json) contiene esos datos exactos. Los modelos anteriores y la biblioteca de 50 superficies permanecen en sus catálogos. El schema `FloorPlanProjectV1` sigue en 1.4.0: `assetRef` solo referencia catálogo e ID, y el genérico sigue visible cuando la carga falla.

## Dimensiones y límites

Las dimensiones mostradas para la tanda nueva son **cajas de geometría normalizada, en mm**, con origen y orientación glTF; su escala física no se ha contrastado contra fichas oficiales. La interfaz las etiqueta como medidas de la malla y señala esa incertidumbre. El modelo se ajusta a las medidas del objeto del proyecto sin cambiar su tamaño guardado. Los dos modelos IKEA del piloto conservan sus medidas de producto y su procedencia anteriores. No se convierte la caja en especificación de fabricante ni se infiere una tolerancia física nueva.

El límite de 8 MiB y los límites de imágenes son del cargador actual, **no un presupuesto de rendimiento aprobado**. Las pruebas de escritorio y móvil emulado usan Chromium con SwiftShader: comprueban carga y comportamiento, no velocidad en GPU o teléfono físico. Para medir rendimiento real sigue pendiente un teléfono físico y criterios acordados. F2 continúa experimental; sus cinco sesiones y veinte planos no bloquean esta entrega.

## Comprobaciones

La nueva prueba de navegador carga cada uno de los 12 GLB mediante el cargador de producción y verifica dimensiones, geometría, texturas y búsqueda. Para **cada modelo** comprueba selección, movimiento por el control X, persistencia tras recargar, importación JSON y eliminación. La escena mixta comprueba cuatro modelos simultáneos en escritorio y móvil emulado, recarga del proyecto y estado de carga; [captura escritorio](../qa/artifacts/f3-pipeline/mixed-1440x900.png) y [captura móvil](../qa/artifacts/f3-pipeline/mixed-390x844.png). Las pruebas anteriores de `assetRef`, exportación ZIP/JSON, fallback y superficies se ejecutan de nuevo en la suite. Los resultados finales y cualquier fallo se consignan en la PR; no equivalen a revisión visual humana.

Validación final en este checkout: `node --test --test-concurrency=1 tests/*.test.cjs` **178/178** (0 fallos, omisiones o cancelaciones; 831,77 s); cuatro scripts Python existentes **42/42**; `scripts/check-documents.py` y `git diff --check` sin errores. El barrido de 50 superficies pasó dentro de la suite Node. Chromium usó SwiftShader y las descargas Three.js de la prueba emplearon `curl` con verificación TLS porque Chromium no confió directamente en la CA de la plataforma. Las capturas son de emulación, no de teléfono físico.

**Fallo inicial corregido:** Blender 4.3.2 no pudo importar Draco porque faltaba `libextern_draco.so`; se eligió glTF Transform con decodificador propio. La primera instalación local mezcló core 4.3.0 y 4.5.1 y produjo un fallo en `jpeg`; se fijaron todos los paquetes glTF a 4.3.0 y se regeneró el lockfile. La herramienta de conversión rechaza extensiones residuales sin tocarlas en el cargador.

## Registro de los doce modelos incorporados

| Modelo | Malla ancho × alto × fondo (mm) | Original → normalizado | Extensiones originales | Texturas finales | SHA-256 original / final |
| --- | --- | --- | --- | --- | --- |
| IKEA SOLVINDEN · lámpara de pie solar | 258 × 1200 × 250 | 25,968 → 195,384 B | KHR_draco_mesh_compression | 0 JPEG | `fd7be7eae99afc3a787482afa17244fa4db27e71e2a8d261d3a7726494160411` / `1012194c96e7e116650a4a7936bc63bfd86a59c8026b3ee3bba32c3229397c14` |
| IKEA BRIMNES · cama con almacenaje | 1506 × 470 × 2054 | 630,152 → 3,301,296 B | EXT_texture_webp, KHR_draco_mesh_compression | 4 JPEG | `4aa5610bb99bff386190dc136eb31f50df8c3f0766b7f6534a762a2da8646669` / `2670c91b7d239e40bb631e51e8f5b82d67b85215c1031f1ab5081468a45ad928` |
| IKEA MALM · cómoda de seis cajones | 1603 × 780 × 483 | 356,720 → 290,184 B | EXT_texture_webp, KHR_draco_mesh_compression | 4 JPEG | `7d99ddb4c4a65f8ebd73be26dd3523ea0876d2d96050d5a2c830eae06ab56491` / `c4e5f7af6b452cb97adad5dfb409d1f23654370010228ae8b09696cab2d82c31` |
| IKEA LISABO · mesa de fresno | 1400 × 740 × 780 | 77,744 → 261,580 B | EXT_texture_webp, KHR_draco_mesh_compression | 2 JPEG | `d5142ade612d60b3930115e28d57ae4dfb8b5164954fb1568a9ae5b714ae21f6` / `36f27968b7b4e34ccba96fe2424aeef7119c4dd88512a0dab444bf8b5020853f` |
| IKEA LISABO · silla negro y gris | 455 × 804 × 521 | 321,452 → 2,054,416 B | EXT_texture_webp, KHR_draco_mesh_compression | 2 JPEG | `564205ff65b5625edede81445ed911594ea7bd871ee19cb1f3abfc0d03135e90` / `016b277d201ecde0a3b82cef2a28dd3975b0fc50ebb507b5d78720c4f79aad8d` |
| IKEA NÄMMARÖ · mesa de jardín | 750 × 750 × 630 | 184,216 → 1,034,908 B | EXT_texture_webp, KHR_draco_mesh_compression | 2 JPEG | `5ab7c7e20f99fe76b13a4cc9f2a4dba6323ca0c1d87d9532eb80d1cecec0070b` / `f99c03d0e58f721df58d2d347f633369188dbf519e656eafd569496e200312aa` |
| IKEA FRÖTORP · mesa de centro | 883 × 349 × 883 | 325,104 → 943,932 B | EXT_texture_webp, KHR_draco_mesh_compression | 3 JPEG | `102063ce485aaae9c75d65dc21c6584768f09fabc5b987819cd7e8dc68cce32d` / `6b0cddebac3d3243281bb6dde88b7c5f79ec32cd0a5a7a1e68efcf1d585c6f0b` |
| IKEA MORUM · alfombra beige | 1594 × 16 × 2319 | 275,944 → 403,896 B | EXT_texture_webp, KHR_draco_mesh_compression | 2 JPEG | `db17959485c5559bf8f5048e615418e6720daafbbff80e318e86c119276c2afb` / `bc72dbf9b10be487e5bbb8a020eab814828f5119e918f9d7d50af942cc1ee558` |
| IKEA HEMNES · mueble de TV | 1477 × 570 × 488 | 146,392 → 873,520 B | EXT_texture_webp, KHR_draco_mesh_compression | 2 JPEG | `23b9bf671b18666df2cb04aba8bce5e7769077d0fe1a283e28150483204ca80d` / `9bcf19d78c2954d215718785bd2d9932b826fa0aa1430722f3f61f58942e94fe` |
| IKEA LAUTERS · lámpara de pie | 719 × 1435 × 553 | 122,144 → 549,712 B | EXT_texture_webp, KHR_draco_mesh_compression | 2 JPEG | `aa556cdf8ec6155942a3dd1dee23411d13fa9ca55b731f1afd45b89f2e7e1de3` / `e406b7d2f41430f102dddcda5ddaf7786542572056d4ef631acb6e92b58349ca` |
| IKEA VÄSMAN · sillón exterior | 571 × 920 × 637 | 465,188 → 3,565,448 B | EXT_texture_webp, KHR_draco_mesh_compression | 2 JPEG | `5ff3354496f91625dfa3aa9b61a4f40fcb153c8c651a903ce84632611079af35` / `9d19f3c7c1e1be0d845aef3843d471055db4637bf80b5d68fb1f9474866f0ce7` |
| IKEA NÄMMARÖ · sofá exterior de dos plazas | 1270 × 798 × 743 | 559,996 → 780,996 B | EXT_texture_webp, KHR_draco_mesh_compression | 4 JPEG | `f284e9ba36ec44880d6c7b82bf4370e5228748c1d32f1f0a06414e082c3446fb` / `7114e080f5812e35b3894eca1efb0c0bb42d23113d2fffd15bb27c00d4eaa8e8` |


## Registro de integración de PR #20 — 01-10-2026

Juanma autorizó la fusión por squash de la ampliación de Asset Lab. HEAD revisado: `8a19d602dbab624c86f9d040c6d9d26a5fa526c4`; merge en `master`: `29250810a8341b3b296539118b54799f1e31a77b`. Vercel confirmó la deployment de producción `READY` para ese SHA (`dpl_8wu9peThE8KGn4khX5uabs3Hs8ws`). La URL estable pública es https://floorplan-3d-alpha.vercel.app/. Esto registra el merge y el despliegue; no afirma medidas oficiales ni validación de rendimiento en teléfono físico.
