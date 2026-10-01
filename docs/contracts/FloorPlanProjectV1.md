# FloorPlanProjectV1 — contrato de proyecto de plano

**Estado:** contrato implementado. La base F1a/F1b está aprobada e integrada en `master` (PR #4/#5/#6). La ampliación 1.2.0 con WebP estático quedó integrada por PR #7 (`c28a170`). La ampliación compatible 1.3.0 de catálogo local F3 quedó integrada por PR #12 (merge `95fcf0d`). Esta rama añade la ampliación opcional compatible 1.4.0 de superficies, pendiente de revisión humana. Las decisiones de producto F0 que sigan abiertas permanecen pendientes: la implementación del schema no implica su aprobación.
**Fecha:** 30-09-2026 · **Base integrada de esta revisión:** `master` @ `d644665`. **Referencias históricas de la auditoría F0:** `master` @ `a03136c` y PR #1 @ `540b825`. Numeración y estados actuales: [roadmap canónico](../ROADMAP.md).
**Artefactos:** [`FloorPlanProjectV1.schema.json`](FloorPlanProjectV1.schema.json) · [ejemplo válido](examples/floorplan-project-v1.example.json) · [ejemplo inválido](examples/floorplan-project-v1.invalid.example.json)

## 1. Para qué sirve y qué no hace

Es el formato durable y portable de **un** plano editable: la geometría (muros, huecos, estancias), la escala y su calibración, los acabados, los muebles y la referencia a la imagen original. No depende de la interfaz: sirve igual para el editor actual, para una importación futura y para un adaptador hacia CRM o Immersphere.

No incluye (a propósito, porque nada de esto está aprobado): cuentas, permisos, tenant, precios, presupuestos, licencias, leads, plantas múltiples, techos inclinados ni muros curvos.

### Contexto histórico: lo que guardaba la app antes de F1a (auditoría F0)

| Aspecto | Auditoría histórica (`index.html` @ `a03136c`) | Problema para un proyecto portable |
|---|---|---|
| Geometría | Constantes `WALLS`, `WINS`, `DOORS`, `SLIDES`, `ROOMS` en el código (l. 385-448) | El JSON exportado **no contiene muros ni estancias**. Solo existe una vivienda. |
| Estado guardado | `{furniture, rooms:{id:{name,mat}}, demolished:['w<índice>'], measures:[{a,b}]}` en `localStorage['huxing-design-v1']` (l. 529-562) | Sin versión ni tipo. Un muro se identifica por su **posición en el array**: si se edita la lista, cambian las referencias. |
| Importación | Acepta cualquier JSON con `furniture` como array (l. 1466-1472) | No valida versión, tipos ni referencias. |
| IDs de mueble | `'f' + Date.now().toString(36) + contador` (l. 493) | Se regeneran al restaurar el ejemplo. |
| Materiales | `MATS` con precio en ¥/m² (l. 450-459) | Precio en yuanes sin fuente verificada. |

## 2. Identidad

- Cada entidad lleva un `id` con prefijo de tipo: `prj_`, `wal_`, `opn_`, `rom_`, `mat_`, `obj_`, `img_`, `msr_`, seguido de un sufijo de 3 a 64 caracteres `[A-Za-z0-9_-]` que empieza por letra o dígito.
- **Creación:** el ID se genera **una sola vez**, al crear la entidad. Recomendación: ULID o `crypto.randomUUID()` sin guiones. Las plantillas pueden usar IDs deterministas legibles (por ejemplo `wal_ref-w12`).
- **Prohibido regenerar** IDs al editar, mover, guardar, exportar, importar o migrar. Mover un muro no cambia su ID. Borrar una entidad no libera su ID dentro del proyecto.
- **Duplicar un proyecto** genera un `prj_` nuevo. Los IDs hijos pueden conservarse, porque solo tienen que ser únicos dentro del proyecto.
- **Unicidad:** los IDs son únicos en todo el documento, no solo dentro de su lista (regla S1).

## 3. Versiones, compatibilidad y migración

- `schema` = `"rubik-sota.floorplan-project"` identifica el tipo de fichero. `schemaVersion` sigue SemVer, y este esquema acepta solo `1.x.y`.
- **Minor (1.1, 1.2…):** solo añade campos opcionales o valores de enum nuevos que se puedan ignorar sin perder información. **Patch:** aclaraciones sin cambio estructural.
- **Major (2.0):** cualquier cambio que rompa la compatibilidad. Requiere un migrador explícito `vN → vN+1`.
- **Lector que recibe una versión:**

| Caso | Comportamiento |
|---|---|
| Sin `schema` y con `furniture` como array | Estado heredado `huxing-design-v1`: se migra con el migrador heredado (ver abajo). |
| `schema` distinto o ausente sin `furniture` | Se rechaza con el mensaje «no es un proyecto». |
| Major desconocido (≥ 2 para un lector v1) | Se rechaza sin modificar nada. Se ofrece conservar el fichero original. |
| Misma major y minor superior a la del lector | Se abre avisando de que es más nuevo. Al guardar se **conservan** los campos desconocidos o se ofrece «guardar como copia»; nunca se descartan en silencio. |
| Misma major y minor igual o inferior | Se carga normalmente. |

- **Migrador heredado (implementado en F1a):** la geometría sale de la plantilla de referencia con IDs deterministas (`wal_ref-w<índice>` según el orden actual de `WALLS`). `demolished:['w12']` pasa a `status:"demolished"` en `wal_ref-w12`. Las estancias toman como ID `rom_<id actual>`. Los muebles conservan su ID con prefijo (`f…` → `obj_f…`), y los campos cambian así: `cx,cy` → `position`, `w,d` → `size`, `rot` → `rotationDeg`. `MATS` pasa a `mat_<clave>` **sin precio**, y `measures` a `measurements` con ID nuevo. La escala de la plantilla queda como `confidence:"estimated"`, `method:"template"`, porque las cotas proceden de un plano original que no está en el repo.
- **Riesgo conocido:** la clave histórica es `localStorage['huxing-design-v1']`. El migrador F1a es idempotente y conserva la clave antigua al guardar el proyecto nuevo.

## 4. Geometría y medidas

- **Unidad canónica:** milímetros (`units:"mm"`).
- **Coordenadas en planta:** enteros (`integer`) en ±1 000 000 mm. Se redondea al mm más cercano con `Math.round`, **solo al escribir**. Los cálculos intermedios (calibración, rotaciones) pueden ser decimales. Los píxeles de imagen (`pixelPoint`) y `mmPerPixel` sí son decimales.
- **Ejes:** origen `plan-top-left`, **x a la derecha, y hacia abajo**, igual que el SVG actual. En 3D: `mundo.x = (x − cx)/1000`, `mundo.z = (y − cy)/1000`, `mundo.y` = altura. La implementación actual calcula el centro a partir de la envolvente en `js/project-core.js`; el centro fijo `OX=6000, OY=5300` corresponde a la auditoría histórica.
- **Rotación:** grados enteros `0–359`, **positivo en sentido horario** en planta (con y hacia abajo). En 3D equivale a `rotation.y = −rotationDeg·π/180`, igual que hoy (l. 2259).
- **Escala** (`scale`):
  - `confidence`: `real` (calibrada con una dimensión conocida y confirmada), `estimated` (plantilla, escala declarada o cota no confirmada) o `pending` (sin calibrar).
  - `method`: `known-dimension`, `declared-ratio`, `template` o `none`.
  - `calibration`: dos puntos en píxeles de la imagen original, la longitud real `knownLengthMm` y `mmPerPixel = knownLengthMm / |AB|`, que se guarda para auditoría y se comprueba con una tolerancia del 0,1 % (S6).
  - Coherencia, impuesta por el esquema: `real` exige `known-dimension` y `calibration`; `pending` ⇔ `none`.
  - `declaredRatio` (por ejemplo `1:100`) es solo informativo, porque una imagen escaneada o fotografiada no conserva esa escala.
- **Estancias:** **polígono simple explícito** por las caras interiores, sin repetir el primer vértice, e independiente de los muros. `countsTowardArea:false` sirve para miradores y huecos, como hoy con `counted:false`.
- **Muros:** segmento de **eje** `start → end` con `thicknessMm` simétrico y `heightMm` propio (la app hoy usa 2,8 m global). `structure` es una etiqueta declarada, **no un dictamen técnico**. `status`: `existing`, `demolished` o `new`.
- **Huecos:** siempre vinculados a un `wallId`, con `offsetMm` medido desde `wall.start` por el eje hasta el borde del hueco, más `widthMm`, `heightMm` y `sillHeightMm`. Las puertas llevan `swing` opcional: extremo de la bisagra y lado de apertura mirando de start a end.
- **Procedencia:** `source.method` puede ser `template`, `manual`, `imported` o `suggested` (este último experimental, para F2). `source.review` puede ser `unreviewed` o `confirmed`. Nada `suggested` o `unreviewed` debe presentarse como medida confirmada.

### Por qué polígono de estancia + muros por eje (y no un grafo topológico) para el MVP

1. **Coincide con lo que existe:** la app ya separa `ROOMS` (polígonos) de `WALLS` (rectángulos). La migración es mecánica: el lado largo del rectángulo da el eje y el corto el grosor.
2. **Coincide con el flujo manual de F1:** trazar una estancia pulsando esquinas y trazar un muro con dos clics son operaciones independientes y fáciles de corregir.
3. **Áreas fiables y sencillas:** la superficie se calcula directamente del polígono con la fórmula del área de Gauss, como hoy (l. 572).
4. **Coste aceptado:** estancias y muros pueden no coincidir. Eso se detecta con un **aviso** (W2), no con un error, y se resuelve con la revisión humana. Un modelo topológico (nodos compartidos, semiaristas) se puede introducir en una v2 si F1–F2 demuestran que hace falta.

## 5. Materiales, objetos e imagen fuente

- **Materiales:** se referencian por `floorMaterialId`, con `appearance.color` y un `preset` procedimental opcional. **Sin binarios, texturas incrustadas ni precio.**
- **Objetos:** `type` genérico, `name`, `position` (centro de la huella), `rotationDeg`, `size.widthMm` y `size.depthMm` obligatorios, `heightMm` y `elevationMm` opcionales, `roomId` y `color` opcionales.
- **`assetRef` (experimental, F3):** contiene `catalog`, `assetId` y `catalogRevision`. Solo es un puntero: **no afirma que el fichero exista, que la licencia cubra el uso ni ningún precio**. Esas comprobaciones pertenecen al catálogo (ver auditoría de Asset Lab). Si el asset no está disponible o no está autorizado, la app dibuja el `type` genérico con el mismo `size`.
- **Imagen original (`sourceImages[]`):** es una **referencia externa**. Lleva `id`, `mediaType` (PNG o JPEG; desde 1.2.0 también WebP estático), tamaño en px, `sha256` y `storage.kind`, que puede ser `local-browser`, `sidecar-file` o `remote` (este último experimental, sujeto a D-06 y D-08). `storage.ref` prohíbe `blob:` y `data:`. Tampoco se deben usar URLs firmadas temporales. **La identidad del recurso es `id` + `sha256`, no la URL.**
- **Separación de datos:** la geometría (muros, estancias) vive en mm y es la fuente de verdad. El origen visual (`placement`: cómo se superpone la imagen en mm) y el recurso (`storage`: dónde están los bytes) son independientes. Se puede quitar la imagen sin perder la geometría.
- **`originalFileName`** puede contener una dirección o un nombre de persona, así que se trata como dato potencialmente personal (D-08).

## 6. Reglas de validación

Las reglas **E** se comprueban con JSON Schema. Las **S** son semánticas y las debe aplicar el código de la app, porque JSON Schema no puede expresarlas. Las **W** son avisos que no bloquean.

| Regla | Tipo | Qué comprueba |
|---|---|---|
| E1 | Esquema | Tipos, obligatorios, `additionalProperties:false`, enums, rangos y patrones de ID. |
| E2 | Esquema | Coherencia `scale.confidence` ↔ `method` ↔ `calibration`. |
| E3 | Esquema | Sin precio en materiales; imagen PNG/JPEG y, desde 1.2.0, WebP estático; `storage.ref` sin `blob:`/`data:`. |
| S1 | Error | Todos los `id` son únicos en el documento. |
| S2 | Error | Toda referencia existe: `opening.wallId`, `room.floorMaterialId`, `object.roomId`, `calibration.sourceImageId`. |
| S3 | Error | Muro de longitud ≥ 1 mm (`start ≠ end`). |
| S4 | Error | Hueco dentro del muro (`offsetMm + widthMm ≤ longitud`), `sill + height ≤ wall.heightMm`, y `swing` solo en `door`. |
| S5 | Error | Polígono de estancia con área > 0 y **sin autointersecciones** (validado en la app; el script histórico del Anexo A solo comprobaba el área). |
| S6 | Error | `mmPerPixel` coincide con `knownLengthMm/\|AB\|` (±0,1 %). |
| S7 | Error | `updatedAt ≥ createdAt`. |
| W1 | Aviso | Geometría con `review:"unreviewed"` o `method:"suggested"`. |
| W2 | Aviso | Estancia cuyo contorno no queda a ≤ grosor/2 + 20 mm de algún muro (implementado en F1b). |
| W3 | Aviso | Objeto fuera de su `roomId` o solapado con un muro (implementado en F1b). |
| W4 | Aviso | `scale.confidence ≠ "real"`: la UI debe mostrar las medidas como aproximadas. |

## 7. Obligatorio, opcional y experimental

| Campo | Estado |
|---|---|
| `schema`, `schemaVersion`, `id`, `name`, `createdAt`, `updatedAt`, `units`, `coordinateSystem`, `scale`, `defaults`, `walls`, `openings`, `rooms`, `materials`, `objects` | **Obligatorio** (las listas pueden estar vacías) |
| `sourceImages`, `measurements`, `app`, `labelAt`, `swing`, `isEntrance`, `size.heightMm`, `elevationMm`, `color`, `roomId`, `source` | Opcional |
| `assetRef`, `source.method:"suggested"`, `storage.kind:"remote"`, `extensions` (`x-*`) | **Experimental**: puede cambiar en un minor y los lectores deben tolerar su ausencia |

## 8. Ejemplos

**Válido:** [`examples/floorplan-project-v1.example.json`](examples/floorplan-project-v1.example.json). Es un estudio ficticio de 6 × 4 m con 6 muros, 3 huecos, 2 estancias, 2 materiales, 3 objetos, una medida y una imagen calibrada. El `sha256` y el `assetId` son **ilustrativos**: no apuntan a ficheros reales. Resultado: esquema válido, semántica OK y un aviso W1 intencionado (`wal_bath-south` sin revisar).

**Inválido:** [`examples/floorplan-project-v1.invalid.example.json`](examples/floorplan-project-v1.invalid.example.json). Salida observada el 30-09-2026:

```text
JSON Schema: INVÁLIDO (14 errores)
  /units const: must be equal to constant ("mm")
  /scale required: must have required property 'calibration'        ← "real" sin calibración
  /scale/method const: must be equal to constant ("known-dimension")
  /scale if: must match "then" schema
  /sourceImages/0/mediaType enum                                       ← PDF sigue fuera de V1
  /sourceImages/0/storage/ref pattern "^(?!blob:)(?!data:)"            ← URL temporal
  /walls/0 required: 'thicknessMm'
  /walls/0/id pattern                                                  ← sufijo "a" demasiado corto
  /walls/0/end/x type: must be integer                                 ← 4000.5 mm
  /walls/1/id pattern
  /rooms/0/id pattern
  /rooms/0/polygon minItems: must NOT have fewer than 3 items
  /materials/0 additionalProperties [price]                            ← precio no permitido
  /objects/0/rotationDeg maximum: must be <= 359
Semántica: ERRORES 4
  S1 id duplicado obj_sofa
  S3 muro de longitud 0 wal_b
  S2 hueco opn_door -> muro inexistente wal_missing
  S5 estancia rom_a área 0
```

### Cómo se validó (y cómo reproducirlo)

El repo **no tiene** `package.json`, validador ni dependencias (comprobado: solo `index.html`, `README.md` y `.gitignore`). Para no añadir dependencias al producto, la validación se ejecutó con Ajv instalado en un **directorio temporal fuera del repo**:

```bash
mkdir /tmp/fp-validate && cd /tmp/fp-validate
npm init -y && npm i ajv@8 ajv-formats@3        # ejecutado: ajv 8.20.0, ajv-formats 3.0.1
# guardar como validate.mjs el script del Anexo A
node validate.mjs <repo>/docs/contracts/FloorPlanProjectV1.schema.json \
  <repo>/docs/contracts/examples/floorplan-project-v1.example.json \
  <repo>/docs/contracts/examples/floorplan-project-v1.invalid.example.json
```

**Ejecución histórica de F0, no instrucciones del validador actual.** Configuración: `new Ajv2020({allErrors:true, strict:true, strictRequired:false})`. Se desactiva `strictRequired` porque los `if/then` de `scale` declaran `required` sin repetir `properties`, algo válido en JSON Schema que el modo estricto de Ajv rechaza por prudencia. Las reglas S se comprobaron con un script ad hoc (Anexo A). En aquella ejecución ad hoc no estaban implementadas S5 (autointersección) ni W2–W4. Actualmente S5 y la migración están en `js/project-core.js`, y W1–W4 en `js/tracing-core.js`, con pruebas del repositorio. Véase [changelog](CHANGELOG.md) para las ampliaciones 1.1.0 y 1.2.0.

## 9. Riesgos conocidos y decisiones pendientes

| # | Riesgo o decisión | Propuesta provisional |
|---|---|---|
| C-1 | Coordenadas enteras en mm: pierden < 0,5 mm por punto | Aceptable para visualización. Revisar si alguien exige precisión submilimétrica. |
| C-2 | Estancias y muros pueden no coincidir | W2 más revisión humana. Modelo topológico solo en v2 si hace falta. |
| C-3 | Muros solo rectos y de altura uniforme | Suficiente para vivienda residencial típica. Curvos e inclinados, fuera de V1. |
| C-4 | Una sola planta por proyecto | Varias plantas = varios proyectos o un `levels[]` en v1.x (decisión aplazable). |
| C-5 | `extensions` puede usarse como cajón de sastre | Solo `x-*` y revisión en PR. Lo que se consolide pasa al esquema en un minor. |
| C-6 | `sourceImages[].storage` sin decisión de hosting ni privacidad | Mantener `local-browser` y `sidecar-file` en F1. `remote` bloqueado hasta D-06 y D-08. |
| C-7 | Formato del paquete exportado (JSON + imagen) | ZIP local implementado en F1b con `project.json` + `images/`. No se declara aprobada formalmente D-09 por esta implementación. |
| C-8 | `structure:"load-bearing"` puede leerse como dato técnico | La UI debe mostrarlo como etiqueta orientativa, nunca como dictamen. |

## Anexo A — script histórico de validación F0 (fuera del repo)

```js
// validate.mjs — Ajv 2020 + reglas semánticas S1–S4, S5 (solo área), S6, S7 y aviso W1
import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
const [schemaPath, ...files] = process.argv.slice(2);
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false }); addFormats(ajv);
const validate = ajv.compile(JSON.parse(fs.readFileSync(schemaPath, 'utf8')));
function semantic(p) {
  const e = [], w = [], ids = new Map();
  for (const k of ['walls', 'openings', 'rooms', 'materials', 'objects', 'measurements', 'sourceImages'])
    for (const x of p[k] || []) { if (ids.has(x.id)) e.push(`S1 id duplicado ${x.id}`); ids.set(x.id, k); }
  const has = (id, k) => ids.get(id) === k;
  const walls = new Map((p.walls || []).map(x => [x.id, x]));
  for (const x of p.walls || []) if (Math.hypot(x.end.x - x.start.x, x.end.y - x.start.y) < 1) e.push(`S3 muro de longitud 0 ${x.id}`);
  for (const o of p.openings || []) {
    const wl = walls.get(o.wallId); if (!wl) { e.push(`S2 hueco ${o.id} -> muro inexistente ${o.wallId}`); continue; }
    const L = Math.hypot(wl.end.x - wl.start.x, wl.end.y - wl.start.y);
    if (o.offsetMm + o.widthMm > L) e.push(`S4 hueco ${o.id} se sale del muro`);
    if (o.sillHeightMm + o.heightMm > wl.heightMm) e.push(`S4 hueco ${o.id} más alto que el muro`);
    if (o.swing && o.kind !== 'door') e.push(`S4 swing solo para door (${o.id})`);
  }
  for (const r of p.rooms || []) {
    if (!has(r.floorMaterialId, 'materials')) e.push(`S2 estancia ${r.id} -> material inexistente`);
    const A = Math.abs(r.polygon.reduce((a, q, i) => { const n = r.polygon[(i + 1) % r.polygon.length]; return a + q.x * n.y - n.x * q.y; }, 0)) / 2;
    if (!(A > 0)) e.push(`S5 estancia ${r.id} área 0`);
  }
  for (const o of p.objects || []) if (o.roomId && !has(o.roomId, 'rooms')) e.push(`S2 objeto ${o.id} -> estancia inexistente`);
  const c = p.scale?.calibration;
  if (c) {
    if (!has(c.sourceImageId, 'sourceImages')) e.push('S2 calibración -> imagen inexistente');
    const mpp = c.knownLengthMm / Math.hypot(c.pointB.x - c.pointA.x, c.pointB.y - c.pointA.y);
    if (Math.abs(mpp - c.mmPerPixel) / mpp > 0.001) e.push(`S6 mmPerPixel ${c.mmPerPixel} != ${mpp.toFixed(6)}`);
  }
  if (Date.parse(p.updatedAt) < Date.parse(p.createdAt)) e.push('S7 updatedAt < createdAt');
  for (const x of p.walls || []) if (x.source?.review === 'unreviewed') w.push(`W1 muro sin revisar ${x.id}`);
  return { e, w };
}
for (const f of files) {
  const p = JSON.parse(fs.readFileSync(f, 'utf8'));
  const ok = validate(p);
  console.log(`\n== ${f}\nJSON Schema: ${ok ? 'VÁLIDO' : 'INVÁLIDO (' + validate.errors.length + ' errores)'}`);
  if (!ok) for (const x of validate.errors) console.log(`  ${x.instancePath || '/'} ${x.keyword}: ${x.message}`);
  const s = semantic(p);
  console.log(`Semántica: ${s.e.length ? 'ERRORES ' + s.e.length : 'OK'}${s.w.length ? ' · avisos ' + s.w.length : ''}`);
  [...s.e, ...s.w].forEach(x => console.log('  ' + x));
}
```

## Extensión opcional F1b (V1.1)

El [changelog](CHANGELOG.md) documenta `scale.verification` y
`sourceImages[].opacity`, sus validaciones y la compatibilidad con V1 anteriores.
El [ejemplo sintético F1b](examples/floorplan-project-v1.f1b.example.json) registra
la segunda cota sin incrustar binarios. Su imagen procede del fixture propio
`tests/fixtures/manual-plan.png`; el ZIP sitúa esos bytes en `images/img_synthetic.png`.

La app implementa ahora W1–W4: W2 cubre el contorno completo por la unión de tramos
a distancia ≤ grosor/2 + 20 mm de muros activos; W3 utiliza la huella orientada del
objeto, su estancia asignada y sólidos de muros descontando huecos. Ningún aviso
bloquea por sí solo. La propuesta/script ad hoc históricos anteriores se conservan
como evidencia de F0, no como descripción del código actual.


## Uso experimental de procedencia en esta rama F2

Sin cambios al schema 1.2.0 ni migración: el prototipo usa los enums existentes.
Los candidatos viven solo en memoria, fuera del proyecto/JSON/ZIP. Al aceptar o
corregir explícitamente se crea un muro F1b con ID estable y
`source:{method:"suggested",review:"confirmed"}`. Confirmar registra revisión
humana de ese segmento, no exactitud dimensional ni confirmación de escala.
La edición posterior conserva `method:"suggested"` y vuelve a `unreviewed`
hasta nueva confirmación. W1 sigue señalando el origen experimental incluso
después de revisarlo. [Informe](../technical/F2-wall-assist.md).


## Ampliación F3 1.3.0 — catálogo local opcional (integrada por PR #12)

`assetRef` ya existía antes de F3; no hay un nuevo campo ni migración obligatoria.
El enum `catalog` añade `rubik-sota-local` junto a `immersphere-asset-lab`.
Al asociar el modelo local se escribe `schemaVersion:1.3.0`. Proyectos anteriores
mantienen su versión y sus campos ausentes hasta una edición explícita.
Lectores anteriores pueden rechazar el nuevo enum; exportar una copia genérica
quitando explícitamente la asociación permite interoperar sin perder geometría.

Para Asset Lab, `catalogRevision` conserva el significado de commit Git del
manifest. Para el catálogo local son los primeros 40 hex del SHA-256 de los bytes
UTF-8 del manifest servido; identifica su contenido, no se presenta como commit.
El nuevo flujo lo guarda. Una referencia sin revisión, tolerada desde V1.0, solo
se resuelve por ID conocido en el catálogo autorizado actual. Una revisión
incompatible o ID desconocido produce fallback, sin borrar el puntero original.
La revisión es una identidad, no evidencia de derechos. El cargador verifica
los bytes del documento de permiso y del GLB antes de parsear el modelo.

Asignar/quitar `assetRef` conserva todos los demás campos del objeto. Altura ya
opcional: los muebles nuevos de la biblioteca guardan su altura de diseño; los
anteriores no se rellenan al abrir. Si no hay altura, el asset usa la altura
observable de su genérico, sin persistir una estimación. JSON guarda solo el
puntero; ZIP sigue transportando imágenes de planos, sin empaquetar assets 3D.
Los materiales originales de aquella entrega eran procedimentales/color, sin precio ni catálogo externo. [Ejemplo local](examples/floorplan-project-v1.f3.example.json).

## Ampliación de superficies 1.4.0 — pendiente de revisión de esta entrega

Se conservan los proyectos 1.0–1.3 sin rellenar campos al abrirlos. Aplicar un
acabado nuevo eleva a 1.4.0 únicamente las versiones anteriores; conserva futuras
versiones V1 y los metadatos desconocidos. No cambia geometría ni calibración.

- `walls[].surfaceMaterialId`: referencia **opcional** a un material `category:wall`.
  Se aplica a toda la pared y ambas caras, incluidos los tramos junto a huecos.
  En una pared compartida afecta a ambas estancias; la interfaz lo advierte.
  Ausente mantiene el acabado original. No representa acabados independientes por cara.
- `materials[].appearance.preset`: admite también el ID estable de la biblioteca
  local `surface-*`; licencia, origen y archivos se verifican en el catálogo separado.
- `materials[].appearance.repeatMm:{x,y}`: ampliación opcional, enteros 100–10000 mm,
  repetición de diseño horizontal/vertical. No son dimensiones físicas publicadas
  del producto. Si cambia la escala de una asignación compartida se crea otro
  material para conservar las asignaciones anteriores.
- Suelo conserva `rooms[].floorMaterialId`. JSON/ZIP transportan referencias y
  fallback de color, sin mapas ni base64. El receptor necesita la misma biblioteca;
  IDs desconocidos muestran aviso y color seguro. Los lectores anteriores que
  conservan campos V1 desconocidos siguen pudiendo presentar su fallback de color.

Regla semántica nueva: `surfaceMaterialId` debe existir en `materials` y ser mural.
La clasificación histórica de un material de suelo no se restringe retroactivamente.
[Ejemplo portable](examples/floorplan-project-v1.surfaces.example.json) e
[inventario y pruebas](../technical/surface-material-library.md).
