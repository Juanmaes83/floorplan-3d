# SCULPT OP-05 · GLB propios y biblioteca

## SOURCE EXACT

[OpenPlan3D `771c9e1ad30bd1c3cc7584d6eca74deb2e14943d`](https://github.com/laanlabs/openPlan3D/tree/771c9e1ad30bd1c3cc7584d6eca74deb2e14943d) · [Licencia MIT y atribución](upstream/LICENSE) · [Manifiesto de blobs y dependencias](SOURCE-EXACT.json) · [SHA-256 de los archivos nuevos](SOURCE-EXACT.sha256). Se fijaron 64 rutas, de las que 42 se archivan aquí, 21 referencian blobs previos idénticos y una queda en el donante por ser un GLB de prueba que incluye una imagen reutilizada. Las suites originales se ejecutan desde el checkout completo del donante.

## BASELINE

**73/73 Vitest** en 15 suites del donante y **1/1 Chromium**. El navegador acredita importar, previsualizar, colocar, deshacer y reabrir un modelo local. El baseline de colocación ya acreditado se referencia en [OP-02 SOURCE EXACT](https://github.com/Juanmaes83/floorplan-3d/blob/50a4bab0026d08e8c30f4c18b3dca86448973c31/labs/sculpt/op-02/README.md).

```powershell
$suites=git ls-files 'tests/local-glb*.test.ts'
node node_modules/vitest/vitest.mjs run $suites tests/custom-model-import.test.ts tests/custom-model-definitions.test.ts tests/custom-model-loader.test.ts tests/custom-model-source.test.ts
node node_modules/@playwright/test/cli.js test --project=chromium tests/browser/custom-model-import.spec.ts
```

El [banco sintético F3](../../../assets/f3/synthetic-bench.glb) y su [permiso exacto](../../../assets/f3/LICENSE.txt) son el control RUBIK de la escultura. Asset Lab conserva su autorización y sus referencias de catálogo. El [inventario acreditado de F3](../../../docs/technical/F3-asset-lab-next.md) se usa como evidencia de admisión, no como permiso sobre GLB de usuario.

## CLASSIFY

| Decisión | Corte y dependencia |
|---|---|
| KEEP | Identidad SHA-256 de los bytes originales, verificación de recursos embebidos, límites previos a decodificación y rechazo de referencias externas. Reusar `localGLB*` y las pruebas de geometría, materiales y decodificación antes de admitir GLB de usuario en el producto. |
| GENERALISE | Separar bytes, ficha privada, evidencia de derechos e instancias. Las referencias de objetos conservan huella y dimensiones canónicas. Si falta el binario, queda la representación genérica existente. El eventual adaptador de vista reutiliza F3 y el renderer canónico, con liberación de recursos. |
| REPLACE | El base64 en el proyecto y el almacén del donante se sustituyen por una referencia local y el dueño transaccional de F0.2b/c. Reusar comprobación de rutas, manifiesto, tamaños y SHA-256 del futuro expediente. |
| OPTIONALISE | Previsualización WebGL del donante, controles y colocación. Validar teclado, dispositivo sin WebGL y presupuestos en móvil real antes de ofrecerlos. |
| REMOVE | Publicación, URL del fichero, reutilización de permisos de terceros, replicación de la biblioteca global del donante y acceso automático a URL de procedencia. |

## ESCULPIR y PULIR

[Escultura de admisión](admission.mjs) sobre `master@dd528119bdfd80733c4faf5bb56a594190fea5ac`. Reusa el inspector y presupuesto piloto de `asset-loader.mjs`. Compara SHA-256 de bytes originales en un conjunto privado y preserva la ficha existente al deduplicar. Si el mismo binario trae evidencia distinta, devuelve conflicto. La salida conserva una etiqueta explícita, procedencia, atribución, texto de licencia, ámbito privado y huella de evidencia. Omite rutas, nombre de archivo, enlaces y binarios. Los derechos se deben revisar antes de admitir recursos reales. El laboratorio valida el formato de la evidencia y no la autoría ni el permiso subyacente.

**3/3 ensayos** en Node 24.14.1 con Three vendorizado. Verifican identidad y evidencia contra los bytes exactos, deduplicación, metadatos privados, conflicto de derechos, longitud máxima y contenedor inválido. La ejecución carece de almacenamiento y de red. La escultura usa el techo F3 de 8 MiB, cuatro imágenes JPEG embebidas, cuatro texturas, ocho materiales, 2.048 px por lado y 16/24 MiB de presupuesto decodificado/GPU. El donante admite 16 MiB y PNG/JPEG con límites distintos. Esta preparación conserva el techo existente y deja pendiente la cualificación de un perfil de usuario más amplio, incluidos mallas, índices, profundidad, extensiones, texturas y memoria en dispositivos reales.

```text
node --test labs/sculpt/op-05/admission.test.mjs
```

## Dependencias y gates

- **F0.2b** conserva una sola autoridad de biblioteca y documentos. Admisión, instancia, revisión y referencias deben quedar coherentes al guardar y resolver conflictos.
- **F0.2c** debe gestionar originales por SHA-256, referencias transaccionales, diario provisional y cuota. La recogida solo libera bytes cuando se han resuelto todas las referencias de proyectos, deshacer, versiones, recuperación y expedientes. La deduplicación cruza bytes dentro de la autoridad permitida y mantiene el ámbito de derechos de cada registro.
- **F0.3** gobierna recuperación, permiso y copia. El expediente debe distinguir adjuntos privados de recursos redistribuibles, conservar hashes y derechos, omitir nombres y rutas sensibles al exportar, y bloquear fugas por enlace compartido o catálogo público. El schema actual limita `assetRef` a catálogos autorizados. El futuro vínculo local requiere contrato y pruebas de lectura anterior y restauración. La escultura no modifica el schema.

**GO de laboratorio** para validar admisión privada, integridad, deduplicación y conflicto de derechos. **NO-GO de producción** hasta cerrar F0.2b/c y F0.3, acordar el vínculo canónico y el alcance de exportación, portar la validación completa de geometría del donante y acreditar límites de uso, recuperación, cancelación y privacidad sobre capturas reales autorizadas. OP-05 permanece aislada de OP-04 y #267.
