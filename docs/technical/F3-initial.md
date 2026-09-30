# F3 — entrega inicial, no fase cerrada

Base verificada: master `fdd3d803d537871ce9b2e37b2f87578dd5ae7f1f`.
Rama única: `feat/f3-authorized-assets`; checkout inicial limpio en la rama F2,
conservada. Las PR abiertas al comenzar eran #1/#2/#3, sin rama/PR F3 duplicada.
PR #11 ya está integrada. F2 continúa experimental y no validada: cinco sesiones
y veinte planos autorizados siguen pendientes para validación posterior, sin
bloquear F3. El README obsoleto «en revisión» se corrige en esta entrega.

## Recorrido inspeccionado y alcance

La biblioteca tenía **60 entradas**, anchura/fondo/color; alturas codificadas
dentro de `buildFurniture`, no como datos del catálogo. La escena procedimental,
el SVG y la persistencia comparten `project.objects`/Core.editing. Three.js ya
estaba fijado a 0.160.0 en jsDelivr, con fallback WebGL. Materiales son presets
procedimentales/color de FloorPlanProjectV1, sin binarios ni precios canónicos.

Se extrae la misma biblioteca a `js/generic-catalog.js` conservando orden, nombres,
huellas y colores. Cada entrada añade altura explícita validada; son **defaults
de diseño genérico, no medidas comerciales**. Muebles nuevos guardan esa altura.
Se añade edición de altura opcional; abrir proyectos viejos no los reescribe ni
rellena dimensiones ausentes. Los genéricos con altura explícita se ajustan a la
caja ancho/fondo/alto y apoyan en suelo; los anteriores sin altura conservan su
representación procedimental. No se integra un catálogo externo de materiales.

`assetRef` ya existía en contrato y schema, pero su enum solo admitía Asset Lab.
La ampliación compatible **1.3.0** añade `rubik-sota-local` y documenta revisión
por contenido para ese catálogo. No hay migración destructiva ni campos nuevos
obligatorios: [contrato](../contracts/FloorPlanProjectV1.md) y
[ejemplo sintético](../contracts/examples/floorplan-project-v1.f3.example.json).
Lectores antiguos pueden rechazar el nuevo enum; no se oculta ese límite.

## Asset Lab: auditoría actual en solo lectura

Repositorio leído: `Juanmaes83/immersphere-asset-lab`.
SHA auditado: **`5dc7b182c5c227472b84aea66a3ffa1368c95981`** (`main`).
Clon temporal, sin editar, commit ni push; `git status --porcelain` final vacío.
Se leyó el manifest actual y su validador, permisos y árbol Git. Los números
históricos del plan PR #3 no se asumen actuales.

| Evidencia | Declarado | Comprobado ahora | Inferido / pendiente |
| --- | --- | --- | --- |
| Inventario | 134 entradas, todas de la misma marca excluida | 134 IDs revisados; cada ruta contrastada con árbol Git | Manifest no demuestra derechos |
| Modelos | `modelPath` por entrada | 114 ficheros existentes y tracked, 20 ausentes; 58 513 056 bytes totales; SHA-256 por fichero | No se copian a este repo |
| GLB | formato `glb` | Cabecera magic/version 2/longitud, chunks alineados y JSON glTF 2.0: 114/114; posterior decodificación con GLTFLoader: 114/114 | No es certificación glTF completa |
| Extensiones obligatorias | arrays dentro de los GLB | 87 Draco+WebP; 16 solo Draco; 6 Draco+WebP+texture-transform; 5 sin extensiones obligatorias | 109 requieren Draco; no se habilitan en la app |
| Recursos subordinados | GLB | Ninguno declara URI externa en buffers/images | Texturas embebidas; no prueba de derechos de imagen |
| Previews | 134 rutas | 134 existentes/tracked: 20 SVG parseados como XML, 114 firmas PNG; bytes/hash por ruta | No se publican ni se asume calidad de todas las previews |
| Dimensiones | 21 entradas con tres números | Solo **1 de los 114 modelos existentes** tiene tres dimensiones declaradas; otras 20 son placeholders ausentes | Fuente física fiable y normalización por asset no acreditadas |
| Permisos | banderas/tipos en manifest | 133 refs a `permissions/README.md`, una a PDF inexistente; README es plantilla con marca `pending` | Cero documentos que cubran este uso |

Inventario completo de las 134 rutas con bytes, hashes, formato, extensiones,
decodificación/cajas y motivo de exclusión:
[F3-asset-lab-inventory.csv](F3-asset-lab-inventory.csv).
Es un informe generado de hechos, **no copia del manifest, modelos ni permisos**.
«Comprobado» se distingue en nombres de columnas de «declarado» y «pendiente».

Se aplicaron transforms de nodos al decodificar y se midieron cajas geométricas
en el marco glTF (metros según especificación). Se calculan 2 402 856 triángulos
y 125 337 012 bytes de atributos/índices sumados sobre los 114; no memoria de
escena simultánea ni benchmark. No se valida una normalización de origen físico
porque falta su procedencia. Para el único fichero con dimensiones numéricas,
declaradas 640×950×590 mm, la caja XYZ glTF es
612.415×945.416×657.876 mm: difiere 27.585/4.584/67.876 mm, fuera de ±20 en dos
ejes bajo orientación identidad. No se ajusta arbitrariamente para hacerlo pasar.

Muestra visual privada: dos GLB sin Draco, identificados en inventario como
`ikea-songesand-comoda-de-3-cajones-blanco-90366839-demo` y
`ikea-stockholm-2025-sofa-de-2-plazas-alhamn-marron-oscuro-90591748-demo`.
Se comprobaron carga, orientación visual básica y apariencia de cajonera/sofá;
no tamaño físico, marca/licencia, texturas de los demás ni GPU real. Se visualizaron
solo en la auditoría local expresamente solicitada. Sus capturas están fuera del
checkout público y no se cargan en la experiencia ni en Vercel.

**Puerta de permisos por candidato:** uso comercial, redistribución, streaming,
modificación, atribución, territorio, duración y marca: **no verificados** en los
134. La plantilla `pending` no cubre ningún candidato concreto; el PDF no existe.
No se expone ningún nombre/SKU/imagen/precio de esa marca en la app. El validador
`node /tmp/f3-asset-lab-audit/scripts/validate-manifest.js` dio código 0 y
«ALL CHECKS PASSED, 134 items»: comprueba estructura/enum/IDs, no existencia de
ficheros, hash, GLB, dimensiones físicas ni alcance jurídico. Su verde no abre
la puerta. La auditoría de cabeceras/hash se ejecutó con Python/stdlib y la
decodificación privada con `node /tmp/f3-private-audit.cjs`; esta última terminó
«Decoded 114 Failures []». El primer resumen Python falló al encontrar dimensiones
`null`; se corrigió el resumen, sin convertir esos null en medidas.

## Asset de prueba propio y permiso

Se publica solo **un banco sintético original** de cinco sólidos rectangulares,
sin diseños, imágenes ni geometría copiados. Generador propio:
`scripts/generate-f3-bench.py`; `--check` verifica byte por byte el GLB.

- Modelo: [synthetic-bench.glb](../../assets/f3/synthetic-bench.glb), **4 204 bytes**,
  SHA-256 `bbf24d137a9172528885b715d2e0caa2a38ab2ccc671030c3eb270820d64e3e3`.
- Permiso: [LICENSE.txt](../../assets/f3/LICENSE.txt), **1 451 bytes**, MIT específico
  del asset/generador; SHA-256
  `951e71b78b38fde0c1477ca7e9773a7ea058bd77eb0bb16aa5693a162cb165ea`.
- MIT permite uso comercial, streaming/distribución y modificación, mundial y
  sin vencimiento, conservando aviso/licencia. Atribución: Rubik Sota — MIT.
  No concede marcas de terceros ni licencia a todo el repositorio.
- Dimensiones fuente: diseño matemático del generador, 600×450×400 mm.
  No son un producto de fabricante ni una medición externa.

Fuente única de lectura: `assets/f3/catalog.manifest.json`, con la forma de array
y campos que usa el manifest existente de Asset Lab, más evidencia por asset.
`js/asset-catalog.js` adapta esa fuente; para Asset Lab acepta evidencia auditada
separada, sin copiar/mantener su catálogo ni confiar en las banderas comerciales.
Esta primera ruta restringe recursos a `assets/f3/` local y marca propia: un
catálogo de terceros necesita permiso/normalización/ruta aprobados y otra revisión.
Ninguna llamada al repositorio Asset Lab se hace desde la app.

## Normalización, sustitución y fallo

Se aplican primero los transforms glTF de nodos. El fixture usa deliberadamente
scale 2 y giro Y +90; normalización escala 0.5 para compensarlo y giro Y −90.
Las coordenadas del GLB son metros; 0.5 es una compensación de escala documentada,
no una afirmación de que glTF tenga otra unidad. Se recentra X/Z en la caja y se
coloca su mínimo Y en el apoyo. Se compara la caja **antes de adaptar al objeto**:
600.000000000001×450×400.000000000000 mm, error flotante ≪20 mm por eje.
Un desvío >20 mm bloquea el asset y deja el genérico.

Después se adapta el modelo validado al ancho/fondo/alto del objeto. Si no tiene
altura explícita se conserva la altura visible del genérico sin guardarla.
La escala por eje puede deformar la apariencia de un objeto redimensionado;
no modifica dimensiones canónicas ni afirma medidas comerciales. El contenedor
conserva posición, rotación, elevación, ID/estancia/selección; SVG y picking siguen
usando el mismo objeto. Cambiar a «Genérico» quita solo `assetRef`.

El genérico está visible durante la carga. Se verifica permiso y GLB por tamaño
y SHA-256; errores, URL rota, offline, timeout de fetch de 8 s, revisión/ID
desconocidos o dimensiones incorrectas dejan ese genérico. Estados en propiedades
con `role=status`/`aria-live`; selector nativo, altura y controles disponibles en
el panel desplazable móvil. Se cancelan cargas antiguas al reconstruir; una
respuesta tardía no coloca modelos en objetos/proyectos cambiados. Geometrías y
materiales de assets retirados se liberan. No hay caché persistente ni carga de
proyectos/imágenes a servidores. El navegador puede aplicar sus mecanismos
normales de red; `cache:no-cache` exige revalidación.

## Límites y URLs del cargador público

Three.js y **GLTFLoader 0.160.0**, mismo importmap/dominio ya existente:

- `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js`
- `https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js`
- `https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js`
- Los módulos previos de controles, RoundedBoxGeometry, RoomEnvironment y
  CSS2DRenderer siguen bajo el mismo prefijo versionado; sin `latest` ni dominio nuevo.

El modelo/manifest/licencia son GET al mismo origen: `/assets/f3/`.
Sin GLB externos ni redirects; archivos autocontenidos. GLB 2, triangles, sin
textures/images/skins/animations/morphs/sparse accessors, ni extensiones obligatorias
**u opcionales**. No DRACOLoader en la experiencia: no lo requiere el fixture.
La auditoría privada sí utilizó DRACOLoader y su decoder `gltf/` del mismo paquete
Three 0.160.0/jsDelivr para comprobar Draco; no se publica ni habilita esa ruta.
Añadir Draco real a producto requiere modelo autorizado, pruebas específicas y
una revisión del alcance. Se rechazan versiones/recursos no soportados antes
de parsear; no se desactiva verificación TLS.

Guardas técnicas, **no presupuestos de producto aprobados**: GLB ≤8 MiB,
permiso ≤32 KiB, manifest ≤64 KiB, accessor ≤300 000 elementos, timeout de red
8 s. El temporizador no interrumpe trabajo síncrono de parseo; solo fuentes
estáticas auditadas y hashes fijados pueden llegar a GLTFLoader. Parsear un GLB
no equivale a validarlo con Khronos ni garantizar todos los modelos glTF.

## Medidas y presupuesto provisional

Prueba sintética única por tamaño, Chromium/SwiftShader, concurrencia de suite:

| Tamaño emulado | Carga permiso+modelo+integridad+parseo+normalización observada | Modelo | Atributos/índices | Memoria observable de toda escena |
| --- | --- | --- | --- | --- |
| 390×844 | 2812.7 ms | 4204 bytes, 60 triángulos | 3240 bytes | renderer.info: 34 geometrías, 4 texturas |
| 844×390 | 1993.4 ms | 4204 bytes, 60 triángulos | 3240 bytes | 34 geometrías, 4 texturas |
| 1440×900 | 2920.8 ms | 4204 bytes, 60 triángulos | 3240 bytes | 34 geometrías, 4 texturas |

1 451 bytes adicionales de permiso; manifest y módulos/CDN no están incluidos en
esas cifras de payload. Los bytes son buffers recibidos/parseados, no un cálculo
de transferencia móvil o de RAM/GPU total. renderer.info da contadores, no bytes.
No se midieron JS heap atribuible al asset, memoria GPU, FPS, mediana/p90 ni un
móvil físico. Estos tiempos no son un benchmark de móvil ni de red de producción.

Propuesta para discutir con Juanma, **sin adoptar como aceptación**: por asset
≤1 MiB y ≤20 000 triángulos; medir primero conjunto real de escenas/objetos y
un móvil de gama media antes de fijar tiempos/memoria/cantidad visible. Los límites
de seguridad del loader son distintos y no aprueban ese presupuesto. Un fixture
de 60 triángulos no valida rendimiento de un catálogo comercial.

## QA, evidencia y estado de entrega

Pruebas unitarias: catálogo, permisos incompletos/expirados, normalización,
extensiones/paths/bytes, referencias y asociación compatible sin perder campos.
Navegador: tocar/seleccionar modelo, 3D, giro/dimensiones, descarga GET, sin
upload/analytics/WebSockets, fallback offline/404, archivos inválidos, hash del
permiso/modelo, segunda caja fuera de tolerancia, timeout y resultado tardío;
vuelta a genérico/2D y recarga. La recarga de la asociación también se prueba
en escritorio. Solo plano/modelo sintéticos; no hay fixtures de planos reales.

Capturas públicas sintéticas de carga y fallback:
[390×844 carga](../qa/artifacts/f3/390x844-loaded.png) ·
[390×844 fallback](../qa/artifacts/f3/390x844-fallback.png) ·
[844×390 carga](../qa/artifacts/f3/844x390-loaded.png) ·
[844×390 fallback](../qa/artifacts/f3/844x390-fallback.png) ·
[1440×900 carga](../qa/artifacts/f3/1440x900-loaded.png) ·
[1440×900 fallback](../qa/artifacts/f3/1440x900-fallback.png).
El estado en el panel horizontal puede requerir scroll; su selector y los
controles se pueden alcanzar, sin overflow horizontal del documento.
No se publican capturas históricas regeneradas por las regresiones.

No se declara «F3 completa» ni catálogo comercial autorizado integrado. Esta
entrega ofrece la infraestructura, catálogo genérico dimensionado y un modelo
propio mínimo. Pendientes: revisión de PR/preview y aprobación de Juanma,
presupuestos/móvil físico, permisos y dimensiones comerciales, Draco público,
materiales externos. F2 sigue pendiente de validación empírica.

### Comandos reales y resultados

Desde la raíz:

| Comando | Resultado |
| --- | --- |
| `node --test tests/project.test.cjs tests/library.test.cjs tests/tracing.test.cjs tests/wall_assist.test.cjs tests/raw_wall_export.test.cjs tests/assets.test.cjs tests/browser.test.cjs tests/assets.browser.test.cjs` | **120/120**, cero fallos/skips/cancelados; 302074.291029 ms |
| `node --test tests/assets.test.cjs tests/assets.browser.test.cjs` | **10/10**, cero fallos/skips; 42980.396111 ms, tras aclarar la procedencia de normalización del manifest |
| `python3 tests/schema.test.py` | **10/10** |
| `python3 tests/f2_readiness.test.py` | **12/12** |
| `python3 tests/f2_wall_evaluation.test.py` | **16/16** |
| `python3 tests/f2_raw_export.test.py` | **3/3** |
| `python3 scripts/generate-f3-bench.py --check` | GLB idéntico byte por byte, código 0 |
| `node --check` sobre `js/generic-catalog.js`, `js/asset-catalog.js`, `js/asset-ui.js`, `js/asset-loader.mjs`, `tests/assets.test.cjs`, `tests/assets.browser.test.cjs`, `tests/browser.test.cjs` | Todos código 0 |
| `git diff --check` | Código 0 |

También se extrajeron los dos scripts inline ejecutables de index.html (sin el
importmap JSON) a `/tmp/f3-inline-{1,2}.mjs` y se ejecutó `node --check`: ambos
correctos. El nuevo ejemplo F3 se validó con Draft202012Validator/FormatChecker
y Core.validate: ambos correctos. No se cambia detector, evaluadores F2 ni sus
criterios. No se afirma una medición de hardware real o QA humano de preview.

Fallos iniciales conservados como evidencia: primer unitario 1/5 y segundo 3/5;
el permiso `LICENSE.txt` quedaba excluido por un patrón de path solo minúsculas
y el test usó nombres de API Core incorrectos. Se admitió la ruta de licencia
local con mayúsculas y se usó la API existente `Core.prepare`; el tercero dio 5/5.
Primer navegador 2/5: la fixture arrastraba un assetRef ilustrativo de Asset Lab;
se quitó para ensayar el genérico, dejando una prueba separada del puntero no
autorizado. Segundo navegador 3/5: selector de panel móvil incorrecto, no un fallo
de carga; se ajustó al panel real y el tercero dio 5/5. La regresión completa
inicial se interrumpió después de diagnosticar fallos 3D por MIME: el servidor
de test servía `.mjs` como HTML. Se corrigió MIME y se permitió explícitamente
el manifest estático local en la prueba de privacidad F2; no se amplió la política
de red ni se admitieron datos/uploads. La suite completa repetida dio los 120/120
de la tabla. La aclaración final del manifest no alteró geometría/código, y se
repitieron los diez tests F3 sobre sus bytes finales.
