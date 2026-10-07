# Rubik Floorplan MCP — primera entrega local

Servidor MCP local para consultar un archivo JSON exportado desde Rubik Sota. Esta primera entrega es deliberadamente de **solo lectura** y trabaja sobre un archivo explícito, no sobre la sesión abierta del editor.

## Requisitos y arranque

- Node.js 22.13 o posterior.
- Un JSON exportado desde Rubik que cumpla `FloorPlanProjectV1`.
- El cliente MCP ejecutará el proceso local por `stdio`; el servidor no abre un puerto ni hace conexiones de red.

Desde esta carpeta:

```sh
npm install
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
- `list_project_elements`: páginas de estancias, muros, huecos y muebles; permite filtrar por nombre/ID y estancia.
- `get_project_element`: consulta un elemento por ID.
- `review_layout`: reutiliza la geometría de la revisión de distribución de Rubik. La holgura es opcional y nunca se inventa un valor por defecto.

Cada herramienta declara anotaciones MCP de solo lectura. No hay herramientas para mover, crear, borrar, guardar o exportar. La superficie se calcula desde polígonos guardados y no es una medición certificada.

## Límites y privacidad

- El proceso solo puede leer el archivo indicado al arrancar. Ninguna herramienta recibe rutas.
- Rechaza enlaces simbólicos en el archivo final, JSON inválido, proyectos no válidos y archivos superiores a 15 MiB.
- Respuestas limitadas a 750 KiB; las consultas de elementos se paginan.
- La revisión MCP admite hasta 100 muebles para mantener acotado el coste geométrico. La app Rubik conserva su propio flujo de revisión.
- Las salidas usan listas blancas de campos. No exponen `sourceImages`, imágenes incrustadas, rutas locales ni el documento completo.
- Funciona con una copia exportada: no consulta cambios no exportados del editor, no modifica el archivo y no lo sube a ningún servicio.

## Pruebas

```sh
npm test
npm run check
```

Las pruebas comprueban validación, consultas y paginación, rechazo de symlinks, hash de la fuente, lectura sin mutaciones y reutilización de la revisión existente.
