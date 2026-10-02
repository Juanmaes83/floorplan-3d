# Candidata post-F3 — Rubik→Blender y perfiles controlados

Fecha: 02-10-2026. Base remota comprobada:
`e62d17ee62576466f937700f6c445c33b09ec9c2`, `origin/master`.
Rama revisada: `codex/rubik-blender-candidate`. **Aprobada por Juanma y fusionada mediante squash en PR #24 el 02-10-2026.**
Merge SHA: `67b7f999c42b3a2960dac6caf94ab77dcc637819`; HEAD revisado: `86c207530c8bca2ec8a04115c6483319c64582c2`.
Es una entrega técnica autorizada, no F4 ni aprobación global de Roadmap 2.

## Estado previo y alcance

PR #22 está MERGED (01-10-2026, 22:36:59Z); su merge es esa base.
Integró Legal y uso, README/roadmaps, auditoría y ajustes de tests Chromium;
no un exportador Blender. Se inspeccionaron contrato/schema 1.4.0,
`project-core`, `project-package`, `project-library`, escena Three 0.160.0,
catálogos, cargadores, normalizador F3 e informes de geometría/superficies.

La copia local nominal de floorplan-3d estaba vacía, con Git sin origin ni
commit. Se preservó intacta; se trabajó en una copia aislada del master remoto.
No se modificó ni publicó en LAB Astra, Blender MCP, Asset Lab, Immersphere o
Unreal. No se usaron planos reales, servicios nuevos, Vercel ni herramientas
instaladas para esta tarea. README no requería una corrección adicional.

## Gate A — arquitectura y significado del paquete

**PASS técnico del fixture**, no certificación de todo proyecto/asset imaginable.

[Exportador](../../scripts/interop/export.cjs), versión 1.0.0: CLI Node, sin DOM,
red, storage ni editor. Recibe el JSON guardado/exportado existente, lo clona,
valida mediante Core y calcula el mismo centro de envolvente que la app.
No modifica contrato, schema, calibración, historial ni persistencia.

Se eligió **GLB 2.0 sin extensiones + sidecar semántico**, en lugar de ejecutar
el exportador de una captura del viewport: la vista tiene cutaways, puertas
animadas, opciones y recursos asíncronos que no son el proyecto canónico.
El nuevo exportador toma la geometría durable, no esas preferencias visuales.
GLB contiene las mallas, materiales, imágenes y jerarquía; **semantic.json no
es geometría**. Sus IDs y hashes vinculan los datos al artefacto geométrico.

| Archivo | Contenido y enlace |
| --- | --- |
| `source-project.json` | Copia JSON canónica completa, con IDs/ref/calibración originales; sin binarios añadidos |
| `scene.glb` | Muros sólidos recortados, suelos triangulados, modelos autorizados o cajas de fallback explícitas, materiales/texturas |
| `semantic.json` | Correspondencia entidad→índice de nodo, fuente, transformaciones, dimensiones, refs, perfiles, atribución, pérdidas y hashes de implementación |
| `package.json` | SHA-256 y bytes de los tres anteriores; digest semántico. Su propio hash se registra externamente, sin recursión |

### Unidades, orientación y origen

- Fuente: mm, origen plan-top-left, X derecha/Y abajo, giro horario.
- Centro `(cx,cy)`: `Core.geometry(project).center`, registrado en el sidecar.
  Incluye la envolvente de habitaciones/muros y placements de imágenes; no se
  vuelve a inferir del mesh. La imagen puede influir en el centro sin exportarse.
- glTF: metros, `(X,Y,Z)=((x-cx)/1000,elevation/1000,(y-cy)/1000)`;
  yaw Y `-rotationDeg`. Convención coherente con la escena Three.
- Blender: el importador glTF realiza `(XB,YB,ZB)=(X,-Z,Y)` **una vez**;
  yaw Z `-rotationDeg`. Unidades METRIC, scale_length=1.
- Los materiales de color convierten sRGB→factor lineal glTF. Albedo usa sRGB;
  ORM/normal se mantienen lineales en el perfil PBR offline.

### Geometría, identidad y sustituciones

- Estancias: polígono interior triangulado con ear clipping, también cóncavo,
  sin inventar grosor de losa/techo. Área y bounds comprobados en Blender.
- Muros: eje + espesor simétrico + altura. División X/altura por la **unión**
  de rectángulos de huecos: incluso solapados no se restan dos veces.
- Huecos: vacíos geométricos reales y empties semánticos con ID, offset y pose.
  No se inventan hojas, marcos, vidrio ni estado de apertura. Muros demolidos
  conservan identidad/metadata, sin sólidos.
- Cada entidad canónica conserva `rubik_id`, `rubik_role`; el ensamblador
  crea colecciones por rol y añade fuente JSON, project ID y hashes de paquete.
  Fragmentos y soportes son derivados nombrados, no nuevas entidades del plano.
- Asset aprobado: bytes/hash/permiso verificados, malla original incorporada
  al GLB, normalización del catálogo, centrado y apoyo al suelo. La instancia
  se ajusta a sus dimensiones de proyecto como F3 (puede ser escala no uniforme).
  Eso **no verifica medidas de fabricante**. Referencia/revisión, dimensiones
  de catálogo y malla, ajuste, materiales y atribución quedan registrados.
- Asset no admitido: caja dimensional y motivo explícito; `assetRef` permanece.
  No se exporta el detalle procedimental de todos los genéricos de index.html.
- Altura ausente: fallback del tipo/800 mm, declarado como estimación no persistida.
- Procedural desconocido: color declarado, sin fingir haber horneado texturas.
- Imágenes originales no se copian; annotations/extensiones no interpretadas
  quedan en source-project y en lista de omisiones. Un proyecto real exportado
  aún puede contener datos privados en JSON: la prueba publicada es sintética.

### Fixture y ejecución Blender real

[Fixture original sintético](../../tests/fixtures/blender-asymmetric.synthetic.json):
dos habitaciones 6010×3730 y 2130×2450 mm, ocho muros (uno diagonal bajo y otro
demolido), cuatro tipos de hueco, tres objetos y tres materiales. Bench real
MIT: instancia 870×430×610 mm, giro 37°, elevación 120 mm. Otros giros 113°/271°.
Referencia inexistente intencional ejercita fallback. Sin imagen/datos personales;
escala estimated/template, **no acredita calibración F1b ni validación F2**.

[Determinismo ejecutado](../qa/artifacts/post-f3/determinism-release.json): dos
exportaciones independientes coinciden **byte a byte** en los cuatro ficheros,
y todo el sidecar coincide semánticamente. Se fijan input/código/catálogos y
Pillow; no se promete identidad entre distintas versiones/encoders. `.blend`
es derivado inspeccionado, no se declara binariamente determinista.

GLB final: **119196 bytes**, 49 nodos, 436 triángulos, siete materiales y un PNG
de 256×256. Hay 17 entidades canónicas; los nodos adicionales son jerarquía.

[Verificación real](../qa/artifacts/post-f3/blender-release.json): Blender
**5.2.1 LTS**, build `9e2066aef7ef`, headless/factory-startup, operador
`bpy.ops.import_scene.gltf` FINISHED. Se comprobaron 17 IDs/roles, colecciones,
áreas, unidades, yaw/origins, dimensiones no simétricas, malla de catálogo,
material IDs, imagen decodificada y huecos libres. El volumen mural también se
compara con una integración independiente de la fuente, no sólo con el sidecar.
[Escena editable](../qa/artifacts/post-f3/asymmetric-release.blend).

El verifier rechaza versiones/listas/hashes incoherentes **antes** de importar;
la prueba negativa real en Blender confirma que un GLB alterado no genera
reporte PASS ni `.blend`. Factory-startup no toca una sesión UI del propietario.
El script requiere ese modo y destinos nuevos; nunca ejecutarlo sobre una
escena de trabajo interactiva. No se ejecutó MCP ni se acredita conexión al LAB.

## Gate B — auditoría, perfiles y tanda

**PASS técnico de auditoría/perfiles/tanda de albedos**, con modelos nuevos
rechazados y sin afirmar un catálogo PBR comercial terminado.

[Auditoría rehecha](../qa/artifacts/post-f3/asset-lab-audit.json): HEAD remoto
Asset Lab confirmado `5dc7b182c5c227472b84aea66a3ffa1368c95981`. Snapshot Git
read-only: ls-tree + lectura de blobs, 134 fichas, **114 GLB versionados**, 20
ausentes y cero GLB sin ficha. Son contadores regenerados de ese árbol; no
se copiaron cifras históricas ni se afirma haber decodificado los 114 en esta
ejecución. Se inspeccionaron los bytes/hash reales de cuatro nuevos candidatos.

| Candidato adicional | Bytes originales | Decisión |
| --- | --- | --- |
| GLOSTAD sofa | 55708 | Rechazado: extensión residual y permisos específicos no conciliados |
| VITTSKÄR armchair | 2330000 | Rechazado: Draco/WebP, 18 imágenes; permisos pending |
| IDANÄS bed | 590948 | Rechazado: Draco/WebP/texture-transform; permisos pending |
| MÖRBYLÅNGA table | 299960 | Rechazado: Draco/WebP; permisos pending |

**Cero modelos nuevos publicados.** Se conserva la autorización general del
titular y la evidencia de los catorce ya integrados. No se extiende esa ficha
a candidatos nuevos con `redistributionAllowed:false` y permiso-template
pending. Ni dimensiones nulas ni bounds no decodificados se inventan. La
auditoría conserva cada hash, medida declarada, permiso/atribución y motivo.

### Perfiles versionados, no loader universal

[Definición executable](../../scripts/interop/profiles.json) e
[inspector](../../scripts/interop/glb.cjs), versión 1.0.0:

| Perfil | Entrada/salida y alcance |
| --- | --- |
| `rubik-core-glb-v1` | GLB core, triángulos, JPEG embebido; guard offline compatible con los catorce existentes |
| `rubik-blender-png-pbr-v1` | Core GLB, JPEG/PNG, baseColor + metallicRoughness + normal + AO, **sólo Blender offline** |
| `rubik-surface-png-v1` | WebP CC0 local verificado ≤256 px → RGB PNG sin pérdida adicional; no fabrica canales |
| `rubik-cc0-albedo-png-v1` | PNG albedo plano desde distribución CC0 fijada → RGB PNG, candidato offline |

Modelo: 8 MiB; ≤4 imágenes/texturas, ≤8 materiales, accessor ≤300000; JPEG/PNG
≤1 MiB/mapa y ≤2048 px, decodificado agregado ≤16 MiB. Guard geométrico offline
adicional: ≤100000 triángulos, ≤300000 vértices referenciados por primitivas y
≤16 MiB de vistas geométricas. Paquete: ≤64 MiB, ≤500000 triángulos, ≤20000
nodos, ≤100 texturas; JSON ≤10 MiB. Son límites de admisión, **no FPS/RAM móvil
medidos**. El loader F3 conserva además sus guards de mapas/memoria; no cambió.

Rechazados: extensiones, recursos externos, skins/animation/morph/sparse,
geometría no triangular; perfil PBR además no soporta emissive/height, UV≠0,
ni conversión de normals DirectX. ORM puede compartir imagen: R=AO,
G=roughness/B=metalness. No se recomprimen ni reempaquetan canales del GLB.
PNG conserva los bytes de mapas importados; un canal JPEG heredado sigue
teniendo pérdida y no se presenta como master PBR.

Normalizer F3 anterior se conserva íntegro, pin glTF Transform 4.3.0,
draco3dgltf 1.5.7 y sharp 0.34.4. **No se instaló ni ejecutó esa toolchain** en
esta nueva entrega; no se afirma normalización nueva de Draco/KTX2/meshopt.
El exporter core no necesita esos decoders. Node usado: v24.14.1; Pillow
12.3.0 se exige por código; el importador real es el de Blender 5.2.1.

### Tres superficies adicionales, honestamente albedo-only

[Catálogo candidato](../../assets/interop/surface-candidates.json), separado
de la biblioteca productiva de **50**. Fuente física fijada: Poly Haven vía
Papyszoo/CC0-Public-Domain-Textures `fcc4ff97…`; PNG plano de albedo, no imagen
de esfera/UI. Licencia CC0 del distribuidor guardada/hash y corroborada con la
licencia de assets Poly Haven ya fijada en `b1a6aa13…`. Redistribución,
modificación y uso comercial permitidos; atribución voluntaria preservada.

| Albedo | PNG origen, bytes | PNG candidato, bytes | Resolución |
| --- | --- | --- | --- |
| American walnut veneer | 84635 | 73034 | 256×256 |
| Anti skid tiles | 80254 | 67298 | 256×256 |
| Brick floor | 136453 | 116900 | 256×256 |

Total 301342 bytes fuente, **257232 bytes derivados**. No se inventan medidas
de repetición: 1000×1000 mm es valor de diseño, ajustable. Sin normal/ORM/height
reales nuevos. KTX2 de la distribución queda rechazado: sin decoder instalado
y fijado; no se descargó ni se fingió transcodificación PBR.

[Paquete de las tres superficies](../qa/artifacts/post-f3/surface-package-release/package.json)
y [prueba Blender](../qa/artifacts/post-f3/blender-surfaces-release.json): tres
PNG reales decodificados, dimensiones/geometría/IDs conservados. No son presets
nuevos del selector web: el browser anterior conserva color de fallback para
esos IDs candidatos. No se oculta esa separación.

[Diagnóstico PBR sintético](../qa/artifacts/post-f3/pbr-blender-verification.json):
PNG 2×2 originales de prueba baseColor/ORM/normal, los cuatro slots importados
y conectados, sRGB/Non-Color correctos. Demuestra decoder/node wiring, **no**
calidad visual de un material fotoreal ni una tanda PBR de terceros.

## Reproducción sin setup adicional

Desde raíz, checkout LF para respetar hashes de permiso/código. Usar Node 24,
Pillow 12.3.0 y Blender instalado; PYTHON/BLENDER son rutas de la máquina.
Destinos siempre **nuevos**; los scripts rechazan overwrites.

```powershell
node scripts/interop/export.cjs tests/fixtures/blender-asymmetric.synthetic.json tmp/export-a $env:INTEROP_PYTHON
node scripts/interop/export.cjs tests/fixtures/blender-asymmetric.synthetic.json tmp/export-b $env:INTEROP_PYTHON
node scripts/interop/compare.cjs tmp/export-a tmp/export-b tmp/determinism.json
& $env:BLENDER_EXE --background --factory-startup --python-exit-code 1 --python scripts/interop/blender-verify.py -- tmp/export-a tmp/blender-check.json tmp/asymmetric.blend
node scripts/interop/candidate-proof.cjs tmp/surface-export $env:INTEROP_PYTHON
node scripts/interop/validate.cjs $env:INTEROP_PYTHON tmp/validation.json
```

Para reauditar: `node scripts/interop/audit-asset-lab.cjs <bare-snapshot> <new-report>`.
Para reproducir la tanda: `node scripts/interop/prepare-surface-candidates.cjs
<CC0-bare-snapshot> <python>` en checkout sin los outputs candidatos todavía;
rechaza sobreescritura. Los originales sólo se leen por Git show al commit fijado.

## Pruebas, incidencias y cierre

Resultados finales y comandos exactos: [validación](../qa/artifacts/post-f3/validation-delivery.json).
Ejecutados: **125/125 casos Node**, **18/18 casos Chromium** (regresión
desktop/touch) y **31/31 casos Python**. Validación documental y diff sin
errores; el oráculo Python jsonschema ausente se distingue abajo.
Fixture/schema/runtime, ejes/IDs, repeat export, hashes, error/cancelación,
persistencia JSON/ZIP, perfiles adversos, cargas/fallback y regresiones existentes.
No se cambió UI; no hay nuevo recorrido de exportador web ni preview cloud que
certificar. Las regresiones de interfaz existentes sí incluyen emulación móvil.

Incidencias corregidas: CRLF automático en la copia Windows invalidó hashes
de permisos; se restauraron bytes LF de Git sin cambiar contenido. Un índice
bufferView desplazado al fusionar GLB produjo un error real de importación;
se corrigió el remapping y se añadió test de todos los índices/vertices.
El sandbox ocultó la ruta de Chromium; se ejecutó el mismo binario instalado
con permiso de proceso, sin reinstalar ni cambiar red/TLS. Tests Python
históricos invocan `python3`: un wrapper **sólo de test** lo resuelve al
Python instalado; no modifica tests, producto ni PATH global.

`.gitattributes` fija LF únicamente para código/metadata y permisos hashados de
esta interoperabilidad, y preserva binarios. No es un refactor general: evita
que otro checkout Windows invalide permisos o revisiones de catálogo por CRLF.
También se reabrió el `.blend` en un proceso nuevo: [reporte](../qa/artifacts/post-f3/blend-reopen.json),
17 entidades, unidades métricas e imágenes empaquetadas conservadas.

`tests/schema.test.py` no ejecutado: jsonschema ausente en Python disponible;
no se instaló. Sí se ejecutó la validación real Core y igualdad schema/copia JS;
no hay cambio de contrato. No se declara ese oráculo independiente como PASS.

Los primeros paquetes/ensayos quedan preservados localmente; sólo los finales
enlazados aquí son evidencia de la candidata. Las capturas históricas generadas
por regresiones no se mezclan con la nueva entrega ni sustituyen su evidencia.

Cierre humano: Juanma revisó y aprobó las escenas y albedos el 02-10-2026.
La revisión acepta el alcance y los límites/fallback de esta entrega. Siguen
pendientes permisos específicos para futuros modelos, sets PBR reales y presupuesto móvil.
Cinco sesiones/veinte planos y umbrales F2 siguen pendientes para validación
empírica final, sin bloquear esta candidata. No conecta automáticamente LAB,
CRM/Unreal/Immersphere ni autoriza nuevas fases. **ESTADO: INTEGRADO POR PR #24; no equivale a F4 ni a validación empírica F2.**
