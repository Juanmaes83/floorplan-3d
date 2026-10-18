# Rubik Floorplan MCP — consulta local de solo lectura

Servidor MCP local para consultar un archivo JSON exportado desde Rubik Sota. Esta primera entrega es deliberadamente de **solo lectura** y trabaja sobre un archivo explícito, no sobre la sesión abierta del editor.

## Requisitos y arranque

- Node.js 22.13 o posterior.
- Un JSON exportado desde Rubik. Si no cumple `FloorPlanProjectV1`, solo la herramienta de diagnóstico podrá explicar el primer bloqueo.
- El cliente MCP ejecutará el proceso local por `stdio`; el servidor no abre un puerto ni hace conexiones de red.

Desde esta carpeta:

```sh
npm ci
npm start -- --project /ruta/absoluta/al/proyecto.json
```

El mensaje de arranque y los errores se escriben por `stderr`; `stdout` queda reservado para el protocolo MCP.

Para Claude Code, registra el comando con las rutas absolutas de Node, `src/server.mjs` y del JSON:

```sh
claude mcp add --transport stdio rubik-floorplan -- node /ruta/al/repo/tools/rubik-mcp/src/server.mjs --project /ruta/al/proyecto.json
```

El servidor vuelve a leer ese mismo archivo en cada consulta. Si exportas el proyecto de nuevo sobre el mismo archivo, la siguiente llamada analizará el contenido nuevo. El hash SHA-256 de cada respuesta identifica exactamente el JSON leído. Para cambiar a otro archivo, detén y vuelve a iniciar el servidor.

## Herramientas

- `get_project_summary`: esquema, hash, escala, recuentos y superficie útil aproximada.
- `list_project_elements`: páginas de estancias, muros, huecos y muebles; permite filtrar por nombre/ID y estancia a partir de geometría.
- `get_project_element`: consulta un elemento por ID con la misma relación espacial.
- `review_layout`: reutiliza la geometría de la revisión de distribución de Rubik. La holgura es opcional y nunca se inventa un valor por defecto.
- `diagnose_project`: primer error del validador canónico o, si el JSON es válido, hallazgos agrupados de escala, procedencia, puertas incompletas y relaciones espaciales inciertas.
- `measure_elements`: distancia 2D determinista entre dos IDs, con modo explícito `reference_points` o `regions`, puntos justificativos, unidades y hash.

Cada herramienta declara anotaciones MCP de solo lectura. No hay herramientas para mover, crear, borrar, guardar o exportar. La superficie se calcula desde polígonos guardados y no es una medición certificada.

### Relación por estancia (v0.1.1, primer corte de Etapa 1)

Cada elemento de `list_project_elements` y `get_project_element` añade `relation`:

```json
{
  "roomIds": ["rom_rect", "rom_next"],
  "status": "shared",
  "method": "wall_strip_polygon_contact",
  "evidence": [
    { "roomId": "rom_rect", "overlapAreaMm2": 0, "contactLengthMm": 4000 },
    { "roomId": "rom_next", "overlapAreaMm2": 0, "contactLengthMm": 4000 }
  ]
}
```

El ejemplo procede del muro compartido del fixture sintético `fixtures/spatial-project.cjs`. `roomIds` se deriva de los polígonos de estancias y de la huella girada del mueble, la banda del muro o el subtramo del hueco. En un mueble que traiga `roomId` guardado se conserva ese campo anterior y `relation.storedRoomId` lo identifica expresamente; una discrepancia no cambia el JSON ni fuerza la atribución. Los estados son `unique` (una estancia sustentada), `shared` (muro/hueco con varias), `ambiguous` (mueble que cruza, toca solo un límite, queda parcialmente fuera o contradice su campo guardado) y `unattributed` (ninguna). `reason` explica la incertidumbre cuando procede. Áreas en mm², longitudes y coordenadas en mm.

El filtro `roomId` de `list_project_elements` devuelve una estancia solo cuando coincide con **su propio ID**. Para muebles, muros y huecos, incluye los que tengan ese ID en `relation.roomIds`; un elemento compartido o ambiguo aparece en todas las estancias implicadas con el mismo ID original. Un ID inexistente devuelve `total:0`. Búsqueda y estancia se combinan antes de `offset`/`limit`; el máximo sigue en 100 elementos por página y la respuesta en 750 KiB. No se usa solo el centro del mueble ni se atribuye un hueco por todo el muro si su subtramo no llega a esa estancia.

Las reglas, tolerancias numéricas y límites están en [relaciones espaciales](../../docs/technical/local-mcp-spatial-relations.md).

### Diagnóstico y medidas (v0.1.2, segundo corte de Etapa 1)

```text
diagnose_project({})
measure_elements({"idA":"obj_rect","idB":"obj_next","mode":"reference_points"})
measure_elements({"idA":"obj_rect","idB":"obj_next","mode":"regions"})
```

El diagnóstico permite arrancar con JSON mal formado o contrato inválido para mostrar **un único error canónico**, su categoría y qué verificaciones no se ejecutaron. No acepta ese archivo para las otras herramientas. En un proyecto válido añade hallazgos independientes con severidad, ID, regla y evidencia; `estimated`/`pending` es un aviso informativo, no un defecto del contrato. La salida acota a 100 los hallazgos visibles e indica si hubo truncamiento.

`reference_points` usa el centro guardado de cada mueble o el punto medio del eje de cada muro/hueco. No ofrece centro de estancia. `regions` mide la mínima distancia euclídea entre huellas giradas, bandas de muros, subtramos de huecos y polígonos de estancias; contacto o solape da 0 mm. Ambas salidas incluyen `pointA`, `pointB`, `units:mm`, `plane:2d`, `scaleConfidence`, estado de relación por estancia y SHA-256 del archivo. Si la relación espacial es ambigua, la medida geométrica sigue visible con `status:spatial_relation_uncertain`. IDs ausentes, geometría degenerada y combinaciones no soportadas dan error explícito. Ningún modo calcula holgura transitable, altura ni 3D.

La [semántica completa, ejemplos y límites](../../docs/technical/local-mcp-diagnostics-measures.md) dejan definido el tercer corte de Etapa 1: holguras con muros, huecos, empotramientos y conectividad.

## Límites y privacidad

- El proceso solo puede leer el archivo indicado al arrancar. Ninguna herramienta recibe rutas.
- Rechaza enlaces simbólicos en el archivo final y archivos superiores a 15 MiB. Un JSON inválido solo puede diagnosticarse; las consultas ordinarias lo rechazan.
- Respuestas limitadas a 750 KiB; las consultas de elementos se paginan.
- La revisión MCP admite hasta 100 muebles para mantener acotado el coste geométrico. La app Rubik conserva su propio flujo de revisión.
- Las salidas usan listas blancas de campos. No exponen `sourceImages`, imágenes incrustadas, rutas locales ni el documento completo.
- Funciona con una copia exportada: no consulta cambios no exportados del editor, no modifica el archivo y no lo sube a ningún servicio.

## Pruebas

```sh
npm test
npm run check
```

Las pruebas comprueban validación, consultas y paginación, relaciones espaciales sintéticas, rechazo de symlinks, hash de la fuente, lectura sin mutaciones y reutilización de la revisión existente. En Windows sin privilegio de creación de symlinks se omite únicamente ese caso de seguridad; sigue ejecutándose en Linux CI. El rechazo de JSON inválido se comprueba por separado.

El `package-lock.json` fija las dependencias de esta entrega. Se actualizó el SDK MCP a `1.32.1` tras detectar la alerta [GHSA-6qxp-vccf-f47h](https://github.com/advisories/GHSA-6qxp-vccf-f47h) en la versión anterior; el servidor usa stdio y no el cliente OAuth afectado. `npm audit` queda sin vulnerabilidades reportadas para el lock actual.
