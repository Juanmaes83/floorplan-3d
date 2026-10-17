# Gate 0 del contrato multipiso: «dos plantas y una escalera recta» (17-10-2026)

**Estado: solicitud de decisión a Juanma. No aprueba el contrato ni una fase, no contiene código y no modifica `FloorPlanProjectV1`, su schema, la UI ni el importador.** D-16 sigue «en estudio; implementación no aprobada» ([F0-decisions](../product/F0-decisions.md)).

**Contexto:**

- **D-01**, integrada por #49 (`5c822cf`): público prioritario de inmobiliarias, promotoras y estudios de arquitectura; segundo público de reformas e interiorismo; problema prioritario, preparar y presentar viviendas completas.
- **Estudio LoRA LAB #48**, en borrador: recomienda provisionalmente este corte. Falta su prueba directa (anexo A) y esta decisión de contrato.
- Rubik sigue siendo una herramienta de **propuesta y comunicación**: nada de lo que sigue implica precisión profesional, documentación técnica, BIM ni cumplimiento normativo.

**Base:** `master` `5c822cf`.

## 1. Qué pasa hoy si un archivo trae varias plantas

Todos los consumidores pasan por el mismo validador, `FloorPlanCore.validate` (`js/project-core.js`):

- la app;
- el MCP local (`tools/rubik-mcp/src/core.cjs`);
- el exportador Blender #24 y el piloto #42 (`scripts/interop/export.cjs`, `scripts/offline-pilot/`).

Ese validador trata **cualquier `1.x` distinto de `1.0.0`** como versión futura: conserva los campos desconocidos y sólo avisa. Prueba ejecutada sobre el ejemplo del contrato (script en el [anexo B](#anexo-b-sonda-reproducible)):

| Documento | Resultado de `FloorPlanCore.validate` en `5c822cf` |
| --- | --- |
| Ejemplo 1.x | Aceptado |
| `1.5.0` con `levels[]` y `walls[].levelId` | **Aceptado**, con sólo el aviso «Newer V1 version: unknown fields are retained» |
| `1.4.0` con `extensions["x-levels"]` | **Aceptado**, con el mismo aviso |
| `2.0.0` | Rechazado: `/schemaVersion: unsupported version` |
| Documento con otro `schema` (contenedor de edificio) | Rechazado: `/: missing id` |

**Consecuencia:** la sonda demuestra que el validador actual **no rechaza** datos de nivel añadidos a 1.x. Si un consumidor usa su geometría sin interpretar esos campos, puede tratar muros de plantas distintas como una sola planta y producir resultados engañosos. La sonda no prueba por sí sola la salida visual de todos los consumidores; esa regresión se comprobará por consumidor en el primer corte. La §3 del contrato exige que un minor se pueda ignorar sin perder información, y aquí no se cumple. Por eso se descartan las opciones multipiso dentro de 1.x.

## 2. Opciones

| | Opción | Cómo representa las plantas | A favor | En contra |
| --- | --- | --- | --- | --- |
| A | **`FloorPlanProject` 2.0** (la propuesta provisional de #48) | Un solo documento, con `levels[]` y `levelId` en muros, estancias, objetos y cotas; `stairs[]`. | Un único espacio de IDs y sistema de coordenadas; guardado atómico; materiales compartidos. IFC multiplanta encaja directamente. | **`scale` y la calibración son únicas por proyecto.** Una inmobiliaria suele partir de una imagen por planta, cada una con su propia escala, así que habría que trasladar escala, calibración y colocación de imagen a cada nivel: es la parte más delicada del contrato. Además, **todos** los consumidores necesitan filtrar por `levelId`, y la major del contrato principal sube. |
| B | 1.5 con `levels[]` opcional | Como A, dentro de 1.x | — | **Descartada:** se acepta en silencio y superpone plantas (§1). |
| C | Varios proyectos 1.x enlazados por referencia | Archivos sueltos que se apuntan entre sí | Sin schema nuevo | Integridad frágil: archivo ausente, revisión desfasada, sin guardado atómico. La escalera queda entre archivos. Ningún lector actual rechaza un archivo suelto de planta alta, que se presentaría como vivienda completa. |
| D | **Contenedor de edificio** `rubik-sota.floorplan-building` 1.0.0 que **incrusta** un `FloorPlanProjectV1` 1.x completo por planta, más los datos del edificio (niveles, desplazamientos, escaleras) | Cada planta es un proyecto 1.x válido. El contenedor fija elevación y desplazamiento de cada una y las escaleras entre ellas. | **No cambia `FloorPlanProjectV1` ni su validador.** Escala, calibración e imagen por planta salen gratis. Exportar una planta es entregar su proyecto tal cual. Los lectores actuales rechazan el contenedor de forma explícita (§1). Los consumidores siguen funcionando por planta sin cambios. | Dos schemas que mantener. Las referencias entre plantas necesitan cualificarse (`levelId` + ID interno). Los materiales se duplican por planta. Hay riesgo de desalinear plantas si el desplazamiento está mal: mitigable con la vista de referencia y un aviso. |
| E | `extensions` en 1.x | Datos de nivel en `x-*` | — | **Descartada:** igual que B (§1). |

### Condiciones que debe resolver D antes de aprobar el contrato

1. **Perfil de los proyectos incrustados.** No basta con que `FloorPlanCore.validate` acepte un 1.x futuro: por compatibilidad puede conservar campos desconocidos. El contrato de edificio debe fijar las versiones 1.x admitidas y rechazar o aislar cualquier campo/extensión que intente expresar otros niveles dentro de un proyecto de planta. Probar un proyecto incrustado que trae `levels[]` o `levelId` para impedir doble interpretación.
2. **Imágenes y ZIP.** Deduplicar por SHA no define cómo resolver `sourceImages[].storage.ref` de cada planta. Especificar un manifiesto que relacione `levelId`, `sourceImageId`, hash y entrada ZIP, sin cambiar silenciosamente los proyectos incrustados; verificar colisiones de ID/nombre, ausencia de imagen, límites de tamaño y exportación de una planta con sus bytes de imagen.
3. **Identidad y ciclo de vida.** La biblioteca y las variantes deben guardar, duplicar, importar y borrar el edificio como unidad sin perder la pertenencia de proyectos e imágenes. Exportar un 1.x suelto debe advertir que omite la escalera, la elevación y las otras plantas; no presentarlo como edificio completo.
4. **Alineación.** `offsetMm` y escala por planta requieren una comprobación visual de puntos homólogos y un aviso de incertidumbre. La diferencia de `scale.confidence` no hace imposible comparar milímetros nominales, pero impide tratarlos como medidas físicas igualmente confirmadas.

Estas condiciones son parte del gate 0; la elección D aún no constituye un schema aprobado.

### Recomendación: **opción D**, con desacuerdo explícito respecto a #48

Recomiendo D porque el flujo prioritario de D-01 suele partir de **una imagen o un PDF por planta, cada uno con su escala**. En D eso no exige tocar el contrato principal, y la protección frente a superposiciones silenciosas ya existe: el validador rechaza el contenedor. A es el modelo más limpio a largo plazo y conviene si la entrada típica es un IFC o DXF con todas las plantas en un mismo marco.

**Incertidumbres que Juanma debe valorar:**

1. Si la entrada habitual de sus clientes es una imagen por planta (favorece D) o un modelo único (favorece A).
2. Si en el futuro hace falta un objeto que cruce plantas, por ejemplo un hueco de doble altura o una cubierta. En D iría en el contenedor; en A, en el proyecto.
3. Si aceptar materiales duplicados por planta. Es visible para el usuario sólo al cambiar un acabado «de toda la casa».

Si Juanma prefiere A, las §3–§7 se reescriben con la escala por nivel. Las reglas de escalera, el fixture y los criterios se mantienen.

## 3. Propuesta D en detalle

### 3.1 Identidad, unidades y marco

- Documento `schema: "rubik-sota.floorplan-building"`, `schemaVersion: "1.0.0"`, `id: "bld_…"`, `name`, `createdAt`, `updatedAt` y `units: "mm"`.
- Prefijos nuevos `bld_`, `lvl_` y `str_`, con el mismo patrón de sufijo y la misma regla de no regenerar IDs que el contrato §2.
- **Marco del edificio:** el de la planta con `order` 0. Ejes, unidades y rotación son los del contrato §4.
- Cada nivel se traslada al marco del edificio con `offsetMm: {x, y}`, en mm enteros. **Sin rotación en este corte.**
- IDs internos: únicos dentro de su proyecto, como hoy. Cada `project.id` (`prj_`) es único en el edificio. Una referencia entre plantas se escribe `{levelId, id}`.

### 3.2 Niveles

```json
{"id":"lvl_ground","name":"Planta baja","order":0,"elevationMm":0,"slabThicknessMm":0,"offsetMm":{"x":0,"y":0},"project":{ /* FloorPlanProjectV1 1.x completo */ }}
```

- `order`: entero de 0 a 1 en este corte (dos plantas). Contiguo y único.
- `elevationMm`: nivel de suelo terminado en el marco del edificio. Estrictamente creciente con `order`.
- `slabThicknessMm`: espesor **visual** del forjado bajo esa planta, de 0 a 1000 mm. Es 0 en `order` 0. No tiene significado estructural.
- **Pertenencia:** muros, huecos, estancias, objetos y cotas pertenecen al proyecto del nivel que los contiene. Los huecos siguen ligados a su `wallId`, como hoy. Ningún campo de nivel se añade a `FloorPlanProjectV1`.
- **Altura:** cada muro conserva su `heightMm`. La altura libre disponible en el nivel n es `elevation[n+1] − slab[n+1] − elevation[n]`.

### 3.3 Forjado y escalera

- **Forjado del nivel n ≥ 1:** se **deriva**, no se persiste. Es la unión de los polígonos de estancia del nivel n, trasladados al marco del edificio, entre `elevation − slab` y `elevation`, menos los huecos de escalera.
- **Escalera recta:**

  ```json
  {"id":"str_main","kind":"straight","from":{"levelId":"lvl_ground"},"to":{"levelId":"lvl_upper"},"startMm":{"x":4200,"y":1200},"rotationDeg":90,"widthMm":900,"runLengthMm":3600,"risers":15}
  ```

  - `startMm`: arranque del primer peldaño, en el marco del edificio.
  - `rotationDeg`: sentido de subida, entero de 0 a 359, horario como en el contrato.
  - `risers`: entero de 2 a 40.
  - La altura de cada contrahuella, `(elevation[to] − elevation[from]) / risers`, **se muestra** pero **no se valida contra ninguna normativa**.
- **Hueco de escalera:** el rectángulo de la huella de la escalera en el nivel `to`. Se deriva y se resta del forjado.

### 3.4 Reglas semánticas

**Errores:**

- **B1:** el documento cumple el schema del contenedor y **cada `project` pasa `FloorPlanCore.validate` sin cambios**.
- **B2:** IDs `bld_`, `lvl_` y `str_` únicos; `project.id` únicos entre niveles.
- **B3:** `order` contiguo desde 0; `elevationMm` estrictamente creciente; 2 niveles como máximo en este corte.
- **B4:** la escalera une niveles con `order` contiguo, `from` inferior a `to`, con `widthMm` y `runLengthMm` > 0.
- **B5:** `offsetMm` y `startMm` en mm enteros dentro del rango del contrato §4 (±1 000 000).

**Avisos (no bloquean):**

- **BW1:** la huella de la escalera no cae dentro de una estancia del nivel `from` o del nivel `to`.
- **BW2:** un muro del nivel n supera la altura libre bajo el forjado del nivel n+1.
- **BW3:** las plantas tienen distinta `scale.confidence`; las distancias nominales en mm pueden calcularse, pero su confianza física difiere y se debe mostrar.
- **BW4:** un muro del nivel superior no tiene muro del nivel inferior a ≤ grosor/2 + 20 mm bajo él. Es **un aviso de coherencia visual, nunca un dictamen estructural**.

### 3.5 Migración reversible

- **1.x → edificio:** se envuelve el proyecto como nivel 0 con `elevationMm` 0 y `offsetMm` {0,0}. El proyecto queda **sin cambios semánticos**, y el original no se toca sin una acción del usuario.
- **Edificio de 1 nivel → 1.x:** se extrae el proyecto. Sin pérdida.
- **Edificio de 2 niveles → «exportar esta planta»:** se entrega el `project` del nivel, que sigue siendo un 1.x válido para todos los consumidores actuales. La escalera y la elevación no viajan, y se avisa de ello.

### 3.6 JSON y ZIP

- **JSON del edificio:** un único archivo canónico con los proyectos incrustados.
- **ZIP del edificio:** `building.json` más `images/`, con imágenes deduplicadas por `sha256` y un manifiesto por planta que vincule cada referencia e ID con sus bytes. Validar integridad, límites y colisiones antes de abrir. El ZIP de proyecto 1.x actual no cambia; la exportación de una planta incluye sus imágenes en el formato 1.x existente.
- Importar un JSON o ZIP detecta el `schema` y abre un proyecto o un edificio. Una versión de contenedor desconocida se rechaza sin modificar nada.

## 4. Impacto por consumidor

| Consumidor | En el primer corte | Fuera del primer corte |
| --- | --- | --- |
| Validador `FloorPlanCore` | **Sin cambios.** Se añade un validador de edificio que lo llama por planta. | — |
| Biblioteca local (`localStorage`, con las imágenes en IndexedDB) | Nueva clase de entrada «edificio». Abrir uno 1.x se comporta como hoy. | Sincronización |
| Editor 2D | Selector de planta; se edita el proyecto del nivel activo con el editor actual; la planta inferior aparece atenuada con su `offsetMm` como referencia; escalera con flecha de subida abajo y contorno del hueco arriba. Deshacer y rehacer registran el nivel. | Varias plantas a la vez |
| 3D | Niveles apilados por `elevationMm` y `offsetMm`, forjado derivado y «ver hasta planta N» como extensión del corte de muros. El recorrido libre se limita al nivel activo. | Subir la escalera caminando |
| Importación #38 | Sin cambios en su salida 1.x. Añadir planta desde imagen o PDF reutiliza el flujo guiado para el nivel nuevo. | IFC multiplanta como edificio |
| Variantes #30 | Una variante de edificio copia el contenedor entero, con `bld_` nuevo. | Variantes por planta |
| Presentación #39 | Opera sobre una planta elegida, con aviso «presentación de la planta X». El sidecar no cambia. | Recorrido entre plantas |
| Blender #24 y #42 | Exportan una planta elegida, con aviso. Un edificio nunca se aplana. | GLB del edificio completo |
| Revisión de distribución #27, W2 y W3 | Por planta. La escalera no entra en la revisión y se avisa. | Holgura junto a la escalera |
| MCP #31 en `master` y #40 → #41 → #43 en revisión | **Sin cambios.** Un edificio se rechaza con «no cumple FloorPlanProjectV1». Una planta exportada funciona. | Herramientas de lectura de edificio, tras cerrar la Etapa 1 |

## 5. Fixture sintético y criterios de aceptación

**Fixture `building-two-levels.example.json`** (asimétrico; no es un plano real):

- planta baja de 9 × 7 m, con calibración `real`;
- planta alta de 6 × 7 m, con `offsetMm` {3000, 0} y escala `estimated`, para activar BW3;
- `elevationMm` 3000 y `slabThicknessMm` 300;
- escalera recta de 15 peldaños, 900 × 3600 mm, contra un muro de la planta baja;
- una estancia de la planta alta en voladizo sin muro inferior, para activar BW4;
- un mueble en cada planta.

**Criterios:**

1. Todos los proyectos 1.x existentes y los ejemplos del contrato siguen pasando `FloorPlanCore.validate`. La regresión existente sigue pasando. **Ningún archivo 1.x cambia sin una acción del usuario.**
2. El fixture pasa B1–B5 y emite exactamente BW3 y BW4. Cinco documentos inválidos, uno por cada regla B, se rechazan con su ruta.
3. La ida y vuelta JSON y ZIP es semánticamente idéntica, con IDs estables tras 20 ediciones repartidas en ambas plantas.
4. Editar el nivel 1 no cambia el hash canónico del proyecto del nivel 0, y viceversa.
5. En 3D, la elevación de cada nivel es igual a `elevationMm` (±1 mm), el desplazamiento es igual a `offsetMm` (±1 mm) y el hueco es igual a la huella de la escalera (±1 mm).
6. La superficie por planta es igual a la suma de Gauss de sus estancias, y la total es igual a la suma de plantas.
7. Ningún consumidor aplana un edificio: cada uno lo rechaza o pide elegir una planta, con un mensaje en español. Hay una prueba por consumidor de la tabla §4.
8. «Exportar esta planta» produce un 1.x que pasa `FloorPlanCore.validate`, el exportador Blender y el MCP.
9. **Navegador**, a 1440×900, 390×844 y 844×390:
   - crear la segunda planta vacía y desde imagen;
   - colocar la escalera;
   - cambiar de planta con teclado y tacto;
   - 3D apilado;
   - exportar, importar y deshacer;
   - consola y `pageerror` limpios.
10. **GPU** en el PC de Juanma, con `gpu-check.cjs` representativo y la suite completa ([procedimiento](../qa/r10-gpu-regression.md)).
11. **Móvil físico:** al menos un Android de gama media y un iPhone. Con el fixture de dos plantas frente a una planta de superficie equivalente, la mediana de fotograma no supera 1,5 veces la de una planta y no hay pérdida de contexto WebGL. Es la primera línea base, porque la decisión 3 de Roadmap 2 sigue abierta.
12. **Accesibilidad:** selector de planta con nombre accesible, `aria-current`, foco visible y uso completo por teclado y tacto. El nivel activo se anuncia al cambiar.
13. CI se registra «no ejecutada» mientras Actions termine sin pasos.

## 6. Riesgos

- **Fidelidad:** plantas desalineadas por un `offsetMm` mal puesto, o escalas distintas entre plantas. Se mitiga con la planta inferior atenuada como referencia y con BW3 y BW4. Se comunica como propuesta, no como medición.
- **Rendimiento:** dos plantas duplican la geometría y las sombras. El forjado derivado añade triangulación. Hay que medirlo en un teléfono físico antes de ampliar a más niveles.
- **Accesibilidad:** el cambio de planta no puede depender sólo del color o de la posición. La planta atenuada debe mantener contraste suficiente para no confundirse con la activa.
- **Producto:** que el usuario lea «edificio» como modelo constructivo. Los textos y la exportación deben seguir diciendo «propuesta orientativa».
- **Alcance:** la tentación de añadir cubierta, exterior o recorrido entre plantas en el mismo corte. Quedan fuera explícitamente.

## 7. Decisión que se pide a Juanma

1. **Opción de contrato:** D (recomendada), A (la de #48, con escala por nivel) u otra.
2. **Alcance del primer corte:** dos plantas, escalera recta, editor 2D por planta, 3D apilado, intercambio y consumidores protegidos, sin recorrido entre plantas. Confirmar si «añadir planta desde imagen» entra en el primer corte.
3. Si **«exportar esta planta»** basta como compatibilidad con Blender, MCP y presentación en el primer corte.
4. Orden respecto al **MCP #40 → #41 → #43:** recomiendo no abrir la implementación hasta cerrar esa revisión, porque comparte el validador.
5. Si la **prueba de LoRA LAB** (anexo A de #48), sobre todo el JSON exportado de la villa, cambia algo de lo anterior.

Hasta esa decisión no se implementa nada. Si el gate se rechaza, la alternativa se propondrá desde Roadmap 2, sin rellenar con exterior, cubierta, CRM ni renders.

## Anexo B. Sonda reproducible

En la raíz del repositorio, en `5c822cf`:

```bash
node -e '
const Core=require("./js/project-core.js"),fs=require("fs");
const base=JSON.parse(fs.readFileSync("docs/contracts/examples/floorplan-project-v1.example.json","utf8"));
const run=(l,p)=>{try{Core.validate(p);console.log(l,"ACEPTADO")}catch(e){console.log(l,"RECHAZADO",e.message)}};
const a=structuredClone(base);a.schemaVersion="1.5.0";a.levels=[{id:"lvl_ground",elevationMm:0},{id:"lvl_upper",elevationMm:3000}];a.walls[0].levelId="lvl_upper";run("1.5.0+levels",a);
const b=structuredClone(base);b.schemaVersion="1.4.0";b.extensions={"x-levels":{levels:[]}};run("1.4.0+x-levels",b);
const c=structuredClone(base);c.schemaVersion="2.0.0";run("2.0.0",c);
run("contenedor",{schema:"rubik-sota.floorplan-building",schemaVersion:"1.0.0",levels:[{id:"lvl_ground",project:base}]});'
```

Salida obtenida:

```text
1.5.0+levels ACEPTADO
1.4.0+x-levels ACEPTADO
2.0.0 RECHAZADO /schemaVersion: unsupported version
contenedor RECHAZADO /: missing id
```
