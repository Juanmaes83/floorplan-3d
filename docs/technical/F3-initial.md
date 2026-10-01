# F3 — entrega inicial y piloto externo; fase abierta

Las secciones anteriores al piloto del 01-10-2026 describen la entrega histórica de PR #12. Sus restricciones y resultados no se presentan como los del nuevo piloto.

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

**Estado de permisos en la instantánea auditada:** el manifest declaraba banderas,
pero los documentos asociados estaban pendientes o ausentes y no acreditaban por
sí solos el alcance de uso. Con posterioridad, el 30-09-2026, Juanma confirmó que
el proyecto tiene autorización para usar los assets de Asset Lab. Esa confirmación
permite avanzar con su uso en Rubik Sota; no convierte el inventario de este SHA en
actual ni aporta las dimensiones que faltan. Al seleccionar cada candidato se
registrará la autorización de Juanma junto a la comprobación actual de fichero,
hash, dimensiones, atribución, formato y alcance aplicable. No se expone ningún
nombre/SKU/imagen/precio de esa marca en la app en esta entrega. El validador
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

El control del índice detectó después finales CRLF del CSV como whitespace en
135 líneas. Se normalizaron a LF conservando sus 134 registros y se repitió
`git diff --check origin/master` sobre la entrega completa: código 0.

### Publicación y bloqueos externos de revisión

Commit de implementación/QA: `fd315142141f54abce408fe25cbca3414aed19c1`.
`git push -u origin HEAD` publicó `feat/f3-authorized-assets` sin force push.
El cierre documental/formato CSV posterior conserva todo el código probado.
Base master continúa `fdd3d803d537871ce9b2e37b2f87578dd5ae7f1f`.

Crear PR por REST falló exactamente:

```text
Post "https://api.github.com/repos/Juanmaes83/floorplan-3d/pulls": Forbidden
```

No se intentó GraphQL ni se modificó red. La lista pública posterior mostraba
#1/#2/#3, sin PR F3. [Preparar PR hacia master](https://github.com/Juanmaes83/floorplan-3d/compare/master...feat/f3-authorized-assets?expand=1).
La descripción debe separar implementación, banco propio MIT, todos los assets
excluidos, límites, pruebas y pendientes; este informe contiene esos datos.

GitHub muestra `Vercel / Vercel Preview Comments: succeeded` en el commit de
implementación. No es un deployment READY ni CI de pruebas. No hay workflow
propio de CI en `.github/`; los resultados de suites son ejecuciones locales.
El enlace de feedback apunta a la
[preview candidata](https://floorplan-3d-git-feat-f3-autho-dce6ec-juanma-espinosas-projects.vercel.app/).
La petición sin autenticación desde este entorno falla exactamente con
`curl: (56) CONNECT tunnel failed, response 403`, HTTP 000. No se obtuvo respuesta
del deployment; no se deduce de ese túnel si requiere login. No hay capacidad
Vercel API disponible ni binding VERCEL_TOKEN para consultar SHA/READY. No se
extraen credenciales ni se amplía red para resolverlo.

**Pendiente:** crear la PR desde el enlace manual y confirmar en Vercel READY,
SHA final de la rama, URL y acceso para revisión humana. La URL candidata no se
presenta como preview verificada del HEAD documental final. No hay merge ni
despliegue manual a producción. Todo el trabajo permanece publicado en GitHub.


## Cierre de revisión y merge — PR #12 (30-09-2026)

Juanma aprobó la revisión visual de la preview y la PR #12 quedó fusionada en `master`.
- Rama: `feat/f3-authorized-assets`.
- Base: `fdd3d803d537871ce9b2e37b2f87578dd5ae7f1f`.
- HEAD revisado/deployment READY: `b3c72d0c6fae1290c9a7b4e449aa388c3f878531`.
- Merge commit: `95fcf0da989a9e3bf85f8747c19fc4a9a13426ab`.
- PR: [#12](https://github.com/Juanmaes83/floorplan-3d/pull/12).
- [Preview protegida](https://floorplan-3d-git-feat-f3-autho-dce6ec-juanma-espinosas-projects.vercel.app/) · [deployment Vercel](https://vercel.com/juanma-espinosas-projects/floorplan-3d/F8NcvTSZF37VdrUBi2c7Kqx9W8uw).

Estado actualizado: **F3 inicial integrada; catálogo externo pendiente**. Juanma confirma que el proyecto tiene permisos para usar los assets de Asset Lab. La auditoría descrita arriba documenta el estado técnico del commit Asset Lab inspeccionado en ese momento; no se tratará como inventario actual ni como verificación de permisos por modelo. Antes de integrar un candidato, comprobar en Asset Lab la versión actual, presencia/hash del fichero, dimensiones verificables, formato/extensiones y alcance de permiso/atribución. Esta entrega no incorpora modelos de Asset Lab; el único GLB publicado es el banco sintético propio con licencia MIT específica.

La PR tenía Vercel `READY` para el HEAD. El check remoto observado fue Vercel Preview Comments; la batería 120/120 Node/browser, 10/10 F3 y 41/41 Python fue reportada por Codex como ejecución local previa, no CI remota. SwiftShader no acredita rendimiento en teléfono físico. Las pruebas no se repitieron durante el merge/documentación. F3 continúa abierta para avanzar el catálogo, sin bloquearse por la validación empírica pendiente de F2.

## Piloto externo texturizado (01-10-2026)

### Base y alcance

Rama `feat/f3-textured-external-catalog`, nueva desde master
`6e8b512d61e8f500c2d6a7f1cfdfdeb7e7c5930f`. Las páginas públicas de PR #13 y #14
indicaban Merged; master contiene la auditoría y su actualización de roadmap.
No había PR F3 nueva abierta; la rama histórica `feat/f3-authorized-assets` ya
corresponde a PR #12 integrada. El checkout previo de documentación estaba limpio
y se conserva. No se modifica ningún otro repositorio, schema ni decisión comercial.

Se incorporan **dos** productos; un tercero se descarta. `qaStatus: approved`
significa que el recurso pasa las comprobaciones técnicas del adaptador, no aprobación
humana de la PR ni cierre de F3. `FloorPlanProjectV1` permanece en **1.3.0**.

### Inventario reconsultado y permiso

Asset Lab se vuelve a consultar en solo lectura: HEAD remoto y checkout
`5dc7b182c5c227472b84aea66a3ffa1368c95981`.
Manifest `manifest/ikea-sample.manifest.json`, SHA-256
`30d8c7dde47a5b06bf3d03f423bcff3782a37987b37f7ce892bbadea51ddd5ab`:
134 entradas, 114 GLB existentes/tracked, 20 ausentes, 134 previews; 113 GLB tienen
imágenes, 109 exigen Draco, 93 WebP, cinco no exigen extensiones. El validador de
origen pasa 134 entradas, lo que acredita estructura y no derechos/dimensiones.
No se repite ni se presenta como actual una decodificación geométrica de los 114.
Los dos modelos aceptados sí se cargan y miden de nuevo en esta ejecución.

El origen mantiene `redistributionAllowed: false`, QA pending y referencias a una
plantilla de permisos. **No se reescriben esos datos.** La autorización expresa de
Juanma para incorporar, publicar en Git y ofrecer preview en este proyecto se
registra por separado en [ASSET-LAB-PROVENANCE.txt](../../assets/f3/ASSET-LAB-PROVENANCE.txt).
No constituye una licencia mundial del catálogo ni afiliación con IKEA. MIT solo
cubre el banco sintético propio, no los modelos ni texturas de IKEA. El adaptador
exige autorización por proyecto, origen/revisión/ruta/hashes y atribución.

### Candidatos y dimensiones

Ancho × alto × fondo, **mm**, sin usar medidas de embalaje. Las dimensiones oficiales
son evidencia aportada externamente por Juanma, consulta **01-10-2026**; no páginas
abiertas por Codex. Curl devolvió HTTP 403; Playwright devolvió
`net::ERR_TUNNEL_CONNECTION_FAILED`. No se instalaron herramientas ni se modificó red.

| Producto | Dimensiones oficiales | Caja GLB con normalización | Decisión |
| --- | --- | --- | --- |
| SONGESAND 90366839 | 820 × 810 × 500 | 816.000 × 805.916 × 509.610 | Aceptado; mayor diferencia 9.610 mm |
| STOCKHOLM 2025 puf 80586139 | 690 × 400 × 650 | 689.464 × 403.561 × 657.736 | Aceptado; mayor diferencia 7.736 mm |
| STOCKHOLM 2025 sofá 90591748 | 1780 × 700 × 990 | 1806.132 × 711.344 × 1009.908 | Excluido; ancho difiere 26.132 mm, >20 mm |

Fuentes oficiales aportadas, título y URL:

- IKEA Francia, «SONGESAND, commode 3 tiroirs, blanc», artículo 903.668.39:
  <https://www.ikea.com/fr/fr/p/songesand-commode-3-tiroirs-blanc-90366839/>.
- IKEA Chipre, «STOCKHOLM 2025 pouffe», artículo 80586139:
  <https://www.ikea.com.cy/en/products/stockholm-2025-pouffe/80586139/>.
  La fuente publica largo 650 mm, utilizado aquí como fondo.
- IKEA Chipre, «STOCKHOLM 2025 2-seat sofa», Alhamn marrón oscuro, artículo 90591748:
  <https://www.ikea.com.cy/en/products/stockholm-2025-2-seat-sofa/90591748/>.

La cómoda conserva ejes X/Y/Z. El puf rota +90° alrededor de Y para alinear la
anchura publicada con su extensión Z. Coordenadas glTF en metros, transforms de
nodo aplicados, escala de unidad 1; centrado X/Z y apoyo en Y=0. No se fuerza la
escala para superar la tolerancia. Los KNOXHULT 90326787/90621081 no se incorporan:
cinco imágenes/texturas superan el límite del piloto y faltan medidas oficiales
confirmadas. La preselección geométrica del sofá procede de la auditoría previa;
no se ha renderizado ni aceptado el sofá en este piloto.

| Recurso servido | Bytes | Triángulos | Geometría bytes | JPEG / mapas | RGBA decodificado / estimación con mipmaps |
| --- | ---: | ---: | ---: | --- | --- |
| SONGESAND | 784576 | 10605 | 728718 | 2 JPEG 512×589 / 3 mapas | 2412544 / 3216726 bytes |
| Puf optimizado | 327052 | 1198 | 50292 | 3 JPEG 1024×1024 / 4 mapas | 12582912 / 16777218 bytes |

Hashes SHA-256:

- SONGESAND, original y servido: `0deb36aec6daf871df610e0dbfa1d2cfe321c1b772145b7bb365a8921381cb7f`.
- Puf original conservado: `f293f011748cb7687beb9e664ca5133eed55beae2c20011453a520c3a1b9f8d0` (369416 bytes).
- Puf servido: `3da8e51558900bd3e52efbb7446d5bf7db55095ae420750cd96e60ffa6584727`.

El puf original usa tres JPEG 1613×1613: 31221228 bytes RGBA, por encima del límite.
El guard lo rechazó correctamente. No se elevó el presupuesto: se retiene el original
y se genera una copia reproducible con [prepare-f3-pouf.py](../../scripts/prepare-f3-pouf.py),
Pillow **12.3.0 ya instalado**, LANCZOS a 1024², RGB/JPEG calidad 85, subsampling 0,
optimize=false, progressive=false. Conserva los datos geométricos; cambia las imágenes
y sus offsets. Hay pérdida por reducción/recompresión y no identidad visual exacta.
`--check` exige el hash original y compara byte a byte el resultado.

### Ruta segura y semántica

Se permiten solo JPEG core embebidos en bufferView, sin URI (ni data/blob), sin
extensiones, Draco, WebP, animaciones, skins ni morphs. `createImageBitmap` decodifica
bytes comprobados; el plugin de GLTFLoader suministra texturas sin crear object URLs.
Se valida firma JPEG, dimensiones antes de decodificar y tamaño real del bitmap.
Mapas permitidos: base color, metallic/roughness, normal y occlusion, UV0.

Límites técnicos del piloto, **no presupuesto aprobado de rendimiento móvil**:
GLB 8 MiB; cuatro imágenes/texturas, ocho materiales/mapas; JPEG individual 1 MiB,
total comprimido 4 MiB; lado máximo 2048; RGBA decodificado total 16 MiB y estimación
de texturas con mipmaps 24 MiB. La estimación no mide RAM/GPU real. Catálogos locales
64 KiB cada uno, permiso 32 KiB, fetch mismo origen/sin redirects/credenciales,
hashes obligatorios. Timeout 8 s y cancelación cubren trabajo asíncrono; JavaScript
síncrono no es interrumpible. Liberación de geometrías/materiales/texturas y cierre
de bitmaps, incluido resultado tardío tras abortar; no caché persistente de modelos.

La asociación modifica solo `assetRef`: conserva tipo, ID, posición, dimensiones,
giro y elevación. El modelo se adapta a esas medidas y se distinguen medidas del
producto y del objeto. Las pruebas establecen expresamente medidas antes de asociar.
Fallback, cancelación y catálogo parcialmente fallido mantienen el genérico y 2D.
JSON/ZIP exportan referencias, **no GLB ni texturas**; importación/recarga conservan
el contrato. Se mantiene intacta la migración F1a/F1b.

### Regresiones y límites de evidencia

Se amplían pruebas de permisos/hashes/refs y conservación de proyectos; navegador
comprueba JPEG válido sin object URLs, 17 casos inválidos, presupuesto de memoria,
cancelación durante decode y liberación única de recursos. En los tres viewports
1440×900, 390×844 y 844×390 se prueba selección de ambos assets, 2D/3D, proporción de
canvas ≥60%, preservación canónica, recarga e importación/exportación JSON y ZIP.
Capturas y métricas: [f3-textures](../qa/artifacts/f3-textures/).

Fallos iniciales registrados: el helper de fixture devolvía un número en lugar de
Buffer (corregido); la comparación de conservación incluía la referencia del asset
anterior (se excluye únicamente assetRef); el puf original superaba memoria (copia
optimizada, sin relajar guard). Suite completa paralela: 127 pruebas, 122 pasan,
cuatro fallos F2 por el GET del nuevo catálogo y una cancelación por timeout de F1
390×844 (90 s). Se añade exactamente `/assets/f3/external.manifest.json` a la lista
local de GET permitidos de privacidad, sin permitir otros destinos ni POST. La suite
completa se ejecuta secuencialmente sin elevar timeouts ni omitir pruebas.

Un intento inicial de node --check incluyó por error JSON de importmap como JavaScript;
se corrigió el harness: importmap validado como JSON y scripts de index como módulos.
No se confunde ese fallo del comando con un fallo de sintaxis de la aplicación.
Los resultados finales y la publicación se registran a continuación.

### Resultados finales ejecutados

| Comando real | Resultado |
| --- | --- |
| `node --test --test-concurrency=1 tests/*.test.cjs` | **127/127**, 0 fallos/cancelados/skips; 407063.145329 ms |
| `python3 tests/schema.test.py` | **10/10** |
| `python3 tests/f2_readiness.test.py` | **12/12** |
| `python3 tests/f2_wall_evaluation.test.py` | **16/16** |
| `python3 tests/f2_raw_export.test.py` | **3/3** |
| `python3 scripts/generate-f3-bench.py --check` | PASS, fixture original byte-idéntica |
| `python3 scripts/prepare-f3-pouf.py --check` | PASS, hash servido reproducible |
| `node /tmp/f3-asset-lab-audit/scripts/validate-manifest.js` | PASS, 134 entradas, estructura solamente |
| `node --test --test-name-pattern='external textured catalog end-to-end' tests/assets.browser.test.cjs` | **3/3**, 0 skips/fallos; 59714.924534 ms, recaptura identificada con commit de código |
| `node --check` sobre asset-catalog.js, asset-ui.js, asset-loader.mjs, assets.test.cjs, assets.browser.test.cjs, browser.test.cjs y helpers/textured-glb.cjs | PASS, cada archivo por separado |
| `node --check /tmp/f3-current-inline-13.mjs` y `/tmp/f3-current-inline-16.mjs` | PASS; scripts extraídos de index, importmap validado como JSON |
| Python stdlib: AST del script de optimización, enlaces relativos y fences Markdown de README/ROADMAP/informe | PASS; no linter documental instalado añadido |
| Python stdlib: comparación de meshes/nodes/accessors y 5 bufferViews no-imagen originales/optimizados | PASS, bytes geométricos idénticos |
| `git diff --check` y `git diff --cached --check` | PASS |

[Log completo Node](../qa/artifacts/f3-textures/node-regressions.txt),
[resultados Python/manifests](../qa/artifacts/f3-textures/python-manifests.json),
[QA posterior al commit](../qa/artifacts/f3-textures/external-commit-qa.txt).
La recaptura no repite indiscriminadamente la suite: identifica visualmente el código
publicado `7646d84e72e8719373cd095f1c757b073a56d791`. El commit documental posterior
solo añade documentación y evidencia; mantiene el mismo código/assets de aplicación.

| Viewport | SONGESAND carga | Puf carga | renderer.info geometrías/texturas | Canvas / stage |
| --- | ---: | ---: | --- | ---: |
| 1440×900 | 2983.6 ms | 3311.3 ms | 34/6 y 34/7 | 100% |
| 390×844 | 2474.0 ms | 2856.3 ms | 34/6 y 34/7 | 100% |
| 844×390 | 2265.9 ms | 2477.8 ms | 34/6 y 34/7 | 100% |

Métricas del código publicado: [desktop](../qa/artifacts/f3-textures/1440x900-metrics.json),
[vertical](../qa/artifacts/f3-textures/390x844-metrics.json),
[horizontal](../qa/artifacts/f3-textures/844x390-metrics.json).
Cero errores de página y peticiones fallidas en esos tres recorridos. Desktop registra
cuatro warnings del driver SwiftShader `GPU stall due to ReadPixels`; no se ocultan.
Conteos renderer.info son del conjunto de la escena, no bytes GPU medidos.
Fingerprint común de módulos/index/manifiesto:
`adf824ccaeb776dfe3f7fc144c11b92478d3967b01ca486258a0924c0e440444`.

Capturas de ejemplo con viewport/SHA rotulado:
[SONGESAND desktop 3D](../qa/artifacts/f3-textures/1440x900-ikea-songesand-comoda-de-3-cajones-blanco-90366839-demo-3d.png),
[puf vertical 3D](../qa/artifacts/f3-textures/390x844-ikea-stockholm-2025-puf-alhamn-beige-80586139-demo-3d.png),
[puf horizontal 3D](../qa/artifacts/f3-textures/844x390-ikea-stockholm-2025-puf-alhamn-beige-80586139-demo-3d.png).
Los doce PNG cubren ambos productos en 2D y 3D y los tres viewports. Playwright 1.62.1
con Chromium instalado; **SwiftShader es renderizado por software**, no prueba de
rendimiento móvil físico. Three.js 0.160.0 se suministra en los tests por curl con
verificación TLS del sistema cuando Chromium rechaza la CA de la plataforma.
No se instala Firecrawl, decoder, navegador ni paquete.

### Publicación y preview pendiente

Push `git push -u origin HEAD` correcto sin force para el commit de código
`7646d84e72e8719373cd095f1c757b073a56d791`.
`gh api --method POST repos/Juanmaes83/floorplan-3d/pulls --input /tmp/f3-create-pr.json`
falló: `Post "https://api.github.com/repos/Juanmaes83/floorplan-3d/pulls": Forbidden`.
Sin conector GitHub/Vercel alternativo disponible; no se intentó GraphQL.
[Rama](https://github.com/Juanmaes83/floorplan-3d/tree/feat/f3-textured-external-catalog) ·
[Crear PR hacia master](https://github.com/Juanmaes83/floorplan-3d/compare/master...feat/f3-textured-external-catalog?expand=1).

Consultas REST a `/commits/7646d84e72e8719373cd095f1c757b073a56d791/status`
y `/deployments?sha=7646d84e72e8719373cd095f1c757b073a56d791` fallaron con `Forbidden`.
La página pública del commit fue accesible, sin URL verificable de preview/check;
`https://github.com/Juanmaes83/floorplan-3d/deployments` devolvió HTTP 404.
No hay CLI/conector/binding Vercel utilizable. **URL nueva, READY, SHA desplegado,
autenticación y CI remota no verificados.** La preview histórica de PR #12 no sirve
como evidencia del nuevo código. Se solicitó la URL real para intentar su revisión;
no se inventa un dominio ni se despliega manualmente.

**Recomendación: F3 todavía incompleta.** Hay dos modelos texturizados funcionales y
regresiones locales verdes, listos para revisar, pero faltan PR, preview verificable,
revisión humana y merge. Continúan pendientes rendimiento físico y validación de
fidelidad/materiales del puf optimizado. No se cierra F3 ni se define cliente prioritario.
F2 conserva cinco sesiones y veinte planos pendientes.


## Estado final del piloto externo — PR #17 (01-10-2026)

La entrega descrita como pendiente en las secciones históricas terminó en la [PR #17](https://github.com/Juanmaes83/floorplan-3d/pull/17), aprobada por Juanma tras revisar la preview corregida y fusionada por squash.

- SHA revisado: `772e24c26d10cec4349f28558ffc87ee18748317`; merge SHA en `master`: `24534b5544ffa37840bf4fe77c4ad12afda0c38b`.
- Vercel: READY para ese SHA en https://floorplan-3d-rgf0u4thu-juanma-espinosas-projects.vercel.app/; requiere Vercel Authentication.
- Incluye SONGESAND, puf STOCKHOLM, soporte acotado de JPEG embebido, búsqueda/filtros y carga de catálogo con sesión protegida.
- Codex reportó 138/138 Node/navegador y 41/41 Python en la rama antes del merge; no se repitieron para la actualización documental.
- Schema 1.3.0 intacto; no hay soporte universal para Draco/KTX2/meshopt ni biblioteca PBR general.

F3 queda cerrada para el piloto inicial autorizado. Las ampliaciones del catálogo, el normalizador de assets y la biblioteca visual de materiales son trabajos posteriores del Roadmap 2, no criterios ocultos para reabrir este piloto. El Roadmap 2 permanece como propuesta en la PR #15 hasta su revisión y aprobación separadas. SwiftShader no acredita rendimiento móvil físico; F2 mantiene las cinco sesiones y veinte planos pendientes.
